import { useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createOrder } from "../../api/orders";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import {
    COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME, RADIUS, SPACING,
} from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";


const { width: SCREEN_W } = Dimensions.get("window");

// ─── Menu catalogue ───────────────────────────────────────────────────────────
// tiers: null  → no price tiers, staff types a price manually
// tiers: [n,…] → quick-tap price buttons; "Custom" pill always appended
const MENU_PAGES = [
    // Page 1 — Top 6 popular
    [
        { name: "Pizza", tiers: [80, 100, 120] },
        { name: "Fried Rice", tiers: [50, 60] },
        { name: "Jollof Rice", tiers: [50, 60] },
        { name: "Banku & Tilapia", tiers: [55, 75] },
        { name: "Spaghetti", tiers: [40, 60] },
        { name: "Shawarma", tiers: [40, 55] },
    ],
    // Page 2 — Remaining items
    [
        { name: "Burger", tiers: [50, 65] },
        { name: "Assorted Jollof", tiers: [45, 65] },
        { name: "Assorted Fried", tiers: [45, 65] },
        { name: "French Fries", tiers: [20, 35] },
        { name: "Cake", tiers: [30, 45] },
        { name: "Loaded Fries", tiers: [35] },
        { name: "Sobolo / Drink", tiers: [15, 20] },
    ],
];

const ALL_MENU = MENU_PAGES.flat();

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns a fresh cart-item object for a given menu entry
function freshCartItem(menuItem) {
    const firstTier = menuItem.tiers?.[0] ?? null;
    return {
        name: menuItem.name,
        tiers: menuItem.tiers,
        price: firstTier !== null ? String(firstTier) : "",
        useCustom: false,
        customPrice: "",
        quantity: 1,
    };
}

// Effective unit price for a cart item
function effectivePrice(item) {
    if (item.useCustom) return parseFloat(item.customPrice) || 0;
    return parseFloat(item.price) || 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Page-indicator dots beneath the carousel
function PageDots({ total, current, theme }) {
    return (
        <View style={styles.dotsRow}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            backgroundColor:
                                i === current ? COLORS.red : theme.border,
                            width: i === current ? 16 : 6,
                        },
                    ]}
                />
            ))}
        </View>
    );
}

// A single quick-select chip inside the carousel
function MenuChip({ item, isSelected, onPress, theme }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.chip,
                {
                    backgroundColor: isSelected ? COLORS.red : theme.inputBg,
                    borderColor: isSelected ? COLORS.red : theme.border,
                },
            ]}
        >
            <Text
                style={[styles.chipName, { color: isSelected ? COLORS.white : theme.text }]}
                numberOfLines={1}
            >
                {item.name}
            </Text>
            <Text
                style={[
                    styles.chipPrice,
                    { color: isSelected ? "rgba(255,255,255,0.75)" : theme.textMuted },
                ]}
            >
                {item.tiers ? `GHS ${item.tiers[0]}+` : "Custom"}
            </Text>
        </TouchableOpacity>
    );
}

