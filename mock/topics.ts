import { TopicWithStats } from '../types';

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

export const MOCK_TOPICS: TopicWithStats[] = [
  {
    id: '1',
    title: 'Surfing',
    emoji: '🏄',
    nodeCount: 32,
    created_at: new Date(now - 7 * day).toISOString(),
    last_visited_at: new Date(now - 2 * hour).toISOString(),
  },
  {
    id: '2',
    title: 'Nuclear Power',
    emoji: '⚛️',
    nodeCount: 18,
    created_at: new Date(now - 5 * day).toISOString(),
    last_visited_at: new Date(now - day).toISOString(),
  },
  {
    id: '3',
    title: 'The History of Jazz',
    emoji: '🎵',
    nodeCount: 45,
    created_at: new Date(now - 10 * day).toISOString(),
    last_visited_at: new Date(now - 3 * day).toISOString(),
  },
  {
    id: '4',
    title: 'How Bridges Work: Engineering Marvels of the Modern World',
    emoji: '🌉',
    nodeCount: 12,
    created_at: new Date(now - 2 * day).toISOString(),
    last_visited_at: new Date(now - 5 * hour).toISOString(),
  },
  {
    id: '5',
    title: 'Quantum Computing',
    emoji: '💻',
    nodeCount: 127,
    created_at: new Date(now - 14 * day).toISOString(),
    last_visited_at: new Date(now - 6 * day).toISOString(),
  },
];
