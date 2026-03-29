# Preflight Quality Check Command

You are orchestrating a comprehensive pre-PR quality check. This command runs
all quality checks in sequence, preparing code for review.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands. If not configured,
detect from lockfiles or default to `npm`.

## Progress Tracking

If a breakdown/progress file exists for the current issue, preflight will append
its results there. This creates a persistent record of quality checks.

**Breakdown file detection**:

```bash
# Look for breakdown file matching current issue
ISSUE_NUMBER=$(git branch --show-current | grep -oE '[0-9]+' | head -1)
BREAKDOWN_FILE=$(find docs/plans -name "*issue-${ISSUE_NUMBER}*breakdown*.md" 2>/dev/null | head -1)
```

If found, results are appended under `## Preflight Results - [timestamp]`.

## What Preflight Does

**Full mode** (default):

```
typecheck → lint → simplify → [re-check] → verify → test-adequacy → compliance → reflect
```

1. **Typecheck**: Catch type errors
2. **Lint**: Fix style issues (auto-fix enabled)
3. **Simplify**: Clean up code (code-simplifier agent)
4. **Re-check**: Typecheck & lint again if simplify made changes
5. **Verify**: Check requirements coverage (verify-implementation agent)
6. **Test Adequacy**: Evaluate test quality against project testing philosophy
   (test-adequacy agent)
7. **Compliance**: Check against PLATFORM.md principles, rules, and skill
   patterns
8. **Reflect**: Summary of changes + developer debrief on divergences

**Light mode** (`--light`):

```
typecheck → lint → test-adequacy
```

1. **Typecheck**: Catch type errors
2. **Lint**: Fix style issues (auto-fix enabled)
3. **Test Adequacy**: Evaluate test quality against project testing philosophy

Light mode is for bug fixes, small mechanical changes, and Sentry-originated
fixes where the full pipeline adds overhead without proportional value. It
ensures code compiles, follows style rules, and has adequate test coverage —
skipping simplification, verification, compliance, and reflection.

Tests are **not included by default** in either mode since they run in CI/CD.
Use `--with-tests` to include them when you want local test validation before
pushing.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- `#<issue_number>` - Issue to verify against (recommended)
- `--light` - Light mode: typecheck → lint → test-adequacy only
- `--with-tests` - Include test run after re-check step (full) or after lint
  (light)
- `--skip-simplify` - Skip the simplification step
- `--skip-verify` - Skip the verification step
- `--skip-test-adequacy` - Skip the test adequacy check step
- `--skip-compliance` - Skip the compliance check step
- `--strict` - Treat any issue as failure

Examples:

```
/project:issues:preflight #123              # Full preflight for issue #123
/project:issues:preflight                   # Preflight without issue verification
/project:issues:preflight --light           # Light preflight (bug fixes, small changes)
/project:issues:preflight --light #123      # Light preflight for specific issue
/project:issues:preflight --with-tests      # Include local test run
/project:issues:preflight --skip-simplify   # Skip simplification
/project:issues:preflight --strict          # Fail on any issues
```

## Process

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Preflight in progress","command":"preflight","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### Step 0: Identify Scope

Determine what's being checked:

```bash
# Get branch name
BRANCH=$(git branch --show-current)

# Get files changed vs main
FILES=$(git diff main...HEAD --name-only --diff-filter=ACMR)

# Try to infer issue from branch name (e.g., feature/123-description)
ISSUE=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1)
```

Report:

```
🚀 Preflight Check Starting

Branch: feature/123-password-reset
Issue: #123 (inferred from branch)
Files changed: 12
Mode: Full (or "Light" if --light)

Steps: typecheck → lint → simplify → [re-check] → verify → test-adequacy → compliance → reflect
       (or: typecheck → lint → test-adequacy  if --light)
```

**If `--light`**: Skip directly from Step 0 setup to Step 1 (Typecheck), then
Step 2 (Lint), then Step 6 (Test Adequacy), then the Light Report. Skip steps 3,
4, 5, 7, and 8 entirely.

