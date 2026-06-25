import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import SafeView from "../../components/common/SafeView";
import OrderCard from "../../components/orders/OrderCard";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getAvailableDeliveries, acceptDelivery } from "../../api/orders";
// 💡 Import your patch status api call here (assume it's named updateRiderStatus or similar)
import { updateRiderStatus } from "../../api/orders";
import { COLORS, FONT_SIZES, SPACING, RADIUS } from "../../constants/theme";

function DeliveryDetailModal({ order, visible, onClose, onAccept, accepting }) {
  if (!order) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Delivery Details</Text>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>📍 Drop-off</Text>
            <Text style={styles.detailValue}>{order.deliveryAddress}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>👤 Customer</Text>
            <Text style={styles.detailValue}>{order.customerName}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>🛍️ Items</Text>
            <Text style={styles.detailValue}>
              {(order.items || []).map((i) => `${i.quantity || 1}× ${i.name || i.menuItemName || 'Item'}`).join("\n")}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>💰 Total</Text>
            <Text style={[styles.detailValue, { color: COLORS.red, fontWeight: "800" }]}>
              GHS {Number(order.totalPrice || order.totalAmount).toFixed(2)}
            </Text>
          </View>

          <Button
            label="Accept Delivery"
            onPress={() => onAccept(order.id || order._id)}
            loading={accepting}
            size="lg"
            style={{ marginTop: SPACING["2xl"] }}
          />
          <Button
            variant="ghost"
            label="Cancel"
            onPress={onClose}
            size="sm"
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function RiderQueue() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [accepting, setAccepting] = useState(false);

  // 💡 Local state for status tracking initialized from context profile
  const [isAvailable, setIsAvailable] = useState(user?.scheduleStatus === "Available");
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    if (!isAvailable) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await getAvailableDeliveries();
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* non-fatal */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAvailable]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 20_000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  // 💡 Toggle Rider Switch handler
  const handleToggleAvailability = async () => {
    const nextStatus = isAvailable ? "Offline" : "Available";
    setTogglingStatus(true);
    try {
      if (updateRiderStatus) {
        await updateRiderStatus({ scheduleStatus: nextStatus });
      }
      setIsAvailable(!isAvailable);
    } catch (e) {
      Alert.alert("Status Error", "Could not change status framework state.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleAccept = async (orderId) => {
    setAccepting(true);
    try {
      await acceptDelivery(orderId);
      setSelected(null);
      Alert.alert("Order Accepted!", "Head to Stella's Kitchen to pick up the order.");
      fetchDeliveries();
    } catch (e) {
      Alert.alert("Could not accept", e.message || "Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeView variant="dark">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Available Deliveries</Text>
          <Text style={styles.subtitle}>
            {isAvailable ? `${orders.length} orders near Shai Hills` : "You are currently offline"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: signOut },
          ])}
          style={styles.signOutBtn}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* 💡 Operational Status Pill containing Switch element */}
      <View style={[styles.riderPill, !isAvailable && styles.riderPillOffline]}>
        <Text style={[styles.riderPillText, !isAvailable && styles.riderPillTextOffline]}>
          {isAvailable ? `🏍️ Online: ${user?.name?.split(" ")[0]}` : "💤 Offline"}
        </Text>
        <Switch
          trackColor={{ false: "#4B5563", true: COLORS.delivered }}
          thumbColor={COLORS.white}
          onValueChange={handleToggleAvailability}
          value={isAvailable}
          disabled={togglingStatus}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>

      {/* List / Empty Fallback container */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.red} size="large" />
        </View>
      ) : !isAvailable ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌙</Text>
          <Text style={styles.emptyTitle}>You're Offline</Text>
          <Text style={styles.emptyBody}>Toggle the switch above to available to see orders.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDeliveries(); }}
              tintColor={COLORS.red}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No deliveries right now</Text>
              <Text style={styles.emptyBody}>Pull down to check for new orders</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              variant="dark"
              onPress={() => setSelected(item)}
            />
          )}
        />
      )}

      <DeliveryDetailModal
        order={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        onAccept={handleAccept}
        accepting={accepting}
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
    paddingBottom: SPACING.md,
  },
  title: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800" },
  subtitle: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
  signOutBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  signOutText: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "600" },

  riderPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginHorizontal: SPACING["2xl"],
    marginBottom: SPACING.lg,
    backgroundColor: "#1E3A5F",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  riderPillOffline: { backgroundColor: COLORS.border },
  riderPillText: { color: "#93C5FD", fontSize: FONT_SIZES.xs, fontWeight: "700" },
  riderPillTextOffline: { color: "#9CA3AF" },

  list: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["3xl"] },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody: { color: "#6B7280", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },

  // Modal
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.stone,
    borderTopLeftRadius: RADIUS["3xl"], borderTopRightRadius: RADIUS["3xl"],
    padding: SPACING["2xl"], paddingBottom: SPACING["4xl"],
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: SPACING.xl,
  },
  modalTitle: {
    color: COLORS.white, fontSize: FONT_SIZES.xl,
    fontWeight: "800", marginBottom: SPACING.xl,
  },
  detailCard: {
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  detailLabel: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "600", marginBottom: 4 },
  detailValue: { color: COLORS.white, fontSize: FONT_SIZES.base, lineHeight: 22 },
});