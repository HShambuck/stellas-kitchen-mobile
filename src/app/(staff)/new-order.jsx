import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import { createOrder } from "../../api/orders";
import {
  COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME, RADIUS, SPACING,
} from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

function Field({ label, value, onChangeText, placeholder, keyboardType,
  autoCapitalize, theme, focused, onFocus, onBlur, inputRef, returnKeyType, onSubmit }) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        returnKeyType={returnKeyType || "next"}
        onSubmitEditing={onSubmit}
        style={[
          styles.input,
          { backgroundColor: theme.inputBg, color: theme.text,
            borderColor: focused ? COLORS.red : theme.border },
        ]}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

const EMPTY_ITEM = { name: "", quantity: "1", price: "" };

export default function NewOrder() {
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68 + insets.bottom;

  const [customerName,    setCustomerName]    = useState("");
  const [phoneNumber,     setPhoneNumber]      = useState("");
  const [deliveryAddress, setDeliveryAddress]  = useState("");
  const [items,           setItems]            = useState([{ ...EMPTY_ITEM }]);
  const [focused,         setFocused]          = useState(null);
  const [loading,         setLoading]          = useState(false);

  const fp = (key) => ({
    focused:  focused === key,
    onFocus:  () => setFocused(key),
    onBlur:   () => setFocused(null),
    theme,
  });

  // ── Item helpers ──────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeItem = (index) => {
    if (items.length === 1) return; // always keep at least one row
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Live total ────────────────────────────────────────────────────────────
  const total = items.reduce((sum, item) => {
    const qty   = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price)    || 0;
    return sum + qty * price;
  }, 0);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!customerName.trim())    return "Customer name is required.";
    if (!phoneNumber.trim())     return "Phone number is required.";
    if (!deliveryAddress.trim()) return "Delivery address is required.";
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name.trim())          return `Item ${i + 1} needs a name.`;
      if (!items[i].quantity || parseFloat(items[i].quantity) < 1) return `Item ${i + 1} needs a valid quantity.`;
      if (!items[i].price    || parseFloat(items[i].price)    <= 0) return `Item ${i + 1} needs a valid price.`;
    }
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert("Missing info", err); return; }

    setLoading(true);
    const payload = {
      customerName:    customerName.trim(),
      phoneNumber:     phoneNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      channelSource:   "Manual",
      statusState:     "Pending",
      totalAmount:     parseFloat(total.toFixed(2)),
      items: items.map((item) => ({
        foodItemName: item.name.trim(),
        quantity:     parseInt(item.quantity, 10),
        price:        parseFloat(item.price),
      })),
    };

    try {
      await createOrder(payload);
      Alert.alert("✅ Order Created", `Order for ${customerName} has been placed.`, [
        { text: "OK", onPress: resetForm },
      ]);
    } catch (e) {
      Alert.alert("Failed", e.message || "Could not create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setPhoneNumber("");
    setDeliveryAddress("");
    setItems([{ ...EMPTY_ITEM }]);
  };

  return (
    <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + SPACING["4xl"] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { color: theme.text }]}>New Order</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>
            Manual entry for walk-in or phone orders
          </Text>

          {/* ── Customer ── */}
          <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Customer</Text>
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Field {...fp("name")}    label="Full Name"     value={customerName}    onChangeText={setCustomerName}    placeholder="e.g. Akosua Mensah" />
            <Field {...fp("phone")}   label="Phone Number"  value={phoneNumber}     onChangeText={setPhoneNumber}     placeholder="023#######" keyboardType="phone-pad" autoCapitalize="none" />
            <Field {...fp("address")} label="Delivery Address" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="e.g. Shai Hills, Community 3" returnKeyType="done" />
          </View>

          {/* ── Items ── */}
          <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Order Items</Text>
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {items.map((item, index) => (
              <View key={index} style={[
                styles.itemBlock,
                index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: SPACING.lg, marginBottom: SPACING.lg },
              ]}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[styles.itemNumber, { color: theme.textMuted }]}>Item {index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Text style={styles.removeBtn}>✕ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Field
                  {...fp(`item-name-${index}`)}
                  label="Item Name"
                  value={item.name}
                  onChangeText={(v) => updateItem(index, "name", v)}
                  placeholder="e.g. Jollof Rice"
                />

                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Field
                      {...fp(`item-qty-${index}`)}
                      label="Qty"
                      value={item.quantity}
                      onChangeText={(v) => updateItem(index, "quantity", v)}
                      placeholder="1"
                      keyboardType="numeric"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ width: SPACING.md }} />
                  <View style={{ flex: 2 }}>
                    <Field
                      {...fp(`item-price-${index}`)}
                      label="Price per unit (GHS)"
                      value={item.price}
                      onChangeText={(v) => updateItem(index, "price", v)}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Line subtotal */}
                {item.quantity && item.price && (
                  <Text style={[styles.subtotal, { color: theme.textMuted }]}>
                    Subtotal: GHS {(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)}
                  </Text>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={addItem} style={[styles.addItemBtn, { borderColor: theme.border }]}>
              <Text style={[styles.addItemText, { color: COLORS.red }]}>＋ Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* ── Total ── */}
          <View style={[styles.totalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Grand Total</Text>
            <Text style={styles.totalAmount}>GHS {total.toFixed(2)}</Text>
          </View>

          {/* ── Submit ── */}
          <Button
            label="Create Order"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />

          <TouchableOpacity onPress={resetForm} style={styles.resetBtn}>
            <Text style={[styles.resetText, { color: theme.textMuted }]}>Clear form</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll:       { paddingHorizontal: SPACING["2xl"] },
  pageTitle:    { fontSize: FONT_SIZES.xl, fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING.xs },
  pageSub:      { fontSize: FONT_SIZES.sm, marginBottom: SPACING["2xl"] },
  sectionHeader:{ fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACING.sm, marginTop: SPACING.lg },
  section:      { borderRadius: RADIUS["2xl"], borderWidth: 1, padding: SPACING["2xl"], marginBottom: SPACING.sm },
  fieldLabel:   { fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: SPACING.xs },
  input:        { borderRadius: RADIUS.lg, borderWidth: 1.5, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.base },
  itemBlock:    {},
  itemHeaderRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  itemNumber:   { fontSize: FONT_SIZES.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  removeBtn:    { color: COLORS.red, fontSize: FONT_SIZES.xs, fontWeight: "700" },
  itemRow:      { flexDirection: "row" },
  subtotal:     { fontSize: FONT_SIZES.xs, fontWeight: "600", marginTop: -SPACING.sm, marginBottom: SPACING.xs },
  addItemBtn:   { borderWidth: 1.5, borderStyle: "dashed", borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: "center", marginTop: SPACING.sm },
  addItemText:  { fontSize: FONT_SIZES.sm, fontWeight: "700" },
  totalCard:    { borderRadius: RADIUS["2xl"], borderWidth: 1, padding: SPACING["2xl"], flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.sm },
  totalLabel:   { fontSize: FONT_SIZES.base, fontWeight: "600" },
  totalAmount:  { fontSize: FONT_SIZES["2xl"], fontWeight: "900", color: COLORS.red },
  resetBtn:     { alignItems: "center", paddingVertical: SPACING.lg },
  resetText:    { fontSize: FONT_SIZES.sm },
});