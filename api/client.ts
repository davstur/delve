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

export async function expandNode(
  topicId: string,
  nodeId: string,
  prompt?: string,
): Promise<TopicNode> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/topics/${topicId}/nodes/${nodeId}/expand`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt || null }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to expand node');
  }
  return response.json();
}

export interface SubtopicSuggestion {
  label: string;
  emoji: string;
}

export async function suggestSubtopics(
  topicId: string,
  nodeId: string,
): Promise<SubtopicSuggestion[]> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/topics/${topicId}/nodes/${nodeId}/suggest-subtopics`,
    { method: 'POST' },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to get suggestions');
  }
  const data = await response.json();
  return data.suggestions;
}

export async function createSubtopics(
  topicId: string,
  nodeId: string,
  labels: string[],
): Promise<TopicNode[]> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/topics/${topicId}/nodes/${nodeId}/subtopics`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labels }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to create subtopics');
  }
  const data = await response.json();
  return data.nodes;
}

export interface VersionEntry {
  id: string;
  action: string;
  created_at: string;
  target_label: string | null;
}

export async function fetchVersions(topicId: string): Promise<VersionEntry[]> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/topics/${topicId}/versions`);
  if (!response.ok) throw new Error('Failed to fetch versions');
  const data = await response.json();
  return data.versions;
}

export async function fetchVersionSnapshot(
  topicId: string,
  versionId: string,
): Promise<{ version: VersionEntry; nodes: TopicNode[] }> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/topics/${topicId}/versions/${versionId}`,
  );
  if (!response.ok) throw new Error('Failed to fetch version');
  return response.json();
}

export async function restoreVersion(
  topicId: string,
  versionId: string,
): Promise<TopicWithNodes> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/topics/${topicId}/versions/${versionId}/restore`,
    { method: 'POST' },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to restore version');
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
