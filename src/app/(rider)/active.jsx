import { useCallback, useEffect, useState } from "react";
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

const ORDER_STATUS = {
  READY_FOR_DISPATCH: "Ready for Dispatch",
  OUT_FOR_DELIVERY:   "Out for Delivery",
  DELIVERED:          "Delivered",
};

const DELIVERY_STEPS = [
  { label: "Out for Delivery", statuses: [ORDER_STATUS.OUT_FOR_DELIVERY], desc: "On your way to the customer" },
  { label: "Delivered",        statuses: [ORDER_STATUS.DELIVERED],        desc: "Order complete!" },
];

function StepIndicator({ steps, currentStatus, theme }) {
  return (
    <View style={stepStyles.wrap}>
      {steps.map((step, i) => {
        const isActive = step.statuses.includes(currentStatus);
        const isDone = steps.slice(0, i).some((s) => s.statuses.includes(currentStatus))
          || step.statuses.includes(currentStatus);
        return (
          <View key={i} style={stepStyles.row}>
            <View style={stepStyles.left}>
              <View style={[stepStyles.dot, isDone && stepStyles.dotDone, isActive && stepStyles.dotActive]}>
                <Text style={stepStyles.dotText}>{isDone ? "✓" : i + 1}</Text>
              </View>
              {i < steps.length - 1 && (
                <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />
              )}
            </View>
            <View style={stepStyles.info}>
              <Text style={[stepStyles.stepLabel, { color: isActive ? theme.text : theme.textMuted }]}>
                {step.label}
              </Text>
              {isActive && (
                <Text style={[stepStyles.stepSubLabel, { color: theme.textMuted }]}>{step.desc}</Text>
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

  const [activeJob,   setActiveJob]   = useState(null);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [updating,    setUpdating]    = useState(false);

  const fetchDeliveriesFlow = useCallback(async () => {
    try {
      const rawJobs  = await getMyActiveDelivery();
      const jobsArray = Array.isArray(rawJobs) ? rawJobs : [];
      const active  = jobsArray.find(j => j.statusState === ORDER_STATUS.OUT_FOR_DELIVERY);
      const history = jobsArray.filter(j => j.statusState === ORDER_STATUS.DELIVERED);
      setActiveJob(active || null);
      setHistoryJobs(history);
    } catch { setActiveJob(null); }
    finally { setLoading(false); setRefreshing(false); }
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
      await updateOrderStatus(activeJob._id || activeJob.id, newStatus);
      await fetchDeliveriesFlow();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update status.");
    } finally { setUpdating(false); }
  };

  const handleCallCustomer = (phone) => {
    if (!phone) { Alert.alert("Error", "No phone number for this order."); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const openMaps = () => {
    if (!activeJob?.deliveryAddress) return;
    const q = encodeURIComponent(activeJob.deliveryAddress + ", Shai Hills, Ghana");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <SafeView variant={isDark ? "dark" : "light"}>
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
        <Text style={[styles.title, { color: theme.text }]}>Logistics Run</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.red} size="large" />
          </View>
        ) : !activeJob && historyJobs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No active tasks</Text>
            <Text style={[styles.emptyBody, { color: theme.textFaint }]}>
              Accept an order from the Queue tab to begin.
            </Text>
          </View>
        ) : (
          <>
            {activeJob && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>⚠️ Current Active Run</Text>

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

                  <TouchableOpacity
                    style={[styles.infoRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleCallCustomer(activeJob.phoneNumber)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>📞 Customer Phone</Text>
                    <Text style={[styles.infoValue, styles.phoneLinkText]}>
                      {activeJob.phoneNumber} 📱
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>📍 Address</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{activeJob.deliveryAddress}</Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>💰 Total Price</Text>
                    <Text style={[styles.infoValue, { color: COLORS.red, fontWeight: "800" }]}>
                      GHS {Number(activeJob.totalAmount || activeJob.totalPrice || 0).toFixed(2)}
                    </Text>
                  </View>

                  <Button variant="secondary" label="Open in Maps" onPress={openMaps}
                    size="sm" style={{ marginTop: SPACING.lg }} />
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cardSectionTitle, { color: theme.text }]}>Delivery Tracking</Text>
                  <StepIndicator steps={DELIVERY_STEPS} currentStatus={activeJob.statusState} theme={theme} />
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cardSectionTitle, { color: theme.text }]}>Items Details</Text>
                  {(activeJob.items || []).map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.quantity || 1}×</Text>
                      <Text style={[styles.itemName, { color: theme.text }]}>
                        {item.foodItemName || item.name || "Item"}
                      </Text>
                      <Text style={[styles.itemPrice, { color: theme.textMuted }]}>
                        GHS {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </Text>
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
            )}

            {historyJobs.length > 0 && (
              <View style={[styles.sectionContainer, { marginTop: SPACING.xl }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  🏁 Shift Finished Runs ({historyJobs.length})
                </Text>
                {historyJobs.map((job) => (
                  <View key={job._id || job.id}
                    style={[styles.card, styles.historyCard, { borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.historyOrderId}>
                        #{String(job._id || job.id).slice(-5).toUpperCase()}
                      </Text>
                      <Text style={styles.historyTimeText}>Delivered ✅</Text>
                    </View>
                    <Text style={styles.historyCustomerName}>{job.customerName || "Customer"}</Text>
                    <Text style={styles.historyAddressText}>{job.deliveryAddress}</Text>
                    <Text style={styles.historyPriceText}>
                      GHS {Number(job.totalAmount || job.totalPrice || 0).toFixed(2)}
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
  scroll:          { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["4xl"] },
  title:           { fontSize: FONT_SIZES.xl, fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING.xl },
  sectionContainer:{ width: "100%" },
  sectionLabel:    { fontSize: FONT_SIZES.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.sm },
  loading:         { paddingVertical: SPACING["4xl"], alignItems: "center" },
  empty:           { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon:       { fontSize: 52, marginBottom: SPACING.lg },
  emptyTitle:      { fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody:       { fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  card:            { borderRadius: RADIUS["2xl"], padding: SPACING["2xl"], marginBottom: SPACING.lg, borderWidth: 1 },
  historyCard:     { backgroundColor: "#111827", opacity: 0.85 },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  orderId:         { fontSize: FONT_SIZES.sm, fontWeight: "700", letterSpacing: 1 },
  historyOrderId:  { color: "#4B5563", fontSize: FONT_SIZES.xs, fontWeight: "700" },
  customerName:    { fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.lg },
  historyCustomerName: { color: "#E5E7EB", fontSize: FONT_SIZES.base, fontWeight: "700" },
  historyAddressText:  { color: "#9CA3AF", fontSize: FONT_SIZES.xs, marginTop: 2 },
  historyPriceText:    { color: COLORS.delivered, fontSize: FONT_SIZES.sm, fontWeight: "700", marginTop: 4 },
  historyTimeText:     { color: COLORS.delivered, fontSize: FONT_SIZES.xs, fontWeight: "600" },
  infoRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  infoLabel:       { fontSize: FONT_SIZES.sm },
  infoValue:       { fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },
  phoneLinkText:   { color: "#60A5FA", textDecorationLine: "underline" },
  cardSectionTitle:{ fontSize: FONT_SIZES.base, fontWeight: "700", marginBottom: SPACING.xl },
  itemRow:         { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, gap: SPACING.sm },
  itemQty:         { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName:        { flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice:       { fontSize: FONT_SIZES.sm },
});

const stepStyles = StyleSheet.create({
  wrap:           { gap: 0 },
  row:            { flexDirection: "row", alignItems: "flex-start" },
  left:           { alignItems: "center", width: 32, marginRight: SPACING.lg },
  dot:            { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  dotDone:        { backgroundColor: COLORS.delivered },
  dotActive:      { backgroundColor: COLORS.red },
  dotText:        { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  line:           { width: 2, flex: 1, minHeight: 24, backgroundColor: COLORS.border, marginVertical: 4 },
  lineDone:       { backgroundColor: COLORS.delivered },
  info:           { flex: 1, paddingBottom: SPACING.lg },
  stepLabel:      { fontSize: FONT_SIZES.base, fontWeight: "600" },
  stepSubLabel:   { fontSize: FONT_SIZES.sm, marginTop: 2 },
});