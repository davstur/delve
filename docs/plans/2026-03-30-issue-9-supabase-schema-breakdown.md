<!--
LIVING DOCUMENT - Update continuously during implementation.
GOLDEN RULE: If code exists in repo, remove it from this doc.
-->

# Supabase Schema for Topics and Nodes - Technical Breakdown

**Issue**: #9
**Started**: 2026-03-30
**Last Updated**: 2026-03-30 by Claude
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Create Supabase migration with schema SQL

## 📊 Overall Progress

| Phase | Status | Completion | Key Outcome |
|-------|--------|------------|-------------|
| Phase 1: Migration + Schema | ❌ Not started | 0% | Tables, constraints, indexes |
| Phase 2: TypeScript Sync | ❌ Not started | 0% | Types match schema |
| Phase 3: Seed Data + Verify | ❌ Not started | 0% | Dev data, manual verify |

---

## Implementation Blocks Overview

| Block | Purpose | Status | Testable Milestone | Decision Points |
|-------|---------|--------|--------------------|-----------------|
| **1. SQL Migration** | Create topics, nodes, versions tables | ❌ None | `supabase db reset` succeeds | — |
| **2. TypeScript Type Update** | Add `sort_order` to `TopicNode` | ❌ None | No type errors | — |
| **3. Seed Data** | Dev data for Home screen + Explorer | ❌ None | Topics visible via Supabase Studio | — |
| **4. Server DB Helpers** | Typed query functions in FastAPI | ❌ None | Health check + DB query works | 📌 How to expose `nodeCount`? |

## Block Details

### 1. SQL Migration

**Purpose**: Create the foundational tables matching `types/index.ts` + issue schema
**Complexity**: Low | **Priority**: 🟢 MUST | **Effort**: 1 hour

**Schema** (from issue #9, with architect review refinements):

- `topics` table: id, title, emoji, created_at, last_visited_at
- `nodes` table: id, topic_id, parent_id, label, emoji, color, summary, content, depth (CHECK 1-4), sources (JSONB), sort_order, version_id (FK RESTRICT), updated_at, created_at
- `versions` table: id, topic_id, snapshot (JSONB), action, created_at
- Indexes: nodes(topic_id, sort_order) composite, nodes(parent_id), versions(topic_id), topics(last_visited_at DESC)
- CASCADE: topic → nodes, topic → versions. RESTRICT: parent_id (prevent accidental subtree wipe), version_id (referential integrity)
- RLS intentionally skipped — service role key bypasses it, all access is server-mediated

**Testable Milestone**: `supabase db reset` runs clean, tables visible in Studio at localhost:54323

**Architect review changes applied:**
- `parent_id` changed from CASCADE to RESTRICT (prevent accidental subtree deletion)
- `version_id` now FK with ON DELETE RESTRICT (referential integrity without cascade)
- Added `updated_at` column on nodes (needed for expand-node cache invalidation)
- Composite index `(topic_id, sort_order)` replaces single `topic_id` index

### 2. TypeScript Type Update

**Purpose**: Add `sort_order` field to `TopicNode` interface
**Complexity**: Low | **Priority**: 🟢 MUST | **Effort**: 15 min

The issue notes `sort_order` is missing from current types. Add it to `TopicNode` in `types/index.ts`. Also update `mock/topics.ts` if needed.

**Testable Milestone**: `npx tsc --noEmit` passes

### 3. Seed Data

**Purpose**: Provide realistic dev data matching mock/topics.ts subjects
**Complexity**: Low | **Priority**: 🟡 SHOULD | **Effort**: 30 min

Create a seed SQL file with 2-3 topics (e.g., "Surfing", "Nuclear Power") each with root + 4-5 H2 branches. This replaces the need for mock data once the app is wired to real DB.

**Testable Milestone**: `supabase db reset` populates data, visible in Studio

### 4. Server DB Helpers

**Purpose**: Typed Supabase query functions for topics/nodes
**Complexity**: Low | **Priority**: 🟡 SHOULD | **Effort**: 1 hour

Add read-only query helpers in a new `server/app/services/topics.py`:
- `list_topics()` → topics with node count
- `get_topic_with_nodes(topic_id)` → topic + all its nodes

Write helpers (create_topic_with_nodes) deferred to issue #10 — requires transaction strategy for multi-table inserts via Supabase REST API.

**📌 Decision: `nodeCount` approach**
`TopicWithStats.nodeCount` needs a count. Options:
1. SQL view with `COUNT(*)` join — clean but adds a view
2. Inline count in the query — simpler for MVP

Recommendation: Inline count in the `list_topics()` query. No view needed for MVP.

**Testable Milestone**: Server starts, queries work against local Supabase

---

## 🎯 Milestone Checkpoints

### Milestone 1: Schema Live (after Phase 1)
```bash
cd /Users/dstur/code/delve && supabase db reset
# Expected: Clean run, tables created, no errors
```

### Milestone 2: Full Stack (after Phase 3)
```bash
cd /Users/dstur/code/delve/server && poetry run python -c "from app.services.database import get_supabase; print(get_supabase().table('topics').select('*').execute())"
# Expected: Returns seed data
```

---

## Implementation Phases

### Phase 1: Migration + Schema (30 min)
- Create `supabase/migrations/YYYYMMDDHHMMSS_create_schema.sql`
- All tables, constraints, indexes from issue

### Phase 2: TypeScript Sync (15 min)
- Add `sort_order` to `TopicNode` in `types/index.ts`
- Verify types compile

### Phase 3: Seed Data + DB Helpers (1.5 hours)
- Create `supabase/seed.sql` with realistic dev data
- Add query helpers to server
- Verify end-to-end: `supabase db reset` → query via server

---

## Dependency Graph

```
Migration SQL (#1) → Seed Data (#3) → DB Helpers (#4)
                   → TypeScript Sync (#2)
```

Phase 1 is the foundation. Phases 2 and 3 can partially overlap.

---

## 👀 Human Validation

_Fill in during implementation._

---

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight check: `/project:issues:preflight --light`
3. Create PR: `/project:issues:create-pr`

## 📝 Session Log

### 2026-03-30 - Session 1
- Started: Breakdown creation
- Next: Implementation
