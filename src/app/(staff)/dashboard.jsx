import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPendingOrders, updateOrderStatus } from "../../api/orders";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import OrderCard from "../../components/orders/OrderCard";
import StatusBadge from "../../components/orders/StatusBadge";
import {
  COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME,
  ORDER_STATUS, ORDER_STATUS_LABELS, RADIUS, SPACING,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// ─── Dispatched statuses (rider view) ────────────────────────────────────────
const DISPATCHED_STATUSES = [
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

function isToday(isoString) {
  if (!isoString) return false;
  return new Date(isoString).toDateString() === new Date().toDateString();
}

// ─── Staff kitchen transitions only ──────────────────────────────────────────
const STAFF_TRANSITIONS = {
  [ORDER_STATUS.PENDING]:          [ORDER_STATUS.PREPARING],
  [ORDER_STATUS.PREPARING]:        [ORDER_STATUS.READY_FOR_PICKUP],
  [ORDER_STATUS.READY_FOR_PICKUP]: [],
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryPill({ label, count, color, theme }) {
  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: theme.card }]}>
      <Text style={[styles.pillCount, { color }]}>{count}</Text>
      <Text style={[styles.pillLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function OrderDetailModal({ order, visible, onClose, onStatusChange, theme }) {
  const [loading, setLoading] = useState(false);
  if (!order) return null;

  const transitions = STAFF_TRANSITIONS[order.statusState] ?? [];

  const handleUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await onStatusChange(order._id || order.id, newStatus);
      onClose();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update order status.");
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Order #{String(order._id || order.id).slice(-5).toUpperCase()}
          </Text>

          {[
            { label: "Customer", value: order.customerName },
            { label: "Address",  value: order.deliveryAddress },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.modalRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalLabel, { color: theme.textMuted }]}>{label}</Text>
              <Text style={[styles.modalValue, { color: theme.text }]}>{value}</Text>
            </View>
          ))}

          <View style={[styles.modalRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Status</Text>
            <StatusBadge status={order.statusState} />
          </View>

          <Text style={[styles.modalLabel, { color: theme.textMuted, marginTop: SPACING.lg }]}>Items</Text>
          {(order.items || []).map((item) => (
            <View key={item.foodItemName} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.foodItemName}</Text>
              <Text style={[styles.itemPrice, { color: theme.textMuted }]}>
                GHS {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Total</Text>
            <Text style={styles.totalValue}>
              GHS {Number(order.totalAmount || order.totalPrice || 0).toFixed(2)}
            </Text>
          </View>

          {transitions.length > 0 && (
            <View style={{ marginTop: SPACING.xl }}>
              {transitions.map((s) => (
                <Button
                  key={s}
                  label={`Mark as ${ORDER_STATUS_LABELS[s]}`}
                  loading={loading}
                  onPress={() => handleUpdate(s)}
                  size="md"
                  style={{ marginTop: SPACING.sm }}
                />
              ))}
            </View>
          )}

          <Button variant="ghost" label="Close" onPress={onClose}
            size="sm" style={{ marginTop: SPACING.md }} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Dispatched drawer modal ──────────────────────────────────────────────────
function DispatchedModal({ orders, visible, onClose, theme }) {
  const dispatched = orders.filter(
    (o) => DISPATCHED_STATUSES.includes(o.statusState) && isToday(o.createdAt || o.timestamp)
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: "80%" }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

          <Text style={[styles.modalTitle, { color: theme.text }]}>
            📦  Dispatched Today
          </Text>

          <Text style={[styles.eodText, { color: theme.textMuted, marginBottom: SPACING.md }]}>
            Out for delivery & delivered — resets at midnight
          </Text>

          {dispatched.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏍️</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No dispatched orders yet</Text>
              <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
                Orders handed to riders will appear here
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {dispatched.map((order) => (
                <View
                  key={String(order._id || order.id)}
                  style={[styles.dispatchRow, { borderColor: theme.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dispatchOrderId, { color: theme.text }]}>
                      #{String(order._id || order.id).slice(-5).toUpperCase()}
                    </Text>
                    <Text style={[styles.dispatchCustomer, { color: theme.textMuted }]}>
                      {order.customerName}
                    </Text>
                  </View>
                  <StatusBadge status={order.statusState} />
                </View>
              ))}
            </ScrollView>
          )}

          <Button variant="ghost" label="Close" onPress={onClose}
            size="sm" style={{ marginTop: SPACING.lg }} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  const [orders,           setOrders]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [selectedOrder,    setSelectedOrder]    = useState(null);
  const [filter,           setFilter]           = useState("ALL");
  const [showDispatched,   setShowDispatched]   = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* non-fatal */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (id, status) => {
    await updateOrderStatus(id, status);
    await fetchOrders();
  };

  const FILTERS = ["ALL", ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP];

  // Active orders only — dispatched never appear in main list
  const ACTIVE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP];
  const filtered = filter === "ALL"
    ? orders.filter((o) => ACTIVE_STATUSES.includes(o.statusState))
    : orders.filter((o) => o.statusState === filter);

  const counts = {
    pending:   orders.filter((o) => o.statusState === ORDER_STATUS.PENDING).length,
    preparing: orders.filter((o) => o.statusState === ORDER_STATUS.PREPARING).length,
    ready:     orders.filter((o) => o.statusState === ORDER_STATUS.READY_FOR_PICKUP).length,
  };

  const dispatchedCount = orders.filter(
    (o) => DISPATCHED_STATUSES.includes(o.statusState) && isToday(o.createdAt || o.timestamp)
  ).length;

  return (
    <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>Kitchen Dashboard</Text>
          <Text style={[styles.subGreeting, { color: theme.textMuted }]}>
            Welcome back, {user?.name?.split(" ")[0]}!
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowDispatched(true)}
            style={[styles.dispatchedBtn, { borderColor: COLORS.delivery }]}
          >
            <Text style={[styles.dispatchedBtnText, { color: COLORS.delivery }]}>
              📦 Dispatched{dispatchedCount > 0 ? ` (${dispatchedCount})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Sign Out", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: signOut },
              ])
            }
            style={[styles.signOutBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.signOutText, { color: theme.textMuted }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Summary pills ──────────────────────────────────────────────── */}
      <View style={styles.pillsRow}>
        <SummaryPill label="Pending"   count={counts.pending}   color={COLORS.pending}   theme={theme} />
        <SummaryPill label="Preparing" count={counts.preparing} color={COLORS.preparing} theme={theme} />
        <SummaryPill label="Ready"     count={counts.ready}     color={COLORS.ready}     theme={theme} />
      </View>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              { backgroundColor: theme.card, borderColor: theme.border },
              filter === f && styles.filterChipActive,
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textMuted },
              filter === f && styles.filterTextActive,
            ]}>
              {f === "ALL" ? "All" : ORDER_STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Order list ─────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + SPACING.lg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.red}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
              <Text style={[styles.emptyBody, { color: theme.textFaint }]}>Pull down to refresh</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              variant={isDark ? "dark" : "light"}
              onPress={() => setSelectedOrder(item)}
            />
          )}
        />
      )}

      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        theme={theme}
      />

      <DispatchedModal
        orders={orders}
        visible={showDispatched}
        onClose={() => setShowDispatched(false)}
        theme={theme}
      />
    </SafeView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING["2xl"], paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  greeting:     { fontSize: FONT_SIZES.xl, fontWeight: "800" },
  subGreeting:  { fontSize: FONT_SIZES.sm, marginTop: 2 },
  headerActions:{ flexDirection: "column", alignItems: "flex-end", gap: SPACING.xs },
  dispatchedBtn:{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  dispatchedBtnText: { fontSize: FONT_SIZES.xs, fontWeight: "600" },
  signOutBtn:   { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  signOutText:  { fontSize: FONT_SIZES.xs, fontWeight: "600" },
  pillsRow:     { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING["2xl"], marginBottom: SPACING.lg },
  pill:         { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, padding: SPACING.md, alignItems: "center" },
  pillCount:    { fontSize: FONT_SIZES["2xl"], fontWeight: "800" },
  pillLabel:    { fontSize: FONT_SIZES.xs, marginTop: 2 },
  filterRow:    { flexDirection: "row", gap: SPACING.xs, paddingHorizontal: SPACING["2xl"], marginBottom: SPACING.lg, flexWrap: "wrap" },
  filterChip:   { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1 },
  filterChipActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  filterText:   { fontSize: FONT_SIZES.xs, fontWeight: "600" },
  filterTextActive: { color: COLORS.white },
  list:         { paddingHorizontal: SPACING["2xl"] },
  loadingWrap:  { flex: 1, alignItems: "center", justifyContent: "center" },
  empty:        { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon:    { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle:   { fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody:    { fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  eodText:      { fontSize: FONT_SIZES.xs, lineHeight: 17 },
  modalBackdrop:{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: RADIUS["3xl"], borderTopRightRadius: RADIUS["3xl"], padding: SPACING["2xl"], paddingBottom: SPACING["4xl"], borderTopWidth: 1 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: SPACING.xl },
  modalTitle:   { fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.sm, letterSpacing: 1 },
  modalRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  modalLabel:   { fontSize: FONT_SIZES.sm, fontWeight: "600" },
  modalValue:   { fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },
  itemRow:      { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, gap: SPACING.sm },
  itemQty:      { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName:     { flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice:    { fontSize: FONT_SIZES.sm },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", paddingTop: SPACING.md, marginTop: SPACING.xs },
  totalLabel:   { fontWeight: "700" },
  totalValue:   { color: COLORS.red, fontWeight: "800", fontSize: FONT_SIZES.md },
  dispatchRow:  { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, gap: SPACING.sm },
  dispatchOrderId: { fontSize: FONT_SIZES.sm, fontWeight: "700" },
  dispatchCustomer: { fontSize: FONT_SIZES.xs, marginTop: 2 },
});