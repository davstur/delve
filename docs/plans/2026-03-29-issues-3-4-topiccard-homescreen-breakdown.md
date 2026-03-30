<!--
LIVING DOCUMENT — trim as implementation progresses.
GOLDEN RULE: If code exists in repo, remove it from this doc.
-->

# TopicCard + Home Screen — Feature Breakdown

**Issues**: #3, #4
**Started**: 2026-03-29
**Last Updated**: 2026-03-29 by Claude
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Phase 1 — TopicCard component + stories

## 📊 Overall Progress

| Priority | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| 🟢 MUST  | 4     | 0         | 0           | 4           |

---

## 🎯 User-Facing Stories

| # | User Story | Value to User | Priority | Status |
|---|-----------|---------------|----------|--------|
| 1 | User sees topics with emoji, title, stats | Quickly find and resume topics | 🟢 MUST | ❌ None |
| 2 | User taps topic to explore it | One-tap access to knowledge | 🟢 MUST | ⚠️ Partial (nav exists) |
| 3 | New user sees inviting empty state | Knows what to do on first launch | 🟢 MUST | ⚠️ Partial (exists from #1) |
| 4 | User sees topics sorted by recent | Most relevant content first | 🟢 MUST | ❌ None |

## 📌 Technical Enablers

| # | Technical Work | Enables | Priority | Status |
|---|---------------|---------|----------|--------|
| T1 | Add `nodeCount` to Topic type or compute from mock data | #1 | 🟢 MUST | ❌ None |
| T2 | Create mock data module | #1, #3, #4 | 🟢 MUST | ❌ None |
| T3 | TopicCard Storybook stories (5 variants) | #1 | 🟢 MUST | ❌ None |

---

## 🔄 Implementation Sequence

### Phase 1: TopicCard Component + Stories (Issue #3)

1. Add `nodeCount` field to `TopicWithStats` interface (or extend Topic)
2. Create `components/TopicCard/TopicCard.tsx`
   - Props: `topic`, `onPress`
   - Brand colors: dark card surface, off-white text, muted stats
   - Emoji + title row, stats row ("32 nodes · 2h ago")
   - Rounded corners, testID props
3. Create `components/TopicCard/TopicCard.stories.tsx`
   - Default, New (amber accent), LongTitle, ManyNodes
4. Create `mock/topics.ts` with 5 sample topics
5. Verify in Storybook mode

🚦 **Quality Gate**: First visual component — verify card looks right in Storybook

### Phase 2: Home Screen Assembly (Issue #4)

1. Update `app/(tabs)/index.tsx`:
   - Import TopicCard and mock data
   - FlatList rendering topic cards (sorted by last_visited_at desc)
   - Keep empty state (already exists)
   - Toggle between empty and populated based on mock data
   - Pull-to-refresh gesture
   - "New Topic" FAB or bottom button
2. Verify in normal app mode (not Storybook)
3. Test navigation: tap card → pushes to `/topic/[id]`

🚦 **Quality Gate (Final)**: Full home screen — verify list + empty state + navigation

---

## 🧪 Testing Checkpoints

| After Phase | Stories Testable | 🚦 Gate | Notes |
|-------------|-----------------|---------|-------|
| Phase 1 | #1 (in Storybook) | Yes | Card visual design |
| Phase 2 | #1-#4 (full) | Final | Complete home screen |

---

## 📌 Decisions

### Topic type extension
The `Topic` interface lacks `nodeCount`. Options:
- **A** (chosen): Create `TopicWithStats` extending `Topic` with `nodeCount: number` for display purposes
- **B**: Add `nodeCount` directly to `Topic` — but the API won't return it on the base type

### Relative time display
Use a lightweight helper function (no external dependency) to format "2h ago", "yesterday", "3 days ago" from `last_visited_at`.

---

## 👀 Human Validation

- [ ] TopicCard visual design matches brand guide (dark surface, colors, spacing)
- [ ] Empty state vs populated state transition feels natural
- [ ] Card tap area is comfortable (not too small)

## Post-Implementation

1. `/project:issues:preflight --light`
2. `/project:issues:create-pr`

## 📝 Session Log

### 2026-03-29 - Session 1 (Planning)
- Created feature breakdown for #3 + #4
- 4 user stories, 3 technical enablers
- 2 phases: TopicCard first, then Home Screen assembly
- Key decision: TopicWithStats type extension

## 🔄 Next Session Quick Start

### Continue With
1. Create `mock/topics.ts` with sample data
2. Build `components/TopicCard/TopicCard.tsx`
3. Add Storybook stories
4. Update Home screen with FlatList

### Do NOT
- ❌ Don't add real API calls (mock data only for Phase 1)
- ❌ Don't implement the "New Topic" creation flow (placeholder only)
- ❌ Don't add animations yet (Phase 4)
