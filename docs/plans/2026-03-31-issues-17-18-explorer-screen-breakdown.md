<!--
LIVING DOCUMENT - Update continuously during implementation.
GOLDEN RULE: If feature is live, remove planning details from this doc.
-->

# Explorer Screen — Feature Breakdown

**Issues**: #17 (CollapsibleSection component), #18 (Explorer screen)
**Started**: 2026-03-31
**Last Updated**: 2026-03-31 by Claude (post-review)
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Phase 1 — CollapsibleSection + DepthIndicator components

## 📊 Overall Progress

| Priority | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| 🟢 MUST  | 5     | 0         | 0           | 5           |
| 🟡 SHOULD| 2     | 0         | 0           | 2           |

---

## 🎯 User-Facing Stories

| # | User Story | Value to User | Priority | Status |
|---|-----------|---------------|----------|--------|
| 1 | User: see topic as collapsible document with headings | Big-picture overview + drill-down | 🟢 MUST | ❌ None |
| 2 | User: tap heading to collapse/expand children | Control what's visible | 🟢 MUST | ❌ None |
| 3 | User: see visual hierarchy (colors, depth dots, indentation, typography) | Understand nesting at a glance | 🟢 MUST | ❌ None |
| 4 | User: see loading/error states when opening topic | Know what's happening | 🟢 MUST | ❌ None |
| 5 | User: see action chips below expanded sections | Discover what's possible next | 🟢 MUST | ❌ None |
| 6 | User: smooth scrolling with many nodes | Doesn't feel slow or janky | 🟡 SHOULD | ❌ None |
| 7 | User: navigate back to Home with topic list intact | Seamless round-trip | 🟡 SHOULD | ❌ None |

## 📌 Technical Enablers

| # | Technical Work | Enables | Priority | Status |
|---|---------------|---------|----------|--------|
| T1 | CollapsibleSection component | #1, #2, #3 | 🟢 MUST | ❌ None |
| T2 | DepthIndicator component (1-4 dots) | #3 | 🟢 MUST | ❌ None |
| T3 | buildTree utility (flat nodes → TreeNode with branchColor) | #1 | 🟢 MUST | ❌ None |
| T4 | Explorer screen (fetch, tree render, scroll, states) | #1, #4, #7 | 🟢 MUST | ❌ None |
| T5 | Action chips ("Coming soon" on tap) | #5 | 🟢 MUST | ❌ None |
| T6 | Storybook stories for CollapsibleSection | #3 | 🟡 SHOULD | ❌ None |

---

## 🔄 Implementation Sequence

### Phase 1: Components — CollapsibleSection + DepthIndicator

**Goal**: Reusable component rendering any node depth with proper visual hierarchy.

- T1: CollapsibleSection with heading (emoji + label + chevron), collapsible body, left-border
- T2: DepthIndicator (1-4 filled dots)
- T5: Action chips row below content
- T6: Storybook stories

**Key details**:
- Typography: H1 28pt bold, H2 22pt semibold, H3 18pt medium, H4 16pt semibold
- Body: 15pt regular, 1.6 line height, #F0F0F5
- Left-border: 3px, branchColor prop. H1 has no border.
- Indentation: 0px (H1), 0px (H2), 12px (H3), 24px (H4) — reinforces depth beyond typography
- Chevron: ▸ collapsed, ▾ expanded. Animate with reanimated.
- H1 root: always expanded, non-collapsible (no chevron)
- Collapsed headings show child count: "N subtopics" in muted text next to chevron
- Action chips only visible when section is expanded
- Chip tap shows "Coming soon" toast (not silent no-op)
- H4 shows "Expand" only (max depth per PLATFORM.md)
- Full heading row tappable (44pt min height)
- Accessibility: `accessibilityRole="header"`, `accessibilityState={{ expanded }}`, `accessibilityHint`
- Stateless — `isExpanded`, `onToggle`, `childCount` via props
- `React.memo` for performance

**TreeNode type** (add to types/index.ts):
```typescript
export interface TreeNode extends TopicNode {
  children: TreeNode[];
  branchColor: string;
}
```

