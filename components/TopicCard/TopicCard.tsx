import { Pressable, View, Text, StyleSheet } from 'react-native';
import { TopicWithStats } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';

interface TopicCardProps {
  topic: TopicWithStats;
  onPress: (topicId: string) => void;
  isNew?: boolean;
}

export function TopicCard({ topic, onPress, isNew }: TopicCardProps) {
  return (
    <Pressable
      testID={`topic-card-${topic.id}`}
      style={({ pressed }) => [
        styles.card,
        isNew && styles.cardNew,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(topic.id)}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{topic.emoji}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {topic.title}
        </Text>
      </View>
      <Text style={styles.stats}>
        {topic.nodeCount} {topic.nodeCount === 1 ? 'node' : 'nodes'} · Visited{' '}
        {formatRelativeTime(topic.last_visited_at)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardNew: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F0F0F5',
    flex: 1,
  },
  stats: {
    fontSize: 14,
    color: '#8888A0',
    marginLeft: 34,
  },
});
