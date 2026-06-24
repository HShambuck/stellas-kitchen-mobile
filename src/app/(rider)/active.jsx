import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import SafeView from "../../components/common/SafeView";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/orders/StatusBadge";
import { getMyActiveDelivery, updateOrderStatus } from "../../api/orders";
import { COLORS, FONT_SIZES, SPACING, RADIUS, ORDER_STATUS } from "../../constants/theme";

function StepIndicator({ steps, currentStatus }) {
  return (
    <View style={stepStyles.wrap}>
      {steps.map((step, i) => {
        const stepStatuses = step.statuses;
        const isDone    = steps.slice(0, i).some((s) => s.statuses.includes(currentStatus))
                       || stepStatuses.includes(currentStatus);
        const isActive  = stepStatuses.includes(currentStatus);
        return (
          <View key={i} style={stepStyles.row}>
            <View style={stepStyles.left}>
              <View style={[
                stepStyles.dot,
                isDone  && stepStyles.dotDone,
                isActive && stepStyles.dotActive,
              ]}>
                <Text style={stepStyles.dotText}>{isDone ? "✓" : i + 1}</Text>
              </View>
              {i < steps.length - 1 && (
                <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />
              )}
            </View>
            <View style={stepStyles.info}>
              <Text style={[stepStyles.stepLabel, isActive && stepStyles.stepLabelActive]}>
                {step.label}
              </Text>
              {isActive && (
                <Text style={stepStyles.stepSubLabel}>{step.desc}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DELIVERY_STEPS = [
  { label: "Ready for Pickup",  statuses: [ORDER_STATUS.READY_FOR_PICKUP], desc: "Head to Stella's Kitchen" },
  { label: "Out for Delivery",  statuses: [ORDER_STATUS.OUT_FOR_DELIVERY], desc: "On your way to the customer" },
  { label: "Delivered",         statuses: [ORDER_STATUS.DELIVERED],        desc: "Order complete!" },
];

export default function ActiveDelivery() {
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating,   setUpdating]   = useState(false);

  const fetchActive = useCallback(async () => {
    try {
      const data = await getMyActiveDelivery();
      setOrder(data || null);
    } catch { setOrder(null); }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 20_000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const handleUpdateStatus = async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      await fetchActive();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const nextAction = order
    ? order.status === ORDER_STATUS.READY_FOR_PICKUP
      ? { label: "Start Delivery",     status: ORDER_STATUS.OUT_FOR_DELIVERY }
      : order.status === ORDER_STATUS.OUT_FOR_DELIVERY
      ? { label: "Mark as Delivered",  status: ORDER_STATUS.DELIVERED       }
      : null
    : null;

  const openMaps = () => {
    if (!order?.deliveryAddress) return;
    const encoded = encodeURIComponent(order.deliveryAddress + ", Shai Hills, Ghana");
    Linking.openURL(`https://maps.google.com/?q=${encoded}`);
  };

  return (
    <SafeView variant="dark">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchActive(); }}
            tintColor={COLORS.red}
          />
        }
      >
        <Text style={styles.title}>Active Delivery</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.red} size="large" />
          </View>
        ) : !order ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>No active delivery</Text>
            <Text style={styles.emptyBody}>Accept an order from the Queue tab</Text>
          </View>
        ) : (
          <>
            {/* Order headline */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>
                  #{String(order.id).slice(-5).toUpperCase()}
                </Text>
                <StatusBadge status={order.status} />
              </View>
              <Text style={styles.customerName}>{order.customerName}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Drop-off</Text>
                <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>💰 Amount</Text>
                <Text style={[styles.infoValue, { color: COLORS.red, fontWeight: "800" }]}>
                  GHS {Number(order.totalPrice).toFixed(2)}
                </Text>
              </View>

              {/* Open in maps */}
              <Button
                variant="secondary"
                label="Open in Maps"
                onPress={openMaps}
                size="sm"
                style={{ marginTop: SPACING.lg }}
              />
            </View>

            {/* Step tracker */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Delivery Progress</Text>
              <StepIndicator steps={DELIVERY_STEPS} currentStatus={order.status} />
            </View>

            {/* Items */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Order Items</Text>
              {(order.items || []).map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>GHS {item.price * item.quantity}</Text>
                </View>
              ))}
            </View>

            {/* Action button */}
            {nextAction && (
              <Button
                label={nextAction.label}
                onPress={() => handleUpdateStatus(nextAction.status)}
                loading={updating}
                size="lg"
                style={{ marginTop: SPACING.md }}
              />
            )}

            {order.status === ORDER_STATUS.DELIVERED && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedText}>🎉 Delivery Complete!</Text>
                <Text style={styles.completedSub}>Great work. Check the Queue for more.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["4xl"] },
  title: {
    color: COLORS.white, fontSize: FONT_SIZES.xl,
    fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING.xl,
  },
  loading: { paddingVertical: SPACING["4xl"], alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon:  { fontSize: 52, marginBottom: SPACING.lg },
  emptyTitle: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody:  { color: "#6B7280", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },

  card: {
    backgroundColor: COLORS.stone,
    borderRadius:    RADIUS["2xl"],
    padding:         SPACING["2xl"],
    marginBottom:    SPACING.lg,
    borderWidth:     1, borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: SPACING.sm,
  },
  orderId:      { color: "#9CA3AF", fontSize: FONT_SIZES.sm, fontWeight: "700", letterSpacing: 1 },
  customerName: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.lg },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },
  infoValue: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },

  cardSectionTitle: {
    color: COLORS.white, fontSize: FONT_SIZES.base,
    fontWeight: "700", marginBottom: SPACING.xl,
  },
  itemRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SPACING.xs, gap: SPACING.sm,
  },
  itemQty:   { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName:  { color: COLORS.white, flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },

  completedBanner: {
    backgroundColor: "#14532D",
    borderRadius: RADIUS["2xl"],
    padding: SPACING["2xl"],
    alignItems: "center",
    borderWidth: 1, borderColor: "#166534",
    marginTop: SPACING.md,
  },
  completedText: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800" },
  completedSub:  { color: "#86EFAC", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
});

// ─── Step Indicator Styles ────────────────────────────────────────────────────
const stepStyles = StyleSheet.create({
  wrap: { gap: 0 },
  row:  { flexDirection: "row", alignItems: "flex-start" },
  left: { alignItems: "center", width: 32, marginRight: SPACING.lg },
  dot: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
  dotDone:   { backgroundColor: COLORS.delivered },
  dotActive: { backgroundColor: COLORS.red },
  dotText:   { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  line: {
    width:  2,
    flex:   1,
    minHeight: 24,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineDone:         { backgroundColor: COLORS.delivered },
  info:             { flex: 1, paddingBottom: SPACING.lg },
  stepLabel:        { color: "#6B7280", fontSize: FONT_SIZES.base, fontWeight: "600" },
  stepLabelActive:  { color: COLORS.white },
  stepSubLabel:     { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
});
