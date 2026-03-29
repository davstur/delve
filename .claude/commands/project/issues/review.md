# External Model Review Command

You are orchestrating a code review loop powered by an external model. This
command focuses on bug-finding and correctness issues through iterative review
passes until the code is clean.

## Model Selection

**Load the skill for the selected model** (e.g., `codex` skill for Codex CLI).
The skill provides model-specific commands, flags, and interaction patterns.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments:

- `--base <branch>` - Branch to diff against (default: main)
- `--one-iteration` - Single review pass, no loop (default: loops until clean)
- `--context "<text>"` - Custom context to include in assessment
- `--model <name>` - Model to use (default: codex)

Examples:

```
/project:review                              # Full review loop vs main
/project:review --base develop               # Review against develop branch
/project:review --one-iteration              # Single pass, no loop
/project:review --context "Focus on auth"    # Add custom context
/project:review --model gemini               # Use different model (future)
```

## Process

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Review in progress","command":"review","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

**Default behavior**: This is an iterative loop. After fixing issues, you MUST
re-run the external model until the exit condition is met (see Step 6 for
convergence logic). Use `--one-iteration` to skip the verification loop.

### Step 0: Prerequisites

1. Load the skill for the selected model (default: `codex`)
2. Verify the model CLI is available
3. **Check working tree status**: Run `git status --short`. If there are
   uncommitted changes (staged, unstaged, or untracked files), use
   `AskUserQuestion` to inform the user:
   - **"Commit changes first" (Recommended)** — The review diffs against
     committed history (`main...HEAD`). Uncommitted changes won't be reliably
     covered. Codex reads files from disk so it may _incidentally_ see modified
     files, but won't systematically review them. Commit first for clean,
     reproducible coverage. Then continue with Step 0.4.
   - **"Continue without committing"** — Proceed knowing uncommitted changes are
     outside the review scope.
4. Check for changes to review (`git diff --stat main...HEAD`)
5. **Locate breakdown file** (if one exists): Check `docs/plans/` for a
   breakdown file matching the issue(s) on the current branch. This is the
   living document from the planning phase — review findings will be appended
   there for continuity. Store the path for use in the review loop.
   ```bash
   # Extract issue number from branch name (e.g., feature/765-tenant-isolation)
   # Look for matching breakdown file
   ls docs/plans/*issue-${ISSUE_NUMBER}*breakdown* 2>/dev/null
   ```
   If no breakdown file is found, that's fine — review findings will only be
   shown in the terminal output.
6. **Check for parallel commands**: Read `.workflow/config.json` and look for a
   `review.parallel` array. If present, store the list of command paths for use
   in Step 1. Also check for `review.post` — commands to run after the review
   loop exits. Either or both may be absent; that's fine.
   ```bash
   # Example .workflow/config.json:
   # { "review": { "parallel": [".claude/commands/project/i18n/translate.md"] } }
   cat .workflow/config.json 2>/dev/null | jq -r '.review.parallel[]?' 2>/dev/null
   cat .workflow/config.json 2>/dev/null | jq -r '.review.post[]?' 2>/dev/null
   ```

### Step 1: Initial Review

Request unbiased review from the external model using the skill's **review
command pattern** (not the exec/bounce pattern). For code reviews, models
typically require structured output extraction (e.g., `--json` + jq) rather than
file output (`-o`). Consult the skill's review-specific section for the correct
invocation.

**Parallel commands**: If Step 0.6 found `review.parallel` entries, launch them
now as subagents (using the Agent tool) alongside the external model review.
Each command is self-contained — it checks its own preconditions and exits early
if it has nothing to do. Do not wait for them here; they run concurrently with
the review. Collect their results after the external model responds.

**Key principle**: Let the model find what it finds - no custom prompt on
initial pass. The model may focus on 1-2 issues per pass; the loop ensures
thorough coverage.

### Step 2: Assess Findings

For each finding, categorize using codebase-aware criteria:

| Category       | Criteria                                                   | Action                          |
| -------------- | ---------------------------------------------------------- | ------------------------------- |
| **BUG**        | Logic error, null reference, race condition, security flaw | Accept & fix                    |
| **QUALITY**    | Naming, structure, duplication                             | Weigh against existing patterns |
| **CONVENTION** | Style suggestion contradicting codebase norms              | Challenge with evidence         |
| **OPINION**    | "I would do X" without clear benefit                       | Likely reject, document         |

**Finding classification** — For each finding, also classify three additional
dimensions:

