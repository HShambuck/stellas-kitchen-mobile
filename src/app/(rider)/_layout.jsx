import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "@constants/theme";

function TabIcon({ focused, emoji, label }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {focused && <Text style={styles.tabLabel}>{label}</Text>}
    </View>
  );
}

export default function RiderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle:     styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📦" label="Queue" />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🏍️" label="Active" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.stone,
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    height:          64,
    paddingBottom:   8,
    paddingTop:      8,
  },
  tabIcon: {
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.xs,
    borderRadius:    999,
    flexDirection:   "row",
    gap:             SPACING.xs,
  },
  tabIconActive: { backgroundColor: "#1E3A5F" },
  emoji:    { fontSize: 20 },
  tabLabel: { color: "#3B82F6", fontSize: FONT_SIZES.xs, fontWeight: "700" },
});
