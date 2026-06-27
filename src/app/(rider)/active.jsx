import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator, Alert, Linking, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { getMyActiveDelivery, updateOrderStatus } from "../../api/orders";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import StatusBadge from "../../components/orders/StatusBadge";
import { COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME, RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

const STATUS = {
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STEPS = [
  { label: "Out for Delivery", status: STATUS.OUT_FOR_DELIVERY, desc: "On your way to the customer" },
  { label: "Delivered", status: STATUS.DELIVERED, desc: "Order complete!" },
];

function StepIndicator({ currentStatus, theme }) {
  return (
    <View style={stepStyles.wrap}>
      {STEPS.map((step, i) => {
        const isActive = step.status === currentStatus;
        const isDone = STEPS.slice(0, i + 1).some(s => s.status === currentStatus)
          || (i === 0 && currentStatus === STATUS.OUT_FOR_DELIVERY)
          || (i === 1 && currentStatus === STATUS.DELIVERED);
        return (
          <View key={step.status} style={stepStyles.row}>
            <View style={stepStyles.left}>
              <View style={[stepStyles.dot, isDone && stepStyles.dotDone, isActive && stepStyles.dotActive]}>
                <Text style={stepStyles.dotText}>{isDone ? "✓" : i + 1}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />
              )}
            </View>
            <View style={stepStyles.info}>
              <Text style={[stepStyles.label, { color: isActive ? theme.text : theme.textMuted }]}>
                {step.label}
              </Text>
              {isActive && (
                <Text style={[stepStyles.desc, { color: theme.textMuted }]}>{step.desc}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function ActiveDelivery() {
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const [activeJob, setActiveJob] = useState(null);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const raw = await getMyActiveDelivery();
      const jobs = Array.isArray(raw) ? raw : [];
      setActiveJob(jobs.find(j => j.statusState === STATUS.OUT_FOR_DELIVERY) || null);
      setHistoryJobs(jobs.filter(j => j.statusState === STATUS.DELIVERED));
    } catch {
      setActiveJob(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 20_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const handleMarkDelivered = async () => {
    if (!activeJob) return;
    setUpdating(true);
    try {
      await updateOrderStatus(activeJob._id || activeJob.id, STATUS.DELIVERED);
      await fetchJobs();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const callCustomer = (phone) => {
    if (!phone) { Alert.alert("No phone number", "This order has no phone number."); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const openMaps = (address) => {
    if (!address) return;
    const q = encodeURIComponent(`${address}, Shai Hills, Ghana`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchJobs(); }}
            tintColor={COLORS.red}
          />
        }
      >
        <Text style={[styles.pageTitle, { color: theme.text }]}>Logistics Run</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.red} size="large" />
          </View>
        ) : !activeJob && historyJobs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No active tasks</Text>
            <Text style={[styles.emptyBody, { color: theme.textFaint }]}>
              Accept an order from the Queue tab to begin.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Active job ── */}
            {activeJob && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  ⚡ Current Run
                </Text>

                {/* Main card */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.orderId, { color: theme.textMuted }]}>
                      #{String(activeJob._id || activeJob.id).slice(-5).toUpperCase()}
                    </Text>
                    <StatusBadge status={activeJob.statusState} />
                  </View>

                  <Text style={[styles.customerName, { color: theme.text }]}>
                    {activeJob.customerName || "Customer"}
                  </Text>

                  {/* Phone — tappable dialer */}
                  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>📞 Phone</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>
                      {activeJob.phoneNumber || "—"}
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>📍 Location</Text>
                    <TouchableOpacity onPress={() => openMaps(activeJob.deliveryAddress)}>
                      <Text style={[styles.infoValue, styles.mapLink]}>
                        {activeJob.deliveryAddress || "—"} 🗺️
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Total */}
                  <View style={[styles.infoRow, { borderBottomColor: "transparent" }]}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>💰 Total</Text>
                    <Text style={[styles.infoValue, { color: COLORS.red, fontWeight: "800" }]}>
                      GHS {Number(activeJob.totalAmount || 0).toFixed(2)}
                    </Text>
                  </View>

                  <Button
                    variant="secondary"
                    label="📞 Call Customer"
                    onPress={() => callCustomer(activeJob.phoneNumber)}
                    size="sm"
                    style={{ marginTop: SPACING.lg, borderColor: "#16A34A", borderWidth: 2 }}
                    labelStyle={{ color: "#16A34A" }}
                  />
                </View>

                {/* Tracking */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Delivery Progress</Text>
                  <StepIndicator currentStatus={activeJob.statusState} theme={theme} />
                </View>

                {/* Items */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Items</Text>
                  {(activeJob.items || []).length === 0 ? (
                    <Text style={[styles.infoLabel, { color: theme.textFaint }]}>No items listed</Text>
                  ) : (
                    (activeJob.items || []).map((item, i) => (
                      <View key={item._id || item.id || i} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{item.quantity || 1}×</Text>
                        <Text style={[styles.itemName, { color: theme.text }]}>
                          {item.foodItemName || item.name || item.menuItemName || "Item"}
                        </Text>
                        <Text style={[styles.itemPrice, { color: theme.textMuted }]}>
                          GHS {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <Button
                  label="Mark as Delivered ✓"
                  onPress={handleMarkDelivered}
                  loading={updating}
                  size="lg"
                  style={{ marginTop: SPACING.sm }}
                />
              </View>
            )}

            {/* ── History ── */}
            {historyJobs.length > 0 && (
              <View style={[styles.section, activeJob ? { marginTop: SPACING.xl } : {}]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  🏁 Completed This Shift ({historyJobs.length})
                </Text>
                {historyJobs.map((job) => (
                  <View
                    key={job._id || job.id}
                    style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.orderId, { color: theme.textMuted }]}>
                        #{String(job._id || job.id).slice(-5).toUpperCase()}
                      </Text>
                      <Text style={styles.deliveredBadge}>Delivered ✅</Text>
                    </View>
                    <Text style={[styles.customerName, { color: theme.text, fontSize: FONT_SIZES.base }]}>
                      {job.customerName || "Customer"}
                    </Text>
                    <Text style={[styles.infoLabel, { color: theme.textMuted, marginTop: 2 }]}>
                      {job.deliveryAddress || "—"}
                    </Text>
                    <Text style={styles.historyPrice}>
                      GHS {Number(job.totalAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["4xl"] * 2 },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING.xl },
  center: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon: { fontSize: 52, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", marginBottom: SPACING.xs },
  emptyBody: { fontSize: FONT_SIZES.sm, textAlign: "center" },
  section: { width: "100%" },
  sectionLabel: { fontSize: FONT_SIZES.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.sm },
  card: { borderRadius: RADIUS["2xl"], padding: SPACING["2xl"], marginBottom: SPACING.lg, borderWidth: 1 },
  historyCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  orderId: { fontSize: FONT_SIZES.sm, fontWeight: "700", letterSpacing: 1 },
  customerName: { fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.base, fontWeight: "700", marginBottom: SPACING.xl },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  infoLabel: { fontSize: FONT_SIZES.sm },
  infoValue: { fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },
  phoneLink: { color: "#60A5FA", textDecorationLine: "underline" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, gap: SPACING.sm },
  itemQty: { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName: { flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice: { fontSize: FONT_SIZES.sm },
  deliveredBadge: { color: COLORS.delivered, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  historyPrice: { color: COLORS.delivered, fontSize: FONT_SIZES.sm, fontWeight: "700", marginTop: 4 },
  mapLink: { color: "#60A5FA", textDecorationLine: "underline", textAlign: "right", flex: 1 },
});

const stepStyles = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  left: { alignItems: "center", width: 32, marginRight: SPACING.lg },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: COLORS.delivered },
  dotActive: { backgroundColor: COLORS.red },
  dotText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  line: { width: 2, flex: 1, minHeight: 24, backgroundColor: COLORS.border, marginVertical: 4 },
  lineDone: { backgroundColor: COLORS.delivered },
  info: { flex: 1, paddingBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.base, fontWeight: "600" },
  desc: { fontSize: FONT_SIZES.sm, marginTop: 2 },
});