| Dimension    | Values                            | Purpose                                            |
| ------------ | --------------------------------- | -------------------------------------------------- |
| **Scope**    | PR-INTRODUCED \| PRE-EXISTING     | Was this in code added/modified by the PR?         |
| **Status**   | NEW \| REPEAT                     | First time surfaced, or seen in a prior iteration? |
| **Severity** | critical \| high \| medium \| low | How impactful is this if left unfixed?             |

Severity guide:

- **critical** — Data loss, security vulnerability, crash in common path
- **high** — Incorrect behavior users will hit, silent data corruption
- **medium** — Edge case bug, degraded experience, misleading behavior
- **low** — Minor inconsistency, cosmetic logic issue, unlikely edge case

Only findings where **Category=BUG AND Scope=PR-INTRODUCED AND Status=NEW**
block the verification loop. All other findings are still assessed and acted on
(per the Out of Scope framework for pre-existing issues), but do not prevent
convergence. See Step 6 for the full exit logic.

**Triage table** — Present this table **every iteration**, after classifying all
findings and before implementing any fixes. This is the intermediate output the
user sees between loop passes — it must appear even when all findings are
non-blocking. It gives an at-a-glance view of every finding and its disposition:

```
| # | Finding              | File:line        | Category   | Severity | Scope          | Status | Decision              | Blocking |
|---|----------------------|------------------|------------|----------|----------------|--------|-----------------------|----------|
| 1 | Null ref on empty... | src/foo.ts:42    | BUG        | high     | PR-INTRODUCED  | NEW    | Accept — fix          | Yes      |
| 2 | Missing i18n key     | src/bar.tsx:15   | QUALITY    | low      | PR-INTRODUCED  | NEW    | Reject — matches...   | No       |
| 3 | SQL injection in...  | lib/db.ts:88     | BUG        | critical | PRE-EXISTING   | NEW    | Accept — fix now (OOS)| No       |
| 4 | Rename handler to... | src/api.ts:20    | CONVENTION | low      | PR-INTRODUCED  | NEW    | N/A — codebase uses...| No       |
```

Decision values: `Accept — fix`, `Accept — fix now (OOS)`, `Reject — [reason]`,
`N/A — [reason]`, `Challenge — [pending]`, `Follow up`

The table is the single source of truth for the iteration. The detailed sections
(Agreed, Disagreed, etc.) in Step 4 expand on the reasoning behind each decision
but must stay consistent with the table.

**Assessment considerations:**

- **Intent**: What is this code trying to achieve? (Check tests, feature
  context)
- **Codebase patterns**: Search for similar code to validate suggestions
- **Quality standards**: Prioritize reliability over shortcuts; effort is cheap
- **Root cause**: Is this finding a one-off mistake, or does it stem from a
  missing, wrong, or ambiguous convention in the knowledge system (rules,
  skills, CLAUDE.md)? If multiple findings share a common root cause — or if a
  finding reveals that the code followed a convention that produced the wrong
  outcome — flag it as a knowledge evolution candidate (see Step 4 tracking)

**Critical evaluation** — You are the project's lead engineer. Don't rubber-
stamp suggestions. For each finding, actively challenge it:

- "Given what I know about this codebase, is this actually a problem?"
- "Is the model missing context that makes this a non-issue?"
- "Would applying this fix break something else the model doesn't see?"

If a suggestion conflicts with something you know about the codebase, reject it
immediately with your reasoning — don't apply and wait for the next iteration to
discover the problem. External models have full codebase access but may miss
project-specific constraints, conventions, or runtime contexts you're aware of.

### Step 3: Challenge (if needed)

If you disagree with a finding, engage the model in conversation using the
skill's dialogue commands.

**Conversation loop rules:**

- Continue until agreement OR 2 rounds without progress
- If stuck after 2 rounds, surface disagreement to user
- Document disagreement if no resolution

**Fix-introduced regression** — If a fix from iteration N causes a new finding
in iteration N+1 that didn't exist before:

1. The new finding is likely caused BY the fix, not a pre-existing issue
2. Strongly consider reverting the fix and REJECTing the original finding
3. The model likely missed business context that made the original finding a
   non-issue

### Step 4: Track Results

Build three lists:

```markdown
## Review Assessment

### Agreed (will fix)

- [ ] Issue 1: [Description] - [File:line]

### Disagreed (user decides)

- Issue A: Model suggests X, Claude prefers Y
  - **Model reasoning**: [Why model thinks this]
  - **Claude reasoning**: [Why Claude disagrees]

### Not Applicable (model was wrong)

- Suggestion B: [Why our codebase makes this moot]

### Rejected (non-blocking)

Valid observations that don't warrant fixing in this PR. Each must state a
**disposition** — no finding should leave the reader wondering "so what do we do
about this?":

| Disposition   | When to use                                              |
| ------------- | -------------------------------------------------------- |
| **Discarded** | Acceptable risk, architectural limitation, or edge case  |
|               | whose consequence is safe. Neither now nor later.        |
| **Follow up** | Real concern, issue-sized work, wrong scope for this PR. |
|               | Propose for user confirmation in the final summary.      |

**Follow-up threshold**: Only propose a follow-up if the work is genuinely
issue-sized (requires its own branch/review). If it's small enough to fix in a
few lines, either fix it now or discard it — don't create tracking overhead for
trivial items.

**Decision test**: "Would I want this convention/pattern in this codebase?" If
yes and it's small, fix now. If yes and it's large, follow up. If no, discard —
regardless of whether the model flagged it.

- Issue C: [Description]
  - **Disposition**: Discarded — [rationale]
- Issue D: [Description]
  - **Disposition**: Follow up — [brief rationale for why this matters]

### Knowledge Evolution

Findings that reveal a systemic issue in the knowledge system — a missing rule,
a wrong convention, an ambiguous skill, or a stale CLAUDE.md entry that caused
or permitted the problem. Fixing only the code treats the symptom; updating the
knowledge system prevents recurrence.

- Issue E: [Description]
  - **Root cause**: [Which knowledge artifact is missing/wrong/ambiguous]
  - **Evidence**: [The finding(s) that revealed this — reference by description]
  - **Recommendation**: [Specific change: add rule, update skill, amend
    CLAUDE.md]
  - **Confidence**: [high | medium | low]

Confidence guide (mirrors preflight's compliance checker):

- **high** — Clear gap or wrong convention. The finding directly demonstrates
  the knowledge system produced incorrect code. Should be addressed now.
- **medium** — Plausible improvement but could go either way. Needs developer
  judgment.
- **low** — Pattern is emerging but not yet established. Informational only —
  note in summary but don't include in triage.

**When to record**: Any time you think "this will happen again because there's
no rule preventing it" or "the developer followed a convention that led them
astray." Not every finding has a knowledge root cause — most don't. But when one
does, capturing it here is higher-value than the code fix itself.

### Out of Scope

Items found outside the PR's direct scope. Default: fix it now if safe.

- Issue C: [Description] - [File:line]
  - **Action**: [Fix now | Follow up | Discard (with justification)]

**Decision criteria:**

| Action        | When to use                                                    |
| ------------- | -------------------------------------------------------------- |
| **Fix now**   | Default. Won't open door to unknown consequences.              |
| (default)     | Includes: related cleanup, unrelated small fixes (unused code, |
|               | lint issues, typos). If in doubt, just fix it.                 |
| **Follow up** | Unrelated AND genuinely issue-sized. Would need its own branch |
|               | and review. Small fixes don't qualify — fix now or discard.    |
|               | Propose for user confirmation in the final summary.            |
| **Discard**   | Neither now nor later. Must justify why it's acceptable        |
|               | long-term. "Cosmetic", "doesn't affect functionality", and     |
|               | "pre-existing" are NOT valid reasons. Investigate the actual   |
|               | impact before concluding (see non-negotiable rule #8).         |
```

### Step 4.1: Update Breakdown (per iteration)

**After triaging all findings and before implementing fixes**, update the
breakdown file with the current iteration's assessment. This is mandatory if a
breakdown file was found in Step 0.

This serves two purposes:

1. **Context preservation** — if a compact happens mid-fix, the agent can
   re-read the breakdown to recover the full triage reasoning
2. **Audit trail** — each iteration's decisions are recorded, not just the final
   summary

Append or update a section in the breakdown:

```markdown
## Review — Iteration N

**Model**: codex | **Exit status**: in progress

### Triage Table

| #   | Finding | File:line | Category | Severity | Scope         | Status | Decision     | Blocking |
| --- | ------- | --------- | -------- | -------- | ------------- | ------ | ------------ | -------- |
| 1   | ...     | ...       | BUG      | high     | PR-INTRODUCED | NEW    | Accept — fix | Yes      |

### Agreed (will fix)

- [ ] [Description] — [File:line]

### Disagreed (user decides)

- [Description] — Model: [X], Claude: [Y]

### Not Applicable

- [Description] — [why moot]

### Rejected (non-blocking)

- [Description] — [Discarded | Follow up]: [rationale]

### Out of Scope

- [Description] — [Fix now | Follow up | Discard]: [rationale]

### Knowledge Evolution

- [Description] — [high | medium | low]: [root cause + recommendation]
```