### Step 0b: Check for Existing Preflight

Before running checks, look for existing preflight results in the breakdown
file:

```bash
# Check if breakdown file has preflight results
if [ -n "$BREAKDOWN_FILE" ] && grep -q "## Preflight Results" "$BREAKDOWN_FILE"; then
  LAST_PREFLIGHT=$(grep "## Preflight Results - " "$BREAKDOWN_FILE" | tail -1)
fi
```

If existing results found, ask the user:

```
⚠️ Existing preflight found in breakdown file
   Last run: 2026-01-25 14:32

A preflight was already performed for this issue.
```

Use AskUserQuestion with options:

- **Run again** - Run a fresh preflight (results will be appended)
- **Skip** - Cancel and keep existing results

If user selects "Skip", exit with:

```
⏭️ Preflight skipped - using existing results from 2026-01-25 14:32
```

If user selects "Run again" or no existing results, continue to Step 0c.

### Step 0c: Ensure Breakdown Is Current

**This step is critical.** The verify-implementation agent (Step 5), test
adequacy agent (Step 6), and reflect step (Step 8) all read the breakdown file.
If it's stale — missing completed items, undocumented discoveries, or still
showing "in progress" for finished work — those steps produce inaccurate
results.

If a breakdown file was found in Step 0, review it now and ensure it reflects
the current implementation state. You (the main session) have maximal context
from the implementation — this is the right moment to sync the breakdown before
agents start reading it.

**Check and update:**

1. **Completed items**: Are all implemented items checked off? Mark them done.
2. **Discoveries / gotchas**: Were any unexpected findings, blockers, or
   deviations encountered during implementation? Record them if not already
   noted.
3. **Deferred scope**: Is anything that was planned but not implemented marked
   as deferred with a reason?
4. **Status**: Update the phase/status to reflect that implementation is
   complete and preflight is starting.

If the breakdown is already current, note it and move on:

```
✅ Breakdown file is current — no updates needed
```

If updates were made:

```
📝 Updated breakdown file:
   - Checked off 3 completed items
   - Added discovery: [brief description]
   - Marked [item] as deferred
```

If no breakdown file exists, skip this step.

### Step 0d: Stage Current Changes

Before running any checks, stage all current changes so that modifications made
by preflight steps (lint auto-fix, simplify) are clearly visible as unstaged
changes afterward.

```bash
git add -A
```

Report:

```
📌 Staged current changes
   Any preflight modifications will appear as unstaged changes for easy review.
```

### Step 1: Typecheck

```bash
pnpm typecheck
```

If fails:

```
❌ Step 1/8: Typecheck FAILED

Type errors found. Run /project:quality:typecheck to fix.

Errors:
[typecheck output]
```

Exit preflight.

If passes: `✅ Step 1/8: Typecheck passed`

### Step 2: Lint (Auto-fix)

```bash
pnpm lint --fix
```

If errors remain after auto-fix:

```
⚠️ Step 2/8: Lint has issues

Auto-fixed: 5 issues
Remaining: 2 issues (need manual fix)

Run /project:quality:lint to address remaining issues.

Remaining errors:
[lint output]
```

Exit preflight.

If clean after auto-fix:

```
✅ Step 2/8: Lint passed
   Auto-fixed: 5 issues
```

### Step 3: Simplify

Unless `--skip-simplify`:

Load and run the code simplifier agent (`.claude/agents/code-simplifier.md`).

Pass: List of changed files.

The agent will simplify code and report results.

```
✅ Step 3/8: Simplify complete
   Applied: 3 simplifications
   Reverted: 0
   Skipped: 1 (needs review)
```

If skipped: `⏭️ Step 3/8: Simplify skipped (--skip-simplify)`

### Step 4: Re-check (if simplify made changes)

Only if simplifications were applied, re-run typecheck and lint to ensure
simplifications didn't introduce issues:

```bash
pnpm typecheck && pnpm lint
```

If fails:

```
❌ Step 4/8: Re-check FAILED after simplification

Simplifications may have introduced issues. This shouldn't happen
(simplifier validates changes), but investigate.

Options:
1. Review and revert problematic simplifications
2. Fix the issues manually
3. Re-run preflight
```

Exit preflight.

If passes: `✅ Step 4/8: Re-check passed (post-simplify)`

If no simplifications: `⏭️ Step 4/8: Re-check skipped (no simplifications)`

### Step 4b: Tests (Optional)

Only if `--with-tests` flag is provided:

```bash
pnpm test
```

If fails:

```
❌ Tests FAILED

Fix failing tests and try again.

Errors:
[test output]
```

Exit preflight.

If passes: `✅ Tests passed`

If not requested: Tests are skipped (run in CI/CD).

### Step 5: Verify

Unless `--skip-verify`:

If issue number available, load and run verify-implementation agent
(`.claude/agents/verify-implementation.md`).

Pass: Issue number, changed files, and breakdown file path (if exists).

```
✅ Step 5/8: Verify complete
   Requirements: 5/5 covered
   Warnings: 2 (see report below)
```

If no issue number:

```
⏭️ Step 5/8: Verify skipped (no issue number)
   Tip: Provide an issue number to enable verification
```

If skipped: `⏭️ Step 5/8: Verify skipped (--skip-verify)`

### Step 6: Test Adequacy

Unless `--skip-test-adequacy`:

Load and run the test-adequacy agent (`.claude/agents/test-adequacy.md`).

Pass: Changed files (test and implementation), issue number, breakdown file path
(if exists).

The agent will:

1. Discover the project's test philosophy (skills, rules, docs, or inferred from
   existing tests)
2. Synthesize a working model of what the project expects from tests
3. If test files exist in the changeset: evaluate them against that model
4. Assess whether tests are missing for the implementation changes — this
   applies whether or not test files are in the changeset
5. Report coverage gaps, wrong-level tests, over-testing, and pattern deviations

```
✅ Step 6/8: Test adequacy complete
   Coverage gaps: 1 warning
   Pattern compliance: 4/4 tests follow patterns
   Over-testing: 0 instances
```

If no test philosophy discoverable:

```
⏭️ Step 6/8: Test adequacy skipped (no test philosophy found)
   Tip: Document test patterns in TESTING.md or .claude/skills/test-patterns
```

If skipped: `⏭️ Step 6/8: Test adequacy skipped (--skip-test-adequacy)`

### Step 7: Compliance Check

Unless `--skip-compliance`:

Load and run the codebase-compliance-checker agent
(`.claude/agents/codebase-compliance-checker.md`).

Pass: List of changed files and branch info.

The agent will:

1. Read PLATFORM.md for strategic principles (if it exists)
2. Read CLAUDE.md for non-negotiable rules and domain model
3. Consult relevant architecture docs (`docs/architecture/`) if the changes
   touch a documented domain
4. Assess whether the implementation aligns with the project's strategic
   direction — spirit, not just letter
5. Flag genuine violations of foundational principles
6. Suggest evolution of CLAUDE.md or PLATFORM.md based on what was learned

**Note:** The agent does NOT re-check path-scoped rules or skills — those were
already loaded during implementation. It focuses on strategic alignment and
foundational document compliance.

```
✅ Step 7/8: Compliance check complete
   Strategic alignment: Good
   Violations: 0
   Evolution candidates: 2 (1 high, 1 medium)
```

If skipped: `⏭️ Step 7/8: Compliance skipped (--skip-compliance)`

**Output in preflight summary:**

```markdown
## Strategic Compliance

### Strategic Assessment

Implementation aligns with project direction. [Brief assessment.]

### Violations (Foundational Principles)

- [Only genuine CLAUDE.md / PLATFORM.md violations — not style or rule-level]

### Evolution Candidates (Foundational Docs Should Change)

- [Patterns that suggest CLAUDE.md or PLATFORM.md should be updated]

### Passed

- Implementation serves project's strategic goals
```

