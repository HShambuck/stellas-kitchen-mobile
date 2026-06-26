import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../context/AuthContext";
import { COLORS, ROLES } from "../constants/theme";

export default function Index() {
  const { isLoading, isSignedIn, user } = useAuth();
  const [hasRegistered, setHasRegistered] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync("has_registered").then((val) => setHasRegistered(!!val));
  }, []);

  if (isLoading || hasRegistered === null) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.red} size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={hasRegistered ? "/(auth)/login" : "/(auth)/user-type"} />;
  }

  if (user?.role?.toLowerCase() === ROLES.STAFF) {
    return <Redirect href="/(staff)/dashboard" />;
  }

  if (user?.role?.toLowerCase() === ROLES.RIDER) {
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