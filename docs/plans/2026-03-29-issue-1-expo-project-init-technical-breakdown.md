<!--
This is a LIVING DOCUMENT - Update continuously during implementation!

PROGRESSIVE TRIMMING STRATEGY:
- Phase 1 (PLANNING): Detailed blocks with steps — current state
- Phase 2 (IMPLEMENTING): Mark blocks complete, remove detail
- Phase 3 (COMPLETE): Summary, decisions, session log only

GOLDEN RULE: If code exists in repo, remove it from this doc.
-->

# Initialize Expo Project — Technical Breakdown

**Issue**: #1
**Started**: 2026-03-29
**Last Updated**: 2026-03-29 by Claude
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Begin Block 1 (Expo project init)

## 📊 Overall Progress

| Phase | Status | Completion | Key Outcome |
|-------|--------|------------|-------------|
| Phase 1: Scaffold | ❌ Not started | 0% | Expo project runs in simulator |
| Phase 2: Structure | ❌ Not started | 0% | File-based routing + types |
| Phase 3: MCP Setup | ❌ Not started | 0% | Simulator inspection working |

---

## Implementation Blocks Overview

| Block | Purpose | Status | Testable Milestone |
|-------|---------|--------|--------------------|
| **1. Expo Project Init** | Runnable app shell | ❌ None | `npx expo start` launches, app renders in simulator |
| **2. Expo Router Setup** | File-based navigation | ❌ None | Navigate between Home and Explorer screens |
| **3. Core Types** | Shared TypeScript definitions | ❌ None | `npx tsc --noEmit` passes with zero errors |
| **4. MCP Simulator Setup** | Claude Code can inspect simulator | ❌ None | Take screenshot and read UI elements via MCP |

---

## Block Details

### 1. Expo Project Init

**Purpose**: Get a runnable Expo app in the current repo
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: None

**Implementation Steps**:

1. Commit all existing untracked files first (safety net)
2. Run `npx create-expo-app@latest` in a temp directory with `--template blank-typescript`
3. Copy generated files (package.json, tsconfig.json, app/, etc.) into repo root
4. Manually add Expo Router (`npx expo install expo-router`) and configure
5. Review and merge `.gitignore` — ensure `.claude/`, `docs/`, `inception-notes/` are NOT gitignored
6. Verify `npx expo start` works
7. Build and launch in iOS Simulator

**Testable Milestone**: App renders the default tabs template in iOS Simulator

**📌 Decision: Scaffolding approach** (updated after architect review)
- Scaffold in temp directory, copy files in — avoids the fragile backup/restore dance
- Use `blank-typescript` template instead of `tabs` — cleaner starting point, no boilerplate teardown
- Add Expo Router manually (10 min extra, but zero unwanted code)

---

### 2. Expo Router File Structure

**Purpose**: Set up the navigation structure matching architecture doc
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: Block 1

**Implementation Steps**:

1. Restructure `app/` directory from tabs template to match architecture:
   ```
   app/
   ├── _layout.tsx          — Root layout (stack navigator)
   ├── (tabs)/
   │   ├── _layout.tsx      — Tab bar config (Home tab only for now)
   │   └── index.tsx        — Home screen (placeholder)
   └── topic/
       └── [id].tsx         — Explorer screen (placeholder, pushed from Home)
   ```
2. Home screen: simple placeholder with "Delve" header and "Home Screen" text
3. Explorer screen: placeholder that displays the topic `id` param
4. Wire navigation: tapping something on Home pushes to `/topic/[id]`
5. Add `testID` props to all interactive elements

**📌 Decision: Explorer as tab vs stack screen**
- Architecture doc says Explorer is a stack push from Home, not a separate tab
- The tabs template creates multiple tabs by default — we'll simplify to single Home tab
- Explorer lives outside `(tabs)/` as a stack screen
- **Decision**: Single tab (Home) + stack-pushed Explorer. Matches spec.

**Testable Milestone**: Tap a button on Home → navigates to `/topic/test-id` → shows "Explorer: test-id"

---

### 3. Core TypeScript Types

**Purpose**: Shared type definitions for Topic, TopicNode, and related models
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: Block 1

**Implementation Steps**:

1. Create `types/index.ts` with interfaces from the data model:
   - `Topic` (id, title, emoji, created_at, last_visited_at)
   - `TopicNode` (id, topic_id, parent_id, label, emoji, color, summary, content, depth, sources, created_at, version_id)
   - `Source` ({title, url})
   - Defer `TopicVersion`, `QuizQuestion`, `QuizResult`, `TopicSuggestion`, `SubtopicSuggestion` — arrive with their consumers
2. Enable TypeScript strict mode in `tsconfig.json`
3. Verify zero type errors

**Testable Milestone**: `npx tsc --noEmit` exits with code 0

---

### 4. MCP Simulator Inspection Setup