### Step 8: Reflect

This step is **fully automated** — the AI self-reflects by combining diff
analysis with plan comparison. Do NOT ask the user any questions during this
step. Surface not just what changed, but what went differently than planned.

#### 8a. Automated Analysis

```bash
# Get full diff for reflection
git diff main...HEAD
```

Analyze the diff and produce the automated summary (What Changed, Key
Implementation Decisions, Potential Concerns — see example below).

Also check for recorded divergences during implementation:

```bash
# Check breakdown file for Discoveries/Gotchas recorded during implementation
if [ -n "$BREAKDOWN_FILE" ]; then
  grep -A 5 "Discoveries\|Gotchas\|Blockers" "$BREAKDOWN_FILE" 2>/dev/null
fi
```

#### 8b. Self-Reflect on Divergences

Compare the actual implementation (from the diff) against the breakdown plan to
identify divergences. Do **not** ask the user — you have full context to assess
this yourself.

**Cross-reference these sources:**

1. The breakdown file's planned steps, scope, and acceptance criteria
2. The actual diff (files added/modified/deleted vs what was planned)
3. Any "Discoveries", "Gotchas", or "Blockers" recorded in the breakdown during
   implementation
4. TODOs or deferred items visible in the code

**Look for:**

- Scope that was planned but not implemented (deferred)
- Scope that was implemented but not in the plan (additions)
- Approaches that differ from what the breakdown specified (workarounds, plan
  changes)
- Unexpected findings noted in code comments or the breakdown

Categorize any divergences found:

```
### 🔀 Implementation Divergences from Plan

- [WORKAROUND] <what was worked around and why>
- [PLAN_CHANGE] <what was changed from the breakdown and why>
- [DISCOVERY] <unexpected finding during implementation>
- [DEFERRED] <what was descoped/deferred and why>
```

Omit this section entirely if the implementation matches the plan with no
meaningful divergences.

#### 8c. Combined Reflection Output

```
## 📝 Reflection

### What Changed

This implementation adds password reset functionality:

**New files (4)**:
- `src/api/auth/reset.ts` - Password reset request endpoint
- `src/api/auth/confirm.ts` - Password reset confirmation endpoint
- `src/services/email.ts` - Email service for sending reset links
- `migrations/add_reset_token.sql` - Database migration for reset tokens

**Modified files (3)**:
- `src/api/auth/index.ts` - Added new routes
- `src/types/auth.ts` - Added ResetToken type
- `.env.example` - Added RESET_TOKEN_EXPIRY

**Test coverage**:
- 12 new tests across 3 test files
- All acceptance criteria have corresponding tests

### Key Implementation Decisions

1. **Token storage**: Using database rather than JWT to allow invalidation
2. **Expiry**: 24-hour configurable via environment variable
3. **Rate limiting**: TODO noted, not implemented in this PR

### 🔀 Implementation Divergences from Plan

- [DEFERRED] Rate limiting — descoped to follow-up issue, not in original
  breakdown but discovered as needed during implementation
- [WORKAROUND] Email service uses sync send — async queue was planned but
  external service SDK doesn't support it yet

### Potential Concerns

- Rate limiting should be added before production
- Email service has a debug console.log (flagged by verify)
```

**Note:** The "Implementation Divergences" section feeds directly into
create-pr's Section 3 (Implementation Reflection), reducing duplicate work. If
preflight captured divergences here, create-pr should reference them rather than
re-analyzing.

### Final Report

Present the complete preflight report:

