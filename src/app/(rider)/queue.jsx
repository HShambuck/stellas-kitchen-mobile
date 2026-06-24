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
} from "react-native";
import SafeView from "../../components/common/SafeView";
import OrderCard from "../../components/orders/OrderCard";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getAvailableDeliveries, acceptDelivery } from "../../api/orders";
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
              {(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join("\n")}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>💰 Total</Text>
            <Text style={[styles.detailValue, { color: COLORS.red, fontWeight: "800" }]}>
              GHS {Number(order.totalPrice).toFixed(2)}
            </Text>
          </View>

          <Button
            label="Accept Delivery"
            onPress={() => onAccept(order.id)}
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
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [accepting, setAccepting] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    try {
      const data = await getAvailableDeliveries();
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* non-fatal */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 20_000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

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
            {orders.length} order{orders.length !== 1 ? "s" : ""} near Shai Hills
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

      {/* Rider pill */}
      <View style={styles.riderPill}>
        <Text style={styles.riderPillText}>
          🏍️  {user?.name?.split(" ")[0]}
          {user?.vehicleType ? `  ·  ${user.vehicleType}` : ""}
        </Text>
        <View style={styles.onlineDot} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
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
  title:    { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800" },
  subtitle: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
  signOutBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  signOutText: { color: "#9CA3AF", fontSize: FONT_SIZES.xs, fontWeight: "600" },

  riderPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: SPACING["2xl"],
    marginBottom: SPACING.lg,
    backgroundColor: "#1E3A5F",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  riderPillText: { color: "#93C5FD", fontSize: FONT_SIZES.xs, fontWeight: "700" },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.delivered,
  },

  list: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["3xl"] },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon:  { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody:  { color: "#6B7280", fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },

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
