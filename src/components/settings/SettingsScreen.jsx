import { useState } from "react";
import {
  Alert, Modal, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME, RADIUS, SPACING } from "../../constants/theme";

function Row({ label, value, onPress, danger, theme, rightEl }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: theme.border }]}
    >
      <Text style={[styles.rowLabel, { color: danger ? COLORS.red : theme.text }]}>
        {label}
      </Text>
      {rightEl ?? (
        <>
          {value && <Text style={[styles.rowValue, { color: theme.textMuted }]}>{value}</Text>}
          {onPress && !rightEl && (
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

function EditModal({ visible, title, fieldLabel, secure, onClose, onSave, theme }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSave = () => {
    if (!value.trim()) {
      Alert.alert("Error", `${fieldLabel} cannot be empty.`);
      return;
    }
    if (secure && value !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    onSave(value);
    setValue("");
    setConfirm("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{fieldLabel}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            secureTextEntry={secure}
            autoCapitalize="none"
            placeholderTextColor={theme.textFaint}
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
          />

          {secure && (
            <>
              <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: SPACING.md }]}>
                Confirm Password
              </Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={theme.textFaint}
                placeholder="Confirm password"
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: COLORS.red }]}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen({ roleLabel, roleEmoji }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const [modal, setModal] = useState(null); // "phone" | "password" | null

  const confirmSignOut = () =>
    Alert.alert("Sign Out", "You will need to log in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);

  const handleSavePhone = (newPhone) => {
    // TODO: wire to PATCH /api/auth/update-phone when backend is ready
    Alert.alert("Coming Soon", "Phone number update will be available soon.");
  };

  const handleSavePassword = (newPassword) => {
    // TODO: wire to PATCH /api/auth/update-password when backend is ready
    Alert.alert("Coming Soon", "Password update will be available soon.");
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

        {/* ── Profile card ── */}
        <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Profile</Text>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.name ?? "User"}
              </Text>
              <Text style={[styles.userPhone, { color: theme.textMuted }]}>
                {user?.phoneNumber ?? "—"}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: isDark ? "#3F1212" : COLORS.redLight }]}>
                <Text style={[styles.roleBadgeText, { color: COLORS.red }]}>
                  {roleEmoji} {roleLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account ── */}
        <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Row theme={theme} label="Name"         value={user?.name} />
          <Row theme={theme} label="Phone Number" value={user?.phoneNumber}
            onPress={() => setModal("phone")} />
          <Row theme={theme} label="Role"         value={roleLabel} />
          <Row theme={theme} label="Change Password"
            onPress={() => setModal("password")} />
        </View>

        {/* ── Appearance ── */}
        <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Row
            theme={theme}
            label="Dark Mode"
            rightEl={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: COLORS.lightBorder, true: COLORS.red }}
                thumbColor={COLORS.white}
              />
            }
          />
        </View>

        {/* ── App info ── */}
        <Text style={[styles.sectionHeader, { color: theme.textFaint }]}>App</Text>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Row theme={theme} label="Version" value="1.0.0" />
          <Row theme={theme} label="Backend" value="Stella's Kitchen API" />
        </View>

        {/* ── Sign out ── */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, marginTop: SPACING["2xl"] }]}>
          <Row theme={theme} label="Sign Out" onPress={confirmSignOut} danger />
        </View>
      </ScrollView>

      <EditModal
        visible={modal === "phone"}
        title="Change Phone Number"
        fieldLabel="New Phone Number"
        secure={false}
        theme={theme}
        onClose={() => setModal(null)}
        onSave={handleSavePhone}
      />
      <EditModal
        visible={modal === "password"}
        title="Change Password"
        fieldLabel="New Password"
        secure={true}
        theme={theme}
        onClose={() => setModal(null)}
        onSave={handleSavePassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { paddingHorizontal: SPACING["2xl"] },
  pageTitle:   { fontSize: FONT_SIZES["2xl"], fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING["2xl"] },
  sectionHeader: { fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACING.sm, marginTop: SPACING.xl },
  section:     { borderRadius: RADIUS["2xl"], borderWidth: 1, overflow: "hidden" },
  avatarRow:   { flexDirection: "row", alignItems: "center", padding: SPACING["2xl"], gap: SPACING.lg },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center" },
  avatarText:  { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800" },
  userName:    { fontSize: FONT_SIZES.md, fontWeight: "700" },
  userPhone:   { fontSize: FONT_SIZES.sm, marginTop: 2 },
  roleBadge:   { marginTop: SPACING.xs, alignSelf: "flex-start", paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  roleBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: "700" },
  row:         { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, borderBottomWidth: 1 },
  rowLabel:    { fontSize: FONT_SIZES.base, flex: 1 },
  rowValue:    { fontSize: FONT_SIZES.sm },
  chevron:     { fontSize: FONT_SIZES.lg, marginLeft: SPACING.sm },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet:  { borderTopLeftRadius: RADIUS["3xl"], borderTopRightRadius: RADIUS["3xl"], padding: SPACING["2xl"], paddingBottom: SPACING["4xl"], borderTopWidth: 1 },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: SPACING.xl },
  modalTitle:  { fontSize: FONT_SIZES.xl, fontWeight: "800", marginBottom: SPACING.xl },
  inputLabel:  { fontSize: FONT_SIZES.sm, fontWeight: "600", marginBottom: SPACING.xs },
  input:       { borderWidth: 1, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.base },
  saveBtn:     { borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: "center", marginTop: SPACING.xl },
  saveBtnText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.base },
  cancelBtn:   { alignItems: "center", paddingVertical: SPACING.md },
  cancelBtnText: { fontSize: FONT_SIZES.sm },
});