```
═══════════════════════════════════════════════════════════════
                    PREFLIGHT CHECK COMPLETE
═══════════════════════════════════════════════════════════════

Branch: feature/123-password-reset
Issue: #123 - Add password reset functionality

┌─────────────────────────────────────────────────────────────┐
│ Step                          Status                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Typecheck                  ✅ Passed                      │
│ 2. Lint                       ✅ Passed (5 auto-fixed)       │
│ 3. Simplify                   ✅ 3 applied, 1 skipped        │
│ 4. Re-check                   ✅ Passed (post-simplify)      │
│ 5. Verify                     ⚠️ 5/5 reqs, 2 warnings        │
│ 6. Test Adequacy              ✅ 0 gaps, 4/4 compliant        │
│ 7. Compliance                 ✅ 1 violation, 1 suggestion   │
│ 8. Reflect                    ✅ 2 divergences noted          │
└─────────────────────────────────────────────────────────────┘
```

### Triage Findings

If there are **any** actionable findings (compliance violations, verify
warnings, skipped simplifications, or divergences), present them grouped and
**ask the developer** what to do before declaring readiness. Do NOT autonomously
decide findings are "non-blocking" — the developer makes that call.

**Pre-existing findings are not second-class.** If a check spots something that
predates this PR but the fix is small and clear, include it in the findings
alongside PR-introduced issues — do NOT separate them into a "pre-existing"
category or recommend skipping them. "Not introduced by this PR" is not a valid
reason to defer a small, obvious fix. The only reason to defer is if fixing it
would be genuinely issue-sized (needs its own branch/review) or could open a
door to unknown consequences.

Present the findings:

```
### Findings Requiring Your Input

**Compliance violations (3):**
1. src/auth/constants.ts: Uses camelCase for constants (project rule: UPPER_SNAKE_CASE)
2. src/types/user.ts:12: string instead of branded UserId
3. src/api/handler.ts:45: as UserRole assertion instead of proper type flow

**Verify warnings (2):**
1. TODO: Rate limiting needed (api/auth/reset.ts:89)
2. Debug: console.log left in code (services/email.ts:45)

**Skipped simplifications (1):**
1. src/api/webhook.ts:34 - Defensive check, review if intentional

**Evolution candidates (2):**
1. (high) .claude/rules/query-performance.md — should reference fetchAllPaginated
2. (medium) .claude/rules/data/repositories.md — should mention unbounded query awareness
```

Then use AskUserQuestion with options. **Recommendation order matters** — the
first option should almost always be the action that improves code quality:

- **Fix all (Recommended)** — Address all fixable findings before proceeding.
  This is the strong default. Code fixes, knowledge evolution, debug cleanup,
  compliance violations, test gaps — if it improves the codebase and can be done
  in this PR, do it here. Do NOT split work into follow-up issues unless it
  genuinely cannot be done in this PR (see criteria below). Evolution candidates
  that are just adding/updating knowledge files are always fixable in-PR. Test
  gaps for code introduced in this PR are not scope expansion — they are part of
  the implementation and belong in "Fix all".
- **Cherry-pick** — Let me choose which findings to fix and which to accept.
  Good when some findings are debatable or the developer has context about why
  something should stay as-is.
- **Proceed as-is** — Accept findings without action. Only appropriate when
  findings are not genuine quality improvements (e.g., style preferences with no
  clear winner, intentional deviations with good reason). Rarely the right
  default — we don't ignore findings that improve our codebase.
- **Create follow-up issue** — Last resort, only when fixing a finding would
  genuinely require its own branch and review cycle. The bar is high: the fix
  must touch many files outside the PR's scope, require coordination with other
  teams, or risk unknown consequences that need separate testing. "It's not
  introduced by this PR" is never sufficient reason. One-line fixes, knowledge
  file additions, and convention updates always belong in the current PR.

**If "Fix all"**: Fix all compliance violations, remove debug code, address
verify warnings, and apply all evolution candidates (high and medium confidence)
using `/project:knowledge:add`. Then re-run typecheck + lint to confirm fixes
are clean. Update the report with what was fixed.

**If "Cherry-pick"**: Present each finding individually (or grouped by category)
and let the developer mark each as "fix" or "accept". Fix the selected items,
re-run typecheck + lint, and update the report.

