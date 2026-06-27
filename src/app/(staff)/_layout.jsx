import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, DARK_THEME, FONT_SIZES, LIGHT_THEME } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

function TabIcon({ focused, emoji, label, theme }) {
  return (
    <View style={styles.tabIconWrap}>
      <View style={[styles.iconPill, focused && { backgroundColor: theme.pillActive }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.tabLabel, { color: focused ? COLORS.red : theme.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function StaffLayout() {
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const tabBarHeight = 68 + insets.bottom;

  // Redirect to login when session ends
  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/(auth)/login");
    }
  }, [isSignedIn]);

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
      <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📋" label="Orders"    theme={theme} /> }} />
      <Tabs.Screen name="new-order" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="➕" label="New Order"  theme={theme} /> }} />
      <Tabs.Screen name="settings"  options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚙️" label="Profile"   theme={theme} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: { alignItems: "center", justifyContent: "center", gap: 2, paddingTop: 2, minWidth: 72 },
iconPill: { width: 56, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
emoji:    { fontSize: 17 },
tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
});