import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../context/AuthContext";
import { COLORS, ROLES } from "../constants/theme";

export default function Index() {
  const { isLoading, isSignedIn, user } = useAuth();
  const [hasRegistered,  setHasRegistered]  = useState(null);
  const [navReady,       setNavReady]       = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("has_registered")
      .then((val) => setHasRegistered(!!val))
      .catch(()   => setHasRegistered(false));
  }, []);

  // Give the navigator 150ms to fully mount before any Redirect fires
  useEffect(() => {
    const t = setTimeout(() => setNavReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Wait for auth, storage check, AND navigator to be ready
  if (isLoading || hasRegistered === null || !navReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.red} size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={hasRegistered ? "/(auth)/login" : "/(auth)/user-type"} />;
  }

  if (user?.role?.toLowerCase() === ROLES.STAFF?.toLowerCase()) {
    return <Redirect href="/(staff)/dashboard" />;
  }

  if (user?.role?.toLowerCase() === ROLES.RIDER?.toLowerCase()) {
    return <Redirect href="/(rider)/queue" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex:            1,
    backgroundColor: COLORS.dark,
    alignItems:      "center",
    justifyContent:  "center",
  },
});