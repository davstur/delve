# Claude Code Sandbox

OS-level isolation for filesystem and network access.

## When to Use

**Good fit:**

- Light development without Docker
- Projects not using Supabase/Docker-dependent tools
- Quick scripting on Mac
- When 84% fewer prompts is valuable

**Not sufficient alone:**

- Docker-heavy workflows
- Supabase local development
- When you need `--dangerously-skip-permissions` level autonomy

## How It Works

**Filesystem:**

- Write: Current working directory only
- Read: Entire machine except deny-list
- Blocked: `~/.bashrc`, `/bin/*`, SSH keys, files outside CWD

**Network:**

- Routes through proxy with domain filtering
- New domains prompt for approval
- Blocks exfiltration to unapproved servers

**Implementation:**

- macOS: Seatbelt sandbox (Apple's native sandboxing)
- Linux: bubblewrap

## Configuration

### Standard Setup

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

### High-Security Setup

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "allowUnsandboxedCommands": false,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

### Key Settings

| Setting                    | Effect                                           |
| -------------------------- | ------------------------------------------------ |
| `enabled`                  | Turn sandbox on/off                              |
| `autoAllowBashIfSandboxed` | Skip prompts for sandboxed commands              |
| `allowUnsandboxedCommands` | Allow escape hatch (set false for high security) |
| `excludedCommands`         | Commands that run outside sandbox                |

## Excluded Commands

Commands in `excludedCommands` run **completely outside** the sandbox
(filesystem, network, and system APIs all bypassed).

**The `:*` suffix is mandatory.** Bare `"docker"` only matches the literal
command with no arguments. `"docker:*"` matches `docker build ...`, etc. See
[anthropics/claude-code#10524](https://github.com/anthropics/claude-code/issues/10524).

When matched, the entire Bash tool call runs unsandboxed — all commands in that
call inherit the bypass.

Common exclusions:

- `docker:*` - needs socket access
- `docker-compose:*` - needs socket access
- `supabase:*` - uses Docker internally
- `codex:*` - needs macOS system APIs (SCDynamicStore)

## `enableWeakerNetworkIsolation`

Lighter alternative to `excludedCommands` for tools that only need network
access. Allows `com.apple.trustd.agent` Mach IPC so Go-based CLIs (`gh`,
`terraform`, `gcloud`) can verify TLS certificates.

Use this instead of `excludedCommands` when:

- The tool only needs network access (not filesystem or system APIs)
- You want to keep filesystem restrictions active
- Example: `gh` and `git push` work with this setting alone

## Limitations

1. **Docker incompatible** - blocks socket access
2. **Network filtering is domain-level** - can't filter by path
3. **Escape hatch exists** - disable with `allowUnsandboxedCommands: false`
4. **URL patterns weak** - use WebFetch for network filtering

## Prompt Reduction

Anthropic's internal testing: **84% fewer permission prompts** with sandbox +
auto-allow.

## Combining with Allow/Deny Lists

Sandbox and permissions work together:

- Sandbox provides OS-level enforcement
- Allow/deny provides policy layer on top
- Both are checked - command must pass both

For pattern syntax, see the **permissions skill**.
