import type { TopicNode, TreeNode } from '../types';

/**
 * Reconstruct flat nodes into a nested tree structure.
 * Resolves branchColor: H2 uses own color, H3/H4 inherit from H2 ancestor.
 * Sorts children within each parent by sort_order.
 *
 * @throws Error if no root node (depth=1) is found
 */
export function buildTree(nodes: TopicNode[]): TreeNode {
  if (nodes.length === 0) {
    throw new Error('No nodes provided');
  }

  const nodeMap = new Map<string, TreeNode>();

  // First pass: create TreeNode wrappers
  for (const node of nodes) {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      branchColor: node.color,
    });
  }

  // Second pass: link children to parents
  let root: TreeNode | null = null;

  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;

    if (node.parent_id === null || node.depth === 1) {
      if (root !== null) {
        console.warn('Multiple root nodes found, using first');
      }
      root = root ?? treeNode;
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        console.warn(`Orphaned node ${node.id}: parent ${node.parent_id} not found`);
      }
    }
  }

  if (!root) {
    throw new Error('No root node (depth=1) found');
  }

  // Third pass: sort children by sort_order and resolve branchColor
  resolveColors(root, root.color);

  return root;
}

function resolveColors(node: TreeNode, branchColor: string) {
  // H2 nodes define their own branch color
  const color = node.depth === 2 ? node.color : branchColor;
  node.branchColor = color;

  // Sort children by sort_order
  node.children.sort((a, b) => a.sort_order - b.sort_order);

  for (const child of node.children) {
    resolveColors(child, color);
  }
}
