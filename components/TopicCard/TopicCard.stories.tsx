import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { TopicCard } from './TopicCard';

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

const meta: Meta<typeof TopicCard> = {
  title: 'TopicCard',
  component: TopicCard,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0F0F14', paddingTop: 40 }}>
        <Story />
      </View>
    ),
  ],
  args: {
    onPress: (id: string) => console.log('Pressed topic:', id),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    topic: {
      id: '1',
      title: 'Surfing',
      emoji: '🏄',
      nodeCount: 32,
      created_at: new Date(now - 7 * day).toISOString(),
      last_visited_at: new Date(now - 2 * hour).toISOString(),
    },
  },
};

export const New: Story = {
  args: {
    topic: {
      id: '2',
      title: 'Nuclear Power',
      emoji: '⚛️',
      nodeCount: 6,
      created_at: new Date(now - hour).toISOString(),
      last_visited_at: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    isNew: true,
  },
};

export const LongTitle: Story = {
  args: {
    topic: {
      id: '3',
      title: 'How Bridges Work: Engineering Marvels of the Modern World and Their Impact on Society',
      emoji: '🌉',
      nodeCount: 12,
      created_at: new Date(now - 3 * day).toISOString(),
      last_visited_at: new Date(now - day).toISOString(),
    },
  },
};

export const ManyNodes: Story = {
  args: {
    topic: {
      id: '4',
      title: 'Quantum Computing',
      emoji: '💻',
      nodeCount: 247,
      created_at: new Date(now - 30 * day).toISOString(),
      last_visited_at: new Date(now - 6 * day).toISOString(),
    },
  },
};
