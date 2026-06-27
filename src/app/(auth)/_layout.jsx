import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/theme";

export default function AuthLayout() {
  const { isSignedIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isSignedIn) return;

    // User just signed in — navigate to their workspace
    const role = user?.role?.toLowerCase();
    if (role === ROLES.STAFF.toLowerCase()) {
      router.replace("/(staff)/dashboard");
    } else if (role === ROLES.RIDER.toLowerCase()) {
      router.replace("/(rider)/queue");
    }
  }, [isSignedIn, isLoading, user?.role]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="user-type" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}