import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import { BRAND, COLORS, FONT_SIZES, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { signIn, error, clearError } = useAuth();
  const { role: roleParam } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState(
    (roleParam || "staff").toLowerCase().trim()
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
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
    } catch {
      // stored in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.inputWrap,
    focused === field && styles.inputFocused,
  ];

  // How far to shift the view up on iOS when keyboard appears.
  // We add the top inset so the logo doesn't disappear behind the status bar.
  const keyboardOffset = Platform.OS === "ios" ? insets.top + 10 : 0;

  return (
    <SafeView variant="dark" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + SPACING["4xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Automatically scroll to the focused field
          keyboardDismissMode="interactive"
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Choose role</Text>
          </TouchableOpacity>

          {/* Logo */}
          <Animated.View
            style={[styles.logoSection, {
              opacity: logoAnim,
              transform: [{
                translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              }],
            }]}
          >
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>SK</Text>
            </View>
            <Text style={styles.brandName}>{BRAND.name}</Text>
            <Text style={styles.headline}>Welcome back</Text>
            <Text style={styles.subheadline}>Sign in to your workspace</Text>
          </Animated.View>

          {/* Form card */}
          <View style={styles.card}>

            {/* Role toggle */}
            <Text style={styles.fieldLabel}>Signing in as</Text>
            <View style={styles.roleToggleRow}>
              {[
                { value: "staff", label: "🍳  Kitchen Staff" },
                { value: "rider", label: "🏍️  Rider" },
              ].map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => { setSelectedRole(r.value); clearError(); }}
                  style={[
                    styles.roleChip,
                    selectedRole === r.value && styles.roleChipActive,
                  ]}
                >
                  <Text style={[
                    styles.roleChipText,
                    selectedRole === r.value && styles.roleChipTextActive,
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone */}
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={inputStyle("phoneNumber")}>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="023#######"
                placeholderTextColor="#52524E"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                returnKeyType="next"
                onFocus={() => setFocused("phoneNumber")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={inputStyle("password")}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor="#52524E"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
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
              style={{ marginTop: SPACING.sm }}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/user-type")}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              New to Stella's?{" "}
              <Text style={styles.registerLinkBold}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING["2xl"],
  },
  back: { paddingTop: SPACING.xl, marginBottom: SPACING.xl },
  backText: { color: "#9CA3AF", fontSize: FONT_SIZES.base, fontWeight: "600" },

  logoSection: { alignItems: "center", marginBottom: SPACING["2xl"] },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  logoText: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: "900", letterSpacing: 1 },
  brandName: {
    color: "#6B7280",
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: SPACING.md,
  },
  headline: {
    color: COLORS.white,
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subheadline: { color: "#9CA3AF", fontSize: FONT_SIZES.sm },

  card: {
    backgroundColor: COLORS.stone,
    borderRadius: RADIUS["3xl"],
    padding: SPACING["2xl"],
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING["2xl"],
  },
  fieldLabel: {
    color: "#9CA3AF",
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },

  roleToggleRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  roleChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.dark,
  },
  roleChipActive: { borderColor: COLORS.red, backgroundColor: "#3F1212" },
  roleChipText: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, fontWeight: "600" },
  roleChipTextActive: { color: COLORS.red },

  inputWrap: {
    backgroundColor: "#1C1917",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  inputFocused: { borderColor: COLORS.red },
  input: { color: COLORS.white, fontSize: FONT_SIZES.base, minHeight: 24 },

  errorBox: {
    backgroundColor: "#3F1212",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: FONT_SIZES.sm, lineHeight: 20 },

  registerLink: { alignItems: "center", paddingVertical: SPACING.md },
  registerLinkText: { color: "#6B7280", fontSize: FONT_SIZES.sm },
  registerLinkBold: { color: COLORS.red, fontWeight: "700" },
});