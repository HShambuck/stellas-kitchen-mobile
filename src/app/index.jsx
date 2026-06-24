import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { COLORS, ROLES } from "../constants/theme";

/**
 * index.jsx — Landing switch
 * AuthContext handles routing via useEffect, so this screen is brief.
 * We show a branded loading state while the session is being restored.
 */
export default function Index() {
  const { isLoading, isSignedIn, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.red} size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/user-type" />;
  }

  if (user?.role === ROLES.STAFF) {
    return <Redirect href="/(staff)/dashboard" />;
  }

  if (user?.role === ROLES.RIDER) {
    return <Redirect href="/(rider)/queue" />;
  }

  return <Redirect href="/(auth)/user-type" />;
}

const styles = StyleSheet.create({
  splash: {
    flex:            1,
    backgroundColor: COLORS.dark,
    alignItems:      "center",
    justifyContent:  "center",
  },
});
