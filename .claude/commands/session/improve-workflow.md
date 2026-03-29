# Workflow Improvement Analysis

Something didn't work as expected in our workflow. Analyze what happened and
produce a structured improvement proposal that can be taken back to the workflow
repo.

## Input

$ARGUMENTS

## Analysis Steps

Review our recent conversation and the input above, then work through:

1. **What happened** — Describe the observed behavior vs expected behavior in
   1-2 sentences. Be specific.

2. **Root cause** — Why did this happen? Trace it to the specific point of
   failure. Common categories:
   - Command template gap (missing step, unclear instruction)
   - Hook not triggering or misconfigured
   - Rule/skill not loaded or outdated
   - Agent not following existing guidance
   - Status/state tracking drift
   - Missing automation (no command/hook exists for this)

3. **Where the gap lives** — Identify the specific file(s) or mechanism that
   should have prevented this. Reference actual paths where possible (e.g.
   `src/commands/...`, `.claude/settings.json`, `.claude/rules/...`,
   `.claude/skills/...`). If nothing exists yet, say so.

4. **Suggested fix** — Concrete, actionable change(s). For each, specify:
   - What to change (new command, hook modification, knowledge addition, etc.)
   - Where (file path or component)
   - Brief description of the change

5. **Prevention pattern** — Is this a one-off, or a class of issues? If it's a
   pattern, what general principle or check would catch similar problems in the
   future?

## Output Format

Present the analysis as a single, copy-pasteable block using this template:

```markdown
## Workflow Improvement: [short title]

**Symptom**: [what went wrong, 1-2 sentences]

**Root cause**: [why it happened]

- Category: [command gap | hook issue | knowledge gap | agent behavior | state
  drift | missing automation]
- Trace: [specific point of failure]

**Affected files**:

- `path/to/relevant/file` — [what's wrong or missing here]

**Suggested fix**:

1. [Concrete change with file path and description]

**Prevention**: [General principle or check for similar issues]

**Priority**: [low | medium | high] — [one-line justification]
```

Keep it focused. The goal is a clear, actionable report — not an essay. If
multiple independent issues contributed, list them as separate fixes under
"Suggested fix" but keep the single root cause analysis.
