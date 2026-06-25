import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { acceptDelivery, getAvailableDeliveries } from "../../api/orders";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import OrderCard from "../../components/orders/OrderCard";
import { COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function DeliveryDetailModal({ order, visible, onClose, onAccept, accepting, theme }) {
  if (!order) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Delivery Details</Text>

          {[
            { label: "📍 Drop-off", value: order.deliveryAddress },
            { label: "👤 Customer", value: order.customerName },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.detailCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
            </View>
          ))}

          <View style={[styles.detailCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>🛍️ Items</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {(order.items || []).map((i) => `${i.quantity}× ${i.foodItemName || i.name}`).join("\n")}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>💰 Total</Text>
            <Text style={[styles.detailValue, { color: COLORS.red, fontWeight: "800" }]}>
              GHS {Number(order.totalAmount || order.totalPrice || 0).toFixed(2)}
            </Text>
          </View>

          <Button
            label="Accept Delivery"
            onPress={() => onAccept(order._id || order.id)}
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
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
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
    <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Available Deliveries</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} near Shai Hills
          </Text>
        </View>
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

      <View style={styles.riderPill}>
        <View style={styles.onlineDot} />
        <Text style={styles.riderPillText}>
          {user?.name?.split(" ")[0]}
          {user?.vehicleType ? `  ·  ${user.vehicleType}` : ""}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + SPACING.lg }]}
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
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No deliveries right now</Text>
              <Text style={[styles.emptyBody, { color: theme.textFaint }]}>Pull down to check for new orders</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              variant={isDark ? "dark" : "light"}
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
        theme={theme}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING["2xl"], paddingTop: SPACING.xl, paddingBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: "800" },
  subtitle: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  signOutBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  signOutText: { fontSize: FONT_SIZES.xs, fontWeight: "600" },
  riderPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginHorizontal: SPACING["2xl"], marginBottom: SPACING.lg, backgroundColor: "#1E3A5F", paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, gap: SPACING.sm },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.delivered },
  riderPillText: { color: "#93C5FD", fontSize: FONT_SIZES.xs, fontWeight: "700" },
  list: { paddingHorizontal: SPACING["2xl"] },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: SPACING["4xl"] },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700" },
  emptyBody: { fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: RADIUS["3xl"], borderTopRightRadius: RADIUS["3xl"], padding: SPACING["2xl"], paddingBottom: SPACING["4xl"], borderTopWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.xl },
  detailCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1 },
  detailLabel: { fontSize: FONT_SIZES.xs, fontWeight: "600", marginBottom: 4 },
  detailValue: { fontSize: FONT_SIZES.base, lineHeight: 22 },
});