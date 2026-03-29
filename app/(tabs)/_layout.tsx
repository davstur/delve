import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0F0F14', borderTopColor: '#1A1A24' },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#8888A0',
        headerStyle: { backgroundColor: '#0F0F14' },
        headerTintColor: '#F0F0F5',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Delve',
        }}
      />
    </Tabs>
  );
}
