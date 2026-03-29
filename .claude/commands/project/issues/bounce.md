# External Model Bounce Command

You are facilitating a plan validation and brainstorming session with an
external model. Use this to validate plans, explore trade-offs, and catch
unknown unknowns before implementation.

## Model Selection

**Load the skill for the selected model** (e.g., `codex` skill for Codex CLI).
The skill provides model-specific commands, flags, and interaction patterns.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments:

- Topic or question (optional - defaults to conversation context)
- Path to plan file (optional)
- `--full` - Multi-perspective review: Architect + UX (if UI) + Codex, with Lead
  Engineer synthesis
- `--exit-condition "<condition>"` - Enables iterative looping. Without this
  flag, bounce runs a single pass. See "Exit Condition" section below.
- `--resume-codex` - Resume the codex session across iterations instead of
  starting fresh each time. Stores the session ID in the bounce log.
- `--context "<text>"` - Additional context to include
- `--model <name>` - Model to use (default: codex)

Examples:

```
/project:bounce                                    # Single pass bounce
/project:bounce "Should we use JWT or sessions?"   # Specific question
/project:bounce docs/temp/breakdown.md             # Bounce a plan file
/project:bounce --full docs/temp/breakdown.md      # Full expert review (single pass)
/project:bounce --exit-condition "severity < medium"  # Loop until no medium+ findings
/project:bounce --exit-condition "no findings"     # Loop until completely clean
/project:bounce --resume-codex --exit-condition "severity < medium"  # Resume session across loops
/project:bounce --context "Optimizing for reads"   # Add context
/project:bounce --model gemini                     # Use different model (future)
```

## Process

### Step 0: Prerequisites

1. Load the skill for the selected model (default: `codex`)
2. Verify the model CLI is available

### Step 1: Extract Topic/Plan

**If file path**: Give the model access to the file - either pass the path for
it to read, or include the content directly. Don't summarize or paraphrase, as
that filters information and introduces bias before the model sees it.

**If topic/question**: Use directly.

**If no argument**: Extract from current conversation context.

**Paths vs Content - when to use each:**

- **Pass paths** (preferred): For files that exist - plans, specs, related code.
  The model reads them directly and can explore related files.
- **Pass content**: For ephemeral content you just generated, small snippets, or
  when you've already filtered/transformed the source.

### Step 2: Build Prompt (Neutral, Factual)

Build a prompt for the external model. Keep it **neutral and factual**:

```
Review this [plan/breakdown/approach].

[If plan relates to a GitHub issue, include the goal:]
Goal (from issue #NNN):
[Issue body - the requirement/goal we're trying to achieve]

[If you have KNOWN, FACTUAL codebase constraints - include them:]
Constraints:
- [Tech stack, e.g., "Next.js + Supabase with Row Level Security"]
- [Hard limits, e.g., "CI budget < 3 minutes"]
- [Existing patterns, e.g., "Uses tenant-per-test isolation"]

[Path to plan file, OR full content if no file exists]

Flag missing steps, risks, over-engineering, unknown unknowns.
```

**Good context (include):**

- **The goal**: Issue body, requirement - what we're trying to achieve
- **Factual constraints**: Tech stack, hard limits, existing patterns
- **Access to source material**: File paths (preferred) or full content

**Bad context (omit):**

- **Your interpretations**: Don't summarize - let the model see the raw content
- **Your opinions**: Don't say "we think X" or "the concern is Y"
- **Leading questions**: Don't prime the model toward specific issues
- **Invented context**: If you don't know specific constraints, omit them

**Let it find what it finds** - the value is fresh, independent perspective.

**Codebase access**: The external model can read files, grep patterns, and
verify claims on its own. Prefer giving file paths over copy-pasted text - this
lets the model explore and verify as it sees fit.

Factual context helps it focus without rediscovering everything. But
over-contextualizing with your own analysis defeats the purpose. Don't
micro-manage what it should look at - let it find what it finds.

