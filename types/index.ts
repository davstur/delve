export interface Source {
  title: string;
  url: string;
}

export interface Topic {
  id: string;
  title: string;
  emoji: string;
  created_at: string;
  last_visited_at: string;
}

export interface TopicWithStats extends Topic {
  nodeCount: number;
}

export interface TopicNode {
  id: string;
  topic_id: string;
  parent_id: string | null;
  label: string;
  emoji: string;
  color: string;
  summary: string;
  content: string | null;
  depth: number;
  sources: Source[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  version_id: string;
}

export interface TreeNode extends TopicNode {
  children: TreeNode[];
  branchColor: string;
}
