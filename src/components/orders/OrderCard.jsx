import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, SPACING, RADIUS } from "@constants/theme";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order, onPress, variant = "light" }) {
  const isDark = variant === "dark";

  const itemCount = order.items?.length ?? 0;
  const itemSummary =
    itemCount === 0
      ? "No items"
      : order.items
        .slice(0, 2)
        .map((i) => `${i.foodItemName || i.name || "Item"} (${i.quantity})`)
        .join(", ") + (itemCount > 2 ? ` +${itemCount - 2} more` : "");

  const timeAgo = formatTimeAgo(order.createdAt);

  const textPrimary = isDark ? COLORS.white : COLORS.lightText;
  const textMuted = isDark ? "#9CA3AF" : COLORS.lightTextMuted;
  const cardBg = isDark ? COLORS.stone : COLORS.white;
  const borderColor = isDark ? COLORS.border : COLORS.lightBorder;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: 1,
          shadowColor: isDark ? "transparent" : "#000",
          shadowOpacity: isDark ? 0 : 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: isDark ? 0 : 3,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderId, { color: textPrimary }]}>
            #{String(order._id || order.id).slice(-4).toUpperCase()}
          </Text>
          <Text style={[styles.timeAgo, { color: textMuted }]}>{timeAgo}</Text>
        </View>
        <StatusBadge status={order.statusState || order.status} size="sm" />
      </View>

      <Text style={[styles.customerName, { color: textPrimary }]}>
        {order.customerName || "Web Customer"}
      </Text>

      <View style={styles.itemsContainer}>
        <Text style={[styles.items, { color: textMuted }]} numberOfLines={1}>
          {itemSummary}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.address, { color: textMuted }]} numberOfLines={1}>
          📍 {order.deliveryAddress || (order.tableNumber ? `Table ${order.tableNumber}` : "In-Kitchen")}
        </Text>
        <Text style={styles.price}>
          GHS {Number(order.totalAmount || order.totalPrice || 0).toFixed(2)}
        </Text>
      </View>

      <View style={[styles.accentBar, { backgroundColor: getAccentColor(order.statusState || order.status) }]} />
    </TouchableOpacity>
  );
}

function getAccentColor(status) {
  const map = {
    "Pending": COLORS.pending,
    "Preparing": COLORS.preparing,
    "Ready for Dispatch": COLORS.ready,
    "Out for Delivery": COLORS.delivery,
    "Delivered": COLORS.delivered,
  };
  return map[status] ?? COLORS.muted;
}

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS["2xl"], padding: SPACING["2xl"], marginBottom: SPACING.md, overflow: "hidden", position: "relative" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  orderId: { fontSize: FONT_SIZES.sm, fontWeight: "700", letterSpacing: 1 },
  timeAgo: { fontSize: FONT_SIZES.xs },
  customerName: { fontSize: FONT_SIZES.md, fontWeight: "700", marginBottom: SPACING.xs },
  itemsContainer: { marginBottom: SPACING.md },
  items: { fontSize: FONT_SIZES.sm },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  address: { fontSize: FONT_SIZES.xs, flex: 1, marginRight: SPACING.sm },
  price: { fontSize: FONT_SIZES.base, fontWeight: "700", color: COLORS.red },
  accentBar: { position: "absolute", left: 0, top: SPACING.lg, bottom: SPACING.lg, width: 4, borderRadius: RADIUS.full },
});