import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import {
  COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME,
  RADIUS, ROLES, SPACING, VEHICLE_TYPES,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Field({ label, value, onChangeText, placeholder, secure,
  keyboardType, autoCapitalize, returnKeyType, onSubmit, inputRef, theme, focused, onFocus, onBlur }) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        secureTextEntry={secure}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        returnKeyType={returnKeyType || "next"}
        onSubmitEditing={onSubmit}
        blurOnSubmit={!onSubmit}
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

export default function RegisterScreen() {
  const { role } = useLocalSearchParams();
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();
  const isStaff = role === ROLES.STAFF || role === "staff";

  const [form, setForm] = useState({
    name: "", phoneNumber: "", password: "", confirmPassword: "",
    locationToken: "", vehicleType: "", vehiclePlate: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState(null);

  const phoneRef   = useRef(null);
  const passRef    = useRef(null);
  const confirmRef = useRef(null);
  const tokenRef   = useRef(null);
  const plateRef   = useRef(null);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.name.trim())        return "Please enter your full name.";
    if (!form.phoneNumber.trim()) return "Please enter your phone number.";
    const d = form.phoneNumber.replace(/\D/g, "");
    if (d.length < 9 || d.length > 13) return "Enter a valid phone number.";
    if (form.password.length < 6)       return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (isStaff && !form.locationToken.trim()) return "Please enter your kitchen location token.";
    if (!isStaff && !form.vehicleType) return "Please select your vehicle type.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError("");
    setLoading(true);
    const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Staff";
    const payload = {
      role: formattedRole,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      ...(isStaff
        ? { locationToken: form.locationToken.trim() }
        : { vehicleType: form.vehicleType, vehicleRegistration: form.vehiclePlate.trim() }),
    };
    try {
      await signUp(payload);
      await SecureStore.setItemAsync("has_registered", "true");
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const fp = (name) => ({
    focused: focused === name,
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(null),
    theme,
  });

  const accent = isStaff ? COLORS.red : "#3B82F6";
  const accentBg = isStaff ? "#FEE2E2" : "#DBEAFE";

  return (
    <SafeView variant={isDark ? "dark" : "light"} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING["4xl"] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={[styles.backText, { color: theme.textMuted }]}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.roleBadge, { backgroundColor: accentBg }]}>
              <Text style={[styles.roleBadgeText, { color: accent }]}>
                {isStaff ? "🍳  Kitchen Staff" : "🏍️  Delivery Rider"}
              </Text>
            </View>
            <Text style={[styles.headline, { color: theme.text }]}>Create account</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              {isStaff
                ? "You'll need a location token from your manager"
                : "Tell us about your vehicle for delivery matching"}
            </Text>
          </View>

          {/* Fields */}
          <Field {...fp("name")}    label="Full Name"        value={form.name}           onChangeText={set("name")}           placeholder="e.g. Kwame Mensah"  onSubmit={() => phoneRef.current?.focus()} />
          <Field {...fp("phone")}   label="Phone Number"     value={form.phoneNumber}     onChangeText={set("phoneNumber")}    placeholder="023#######"         autoCapitalize="none" keyboardType="phone-pad" inputRef={phoneRef}   onSubmit={() => passRef.current?.focus()} />
          <Field {...fp("pass")}    label="Password"         value={form.password}        onChangeText={set("password")}       placeholder="Min. 6 characters"  secure autoCapitalize="none" inputRef={passRef}    onSubmit={() => confirmRef.current?.focus()} />
          <Field {...fp("confirm")} label="Confirm Password" value={form.confirmPassword} onChangeText={set("confirmPassword")}placeholder="Repeat password"    secure autoCapitalize="none" inputRef={confirmRef} returnKeyType={isStaff ? "next" : "done"} onSubmit={() => isStaff ? tokenRef.current?.focus() : null} />

          {isStaff ? (
            <Field {...fp("token")} label="Location Token" value={form.locationToken} onChangeText={set("locationToken")} placeholder="Provided by your manager" autoCapitalize="none" returnKeyType="done" inputRef={tokenRef} onSubmit={handleSubmit} />
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Vehicle Type</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v.value}
                    onPress={() => set("vehicleType")(v.value)}
                    style={[
                      styles.vehicleChip,
                      { borderColor: theme.border, backgroundColor: theme.card },
                      form.vehicleType === v.value && { borderColor: COLORS.red, backgroundColor: "#3F1212" },
                    ]}
                  >
                    <Text style={[
                      styles.vehicleChipText,
                      { color: theme.textMuted },
                      form.vehicleType === v.value && { color: COLORS.red },
                    ]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field {...fp("plate")} label="Plate / ID (optional)" value={form.vehiclePlate} onChangeText={set("vehiclePlate")} placeholder="e.g. GR-1234-22" autoCapitalize="characters" returnKeyType="done" inputRef={plateRef} onSubmit={handleSubmit} />
            </>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Create Account" onPress={handleSubmit} loading={loading} disabled={loading} size="lg" style={{ marginBottom: SPACING.xl }} />

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.link}>
            <Text style={[styles.linkText, { color: theme.textMuted }]}>
              Have an account?{"  "}
              <Text style={{ color: COLORS.red, fontWeight: "700" }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll:           { flexGrow: 1, paddingHorizontal: SPACING["2xl"] },
  back:             { paddingTop: SPACING.xl, marginBottom: SPACING.lg },
  backText:         { fontSize: FONT_SIZES.base, fontWeight: "600" },
  header:           { marginBottom: SPACING["2xl"] },
  roleBadge:        { alignSelf: "flex-start", paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, marginBottom: SPACING.lg },
  roleBadgeText:    { fontSize: FONT_SIZES.sm, fontWeight: "700" },
  headline:         { fontSize: FONT_SIZES["2xl"], fontWeight: "900", marginBottom: SPACING.sm, letterSpacing: -0.5 },
  sub:              { fontSize: FONT_SIZES.sm, lineHeight: 20 },
  fieldLabel:       { fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: SPACING.xs },
  input:            { borderRadius: RADIUS.lg, borderWidth: 1.5, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.base },
  vehicleGrid:      { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg, marginTop: SPACING.xs },
  vehicleChip:      { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.full, borderWidth: 1.5 },
  vehicleChipText:  { fontSize: FONT_SIZES.sm, fontWeight: "600" },
  errorBox:         { backgroundColor: "#3F1212", borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: "#7F1D1D" },
  errorText:        { color: "#FCA5A5", fontSize: FONT_SIZES.sm, lineHeight: 20 },
  link:             { alignItems: "center", paddingVertical: SPACING.sm },
  linkText:         { fontSize: FONT_SIZES.sm },
});