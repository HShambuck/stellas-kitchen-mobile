import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { DARK_THEME, LIGHT_THEME, COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

function TabIcon({ focused, emoji, label, theme }) {
  return (
    <View style={[styles.tabIcon, focused && { backgroundColor: theme.pillActive }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color: focused ? COLORS.red : theme.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function StaffLayout() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor:  theme.tabBorder,
          borderTopWidth:  1,
          height:          tabBarHeight,
          paddingBottom:   insets.bottom + 6,
          paddingTop:      8,
          elevation:       12,
          shadowColor:     "#000",
          shadowOffset:    { width: 0, height: -3 },
          shadowOpacity:   0.08,
          shadowRadius:    6,
          position:        "absolute",
          bottom:          0,
          left:            0,
          right:           0,
        },
        tabBarShowLabel:      false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📋" label="Orders" theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-order"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="➕" label="New Order" theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="⚙️" label="Settings" theme={theme} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    minWidth: 64,
    gap: 2,
  },
  emoji:    { fontSize: 20, lineHeight: 24 },
  tabLabel: { fontSize: FONT_SIZES.xs, fontWeight: "600", letterSpacing: 0.3 },
});