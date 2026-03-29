# Feature Breakdown Command

You are a product analyst skilled at breaking down complex work into
value-driven user stories from the end-user perspective. You help teams
understand the full scope of features by identifying all user-facing value
propositions while also documenting the technical enablers needed to deliver
that value. Your focus is 70-80% on user outcomes, with 20-30% on the technical
foundation required to achieve them.

**This breakdown file serves as the primary progress tracking document
throughout implementation.** Update it continuously as you work - it's your
source of truth for status, decisions, user feedback, and session handoffs.

## When to Use This Command

Use `breakdown-feature` when:

- The issue involves ANY user-facing changes (UI, UX, user workflows)
- You're adding, changing, or removing functionality users will see or
  experience
- You want to validate that planned work actually serves users
- The primary concern is "what value do users get?"

**Important**: Use feature breakdown even when requirements seem "settled" in a
design doc or spec. The user-story lens forces re-validation of whether planned
work actually serves users well—you may discover stories worth refining,
deferring, or discarding entirely. A detailed spec doesn't mean user value has
been properly validated.

Use `breakdown-technical` instead when:

- The work is purely infrastructure with NO direct user-facing impact
- Examples: database migrations, internal refactoring, performance optimizations
  (unless slowness is user-visible), backend API changes that don't affect UX
- The primary concern is "how do we build the foundation?"

**Rule of thumb**: If users will see, experience, or interact with the result of
this work, use feature breakdown. When in doubt, prefer feature breakdown.

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
- Milestone: `--milestone "Authentication Core"`
- Direct description: `"Add absence management system"`
- Light mode: `--light` (simplified output with progress tracking)
- Research depth: `--research none|normal|deep` (default: normal)
- Output format: `--format table|stories|both` (default: both)
- Skip status check: `--skip-status-check` (skip checking implementation status)
- Test coverage: `--tests none|light|standard|thorough` (default: standard)
- Skip bounce: `--no-bounce` (skip expert review after plan)
- Testing checkpoints: `--pause-at-checkpoints` (pause for manual verification
  when phases complete and new stories become testable; default: continue
  autonomously but can surface testing status on demand)

Examples:

```
/project:issues:breakdown-feature #123
/project:issues:breakdown-feature #123 --light
/project:issues:breakdown-feature #123 #124 #125
/project:issues:breakdown-feature --milestone "User Authentication"
/project:issues:breakdown-feature "Add search functionality to the app"
/project:issues:breakdown-feature #456 --research deep
/project:issues:breakdown-feature "Payment system" --format table --skip-status-check
/project:issues:breakdown-feature #789 --tests thorough
/project:issues:breakdown-feature "Quick UI prototype" --tests none
/project:issues:breakdown-feature #123 --pause-at-checkpoints
```

## Process

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Breakdown in progress","command":"breakdown-feature","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 0. Load Strategic Foundation

**Before analyzing the issue**, load the project's strategic context if
available:

1. **Read PLATFORM.md** (if it exists) — the strategic foundation document
   - Vision and core principles that shape feature decisions
   - User priorities and trade-offs
   - Domain terminology and business rules

2. **Throughout breakdown**: Reference PLATFORM.md when evaluating:
   - Whether a feature fits platform direction
   - If there are architectural constraints to respect
   - Whether user value aligns with stated priorities

### 1. Parse Input and Determine Scope

1. **Issue Mode**: If issue numbers provided
   - Fetch issue details from GitHub
   - Extract requirements and acceptance criteria
   - Note any linked issues or dependencies

2. **Milestone Mode**: If `--milestone` flag present
   - Fetch all issues in milestone
   - Analyze for common themes
   - Group related functionality

3. **Description Mode**: If direct description provided
   - Use as the feature to break down
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
# [Issue Title] - Light Feature Breakdown

**Issue**: #[Number] **Created**: [Date] **Status**: Not Started

## Summary

[1-2 sentence description of what the user will be able to do]

## User Value

As a [user role], I want [capability] so that [benefit].

## Acceptance Criteria

- [ ] User can [action 1]
- [ ] User can [action 2]
- [ ] User sees [feedback/confirmation]

## Files to Modify

- `path/to/file1.tsx` - [Brief description]
- `path/to/file2.ts` - [Brief description]

## 🎨 Taste Decisions

- [ ] 🎨 [Decision] - Rec: [Brief recommendation] - ⏸️ Pending PO

_(Delete section if none identified)_

## Progress Tracking

**Current Step**: Not started **Blockers**: None **User Feedback**: None yet

## 👀 Human Validation

_Fill in during/after implementation — things automated checks can't verify._

- [ ] [e.g., "Verify cancellation grace period matches product intent (24h)"]
- [ ] [e.g., "Check the empty state layout on mobile"]
- [ ] [e.g., "Confirm tenant isolation holds in the UI, not just API"]

_(Delete placeholder items and replace with real ones as they emerge. If nothing
needs human eyes, delete section.)_

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run 🎨 Final UI/UX Walkthrough (if UI changes): seed data audit, UX
   consistency, UI fine-tuning (see full breakdown command for guide)
3. Run preflight check: `/project:issues:preflight`
4. Run external review: `/project:issues:review`
5. Create PR: `/project:issues:create-pr`

## Session Log

### [Date] - Session 1

