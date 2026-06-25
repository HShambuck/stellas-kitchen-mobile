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
  TouchableOpacity,
} from "react-native";
import SafeView from "../../components/common/SafeView";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/orders/StatusBadge";
import { getMyActiveDelivery, updateOrderStatus } from "../../api/orders"; // Ensure getMyActiveDelivery calls /api/riders/my-deliveries
import { COLORS, FONT_SIZES, SPACING, RADIUS } from "../../constants/theme";

// Mapping status enums cleanly to presentation labels
const ORDER_STATUS = {
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

function StepIndicator({ steps, currentStatus }) {
  return (
    <View style={stepStyles.wrap}>
      {steps.map((step, i) => {
        const stepStatuses = step.statuses;
        const isDone = steps.slice(0, i).some((s) => s.statuses.includes(currentStatus)) || stepStatuses.includes(currentStatus);
        const isActive = stepStatuses.includes(currentStatus);
        return (
          <View key={i} style={stepStyles.row}>
            <View style={stepStyles.left}>
              <View style={[
                stepStyles.dot,
                isDone && stepStyles.dotDone,
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
  { label: "Out for Delivery", statuses: [ORDER_STATUS.OUT_FOR_DELIVERY], desc: "On your way to the customer" },
  { label: "Delivered", statuses: [ORDER_STATUS.DELIVERED], desc: "Order complete!" },
];

export default function ActiveDelivery() {
  const [activeJob, setActiveJob] = useState(null);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDeliveriesFlow = useCallback(async () => {
    try {
      // 💡 This hits your new GET /api/riders/my-deliveries endpoint returning an array
      const rawJobs = await getMyActiveDelivery();
      const jobsArray = Array.isArray(rawJobs) ? rawJobs : [];

      // 💡 Split the array into active and recently delivered runs
      const active = jobsArray.find(job => job.statusState === ORDER_STATUS.OUT_FOR_DELIVERY);
      const history = jobsArray.filter(job => job.statusState === ORDER_STATUS.DELIVERED);

      setActiveJob(active || null);
      setHistoryJobs(history);
    } catch (e) {
      setActiveJob(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveriesFlow();
    const interval = setInterval(fetchDeliveriesFlow, 20_000);
    return () => clearInterval(interval);
  }, [fetchDeliveriesFlow]);

  const handleUpdateStatus = async (newStatus) => {
    if (!activeJob) return;
    setUpdating(true);
    try {
      await updateOrderStatus(activeJob.id || activeJob._id, newStatus);
      await fetchDeliveriesFlow();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update status state.");
    } finally {
      setUpdating(false);
    }
  };

  // 💡 Native phone call handler using the Deep Linking API
  const handleCallCustomer = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "No telephone number attached to this order.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = () => {
    if (!activeJob?.deliveryAddress) return;
    const encoded = encodeURIComponent(activeJob.deliveryAddress + ", Shai Hills, Ghana");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  return (
    <SafeView variant="dark">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDeliveriesFlow(); }}
            tintColor={COLORS.red}
          />
        }
      >
        <Text style={styles.title}>Logistics Run</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.red} size="large" />
          </View>
        ) : !activeJob && historyJobs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>No active tasks</Text>
            <Text style={styles.emptyBody}>Accept an order from the Queue tab to begin.</Text>
          </View>
        ) : (
          <>
            {/* ─── ACTIVE JOB CARD ─── */}
            {activeJob ? (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>⚠️ Current Active Run</Text>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>
                      #{String(activeJob.id || activeJob._id).slice(-5).toUpperCase()}
                    </Text>
                    <StatusBadge status={activeJob.statusState} />
                  </View>

                  <Text style={styles.customerName}>{activeJob.customerName || "Customer"}</Text>

                  {/* 💡 Customer Contact Row with Single-Click Dialer Integration */}
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => handleCallCustomer(activeJob.phoneNumber)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.infoLabel}>📞 Customer Phone</Text>
                    <Text style={[styles.infoValue, styles.phoneLinkText]}>
                      {activeJob.phoneNumber} 📱
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📍 Address</Text>
                    <Text style={styles.infoValue}>{activeJob.deliveryAddress}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>💰 Total Price</Text>
                    <Text style={[styles.infoValue, { color: COLORS.red, fontWeight: "800" }]}>
                      GHS {Number(activeJob.totalPrice || activeJob.totalAmount).toFixed(2)}
                    </Text>
                  </View>

                  <Button
                    variant="secondary"
                    label="Open in Maps"
                    onPress={openMaps}
                    size="sm"
                    style={{ marginTop: SPACING.lg }}
                  />
                </View>

                {/* Progress Tracking */}
                <View style={styles.card}>
                  <Text style={styles.cardSectionTitle}>Delivery Tracking</Text>
                  <StepIndicator steps={DELIVERY_STEPS} currentStatus={activeJob.statusState} />
                </View>

                {/* Items */}
                <View style={styles.card}>
                  <Text style={styles.cardSectionTitle}>Items Details</Text>
                  {(activeJob.items || []).map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.quantity}×</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>GHS {(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  label="Mark as Delivered"
                  onPress={() => handleUpdateStatus(ORDER_STATUS.DELIVERED)}
                  loading={updating}
                  size="lg"
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            ) : null}

            {/* ─── FRESH COMPLETED JOBS HISTORY ─── */}
            {historyJobs.length > 0 ? (
              <View style={[styles.sectionContainer, { marginTop: SPACING.xl }]}>
                <Text style={styles.sectionLabel}>🏁 Shift Finished Runs ({historyJobs.length})</Text>
                {historyJobs.map((job) => (
                  <View key={job.id || job._id} style={[styles.card, styles.historyCard]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.historyOrderId}>
                        #{String(job.id || job._id).slice(-5).toUpperCase()}
                      </Text>
                      <Text style={styles.historyTimeText}>Delivered ✅</Text>
                    </View>
                    <Text style={styles.historyCustomerName}>{job.customerName || "Customer"}</Text>
                    <Text style={styles.historyAddressText}>{job.deliveryAddress}</Text>
                    <Text style={styles.historyPriceText}>GHS {Number(job.totalPrice || job.totalAmount).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
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
  sectionContainer: { width: "100%" },
  sectionLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.sm },
  loading: { paddingVertical: SPACING["4xl"], alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon: { fontSize: 52, marginBottom: SPACING.lg },
  emptyTitle: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody: { color: "#6B7280", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },

  card: {
    backgroundColor: COLORS.stone,
    borderRadius: RADIUS["2xl"],
    padding: SPACING["2xl"],
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  historyCard: { backgroundColor: "#111827", borderColor: "#1F2937", opacity: 0.85 },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: SPACING.sm,
  },
  orderId: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, fontWeight: "700", letterSpacing: 1 },
  historyOrderId: { color: "#4B5563", fontSize: FONT_SIZES.xs, fontWeight: "700" },
  customerName: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.lg },
  historyCustomerName: { color: "#E5E7EB", fontSize: FONT_SIZES.base, fontWeight: "700" },
  historyAddressText: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, marginTop: 2 },
  historyPriceText: { color: COLORS.delivered, fontSize: FONT_SIZES.sm, fontWeight: "700", marginTop: 4 },
  historyTimeText: { color: COLORS.delivered, fontSize: FONT_SIZES.xs, fontWeight: "600" },

  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },
  infoValue: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },
  phoneLinkText: { color: "#60A5FA", textDecorationLine: "underline" },

  cardSectionTitle: {
    color: COLORS.white, fontSize: FONT_SIZES.base,
    fontWeight: "700", marginBottom: SPACING.xl,
  },
  itemRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SPACING.xs, gap: SPACING.sm,
  },
  itemQty: { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName: { color: COLORS.white, flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },
});

const stepStyles = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  left: { alignItems: "center", width: 32, marginRight: SPACING.lg },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: COLORS.delivered },
  dotActive: { backgroundColor: COLORS.red },
  dotText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineDone: { backgroundColor: COLORS.delivered },
  info: { flex: 1, paddingBottom: SPACING.lg },
  stepLabel: { color: "#6B7280", fontSize: FONT_SIZES.base, fontWeight: "600" },
  stepLabelActive: { color: COLORS.white },
  stepSubLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
});