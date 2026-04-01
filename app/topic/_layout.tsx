import { Stack } from 'expo-router';

export default function TopicLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Explorer',
        headerStyle: { backgroundColor: '#0F0F14' },
        headerTintColor: '#F0F0F5',
      }}
    />
  );
}
