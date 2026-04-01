import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TopicCard } from '../../components/TopicCard/TopicCard';
import { CreateTopicSheet } from '../../components/CreateTopicSheet';
import { fetchTopics, createTopic } from '../../api/client';
import { TopicWithStats } from '../../types';

export default function HomeScreen() {
  const [topics, setTopics] = useState<TopicWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createFailCount = useRef(0);

  const loadTopics = useCallback(async () => {
    try {
      const data = await fetchTopics();
      setTopics(data);
      setLoadError(null);
    } catch {
      setLoadError('Could not load topics. Pull to refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTopics();
    }, [loadTopics])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  }, [loadTopics]);

  const handleTopicPress = useCallback((topicId: string) => {
    router.push(`/topic/${topicId}`);
  }, []);

  const openSheet = useCallback(() => {
    setCreateError(null);
    createFailCount.current = 0;
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setIsCreating(false);
  }, []);

  const handleCreate = useCallback(
    async (title: string) => {
      setIsCreating(true);
      setCreateError(null);
      try {
        const result = await createTopic(title);
        setSheetOpen(false);
        setIsCreating(false);
        createFailCount.current = 0;
        router.push(`/topic/${result.topic.id}`);
      } catch (e: any) {
        createFailCount.current += 1;
        setIsCreating(false);
        setCreateError(
          e?.name === 'AbortError'
            ? 'Request timed out. Try again or use a simpler topic.'
            : e?.message || 'Something went wrong. Try again.'
        );
      }
    },
    []
  );

  // Loading state — initial fetch
  if (isLoading) {
    return (
      <>
        <View testID="home-screen" style={[styles.container, styles.centered]}>
          <StatusBar style="light" />
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </>
    );
  }

  // Empty state — no topics (or load error with no cached topics)
  if (topics.length === 0) {
    return (
      <>
        <View testID="home-screen" style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.emptyState} testID="empty-state">
            {loadError ? (
              <>
                <Text style={styles.emptyEmoji}>😵</Text>
                <Text style={styles.emptyTitle}>Could not load topics</Text>
                <Text style={styles.emptySubtitle}>
                  Check your connection and pull to refresh.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyEmoji}>🔭</Text>
                <Text style={styles.emptyTitle}>
                  What are you curious about?
                </Text>
                <Text style={styles.emptySubtitle}>
                  Pick any topic and start exploring.
                </Text>
              </>
            )}
            <Pressable
              testID="new-topic-button-empty"
              style={styles.newTopicButton}
              onPress={openSheet}
              accessibilityRole="button"
              accessibilityLabel="Create new topic"
            >
              <Text style={styles.newTopicButtonText}>+ New Topic</Text>
            </Pressable>
          </View>
          <CreateTopicSheet
            isOpen={sheetOpen}
            onClose={closeSheet}
            onSubmit={handleCreate}
            isLoading={isCreating}
            error={createError}
            failCount={createFailCount.current}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <View testID="home-screen" style={styles.container}>
        <StatusBar style="light" />
        {loadError && (
          <View testID="load-error-banner" style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{loadError}</Text>
          </View>
        )}
        <FlatList
          testID="topic-list"
          data={topics}
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
          testID="new-topic-fab"
          style={styles.fab}
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel="Create new topic"
        >
          <Text style={styles.fabText}>+ New Topic</Text>
        </Pressable>
        <CreateTopicSheet
          isOpen={sheetOpen}
          onClose={closeSheet}
          onSubmit={handleCreate}
          isLoading={isCreating}
          error={createError}
          failCount={createFailCount.current}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
  errorBanner: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
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
