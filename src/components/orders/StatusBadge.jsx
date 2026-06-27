import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, SPACING, RADIUS, ORDER_STATUS, ORDER_STATUS_LABELS  } from "../../constants/theme";


const STATUS_STYLE = {
  [ORDER_STATUS.PENDING]: {
    bg:   COLORS.pendingBg,
    text: "#92400E",
    dot:  COLORS.pending,
  },
  [ORDER_STATUS.PREPARING]: {
    bg:   COLORS.preparingBg,
    text: "#1E40AF",
    dot:  COLORS.preparing,
  },
  [ORDER_STATUS.READY_FOR_PICKUP]: {
    bg:   COLORS.readyBg,
    text: "#5B21B6",
    dot:  COLORS.ready,
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    bg:   COLORS.deliveryBg,
    text: "#9A3412",
    dot:  COLORS.delivery,
  },
  [ORDER_STATUS.DELIVERED]: {
    bg:   COLORS.deliveredBg,
    text: "#14532D",
    dot:  COLORS.delivered,
  },
  [ORDER_STATUS.CANCELLED]: {
    bg:   COLORS.cancelledBg,
    text: "#991B1B",
    dot:  COLORS.cancelled,
  },
};

/**
 * StatusBadge
 * Props:
 *   status   one of ORDER_STATUS values
 *   size     "sm" | "md"
 */
export default function StatusBadge({ status, size = "md" }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE[ORDER_STATUS.PENDING];
  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <View style={[
      styles.badge,
      { backgroundColor: style.bg },
      size === "sm" && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: style.dot }]} />
      <Text style={[
        styles.text,
        { color: style.text },
        size === "sm" && styles.textSm,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingVertical:   SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius:   RADIUS.full,
    alignSelf:      "flex-start",
    gap:            SPACING.xs,
  },
  badgeSm: {
    paddingVertical:   2,
    paddingHorizontal: SPACING.sm,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  text: {
    fontSize:   FONT_SIZES.sm,
    fontWeight: "600",
  },
  textSm: {
    fontSize: FONT_SIZES.xs,
  },
});