**If "Proceed as-is"**: Continue to the readiness declaration. All accepted
findings will be documented in the preflight results and surfaced in the PR
description by `create-pr`.

**If "Create follow-up issue"**: Only when findings genuinely can't be addressed
in this PR. Create a GitHub issue with file paths, line numbers, and a clear
description of what needs fixing. Then proceed to readiness declaration with the
follow-up issue referenced.

### Evolution Candidate Handling

The compliance checker assigns a confidence level to each evolution candidate.
Handle them based on confidence:

- **High confidence** — Clear gap or stale rule. Apply immediately using the
  `knowledge-placement` skill (load
  `.claude/skills/knowledge-placement/SKILL.md` and use the
  `/project:knowledge:add` flow). Included in "Fix all" automatically. When
  cherry-picking, default-recommend as "fix".

- **Medium confidence** — Reasonable suggestion with clear value. Also included
  in "Fix all" — adding or updating a knowledge file is low-risk work that
  belongs in the current PR, not a follow-up issue. When cherry-picking,
  default-recommend as "fix".

- **Low confidence** — Informational only. Note them in the preflight report for
  visibility but do NOT include them in triage findings or ask about them. They
  appear in the summary as observations, not action items.

When applying evolution candidates, stage the knowledge changes alongside other
preflight fixes so the developer can review them in the diff before committing.

### Readiness Declaration

After triage is resolved (or if there were no findings):

```
═══════════════════════════════════════════════════════════════
                         READY FOR PR
═══════════════════════════════════════════════════════════════

All critical checks passed.

Accepted findings (will be noted in PR):
- [list any findings the developer chose to accept]

Next step: /project:issues:create-pr
```

If there are zero findings across all steps, skip the triage and go directly to:

```
═══════════════════════════════════════════════════════════════
                         READY FOR PR
═══════════════════════════════════════════════════════════════

All checks passed cleanly — no issues found.

Next step: /project:issues:create-pr
```

## Light Mode (`--light`)

In light mode, only run Steps 1, 2, and 6 (Typecheck, Lint, Test Adequacy). Skip
all other steps. This produces a shorter, faster preflight suited for bug fixes
and mechanical changes.

If `--with-tests` is also provided, run tests after lint (before test adequacy).

### Light Mode Final Report

```
═══════════════════════════════════════════════════════════════
                 PREFLIGHT CHECK COMPLETE (Light)
═══════════════════════════════════════════════════════════════

Branch: fix/456-null-check
Issue: #456 - Fix null pointer in webhook handler

┌─────────────────────────────────────────────────────────────┐
│ Step                          Status                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Typecheck                  ✅ Passed                      │
│ 2. Lint                       ✅ Passed (2 auto-fixed)       │
│ 3. Test Adequacy              ✅ 0 gaps, 2/2 compliant       │
└─────────────────────────────────────────────────────────────┘
```

If all steps pass with no findings, go directly to:

```
═══════════════════════════════════════════════════════════════
                         READY FOR PR
═══════════════════════════════════════════════════════════════

All checks passed cleanly — no issues found. (Light mode)

Next step: /project:issues:create-pr
```

If test adequacy has findings, present them and ask the developer (same triage
flow as full mode, but only test adequacy findings are possible).

### Light Mode Breakdown Persistence

If a breakdown file exists, append light mode results using the same format but
with only the 3 steps:

```markdown
---

## Preflight Results (Light) - 2026-01-25 14:32

### Summary

| Step          | Status                   |
| ------------- | ------------------------ |
| Typecheck     | ✅ Passed                |
| Lint          | ✅ Passed (2 auto-fixed) |
| Test Adequacy | ✅ 0 gaps, 2/2 compliant |
```

## Strict Mode

If `--strict` and any warnings exist:

```
❌ PREFLIGHT FAILED (strict mode)

Warnings found:
- TODO: Rate limiting needed
- Debug: console.log left in code

In strict mode, all warnings must be addressed.
Fix issues and re-run preflight.
```

## Failure at Any Step

If any step fails:

**Full mode:**

```
═══════════════════════════════════════════════════════════════
                    PREFLIGHT CHECK FAILED
═══════════════════════════════════════════════════════════════

Failed at: Step 1 (Typecheck)

┌─────────────────────────────────────────────────────────────┐
│ Step                          Status                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Typecheck                  ❌ FAILED                      │
│ 2. Lint                       ⏸️ Not run                     │
│ 3. Simplify                   ⏸️ Not run                     │
│ 4. Re-check                   ⏸️ Not run                     │
│ 5. Verify                     ⏸️ Not run                     │
│ 6. Test Adequacy              ⏸️ Not run                     │
│ 7. Compliance                 ⏸️ Not run                     │
│ 8. Reflect                    ⏸️ Not run                     │
└─────────────────────────────────────────────────────────────┘

Fix typecheck errors and re-run:
/project:quality:typecheck
/project:issues:preflight
```

**Light mode:**

```
═══════════════════════════════════════════════════════════════
                 PREFLIGHT CHECK FAILED (Light)
═══════════════════════════════════════════════════════════════

Failed at: Step 1 (Typecheck)

┌─────────────────────────────────────────────────────────────┐
│ Step                          Status                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Typecheck                  ❌ FAILED                      │
│ 2. Lint                       ⏸️ Not run                     │
│ 3. Test Adequacy              ⏸️ Not run                     │
└─────────────────────────────────────────────────────────────┘

Fix typecheck errors and re-run:
/project:quality:typecheck
/project:issues:preflight --light
```

## Persist Results to Breakdown File

After completing all steps, if a breakdown file exists, append the results:

```bash
# Find breakdown file for this issue
ISSUE_NUMBER=$(git branch --show-current | grep -oE '[0-9]+' | head -1)
BREAKDOWN_FILE=$(find docs/plans -name "*issue-${ISSUE_NUMBER}*breakdown*.md" 2>/dev/null | head -1)

if [ -n "$BREAKDOWN_FILE" ]; then
  echo "📝 Appending preflight results to: $BREAKDOWN_FILE"
fi
```

**Append format**:

```markdown
---

## Preflight Results - 2026-01-25 14:32

### Summary

| Step          | Status                   |
| ------------- | ------------------------ |
| Typecheck     | ✅ Passed                |
| Lint          | ✅ Passed (5 auto-fixed) |
| Simplify      | ✅ 3 applied, 1 skipped  |
| Re-check      | ✅ Passed                |
| Verify        | ⚠️ 5/5 reqs, 2 warnings  |
| Test Adequacy | ✅ 0 gaps, 4/4 compliant |

### Simplifications Applied

1. Inlined single-use helper - src/services/user.ts:45
2. Removed dead code - src/api/orders.ts:123
3. Simplified conditional - src/utils/helpers.ts:89

### Verification Warnings

- TODO: Rate limiting needed (api/auth/reset.ts:89)
- Debug: console.log left in code (services/email.ts:45)

### Test Adequacy

- Coverage gaps: 0 critical, 1 warning
- Pattern compliance: 4/4 tests follow project patterns
- Over-testing: 0 instances

(Omit section if test adequacy was skipped)

### Implementation Divergences from Plan

- [DEFERRED] Rate limiting — descoped to follow-up issue
- [WORKAROUND] Email service uses sync send — async queue planned but SDK
  limitation

(Omit section if none)

### Reflection

[Full reflection content from Step 8]
```

This creates a persistent record that `create-pr` can reference.

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Ready for PR","command":"preflight","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

## Integration Notes

- This command replaces the need to manually run multiple quality checks
- `create-pr` checks for documented preflight results before suggesting re-run
- Can be run multiple times - each run appends with timestamp
- Safe to re-run after fixes - latest results are at the bottom
