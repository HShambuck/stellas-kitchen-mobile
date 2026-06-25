import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@constants/theme";

/**
 * SafeView
 * ─────────────────────────────────────────────────────────────────────────────
 * High-fidelity edge-to-edge wrapper that maps physical insets (notch, punch
 * hole, home indicator, nav bar) into structural padding — so no content ever
 * clips into OS chrome.
 *
 * Props:
 *   variant   "dark" | "light" | "transparent"
 *             Controls the status-bar tint and background fill.
 *   edges     Subset of ["top","bottom","left","right"] to apply. Default: all.
 *   style     Additional styles merged onto the outer container.
 *   children
 */
export default function SafeView({
  children,
  variant  = "light",
  edges    = ["top", "bottom", "left", "right"],
  style,
}) {
  const insets = useSafeAreaInsets();

  const backgroundColor = {
    dark:        COLORS.dark,
    light:       COLORS.cream,
    transparent: "transparent",
    white:       COLORS.white,
  }[variant] ?? COLORS.cream;

  const statusBarStyle =
    variant === "dark" ? "light-content" : "dark-content";

  const padding = {
    paddingTop:    edges.includes("top")    ? insets.top    : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft:   edges.includes("left")   ? insets.left   : 0,
    paddingRight:  edges.includes("right")  ? insets.right  : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor }, padding, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