// Tier price buttons + optional custom price input for one cart item
function PriceTierRow({ item, onSetTier, onToggleCustom, onCustomPriceChange, focused, onFocus, onBlur, theme }) {
    const tiers = item.tiers ?? [];

    return (
        <View style={styles.tierWrap}>
            <Text style={[styles.tierLabel, { color: theme.textFaint }]}>Price</Text>
            <View style={styles.tierRow}>
                {tiers.map((t) => {
                    const active = !item.useCustom && String(t) === item.price;
                    return (
                        <TouchableOpacity
                            key={t}
                            onPress={() => onSetTier(String(t))}
                            style={[
                                styles.tierBtn,
                                {
                                    backgroundColor: active ? COLORS.red : theme.inputBg,
                                    borderColor: active ? COLORS.red : theme.border,
                                },
                            ]}
                        >
                            <Text style={[styles.tierBtnText, { color: active ? COLORS.white : theme.text }]}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {/* Custom price pill */}
                <TouchableOpacity
                    onPress={onToggleCustom}
                    style={[
                        styles.tierBtn,
                        {
                            backgroundColor: item.useCustom ? COLORS.redDark ?? "#DC2626" : theme.inputBg,
                            borderColor: item.useCustom ? COLORS.red : theme.border,
                        },
                    ]}
                >
                    <Text style={[
                        styles.tierBtnText,
                        { color: item.useCustom ? COLORS.white : theme.textMuted },
                    ]}>
                        Custom
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Custom price input — revealed when "Custom" is active */}
            {item.useCustom && (
                <TextInput
                    value={item.customPrice}
                    onChangeText={onCustomPriceChange}
                    placeholder="Enter price (GHS)"
                    placeholderTextColor={theme.textFaint}
                    keyboardType="decimal-pad"
                    style={[
                        styles.customPriceInput,
                        {
                            backgroundColor: theme.inputBg,
                            color: theme.text,
                            borderColor: focused ? COLORS.red : theme.border,
                        },
                    ]}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            )}
        </View>
    );
}

// Full active cart row — tier selector + stepper + subtotal
function CartItemRow({ item, index, onSetTier, onToggleCustom, onCustomPrice,
    onQtyChange, onRemove, focused, onFocus, onBlur, theme }) {
    const unitPrice = effectivePrice(item);
    const subtotal = (item.quantity * unitPrice).toFixed(2);

    return (
        <View style={[styles.cartRow, { borderBottomColor: theme.border }]}>
            {/* Header */}
            <View style={styles.cartRowHeader}>
                <Text style={[styles.cartName, { color: theme.text }]}>{item.name}</Text>
                <TouchableOpacity onPress={() => onRemove(index)}>
                    <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Tier / price selector */}
            <PriceTierRow
                item={item}
                onSetTier={(v) => onSetTier(index, v)}
                onToggleCustom={() => onToggleCustom(index)}
                onCustomPriceChange={(v) => onCustomPrice(index, v)}
                focused={focused === `cp-${index}`}
                onFocus={() => onFocus(`cp-${index}`)}
                onBlur={onBlur}
                theme={theme}
            />

            {/* Qty stepper + subtotal */}
            <View style={styles.cartRowFooter}>
                <View style={styles.stepper}>
                    <TouchableOpacity
                        onPress={() => onQtyChange(index, item.quantity - 1)}
                        style={[styles.stepBtn, { backgroundColor: theme.border }]}
                    >
                        <Text style={[styles.stepTxt, { color: theme.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepQty, { color: theme.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                        onPress={() => onQtyChange(index, item.quantity + 1)}
                        style={[styles.stepBtn, { backgroundColor: COLORS.red }]}
                    >
                        <Text style={[styles.stepTxt, { color: COLORS.white }]}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// Custom item row for anything not on the menu
function CustomItemRow({ item, index, onUpdate, onRemove, focused, onFocus, onBlur, theme }) {
    const unitPrice = parseFloat(item.price) || 0;
    const subtotal = (item.quantity * unitPrice).toFixed(2);

    return (
        <View style={[styles.cartRow, { borderBottomColor: theme.border }]}>
            <View style={styles.cartRowHeader}>
                <Text style={[styles.tierLabel, { color: theme.textFaint }]}>Custom Item</Text>
                <TouchableOpacity onPress={() => onRemove(index)}>
                    <Text style={styles.removeText}>✕ Remove</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.customFields}>
                <TextInput
                    value={item.name}
                    onChangeText={(v) => onUpdate(index, "name", v)}
                    placeholder="Item name"
                    placeholderTextColor={theme.textFaint}
                    style={[
                        styles.customInput,
                        {
                            flex: 2, backgroundColor: theme.inputBg, color: theme.text,
                            borderColor: focused === `cn-${index}` ? COLORS.red : theme.border
                        },
                    ]}
                    onFocus={() => onFocus(`cn-${index}`)}
                    onBlur={onBlur}
                />
                <View style={{ width: SPACING.sm }} />
                <TextInput
                    value={item.price}
                    onChangeText={(v) => onUpdate(index, "price", v)}
                    placeholder="GHS"
                    placeholderTextColor={theme.textFaint}
                    keyboardType="decimal-pad"
                    style={[
                        styles.customInput,
                        {
                            flex: 1, backgroundColor: theme.inputBg, color: theme.text,
                            borderColor: focused === `cp2-${index}` ? COLORS.red : theme.border
                        },
                    ]}
                    onFocus={() => onFocus(`cp2-${index}`)}
                    onBlur={onBlur}
                />
            </View>

            <View style={[styles.stepper, { marginTop: SPACING.sm }]}>
                <TouchableOpacity
                    onPress={() => onUpdate(index, "quantity", Math.max(1, item.quantity - 1))}
                    style={[styles.stepBtn, { backgroundColor: theme.border }]}
                >
                    <Text style={[styles.stepTxt, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.stepQty, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity
                    onPress={() => onUpdate(index, "quantity", item.quantity + 1)}
                    style={[styles.stepBtn, { backgroundColor: COLORS.red }]}
                >
                    <Text style={[styles.stepTxt, { color: COLORS.white }]}>+</Text>
                </TouchableOpacity>
                {unitPrice > 0 && (
                    <Text style={[styles.subtotalText, { color: theme.textMuted, marginLeft: SPACING.md }]}>
                        = GHS {subtotal}
                    </Text>
                )}
            </View>
        </View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NewOrder() {
    const { isDark } = useTheme();
    const theme = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();
    const tabBarHeight = 68 + insets.bottom;

    // Carousel state
    const carouselRef = useRef(null);
    const [activePage, setActivePage] = useState(0);

    // Cart state
    const [cartItems, setCartItems] = useState([]); // selected menu items
    const [customItems, setCustomItems] = useState([]); // free-type items

    // Customer fields
    const [phoneNumber, setPhoneNumber] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [customerName, setCustomerName] = useState("");

    // UI state
    const [focused, setFocused] = useState(null);
    const [loading, setLoading] = useState(false);

    const phoneRef = useRef(null);
    const addressRef = useRef(null);

    // ── Carousel page tracking ────────────────────────────────────────────
    const handleCarouselScroll = (e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
        setActivePage(page);
    };

    // ── Quick-select tap/untap ────────────────────────────────────────────
    const handleChipTap = (menuItem) => {
        const exists = cartItems.findIndex((i) => i.name === menuItem.name);
        if (exists !== -1) {
            // Untap → remove from cart
            setCartItems((prev) => prev.filter((_, i) => i !== exists));
        } else {
            // Tap → add with defaults
            setCartItems((prev) => [...prev, freshCartItem(menuItem)]);
        }
    };

    // ── Cart item mutations ───────────────────────────────────────────────
    const setCartTier = (index, price) =>
        setCartItems((prev) => prev.map((item, i) =>
            i === index ? { ...item, price, useCustom: false, customPrice: "" } : item
        ));

    const toggleCartCustom = (index) =>
        setCartItems((prev) => prev.map((item, i) =>
            i === index ? { ...item, useCustom: !item.useCustom } : item
        ));

    const setCartCustomPrice = (index, customPrice) =>
        setCartItems((prev) => prev.map((item, i) =>
            i === index ? { ...item, customPrice } : item
        ));

    const setCartQty = (index, newQty) => {
        if (newQty < 1) {
            setCartItems((prev) => prev.filter((_, i) => i !== index));
        } else {
            setCartItems((prev) => prev.map((item, i) =>
                i === index ? { ...item, quantity: newQty } : item
            ));
        }
    };

    const removeCartItem = (index) =>
        setCartItems((prev) => prev.filter((_, i) => i !== index));

    // ── Custom item mutations ─────────────────────────────────────────────
    const addCustomItem = () =>
        setCustomItems((prev) => [
            ...prev,
            { name: "", price: "", quantity: 1 },
        ]);

    const updateCustomItem = (index, field, value) =>
        setCustomItems((prev) => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));

    const removeCustomItem = (index) =>
        setCustomItems((prev) => prev.filter((_, i) => i !== index));

    // ── Derived values ────────────────────────────────────────────────────
    const validCartItems = cartItems.filter((i) => effectivePrice(i) > 0);
    const validCustomItems = customItems.filter(
        (i) => i.name.trim() && parseFloat(i.price) > 0
    );
    const allItems = [...validCartItems, ...validCustomItems];
    const hasItems = allItems.length > 0;
    const total = [
        ...cartItems.map((i) => i.quantity * effectivePrice(i)),
        ...customItems.map((i) => i.quantity * (parseFloat(i.price) || 0)),
    ].reduce((a, b) => a + b, 0);

    // ── Validation ────────────────────────────────────────────────────────
    const validate = () => {
        if (!hasItems)
            return "Add at least one item to the order.";
        for (const item of cartItems) {
            if (effectivePrice(item) <= 0)
                return `Set a price for "${item.name}".`;
        }
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const err = validate();
        if (err) { Alert.alert("Missing info", err); return; }

        setLoading(true);
        const payload = {
            customerName: customerName.trim() || phoneNumber.trim() || "Manual Order",
            phoneNumber: phoneNumber.trim(),
            deliveryAddress: deliveryAddress.trim() || "Pickup / Call Customer",
            channelSource: "Manual",
            statusState: "Pending",
            totalAmount: parseFloat(total.toFixed(2)),
            items: allItems.map((item) => ({
                foodItemName: item.name.trim(),
                quantity: parseInt(item.quantity, 10),
                price: parseFloat(
                    item.useCustom ? item.customPrice : item.price
                ),
            })),
        };

        try {
            await createOrder(payload);
            Alert.alert(
                "✅ Order Created",
                `Order for ${phoneNumber} placed successfully.`,
                [{ text: "New Order", onPress: resetForm }]
            );
        } catch (e) {
            Alert.alert("Failed", e.message || "Could not create order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCartItems([]);
        setCustomItems([]);
        setCustomerName("");
        setPhoneNumber("");
        setDeliveryAddress("");
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingBottom: tabBarHeight + SPACING["4xl"] },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Page title ─────────────────────────────────────────── */}
                    <Text style={[styles.pageTitle, { color: theme.text }]}>New Order</Text>
                    <Text style={[styles.pageSub, { color: theme.textMuted }]}>
                        Tap to add · swipe for more items
                    </Text>

                    {/* ══════════════════════════════════════════════════════════
              SECTION 1 — PAGINATED QUICK-SELECT CAROUSEL
          ══════════════════════════════════════════════════════════ */}
                    <View style={[styles.carouselCard,
                    { backgroundColor: theme.card, borderColor: theme.border }]}>

                        {/* Horizontal paging ScrollView — swipe independent of item taps */}
                        <ScrollView
                            ref={carouselRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleCarouselScroll}
                            // scrollEventThrottle keeps page tracking snappy
                            scrollEventThrottle={16}
                            // directionalLockEnabled ensures horizontal swipe never
                            // bleeds into the parent vertical ScrollView
                            directionalLockEnabled
                            style={styles.carousel}
                        >
                            {MENU_PAGES.map((page, pageIndex) => (
                                <View
                                    key={pageIndex}
                                    style={[styles.carouselPage, { width: SCREEN_W - SPACING["2xl"] * 2 - SPACING["2xl"] }]}
                                >
                                    {/* 2-column chip grid per page */}
                                    <View style={styles.chipGrid}>
                                        {page.map((menuItem) => {
                                            const isSelected = cartItems.some((i) => i.name === menuItem.name);
                                            return (
                                                <MenuChip
                                                    key={menuItem.name}
                                                    item={menuItem}
                                                    isSelected={isSelected}
                                                    onPress={() => handleChipTap(menuItem)}
                                                    theme={theme}
                                                />
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Page label + dots */}
                        <View style={styles.carouselFooter}>
                            <Text style={[styles.pageLabel, { color: theme.textFaint }]}>
                                {activePage === 0 ? "⭐ Popular" : "More items"}
                            </Text>
                            <PageDots total={MENU_PAGES.length} current={activePage} theme={theme} />
                        </View>
                    </View>

                    {/* ══════════════════════════════════════════════════════════
              SECTION 2 — ACTIVE ORDER ITEMS
          ══════════════════════════════════════════════════════════ */}
                    {(cartItems.length > 0 || customItems.length > 0) && (
                        <>
                            <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>
                                Order Items ({cartItems.length + customItems.length})
                            </Text>
                            <View style={[styles.section,
                            { backgroundColor: theme.card, borderColor: theme.border }]}>

                                {/* Menu-selected items with tier pricing */}
                                {cartItems.map((item, index) => (
                                    <CartItemRow
                                        key={`cart-${item.name}`}
                                        item={item}
                                        index={index}
                                        onSetTier={setCartTier}
                                        onToggleCustom={toggleCartCustom}
                                        onCustomPrice={setCartCustomPrice}
                                        onQtyChange={setCartQty}
                                        onRemove={removeCartItem}
                                        focused={focused}
                                        onFocus={setFocused}
                                        onBlur={() => setFocused(null)}
                                        theme={theme}
                                    />
                                ))}

                                {/* Custom free-type items */}
                                {customItems.map((item, index) => (
                                    <CustomItemRow
                                        key={`custom-${index}`}
                                        item={item}
                                        index={index}
                                        onUpdate={updateCustomItem}
                                        onRemove={removeCustomItem}
                                        focused={focused}
                                        onFocus={setFocused}
                                        onBlur={() => setFocused(null)}
                                        theme={theme}
                                    />
                                ))}

                                {/* Add custom item */}
                                <TouchableOpacity
                                    onPress={addCustomItem}
                                    style={[styles.addCustomBtn, { borderColor: theme.border }]}
                                >
                                    <Text style={[styles.addCustomText, { color: COLORS.red }]}>
                                        ＋ Add item not on menu
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Empty state — show add custom when nothing selected */}
                    {cartItems.length === 0 && customItems.length === 0 && (
                        <TouchableOpacity
                            onPress={addCustomItem}
                            style={[styles.addCustomBtn, styles.addCustomStandalone,
                            { borderColor: theme.border, backgroundColor: theme.card }]}
                        >
                            <Text style={[styles.addCustomText, { color: COLORS.red }]}>
                                ＋ Add item not on menu
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* ── Grand total ─────────────────────────────────────────── */}
                    {hasItems && (
                        <View style={[styles.totalCard,
                        { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Grand Total</Text>
                            <Text style={styles.totalAmount}>GHS {total.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════════
    SECTION 3 — CUSTOMER DETAILS (bottom, minimal)
══════════════════════════════════════════════════════════ */}
                    <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Customer</Text>
                    <View style={[styles.section,
                    { backgroundColor: theme.card, borderColor: theme.border }]}>

                        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                            Customer Name{" "}
                            <Text style={{ color: theme.textFaint }}>(optional)</Text>
                        </Text>
                        <TextInput
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder="e.g. Ama or Table 3"
                            placeholderTextColor={theme.textFaint}
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={() => phoneRef.current?.focus()}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBg,
                                    color: theme.text,
                                    borderColor: focused === "name" ? COLORS.red : theme.border,
                                    marginBottom: SPACING.lg,
                                },
                            ]}
                            onFocus={() => setFocused("name")}
                            onBlur={() => setFocused(null)}
                        />

                        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                            Phone Number{" "}
                            <Text style={{ color: theme.textFaint }}>(optional)</Text>
                        </Text>
                        <TextInput
                            ref={phoneRef}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="023#######"
                            placeholderTextColor={theme.textFaint}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => addressRef.current?.focus()}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBg,
                                    color: theme.text,
                                    borderColor: focused === "phone" ? COLORS.red : theme.border,
                                    marginBottom: SPACING.lg,
                                },
                            ]}
                            onFocus={() => setFocused("phone")}
                            onBlur={() => setFocused(null)}
                        />

                        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                            Delivery Location{" "}
                            <Text style={{ color: theme.textFaint }}>(optional)</Text>
                        </Text>
                        <TextInput
                            ref={addressRef}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            placeholder="e.g. Shai Hills, Community 3"
                            placeholderTextColor={theme.textFaint}
                            autoCapitalize="sentences"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBg,
                                    color: theme.text,
                                    borderColor: focused === "address" ? COLORS.red : theme.border,
                                },
                            ]}
                            onFocus={() => setFocused("address")}
                            onBlur={() => setFocused(null)}
                        />

                        <Text style={[styles.addressHint, { color: theme.textFaint }]}>
                            All fields optional for walk-ins. Add a number or location for delivery orders.
                        </Text>
                    </View>

                    {/* ── Submit ──────────────────────────────────────────────── */}
                    <Button
                        label="Create Order"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading || !hasItems}
                        size="lg"
                        style={{ marginTop: SPACING.lg }}
                    />

                    <TouchableOpacity onPress={resetForm} style={styles.resetBtn}>
                        <Text style={[styles.resetText, { color: theme.textFaint }]}>Clear form</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: SPACING["2xl"],
    },

    pageTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: "800",
        paddingTop: SPACING.xl,
        marginBottom: SPACING.xs,
    },
    pageSub: {
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.lg,
    },

    sectionHeader: {
        fontSize: FONT_SIZES.xs,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: SPACING.sm,
        marginTop: SPACING.lg,
    },
    section: {
        borderRadius: RADIUS["2xl"],
        borderWidth: 1,
        padding: SPACING["2xl"],
        marginBottom: SPACING.sm,
    },

    // ── Carousel ──────────────────────────────────────────────────────────
    carouselCard: {
        borderRadius: RADIUS["2xl"],
        borderWidth: 1,
        overflow: "hidden",
        marginBottom: SPACING.sm,
    },
    carousel: {
        // Height fits exactly 3 rows of chips so the card never grows
        // and never pushes content below the fold
    },
    carouselPage: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
    },
    chipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACING.sm,
    },
    chip: {
        // Each chip takes ~half the row minus gap
        width: "48%",
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.xl,
        borderWidth: 1.5,
        alignItems: "center",
    },
    chipName: {
        fontSize: FONT_SIZES.sm,
        fontWeight: "700",
    },
    chipPrice: {
        fontSize: FONT_SIZES.xs,
        marginTop: 2,
    },
    carouselFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    pageLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: "600",
    },
    dotsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    dot: {
        height: 6,
        borderRadius: RADIUS.full,
    },

    // ── Cart rows ─────────────────────────────────────────────────────────
    cartRow: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        marginBottom: SPACING.xs,
    },
    cartRowHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.sm,
    },
    cartName: {
        fontSize: FONT_SIZES.base,
        fontWeight: "700",
    },
    removeText: {
        color: COLORS.red,
        fontSize: FONT_SIZES.xs,
        fontWeight: "700",
    },
    cartRowFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-betweent",
        marginTop: SPACING.sm,
        flexWrap: "wrap",
        gap: SPACING.sm,
    },
    subtotalText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: "600",
    },

    // ── Tier pricing ─────────────────────────────────────────────────────
    tierWrap: {
        marginTop: SPACING.xs,
    },
    tierLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: "700",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: SPACING.xs,
    },
    tierRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACING.xs,
    },
    tierBtn: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.full,
        borderWidth: 1.5,
        minWidth: 52,
        alignItems: "center",
    },
    tierBtnText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: "700",
    },
    customPriceInput: {
        borderRadius: RADIUS.lg,
        borderWidth: 1.5,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
        marginTop: SPACING.sm,
    },

    // ── Stepper ───────────────────────────────────────────────────────────
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.xs,
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.full,
        alignItems: "center",
        justifyContent: "center",
    },
    stepTxt: {
        fontSize: FONT_SIZES.md,
        fontWeight: "800",
        lineHeight: 22,
    },
    stepQty: {
        fontSize: FONT_SIZES.base,
        fontWeight: "800",
        minWidth: 28,
        textAlign: "center",
    },

    // ── Custom item ───────────────────────────────────────────────────────
    customFields: {
        flexDirection: "row",
        alignItems: "center",
    },
    customInput: {
        borderRadius: RADIUS.lg,
        borderWidth: 1.5,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
    },

    // ── Add custom button ─────────────────────────────────────────────────
    addCustomBtn: {
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: "center",
        marginTop: SPACING.md,
    },
    addCustomStandalone: {
        marginTop: SPACING.sm,
    },
    addCustomText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: "700",
    },

    // ── Total card ────────────────────────────────────────────────────────
    totalCard: {
        borderRadius: RADIUS["2xl"],
        borderWidth: 1,
        padding: SPACING["2xl"],
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: SPACING.sm,
    },
    totalLabel: {
        fontSize: FONT_SIZES.base,
        fontWeight: "600",
    },
    totalAmount: {
        fontSize: FONT_SIZES["2xl"],
        fontWeight: "900",
        color: COLORS.red,
    },

    // ── Customer fields ───────────────────────────────────────────────────
    fieldLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: "700",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: SPACING.xs,
    },
    input: {
        borderRadius: RADIUS.lg,
        borderWidth: 1.5,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.base,
        minHeight: 48,
    },
    addressHint: {
        fontSize: FONT_SIZES.xs,
        marginTop: SPACING.sm,
        lineHeight: 17,
    },

    // ── Footer ────────────────────────────────────────────────────────────
    resetBtn: {
        alignItems: "center",
        paddingVertical: SPACING.lg,
    },
    resetText: {
        fontSize: FONT_SIZES.sm,
    },
});