### Phase 2: Explorer Screen — Wire Everything Together

**Goal**: Replace placeholder with real topic viewer.

- T3: `utils/buildTree.ts` — flat nodes → TreeNode tree with branchColor resolved
- T4: Explorer screen with fetch, recursive render, collapse state

**Key details**:
- Fetch via `fetchTopicWithNodes(id)` from `api/client.ts`
- `buildTree` utility:
  - Map by ID, link children via parent_id
  - Sort children within each parent by sort_order (per-parent scope)
  - Resolve branchColor: H2 uses own color, H3/H4 inherit from H2 ancestor
  - Defensive: handle missing root (error state), orphaned nodes (warn + omit)
  - Validate exactly one depth=1 node
- Collapse defaults: H1 always expanded. H2 expanded. H3/H4 collapsed.
- `expandedNodes: Set<string>` in Explorer, toggled via stable `useCallback`
- ScrollView for smooth full-document scrolling
- Dividers (1px, #2A2A36) between H2 branches
- 16-24px vertical spacing between sibling nodes
- Loading: ActivityIndicator centered
- Error: 404 → "Topic not found" + back button; 5xx → "Try Again"
- Empty topic (root only): show root summary + "No branches yet" message
- Explorer renders tree recursively, CollapsibleSection renders one node only

---

## 🧪 Testing Checkpoints

| After Phase | Stories Testable | 🚦 Gate | 🤖 AI | 👤 User | Notes |
|-------------|-----------------|---------|-------|---------|-------|
| Phase 1     | #3 (Storybook)  | —       | —     | —       | Component in isolation |
| Phase 2     | #1-#7 (all)     | Final   | ⬜    | ⬜      | Full flow testable |

### Quality Gate: Phase 2 (Final)

**Validate now (structural):**
- [ ] Collapsible document layout feels like Notion
- [ ] Typography scale clearly communicates depth (H1 vs H2 vs H3 vs H4)
- [ ] Left-border + indentation reinforce nesting
- [ ] Child count hints visible on collapsed headings
- [ ] Action chips discoverable, "Coming soon" toast works
- [ ] Seed data renders correctly

**Defer to final walkthrough:**
- Spacing fine-tuning, chevron animation timing, depth dot sizing

---

## 🔧 Decision Log

### DEC-001: ScrollView vs FlatList
**Decision**: ScrollView. Topics have 5-50 nodes. FlatList virtualization adds complexity without benefit.

### DEC-002: Collapse defaults
**Decision**: H1 always expanded. H2 expanded. H3/H4 collapsed. Child count shown on collapsed headings.

### DEC-003: Branch color inheritance
**Decision**: Resolved during buildTree — annotate each TreeNode with branchColor. H2 uses own color, descendants inherit.

### DEC-004: Action chip tap behavior (review finding)
**Decision**: Show "Coming soon" toast on tap. Chips only visible when section expanded.

### DEC-005: Indentation per depth (review finding)
**Decision**: H1/H2: 0px, H3: 12px, H4: 24px. Reinforces depth beyond typography alone.

### DEC-006: sort_order scope (review finding)
**Decision**: sort_order is per-parent (each parent's children start at 0). buildTree sorts children within each parent.

### Known gaps (deferred):
- Expand All / Collapse All — future enhancement
- Scroll position management on expand/collapse — complex, not MVP-blocking
- Collapse state persistence — tracked as #19

---

## 👀 Human Validation

- [ ] Does the collapsible document feel like reading a Notion page?
- [ ] Is the typography + indentation scale clear at each depth?
- [ ] Do branch colors help orientation or feel distracting?
- [ ] Are child count hints useful or noisy?
- [ ] Do action chips feel discoverable without being intrusive?

---

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight: `/project:issues:preflight`
3. Create PR: `/project:issues:create-pr`

## 📝 Session Log

### 2026-03-31 - Session 1
- Breakdown created
- Architect review: 10 findings (2 concerns, 8 improvements) — all incorporated
- UX review: 10 findings (3 risks, 4 specs, 1 taste, 2 improvements) — key ones incorporated
- Next: Phase 1 implementation
