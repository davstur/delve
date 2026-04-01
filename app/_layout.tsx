import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F14' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="topic/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Explorer',
          headerStyle: { backgroundColor: '#0F0F14' },
          headerTintColor: '#F0F0F5',
        }}
      />
    </Stack>
  );
}
