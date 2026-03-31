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
import { fetchTopicWithNodes } from '../../api/client';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { buildTree } from '../../utils/buildTree';
import type { TreeNode, TopicNode } from '../../types';

export default function ExplorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setIs404(false);
      try {
        const data = await fetchTopicWithNodes(id!);
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
      } catch (e: any) {
        if (cancelled) return;
        if (e?.message?.includes('not found') || e?.message?.includes('404')) {
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
  }, [id]);

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
          onPress={() => {
            setIsLoading(true);
            setError(null);
            fetchTopicWithNodes(id!)
              .then((data) => {
                setTree(buildTree(data.nodes));
                setIsLoading(false);
              })
              .catch(() => {
                setError('Could not load topic. Try again.');
                setIsLoading(false);
              });
          }}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // No tree
  if (!tree) return null;

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
        />

        {/* H2 Branches */}
        {tree.children.map((branch, index) => (
          <View key={branch.id}>
            {index > 0 && <View style={styles.divider} />}
            {renderNode(branch, expandedNodes, toggleNode)}
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
    >
      {node.children.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {node.children.map((child) =>
            renderNode(child, expandedNodes, toggleNode)
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
