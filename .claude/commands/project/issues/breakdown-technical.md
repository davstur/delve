# Technical Breakdown Command

You are a technical architect skilled at decomposing complex engineering work
into logical implementation blocks. You help teams understand technical
dependencies, identify risks, and create actionable implementation paths for
infrastructure, API, and backend work.

**This breakdown file serves as the primary progress tracking document
throughout implementation.** Update it continuously as you work - it's your
source of truth for status, decisions, and session handoffs.

## When to Use This Command

Use `breakdown-technical` when:

- The work is purely infrastructure with NO direct user-facing impact
- Examples: database migrations, internal refactoring, performance optimizations
  (unless slowness is user-visible), backend API changes that don't affect UX
- The primary concern is "how do we build the foundation?"

Use `breakdown-feature` instead when:

- The issue involves ANY user-facing changes (UI, UX, user workflows)
- Users will see, experience, or interact with the result of this work
- You want to validate that planned work actually serves users

**Important**: Don't use technical breakdown just because requirements are
"settled" in a design doc. If the work affects what users see or experience, use
feature breakdown—the user-story lens helps validate that specs actually serve
users well, even when detailed.

**Rule of thumb**: If users will notice this work exists, use feature breakdown.

## Prerequisites

1. Ensure GitHub CLI (`gh`) is configured and authenticated
2. Check that you're in a git repository with GitHub remote
3. Verify workflow structure exists (`.claude/commands/project/` and `docs/`)
4. Check for `docs/plans/` directory (create if needed)

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which can include:

- Issue number(s): `#123` or `#123 #124 #125`
- Direct description: `"Implement caching layer"`
- Light mode: `--light` (simplified output with progress tracking)
- Research depth: `--research none|normal|deep` (default: normal)
- Output format: `--format table|blocks|both` (default: both)
- Skip status check: `--skip-status-check` (skip checking existing
  implementations)
- Test coverage: `--tests none|light|standard|thorough` (default: standard)
- Skip bounce: `--no-bounce` (skip expert review after plan)

Examples:

```
/project:issues:breakdown-technical #159
/project:issues:breakdown-technical #159 --light
/project:issues:breakdown-technical "API authentication refactor"
/project:issues:breakdown-technical #234 --research deep
/project:issues:breakdown-technical "Database migration" --format blocks --skip-status-check
/project:issues:breakdown-technical #456 --tests thorough
/project:issues:breakdown-technical "Quick spike for caching" --tests none
```

## Process

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Breakdown in progress","command":"breakdown-technical","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 0. Load Strategic Foundation

**Before analyzing the technical work**, load the project's strategic context if
available:

1. **Read PLATFORM.md** (if it exists) — the strategic foundation document
   - Core principles that constrain technical decisions
   - Strategic trade-offs that shape architecture
   - Non-negotiable patterns and constraints

2. **Throughout breakdown**: Reference PLATFORM.md when deciding:
   - Whether proposed architecture aligns with platform principles
   - If there are strategic constraints to respect
   - Whether the technical approach supports long-term direction

### 1. Parse Input and Gather Context

1. **Issue Mode**: If issue numbers provided
   - Fetch technical requirements from GitHub
   - Extract architectural decisions and constraints
   - Note related issues and dependencies

2. **Description Mode**: If direct description provided
   - Use as the technical work to break down
   - Infer scope from description

### 2. Check for Light Mode

If `--light` flag is present, generate a simplified breakdown (see section 2.5).
Otherwise, continue with full breakdown process.

### 2.5 Light Breakdown Format (--light)

When `--light` is specified, generate a concise breakdown optimized for simple
issues. This still creates a tracking document but with minimal upfront
analysis.

**Light Breakdown Template**:

```markdown
# [Issue Title] - Light Technical Breakdown

**Issue**: #[Number] **Created**: [Date] **Status**: Not Started

## Summary

[1-2 sentence description of what needs to be done]

## Files to Modify

- `path/to/file1.ts` - [Brief description of change]
- `path/to/file2.ts` - [Brief description of change]

## Implementation Checklist

- [ ] Step 1: [Specific action]
- [ ] Step 2: [Specific action]
- [ ] Step 3: [Specific action]
- [ ] Step 4: Run tests and verify
- [ ] Step 5: Update types if needed

## 🎨 Taste Decisions

- [ ] 🎨 [Decision] - Rec: [Brief recommendation] - ⏸️ Pending PO

_(Delete section if none identified)_

## Progress Tracking

**Current Step**: Not started **Blockers**: None **Decisions Made**: None yet

## 👀 Human Validation

_Fill in during/after implementation — things automated checks can't verify._

- [ ] [e.g., "Verify migration output for existing production data"]
- [ ] [e.g., "Confirm RLS policy actually blocks cross-tenant access in UI"]
- [ ] [e.g., "Check API response times under realistic load"]

_(Delete placeholder items and replace with real ones as they emerge. If nothing
needs human eyes, delete section.)_

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight check: `/project:issues:preflight`
3. Run external review: `/project:issues:review`
4. Create PR: `/project:issues:create-pr`

## Session Log

### [Date] - Session 1

- Started: [time]
- Completed: [checklist items]
- Next: [what's remaining]
```