Omit empty sections. On subsequent iterations, append a new
`## Review — Iteration N` section (do not overwrite previous iterations).

When the loop exits, update the last iteration's exit status to the final result
(e.g., `**Exit status**: converged after 3 iterations`).

### Step 5: Fix Agreed Issues

Implement the fixes for all issues in your "Agreed (will fix)" list:

1. Make the code changes
2. Check off each item as you complete it
3. Note what changed for the summary

### Step 6: Verification Loop

**You MUST re-run the external model after fixing issues.** Do not skip this.

After implementing fixes, immediately run another review using the skill's
commands. Each re-run counts as an iteration (initial review = iteration 1).

**Minimum iterations**: Always run at least 2 iterations. A single pass can miss
important issues — the second pass often catches what the first one overlooked.
Do not evaluate exit conditions until iteration 2 is complete.

**Exit when ANY of these conditions are met (iteration ≥ 2):**

1. **CLEAN PASS**: Model explicitly states no issues found
2. **CONVERGENCE**: 2 consecutive iterations where no finding qualifies as
   blocking (Category=BUG AND Scope=PR-INTRODUCED AND Status=NEW). Non-blocking
   findings are still assessed and acted on but do not reset the convergence
   counter.
3. **HARD CAP**: 10 iterations total. Exit with current state and summarize any
   unresolved findings for the user.

**What counts as blocking:**

Only findings that meet ALL three criteria reset the convergence counter:

- **Category=BUG** — Logic error, null reference, race condition, security flaw
- **Scope=PR-INTRODUCED** — In code added or modified by this PR
- **Status=NEW** — Not previously surfaced and assessed in an earlier iteration

Everything else — QUALITY/CONVENTION/OPINION findings, pre-existing bugs,
repeated findings — gets recorded and acted on (per the Out of Scope framework)
but does not prevent exit.

**Pre-existing bugs**: Apply the Out of Scope decision framework (Step 4).
Default is "fix now" — they ride along with the PR but don't extend the review
loop. A pre-existing bug triggered by the PR's new code path is still
PRE-EXISTING for convergence purposes but should be "Fix now," not deferred.

**Business context escalation** (iteration 3+): After the initial unbiased pass,
subsequent re-sends to the model MAY include domain constraints to prevent the
model from chasing theoretical paths unreachable in practice. Example: "Note:
unclaimed students cannot have conversation_participants records — this FK path
is not reachable." This is domain knowledge the model can't infer from code
alone, not opinion or leading.

**Reflection point at 3+ iterations**: After iteration 3, pause and assess:

- Are findings still surfacing genuine bugs in PR-scoped code?
- Or has the model shifted to exhaustive analysis of pre-existing patterns,
  theoretical edge cases, or repeated observations?
- Are you applying suggestions too uncritically? Would stricter REJECT or
  PRE-EXISTING classifications have prevented unnecessary iterations?

**Loop behavior**:

1. Run review → Model finds issues → Classify each (Category + Scope + Status +
   Severity)
2. Present triage table to user (every iteration — this is the inter-loop
   output)
3. Fix blocking findings; apply Out of Scope framework for pre-existing bugs
4. Re-run the external model
5. Check exit conditions against the new response (only if iteration ≥ 2)
6. If no exit condition met or iteration < 2, return to step 1

```
┌─────────────────────────────────────────────────────────────┐
│  ⛔ STOP: YOU CANNOT PROCEED TO STEP 7 UNTIL:              │
│                                                             │
│  □ You have completed at least 2 iterations                │
│  □ You have re-run the external model AFTER your fixes     │
│  □ An exit condition has been met (clean/convergence/cap)   │
│  □ You have recorded the iteration count and exit reason    │
│                                                             │
│  One pass with fixes is NOT a clean review.                │
│  Fixes can introduce new issues. Always verify.            │
└─────────────────────────────────────────────────────────────┘
```

**Exit reasons for reporting:**

- ✅ `clean` — model's last output had no findings
- ✅ `converged` — 2 consecutive iterations with no new PR-scoped bugs
- ⛔ `capped` — hit 10-iteration cap, remaining items summarized for user
- 🔄 `cycling` — same findings reappearing across iterations

### Step 7: Final Summary

**Before writing the summary, verify:**

- [ ] External model was re-run after fixes were applied
- [ ] An exit condition was met (clean, converged, or capped)
- [ ] Iteration count and exit reason are recorded
- [ ] Breakdown file's last `## Review — Iteration N` exit status updated to
      final result (e.g., `converged after 3 iterations`)

If any checkbox is unchecked, **go back to Step 6**.

