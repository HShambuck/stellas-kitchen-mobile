import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getPendingOrders, updateOrderStatus } from "../../api/orders";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import OrderCard from "../../components/orders/OrderCard";
import StatusBadge from "../../components/orders/StatusBadge";
import {
  COLORS, FONT_SIZES,
  RADIUS,
  SPACING,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

// Next valid status transitions for kitchen staff
const ORDER_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Dispatch",
};

const ORDER_STATUS_LABELS = {
  "Pending": "Pending",
  "Preparing": "Preparing",
  "Ready for Dispatch": "Ready",
};

const STAFF_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP],
  [ORDER_STATUS.READY_FOR_PICKUP]: [], // Rider takes over
};

// Summary counts for the top bar
function SummaryPill({ label, count, color }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillCount, { color }]}>{count}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// Order detail + action modal
function OrderDetailModal({ order, visible, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  if (!order) return null;

  const transitions = STAFF_TRANSITIONS[order.status] ?? [];

  const handleUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await onStatusChange((order._id || order.id), newStatus); // 💡 Pass the mongo _id
      onClose();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not update order status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            Order #{String(order._id || order.id).slice(-5).toUpperCase()}
          </Text>

          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Customer</Text>
            <Text style={styles.modalValue}>{order.customerName}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Address</Text>
            <Text style={styles.modalValue}>{order.deliveryAddress}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Status</Text>
            <StatusBadge status={order.statusState} /> {/* 💡 Changed status to statusState */}
          </View>

          {/* Items */}
          <Text style={[styles.modalLabel, { marginTop: SPACING.lg }]}>Items</Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              {/* 💡 Backend uses foodItemName instead of name */}
              <Text style={styles.itemName}>{item.foodItemName || item.name}</Text>
              <Text style={styles.itemPrice}>GHS {item.price * item.quantity}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            {/* 💡 Backend uses totalAmount instead of totalPrice */}
            <Text style={styles.totalValue}>GHS {Number(order.totalAmount).toFixed(2)}</Text>
          </View>

          {/* Transition buttons */}
          {transitions.length > 0 && (
            <View style={styles.actionsWrap}>
              {transitions.map((s) => (
                <Button
                  key={s}
                  label={loading ? "" : `Mark as ${ORDER_STATUS_LABELS[s]}`}
                  loading={loading}
                  onPress={() => handleUpdate(s)}
                  size="md"
                  style={{ marginTop: SPACING.sm }}
                />
              ))}
            </View>
          )}

          <Button
            variant="ghost"
            label="Close"
            onPress={onClose}
            size="sm"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      // Silently fail on refresh; initial load shows empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (id, status) => {
    await updateOrderStatus(id, status);
    await fetchOrders();
  };

  // Inside Dashboard component:
const FILTERS = ["ALL", ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP];
const filtered = filter === "ALL" ? orders : orders.filter((o) => o.statusState === filter);

const counts = {
  pending:   orders.filter((o) => o.statusState === ORDER_STATUS.PENDING).length,
  preparing: orders.filter((o) => o.statusState === ORDER_STATUS.PREPARING).length,
  ready:     orders.filter((o) => o.statusState === ORDER_STATUS.READY_FOR_PICKUP).length,
};

  return (
    <SafeView variant="dark">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Kitchen Dashboard</Text>
          <Text style={styles.subGreeting}>Welcome back, {user?.name?.split(" ")[0]}!</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: signOut },
        ])} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary pills */}
      <View style={styles.pillsRow}>
        <SummaryPill label="Pending" count={counts.pending} color={COLORS.pending} />
        <SummaryPill label="Preparing" count={counts.preparing} color={COLORS.preparing} />
        <SummaryPill label="Ready" count={counts.ready} color={COLORS.ready} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "ALL" ? "All" : ORDER_STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders list */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.list}
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
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyBody}>Pull down to refresh</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={{ ...item, id: item._id || item.id }} // 💡 Safely maps the identifier forward
              variant="dark"
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
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING["2xl"],
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800",
  },
  subGreeting: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
  signOutBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "600" },

  pillsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING["2xl"],
    marginBottom: SPACING.lg,
  },
  pill: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    alignItems: "center",
    backgroundColor: COLORS.stone,
  },
  pillCount: { fontSize: FONT_SIZES["2xl"], fontWeight: "800" },
  pillLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, marginTop: 2 },

  filterRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    paddingHorizontal: SPACING["2xl"],
    marginBottom: SPACING.lg,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  filterText: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "600" },
  filterTextActive: { color: COLORS.white },

  list: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["3xl"] },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody: { color: "#6B7280", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.stone,
    borderTopLeftRadius: RADIUS["3xl"],
    borderTopRightRadius: RADIUS["3xl"],
    padding: SPACING["2xl"],
    paddingBottom: SPACING["4xl"],
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    color: COLORS.white, fontSize: FONT_SIZES.xl,
    fontWeight: "800", marginBottom: SPACING.xl, letterSpacing: 1,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, fontWeight: "600" },
  modalValue: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: "600", flex: 1, textAlign: "right" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  itemQty: { color: COLORS.red, fontWeight: "700", width: 24 },
  itemName: { color: COLORS.white, flex: 1, fontSize: FONT_SIZES.sm },
  itemPrice: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  totalLabel: { color: "#9CA3AF", fontWeight: "700" },
  totalValue: { color: COLORS.red, fontWeight: "800", fontSize: FONT_SIZES.md },
  actionsWrap: { marginTop: SPACING.xl },
});
