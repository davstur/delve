# Claude Code Permissions Guide

Portable reference for configuring sandbox and allow/deny lists. Drop this file
and `settings.json` into any project's `.claude/` directory.

## Quick Start

1. Copy `settings.json` to your project's `.claude/settings.json`
2. Customize the allow/deny lists for your stack
3. Run `/sandbox` in Claude Code to verify it's enabled

## How It Works

```
┌─────────────────────────────────────────────────┐
│  Sandbox / VM (actual safety boundary)          │
│  ┌───────────────────────────────────────────┐  │
│  │  Deny List (block dangerous commands)     │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Allow List (skip prompts for       │  │  │
│  │  │  trusted commands)                  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Precedence:** Deny > Ask > Allow

- Denied commands are blocked even if also in allow list
- Allowed commands skip permission prompts
- Everything else prompts for approval ("ask")

## Pattern Syntax

| Pattern          | Meaning          | Example                                                |
| ---------------- | ---------------- | ------------------------------------------------------ |
| `Tool`           | Any use of tool  | `Read` allows all reads                                |
| `Tool(exact)`    | Exact match only | `Bash(npm test)`                                       |
| `Tool(prefix:*)` | Prefix match     | `Bash(git:*)` matches `git status`, `git commit`, etc. |

### File Path Patterns (for Read/Edit/Write)

| Pattern  | Meaning                   | Example             |
| -------- | ------------------------- | ------------------- |
| `//path` | Absolute path             | `Read(//etc/hosts)` |
| `/path`  | Relative to settings file | `Edit(/src/**)`     |
| `~/path` | Relative to home          | `Read(~/.zshrc)`    |
| `path`   | Relative to CWD           | `Read(*.env)`       |

**Gotcha:** `/Users/alice/file` is NOT absolute - use `//Users/alice/file`!

### Wildcard Rules

The `:*` wildcard **only works at the END** (prefix matching):

```json
"Bash(git:*)"          // ✓ Matches: git, git status, git commit -m "msg"
"Bash(npm run test:*)" // ✓ Matches: npm run test, npm run test:unit
"Bash(*git*)"          // ✗ Invalid - wildcards only at end
```

### Shell Awareness

Claude Code understands shell operators, so:

```json
"Bash(echo:*)" // Will NOT match: echo foo && rm -rf /
```

This is a security feature preventing command chaining bypasses.

## Recommended Baseline

### Allow List (convenience)

```json
{
  "permissions": {
    "allow": [
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(find:*)",
      "Bash(tree:*)",
      "Bash(pwd)",
      "Bash(which:*)",
      "Bash(git:*)",
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Bash(npm install:*)",
      "Bash(pnpm:*)",
      "Bash(yarn:*)",
      "Bash(make:*)",
      "Bash(tsc:*)",
      "Bash(npx:*)",
      "Read",
      "Edit",
      "Write"
    ]
  }
}
```

### Deny List (seatbelts)

```json
{
  "permissions": {
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm -rf /*)",
      "Bash(rm -rf ~/*)",
      "Bash(chmod:*)",
      "Bash(chown:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)"
    ]
  }
}
```

### Stack-Specific Additions

```json
// Python
"Bash(pytest:*)", "Bash(pip:*)", "Bash(python:*)"

// Rust
"Bash(cargo:*)", "Bash(rustc:*)"

// Go
"Bash(go:*)"

// Docker (if in isolated VM)
"Bash(docker:*)", "Bash(docker-compose:*)"
```

## Sandbox Configuration

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "allowUnsandboxedCommands": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

| Setting                    | What it does                                                 |
| -------------------------- | ------------------------------------------------------------ |
| `enabled`                  | Turn sandbox on/off                                          |
| `autoAllowBashIfSandboxed` | Skip prompts for commands that run inside sandbox            |
| `allowUnsandboxedCommands` | Allow escape hatch for commands that can't be sandboxed      |
| `excludedCommands`         | Commands that run outside sandbox (need Docker socket, etc.) |

### High-Security Mode

Disable the escape hatch entirely:

```json
{
  "sandbox": {
    "allowUnsandboxedCommands": false
  }
}
```

With this setting, `dangerouslyDisableSandbox` is completely ignored.

## Common Patterns

### Handle variable arguments (worktrees, branches, etc.)

Use coarse patterns instead of enumerating every variant:

```json
// ✓ Good - handles any worktree/branch name
"Bash(git worktree:*)"
"Bash(git checkout:*)"

// ✗ Bad - brittle, incomplete
"Bash(git worktree add ../issue-123)"
"Bash(git worktree add ../issue-456)"
```

### URL filtering

Avoid URL-based Bash patterns - easily bypassed:

```json
// ✗ Bad - many bypass vectors
"Bash(curl http://github.com/:*)"

// ✓ Good - use WebFetch instead
"WebFetch(domain:github.com)"
```

### MCP tools

```json
"mcp__puppeteer__*"     // All tools from puppeteer server
"mcp__github__*"        // All GitHub tools
"mcp__postgres"         // Specific tool
```

## File Locations

| File                          | Scope                 | Use for                            |
| ----------------------------- | --------------------- | ---------------------------------- |
| `~/.claude/settings.json`     | Global (all projects) | Conservative baseline              |
| `.claude/settings.json`       | Project               | Stack-specific rules               |
| `.claude/settings.local.json` | Personal              | Your overrides (gitignore if team) |

Settings merge with more specific files taking precedence.

## References

- [Claude Code Settings Docs](https://code.claude.com/docs/en/settings)
- [Claude Code IAM Docs](https://code.claude.com/docs/en/iam)
- [Claude Code Sandboxing Docs](https://code.claude.com/docs/en/sandboxing)