After generating, save to `docs/plans/[date]-issue-[number]-breakdown.md` (same
naming convention as full breakdowns - the `--light` flag only affects content
depth, not the filename).

**⚠️ MANDATORY NEXT STEPS** (do not skip):

1. **Section 11**: Show the breakdown summary to the user
2. **Section 12**: Run the full expert review & bounce (same as non-light mode)

### 3. When Design Doc/Spec Exists

When a design document, technical spec, or architecture decision record exists
for the issue:

#### 3.1 Critical Analysis (Same Rigor as Fresh Analysis)

Analyze the design doc with the same scrutiny as if you were designing from
scratch:

- Does the schema make sense? Are constraints correct?
- Are there edge cases not covered?
- Do the proposed patterns fit the codebase?
- Are there implicit assumptions that should be explicit?

**Do NOT skip this step** - existing docs may have errors, outdated assumptions,
or gaps.

#### 3.2 Challenge What Seems Off

If something in the design doc seems questionable:

- **Flag it explicitly** in the breakdown with your reasoning
- **Discuss before proceeding** - don't silently "fix" or work around it
- Mark as 📌 **DESIGN QUESTION**: [What seems off and why]

Example:

```
📌 DESIGN QUESTION: Schema shows `expires_at` in partial unique index predicate,
but PostgreSQL partial indexes require immutable expressions. `expires_at < now()`
would be unstable. Should we use a different approach (e.g., pg_cron to auto-revoke)?
```

#### 3.3 When Proceeding: Precision Over Paraphrase

Once you've analyzed and agreed (or discussed and resolved):

- **Copy schema verbatim** - exact column names, types, constraints, syntax
- **Check decision status** - mark as "Decided" if design doc already decided
- **Quote, don't paraphrase** - if design says `token UUID PRIMARY KEY`, don't
  write `id UUID PRIMARY KEY, token TEXT UNIQUE`
- **Note the source** - e.g., "Schema from Design Doc Section 4.3"

⚠️ **Common Failure Mode**: Reading a design doc, understanding the _concept_,
then writing schema that _seems right_ rather than copying exactly. This creates
subtle mismatches that cause implementation errors.

### 4. Research Based on Depth

#### None (--research none)

- Skip codebase analysis
- Use only provided information
- Quick breakdown for planning

#### Normal (--research normal) [Default]

- Review project structure
- Analyze existing implementations
- Check technical patterns and conventions
- Identify reusable components
- 5-10 minute analysis

#### Deep (--research deep)

- Comprehensive codebase analysis
- Review all related systems
- Check external dependencies
- Identify technical constraints
- Map data flows and integrations
- 15-20 minute analysis

### 4.5 Test Coverage Levels

Based on `--tests` flag, adjust how much test planning to include:

#### None (--tests none)

- Skip test planning entirely
- Use for: spikes, throwaway prototypes, exploration
- Blocks include no Test Approach field
- No "What to Test" sections

#### Light (--tests light)

- Critical path tests only
- Use for: simple changes, low-risk work, tight deadlines
- Focus on: happy path integration tests, basic smoke tests
- Skip: edge cases, error scenarios, performance tests

#### Standard (--tests standard) [Default]

- Balanced coverage matching code type
- Use for: most production work
- Include: unit tests for logic, integration for data/RLS, component for UI
- Guidance table below applies

#### Thorough (--tests thorough)

- Comprehensive coverage including edge cases
- Use for: critical systems, security-sensitive code, public APIs
- Include: all standard tests plus error scenarios, E2E for user journeys
- Add: performance benchmarks, load testing considerations

**Test Approach by Code Type** (for standard/thorough levels):

| Code Type                           | Test Type                                        | Why                   |
| ----------------------------------- | ------------------------------------------------ | --------------------- |
| Pure functions, validators, mappers | **Unit**                                         | Fast, many edge cases |
| UI components, visual states        | **Component** (e.g., Storybook, Testing Library) | See all states        |
| Repositories, queries, RLS policies | **Integration**                                  | Real DB behavior      |
| Type definitions                    | **TypeScript compiler**                          | Types are the test    |

> For thorough level: E2E tests planned at the **phase level** for critical user
> journeys.

### 4.6 Identifying Taste Decisions in Technical Work

Even technical work can involve **taste decisions** - subjective choices about
how systems behave that affect user experience. These are less common than in
feature work but equally important to flag.

#### Quick Test

> **"Could two senior engineers reasonably disagree on the UX impact of this?"**
>
> - Yes → 🎨 TASTE (flag it, get PO input)
> - No → 📌 Decision (technical choice, proceed with best practice)

#### Criteria: Flag as 🎨 TASTE when technical work involves:

1. **API Design Choices**: How consumers interact with your API
   - Response format and structure (nested vs flat, verbose vs minimal)
   - Error response format and detail level
   - Default values and implicit behaviors

2. **Error Handling UX**: How technical errors surface to users
   - Error message wording and tone
   - What details to expose vs hide
   - Retry behavior and user guidance

3. **Performance vs UX Tradeoffs**: When optimization affects experience
   - Pagination size defaults
   - Loading behavior (eager vs lazy, skeleton vs spinner)
   - Cache invalidation timing (stale data tolerance)

