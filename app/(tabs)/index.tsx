import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View testID="home-screen" style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.emptyState} testID="empty-state">
        <Text style={styles.emptyEmoji}>🔭</Text>
        <Text style={styles.emptyTitle}>What are you curious about?</Text>
        <Text style={styles.emptySubtitle}>
          Pick any topic and start exploring.
        </Text>
        <Pressable
          testID="new-topic-button"
          style={styles.newTopicButton}
          onPress={() => router.push('/topic/sample')}
        >
          <Text style={styles.newTopicButtonText}>+ New Topic</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F0F5',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8888A0',
    textAlign: 'center',
    marginBottom: 32,
  },
  newTopicButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  newTopicButtonText: {
    color: '#F0F0F5',
    fontSize: 17,
    fontWeight: '600',
  },
});
