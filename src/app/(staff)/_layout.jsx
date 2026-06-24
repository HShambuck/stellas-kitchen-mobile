import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

function TabIcon({ focused, emoji, label }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {focused && <Text style={styles.tabLabel}>{label}</Text>}
    </View>
  );
}

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle:     styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📋" label="Orders" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="⚙️" label="Settings" />
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
  tabIconActive: {
    backgroundColor: "#3F1212",
  },
  emoji: { fontSize: 20 },
  tabLabel: {
    color:      COLORS.red,
    fontSize:   FONT_SIZES.xs,
    fontWeight: "700",
  },
});