4. **Default Configurations**: System behaviors without explicit user choice
   - Timeout values that affect perceived responsiveness
   - Batch sizes that affect feedback timing
   - Notification/alert thresholds

#### NOT Taste Decisions (regular 📌 Decision):

- Architecture patterns (repository vs service, sync vs async)
- Technology choices (which database, which queue)
- Security implementations (encryption method, token format)
- Performance optimizations (indexing strategy, caching layer)

#### 🎨 TASTE Template (Technical):

```markdown
🎨 TASTE: [Concise question about the user-affecting technical choice]

**Context**: [Why this affects user experience]

**User Impact Analysis**:

- [How this technical choice surfaces to users]
- [What users will perceive or experience]

**Options** (Senior Engineering + UX Perspective):

1. **[Option Name]** (Recommended if you have a preference)
   - Technical: [Implementation detail]
   - User Experience: [What users perceive]
   - Tradeoff: [What you gain/lose]

2. **[Option Name]**
   - Technical: [Implementation detail]
   - User Experience: [What users perceive]
   - Tradeoff: [What you gain/lose]

**Recommendation**: [Your suggestion with rationale]

**Needs PO Input**: Yes ⏸️
```

#### Example:

```markdown
🎨 TASTE: What error detail level should the sync API return?

**Context**: When sync fails partially, we need to decide what information to
return. This affects how users understand and recover from failures.

**User Impact Analysis**:

- Users see these errors in the UI after triggering manual sync
- Too little detail: frustrated users, support tickets
- Too much detail: confused users, exposed internals

**Options** (Senior Engineering + UX Perspective):

1. **Detailed per-record errors** (Recommended)
   - Technical: Return array of {recordId, error, suggestion}
   - User Experience: "3 students failed: John (duplicate), Jane (missing
     email)..."
   - Tradeoff: More payload, but actionable

2. **Summary only**
   - Technical: Return {successCount, failCount, generalReason}
   - User Experience: "3 of 150 students failed to sync due to data issues"
   - Tradeoff: Simpler, but users can't self-serve fix

3. **Tiered detail**
   - Technical: Summary by default, detail on expand/request
   - User Experience: Progressive disclosure of error detail
   - Tradeoff: More complex UI, but balances both needs

**Recommendation**: Option 1 - users managing data expect to know exactly what
failed so they can fix it. Support cost of vague errors outweighs payload size.

**Needs PO Input**: Yes ⏸️
```

### 5. Generate Implementation Blocks

For each aspect of the technical work, create implementation blocks:

**Block Format**:

```
Block: [Functional Outcome]
Purpose: [What this enables/unlocks]
Dependencies: [What must exist first]
Status: ✅ Done | ⚠️ Partial | ❌ None
Test Approach: [Unit | Integration | Component | TBD] (if --tests light/standard/thorough)
Testable Milestone: [Specific action to verify it works]
Decision Points: [Architectural/business decisions needed]
```

> Note: Test Approach is omitted when using `--tests none`. Use "TBD" for early
> planning stages.

**Categories to Consider**:

1. **Data Layer**: Schema, migrations, models, RLS policies
2. **Repository Layer**: Data access patterns, queries
3. **Service Layer**: Business logic, orchestration
4. **API Layer**: Endpoints, contracts, validation
5. **Integration Layer**: External service adapters
6. **Infrastructure**: Caching, queuing, monitoring
7. **Security**: Authentication, authorization, encryption
8. **Migration**: Data migration, backwards compatibility
9. **Observability**: Logging, metrics, tracing
10. **Error Handling**: Failure modes, recovery
11. **Performance**: Optimization, indexing
12. **Documentation**: API docs, architecture diagrams

### 5. Analyze and Categorize

For each block, determine:

1. **Priority**:
   - 🟢 MUST: Core functionality, blocking other work
   - 🟡 SHOULD: Important for quality/performance
   - 🔵 NICE: Polish, optimization, future-proofing

2. **Status** (unless --skip-status-check):
   - ✅ Exists: Already implemented
   - ⚠️ Partial: Some foundation exists
   - ❌ None: Not yet started

3. **Technical Metrics**:
   - Complexity: Low/Medium/High
   - Risk: Low/Medium/High
   - Effort: Hours/Days
   - Dependencies: What blocks this

4. **Testable Milestone**:
   - Specific action to verify completion
   - Expected observable result
   - Command or manual check

5. **Decision Points**:
   - Mark with 📌 **Decision**: [What needs deciding]
   - Include context for the decision
   - Note if blocking further work

6. **Dependency Graph**:
   - What can be done in parallel
   - What must be sequential
   - External dependencies

### 6. Format Output

#### Table Format (--format table or both)

