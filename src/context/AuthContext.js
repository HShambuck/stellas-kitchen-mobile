import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, register as apiRegister, getProfile } from "../api/auth";
import { ROLES } from "@constants/theme";

// ─── Secure Storage Keys ──────────────────────────────────────────────────────
const KEYS = {
  TOKEN:   "auth_token",
  USER:    "auth_user",
};

// ─── State Shape ──────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  user:        null,    // { id, name, email, role, vehicleType?, locationToken? }
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

    if (!state.isSignedIn) {
      router.replace("/(auth)/user-type");
      return;
    }

    if (state.user?.role === ROLES.STAFF) {
      router.replace("/(staff)/dashboard");
    } else if (state.user?.role === ROLES.RIDER) {
      router.replace("/(rider)/queue");
    } else {
      // Unknown role — send back to auth
      router.replace("/(auth)/login");
    }
  }, [state.isLoading, state.isSignedIn, state.user?.role]);

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

  // ── Login ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const { user, token } = await apiLogin(email, password);
      await persistSession(token, user);
      dispatch({ type: "SIGN_IN", user, token });
      // Routing is handled by the useEffect above
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err.message });
      throw err; // re-throw so the form can catch it too
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async (payload) => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const { user, token } = await apiRegister(payload);
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