### Step 3: Initial Bounce

Send to model using the skill's commands. Use `-o` to capture clean final output
(see codex skill for details).

**If `--resume-codex`**: After codex completes, extract the session ID from the
log output (`session id: <uuid>`) and note it in the bounce log header:

```markdown
**Codex session**: <session-id>
```

On subsequent iterations (Step 5.5 loop), use
`codex exec -o ... resume <session-id> "follow-up prompt"` instead of a fresh
`codex exec`. This gives codex dialogue continuity — it can reference prior
discussion rather than re-discovering the same ground.

### Step 3.5: Assess Each Finding

For each point the model raises, evaluate and document using this structure:

```
#: [sequential number]
Finding: [What the model flagged — in their words, not paraphrased]
Severity: High | Medium | Low
Discovery: Immediate | Integration | Hidden
Status: NEW | REPEAT
Assessment: ALIGNED | DEBATABLE | REJECT — [Your reasoning with codebase context]
Action: [Concrete next step: what you'll fix, investigate, or why you're skipping]
```

**Severity levels:**

- **High**: Incorrect behavior, missing functionality, security issue, or
  architectural flaw that would cause real problems
- **Medium**: Meaningful improvement — better patterns, missing edge cases, gaps
  in test coverage, consistency issues
- **Low**: Style preferences, minor naming suggestions, nice-to-haves,
  tangential observations

**Discovery timing** (when would this surface without the review?):

- **Immediate**: Would fail on first typecheck, lint, or test run — clear error
  message pointing to the problem
- **Integration**: Would fail on first manual test, CI pipeline, or deployment —
  requires running the actual code to discover
- **Hidden**: Would pass initial testing, surface later in production, edge
  cases, or specific conditions (e.g., cron context, race conditions, scale)

**Status** (tracking across iterations):

- **NEW**: Finding not previously surfaced in an earlier iteration
- **REPEAT**: Same or substantially similar finding from a prior iteration —
  already assessed and acted on (or rejected with reasoning)

**For exit condition evaluation**: Only Integration and Hidden issues count
toward `severity < medium`. Immediate issues get logged but don't block exit —
they'll surface instantly during implementation with clear errors. REPEAT
findings never block exit — they've already been assessed.

**Assessment categories:**

- **ALIGNED**: Model is right, fits our patterns → apply the fix
- **DEBATABLE**: Genuine trade-off, reasonable either way → discuss or surface
  to user
- **REJECT**: Model is wrong given our codebase context → explain why, skip

**Before marking ALIGNED** — You are the project's lead engineer. Don't rubber-
stamp suggestions. For each finding, actively challenge it:

- "Given what I know about this codebase, is this actually a problem?"
- "Is the model missing context that makes this a non-issue?"
- "Would applying this fix break something else the model doesn't see?"
- "Is this a genuine unknown unknown, or is the model second-guessing itself?"
- "Does this contradict a principle or scope boundary the plan already states?"

