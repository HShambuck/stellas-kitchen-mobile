import { ROLES } from "@constants/theme";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

// ─── Secure Storage Keys ──────────────────────────────────────────────────────
const KEYS = {
  TOKEN:   "auth_token",
  USER:    "auth_user",
};

// ─── State Shape ──────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  user:        null,    // { id, name, phoneNumber, role, vehicleType?, locationToken? }
  token:       null,
  isLoading:   true,    // true while we check SecureStore on cold start
  isSignedIn:  false,
  error:       null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "RESTORE_SESSION":
      return {
        ...state,
        user:       action.user,
        token:      action.token,
        isSignedIn: !!action.token,
        isLoading:  false,
      };
    case "SIGN_IN":
      return {
        ...state,
        user:       action.user,
        token:      action.token,
        isSignedIn: true,
        isLoading:  false,
        error:      null,
      };
    case "SIGN_OUT":
      return {
        ...INITIAL_STATE,
        isLoading: false,
      };
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

  // ── Cold-start: restore persisted session ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          SecureStore.getItemAsync(KEYS.TOKEN),
          SecureStore.getItemAsync(KEYS.USER),
        ]);

        if (token && userJson) {
          const user = JSON.parse(userJson);
          dispatch({ type: "RESTORE_SESSION", user, token });
        } else {
          dispatch({ type: "RESTORE_SESSION", user: null, token: null });
        }
      } catch {
        // Corrupted store — treat as signed-out
        dispatch({ type: "RESTORE_SESSION", user: null, token: null });
      }
    })();
  }, []);

  // ── Route after session is known ──────────────────────────────────────────
  useEffect(() => {
    if (state.isLoading) return;

    // 💡 Add this protection block: If there is an active error from a failed 
    // login or registration attempt, do not forcefully kick the user out of their current screen!
    if (state.error) return; 

    if (!state.isSignedIn) {
      router.replace("/(auth)/user-type");
      return;
    }

    // Convert the role string safely to lowercase before running validation comparisons
    const currentRole = state.user?.role?.toLowerCase();

    // Now matching against 'staff' and 'rider' constants will succeed flawlessly
if (currentRole === "staff" || currentRole === ROLES.STAFF?.toLowerCase()) {
      router.replace("/(staff)/dashboard");
    } else if (currentRole === "rider" || currentRole === ROLES.RIDER?.toLowerCase()) {
      router.replace("/(rider)/queue");
    } else {
      // Catch-all safety loop
      console.log("Routing failed. Logged role payload string was:", state.user?.role);
      router.replace("/(auth)/login");
    }
  }, [state.isLoading, state.isSignedIn, state.user?.role, state.error]); 

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistSession = async (token, user) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.TOKEN, token),
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
    ]);
  };

  const clearSession = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async (payload) => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      // 💡 Change this line: The backend returns the user object directly, 
      // with the token nested inside it.
      const responseData = await apiRegister(payload);
      const token = responseData.token;
      const { token: _drop, ...user } = responseData; // The whole object contains _id, name, role, etc.

      await persistSession(token, user);
      dispatch({ type: "SIGN_IN", user, token });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err.message });
      throw err;
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (phoneNumber, password, role) => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      // 💡 Do the exact same thing for login to stay unified
      const responseData = await apiLogin(phoneNumber, password, role);
      const token = responseData.token;
      const { token: _drop, ...user } = responseData;

      await persistSession(token, user);
      dispatch({ type: "SIGN_IN", user, token });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err.message });
      throw err; 
    }
  }, []);
  
  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await clearSession();
    dispatch({ type: "SIGN_OUT" });
    router.replace("/(auth)/user-type");
  }, []);

  // ── Clear error ───────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user:       state.user,
        token:      state.token,
        isLoading:  state.isLoading,
        isSignedIn: state.isSignedIn,
        error:      state.error,
        signIn,
        signUp,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
