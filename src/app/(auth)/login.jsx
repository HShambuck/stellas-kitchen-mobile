import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import {
  BRAND, COLORS, DARK_THEME, FONT_SIZES,
  LIGHT_THEME, RADIUS, SPACING,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const { signIn, error, clearError } = useAuth();
  const { role: roleParam } = useLocalSearchParams();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState((roleParam || "staff").toLowerCase().trim());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;
  const passwordRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    return () => clearError();
  }, []);

  useEffect(() => {
    if (roleParam) setSelectedRole(roleParam.toLowerCase().trim());
  }, [roleParam]);

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !password) return;
    clearError();
    setLoading(true);
    try {
      await signIn(phoneNumber.trim(), password, selectedRole);
    } catch { /* stored in AuthContext */ }
    finally { setLoading(false); }
  };

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
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* Hero */}
          <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }], paddingTop: SPACING["5xl"] }]}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SK</Text>
            </View>
            <Text style={styles.brand}>{BRAND.name.toUpperCase()}</Text>
            <Text style={[styles.headline, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              Sign in to your workspace
            </Text>
          </Animated.View>

          {/* Role toggle */}
          <View style={styles.roleRow}>
            {[
              { value: "staff", label: "🍳 Staff" },
              { value: "rider", label: "🏍️ Rider" },
            ].map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => { setSelectedRole(r.value); clearError(); }}
                style={[
                  styles.roleChip,
                  { borderColor: theme.border, backgroundColor: theme.card },
                  selectedRole === r.value && {
                    borderColor: r.value === "rider" ? "#3B82F6" : COLORS.red,
                    backgroundColor: r.value === "rider" ? "#8ebaf3" : "#f7a3a3",
                  },
                ]}
              >
                <Text style={[
                  styles.roleChipText,
                  { color: theme.textMuted },
                  selectedRole === r.value && {
                    color: r.value === "rider" ? "#3B82F6" : COLORS.red,
                  },
                ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs */}
          <View style={styles.fields}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Phone Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="023#######"
              placeholderTextColor={theme.textFaint}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: focused === "phone" ? COLORS.red : theme.border },
              ]}
              returnKeyType="next"
              onFocus={() => setFocused("phone")}
              onBlur={() => setFocused(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Password</Text>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={theme.textFaint}
              secureTextEntry
              autoCapitalize="none"
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: focused === "password" ? COLORS.red : theme.border },
              ]}
              returnKeyType="go"
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              onSubmitEditing={handleLogin}
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !phoneNumber || !password}
            size="lg"
            style={{ marginBottom: SPACING.xl }}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/user-type")}
            style={styles.link}
          >
            <Text style={[styles.linkText, { color: theme.textMuted }]}>
              New here?{"  "}
              <Text style={{ color: COLORS.red, fontWeight: "700" }}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: SPACING["2xl"] },
  hero: { alignItems: "center", marginBottom: SPACING["2xl"] },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  logoText: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "900", letterSpacing: 2 },
  brand: { color: COLORS.red, fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 3, marginBottom: SPACING.md },
  headline: { fontSize: FONT_SIZES["2xl"], fontWeight: "900", letterSpacing: -0.5, marginBottom: SPACING.xs },
  sub: { fontSize: FONT_SIZES.sm },
  roleRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xl },
  roleChip: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1.5, alignItems: "center" },
  roleChipActive: { borderColor: COLORS.red, backgroundColor: "#3F1212" },
  roleChipText: { fontSize: FONT_SIZES.sm, fontWeight: "700" },
  fields: { gap: SPACING.xs, marginBottom: SPACING.lg },
  fieldLabel: { fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: SPACING.xs },
  input: { borderRadius: RADIUS.lg, borderWidth: 1.5, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.base, marginBottom: SPACING.lg },
  errorBox: { backgroundColor: "#3F1212", borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: "#7F1D1D" },
  errorText: { color: "#FCA5A5", fontSize: FONT_SIZES.sm, lineHeight: 20 },
  link: { alignItems: "center", paddingVertical: SPACING.sm },
  linkText: { fontSize: FONT_SIZES.sm },
});