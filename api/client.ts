import { TopicWithStats, TopicNode } from '../types';

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

const BASE_URL = __DEV__
  ? 'http://localhost:8080'
  : 'https://delve-api-PLACEHOLDER.run.app';

const TIMEOUT_MS = 120_000;

interface TopicWithNodes {
  topic: TopicWithStats;
  nodes: TopicNode[];
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTopics(): Promise<TopicWithStats[]> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/topics`);
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
}

export async function createTopic(title: string): Promise<TopicWithNodes> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to create topic');
  }
  return response.json();
}

export async function fetchTopicWithNodes(topicId: string): Promise<TopicWithNodes> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/topics/${topicId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError('Topic not found');
    }
    throw new Error('Failed to fetch topic');
  }
  return response.json();
}
