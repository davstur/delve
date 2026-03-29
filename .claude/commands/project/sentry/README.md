# Sentry Commands

AI-assisted investigation and triage of Sentry errors.

## Prerequisites

1. **Enable Sentry MCP**: The Sentry MCP server must be enabled in
   `.claude/settings.local.json`:

   ```json
   "enabledMcpjsonServers": ["sentry", ...]
   ```

   Or remove it from `disabledMcpjsonServers`.

2. **Authenticate**: The Sentry MCP uses OAuth. On first use, you'll be prompted
   to authenticate via browser.

## Usage

### `/project:sentry:investigate`

One command, two modes:

```
# Triage mode — list and analyze all recent issues
/project:sentry:investigate
/project:sentry:investigate --project studio
/project:sentry:investigate --since "7d"

# Single-issue mode — deep-dive into a specific error
/project:sentry:investigate STUDIO-16
/project:sentry:investigate 12345678
```

**Triage mode** (no issue ID):

- Lists all unresolved issues across configured projects
- Groups related errors (e.g., cascade failures from one incident)
- Categorizes each: Fix / Create Issue / Sentry Action / Investigate
- Proposes issue grouping: separate issues for substantial work, one
  consolidated issue for trivial fixes
- Checks `docs/sentry-triage/` for previously triaged issues
- After actions are taken, writes a session doc for institutional memory

**Single-issue mode** (with issue ID):

- Fetches full error details, stack traces, breadcrumbs
- Searches codebase for related code
- Uses Sentry Seer AI analysis when available
- Identifies root cause and suggests fix approach
- Offers to fix directly, create an issue, or take Sentry action

### Typical Workflow

```
# Periodic triage (weekly, after deployments, etc.)
/project:sentry:investigate

# → Review the report, discuss with AI
# → Fix trivial items, create issues for the rest
# → Session doc is written to docs/sentry-triage/

# Later, investigating a specific error
/project:sentry:investigate STUDIO-42

# → AI checks previous triage docs for context
# → Deep analysis, then fix or create issue
```

## Triage Documentation

Session docs are stored in `docs/sentry-triage/` with the naming convention
`YYYY-MM-DD-[project]-triage.md`. These serve as institutional memory — future
triage sessions reference them to avoid re-investigating known issues and to
track whether previous verdicts were correct.

## GitHub Integration

For the full workflow to work, install Sentry's GitHub App (Sentry → Settings →
Integrations → GitHub) and add your repository.

This enables:

- **Auto-resolve via commit keywords**: `Fixes STUDIO-X` in a commit message
  automatically resolves the Sentry issue
- **Audit trail in Sentry**: Each resolved issue shows the commit, PR, and
  release that fixed it
- **Status sync**: Closing a GitHub issue resolves the linked Sentry issue

The investigate command creates GitHub issues with `Fixes STUDIO-X` in the
Sentry Cleanup section, so this happens automatically when the fix is committed.

Without the GitHub app, `Fixes STUDIO-X` has no effect and Sentry issues must be
resolved manually.

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

| Field          | Required | Description                                      |
| -------------- | -------- | ------------------------------------------------ |
| `organization` | Yes      | Your Sentry organization slug                    |
| `regionUrl`    | Yes      | `https://us.sentry.io` or `https://de.sentry.io` |
| `projects`     | Yes      | Array of Sentry project slugs to monitor         |

If not configured, the command will prompt for this information.

## See Also

- Workflow configuration: `.workflow/config.json`
- MCP configuration: `.mcp.json`
