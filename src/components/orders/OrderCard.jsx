import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZES, SPACING, RADIUS } from "@constants/theme";
import StatusBadge from "./StatusBadge";

/**
 * OrderCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Compact card for displaying a single order in a list.
 *
 * Props:
 *   order      { id, customerName, items[], totalPrice, status, createdAt, deliveryAddress }
 *   onPress    () => void  — tap to open detail / actions
 *   variant    "light" | "dark"  — surface theme
 */
export default function OrderCard({ order, onPress, variant = "light" }) {
  const isDark = variant === "dark";
  const itemCount = order.items?.length ?? 0;
  const itemSummary =
    itemCount === 0
      ? "No items"
      : order.items
          .slice(0, 2)
          .map((i) => `${i.quantity}× ${i.name}`)
          .join(", ") + (itemCount > 2 ? ` +${itemCount - 2} more` : "");

  const timeAgo = formatTimeAgo(order.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
      ]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderId, isDark && styles.textWhite]}>
            #{String(order.id).slice(-5).toUpperCase()}
          </Text>
          <Text style={[styles.timeAgo, isDark && styles.textMuted]}>
            {timeAgo}
          </Text>
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>

      {/* Customer */}
      <Text style={[styles.customerName, isDark && styles.textWhite]}>
        {order.customerName}
      </Text>

      {/* Items summary */}
      <Text
        style={[styles.items, isDark && styles.textMuted]}
        numberOfLines={1}
      >
        {itemSummary}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.address, isDark && styles.textMuted]} numberOfLines={1}>
          📍 {order.deliveryAddress || "No address"}
        </Text>
        <Text style={styles.price}>
          GHS {Number(order.totalPrice).toFixed(2)}
        </Text>
      </View>

      {/* Accent left bar */}
      <View style={[styles.accentBar, { backgroundColor: getAccentColor(order.status) }]} />
    </TouchableOpacity>
  );
}

function getAccentColor(status) {
  const map = {
    PENDING:          COLORS.pending,
    PREPARING:        COLORS.preparing,
    READY_FOR_PICKUP: COLORS.ready,
    OUT_FOR_DELIVERY: COLORS.delivery,
    DELIVERED:        COLORS.delivered,
    CANCELLED:        COLORS.cancelled,
  };
  return map[status] ?? COLORS.muted;
}

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius:    RADIUS["2xl"],
    padding:         SPACING["2xl"],
    marginBottom:    SPACING.md,
    overflow:        "hidden",
    position:        "relative",
  },
  cardLight: {
    backgroundColor: COLORS.white,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  cardDark: {
    backgroundColor: COLORS.stone,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },

  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   SPACING.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           SPACING.sm,
  },
  orderId: {
    fontSize:   FONT_SIZES.sm,
    fontWeight: "700",
    color:      COLORS.dark,
    letterSpacing: 1,
  },
  timeAgo: {
    fontSize: FONT_SIZES.xs,
    color:    COLORS.muted,
  },

  customerName: {
    fontSize:     FONT_SIZES.md,
    fontWeight:   "700",
    color:        COLORS.dark,
    marginBottom: SPACING.xs,
  },
  items: {
    fontSize:     FONT_SIZES.sm,
    color:        COLORS.muted,
    marginBottom: SPACING.md,
  },

  footer: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  address: {
    fontSize: FONT_SIZES.xs,
    color:    COLORS.muted,
    flex:     1,
    marginRight: SPACING.sm,
  },
  price: {
    fontSize:   FONT_SIZES.base,
    fontWeight: "700",
    color:      COLORS.red,
  },

  // Left accent bar
  accentBar: {
    position: "absolute",
    left:     0,
    top:      SPACING.lg,
    bottom:   SPACING.lg,
    width:    4,
    borderRadius: RADIUS.full,
  },

  // Dark variant text helpers
  textWhite: { color: COLORS.white },
  textMuted: { color: "#9CA3AF"    },
});
