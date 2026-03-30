import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TopicCard } from '../../components/TopicCard/TopicCard';
import { MOCK_TOPICS } from '../../mock/topics';
import { TopicWithStats } from '../../types';

export default function HomeScreen() {
  const [topics] = useState<TopicWithStats[]>(
    [...MOCK_TOPICS].sort(
      (a, b) =>
        new Date(b.last_visited_at).getTime() -
        new Date(a.last_visited_at).getTime()
    )
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleTopicPress = (topicId: string) => {
    router.push(`/topic/${topicId}`);
  };

  const displayTopics = showEmpty ? [] : topics;

  if (displayTopics.length === 0) {
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
            onPress={() => console.log('New topic pressed')}
          >
            <Text style={styles.newTopicButtonText}>+ New Topic</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View testID="home-screen" style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        testID="topic-list"
        data={displayTopics}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TopicCard
            topic={item}
            onPress={handleTopicPress}
            isNew={index === 0}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8888A0"
          />
        }
      />
      <Pressable
        testID="new-topic-button"
        style={styles.fab}
        onPress={() => console.log('New topic pressed')}
      >
        <Text style={styles.fabText}>+ New Topic</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#F0F0F5',
    fontSize: 17,
    fontWeight: '600',
  },
});
