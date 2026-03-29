---
name: codex
description:
  Codex CLI interaction patterns. Load when using /project:review or
  /project:bounce with --model codex (default). Provides CLI commands and
  non-interactive mode requirements.
---

# Codex CLI

## Non-Interactive Mode (Required)

Claude runs non-interactively. Standard `codex "prompt"` fails with "stdin is
not a terminal".

**Always use `codex exec` or `codex review`:**

```bash
# Brainstorming/bounce (non-interactive prompt)
codex exec "your question"

# Code review (diff-based)
codex review --base main
```

## Output Handling

Codex streams intermediate steps (thinking, shell commands, tool calls) to
stdout alongside the final message. Use `-o` or `--json` to extract just the
final output and avoid flooding Claude's context.

### Bounce / exec: use `-o`

```bash
LOG_FILE="/tmp/codex-run.log"
FINAL_FILE="/tmp/codex-final.txt"

codex exec -o "$FINAL_FILE" -c model_reasoning_effort="xhigh" "your prompt" >"$LOG_FILE" 2>&1

# Final message is in $FINAL_FILE — read that, not the log
# Session ID (for resume) is in the log header:
#   session id: 019c4828-c4d1-7622-8d87-3adfe323ac03
```

### Review: use `--json` + extraction

`codex review` has no `-o` flag. Use `codex exec review --json` and extract the
final agent message with jq.

```bash
EVENTS_FILE="/tmp/codex-review-events.jsonl"

codex exec review --json --base main -c model_reasoning_effort="xhigh" >"$EVENTS_FILE" 2>/dev/null

FINAL_REVIEW=$(jq -r 'select(.type=="item.completed" and .item.type=="agent_message") | .item.text' "$EVENTS_FILE" | tail -1)
```

**Fallback**: If extraction returns empty, treat it as an infra error — fall
back to bare `codex review` for that run rather than assuming "no findings."

### Resume: use `-o` with `resume` subcommand

```bash
codex exec -o "$FINAL_FILE" resume "$SESSION_ID" "follow-up prompt" >"$LOG_FILE" 2>&1
```

The `-o` flag goes at the `codex exec` level, before the `resume` subcommand.

## Commands by Workflow

### For /project:review

```bash
# With --json extraction (preferred — clean output)
codex exec review --json --base main -c model_reasoning_effort="xhigh" >"/tmp/codex-review.jsonl" 2>/dev/null

# Fallback if extraction fails
codex review --base main -c model_reasoning_effort="xhigh"
```

Note: `codex review --base` cannot combine with a custom prompt argument.

### For /project:bounce

```bash
# Standard — use -o to capture clean final output
codex exec -o /tmp/codex-final.txt -c model_reasoning_effort="xhigh" "your contextualized question"

# Drop to high for simple clarifications
codex exec -o /tmp/codex-final.txt -c model_reasoning_effort="high" "simple question"

# Resume a prior session
codex exec -o /tmp/codex-final.txt resume "$SESSION_ID" -c model_reasoning_effort="xhigh" "follow-up"
```

## Reasoning Effort

Levels: `minimal | low | medium | high | xhigh`

Default config (`~/.codex/config.toml`):

```toml
model_reasoning_effort = "xhigh"
```

### Code Reviews (`codex review`)

**Always xhigh, never drop.** Code review requires deep analysis for bugs, logic
errors, and security issues. The cost of missing a bug far exceeds the
latency/token cost of thorough reasoning.

### Plan Reviews / Bounce (`codex exec`)

**Default xhigh**, but can drop to high when:

- Simple clarification on an already-agreed point
- Quick verification re-run after a minor fix
- Latency-sensitive iteration where speed matters more than depth

The model self-regulates and won't burn excessive tokens on simple problems.

## Timeout & Long-Running Tasks

Codex does thorough analysis and may take 10-20 minutes for large codebases.
**Run Codex in the background** (`run_in_background: true`) so the user can
continue interacting while it works.

**CRITICAL — Do NOT poll with TaskOutput after launching Codex.** The system
automatically notifies you when the background task completes. Calling
TaskOutput with a long timeout blocks you from processing user messages — the
user sees "Waiting for task" and cannot interact until Codex finishes or the
timeout expires. This is the #1 usability failure with Codex integration.

**Correct pattern:**

1. Launch Codex with `run_in_background: true`
2. Tell the user: "Codex is running in the background. I'll process the results
   when it completes."
3. **Do not call TaskOutput** — wait for the automatic completion notification
4. When notified, read the output file (`$FINAL_FILE` or `$EVENTS_FILE`) and
   continue the workflow

**Never stop a running Codex task prematurely** — partial output does NOT mean
it's done (it streams findings as it works), and killing it loses all analysis.

## Codebase Access

Codex has full read/write access to the workspace when run locally. When
bouncing:

- **Reference file paths directly** - don't paste content inline
- Codex will read the files itself

```bash
# Good - reference the file
codex exec "Review the plan at docs/plans/breakdown.md"

# Bad - pasting content inline (wastes tokens, may truncate)
codex exec "Review this plan: [huge paste...]"
```

## Key Characteristics

- **Stateless by default**: Each call starts fresh, no conversation history
- **Resumable**: `codex exec resume <session_id> "follow-up"` continues a prior
  session. The session ID is printed in the log header (`session id: ...`).
- **Codebase access**: Can read files, grep patterns, verify claims

## Iteration Behavior

Codex goes deep and precise on what it focuses on, but may not surface
everything in a single pass. This applies to both code reviews and plan
validation.

**Why multiple passes help:**

- Codex prioritizes findings—addressing top issues may reveal others it
  deprioritized
- Context changes after fixes can shift what stands out
- A fresh look sometimes catches what was overlooked

If Codex hasn't given a clear "all good, nothing to add", another pass is
usually worth it.

## Prerequisite Check

```bash
which codex && codex --version
```