```
═══════════════════════════════════════════════════════════════
                    EXTERNAL REVIEW COMPLETE
═══════════════════════════════════════════════════════════════

Branch: feature/123-new-feature
Base: main
Model: codex
Iterations: 3 (converged)  ← MUST reflect actual count and exit reason
Exit: [clean | converged | capped]

### Issues Fixed
1. ✅ [Description] (file:line)

### Disagreed (User Decides)
1. ❓ [Topic]
   - Model: [position]
   - Claude: [position]

### Rejected (Non-Blocking)
1. ❌ [Description] — Discarded: [why neither now nor later]

### Out of Scope
1. ✅ [Description] (file:line) - Fixed (small/safe)
2. ❌ [Description] (file:line) - Discarded: [why neither now nor later]

### Not Applicable
1. ➖ [Description] — [why model was wrong given codebase context]

### Knowledge Evolution
1. 🧬 [Description] — [high | medium]: [root cause + recommended change]

### Proposed Follow-Up Issues
1. 📋 [Title] — [brief rationale for why this matters]
2. 📋 [Title] — [brief rationale for why this matters]

### Next Steps
- If fixes were made: `pnpm typecheck && pnpm test` before pushing
- Push to PR and address any CI failures

═══════════════════════════════════════════════════════════════
```

### Step 7.0.1: Commit and Push Breakdown Updates

If a breakdown file was updated during the review (Step 4.1 / Step 7 exit status
update), commit and push it now so the changes are preserved on the remote
branch before the worktree is cleaned up.

```bash
git add docs/plans/*breakdown*
git commit -m "docs: update breakdown with review findings"
git push
```

Skip this step if no breakdown file exists or if the file has no uncommitted
changes.

### Step 7.1: Confirm Follow-Up Issues and Knowledge Evolution

Present follow-up issues and knowledge evolution candidates together so the user
can decide on all actionable items at once.

#### Follow-Up Issues

If there are proposed follow-up issues, present each with:

1. **Title** — What the issue would track
2. **Value** — Why this matters (the concrete problem it solves)
3. **Why not now** — Why it doesn't belong in this PR
4. **Your recommendation** — State whether you'd actually want this
   convention/pattern in this codebase, and why. Don't be neutral — the user
   wants your judgment, not just a relay of the model's findings.

Options per item:

- **Create** — Create the issue as proposed
- **Discard** — Drop it entirely
- **Consolidate** — Merge with another proposed follow-up
- **Edit** — Adjust the title or scope before creation
- **Fix now** — Small enough to just do it in this PR after all

#### Knowledge Evolution Candidates

If there are high or medium confidence knowledge evolution candidates, present
each with:

1. **What's wrong/missing** — The specific knowledge artifact (rule, skill,
   CLAUDE.md entry) that is absent, incorrect, or ambiguous
2. **Evidence** — Which review finding(s) revealed this, and why the current
   knowledge system permitted or caused the problem
3. **Impact if unchanged** — What will keep happening in future PRs
4. **Recommended fix** — Specific change (add rule X, update skill Y, amend
   CLAUDE.md section Z)
5. **Your recommendation** — Is this worth codifying? Be opinionated.

Options per item:

- **Apply now** — Update the knowledge system in this PR using
  `/project:knowledge:add`. High-confidence candidates default here.
- **Create issue** — Track as a follow-up if the knowledge change needs broader
  discussion or affects many conventions
- **Discard** — Not worth codifying (must justify why)

Low-confidence candidates are informational — they appear in the summary for
visibility but are NOT presented for decision.

Use `AskUserQuestion` to present all items (follow-ups + evolution candidates)
and wait for user decisions. **Do not create issues or apply knowledge changes
until the user confirms.**

Report results:

```
Follow-up issues created:
- #NNN [title]
- #NNN [title]

Knowledge updates applied:
- Added rule: .claude/rules/[name].md
- Updated: CLAUDE.md — [section changed]
```

### Step 7.2: Post Commands

If Step 0.6 found `review.post` entries, run them now sequentially. These are
project-specific commands that run after the review loop and all parallel work
have finished — for example, a final consistency check across files that were
touched by both the review fixes and a parallel command. Each command is
self-contained and decides whether it has work to do.

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Review complete","command":"review","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

## One-Iteration Mode (--one-iteration)

Single review pass: review → assess → challenge → fix → summary. No re-review
after fixes. Equivalent to calling bounce without `--exit-condition`.

## Custom Context (--context)

Context is used in assessment, not in the model's initial review. Keeps initial
review unbiased; context helps Claude prioritize and reason.