```markdown
# [Technical Work] Breakdown

## Implementation Blocks Overview

<!-- For --tests standard/thorough, include Test Approach column -->
<!-- For --tests none/light, omit Test Approach column -->

| Block                   | Purpose                   | Status     | Testable Milestone            | Decision Points                  |
| ----------------------- | ------------------------- | ---------- | ----------------------------- | -------------------------------- |
| **1. Schema + RLS**     | Foundation for data model | ✅ Exists  | Migrations run, policies pass | -                                |
| **2. Domain Models**    | Type-safe data structures | ⚠️ Partial | No type errors                | 📌 Validation library?           |
| **3. Repository Layer** | Data access abstraction   | ❌ None    | CRUD operations pass          | -                                |
| **4. Mappers**          | Transform data shapes     | ❌ None    | All transforms work           | 📌 Handle missing fields how?    |
| **5. API Adapter**      | Transform external data   | ❌ None    | Parse API response correctly  | -                                |
| **6. Error Recovery**   | Handle sync failures      | ❌ None    | Retry logic works             | 📌 Retry strategy (exponential?) |

## 🎨 Taste Decisions Requiring PO Input

| #   | Decision                    | Block | Recommendation          | Status     |
| --- | --------------------------- | ----- | ----------------------- | ---------- |
| T1  | Error detail level in API   | #6    | Detailed per-record     | ⏸️ Pending |
| T2  | Sync timeout user messaging | #5    | Progressive with cancel | ⏸️ Pending |

> **Note**: These technical choices affect user experience. Pause implementation
> and get PO input before proceeding with these decisions.

...
```

#### Blocks Format (--format blocks or both)

````markdown
## 1. Schema + RLS

**Purpose**: Establish foundation for data model **Complexity**: Low
**Priority**: 🟢 MUST HAVE **Status**: ✅ Exists (migration 20250104\_...)
**Dependencies**: None

<!-- Include Test Approach section for --tests standard/thorough -->

**Test Approach**: Integration (RLS policies require real auth context)

**What to Test**: _(for --tests standard/thorough)_

- [ ] RLS policies allow/deny correctly per role
- [ ] Constraints enforce data integrity
- [ ] Indexes exist on FK columns

**Testable Milestone**:

```bash
# Run migrations
pnpm db:migrate
# Expected: All tables created, RLS policies applied
```
````

**Technical Details**:

- Tables: students, classes, enrollments
- Indexes on foreign keys
- Constraints for data integrity

**📌 Decision Points**: None

**🎨 Taste Decisions**: None

---

## 2. Mappers

