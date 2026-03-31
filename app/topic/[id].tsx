import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  createSubtopics,
  expandNode,
  fetchTopicWithNodes,
  NotFoundError,
  suggestSubtopics,
} from '../../api/client';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { buildTree } from '../../utils/buildTree';
import type { TreeNode } from '../../types';

export default function ExplorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setIs404(false);
      try {
        const topicId = id;
        const data = await fetchTopicWithNodes(topicId);
        if (cancelled) return;
        const rootTree = buildTree(data.nodes);
        setTree(rootTree);

        // Default expansion: H1 + H2 expanded, H3/H4 collapsed
        const expanded = new Set<string>();
        expanded.add(rootTree.id);
        for (const child of rootTree.children) {
          expanded.add(child.id);
        }
        setExpandedNodes(expanded);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof NotFoundError) {
          setIs404(true);
          setError('Topic not found');
        } else {
          setError('Could not load topic. Try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, retryCount]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExpand = useCallback(async (nodeId: string, prompt?: string) => {
    if (!id) return;
    // This throws on API errors — caught by CollapsibleSection's try/catch
    const updatedNode = await expandNode(id, nodeId, prompt);

    // Tree update errors should not be shown as "expansion failed"
    setTree((prev) => {
      if (!prev) return prev;
      try {
        return updateNodeInTree(prev, nodeId, updatedNode);
      } catch (treeErr) {
        console.error('Failed to update node in tree after successful expand:', treeErr);
        return prev;
      }
    });
  }, [id]);

  const handleSuggestSubtopics = useCallback(async (nodeId: string) => {
    if (!id) return [];
    return suggestSubtopics(id, nodeId);
  }, [id]);

  const handleAddSubtopics = useCallback(async (nodeId: string, labels: string[]) => {
    if (!id) return;
    const newNodes = await createSubtopics(id, nodeId, labels);

    let treeSyncFailed = false;
    setTree((prev) => {
      if (!prev) return prev;
      try {
        return addChildrenToTree(prev, nodeId, newNodes);
      } catch (err) {
        console.error('Failed to add subtopics to tree, will re-fetch:', err);
        treeSyncFailed = true;
        return prev;
      }
    });

    if (treeSyncFailed) {
      // Re-fetch entire topic to reconcile client with server
      setRetryCount((c) => c + 1);
      return;
    }

    // Expand the parent so new children are visible
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, [id]);

  // Loading
  if (isLoading) {
    return (
      <View testID="explorer-screen" style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // 404
  if (is404) {
    return (
      <View testID="explorer-screen" style={[styles.container, styles.centered]}>
        <Text style={styles.errorEmoji}>🔍</Text>
        <Text style={styles.errorTitle}>Topic not found</Text>
        <Pressable
          testID="explorer-back-button"
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Error (retryable)
  if (error) {
    return (
      <View testID="explorer-screen" style={[styles.container, styles.centered]}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorTitle}>{error}</Text>
        <Pressable
          testID="explorer-retry-button"
          style={styles.retryButton}
          onPress={() => setRetryCount((c) => c + 1)}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // No tree (unexpected state — loading done, no error, but no tree)
  if (!tree) {
    return (
      <View testID="explorer-screen" style={[styles.container, styles.centered]}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Pressable
          testID="explorer-retry-unexpected"
          style={styles.retryButton}
          onPress={() => setRetryCount((c) => c + 1)}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty topic (root only, no children)
  if (tree.children.length === 0) {
    return (
      <View testID="explorer-screen" style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <CollapsibleSection
            nodeId={tree.id}
            label={tree.label}
            emoji={tree.emoji}
            summary={tree.summary}
            depth={tree.depth}
            branchColor={tree.branchColor}
            sources={tree.sources}
            isExpanded={true}
            childCount={0}
            onToggle={toggleNode}
          />
          <View style={styles.emptyBranches}>
            <Text style={styles.emptyText}>No branches yet</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View testID="explorer-screen" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* H1 Root — always expanded */}
        <CollapsibleSection
          nodeId={tree.id}
          label={tree.label}
          emoji={tree.emoji}
          summary={tree.summary}
          depth={tree.depth}
          branchColor={tree.branchColor}
          sources={tree.sources}
          isExpanded={true}
          childCount={tree.children.length}
          onToggle={toggleNode}
          onExpand={handleExpand}
          onAddSubtopics={handleAddSubtopics}
          onSuggestSubtopics={handleSuggestSubtopics}
        />

        {/* H2 Branches */}
        {tree.children.map((branch, index) => (
          <View key={branch.id}>
            {index > 0 && <View style={styles.divider} />}
            {renderNode(branch, expandedNodes, toggleNode, handleExpand, handleAddSubtopics, handleSuggestSubtopics)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function renderNode(
  node: TreeNode,
  expandedNodes: Set<string>,
  toggleNode: (id: string) => void,
  onExpand: (nodeId: string, prompt?: string) => Promise<void>,
  onAddSubtopics: (nodeId: string, labels: string[]) => Promise<void>,
  onSuggestSubtopics: (nodeId: string) => Promise<{ label: string; emoji: string }[]>,
): React.ReactElement {
  const isExpanded = expandedNodes.has(node.id);
  const childCount = countDescendants(node);

  return (
    <CollapsibleSection
      key={node.id}
      nodeId={node.id}
      label={node.label}
      emoji={node.emoji}
      summary={node.summary}
      depth={node.depth}
      branchColor={node.branchColor}
      sources={node.sources}
      isExpanded={isExpanded}
      childCount={childCount}
      onToggle={toggleNode}
      onExpand={onExpand}
      onAddSubtopics={onAddSubtopics}
      onSuggestSubtopics={onSuggestSubtopics}
    >
      {node.children.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {node.children.map((child) =>
            renderNode(child, expandedNodes, toggleNode, onExpand, onAddSubtopics, onSuggestSubtopics)
          )}
        </View>
      )}
    </CollapsibleSection>
  );
}

function countDescendants(node: TreeNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

function updateNodeInTree(tree: TreeNode, nodeId: string, updatedData: any): TreeNode {
  if (tree.id === nodeId) {
    return {
      ...tree,
      summary: updatedData.summary ?? tree.summary,
      sources: updatedData.sources ?? tree.sources,
      updated_at: updatedData.updated_at ?? tree.updated_at,
      version_id: updatedData.version_id ?? tree.version_id,
    };
  }
  return {
    ...tree,
    children: tree.children.map((child) =>
      updateNodeInTree(child, nodeId, updatedData)
    ),
  };
}

function addChildrenToTree(tree: TreeNode, parentId: string, newNodes: any[]): TreeNode {
  if (tree.id === parentId) {
    // Resolve branchColor for new children
    const branchColor = tree.depth === 1
      ? tree.color // H1 → children are H2 with own colors, but server sets parent color
      : tree.branchColor;

    const newChildren: TreeNode[] = newNodes.map((n) => ({
      ...n,
      children: [],
      branchColor: n.depth === 2 ? (n.color || branchColor) : branchColor,
    }));

    return {
      ...tree,
      children: [...tree.children, ...newChildren].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    };
  }
  return {
    ...tree,
    children: tree.children.map((child) =>
      addChildrenToTree(child, parentId, newNodes)
    ),
  };
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
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A36',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  emptyBranches: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8888A0',
    fontSize: 16,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#F0F0F5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#F0F0F5',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#2A2A36',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#F0F0F5',
    fontSize: 16,
    fontWeight: '600',
  },
});