If a suggestion conflicts with something you know about the codebase (e.g., "add
permission check in SQL" when you know pg_cron runs without auth context),
REJECT it immediately with your reasoning — don't apply and wait for the next
iteration to discover the problem.

### Step 4: Before Each Loop - Checklist

Before continuing iteration:

- [ ] Are we making progress toward agreement?
- [ ] Is there a decision that needs user input?
  - Speed vs thoroughness trade-off?
  - Architectural choice with no clear winner?
- [ ] Are we going in circles on the same point?
- [ ] Has complexity escalated beyond original scope?

**If concern or stuck 2+ rounds**: Surface to user with current state.

### Step 5: Assess and Apply

1. Assess each finding using the format from Step 3.5
2. **ALIGNED findings**: Apply fixes to the plan/code
3. **DEBATABLE findings**: Challenge with codebase context → Re-query model
4. **REJECT findings**: Document reasoning, skip

**Critical**: You own the fixes — you have full codebase context and can apply
them correctly.

### Step 5.5: Check Exit Condition (if `--exit-condition` provided)

**Without `--exit-condition`**: Stop here. Single pass is complete. Proceed to
summary.

**With `--exit-condition`**: Evaluate whether to loop. The exit condition is
checked against the **model's latest response/output** — not against what was
fixed from earlier iterations.

**Track iteration count**: Count each round-trip with the model (initial send =
iteration 1, first re-bounce = iteration 2, etc.). Include this count in the
summary.

**Loop logic:**

1. Model responds with findings → assess and apply fixes
2. **Re-send the updated plan to the model** — this is mandatory, not optional
3. Model responds again → check exit condition against THIS response
4. If exit condition NOT met, go to step 1
5. If exit condition IS met, proceed to summary

**You cannot self-certify "clean"**. Only the model can confirm there are no
remaining issues by responding with no findings (or only Low findings for
`severity < medium`). Applying fixes without re-sending is an incomplete
iteration.

Re-bouncing is for discovery — changes often reveal new layers: interactions
that weren't visible before, secondary effects, edge cases masked by the
original issues.

**Common exit conditions and what they mean:**

| Exit condition | Loops until...                                | Used by          |
| -------------- | --------------------------------------------- | ---------------- |
| `severity`     | No new Medium+ findings (Integration/Hidden)  | breakdown/bounce |
| `< medium`     |                                               |                  |
| `no findings`  | Zero findings of any severity                 | bounce           |
| `convergence`  | 2 consecutive iterations with no new blocking | review           |
|                | findings (BUG + PR-INTRODUCED + NEW)          |                  |

**Hard safety valves (always apply when looping):**

- ⛔ Soft cap: 5 iterations → Exit with current state
- 🔄 Rabbit hole detected (same issues cycling) → Exit with explanation
- ⚠️ Clear documented disagreement → Surface to user

**Reflection point at 3+ iterations**: After iteration 3, pause and explicitly
assess before continuing:

- Are new findings surfacing genuine unknown unknowns (tool-specific behaviors,
  subtle edge cases, architectural gaps)?
- Or is this churn — the model arguing with itself, refining suggestions it made
  earlier, or flagging issues you already considered and rejected?
- Are you applying suggestions too uncritically? Would stricter REJECT decisions
  have prevented some of these iterations?
- What proportion of recent findings are Status=REPEAT? A high ratio signals the
  model is cycling rather than discovering.

If uncertain whether to continue, surface to user with current state. Three
iterations of genuine discovery is valuable; six iterations of polish and
self-correction is waste.

**Exit reasons for reporting:**

- ✅ `clean` — model's last output had no findings
- ✅ `clean (severity < medium)` — model's last output had only Low findings
- ✅ `converged` — 2 consecutive iterations with no new blocking findings
- ⚠️ `needs decision` — unresolved disagreement surfaced for user
- ⛔ `capped with open points` — hit iteration cap
- 🔄 `cycling` — same issues reappearing

```
💡 Each re-bounce is about discovery: "what else?" not "did I
   fix it right?" You own the fixes. The model provides fresh
   eyes on each new state of the plan/code.

⚠️ Disagreement is a valid outcome — it surfaces trade-offs
   for user decision. Don't force consensus on genuine
   trade-offs.
```

### Step 6: Present Summary

Include the iteration count in the summary header so the user knows how many
rounds it took to reach agreement.

```markdown
## Bounce Summary ([N] iterations, [exit reason])

Example headers:

- ## Bounce Summary (3 iterations, clean)
- ## Bounce Summary (5 iterations, capped with open points)
- ## Bounce Summary (2 iterations, needs decision)

### Topic

[What was bounced]

### Agreed

- **Architecture**: Use X pattern because Y
- **Scope**: Include A, B; defer C

### Your Decision Needed

1. **Speed vs Thoroughness**
   - Option A: [Description]
   - Option B: [Description]
   - Claude leans: [preference]
   - Model leans: [preference]

### Unknown Unknowns Surfaced

- **Edge case**: [Description] - Added to plan
- **Risk**: [Description] - Mitigation needed

### Model Suggestions We're Skipping (and why)

- Suggestion X: [Why not applicable]

### Decision Log

- Started with [question/plan]
- Iteration 1: Model flagged [concerns]
- Iteration 2: Applied fixes, model raised [secondary concern]
- Iteration [N]: Model confirmed plan is clean
- User decides: [remaining items]
```

### Step 6.5: Document Findings in Source File

**If a living document file path is available** — either passed directly as an
argument (plan, breakdown) or provided by the calling context (e.g., the review
command locates the breakdown file and passes it) — append the findings log to
that file. This ensures bounce results are documented for session handoffs,
future reference, and audit trails — not just shown in the terminal.

**Append the following to the file** (at the end, or in a dedicated
review/bounce log section if one exists):

```markdown
## Bounce Log — [Date]

**Invoked by**: [breakdown-feature / breakdown-technical / review / standalone]
**Exit condition**: [severity < medium / no findings / single pass] **Codex
session**: [session-id, if --resume-codex] **Result**: [N] iterations, [exit
reason]

### Iteration 1

#: 1 Finding: [What the model flagged] Severity: High | Medium | Low Assessment:
ALIGNED | DEBATABLE | REJECT — [Reasoning] Action: [What was done]
──────────────────────────────────────── #: 2 ...

### Iteration 2

...

### Iteration [N] (final)

[Findings from last iteration, or "No findings — clean."]
```

**Rules:**

- Log every iteration's findings, not just the final one — this shows the
  progression of discovery layers
- If the file has no existing bounce log section, append at the end
- If the file already has a bounce log from a previous session, append a new
  dated section (don't overwrite)
- For review bounces: the review command looks for the breakdown file in
  `docs/temp/` and passes it if found. If no breakdown file exists, skip this
  step (findings are in the terminal output and PR history instead)

**Reporting bounce completion** (always include, both in summaries and inline):

Always report two things: the iteration count and how the final iteration ended.
The iteration count is how many times the model responded, not how many times
you applied fixes.

```
# Single pass (no --exit-condition):
Plan bounced (1) and updated. Ready to proceed.

# Looped, model verified clean on iteration 3:
Plan bounced (3, clean) and updated. Ready to proceed.

# Looped, model verified only low-severity on iteration 2:
Plan bounced (2, clean — severity < medium) and updated. Ready to proceed.

# Looped, no new blocking findings for 2 consecutive iterations:
Plan bounced (5, converged) and updated. Ready to proceed.

# Hit iteration cap with medium/high items still active:
Plan bounced (5, capped with open points) — see summary for details.

# Disagreements surfaced for user decision:
Plan bounced (2, needs decision) — see "Your Decision Needed" below.

# WRONG - never report this way:
Plan bounced (1, clean) — applied fixes  ❌  (model didn't verify)
```

## Exit Condition (--exit-condition)

By default, bounce runs a **single pass**: send → assess → apply → summary.

When `--exit-condition` is provided, bounce becomes an **iterative loop** that
continues until the condition is met against the model's latest output, or a
safety valve triggers.

The exit condition is evaluated against what the model **raises in its latest
response** — not against what was fixed from earlier iterations. For example,
`--exit-condition "severity < medium"` means: the model's most recent output
contained no new findings at Medium severity or above.

**Discovery timing filter**: When evaluating findings against the exit
condition, only count Integration and Hidden discovery issues. Immediate
discovery issues (would fail on first typecheck/lint/test with clear error)
don't block exit — they'll surface instantly during implementation. See Step 3.5
for definitions.

**Status filter**: Only NEW findings count toward exit condition evaluation.
REPEAT findings (same issue resurfacing from a prior iteration) have already
been assessed and don't block exit regardless of severity.

**Common mistake**: Applying fixes after iteration 1 and reporting "clean"
without re-sending to the model. This skips verification. After applying fixes,
you must re-send to get a new response — only that response determines whether
the exit condition is met.

```
Wrong:  Iteration 1 → High findings → apply fixes → "clean" ❌
Right:  Iteration 1 → High findings → apply fixes → re-send →
        Iteration 2 → no findings → "clean" ✓
```

**Examples:**

```
# Planning: loop until only low-severity items remain
/project:bounce --exit-condition "severity < medium" docs/temp/breakdown.md

# Review: loop until model finds nothing at all
/project:bounce --exit-condition "no findings"

# Combined with full expert review
/project:bounce --full --exit-condition "severity < medium" docs/temp/breakdown.md
```

## Full Expert Review Mode (--full)

Multi-perspective review for thorough plan validation. Runs Architect + UX +
Codex in parallel, then Lead Engineer synthesis.

**⚠️ Graceful Fallback**: If sub-agents aren't available, warn and continue with
Codex bounce only.

### Process

**Step 1: Launch ALL reviewers in parallel**

All three reviewers are independent — launch them in a **single message with
multiple tool calls**, not sequentially. The only step that depends on their
output is the synthesis (Step 2).

**Architect Review:**

```
Task(subagent_type="plan-architect-reviewer", prompt="Review the plan at
<path-to-file>. Focus on architectural soundness, API design, and performance
concerns.")
```

If agent not found: `⚠️ Architect reviewer not available, continuing...`

**UX Review (if user-facing):**

**Run if**: Plan touches UI, user flows, interaction patterns, error messages,
or loading states.

**Skip if**: Pure backend/infrastructure with no user-facing changes.

```
Task(subagent_type="plan-ux-reviewer", prompt="Review the plan at
<path-to-file>. Focus on user journey completeness, interaction design, and
accessibility.")
```

If agent not found: `⚠️ UX reviewer not available, continuing...`

**Codex Bounce:**

Run the standard Codex bounce (Steps 1-5 from main process).

> ⚠️ **Do not wait** for Architect or UX results before starting Codex. All
> three provide independent perspectives and must run concurrently.

**Step 2: Lead Engineer Synthesis**

You (the main agent) act as Lead Engineer with full codebase context. Review ALL
feedback from Architect, UX, and Codex together.

**For Architect/UX suggestions**, categorize:

| Category     | Meaning                     | Action                     |
| ------------ | --------------------------- | -------------------------- |
| ✅ ALIGNED   | Fits existing patterns      | Include in plan            |
| 🔄 EVOLUTION | Better than current pattern | Flag for discussion        |
| ⚖️ DEBATABLE | Genuine tradeoff            | Document both sides        |
| ❌ REJECT    | Current pattern is better   | Explain why, don't include |

**For Codex suggestions**, categorize:

| Status              | Meaning                                   | Action                  |
| ------------------- | ----------------------------------------- | ----------------------- |
| ✅ EXISTING PATTERN | We already do this                        | Include                 |
| ✅ CONSISTENT       | Doesn't conflict                          | Include                 |
| 🔄 BETTER PATTERN   | Conflicts but better                      | Flag for discussion     |
| ⚠️ NEW PATTERN      | Would introduce something new             | Needs justification     |
| ❌ CONFLICTS        | Goes against patterns without good reason | Reject with explanation |

**When to present explicit synthesis**: If reviewers raise conflicting
perspectives on the same topic (e.g., Architect wants async queue, UX wants
synchronous feedback), present your reconciliation explicitly before applying
changes. If all findings are independent with no conflicts, the per-finding
categorization is sufficient — no need for a separate synthesis section.

**Present a consolidated Finding Assessment table** that merges all reviewer
feedback into a single view. This is the primary synthesis artifact — adapt
columns and content to the context, but aim for something like:

```markdown
| #   | Finding                               | Source(s)  | Severity | Assessment         | Action                                       |
| --- | ------------------------------------- | ---------- | -------- | ------------------ | -------------------------------------------- |
| 1   | Missing DB unique constraint          | All 3      | High     | ALIGNED            | Add partial unique index                     |
| 2   | Payment source UI confusion           | All 3      | High     | ALIGNED            | Simplify to informational note               |
| 3   | Credit balance creation missing       | Arch+Codex | Medium   | ALIGNED (partial)  | Document as known limitation, defer to #723  |
| 4   | Status semantics inconsistent         | Codex      | High     | ALIGNED            | Rename methods, standardize to "current"     |
| 5   | SearchSelector doesn't support groups | UX+Codex   | Medium   | ALIGNED            | Use type badge per item, drop grouping req   |
| 6   | Repository overlap with existing repo | Arch+Codex | Medium   | REJECT (partial)   | New repo correct, but reuse existing mapper  |
| 7   | Server action location too specific   | Arch       | Medium   | ALIGNED            | Move to parent module (one level up)         |
| 8   | Status transition validation missing  | Arch       | Medium   | ALIGNED            | Add VALID_TRANSITIONS state machine          |
| 9   | Duplicate assignment UX for paused    | UX         | Medium   | ALIGNED            | Context-aware message: "Resume instead?"     |
| 10  | Cancel confirmation for credits       | UX         | Medium   | ALIGNED (deferred) | Generic for now, credit-aware with #723      |
| 11  | Missing data-loading actions          | Codex      | Medium   | ALIGNED            | Add getActiveOffersForAssignment query       |
| 12  | Revalidation strategy unspecified     | Codex      | Medium   | ALIGNED            | Add revalidation targets                     |
| 13  | Empty state context sensitivity       | UX         | Low      | ALIGNED            | Add conditional empty states                 |
| 14  | Mobile layout concern                 | UX         | Low      | DEBATABLE          | Validate at quality gate, current reasonable |
| 15  | Optimistic vs server-confirmed        | UX         | Low      | ALIGNED            | Server-confirmed (consistent with patterns)  |
```

**Key characteristics of a good synthesis table:**

- **Source(s)** shows reviewer convergence — "All 3" findings carry more weight
  than single-source ones
- **Assessment** uses nuanced qualifiers beyond bare ALIGNED/REJECT —
  `(partial)` when you accept the finding but not the proposed solution,
  `(deferred)` when correct but out of scope for this work
- **Action** is concrete and specific — not "fix it" but the actual change
- Rows ordered by severity (High first), then by source convergence
- Adapt freely: drop Source(s) column for single-reviewer bounces, add a "Defers
  to" column when multiple findings reference other issues, split into
  sub-tables by phase if that's clearer

**Step 3: Consolidate**

Update the plan with:

- All ✅ items incorporated
- 🔄 items listed as "Pattern Improvements to Discuss"
- ⚖️ items listed as "Tradeoffs for User Decision"
- ❌ items logged with rationale (not in plan)

### Summary Format (--full)

```markdown
## Full Review Summary ([N] Codex iterations, [exit reason])

### Reviewer Perspectives

**Architect**: [Key findings - data flow, API, error handling] **UX**: [Key
findings - if run; user journey, accessibility] **Codex**: [Key findings -
implementation concerns, edge cases]

### Applied to Plan (✅)

- [Changes incorporated]

### Pattern Improvements to Discuss (🔄)

1. **[Topic]**: [Current vs proposed pattern]

### Tradeoffs for User Decision (⚖️)

1. **[Topic]**
   - Option A: [Architect/UX perspective]
   - Option B: [Codex perspective]
   - Lead Engineer assessment: [Your take]

### Rejected with Rationale (❌)

- [Suggestion]: [Why current pattern is better]
```

## Key Principles

**Don't rush to consensus**: Disagreement surfaces trade-offs. **User has final
say**: Present both perspectives on disagreements. **Fresh perspective value**:
External models provide industry-general best practices.
