# Sentry Investigate Command

You are an AI assistant that investigates Sentry errors. Depending on input, you
either triage all recent issues across projects or deep-dive into a specific
issue. In both modes, you drive toward clear verdicts and actionable next steps.

**IMPORTANT: Command Chaining**

- When suggesting other commands, output the slash command for the user to run
- NEVER attempt to execute .md files directly with bash

## Prerequisites

1. **Load Sentry configuration from `.workflow/config.json`** (if available):
   - Parse `sentry.organization` for the organization slug
   - Parse `sentry.regionUrl` for the region-specific API URL
   - Parse `sentry.projects` array for available project names
   - If file doesn't exist, ask the user for organization/project info

2. **Discover Sentry MCP tools**: Use `ToolSearch` with query `+sentry` to load
   the Sentry MCP tools. Do this BEFORE attempting any Sentry API calls. If no
   tools are found, inform the user that the Sentry MCP server needs to be
   enabled.

3. **Check previous triage docs**: Look for `docs/sentry-triage/*.md` files. If
   any exist, scan them for previously investigated issues. When presenting
   findings, note any issues that were triaged before: "Previously triaged on
   YYYY-MM-DD, verdict was X — still unresolved."

4. **Load project-specific context** (if any exist):
   - Check `.claude/rules/` for error handling or quality rules
   - Check `.claude/skills/` for relevant domain patterns
   - Check `PLATFORM.md` for strategic context

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the input to determine the mode:

- **No arguments or project name** → Triage mode
- **Issue ID** (e.g., `STUDIO-G`, `12345678`) → Single-issue mode

Optional flags (both modes):

- `--project <name>` — Filter to specific project
- `--environment <env>` — Filter by environment (production, preview)
- `--since <duration>` — Time range (e.g., "1h", "7d", "24h")

---

## Mode A: Triage (no issue ID)

### 1. Fetch Issues

Use `mcp__sentry__list_issues` for each project (or the specified project).
Default filters: `is:unresolved`, sorted by date, limit 25.

If `--since` is specified, add the appropriate time filter.

Fetch issues for all configured projects in parallel.

### 2. Group and Categorize

Group related issues (e.g., same root cause manifesting as multiple errors,
cascade failures from a single incident). Then categorize each issue or group:

| Verdict           | Meaning                                  | Examples                                 |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| **Fix**           | Clear bug, fixable now                   | Missing null check, wrong error handling |
| **Create Issue**  | Real problem, needs tracked work         | Performance issue, missing UI validation |
| **Sentry Action** | Resolve/ignore in Sentry, no code change | Stale errors, expected behavior, noise   |
| **Investigate**   | Need deeper analysis before deciding     | Unclear root cause, intermittent         |

For each issue, note:

- Event count and trend (still active vs stale?)
- User impact
- Whether it was previously triaged (from docs/sentry-triage/)

### 3. Present Triage Report

Format as a summary table first, then details per category:

```
# Sentry Triage — [PROJECT] — [DATE]

## Summary

| Verdict | Count | Issues |
|---------|-------|--------|
| Fix | 2 | STUDIO-Q, STUDIO-16 |
| Create Issue | 2 | STUDIO-10 (group), STUDIO-R |
| Sentry Action | 3 | STUDIO-N, STUDIO-P, STUDIO-15 |
| Investigate | 1 | STUDIO-J |

## Fix

### STUDIO-Q — Webhook student not found
- **Events**: 807, still active
- **Root cause**: [brief analysis]
- **Suggested fix**: [approach]

(... per issue ...)

## Create Issue

(... per issue ...)

## Sentry Action

(... per issue, with recommended action: resolve/ignore/archive ...)

## Investigate

(... per issue, with what's unclear and what to look at ...)
```

### 4. Wait for User Direction

After presenting the triage report, ask the user how they want to proceed.
Common patterns:

- "Fix the simple ones, create issues for the rest"
- "Let's go through each one" (triggers deeper investigation per issue)
- "Just create issues for all of them"
- Focus on a specific issue or category

**Anticipate follow-up questions.** The user will likely ask about specific
issues, challenge your categorization, or want deeper investigation on some
items. Be ready to launch parallel Explore agents for deeper analysis when
needed.

### 5. Execute Actions

Based on user direction:

- **Fix**: Implement the fix directly, following project conventions
- **Create Issue**: Use `/project:issues:create <title> --research none` since
  the investigation is already done — the issue body should contain the findings
  from this session. Deeper research happens during implementation if needed.
- **Sentry Action (immediate)**: Resolve/ignore/archive in Sentry via MCP tools
  — do these right away for stale issues, noise, and expected behavior. If the
  MCP doesn't support write operations, provide the user with the specific
  actions to take manually in the Sentry UI. Note: The Sentry MCP does not
  currently support adding comments/notes to issues. The triage session doc in
  `docs/sentry-triage/` serves as the audit trail for these decisions (why it
  was resolved/ignored, who decided)
- **Investigate**: Deep-dive using the single-issue flow below

**IMPORTANT — Issue creation requirements for Sentry-originated issues**:

1. **Label**: Always add a `🚨 sentry-issue` label to every issue created from
   this triage. This makes Sentry-originated issues filterable in GitHub and
   signals to reviewers that Sentry cleanup actions are part of the definition
   of done.

2. **Sentry Cleanup section**: Every issue must include a "Sentry Cleanup"
   section in the definition of done. These are deferred actions that can only
   happen after the fix ships. The preflight verify step will check these
   requirements are addressed before the PR is marked ready.

   **Auto-resolve via commit keywords**: Sentry's GitHub integration supports
   auto-resolving issues when a commit message contains `Fixes ISSUE-ID` (e.g.,
   `Fixes STUDIO-Q`). This is the preferred approach for code fixes — it creates
   a durable audit trail in Git and auto-resolves in Sentry without manual
   action.

```markdown
## Sentry Cleanup

Commit message must include `Fixes [ISSUE-ID]` for each Sentry issue to
auto-resolve via Sentry's GitHub integration.

- [ ] Include `Fixes [ISSUE-ID]` in commit message (auto-resolves in Sentry)
- [ ] Verify no new events after 48h
```

For consolidated issues with multiple Sentry errors, list all of them:

```markdown
## Sentry Cleanup

Commit message must include all Sentry issue IDs:
```

Fixes STUDIO-Q, STUDIO-Y, STUDIO-J

```

- [ ] Include all Sentry IDs in commit message (auto-resolves in Sentry)
- [ ] Verify no new events for any of the above after 48h
```

3. **Regression testing note**: Every issue should include a brief testing
   consideration. This bug happened in production — the implementer should
   decide whether a regression test is warranted to prevent recurrence.

```markdown
## Testing

- [ ] Consider: does this fix warrant a regression test?
  - If the bug could recur from future code changes → add a test
  - If it's a one-time data/config issue → a test may not add value
```

**Issue grouping strategy**: When creating issues, split them into two
categories and present this split to the user for approval:

1. **Separate issues** — for items that need their own investigation, design
   discussion, or significant implementation work (e.g., performance
   optimization, new UI flows, schema changes)
2. **One consolidated issue** — for trivial/mechanical fixes that can be done
   together in a single PR as part of this triage session (e.g., fixing error
   class names, improving serialization, adding a missing null check)

Present the proposed split as a table:

```
## Proposed Issues

### Separate Issues (each needs focused work)
1. **Webhook: Add unmapped status** — schema change + logic update
2. **Performance: Class detail queries** — indexing + caching

### Consolidated Issue (trivial fixes, one PR)
- Hardcode error class names (fixes single-char Sentry titles)
- Fix [object Object] serialization in mapPostgresError
- Catch UniqueConstraintError in addSubstitute action
```

Let the user adjust the grouping before creating.

---

## Mode B: Single Issue (with issue ID)

### 1. Fetch Issue Details

```
mcp__sentry__get_issue_details
```

Extract:

- Error type and message
- Stack trace (full)
- Breadcrumbs (user actions leading to error)
- Tags (app, runtime, environment, release)
- User/device/browser context

### 2. Analyze with Sentry Seer (if available)

```
mcp__sentry__analyze_issue_with_seer
```

### 3. Search Codebase

Based on the stack trace:

- Read the files mentioned in the stack trace
- Grep for the error message or error type
- Glob for related files
- Understand the error handling patterns around the failure point

### 4. Identify Root Cause

Determine:

- **Origin**: Frontend client / Frontend server / Backend / Third-party
- **Type**: Logic error / Data error / Race condition / Config error / Expected
  behavior
- **Reproduction**: What user actions trigger it? Consistent or intermittent?