**Purpose**: Enable Claude Code to build, launch, and inspect the app in iOS Simulator via MCP
**Complexity**: Medium
**Priority**: 🟡 SHOULD (downgraded — depends on external tooling availability)
**Dependencies**: Block 1

**Implementation Steps**:

1. **Probe first** (before Block 1): Check which MCP servers are available in current Claude Code session
2. If Expo MCP or simulator MCP available: configure and test screenshot + element query workflow
3. If none available: document manual testing workflow as fallback, note MCP setup as future enhancement
4. Verify `testID` props are findable via whatever inspection tool is available
5. Document the chosen testing workflow in CLAUDE.md

**📌 Decision: Which MCP tool for simulator inspection?**
- Product spec mentions XcodeBuildMCP, iOS Simulator Skill, and Expo MCP
- For Phase 1 (Expo managed workflow), Expo dev client + MCP is simplest path
- **Fallback**: If no MCP tools available, use Playwright MCP to inspect web version via `npx expo start --web`, or document manual simulator testing workflow
- **Action**: Probe available MCP tools at start of implementation

**Testable Milestone**: Claude Code can take a screenshot of the running app and identify UI elements by testID

---

## Dependency Graph

```
Block 1: Expo Init
    ├── Block 2: Router Setup
    ├── Block 3: Core Types
    └── Block 4: MCP Setup
```

Blocks 2-5 all depend on Block 1 but are independent of each other — can be done in any order after Block 1.

---

## 🎯 Milestone Checkpoints

### Milestone 1: App Runs (after Block 1)
- Expo dev server starts
- App renders in iOS Simulator

### Milestone 2: Navigation Works (after Block 2)
- Home screen renders with placeholder
- Can navigate to Explorer screen
- testID props present on interactive elements

### Milestone 3: Full Scaffold Complete (after Blocks 3-5)
- Types compile with strict mode
- AsyncStorage installed
- MCP can inspect simulator
- All Definition of Done items from issue #1 met

---

## 🔧 Decision Log

### Decisions Made

#### DEC-001: App at repo root
**Date**: 2026-03-29
**Type**: 📌 Technical
**Status**: ⏳ Pending confirmation
**Decision**: Run `create-expo-app .` at repo root, not in a subdirectory
**Rationale**: Standard Expo convention, simpler paths, docs coexist fine at root
**Alternatives**: Subdirectory `app/` — adds path complexity for no clear benefit at this stage

#### DEC-002: Single tab + stack navigation
**Date**: 2026-03-29
**Type**: 📌 Technical
**Status**: ⏳ Pending confirmation
**Decision**: One tab (Home), Explorer is a stack push — not a tab
**Rationale**: Matches architecture doc. Explorer is contextual to a topic, not a top-level destination.

---

## Assumptions & Discoveries

### Working Assumptions
- Expo SDK 52+ is current stable
- `create-expo-app --template tabs` includes Expo Router
- Current Claude Code session has Playwright MCP but may not have Expo-specific MCP
- Existing files (CLAUDE.md, docs/, etc.) can be backed up and restored after scaffolding

---

## 👀 Human Validation

_Fill in during implementation._

- [ ] Verify app renders correctly in simulator (visual check)
- [ ] Confirm navigation feels right (Home → Explorer transition)
- [ ] Check that MCP inspection workflow is practical for development

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight check: `/project:issues:preflight --light`
3. Create PR: `/project:issues:create-pr`

---

## Preflight Results (Light) - 2026-03-29

### Summary

| Step | Status |
|------|--------|
| Typecheck | ✅ Passed (zero errors, strict mode) |
| Lint | ✅ Passed (no linter configured — fresh project) |
| Test Adequacy | ✅ N/A (scaffolding, no business logic) |

No findings. Ready for PR.

---

## 📝 Session Log

### 2026-03-29 - Session 1 (Planning)
- Created technical breakdown
- Architect review completed — 7 findings, all addressed:
  - Switched from `tabs` template to `blank-typescript` + manual Router setup (cleaner)
  - Scaffold in temp dir, copy in (safer than backup/restore)
  - Removed AsyncStorage block (no consumer in this issue)
  - Trimmed types to only Topic, TopicNode, Source (others arrive with consumers)
  - Downgraded MCP block to SHOULD with fallback plan
  - Updated architecture doc: Explorer at `app/topic/[id].tsx` not inside `(tabs)/`
  - Added `.gitignore` review step
- Reduced to 4 blocks from 5
- Next: Begin implementation starting with Block 1

---

## 🔄 Next Session Quick Start

### Continue With
1. Block 1: `npx create-expo-app@latest . --template tabs`
2. Restore project files after scaffolding
3. Verify app runs in simulator
4. Proceed to Blocks 2-5

### Do NOT
- ❌ Don't add theming, state management, or any UI beyond placeholders
- ❌ Don't install packages beyond what's in the issue scope
- ❌ Don't configure Storybook (that's issue #2)
