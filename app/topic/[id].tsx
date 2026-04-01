import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  createSubtopics,
  expandNode,
  fetchTopicWithNodes,
  fetchVersions,
  fetchVersionSnapshot,
  NotFoundError,
  restoreVersion,
  suggestSubtopics,
} from '../../api/client';
import type { VersionEntry } from '../../api/client';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { VersionHistory } from '../../components/VersionHistory';
import { buildTree } from '../../utils/buildTree';
import { usePersistedCollapseState } from '../../hooks/usePersistedCollapseState';
import { usePersistedScrollPosition } from '../../hooks/usePersistedScrollPosition';
import type { TreeNode } from '../../types';

export default function ExplorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Version history state
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [snapshotTree, setSnapshotTree] = useState<TreeNode | null>(null);
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

  const {
    expandedNodes,
    toggleNode,
    setExpandedNodes,
    loaded: collapseStateLoaded,
  } = usePersistedCollapseState(id, new Set());
  const { scrollRef, onScroll, onContentSizeChange } = usePersistedScrollPosition(id);

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

  // Apply default expansion once tree + collapse state are both loaded
  useEffect(() => {
    if (!tree || !collapseStateLoaded) return;
    if (expandedNodes.size === 0) {
      const expanded = new Set<string>();
      expanded.add(tree.id);
      for (const child of tree.children) {
        expanded.add(child.id);
      }
      setExpandedNodes(expanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when tree or loaded changes
  }, [tree, collapseStateLoaded]);

  // toggleNode comes from usePersistedCollapseState hook

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openHistory = useCallback(async () => {
    if (!id) return;
    setShowHistory(true);
    setVersionsLoading(true);
    setVersionsError(null);
    setSnapshotTree(null);
    setViewingVersion(null);
    try {
      const data = await fetchVersions(id);
      setVersions(data);
    } catch (e: any) {
      setVersionsError(e?.message || 'Failed to load version history');
    } finally {
      setVersionsLoading(false);
    }
  }, [id]);

  const [isRestoring, setIsRestoring] = useState(false);

  const viewSnapshot = useCallback(async (versionId: string) => {
    if (!id) return;
    try {
      const data = await fetchVersionSnapshot(id, versionId);
      if (data.nodes.length === 0) {
        Alert.alert('Empty version', 'This version has no content to display.');
        return;
      }
      try {
        const snapTree = buildTree(data.nodes);
        setSnapshotTree(snapTree);
        setViewingVersion(versionId);
      } catch {
        Alert.alert('Cannot display version', 'This version\'s data appears to be corrupted.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load version');
    }
  }, [id]);

  const handleRestore = useCallback(async (versionId: string) => {
    if (!id || isRestoring) return;
    setIsRestoring(true);
    try {
      await restoreVersion(id, versionId);
      setShowHistory(false);
      setSnapshotTree(null);
      setViewingVersion(null);
      setRetryCount((c) => c + 1);
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message || 'Could not restore version');
    } finally {
      setIsRestoring(false);
    }
  }, [id, isRestoring]);

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

  // Version history overlay
  if (showHistory && !viewingVersion) {
    return (
      <View testID="explorer-screen" style={styles.container}>
        <VersionHistory
          versions={versions}
          isLoading={versionsLoading}
          error={versionsError}
          onSelectVersion={viewSnapshot}
          onRestore={handleRestore}
          onClose={() => setShowHistory(false)}
        />
      </View>
    );
  }

  // Snapshot viewer (read-only)
  if (viewingVersion && snapshotTree) {
    return (
      <View testID="explorer-screen" style={styles.container}>
        <View style={styles.snapshotHeader}>
          <Pressable
            testID="snapshot-back"
            onPress={() => { setViewingVersion(null); setSnapshotTree(null); }}
            accessibilityRole="button"
          >
            <Text style={styles.snapshotBackText}>← Back to history</Text>
          </Pressable>
          <Pressable
            testID="snapshot-restore"
            style={styles.snapshotRestoreButton}
            onPress={() => handleRestore(viewingVersion)}
            accessibilityRole="button"
          >
            <Text style={styles.snapshotRestoreText}>Restore</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderNode(
            snapshotTree,
            new Set([snapshotTree.id, ...snapshotTree.children.map(c => c.id)]),
            () => {},
            async () => { Alert.alert('Read-only', 'This is a snapshot preview.'); },
            async () => { Alert.alert('Read-only', 'This is a snapshot preview.'); },
            async () => [],
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View testID="explorer-screen" style={styles.container}>
      {/* History button */}
      <View style={styles.historyBar}>
        <Pressable
          testID="history-button"
          style={styles.historyButton}
          onPress={openHistory}
          accessibilityRole="button"
          accessibilityLabel="View version history"
        >
          <Text style={styles.historyButtonText}>🕒 History</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={100}
        contentContainerStyle={styles.scrollContent}
      >
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
  historyBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A36',
  },
  historyButtonText: {
    color: '#8888A0',
    fontSize: 13,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A36',
  },
  snapshotBackText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
  },
  snapshotRestoreButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  snapshotRestoreText: {
    color: '#F0F0F5',
    fontSize: 14,
    fontWeight: '600',
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
