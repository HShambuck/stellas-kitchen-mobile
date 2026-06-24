import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import SafeView from "../../components/common/SafeView";
import { useAuth } from "../../context/AuthContext";
import { COLORS, FONT_SIZES, SPACING, RADIUS } from "../../constants/theme";

function SettingsRow({ label, value, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.row}
    >
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function StaffSettings() {
  const { user, signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert("Sign Out", "You will need to log in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);

  return (
    <SafeView variant="dark">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile */}
        <Text style={styles.sectionHeader}>Profile</Text>
        <View style={styles.section}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() ?? "S"}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name ?? "Staff Member"}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🍳 Kitchen Staff</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.section}>
          <SettingsRow label="Name"  value={user?.name}  />
          <SettingsRow label="Email" value={user?.email} />
          <SettingsRow label="Role"  value="Kitchen Staff" />
        </View>

        {/* App */}
        <Text style={styles.sectionHeader}>App</Text>
        <View style={styles.section}>
          <SettingsRow label="Version" value="1.0.0" />
          <SettingsRow label="Backend" value="Stella's Kitchen API" />
        </View>

        {/* Danger zone */}
        <View style={[styles.section, { marginTop: SPACING["2xl"] }]}>
          <SettingsRow label="Sign Out" onPress={confirmSignOut} danger />
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["4xl"] },
  pageTitle: {
    color: COLORS.white, fontSize: FONT_SIZES["2xl"],
    fontWeight: "800", paddingTop: SPACING.xl, marginBottom: SPACING["2xl"],
  },
  sectionHeader: {
    color: "#6B7280", fontSize: FONT_SIZES.xs,
    fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase",
    marginBottom: SPACING.sm, marginTop: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.stone,
    borderRadius:    RADIUS["2xl"],
    borderWidth:     1,
    borderColor:     COLORS.border,
    overflow:        "hidden",
  },
  avatarRow: {
    flexDirection: "row", alignItems: "center", padding: SPACING["2xl"], gap: SPACING.lg,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: FONT_SIZES.xl, fontWeight: "800" },
  userName:   { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: "700" },
  userEmail:  { color: "#9CA3AF", fontSize: FONT_SIZES.sm, marginTop: 2 },
  roleBadge: {
    marginTop: SPACING.xs, alignSelf: "flex-start",
    backgroundColor: "#3F1212", paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: RADIUS.full,
  },
  roleBadgeText: { color: COLORS.red, fontSize: FONT_SIZES.xs, fontWeight: "700" },

  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel:   { color: COLORS.white, fontSize: FONT_SIZES.base, flex: 1 },
  rowValue:   { color: "#9CA3AF", fontSize: FONT_SIZES.sm },
  rowChevron: { color: "#9CA3AF", fontSize: FONT_SIZES.lg, marginLeft: SPACING.sm },
  danger:     { color: COLORS.red },
});
