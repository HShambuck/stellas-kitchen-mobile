import { Colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Image, useColorScheme } from 'react-native';

export default function AppTabs() {
  const scheme = useColorScheme();
  const currentScheme = scheme === 'dark' ? 'dark' : 'light';
const colors = Colors[currentScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: '#888888',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/tabIcons/home.png')} 
              style={{ width: 24, height: 24, tintColor: color }} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/tabIcons/explore.png')} 
              style={{ width: 24, height: 24, tintColor: color }} 
            />
          ),
        }}
      />
    </Tabs>
  );
}