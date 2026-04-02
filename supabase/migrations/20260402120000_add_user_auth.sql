-- Add user_id to topics for multi-user support
ALTER TABLE topics ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Index for per-user queries
CREATE INDEX idx_topics_user_id ON topics(user_id);

-- RLS policies for topics: users can only access their own
DROP POLICY IF EXISTS "service_role_all_topics" ON topics;
CREATE POLICY "users_own_topics" ON topics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass (for server-side operations)
CREATE POLICY "service_role_topics" ON topics FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- RLS policies for nodes: inherit access from topic
DROP POLICY IF EXISTS "service_role_all_nodes" ON nodes;
CREATE POLICY "users_own_nodes" ON nodes FOR ALL
  USING (topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid()))
  WITH CHECK (topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid()));

CREATE POLICY "service_role_nodes" ON nodes FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- RLS policies for versions: inherit access from topic
DROP POLICY IF EXISTS "service_role_all_versions" ON versions;
CREATE POLICY "users_own_versions" ON versions FOR ALL
  USING (topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid()))
  WITH CHECK (topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid()));

CREATE POLICY "service_role_versions" ON versions FOR ALL
  TO service_role USING (true) WITH CHECK (true);