**Purpose**: Transform between database and domain shapes **Complexity**: Low
**Priority**: 🟢 MUST HAVE **Status**: ⚠️ Partial (base mappers exist)
**Dependencies**: Schema (#1)

<!-- Include Test Approach section for --tests standard/thorough -->

**Test Approach**: Unit (pure functions, many edge cases)

**What to Test**: _(for --tests standard/thorough)_

- [ ] Null user handling (unclaimed entities)
- [ ] All field transformations
- [ ] Edge cases (empty strings, missing optional fields)

**Testable Milestone**:

```bash
# Validate mapper tests pass
pnpm test -- mapper
# Expected: All mapper tests pass
```

**Technical Details**:

- Handle nullable user data for unclaimed records
- Names always from profile table, email/avatar from users

**📌 Decision Points**: Default values for missing fields?

**📝 Implementation Progress**:

```markdown
Status: IN PROGRESS Started: [Date] Completed: [Date]

What was done:

- ✅ Base types created
- ⏳ Validation rules (50% done)
- ❌ Runtime validation

Decisions made:

- Using Zod for validation (better TS integration)
- Default role = 'unknown' for missing data

Discoveries:

- Beekeeper uses different field names than expected
- Need mapping layer for external_id variations

Test results:

- 3/5 tests passing
- Failing: email validation, role enum

Next session needs:

- Complete validation rules
- Fix failing tests
- Document field mappings
```

**Implementation Notes**:

```typescript
// packages/supabase/src/domain/student.ts
export interface Student {
  id: string
  externalId?: string // Beekeeper ID
  firstName: string
  lastName: string
  // ... validation methods
}
```

---

## 3. Repository Layer

**Purpose**: Abstract data access, enable testing  
**Complexity**: Medium  
**Priority**: 🟢 MUST HAVE  
**Status**: ❌ None  
**Dependencies**: Domain Models (#2)  
**Effort**: 4 hours

**Technical Details**:

- Implement repository pattern
- Separate read/write operations
- Handle transactions

**Key Interfaces**:

```typescript
interface StudentRepository {
  findByExternalId(id: string): Promise<Student | null>
  upsert(student: Student): Promise<Student>
  // ...
}
```

````

### 7. Quality Gates & Milestones

Define checkpoints where progress can be verified. Each milestone is a
**natural quality gate** — a point where the breakdown doc should be updated
and progress validated before moving on.

```markdown
## 🎯 Milestone Checkpoints

### Milestone 1: Foundation Complete
**Testable Outcomes:**
```bash
# Run foundation tests
pnpm test:foundation
# Expected: All safety checks pass
````

**Success Criteria:**

- [ ] Cannot accidentally corrupt data
- [ ] All models validated
- [ ] Repository pattern working

### Milestone 2: Integration Ready

**Testable Outcomes:**

```bash
# Test API connection
pnpm test:integration
# Expected: Successfully fetches external data
```

**Success Criteria:**

- [ ] Connected to external API
- [ ] Data transformation working
- [ ] No data loss in mapping

### Milestone 3: Sync Operational

**Testable Outcomes:**

```bash
# Run full sync test
pnpm run sync --dry-run
# Expected: Shows what would be synced
```

**Success Criteria:**

- [ ] Full sync completes without errors
- [ ] Incremental sync detects changes
- [ ] Performance within acceptable limits

### When You Reach a Milestone

Do these before moving to the next phase:

1. **Update the breakdown doc** — mark completed blocks, update the progress
   table, record decisions made and discoveries during the phase. The doc should
   reflect reality before anyone evaluates the milestone.
2. **Run the verification commands** — execute the testable outcomes for this
   milestone and record results in the doc.
3. **Evaluate next steps** — use the Implementation Autonomy guidance (see
   below) to decide whether to continue, bounce, or stop for user input.

````

### 8. Implementation Roadmap

Based on dependencies and priorities:

```markdown
## Implementation Phases

### Phase 1: Foundation (Day 1)
**Can be done in parallel:**
- Complete Domain Models (#2)
- Design Repository interfaces (#3)

_Tests (if --tests standard+):_ Unit tests for models

### Phase 2: Data Layer (Day 2)
**Sequential work:**
- Implement Repository Layer (#3)
- Create API Adapter (#4)

_Tests (if --tests standard+):_ Integration tests for data layer
_📍 Milestone:_ Milestone 1 (Foundation Complete) → update doc, run verification

### Phase 3: Core Logic (Day 3-4)
**Main implementation:**
- Build Sync Orchestrator (#5)
- Add basic error handling

_Tests (if --tests standard+):_ Unit tests for orchestration logic
_E2E (if --tests thorough):_ Happy path for user-triggered sync
_📍 Milestone:_ Milestone 2 (Integration Ready) → update doc, run verification

### Phase 4: Robustness (Day 5)
**Quality improvements:**
- Implement Error Recovery (#6)
- Add comprehensive logging

_Tests (if --tests standard+):_ Unit tests for error scenarios
_E2E (if --tests thorough):_ Error recovery for critical paths
_📍 Milestone:_ Milestone 3 (Sync Operational) → update doc, run verification

### Phase 5: Optimization (Future)
**Performance tuning:**
- Add caching layer (#7)
- Implement batch operations
- Add metrics collection

_Tests (if --tests thorough):_ Performance benchmarks, load tests

## Quick Verification Commands

After each phase, run these checks:

```bash
# Phase 1 Check
pnpm test:unit
# ✅ All unit tests pass

# Phase 2 Check
pnpm test:integration
# ✅ External connections work

# Phase 3 Check
pnpm run verify
# ✅ System operational

# Phase 4 Check
pnpm run metrics
# ✅ Performance acceptable
````

## Dependency Graph

```
┌──────────────┐
│ DB Schema #1 │ ✅
└──────┬───────┘
       │
┌──────▼────────┐
│ Domain Models │ ⚠️
│      #2       │
└──────┬────────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐ ┌───▼──────────┐
│ Repository  │ │ API Adapter  │
│     #3      │ │      #4      │
└──────┬──────┘ └───────┬──────┘
       │                │
       └────────┬───────┘
                │
        ┌───────▼──────────┐
        │ Sync Orchestrator │
        │        #5         │
        └───────┬──────────┘
                │
        ┌───────▼────────┐
        │ Error Recovery │
        │       #6       │
        └────────────────┘
```

````

### 9. Fallback Strategies

For each phase, define fallback options:

```markdown
## Fallback Strategies

### Phase 1 Fallback
**If foundation fails:**
- Continue with existing solution
- No production impact
- Time to reassess approach

### Phase 2 Fallback
**If integration fails:**
- Use mock data temporarily
- Manual data entry option
- Investigate alternative APIs

### Phase 3 Fallback
**If sync fails:**
- Export/import via CSV
- Batch processing option
- Manual reconciliation
````

### 10. Save Breakdown

Save the breakdown for future reference:

```bash
# Create plans directory if needed
mkdir -p docs/plans

# Generate filename based on input mode
# Format: docs/plans/[timestamp]-[issue-scope]-[description]-technical-breakdown.md

# If issue number(s) provided:
# - Single issue: "issue-123"
# - Multiple issues: "issues-123-124-125"

# If description provided without issues:
# - Use slugified description

# Examples:
# Single issue:
#   docs/plans/2025-10-11-issue-159-technical-breakdown.md
#   docs/plans/2025-10-11-issue-159-api-sync-technical-breakdown.md
# Multiple issues:
#   docs/plans/2025-10-11-issues-337-339-spacing-migration-technical-breakdown.md
#   docs/plans/2025-10-11-issues-123-124-125-auth-refactor-technical-breakdown.md
# Description only:
#   docs/plans/2025-10-11-api-refactor-technical-breakdown.md
#   docs/plans/2025-10-11-caching-layer-technical-breakdown.md
```

**Include in saved file**:

```markdown
<!--
This is a LIVING DOCUMENT - Update continuously during implementation!

PROGRESSIVE TRIMMING STRATEGY:
This document evolves through phases - trim as you complete work:

Phase 1: PLANNING (Verbose OK)
- ✅ Detailed implementation blocks with code examples
- ✅ Technical details and "how to build this"
- ✅ Testable milestones and verification commands
→ Purpose: Roadmap and reference during planning

Phase 2: IMPLEMENTING (Trim as you go)
- ✅ Mark blocks complete → Remove implementation details
- ✅ Keep decisions + discoveries
- ❌ Delete code examples once implemented (code is in repo)
→ Purpose: Track progress and decisions

Phase 3: COMPLETE (Concise)
- ✅ Summary of what was built (file list)
- ✅ Key decisions with rationale
- ✅ Session log + next steps
- ❌ No redundant code/examples
→ Purpose: Handoff and reference

GOLDEN RULE: If code exists in repo, remove it from this doc.

To update this breakdown:
1. Run: /project:issues:breakdown-technical #159 to refresh status
2. Trim completed blocks - keep only decisions/discoveries
3. Update progress table and session log
4. Remove implementation details once code exists

This document serves as the source of truth for:
- Current implementation status
- Decisions made and their rationale (WHY, not WHAT)
- Key learnings and gotchas
- Session handoffs for AI agents

STATUS LINE: When transitioning between phases, update .workflow/status.json:
  echo '{"phase":"<phase>","command":"implement","startedAt":"..."}' > .workflow/status.json
-->

# [Feature] Technical Breakdown

**Issue**: #[Number]  
**Started**: [Date]  
**Last Updated**: [Date] by [Who/Session]  
**Status**: Active/Complete/Blocked

---

## 🎯 Current Focus

**Active Phase**: [Current phase name and status]  
**Current Achievement**: [What was just completed]  
**Test Results**: [Latest test outcomes if applicable]  
**Next Action**: [Immediate next step]

## 📊 Overall Progress

| Phase           | Status       | Completion | Key Outcome        |
| --------------- | ------------ | ---------- | ------------------ |
| Phase 1: [Name] | ⏳/✅ Status | X%         | [Main achievement] |
| Phase 2: [Name] | ⏳/✅ Status | X%         | [Main achievement] |
| Phase 3: [Name] | ⏳/✅ Status | X%         | [Main achievement] |

---

## 🔄 Progress Tracking

### Current Sprint/Session Focus

- Working on: [Specific block/task]
- Blocked by: [Any blockers]
- Next up: [What's planned next]

### Recent Changes

- [Date]: [What was done, decisions made]
- [Date]: [Implementation detail that matters]

## Current State Assessment

[Summary of what exists vs what needs building]

## 🔧 Decision Log

### Decisions Made

#### DEC-001: [Decision Title]

**Date**: [Date] **Type**: 📌 Technical / 🎨 Taste **Status**: ✅ Implemented /
⏳ In Progress / ❌ Reverted **Decision**: [What was decided] **Rationale**:
[Why this choice] **Alternatives**: [Other options considered] **Impact**: [What
this affects] **PO Approved**: [Yes/No/N/A] _(required for 🎨 Taste decisions)_

#### DEC-002: [Decision Title]

**Date**: [Date]  
**Status**: ⏳ Pending  
**Options**:

1. [Option A with pros/cons]
2. [Option B with pros/cons] **Needs**: [What input/testing needed to decide]

### Quick Reference

| ID      | Decision | Status     | Impact         |
| ------- | -------- | ---------- | -------------- |
| DEC-001 | [Brief]  | ✅ Done    | [Brief impact] |
| DEC-002 | [Brief]  | ⏳ Pending | [Blocked by]   |

## Assumptions & Discoveries

### Working Assumptions

- API rate limit: Assuming 100 req/min (needs verification)
- Data volume: ~150 students (confirmed with FDS)

### Key Discoveries

- [Date]: Beekeeper API requires pagination for >50 records
- [Date]: External IDs are not unique across environments
```

### 11. Provide Next Steps

After generating the breakdown:

```
✅ Technical breakdown saved to: docs/plans/2024-01-15-api-sync-technical-breakdown.md

📊 Summary:
- Total Blocks: 7
- Must Have: 5 (1 complete, 1 partial, 3 remaining)
- Should Have: 1 (0 complete)
- Nice to Have: 1 (0 complete)

🎯 Milestones:
- Milestone 1: Foundation → Ready to test
- Milestone 2: Integration → [Status]
- Milestone 3: Production → [Status]

🔀 Decisions & Divergences from Spec:
  (List every decision where the breakdown deviates from or extends the original
  issue/spec. Categorize each. Omit section if none.)
- [STRUCTURAL] <what changed and why> (e.g., "read_cursors table replaces
  messages.read_at — multi-participant read tracking")
- [ADDITION] <what was added beyond spec and why> (e.g., "guardian_relationships
  table — not in issue, schema-forward for day-one concern")
- [CHANGE] <what was redefined and why> (e.g., "sender_type uses 'student'|'staff'
  instead of 'human' — distinct RLS rules per sender")
- [BUGFIX] <what was fixed in spec and why> (e.g., "is_minor() uses age() instead
  of date arithmetic — leap year bug")

🙋 Needs User Input Before Proceeding: None
  (or a bulleted list consolidating ALL unresolved items that block implementation:
  🎨 taste decisions, 📌 technical decisions, ambiguous requirements, etc.
  If nothing needs input, explicitly state "None — ready to proceed.")

📌 Decisions Needed:
- Immediate: 3 decisions requiring input
- Upcoming: 2 decisions for next phase

🔥 Critical Path:
1. Complete Domain Models (#2) - Partially done
2. Repository Layer (#3) - Blocks everything else
3. API Adapter (#4) - Can start after #2
4. Sync Orchestrator (#5) - Main deliverable

⚠️ Technical Risks:
- High complexity in Sync Orchestrator
- External API rate limits not analyzed
- No existing error recovery pattern

🧪 Next Verification:
Run: `pnpm test:foundation`
Expected: All foundation tests pass

🎯 Next Steps:
1. Complete Domain Models validation layer
2. Design Repository interfaces before implementing
3. Research API rate limits
4. Consider creating spike for sync logic

💡 Quick Actions:
- Start with Block #2 (lowest hanging fruit)
- Blocks #3 and #4 can be developed in parallel
- Review and decide on immediate decision points
```

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Ready for implementation","command":"breakdown-technical","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 12. Expert Review & Validation (unless --no-bounce)

**⚠️ MANDATORY**: Unless `--no-bounce` was specified, you MUST immediately
execute the full expert review. Do not wait for user confirmation.

**Action**: Run this command now:

```
/project:issues:bounce --full --exit-condition "severity < medium" <path-to-breakdown-file>
```

Example:

```
/project:issues:bounce --full --exit-condition "severity < medium" docs/plans/2025-01-15-issue-123-breakdown.md
```

**What happens** (see `/bounce --full` for details):

1. Architect reviewer evaluates system design concerns
2. UX reviewer evaluates user experience (if UI touched)
3. External model iteratively validates — loops until no Medium or High severity
   findings remain (Low-severity items are applied and the loop exits)
4. You (Lead Engineer) synthesize all feedback against codebase patterns
5. Plan is updated with agreed changes

**Output format**:

```
🔄 Running full expert review...

[Invoke /project:issues:bounce --full --exit-condition "severity < medium"]

After review completes, show:
- Breakdown summary (from section 11)
- Full review summary (from bounce --full) with iteration count and exit reason
- Combined next steps
```

**Synthesis table**: The bounce `--full` Lead Engineer synthesis should produce
a consolidated Finding Assessment table (see bounce command for reference
example). This table merges all reviewer feedback into a single ranked view with
columns like Finding, Source(s), Severity, Assessment, and Action. Adapt the
format to context — the reference is a strong starting point, not a rigid
template.

## Advanced Features

### Status Checking

By default (unless `--skip-status-check` is used):

1. **Analyze existing code**:
   - Check for existing implementations
   - Review partial implementations
   - Identify reusable components

2. **Technical debt assessment**:
   - Find temporary solutions
   - Identify missing tests
   - Note performance issues

3. **Integration points**:
   - External service dependencies
   - API contracts
   - Data flow paths

### Risk Analysis

Include technical risk assessment:

```markdown
## Risk Assessment

### High Risk Items

- **Sync Orchestrator**: Complex state management, needs careful design
- **API Rate Limits**: Could block entire sync process

### Medium Risk Items

- **Data Conflicts**: Need clear resolution strategy
- **Performance**: Large datasets could timeout

### Mitigation Strategies

- Build sync orchestrator incrementally with tests
- Implement exponential backoff for API calls
- Use database transactions for consistency
```

## Quality Checks

Before finalizing:

1. **Dependencies Clear**: Is the execution order obvious?
2. **Technically Sound**: Are the approaches valid?
3. **Testable**: Can each block be verified independently?
4. **Complete**: Are all technical aspects covered?
5. **Realistic**: Are complexity and effort estimates accurate?

## Best Practices

1. **Focus on outcomes**: Each block should produce something concrete
2. **Technical precision**: Be specific about technologies and patterns
3. **Dependency awareness**: Make sequences and parallels clear
4. **Risk transparency**: Highlight complex or uncertain areas
5. **Incremental value**: Each block should be deployable/testable
6. **Architecture focus**: Consider long-term maintainability
7. **Pattern consistency**: Follow existing codebase patterns
8. **Flag UX-affecting technical choices**: When technical decisions affect what
   users see or experience (error messages, timeouts, defaults), mark as 🎨
   TASTE
9. **Recommend, don't just list**: When flagging taste decisions, provide a
   strong recommendation with engineering + UX reasoning. PO needs a starting
   point.
10. **Pause at taste decisions**: During implementation, stop and get PO input
    on unresolved taste decisions before writing code that embeds the choice

## Example Use Cases

### API Integration

```
/project:issues:breakdown-technical "Integrate payment provider API"
```

Breaks down into: API client, adapter layer, webhook handler, error recovery,
idempotency, testing strategy.

### Database Migration

```
/project:issues:breakdown-technical "Migrate from PostgreSQL to MongoDB"
```

Analyzes: Data models, migration scripts, dual-write period, rollback plan,
performance testing.

### Performance Optimization

```
/project:issues:breakdown-technical #456 --research deep --check-status
```

Identifies: Bottlenecks, caching opportunities, query optimization, indexing,
async processing options.

Remember: The goal is to surface technical dependencies and risks early,
enabling parallel work where possible and preventing blockers during
implementation.

## Living Document Philosophy

**IMPORTANT**: The technical breakdown is designed to be a LIVING DOCUMENT that
serves as:

1. **Single Source of Truth**: Track all implementation progress in one place
2. **Session Handoff Tool**: New AI sessions can understand context immediately
3. **Decision Record**: Document why choices were made, not just what
4. **Knowledge Base**: Capture discoveries and gotchas for future reference

**CRITICAL - Progressive Trimming**:

When updating an existing breakdown, **actively trim completed sections**:

- Remove implementation blocks once code exists in repo
- Delete code examples that are now in actual files
- Keep only: decisions (WHY), status, discoveries, next steps
- The document should get SHORTER as work progresses, not longer

Goal: 2000+ lines during planning → 200-300 lines when complete

### How to Keep It Alive

**During Implementation**:

- Update block status as you start/complete work
- Document decisions with rationale immediately
- Record unexpected discoveries and API quirks
- Note test results and what's failing/passing
- Add "Next session needs" for smooth handoffs
- **At milestones**: Always update the doc before evaluating next steps (see
  "When You Reach a Milestone")

**Before Context Switching**:

- Run the command again to refresh overall status
- Update "Current Sprint/Session Focus" section
- Document any blockers or pending decisions
- Commit the updated breakdown to git

**Starting New Session**:

- Read the breakdown first to understand current state
- Check "Next session needs" from previous work
- Review recent decisions and discoveries
- Continue updating as you work

### Implementation Autonomy

When you reach a milestone checkpoint (see "When You Reach a Milestone" above),
**always update the breakdown doc and run verification first**, then use your
judgment on what comes next:

**Continue directly** (default for straightforward phases):

- Phase completed as planned, no surprises
- Verification commands pass
- Next phase is clear and unblocked

**Interim bounce** (for validation mid-implementation):

- Large phase just completed with significant code changes
- Discoveries suggest the remaining plan may need adjustment
- Approaching a risky or complex upcoming phase
- Run:
  `/project:issues:bounce "Phase N complete. [summary]. Remaining phases: [...]. Any concerns before proceeding?"`

**Stop and summarize for user** (natural checkpoints):

- Taste decision encountered that needs PO input
- Significant deviation from original plan proposed
- Direction unclear or multiple viable paths emerged that the plan didn't
  anticipate
- Blocker found that requires user decision
- Good stopping point if user may want to review progress

You don't need to stop after every phase — continuous progress is fine when
things are clear. The goal is catching issues early, not creating ceremony. But
the doc should **always be up to date** when a phase completes, regardless of
whether you pause or continue.

### Progress Tracking Template

Each implementation block should include:

```markdown
**📝 Implementation Progress**: Status: NOT STARTED | IN PROGRESS | COMPLETED |
BLOCKED Started: [Date/Time] Completed: [Date/Time]

What was done:

- ✅ [Completed item]
- ⏳ [In progress item with %]
- ❌ [Not started item]

Decisions made:

- [Decision]: [Rationale]

Discoveries/Gotchas:

- [Unexpected finding]
- [API limitation discovered]

Test results:

- [X/Y tests passing]
- Failing: [what and why]

Blockers:

- [What's blocking and why]

Next session needs:

- [Specific next step]
- [What context is important]
```

This ensures seamless continuation whether it's the same developer, a new team
member, or a fresh AI session picking up the work.

## 👀 Human Validation

_Fill in during/after implementation — things automated checks can't verify._

- [ ] [e.g., "Verify migration output for existing production data"]
- [ ] [e.g., "Confirm RLS policy actually blocks cross-tenant access in UI"]
- [ ] [e.g., "Check API response times under realistic load"]

_(Replace placeholders with real items as they emerge during implementation.
Delete section if nothing needs human eyes.)_

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight check: `/project:issues:preflight`
3. Run external review: `/project:issues:review`
4. Create PR: `/project:issues:create-pr`

## 📝 Session Log

### [Date] - Session [Number] ([Brief Description])

#### What We Accomplished

1. ✅ **[Major achievement]** - [Brief detail]
2. ✅ **[Major achievement]** - [Brief detail]
3. ⏳ **[Partial progress]** - [What's done, what remains]

#### Key Technical Solutions

- **[Problem]**: [Solution implemented]
- **[Challenge]**: [How it was resolved]

#### Discoveries & Gotchas

- **[Discovery]**: [What was learned and impact]
- **[Gotcha]**: [Unexpected issue and workaround]

#### Test Results

- **[Test type]**: [Metrics/outcomes]
- **Success Rate**: X/Y (percentage)
- **Performance**: [Time/resource metrics]

#### Decisions Made

- **📌 [Technical Decision]**: [Choice and rationale]
- **🎨 [Taste Decision]**: [Choice] - PO Approved: [Yes/Date]
- **[Trade-off]**: [What was prioritized]

#### Next Session Needs

1. [Immediate priority with context]
2. [Secondary task if time permits]
3. [Investigation needed]

---

## 🔄 Next Session Quick Start

### Ready to Run

```bash
# Commands to verify current state
[verification command]

# Continue from here
[next command]
```

### Continue With

1. [Specific next implementation step]
2. [Testing needed]
3. 📌 [Technical decision to make]

### 🎨 Taste Decisions Pending PO Input

| Decision | Block | Recommendation | Blocking? |
| -------- | ----- | -------------- | --------- |
| [Brief]  | #X    | [Brief]        | Yes/No    |

> ⏸️ **Stop** before implementing blocks that depend on unresolved taste
> decisions.

### Do NOT

- ❌ [Common mistake to avoid]
- ❌ [Dangerous action]
- ❌ [Assumption to not make]
