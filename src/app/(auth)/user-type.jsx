import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import SafeView from "../../components/common/SafeView";
import { COLORS, FONT_SIZES, SPACING, RADIUS, BRAND, ROLES } from "@constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Role card data ───────────────────────────────────────────────────────────
const ROLE_CARDS = [
  {
    role:  ROLES.STAFF,
    icon:  "🍳",
    title: "Kitchen Staff",
    tagline: "Manage incoming orders",
    perks: [
      "View & update order status in real time",
      "Mark orders as Preparing or Ready",
      "Dashboard overview of kitchen queue",
    ],
    accentLight: "#FEE2E2",
    accentDark:  COLORS.red,
  },
  {
    role:  ROLES.RIDER,
    icon:  "🏍️",
    title: "Delivery Rider",
    tagline: "Pick up & deliver orders",
    perks: [
      "Browse available deliveries near Shai Hills",
      "Accept orders and navigate to customers",
      "Mark deliveries as completed",
    ],
    accentLight: "#DBEAFE",
    accentDark:  "#2563EB",
  },
];

// ─── Single animated role card ────────────────────────────────────────────────
function RoleCard({ card, index, selected, onSelect }) {
  const scale    = useRef(new Animated.Value(0.92)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const isActive = selected === card.role;

  // Entrance animation — staggered per card
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:         1,
        duration:        420,
        delay:           index * 120 + 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue:         1,
        tension:         80,
        friction:        9,
        delay:           index * 120 + 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Press animation
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue:         0.96,
      tension:         200,
      friction:        10,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue:         1,
      tension:         120,
      friction:        8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={()    => onSelect(card.role)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.card,
          isActive && { borderColor: card.accentDark, borderWidth: 2.5 },
          !isActive && styles.cardInactive,
        ]}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: card.accentLight }]}>
          <Text style={styles.icon}>{card.icon}</Text>
        </View>

        {/* Title + tagline */}
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardTagline}>{card.tagline}</Text>

        {/* Perks list */}
        <View style={styles.perksList}>
          {card.perks.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={[styles.perkDot, { backgroundColor: card.accentDark }]} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Selection indicator */}
        {isActive && (
          <View style={[styles.selectedBadge, { backgroundColor: card.accentDark }]}>
            <Text style={styles.selectedBadgeText}>✓  Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function UserTypeScreen() {
  const [selected, setSelected] = useState(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-20)).current;
  const btnScale      = useRef(new Animated.Value(0.8)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;

  // Header entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0, duration: 500, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // CTA button pops in when role is selected
  useEffect(() => {
    if (selected) {
      Animated.parallel([
        Animated.spring(btnScale, {
          toValue: 1, tension: 100, friction: 8, useNativeDriver: true,
        }),
        Animated.timing(btnOpacity, {
          toValue: 1, duration: 250, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(btnOpacity, {
        toValue: 0, duration: 150, useNativeDriver: true,
      }).start(() => {
        btnScale.setValue(0.8);
      });
    }
  }, [selected]);

  const handleContinue = () => {
    if (!selected) return;
    router.push({ pathname: "/(auth)/register", params: { role: selected } });
  };

  return (
    <SafeView variant="dark">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          {/* SK logo mark */}
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.brandName}>{BRAND.name}</Text>
          <Text style={styles.headline}>Who are you?</Text>
          <Text style={styles.subheadline}>
            Choose your role to set up your workspace.
          </Text>
        </Animated.View>

        {/* ── Cards ──────────────────────────────────────────────── */}
        <View style={styles.cards}>
          {ROLE_CARDS.map((card, i) => (
            <RoleCard
              key={card.role}
              card={card}
              index={i}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </View>

        {/* ── Continue CTA ────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.ctaWrap,
            { opacity: btnOpacity, transform: [{ scale: btnScale }] },
          ]}
          pointerEvents={selected ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaLabel}>
              Continue as {selected === ROLES.STAFF ? "Staff" : "Rider"} →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Already have an account ─────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Already have an account?{" "}
            <Text style={styles.loginLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    flexGrow:        1,
    paddingHorizontal: SPACING["2xl"],
    paddingBottom:   SPACING["4xl"],
  },

  // Header
  header: {
    alignItems:   "center",
    paddingTop:   SPACING["3xl"],
    marginBottom: SPACING["3xl"],
  },
  logoMark: {
    width:           52,
    height:          52,
    borderRadius:    14,
    backgroundColor: COLORS.red,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    SPACING.md,
  },
  logoText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZES.lg,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandName: {
    color:      COLORS.white,
    fontSize:   FONT_SIZES.sm,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity:    0.6,
    marginBottom: SPACING.xl,
  },
  headline: {
    color:        COLORS.white,
    fontSize:     FONT_SIZES["3xl"],
    fontWeight:   "800",
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subheadline: {
    color:     "#9CA3AF",
    fontSize:  FONT_SIZES.base,
    textAlign: "center",
    lineHeight: 22,
  },

  // Cards
  cards: {
    gap: SPACING.lg,
    marginBottom: SPACING["2xl"],
  },
  card: {
    backgroundColor: COLORS.stone,
    borderRadius:    RADIUS["3xl"],
    padding:         SPACING["2xl"],
    borderWidth:     2,
    borderColor:     COLORS.border,
  },
  cardInactive: {
    borderColor: COLORS.border,
  },

  iconCircle: {
    width:          56,
    height:         56,
    borderRadius:   RADIUS.xl,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   SPACING.md,
  },
  icon: {
    fontSize: 28,
  },

  cardTitle: {
    color:        COLORS.white,
    fontSize:     FONT_SIZES.xl,
    fontWeight:   "800",
    marginBottom: SPACING.xs,
  },
  cardTagline: {
    color:        "#9CA3AF",
    fontSize:     FONT_SIZES.sm,
    marginBottom: SPACING.lg,
  },

  perksList: { gap: SPACING.sm },
  perkRow: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           SPACING.sm,
  },
  perkDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginTop:    6,
    flexShrink:   0,
  },
  perkText: {
    color:      "#D1D5DB",
    fontSize:   FONT_SIZES.sm,
    lineHeight: 20,
    flex:       1,
  },

  selectedBadge: {
    marginTop:    SPACING.lg,
    alignSelf:    "flex-start",
    paddingVertical:   SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius:      RADIUS.full,
  },
  selectedBadgeText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZES.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // CTA
  ctaWrap: { marginBottom: SPACING.xl },
  ctaButton: {
    backgroundColor: COLORS.red,
    paddingVertical:   SPACING.lg,
    borderRadius:      RADIUS.xl,
    alignItems:        "center",
  },
  ctaLabel: {
    color:      COLORS.white,
    fontSize:   FONT_SIZES.md,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Login link
  loginLink: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  loginLinkText: {
    color:    "#6B7280",
    fontSize: FONT_SIZES.sm,
  },
  loginLinkBold: {
    color:      COLORS.red,
    fontWeight: "700",
  },
});
