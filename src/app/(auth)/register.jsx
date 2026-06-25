import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Button from "../../components/common/Button";
import SafeView from "../../components/common/SafeView";
import {
  COLORS, FONT_SIZES,
  RADIUS, ROLES,
  SPACING,
  VEHICLE_TYPES,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const INPUT_CLASSES = {
  container: {
    backgroundColor: COLORS.stone,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
  },
  label: {
    color: "#9CA3AF",
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  focused: {
    borderColor: COLORS.red,
  },
};

function FormField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={INPUT_CLASSES.label}>{label}</Text>
      <View style={[INPUT_CLASSES.container, focused && INPUT_CLASSES.focused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#52524E"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize ?? "words"}
          style={INPUT_CLASSES.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { role } = useLocalSearchParams();
  const { signUp } = useAuth();
  const isStaff = role === ROLES.STAFF;

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    // Staff only
    locationToken: "",
    // Rider only
    vehicleType: "",
    vehiclePlate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.phoneNumber.trim()) return "Please enter your phone number.";

    // Strip out any spaces, dashes, or special characters to look at raw digits
    const rawDigits = form.phoneNumber.replace(/\D/g, "");

    // Ghanaian numbers are typically 9 digits (without the 0) or 10 digits (with the 0)
    if (rawDigits.length < 9 || rawDigits.length > 13) {
      return "Enter a valid phone number (e.g., 023#######).";
    }

    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (isStaff && !form.locationToken.trim())
      return "Please enter your kitchen location token.";
    if (!isStaff && !form.vehicleType)
      return "Please select your vehicle type.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError("");
    setLoading(true);

    // Dynamic capitalization helper to match your backend model enum strings
    const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Staff";

    const payload = {
      role: formattedRole,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      ...(isStaff
        ? { locationToken: form.locationToken.trim() }
        : {
          vehicleType: form.vehicleType,
          vehicleRegistration: form.vehiclePlate.trim(),
        }),
    };

    try {
      await signUp(payload);
      // AuthContext routes to workspace on success
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeView variant="dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.roleTag, isStaff ? styles.roleTagRed : styles.roleTagBlue]}>
              <Text style={styles.roleTagText}>
                {isStaff ? "🍳 Kitchen Staff" : "🏍️ Delivery Rider"}
              </Text>
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              {isStaff
                ? "You'll need a location token from your manager."
                : "Tell us about your ride so we can assign deliveries correctly."}
            </Text>
          </View>

          {/* Common fields */}
          <FormField label="Full Name" value={form.name} onChangeText={set("name")} placeholder="e.g. Kwame Mensah" />
          <FormField label="Phone Number" value={form.phoneNumber} onChangeText={set("phoneNumber")} placeholder="023#######" autoCapitalize="none" keyboardType="phone-pad" />
          <FormField label="Password" value={form.password} onChangeText={set("password")} placeholder="Min. 6 characters" secureTextEntry autoCapitalize="none" />
          <FormField label="Confirm Password" value={form.confirmPassword} onChangeText={set("confirmPassword")} placeholder="Repeat password" secureTextEntry autoCapitalize="none" />

          {/* Role-specific fields */}
          {isStaff ? (
            <FormField
              label="Location Token"
              value={form.locationToken}
              onChangeText={set("locationToken")}
              placeholder="Provided by your manager"
              autoCapitalize="none"
            />
          ) : (
            <>
              {/* Vehicle type picker */}
              <Text style={INPUT_CLASSES.label}>Vehicle Type</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v.value}
                    onPress={() => set("vehicleType")(v.value)}
                    style={[
                      styles.vehicleChip,
                      form.vehicleType === v.value && styles.vehicleChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.vehicleChipText,
                      form.vehicleType === v.value && styles.vehicleChipTextActive,
                    ]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FormField
                label="Plate / ID (optional)"
                value={form.vehiclePlate}
                onChangeText={set("vehiclePlate")}
                placeholder="e.g. GR-1234-22"
                autoCapitalize="characters"
              />
            </>
          )}

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Button
            label={loading ? "" : "Create Account"}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          {/* Login link */}
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
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
    paddingBottom: SPACING["4xl"],
  },
  back: { paddingTop: SPACING.xl, marginBottom: SPACING.lg },
  backText: { color: "#9CA3AF", fontSize: FONT_SIZES.base, fontWeight: "600" },

  header: { marginBottom: SPACING["2xl"] },
  roleTag: {
    alignSelf: "flex-start",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  roleTagRed: { backgroundColor: "#FEE2E2" },
  roleTagBlue: { backgroundColor: "#DBEAFE" },
  roleTagText: { fontWeight: "700", fontSize: FONT_SIZES.sm, color: COLORS.dark },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "800",
    marginBottom: SPACING.sm,
  },
  subtitle: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, lineHeight: 20 },

  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  vehicleChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.stone,
  },
  vehicleChipActive: {
    borderColor: COLORS.red,
    backgroundColor: "#3F1212",
  },
  vehicleChipText: { color: "#9CA3AF", fontSize: FONT_SIZES.sm, fontWeight: "600" },
  vehicleChipTextActive: { color: COLORS.red },

  errorBox: {
    backgroundColor: "#3F1212",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: FONT_SIZES.sm, lineHeight: 20 },

  loginLink: { alignItems: "center", paddingVertical: SPACING.xl },
  loginLinkText: { color: "#6B7280", fontSize: FONT_SIZES.sm },
  loginLinkBold: { color: COLORS.red, fontWeight: "700" },
});
