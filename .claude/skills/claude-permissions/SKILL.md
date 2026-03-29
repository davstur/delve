---
name: project:claude-permissions
description:
  This skill should be used when the user asks to "audit permissions", "review
  settings.json", "clean up allow patterns", "suggest permissions for my
  project", "what does this permission match", "should I allow or deny this", or
  mentions sandbox mode, allow lists, deny lists, permission patterns, or
  .claude/settings.json configuration. Provides guidance for managing Claude
  Code sandbox and permissions.
---

# Manage Claude Permissions

Audit, clean up, and extend Claude Code permissions configuration.

## Quick Reference

**Precedence:** Deny > Ask > Allow

**Pattern format:** `Tool(prefix:*)` - wildcard only at END

**Key gotcha:** `/path` is relative to settings file, use `//path` for absolute

For full syntax details, see [references/syntax.md](references/syntax.md).

## Tasks

### Audit Current Settings

1. Read `.claude/settings.json` and `.claude/settings.local.json`
2. Check for issues:
   - **Overly-specific patterns** - should be generalized (e.g.,
     `git worktree add ../issue-123` → `git worktree:*`)
   - **Syntax errors** - space instead of colon, missing `//` for absolute paths
   - **Missing seatbelts** - no deny for `sudo:*` or `rm -rf`
   - **Weak patterns** - URL-based Bash patterns (use WebFetch instead)
   - **Redundant entries** - covered by broader patterns
3. Report findings with specific fixes

### Clean Up Patterns

Identify patterns to generalize:

| Overly-specific                       | Generalized            |
| ------------------------------------- | ---------------------- |
| `Bash(git worktree add ../issue-123)` | `Bash(git worktree:*)` |
| `Bash(npm run test:unit)`             | `Bash(npm run test:*)` |
| `Bash(pnpm install lodash)`           | `Bash(pnpm:*)`         |

**Rule:** If multiple similar patterns exist, consolidate to prefix pattern.

### Suggest for Stack

Detect project stack from:

- `package.json` → Node.js, detect pnpm/yarn/npm
- `Cargo.toml` → Rust
- `pyproject.toml` / `requirements.txt` → Python
- `go.mod` → Go
- `supabase/config.toml` → Supabase
- `Dockerfile` → Docker

Then recommend from [references/baseline.md](references/baseline.md).

### Explain Pattern

When asked "what does X match?", explain:

1. The pattern syntax being used
2. Concrete examples of commands that would/wouldn't match
3. Any bypass vectors if relevant

### Deny vs Prompt Decision

Apply this framework:

**Deny if ALL true:**

- Irreversible (can't undo)
- Never legitimate in this project
- High blast radius (system-level)
- Fast damage (before you'd notice)

**Just prompt if ANY true:**

- Sometimes you'd approve
- Legitimate use cases exist
- Damage is recoverable
- Low urgency

See [references/baseline.md](references/baseline.md) for common decisions.

## Sandbox Configuration

Standard setup:

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "enableWeakerNetworkIsolation": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

### `excludedCommands` (requires `:*` suffix)

Runs the entire Bash call outside the sandbox (filesystem + network + system
APIs). **The `:*` suffix is mandatory** — bare `"docker"` only matches the
literal command with no arguments. `"docker:*"` matches `docker build ...`,
`docker compose ...`, etc.

Docker/Supabase need socket access — exclude from sandbox, don't allow-list
(unless in VM). Tools like `codex` that need macOS system APIs
(SCDynamicStore) also need exclusion.

### `enableWeakerNetworkIsolation`

Lighter fix for Go-based CLIs (`gh`, `terraform`, `gcloud`) that fail with TLS
certificate errors. Allows `com.apple.trustd.agent` Mach IPC without fully
unsandboxing. Prefer this over `excludedCommands` when only network access is
needed.

### Pre-commit hook guard

Never stage `.claude/settings.json` alongside other files. lint-staged reverts
staged files after hooks — the sandbox blocks writes to settings.json, causing
working tree corruption. Add a guard to `.husky/pre-commit`.

## Resources

- [references/syntax.md](references/syntax.md) - Complete pattern syntax,
  wildcards, gotchas
- [references/baseline.md](references/baseline.md) - Recommended allow/deny by
  stack