- Started: [time]
- Completed: [items]
- Next: [what's remaining]
```

After generating, save to `docs/plans/[date]-issue-[number]-breakdown.md` (same
naming convention as full breakdowns - the `--light` flag only affects content
depth, not the filename).

**⚠️ MANDATORY NEXT STEPS** (do not skip):

1. **Section 10**: Show the breakdown summary to the user
2. **Section 11**: Run the full expert review & bounce (same as non-light mode)

### 3. When PRD/Spec/Research Exists

When a PRD, product spec, user research findings, or UX wireframes exist for the
issue:

#### 3.1 Critical Analysis (Same Rigor as Fresh Analysis)

Analyze the existing document with the same scrutiny as if starting from
scratch:

- Do the user stories make sense? Are they actually from the user's perspective?
- Are there user roles or edge cases not covered?
- Do the acceptance criteria actually validate user value?
- Are there implicit assumptions about user behavior that should be validated?

**Do NOT skip this step** - existing specs may have gaps, outdated assumptions,
or misaligned priorities.

#### 3.2 Challenge What Seems Off

If something in the spec seems questionable:

- **Flag it explicitly** in the breakdown with your reasoning
- **Discuss before proceeding** - don't silently adjust or work around it
- Mark as 📌 **SPEC QUESTION**: [What seems off and why]

Example:

```
📌 SPEC QUESTION: PRD lists "As a System, I want to validate data" - this isn't
a real user story. Should this be reframed as "As a User, I want clear error
messages when I enter invalid data" or moved to technical enablers?
```

#### 3.3 When Proceeding: Precision Over Paraphrase

Once you've analyzed and agreed (or discussed and resolved):

- **Use exact user roles** - if spec says "Studio Manager", don't change to
  "Admin"
- **Preserve acceptance criteria** - don't paraphrase or "simplify"
- **Check decision status** - mark as "Decided" if spec already made product
  decisions
- **Note the source** - e.g., "User story from PRD Section 2.1" or "From user
  research finding #3"

⚠️ **Common Failure Mode**: Reading a PRD, understanding the _intent_, then
writing user stories that _capture the spirit_ rather than the specifics. This
creates scope drift and misaligned expectations.

### 4. Research Based on Depth

#### None (--research none)

- Skip codebase analysis
- Use only provided information
- Quick breakdown for drafts

#### Normal (--research normal) [Default]

- Review project structure
- Check conventions and patterns
- Identify existing components to reuse
- 5-10 minute analysis

#### Deep (--research deep)

- Comprehensive codebase analysis
- Review all related systems
- Check external dependencies
- Identify technical constraints
- 15-20 minute analysis

### 3.5 Identify User Roles and Personas

Before generating stories, identify all stakeholders:

**End Users** (Primary Focus):

- Primary users (e.g., Students, Customers, Employees)
- Power users (e.g., Managers, Administrators, Team Leads)
- Support roles (e.g., Help Desk, Customer Success)
- External stakeholders (e.g., Clients, Partners, Parents)

**Internal Users**:

- Operations teams
- Content creators/editors
- Analysts and reporting users
- Compliance/audit teams

**Technical Users** (only when they're end users):

- API consumers
- Integration partners
- Developers using the product (not building it)

**Focus Balance**: Aim for 70-80% end-user stories, 20-30% enabling technical
work

### 4. Generate User Stories

#### A. PRIMARY: End-User Stories (70-80% of breakdown)

Focus on direct user value and outcomes:

**Story Format**:

```
As a [actual user role]
I want [user-facing functionality]
So that [direct value/benefit to user]
```

**User-Focused Categories**:

1. **Core User Actions**: What users need to accomplish
2. **User Experience**: Making tasks easier/faster/clearer
3. **User Feedback**: Error messages, confirmations, guidance
4. **User Data Management**: What users can view, filter, export, manage
5. **User Permissions**: Who can see/do what
6. **User Notifications**: Keeping users informed
7. **User Reporting**: Insights and analytics users need
8. **User Preferences**: Customization for user needs
9. **User Support**: Help text, tooltips, documentation
10. **User Recovery**: Undo, error recovery, data restoration

#### B. SUPPORTING: Technical Enabler Stories (20-30% of breakdown)

Technical work that directly enables user features:

**Format for Technical Enablers**:

```
📌 Technical Enabler: [What needs to be done]
Enables User Stories: #[X], #[Y]
Purpose: [How this helps users]
```

**Technical Categories** (only when enabling user features):

1. **Data Foundation**: Schema/models required for user features
2. **Integration Setup**: Connecting systems users depend on
3. **Performance Work**: Only when users experience slowness
4. **Security Infrastructure**: Protecting user data and access
5. **Technical Debt**: Only when blocking user features
6. **Testing Infrastructure**: Ensuring user features work reliably

**Important**: Every technical story MUST reference which user stories it
enables

### 4.5 Test Coverage Levels

Based on `--tests` flag, adjust how much test planning to include:

#### None (--tests none)

- Skip test planning entirely
- Use for: UI prototypes, spikes, exploration
- Stories include no Test Approach field

#### Light (--tests light)

- Critical path tests only
- Use for: simple features, low-risk changes
- Focus on: happy path component tests, basic integration
- Skip: edge cases, error states, E2E

#### Standard (--tests standard) [Default]

- Balanced coverage matching story type
- Use for: most production features
- Include tests based on story type (see table below)

#### Thorough (--tests thorough)

- Comprehensive coverage including edge cases
- Use for: critical user journeys, security features, payment flows
- Include: all standard tests plus E2E for key flows
- Add: accessibility testing, error scenario coverage

**Test Approach by Story Type** (for standard/thorough levels):

| Story Type        | Primary Test                                     | Secondary Test | Why                         |
| ----------------- | ------------------------------------------------ | -------------- | --------------------------- |
| UI interaction    | **Component** (e.g., Storybook, Testing Library) | Integration    | See all states              |
| Data display      | **Component**                                    | Integration    | Visual verification         |
| Form/input        | **Component** + **Integration**                  | -              | UI states + data persist    |
| Permission/access | **Integration**                                  | -              | RLS/auth needs real context |
| Technical enabler | **Integration** or **Unit**                      | -              | Depends on what it enables  |

> For thorough level: E2E tests planned at the **feature level** for critical
> user journeys, not per-story.

n### 4.6 Identifying Taste Decisions

**Taste decisions** are subjective choices where reasonable approaches differ
based on product vision, brand feel, user behavior insights, or aesthetic
preference. These require product owner input - AI should never silently make
these choices.

#### Quick Test

> **"Could two senior UX designers reasonably disagree on this?"**
>
> - Yes → 🎨 TASTE (flag it, get PO input)
> - No → 📌 Decision (technical choice with a clearer "right" answer)

#### Criteria: Flag as 🎨 TASTE when the decision involves:

1. **Interaction Patterns**: How users trigger or complete actions
   - Click vs hover, drag vs buttons, gestures
   - Modal vs inline, drawer vs page, popover vs tooltip

2. **Feedback & Confirmation**: How the system responds to users
   - Toast vs inline message vs banner
   - Confirmation dialog vs undo pattern vs immediate action
   - Animation style, timing, and presence

3. **Information Hierarchy**: What gets visual priority
   - What's above the fold, what's collapsed
   - Primary vs secondary actions, prominence of elements
   - Data density vs whitespace balance

4. **Default Behaviors**: What happens without explicit user choice
   - Auto-save vs explicit save, auto-advance vs manual
   - Default sort order, default view, pre-selected options
   - Remembered preferences vs fresh start

5. **Error & Edge Case UX**: How to handle the unhappy path
   - Error message tone and detail level
   - Empty states, loading states, partial failure states
   - Recovery flows and forgiveness patterns

6. **User Flow Choices**: The shape of multi-step interactions
   - Wizard vs single page, linear vs non-linear
   - Required vs optional steps, progressive disclosure
   - Onboarding depth and frequency

#### NOT Taste Decisions (regular 📌 Decision):

- Technical implementation choices (which library, which pattern)
- Performance tradeoffs (caching strategy, pagination approach)
- Data model decisions (schema design, relationships)
- Security approaches (auth method, permission model)

#### 🎨 TASTE Template:

```markdown
🎨 TASTE: [Concise question about the subjective choice]

**Context**: [Why this decision matters, what triggered it]

**User Behavior Analysis**:

- [Relevant user patterns, research, or informed assumptions]
- [How users typically interact with similar features]

**Options** (Senior UX Perspective):

1. **[Option Name]** (Recommended if you have a preference)
   - Pro: [Benefit]
   - Con: [Drawback]
   - Feel: [Subjective quality - "modern", "enterprise", "playful", etc.]

2. **[Option Name]**
   - Pro: [Benefit]
   - Con: [Drawback]
   - Feel: [Subjective quality]

3. **[Option Name]** (if applicable)
   - Pro: [Benefit]
   - Con: [Drawback]
   - Feel: [Subjective quality]

**Recommendation**: [Your suggestion with brief rationale]

**Needs PO Input**: Yes ⏸️
```

#### Example Taste Decisions:

```markdown
🎨 TASTE: How should the absence form handle being closed with unsaved data?

**Context**: Users often get interrupted mid-entry. Need to decide what happens
to partial data when they navigate away or close the form.

**User Behavior Analysis**:

- Studio managers work in busy environments with frequent interruptions
- Average session is under 2 minutes based on similar admin tools
- Users rarely return to complete abandoned forms (industry data: ~15%)

**Options** (Senior UX Perspective):

1. **Auto-save as draft** (Recommended)
   - Pro: Zero friction, respects interruptions, data never lost
   - Con: Creates draft clutter if frequently abandoned
   - Feel: Modern, forgiving, "it just works"

2. **Confirmation dialog on close**
   - Pro: Explicit user control, familiar pattern
   - Con: Adds friction to quick workflows, feels dated
   - Feel: Traditional, safe, enterprise-y

3. **Silent discard with undo toast**
   - Pro: Clean, no clutter, respects user intent to close
   - Con: Relies on user noticing undo option (easy to miss)
   - Feel: Minimalist, power-user oriented

**Recommendation**: Option 1 - aligns with quick-entry use case and modern UX
expectations. Draft management is a smaller problem than lost data frustration.

**Needs PO Input**: Yes ⏸️
```

### 4.7 Story Validation Checklist

Before including any story, verify:

✅ **User Value Test**: Can you complete "This helps users by..."?

- If no → Move to technical breakdown or reject
- Example: "This helps users by reducing sync time from 6 clicks to 1"

✅ **Role Reality Check**: Is the role a real person using the system?

- "As a Developer" → Only if they're using the product as an end user
- "As a System" → Reframe from user perspective
- "As Database" → Reject and reframe around user need

✅ **Outcome Focus**: Does the story describe a user outcome?

- ❌ Bad: "As a Developer, I want smaller components"
- ✅ Good: "As an Admin, I want pages to load in under 2 seconds"
- 📌 Technical framing: "Technical: Refactor components (enables sub-2s load
  times)"

✅ **Technical Work Framing**: Is technical work properly tied to user value?

- ❌ Bad: "Extract wizard logic for better testing"
- ✅ Good: "📌 Technical: Extract wizard logic → Enables Story #5: Simplified
  3-step sync flow"

### 5. Analyze and Categorize

For each story, determine:

1. **Priority**:
   - 🟢 MUST HAVE: Core MVP, essential for basic operation
   - 🟡 SHOULD HAVE: High value, significantly improves experience
   - 🔵 NICE TO HAVE: Future enhancements, polish

2. **Progress** (unless --skip-status-check):
   - ✅ Completed: Fully implemented and working
   - ⚠️ Partial: Backend exists but no UI, or partially done
   - ❌ None: Not yet started

3. **Value Metrics**:
   - Time saved per use
   - Error reduction
   - User satisfaction impact
   - Business value

4. **Dependencies**:
   - What must be done first
   - What can be done in parallel
   - External dependencies

### 6. Format Output

<!-- Check for pre-format-output extension -->

```bash
# Load project-specific analysis extensions if they exist
if [ -f ".workflow/extensions/breakdown-feature/pre-format-output.md" ]; then
    echo ""
    echo "📌 Loading project-specific analysis..."
    cat ".workflow/extensions/breakdown-feature/pre-format-output.md"
    echo ""
elif [ -f ".claude/extensions/breakdown-feature/pre-format-output.md" ]; then
    # Support both .workflow and .claude locations for compatibility
    cat ".claude/extensions/breakdown-feature/pre-format-output.md"
    echo ""
fi
```

#### Table Format (--format table or both)

Create separated tables for user stories and technical enablers:

```markdown
# [Feature] Breakdown

## 🎯 User-Facing Stories

<!-- For --tests standard/thorough, include Test Approach column -->
<!-- For --tests none/light, omit Test Approach column -->

| #   | User Story                        | Value to User         | Priority  | Status  | Acceptance Test              |
| --- | --------------------------------- | --------------------- | --------- | ------- | ---------------------------- |
| 1   | Admin: one-click sync             | Saves 10 min/day      | 🟢 MUST   | ❌ None | Single button syncs all data |
| 2   | Manager: see items needing review | Clear workload        | 🟢 MUST   | ❌ None | Review queue visible         |
| 3   | User: undo recent changes         | Recover from mistakes | 🟡 SHOULD | ❌ None | Undo button works            |

## 📌 Technical Enablers (Required for Above)

| #   | Technical Work           | Enables | Priority  | Status  | Why Needed                       |
| --- | ------------------------ | ------- | --------- | ------- | -------------------------------- |
| T1  | Refactor mega-component  | #1, #2  | 🟢 MUST   | ❌ None | Current 1200-line file blocks UI |
| T2  | Create data sync service | #1      | 🟢 MUST   | ❌ None | Core logic for one-click sync    |
| T3  | Add audit log table      | #3      | 🟡 SHOULD | ❌ None | Required for undo functionality  |

## 🎨 Taste Decisions Requiring PO Input

| #   | Decision                              | Story | Recommendation       | Status      |
| --- | ------------------------------------- | ----- | -------------------- | ----------- |
| T1  | Form close behavior with unsaved data | #1    | Auto-save as draft   | ⏸️ Pending  |
| T2  | Error message tone and detail         | #2    | Friendly, actionable | ⏸️ Pending  |
| T3  | Empty state illustration style        | #3    | Minimal, not playful | ✅ Approved |

> **Note**: Implementation should pause at taste decisions until PO provides
> input. Use recommendations as starting point for discussion, not default
> choices.

## 🔄 Implementation Sequence

### Phase 1: Technical Foundation (Enable Core Features)

- T1: Refactor component → Unblocks UI development
- T2: Sync service → Core functionality

_Tests (if --tests standard+):_ Unit tests for refactored components _🚦 Quality
Gate:_ None (no UI yet)

### Phase 2: Core User Features (Deliver Value)

- #1: One-click sync
- #2: Review queue

_Tests (if --tests standard+):_ Component tests for UI states, integration for
data _E2E (if --tests thorough):_ Sync flow end-to-end _🚦 Quality Gate:_ First
user-facing UI — frontend validation recommended _Validate now (structural
impact):_ [e.g., page layout, navigation patterns, dialog vs inline decisions,
component hierarchy] _Defer to final walkthrough:_ [e.g., spacing fine-tuning,
color consistency, micro-interactions]

### Phase 3: Enhancements

- T3: Audit log setup
- #3: Undo functionality

_Tests (if --tests standard+):_ Integration for audit log, component for undo UI
_E2E (if --tests thorough):_ Undo flow if business-critical _🚦 Quality Gate:_
Feature-complete — full flow validation + Final UI/UX Walkthrough _Validate now
(structural impact):_ [e.g., complete user journey coherence, entry point
discoverability, cross-feature consistency] _Defer to final walkthrough:_
[Captured automatically — see Final UI/UX Walkthrough section]
```

**Column Descriptions**:

- **User Stories**: Focus on what users can do and the value they get
- **Technical Enablers**: Infrastructure needed to make user stories possible
- **Implementation Sequence**: Shows dependency flow and parallel work
  opportunities

#### Stories Format (--format stories or both)

Detailed story descriptions:

````markdown
## 1. Core Feature Name

**As a** Studio Manager **I want** to manually add absences for students who
notify me directly **So that** all absences are tracked regardless of submission
method

**Value**: Complete absence tracking, no data gaps **Priority**: 🟢 MUST HAVE
**Progress**: ⚠️ Partial (backend exists, no UI) **Dependencies**: None

**Acceptance Criteria**:

- [ ] Can select student from dropdown
- [ ] Can select date and class
- [ ] Absence saves successfully
- [ ] Appears in absence list immediately

<!-- Include Test Approach section for --tests standard/thorough -->

**Test Approach**: Component (form states) + Integration (data persistence)

**What to Test**: _(for --tests standard/thorough)_

- Component: Form states (empty, filled, submitting, error, success)
- Integration: Server action creates absence correctly

**🎨 Taste Decisions**: _(if any for this story)_

- T1: Form close behavior → ⏸️ Pending PO input (see Taste Decisions section)

**Implementation Log**:

```markdown
Started: 2025-01-05 Status: IN PROGRESS

Done:

- ✅ Server action `createAbsence` implemented
- ✅ Database schema supports manual entry
- ⏳ UI form (50% - layout done, validation pending)

User Feedback:

- Request: Bulk entry for multiple students
- Decision: Deferred to Phase 2 (adds complexity)

Actual Effort: 3h (estimated 2h) Blockers: None

Next Session:

- Complete form validation
- Add success/error notifications
- Test with real user data
```
````

````

### 7. Implementation Phases

```bash
# Load project-specific implementation planning if it exists
if [ -f ".workflow/extensions/breakdown-feature/pre-implementation-phases.md" ]; then
    echo ""
    echo "📌 Loading project-specific implementation strategy..."
    cat ".workflow/extensions/breakdown-feature/pre-implementation-phases.md"
    echo ""
elif [ -f ".claude/extensions/breakdown-feature/pre-implementation-phases.md" ]; then
    cat ".claude/extensions/breakdown-feature/pre-implementation-phases.md"
    echo ""
fi
```

Based on the breakdown, suggest implementation phases:

```markdown
## Recommended Implementation Plan

### Phase 1: Core Foundation (Week 1)

Complete MUST HAVE features with existing backend support:

- Story #2: Manual Absence Entry (complete UI)
- Story #4: Edit Existing Absences (complete UI)
- Story #5: Delete Wrong Absences (complete UI)

### Phase 2: Essential Features (Week 2)

Add SHOULD HAVE features for better UX:

- Story #7: Filter by Date Range
- Story #8: Filter by Student
- Story #10: Today's Quick View

### Phase 3: Enhancements (Week 3+)

Nice to have features based on user feedback:

- Story #11: CSV Export
- Story #16: Calendar View
- Story #18: Statistics Dashboard
````

### 7.5 Testing Checkpoints & Quality Gates

For each phase, identify **natural quality gates** — points where new UI becomes
testable and frontend validation (AI via Playwright and/or user) can catch
issues before they compound.

#### Identifying Quality Gates

A phase is a **quality gate** when it introduces user-facing UI that could have
structural consequences for later phases. Not every phase needs a gate — pure
backend phases don't.

**For each quality gate, explicitly classify** what to validate:

1. **Validate NOW (structural impact)** — Decisions that affect component
   architecture, routing, data model, or layout for subsequent phases. Getting
   these wrong means rework. Examples:
   - Page layout approach (split-panel vs separate page)
   - Navigation patterns (slide-in vs page transition)
   - Component hierarchy and information density on key views
   - Dialog vs inline editing patterns
   - Entry point placement and discoverability

2. **Defer to Final UI/UX Walkthrough (polish)** — Cosmetic items with no
   structural impact. Examples:
   - Spacing, padding, hover states
   - Typography weight/size tweaks
   - Badge/chip color tuning
   - Loading skeleton fidelity
   - Transitions and micro-animations

**Why this matters**: Structural decisions caught at Phase 2 cost minutes to
fix. The same decisions caught at Phase 4 can mean rewriting entire components.

#### Testability Mapping

```markdown
## 🧪 Testing Checkpoints

### Verification Status

| After Phase | Stories Testable | 🚦 Gate | 🤖 AI | 👤 User | Notes                 |
| ----------- | ---------------- | ------- | ----- | ------- | --------------------- |
| Phase 1     | None (backend)   | —       | —     | —       | No UI yet             |
| Phase 2     | #1, #2 (partial) | Yes     | ⬜    | ⬜      | Dialog, status badges |
| Phase 3     | #1-#4 (full)     | Final   | ⬜    | ⬜      | Complete flow         |

**Legend**: ✅ Verified | ⬜ Not yet | ⚠️ Issues found | — N/A

### Quality Gate Details

#### Phase 2 Gate: [First user-facing UI]

**Validate now (structural impact):**

- [ ] [e.g., "Conversation detail: full page vs split-panel — determines Phase 3
      component hierarchy"]
- [ ] [e.g., "Card information density — adding fields later changes repository
      queries"]
- [ ] [e.g., "Mobile list→detail transition — slide-in vs page nav affects
      layout wrapper"]

**Defer to final walkthrough:**

- Spacing/padding, hover states, badge colors, typography tweaks, animations

#### Phase 3 Gate (Final): [Feature-complete]

→ Triggers **Final UI/UX Walkthrough** (see section below)

### How Verification Works

- **🤖 AI Verification**: Agent tests via Playwright/browser automation when E2E
  tests don't exist yet. If tests pass, AI proceeds and marks its column ✅.
- **👤 User Verification**: Manual testing by human. Optional but recommended
  for UI aesthetics, "feel", and edge cases AI might miss.
- **Proceed policy**: AI proceeds if its tests pass; user column shows what
  hasn't been manually verified yet.
- **At quality gates** (do these in order):
  1. **Update the breakdown doc first** — mark completed stories, update
     progress table, record any decisions made or scope changes during the
     phase. The plan should reflect reality before validation happens.
  2. **Surface "validate now" items** — list the structural decisions from the
     quality gate details section that the user should be aware of.
  3. **Nudge for verification** — if the context makes it natural (e.g., there
     are meaningful structural items, new UI is visible, the user has been
     engaged), use AskUserQuestion to offer:
     - "I'll do a quick Playwright check myself" (AI loops through key screens)
     - "I'd like to check this myself first" (user takes a look)
     - "Looks good, continue" (skip verification for this gate) This is a **soft
       nudge, not a hard gate** — if the phase was straightforward and nothing
       structural is at stake, just note what's new and proceed. Use judgment.

### E2E Seed Data Status

**Current state**: [Describe what exists / what's missing]

**Gaps discovered during testing**:

- [ ] [Scenario not testable because seed data missing X]
- [ ] [Need Y in seed to test Story #Z]

**Seed data to add** (as gaps are discovered):

- [ ] [Specific data to add to seed-full.sql]

_Testing reveals seed gaps → Improve seed → E2E becomes possible_
```

#### Autonomy Preference

At breakdown time, ask the user:

> **Testing checkpoint behavior**: When a phase completes and new stories become
> testable, should I:
>
> 1. **Pause** for manual verification before continuing
> 2. **Continue** autonomously (you can request the testing overview anytime)

If user chooses "Continue", the agent tests via Playwright where possible, marks
AI column, and proceeds. User can manually verify anytime and update their
column. If "Pause", agent stops at each checkpoint for manual verification.

#### The Virtuous Cycle

```
Phase complete → Is this a quality gate?
    ↓ Yes                          ↓ No
Update breakdown doc first     AI tests via Playwright → Proceed
    ↓
Surface "validate now" items
    ↓
Nudge: AI Playwright check / User checks / Skip?  (soft, contextual)
    ↓
Validate structural decisions → Defer polish to final walkthrough
    ↓
Proceed to next phase
    ↓
... (repeat per phase) ...
    ↓
All phases complete → Final UI/UX Walkthrough
    ↓
Seed data audit → UX consistency → UI fine-tuning → Preflight
```

E2E tests should be written alongside features when meaningful, but manual
testing naturally surfaces seed data gaps that enable better E2E coverage. The
Final UI/UX Walkthrough is where deferred polish items, seed data gaps, and
holistic UX consistency all get addressed in one pass.

#### Final UI/UX Walkthrough

**When**: After all phases are complete and functional testing passes. This is
the last step before preflight. Do NOT skip this for features with UI changes.

**Skip if**: Purely backend changes with no user-facing UI modifications.

The Final UI/UX Walkthrough has three purposes:

##### Purpose 1: E2E Seed Data Audit

Ensure seed data is complete and accurate enough to represent all typical
frontend scenarios. Walk through every screen/state the feature touches and
verify:

- [ ] **Happy path data exists**: All primary flows have realistic test data
- [ ] **Empty states**: At least one entity type has zero records to verify
      empty state UX
- [ ] **Edge cases in data**: Long names, special characters, boundary values
- [ ] **Permission variants**: Data for each user role to verify role-specific
      views
- [ ] **State coverage**: Records in all statuses (pending, active, archived,
      etc.)
- [ ] **Relationship completeness**: Associated records exist (e.g., messages
      with replies, users with multiple roles)

**Action**: If gaps found, add seed data and re-verify before proceeding.

##### Purpose 2: Overall UX Consistency Review

Review the complete feature as a user would experience it. This is NOT about
individual story acceptance criteria (already validated) — it's about the
**holistic experience**:

- [ ] **Entry point discoverability**: Can users find the feature naturally? Is
      the navigation clear?
- [ ] **Flow coherence**: Does the complete user journey feel logical? Are there
      dead ends or confusing transitions?
- [ ] **Cross-feature consistency**: Do similar actions behave the same way
      across the app? (e.g., delete patterns, save patterns, filter patterns)
- [ ] **Information architecture**: Is content organized as users expect? Is the
      hierarchy clear?
- [ ] **Error and empty states**: Are they helpful and consistent in tone?
- [ ] **Responsive behavior**: Does the layout work across viewport sizes?
- [ ] **Potential UX improvements**: Anything that could be noticeably better
      with small effort? (Flag as enhancement, don't block the PR)

**Action**: Fix consistency issues and confusing flows. Log UX improvement ideas
as future issues.

##### Purpose 3: UI Fine-Tuning

Address all the "defer to final walkthrough" items accumulated during quality
gates, plus any new polish items discovered:

- [ ] **Spacing and alignment**: Consistent padding, margins, element alignment
- [ ] **Typography**: Font sizes, weights, line heights consistent with design
      system
- [ ] **Color and contrast**: Badges, status indicators, interactive elements
- [ ] **Hover/focus/active states**: All interactive elements have appropriate
      feedback
- [ ] **Loading and transition states**: Skeletons, spinners, animations feel
      smooth
- [ ] **Micro-interactions**: Toasts, confirmations, inline feedback

**Action**: Fix obvious issues directly. For subjective improvements, consider
running the `ui-critic` agent:

```
Use Task tool with `ui-critic` agent, provide screenshots or navigate to URLs.
Focus on: visual polish, spacing, typography, consistency, accessibility.
```

##### Final UI/UX Walkthrough Template

```markdown
## 🎨 Final UI/UX Walkthrough

**Status**: [ ] Not started / [ ] In progress / [✅] Complete **Performed by**:
🤖 AI / 👤 User / Both

### Seed Data Audit

- [✅/❌] Happy path data exists for all flows
- [✅/❌] Empty states verified
- [✅/❌] Edge case data present
- [✅/❌] Role-specific data present
- **Gaps found**: [List or "None"]
- **Seed data added**: [List or "None needed"]

### UX Consistency

- [✅/❌] Entry points discoverable
- [✅/❌] User journey coherent end-to-end
- [✅/❌] Cross-feature patterns consistent
- [✅/❌] Error/empty states helpful
- [✅/❌] Responsive behavior verified
- **Issues fixed**: [List]
- **Improvements logged for later**: [Issue numbers or "None"]

### UI Fine-Tuning

- [✅/❌] Deferred polish items addressed (from quality gates)
- [✅/❌] Spacing and alignment reviewed
- [✅/❌] Typography and color consistent
- [✅/❌] Interactive states complete
- **UI Critic agent**: [ ] Skipped / [ ] Run — [summary of findings]
- **Items fixed**: [List]
- **Accepted as-is**: [List with rationale]
```

#### Screenshot Management

Screenshots are for transient verification during development — do NOT commit
them to the repository. Let them stay where Playwright/browser tools naturally
save them (`.playwright-mcp/`, which is gitignored).

**When to capture**: After testing checkpoints, edge cases, UI Critic review.

**Do NOT**: Copy screenshots into `docs/screenshots/` or any tracked folder.
Binary assets bloat the repo and provide little long-term value once the PR is
merged.

**For PR review**: If reviewers need visual evidence, attach screenshots
directly to the GitHub PR description (drag-and-drop into the PR body). GitHub
hosts them — no repo bloat.

### 8. Post-Breakdown Extensions

```bash
# Load project-specific post-breakdown extensions
if [ -f ".workflow/extensions/breakdown-feature/post-breakdown.md" ]; then
    echo ""
    echo "📌 Adding project-specific sections..."
    cat ".workflow/extensions/breakdown-feature/post-breakdown.md"
    echo ""
elif [ -f ".claude/extensions/breakdown-feature/post-breakdown.md" ]; then
    cat ".claude/extensions/breakdown-feature/post-breakdown.md"
    echo ""
fi
```

### 9. Save Breakdown

Save the breakdown to a file for future reference:

```bash
# Create plans directory if needed
mkdir -p docs/plans

# Generate filename based on input mode
# Format: docs/plans/[timestamp]-[issue-scope]-[description]-breakdown.md

# If issue number(s) provided:
# - Single issue: "issue-123"
# - Multiple issues: "issues-123-124-125"

# If milestone provided:
# - Use slugified milestone name

# If description provided without issues:
# - Use slugified description

# Examples:
# Single issue:
#   docs/plans/2025-10-11-issue-123-breakdown.md
#   docs/plans/2025-10-11-issue-123-absence-management-breakdown.md
# Multiple issues:
#   docs/plans/2025-10-11-issues-337-339-spacing-migration-breakdown.md
#   docs/plans/2025-10-11-issues-123-124-125-auth-refactor-breakdown.md
# Milestone:
#   docs/plans/2025-10-11-milestone-authentication-core-breakdown.md
# Description only:
#   docs/plans/2025-10-11-search-feature-breakdown.md
#   docs/plans/2025-10-11-notification-system-breakdown.md
```

**Include Update Instructions**:

At the top of the saved file, include:

```markdown
<!--
This is a LIVING DOCUMENT - Update continuously during implementation!

PROGRESSIVE TRIMMING STRATEGY:
This document evolves through phases - trim as you complete work:

Phase 1: PLANNING (Verbose OK)
- ✅ Detailed user stories with acceptance criteria
- ✅ Technical enablers with examples
- ✅ Implementation notes and "how to build"
→ Purpose: Full scope understanding and planning

Phase 2: IMPLEMENTING (Trim as you go)
- ✅ Mark stories complete → Remove detailed acceptance criteria
- ✅ Keep user feedback + decisions
- ❌ Delete implementation details once feature is live
→ Purpose: Track progress and user feedback

Phase 3: COMPLETE (Concise)
- ✅ Summary of delivered features (what users got)
- ✅ Key user feedback and iterations
- ✅ Session log + lessons learned
- ❌ No redundant story details
→ Purpose: Handoff and retrospective

GOLDEN RULE: If feature is live, remove planning details from this doc.

To update this breakdown:
1. Run: /project:issues:breakdown-feature #123 to refresh progress
2. Trim completed stories - keep only user feedback/decisions
3. Update progress table and session log
4. Remove story details once feature is deployed

This document serves as the source of truth for:
- Feature implementation progress
- User feedback and iterations (WHY changes were made)
- Scope changes and their rationale
- Session handoffs for AI agents

STATUS LINE: When transitioning between phases, update .workflow/status.json:
  echo '{"phase":"<phase>","command":"implement","startedAt":"..."}' > .workflow/status.json
-->

# [Feature] Breakdown

**Issue**: #[Number]  
**Started**: [Date]  
**Last Updated**: [Date] by [Who/Session]  
**Status**: Active/Complete/On Hold

---

## 🎯 Current Focus

**Active Sprint**: [Sprint name/number]  
**Stories in Progress**: [Story names/numbers]  
**User Testing Results**: [Latest feedback summary]  
**Next Priority**: [What story/feature is next]

## 📊 Overall Progress

| Priority  | Total | Completed | In Progress | Blocked | Not Started |
| --------- | ----- | --------- | ----------- | ------- | ----------- |
| 🟢 MUST   | X     | X         | X           | X       | X           |
| 🟡 SHOULD | X     | X         | X           | X       | X           |
| 🔵 NICE   | X     | X         | X           | X       | X           |

**Overall Completion**: X% (X of Y stories)

---

## 🔄 Progress Overview

### Sprint Progress

- Completed: [X/Y stories]
- In Progress: [List active stories]
- Blocked: [Any blocked stories with reasons]
- Scope Changes: [Added/removed stories]

### User Feedback Log

- [Date]: [Feedback received, impact on stories]
- [Date]: [Testing results, adjustments needed]

## 🧪 Testing Checkpoints

### Verification Status

| After Phase | Stories Testable | 🚦 Gate | 🤖 AI | 👤 User | Notes               |
| ----------- | ---------------- | ------- | ----- | ------- | ------------------- |
| Phase 1     | [List]           | —       | —     | —       | [What's verifiable] |
| Phase 2     | [List]           | Yes     | ⬜    | ⬜      | [What's verifiable] |
| Phase 3     | [List]           | Final   | ⬜    | ⬜      | [What's verifiable] |

**Legend**: ✅ Verified | ⬜ Not yet | ⚠️ Issues found | — N/A

**Testing preference**: [ ] Pause at checkpoints / [ ] Continue autonomously

### Quality Gate: Phase [N] — [Description]

**Validate now (structural impact):**

- [ ] [Decisions that affect component architecture or routing for later phases]
- [ ] [Layout approaches, navigation patterns, information density]

**Defer to final walkthrough:**

- [Cosmetic items: spacing, colors, typography, animations]

### E2E Seed Data Status

**Current state**: [Describe what exists]

**Gaps discovered**:

- [ ] [Gap found during testing]

**Seed data to add**:

- [ ] [Data to add to enable testing]

### 📸 Screenshots

Screenshots stay in `.playwright-mcp/` (gitignored) — do not commit to repo.
Attach key screenshots directly to the GitHub PR description for reviewers.

---

## 🎨 Final UI/UX Walkthrough

**Status**: [ ] Not started / [ ] In progress / [ ] Complete **Performed by**:
🤖 AI / 👤 User / Both

_Run after all phases complete and functional tests pass. Skip if no UI changes.
See breakdown-feature command for full walkthrough guide (3 purposes: seed data
audit, UX consistency review, UI fine-tuning)._

### Seed Data Audit

- [ ] Happy path data exists for all flows
- [ ] Empty states verified
- [ ] Edge case data present
- [ ] Role-specific data present
- **Gaps found**: [List or "None"]
- **Seed data added**: [List or "None needed"]

### UX Consistency

- [ ] Entry points discoverable
- [ ] User journey coherent end-to-end
- [ ] Cross-feature patterns consistent
- [ ] Error/empty states helpful
- [ ] Responsive behavior verified
- **Issues fixed**: [List]
- **Improvements logged for later**: [Issue numbers or "None"]

### UI Fine-Tuning

- [ ] Deferred polish items addressed (from quality gates)
- [ ] Spacing and alignment reviewed
- [ ] Typography and color consistent
- [ ] Interactive states complete
- **UI Critic agent**: [ ] Skipped / [ ] Run — [summary of findings]

---

## 👀 Human Validation

_Fill in during/after implementation — things automated checks can't verify._

- [ ] [e.g., "Verify the cancellation grace period matches product intent"]
- [ ] [e.g., "Check the error toast UX on mobile"]
- [ ] [e.g., "Confirm data migration output looks correct for existing records"]

_(Replace placeholders with real items as they emerge during implementation.
Delete section if nothing needs human eyes.)_

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run 🎨 Final UI/UX Walkthrough (if UI changes — see section above)
3. Run preflight check: `/project:issues:preflight`
4. Run external review: `/project:issues:review`
5. Create PR: `/project:issues:create-pr`
```

### 10. Provide Next Steps

After generating the breakdown:

```
✅ Breakdown saved to: docs/plans/2024-01-15-absence-management-breakdown.md

📊 Summary:
- Total Stories: 20
- Must Have: 7 (3 completed, 4 remaining)
- Should Have: 5 (0 completed, 5 remaining)
- Nice to Have: 8 (0 completed, 8 remaining)

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

🎯 Next Steps:
1. Review and refine priorities with team
2. Create issues for Phase 1 stories:
   /project:issues:create "Manual absence entry UI" "Edit absence UI" "Delete absence UI"
3. Update progress as features are completed
4. Use breakdown for sprint planning

💡 Quick Actions:
- Create all MUST HAVE issues: /project:issues:create [paste story titles]
- Focus on partially complete stories first
- Consider combining related stories into single issues
```

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Ready for implementation","command":"breakdown-feature","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 11. Expert Review & Validation (unless --no-bounce)

**⚠️ MANDATORY**: Unless `--no-bounce` was specified, you MUST immediately
execute the full expert review. Do not wait for user confirmation.

**Action**: Check `.workflow/config.json` for `codex-resume.breakdown-feature`.
If `true`, include `--resume-codex`. Then run:

```
/project:issues:bounce --full [--resume-codex] --exit-condition "severity < medium" <path-to-breakdown-file>
```

Example (with resume enabled in config):

```
/project:issues:bounce --full --resume-codex --exit-condition "severity < medium" docs/plans/2025-01-15-issue-123-breakdown.md
```

Example (with resume disabled or config missing):

```
/project:issues:bounce --full --exit-condition "severity < medium" docs/plans/2025-01-15-issue-123-breakdown.md
```

**What happens** (see `/bounce --full` for details):

1. Architect reviewer evaluates system design concerns
2. UX reviewer evaluates user experience (always for features)
3. External model iteratively validates — loops until no Medium or High severity
   findings remain (Low-severity items are applied and the loop exits)
4. You (Lead Engineer) synthesize all feedback against codebase patterns
5. Plan is updated with agreed changes

**Output format**:

```
🔄 Running full expert review...

[Invoke /project:issues:bounce --full --exit-condition "severity < medium"]

After review completes, show:
- Breakdown summary (from section 10)
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

### Progress Evaluation

By default (unless `--skip-status-check` is used), analyze the codebase to
determine:

1. **Check for existing implementations**:
   - Database tables/models
   - API endpoints
   - UI components
   - Tests

2. **Determine completion level**:
   - ✅ Full stack implementation exists
   - ⚠️ Backend only, or frontend only
   - ❌ Not implemented

3. **Identify blockers**:
   - Missing dependencies
   - Technical constraints
   - Required decisions

### Intelligent Grouping

Suggest logical groupings for implementation:

```markdown
## Implementation Groups

### Group A: Authentication Core

Stories that should be implemented together:

- #1: Database schema (foundation)
- #2: Login endpoint (uses schema)
- #3: Session management (extends login) Value: Complete auth system in one PR

### Group B: User Interface

Can be done in parallel with Group A:

- #4: Login form
- #5: Signup form
- #6: Password reset Value: Full UI ready for integration
```

## Quality Checks

Before finalizing breakdown:

1. **Completeness**: Have all aspects been considered?
2. **Independence**: Can stories be implemented separately?
3. **Testability**: Is each story verifiable?
4. **Value Clear**: Is the benefit obvious?
5. **Right-sized**: Are stories neither too big nor too small?
6. **Priority Accurate**: Does priority reflect business needs?

## Best Practices

1. **Start with user value**: Every story must have clear user benefit
2. **Be specific**: Avoid vague stories like "improve performance"
3. **Consider all users**: Include different roles and permissions
4. **Think edge cases**: Don't forget error states and recovery
5. **Progressive enhancement**: Core → Enhanced → Delightful
6. **Track dependencies**: Note what blocks what
7. **Update regularly**: Progress and implementation notes should be updated as
   work proceeds
8. **Document decisions**: Use Implementation Notes to explain why stories were
   modified, postponed, or discarded
9. **Keep notes concise**: Notes should be brief but informative for future
   reference
10. **Maintain focus balance**: Keep 70-80% user stories, 20-30% technical
    enablers
11. **Flag taste decisions early**: Identify 🎨 TASTE decisions during
    breakdown, not during implementation. PO input is easier to get before code
    is written.
12. **Always recommend**: When flagging taste decisions, provide a strong
    recommendation from a senior UX perspective. Don't just present options -
    give your informed opinion as a starting point for discussion.
13. **Pause at taste decisions**: During implementation, stop and wait for PO
    input on unresolved taste decisions. Never silently pick an option.

## Story Examples: Good vs Bad

### ✅ GOOD User Stories for Feature Breakdown:

```
As a Studio Manager, I want to see which students are absent today
So that I can quickly contact their parents

As an Admin, I want to review all changes before they're applied
So that I can prevent accidental data corruption

As a Parent, I want instant notifications when my child is marked absent
So that I know they're not in class

As a Teacher, I want to bulk-update attendance for my entire class
So that I save 15 minutes per day on admin work
```

### ❌ BAD Stories (Need Reframing):

```
❌ "As a Developer, I want better component structure"
✅ Reframe as technical enabler: "📌 Technical: Refactor components → Enables faster page loads for all users"

❌ "As a System, I want to validate data"
✅ Reframe from user perspective: "As a User, I want clear error messages when I enter invalid data"

❌ "As a Database, I want optimized queries"
✅ Reframe: "As a User, I want search results in under 2 seconds"
   With enabler: "📌 Technical: Optimize database queries → Enables sub-2s search"

❌ "As a Developer, I want comprehensive test coverage"
✅ Only include if user-facing: "As a User, I want reliable features that don't break"
   Or move to technical breakdown entirely
```

### 📌 GOOD Technical Enabler Framing:

```
📌 Technical: Split 1200-line component into 5 modules
   Enables: Story #1 (faster loads), Story #2 (easier navigation)
   User Impact: Reduces page load from 4s to 1s

📌 Technical: Implement caching layer
   Enables: Story #3 (instant repeat searches)
   User Impact: Second search is 10x faster

📌 Technical: Add database indexes
   Enables: Story #4 (real-time filtering), Story #5 (quick exports)
   User Impact: Filter 10,000 records instantly instead of 5s wait
```

## Example Breakdowns

### Single Issue

```
/project:issues:breakdown #123
```

Generates breakdown of issue #123 with all potential stories, even beyond
original scope.

### Multiple Issues

```
/project:issues:breakdown #123 #124 #125
```

Analyzes relationships between issues and suggests combined implementation
approach.

### Milestone

```
/project:issues:breakdown --milestone "MVP Launch"
```

Breaks down entire milestone with current progress automatically tracked.

### Feature Description

```
/project:issues:breakdown "Add real-time notifications" --research deep
```

Comprehensive breakdown of a new feature with deep technical analysis.

Remember: The goal is to surface ALL potential value, not just the obvious
requirements. Teams can then make informed decisions about what to implement
based on clear value propositions and effort estimates.

## Living Document Philosophy

**IMPORTANT**: The feature breakdown is designed to be a LIVING DOCUMENT that:

1. **Tracks User Story Progress**: Each story's implementation status
2. **Captures User Feedback**: What users actually said and how it impacts
   stories
3. **Documents Scope Changes**: Why stories were added, modified, or removed
4. **Compares Estimates**: Actual effort vs initial estimates for better
   planning

**CRITICAL - Progressive Trimming**:

When updating an existing breakdown, **actively trim completed sections**:

- Remove detailed acceptance criteria once stories are complete
- Delete implementation details that are now in production
- Keep only: user feedback, decisions (WHY), scope changes, lessons
- The document should get SHORTER as work progresses, not longer

Goal: Verbose during planning → Concise retrospective when complete

### How to Keep It Alive

**During Implementation**:

- Update story progress as you complete acceptance criteria
- Document user feedback immediately
- Note actual effort vs estimates
- Record why scope changed (if it did)
- Update "Next Session" for each story

**User Testing Sessions**:

- Mark which acceptance criteria passed/failed
- Document user confusion or delight
- Note feature requests and enhancements
- Decide what goes to current vs future phase

**Sprint Planning**:

- Review completed vs remaining stories
- Check blocked stories and unblock
- Adjust priorities based on feedback
- Update phase planning

### Implementation Autonomy

When implementing stories/phases, use your judgment on when to:

**Continue directly** (default for straightforward work):

- Story completed as planned, no surprises
- Next story is clear and unblocked

**Interim bounce** (for validation mid-implementation):

- Large story just completed with significant code changes
- Discoveries suggest the remaining plan may need adjustment
- Approaching a risky or complex upcoming story
- Run:
  `/project:issues:bounce "Story N complete. [summary]. Remaining stories: [...]. Any concerns before proceeding?"`

**Stop and summarize for user** (natural checkpoints):

- Taste decision encountered that needs PO input
- User feedback needed on a UX choice
- Significant deviation from original plan proposed
- Direction unclear or multiple viable paths emerged that the plan didn't
  anticipate
- Good stopping point if user may want to review progress

You don't need to stop after every story - continuous progress is fine when
things are clear. The goal is catching issues early, not creating ceremony.

### Story Progress Template

Each story should track:

```markdown
**Implementation Log**: Started: [Date] Status: NOT STARTED | IN PROGRESS |
COMPLETED | BLOCKED | DEFERRED

Done:

- ✅ [Completed acceptance criterion]
- ⏳ [In progress with %]
- ❌ [Failed/blocked criterion]

User Feedback:

- [What users said]
- [Feature requests]
- Decision: [What we decided]

Actual Effort: [Actual] (estimated [estimate]) Why Different: [If significantly
different]

Blockers:

- [What's blocking and why]

Next Session:

- [Specific next steps]
- [What to test with users]
```

### Acceptance Testing

Since user stories are inherently testable:

```markdown
**Acceptance Criteria**: ✅ PASS | ❌ FAIL | ⏳ PARTIAL

- [✅] Can user perform primary action?
- [✅] Does it solve the stated problem?
- [❌] Is error handling graceful?
- [⏳] Is performance acceptable? (mostly, but slow on mobile)

**User Testing Results**:

- Tester: [Name/Role]
- Date: [When tested]
- Result: [What happened]
- Feedback: [What they said]
```

This ensures the breakdown serves as both planning and execution document,
capturing the full lifecycle of user story implementation.

## 📝 Session Log

### [Date] - Session [Number] ([Sprint/Feature Focus])

#### What We Delivered

1. ✅ **Story #X**: [Story name] - [User value delivered]
2. ✅ **Story #Y**: [Story name] - [User value delivered]
3. ⏳ **Story #Z**: [Story name] - [Progress: UI complete, backend pending]

#### User Feedback Received

- **[User Role]**: "[Direct quote of feedback]"
  - Impact: [How this changes our approach]
  - Decision: [What we decided to do]

#### Scope Changes

- **Added**: [New story] - Reason: [User request/discovered need]
- **Removed**: [Story] - Reason: [No longer valuable/out of scope]
- **Modified**: [Story] - Change: [What changed and why]

#### Testing Results

- **Story #X**: ✅ All acceptance criteria passed
- **Story #Y**: ⚠️ Partial pass (mobile performance issue)
- **Story #Z**: Not tested yet

#### Decisions Made

- **📌 [Technical Decision]**: [What was decided and rationale]
- **🎨 [Taste Decision]**: [What was decided] - PO Approved: [Yes/Date]
- **Trade-off**: [What we prioritized over what]

#### Next Session Focus

1. Complete Story #Z backend
2. Fix mobile performance for Story #Y
3. Start Story #A (next priority)

---

## 🚀 Next Session Quick Start

### Continue With These Stories

1. **Story #[Number]**: [Name] - [Specific next step]
2. **Story #[Number]**: [Name] - [What needs fixing/completing]

### User Testing Needed

- [ ] Test [feature] with [user type]
- [ ] Validate [assumption] about [behavior]
- [ ] Get feedback on [UI element]

### Decisions Needed

- [ ] 📌 [Technical decision about scope/approach]
- [ ] 🎨 [Taste decision] - ⏸️ Blocks: [Story/Feature]

### 🎨 Taste Decisions Pending PO Input

| Decision | Story | Recommendation | Blocking? |
| -------- | ----- | -------------- | --------- |
| [Brief]  | #X    | [Brief]        | Yes/No    |

### Do NOT

- ❌ [Common mistake to avoid]
- ❌ [Assumption not to make]
- ❌ [Scope creep to resist]
