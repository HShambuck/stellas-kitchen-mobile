import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, Dimensions,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import SafeView from "../../components/common/SafeView";
import { useTheme } from "../../context/ThemeContext";
import {
  COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME,
  SPACING, RADIUS, BRAND, ROLES,
} from "@constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

const ROLE_CARDS = [
  {
    role:        ROLES.STAFF,
    icon:        "🍳",
    title:       "Kitchen Staff",
    tagline:     "Manage & update orders",
    accent:      COLORS.red,
    accentBg:    "#3F1212",
    accentLight: "#FEE2E2",
  },
  {
    role:        ROLES.RIDER,
    icon:        "🏍️",
    title:       "Delivery Rider",
    tagline:     "Pick up & deliver orders",
    accent:      "#3B82F6",
    accentBg:    "#1E3A5F",
    accentLight: "#DBEAFE",
  },
];

export default function UserTypeScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const [selected, setSelected] = useState(null);

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const hasRegistered = await SecureStore.getItemAsync("has_registered");
      if (hasRegistered === "true") router.replace("/(auth)/login");
    })();
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(btnAnim, {
      toValue: selected ? 1 : 0,
      tension: 100, friction: 8, useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <SafeView variant={isDark ? "dark" : "light"}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SK</Text>
            </View>
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.brand}>{BRAND.name.toUpperCase()}</Text>
          <Text style={[styles.headline, { color: theme.text }]}>Who are you?</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            Select your role to get started
          </Text>
        </Animated.View>

        {/* ── Role cards ── */}
        <Animated.View style={[styles.cardsWrap, { opacity: fadeIn }]}>
          {ROLE_CARDS.map((card) => {
            const isActive = selected === card.role;
            return (
              <TouchableOpacity
                key={card.role}
                onPress={() => setSelected(card.role)}
                activeOpacity={0.85}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isActive
                      ? (isDark ? card.accentBg : card.accentLight)
                      : theme.card,
                    borderColor: isActive ? card.accent : theme.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: card.accentLight }]}>
                  <Text style={styles.roleIcon}>{card.icon}</Text>
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, { color: isActive ? card.accent : theme.text }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.roleTagline, { color: theme.textMuted }]}>
                    {card.tagline}
                  </Text>
                </View>
                <View style={[
                  styles.roleCheck,
                  { borderColor: isActive ? card.accent : theme.border,
                    backgroundColor: isActive ? card.accent : "transparent" },
                ]}>
                  {isActive && <Text style={styles.roleCheckMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View style={{
          opacity: btnAnim,
          transform: [{ scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          marginBottom: SPACING.lg,
        }}
          pointerEvents={selected ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(auth)/register", params: { role: selected } })}
            activeOpacity={0.85}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              Continue as {selected === ROLES.STAFF ? "Staff" : "Rider"} →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Sign in link ── */}
        <TouchableOpacity
          onPress={() => router.push(
            selected
              ? { pathname: "/(auth)/login", params: { role: selected } }
              : "/(auth)/login"
          )}
          style={styles.signInLink}
        >
          <Text style={[styles.signInText, { color: theme.textMuted }]}>
            Have an account?{"  "}
            <Text style={{ color: COLORS.red, fontWeight: "700" }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING["4xl"] },
  hero:         { alignItems: "center", paddingTop: SPACING["4xl"], marginBottom: SPACING["3xl"] },
  logoWrap:     { position: "relative", marginBottom: SPACING.xl },
  logo:         { width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center" },
  logoText:     { color: COLORS.white, fontSize: FONT_SIZES["2xl"], fontWeight: "900", letterSpacing: 2 },
  logoDot:      { position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.delivered, borderWidth: 3, borderColor: COLORS.dark },
  brand:        { color: COLORS.red, fontSize: FONT_SIZES.xs, fontWeight: "700", letterSpacing: 3, marginBottom: SPACING.lg },
  headline:     { fontSize: FONT_SIZES["3xl"], fontWeight: "900", letterSpacing: -0.5, marginBottom: SPACING.sm, textAlign: "center" },
  sub:          { fontSize: FONT_SIZES.base, textAlign: "center" },
  cardsWrap:    { gap: SPACING.md, marginBottom: SPACING["2xl"] },
  roleCard:     { flexDirection: "row", alignItems: "center", borderRadius: RADIUS["2xl"], padding: SPACING.xl, gap: SPACING.lg },
  roleIconWrap: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center" },
  roleIcon:     { fontSize: 24 },
  roleInfo:     { flex: 1 },
  roleTitle:    { fontSize: FONT_SIZES.md, fontWeight: "800", marginBottom: 2 },
  roleTagline:  { fontSize: FONT_SIZES.sm },
  roleCheck:    { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  roleCheckMark:{ color: COLORS.white, fontSize: 12, fontWeight: "800" },
  cta:          { backgroundColor: COLORS.red, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, alignItems: "center" },
  ctaText:      { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: "700", letterSpacing: 0.3 },
  signInLink:   { alignItems: "center", paddingVertical: SPACING.md },
  signInText:   { fontSize: FONT_SIZES.sm },
});