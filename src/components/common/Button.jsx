import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { COLORS, RADIUS, FONT_SIZES, SPACING } from "../../constants/theme";

/**
 * Button
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   variant    "primary" | "secondary" | "ghost" | "danger"
 *   size       "sm" | "md" | "lg"
 *   label      string
 *   onPress    function
 *   loading    boolean
 *   disabled   boolean
 *   icon       React element placed before the label
 *   fullWidth  boolean (default true)
 *   style      ViewStyle override
 */
export default function Button({
  variant   = "primary",
  size      = "md",
  label,
  onPress,
  loading   = false,
  disabled  = false,
  icon,
  fullWidth = true,
  style,
  labelStyle,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    fullWidth   && styles.fullWidth,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${size}`],
    styles[`labelColor_${variant}`],
    isDisabled && styles.labelDisabled,
    labelStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger"
            ? COLORS.white
            : COLORS.red}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    alignItems:   "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: { width: "100%" },

  // Sizes
  size_sm: { paddingVertical: SPACING.sm,   paddingHorizontal: SPACING.lg   },
  size_md: { paddingVertical: SPACING.md,   paddingHorizontal: SPACING["2xl"] },
  size_lg: { paddingVertical: SPACING.lg,   paddingHorizontal: SPACING["3xl"] },

  // Variants
  variant_primary:   { backgroundColor: COLORS.red },
  variant_secondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  variant_ghost: { backgroundColor: "transparent" },
  variant_danger: { backgroundColor: "#DC2626" },

  // Labels
  label: { fontWeight: "700", letterSpacing: 0.2 },
  label_sm:   { fontSize: FONT_SIZES.sm  },
  label_md:   { fontSize: FONT_SIZES.base },
  label_lg:   { fontSize: FONT_SIZES.md  },

  labelColor_primary:   { color: COLORS.white },
  labelColor_secondary: { color: COLORS.red   },
  labelColor_ghost:     { color: COLORS.warm  },
  labelColor_danger:    { color: COLORS.white },

  disabled:      { opacity: 0.45 },
  labelDisabled: {},

  inner:    { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  iconWrap: { marginRight: 2 },
});
