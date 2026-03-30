-- Delve schema: topics, nodes, versions
-- Issue #9: https://github.com/davstur/delve/issues/9

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topics_last_visited ON topics(last_visited_at DESC);

-- Versions (full snapshot before each AI mutation)
-- Created before topics/nodes FK references it
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_versions_topic_id ON versions(topic_id);

-- Nodes (flat storage, reconstructed into tree client-side)
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id) ON DELETE RESTRICT,
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📄',
  color TEXT NOT NULL DEFAULT '#4F46E5',
  summary TEXT NOT NULL,
  content TEXT,
  depth INTEGER NOT NULL CHECK (depth BETWEEN 1 AND 4),
  sources JSONB DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_topic_sort ON nodes(topic_id, sort_order);
CREATE INDEX idx_nodes_parent_id ON nodes(parent_id);
