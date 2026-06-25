import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/theme";

/**
 * SafeView
 * Edge-to-edge wrapper using physical insets so nothing clips into OS chrome.
 *
 * variant   "dark" | "light" | "white" | "transparent"
 * edges     Array of sides to pad. Default: all four.
 * style     Extra styles on the container.
 */
export default function SafeView({
  children,
  variant = "light",
  edges = ["top", "bottom", "left", "right"],
  style,
}) {
  const insets = useSafeAreaInsets();

  const backgroundColor = {
    dark: COLORS.dark,
    light: COLORS.cream,
    white: COLORS.white,
    transparent: "transparent",
  }[variant] ?? COLORS.cream;

  const statusBarStyle =
    variant === "dark" ? "light-content" : "dark-content";

  // Only apply inset padding to the requested edges
  const insetPadding = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    // Bottom inset handled via minPaddingBottom so tab bars can override it
    paddingBottom: edges.includes("bottom") ? Math.max(insets.bottom, 0) : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor }, insetPadding, style]}>
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
  root: { flex: 1 },
});