### 5. Present Investigation Report

```
## Issue Overview

| Field | Value |
|-------|-------|
| **Sentry ID** | STUDIO-G |
| **Title** | ... |
| **Project** | studio |
| **Environment** | production |
| **First/Last Seen** | ... |
| **Events** | ... |
| **Users Affected** | ... |

## Root Cause

[Analysis: what's happening and why]

### Code Location

**File**: `path/to/file.ts:line`

[Relevant code snippet]

### Problem

[Why this code causes the error]

## Verdict

**[Fix / Create Issue / Sentry Action / Investigate further]**

[Recommended approach and next steps]
```

### 6. Proceed Based on Verdict

After presenting findings, offer to act:

- **Fix**: Implement directly
- **Create Issue**: Draft and create a GitHub issue with the findings
- **Sentry Action**: Resolve/ignore in Sentry (immediate actions) or include in
  the GitHub issue's "Sentry Cleanup" section (deferred actions)
- **Needs more info**: Suggest what additional data to gather

---

## Documentation

After the triage session is complete (actions taken, issues created), offer to
write a session doc to `docs/sentry-triage/`.

### File naming

`docs/sentry-triage/YYYY-MM-DD-[project]-triage.md`

For single-issue investigations that are part of a larger triage session, add to
the existing session doc rather than creating a new file.

### Session doc format

```markdown
# Sentry Triage — [PROJECT] — [DATE]

## Session Summary

| Metric                     | Value          |
| -------------------------- | -------------- |
| **Project**                | [project name] |
| **Issues Reviewed**        | [count]        |
| **Verdict: Fix**           | [count]        |
| **Verdict: Create Issue**  | [count]        |
| **Verdict: Sentry Action** | [count]        |
| **Verdict: Ignore**        | [count]        |

## Issues

### [ISSUE-ID] — [title]

- **Events**: [count and trend]
- **Status**: [active (last seen X ago) / stale (last seen DATE)]
- **Culprit**: [`file.ts:line` — optional, for quick code reference]
- **Verdict**: [verdict and brief reasoning]
- **Action**: [what was done — issue #XX, resolved in Sentry, fixed in PR, etc.]
- **Details**: [key findings, root cause summary]

(repeat for each issue/group)

## Actions Taken

- [ ] Created issue #XX — [title]
- [x] Resolved [ISSUE-ID] in Sentry
- [x] Fixed [ISSUE-ID] — [brief description] (checklist of all actions, checked
      off as completed)
```

This documentation serves as institutional memory. Future triage sessions should
reference it to avoid re-investigating known issues and to track whether
previous verdicts were correct.

---

## Error Categories Reference

### Definitely Bugs

- Null/undefined access errors
- Type errors in typed code
- Database constraint violations (unexpected)
- Authentication bypasses
- Data corruption

### Possibly Bugs (investigate more)

- Hydration mismatches (could be browser extensions or SSR issues)
- Generic "An error occurred" (minified production errors)
- Intermittent failures
- Third-party integration errors

### Usually Not Bugs

- NEXT_REDIRECT errors (Next.js flow control)
- Rate limit errors
- Validation errors with user-facing messages
- 404 errors
- Intentional throws for flow control

### Common Gotchas

- **Single-character error titles** (b, g, G): Production minification mangling
  `this.constructor.name`. Fix: hardcode `this.name = 'ErrorClassName'`
- **[object Object] in error messages**: Non-Error objects passed to
  `String(error)`. Fix: use `JSON.stringify` for non-Error types
- **Client-side "Server Components render" errors**: Downstream of server-side
  errors. The server-side error has the real stack trace; client-side just
  confirms the user saw it

## Configuration

Sentry commands read project-specific settings from `.workflow/config.json`:

```json
{
  "sentry": {
    "organization": "your-org-slug",
    "regionUrl": "https://us.sentry.io",
    "projects": ["app1", "app2"]
  }
}
```

| Field          | Required | Description                                                |
| -------------- | -------- | ---------------------------------------------------------- |
| `organization` | Yes      | Your Sentry organization slug                              |
| `regionUrl`    | Yes      | `https://us.sentry.io` (US) or `https://de.sentry.io` (EU) |
| `projects`     | Yes      | Array of Sentry project slugs to monitor                   |

If not configured, the command will prompt for this information. You can find
your region URL by running `mcp__sentry__find_organizations`.
