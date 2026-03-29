# Create Container Development Environment

Creates an isolated containerized development environment for working on a
specific issue or feature. Uses the **devcontainer.json standard** for IDE
compatibility with WebStorm, VS Code, Cursor, and GitHub Codespaces.

Each environment gets:

- Dedicated Docker network
- Isolated Supabase local stack (optional)
- Generated `devcontainer.json` for IDE integration
- Unique port block to avoid conflicts

## Prerequisites

1. Docker installed and running on the host machine
2. GitHub CLI (`gh`) authenticated
3. WebStorm, VS Code, or Cursor with Dev Containers support

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments:

- `--issue <number>` - GitHub issue number (required unless --branch)
- `--branch <name>` - Custom branch name (alternative to --issue)
- `--repo <url>` - Repository URL (default: current directory's remote)
- `--base <branch>` - Base branch to clone from (default: main)
- `--no-supabase` - Skip Supabase entirely (no stack, no env config)
- `--shared-supabase` - Use host's shared Supabase instance (default ports
  54321/54322)

Examples:

```
/session:container:create --issue 123
/session:container:create --issue 123 --repo github.com/org/project
/session:container:create --branch feature/experiment --no-supabase
/session:container:create --issue 456 --base develop
```

## Execution

**Execute this single command to create the container environment.**

**🚨 IF IN SANDBOX MODE: This script writes to paths outside this repo
(`~/Development/*-containers/`, Docker networks/volumes). Must run with
`dangerouslyDisableSandbox: true`.**

```bash
bash ".claude/commands/scripts/container-create.sh" "$ARGUMENTS"
```

## How It Works

This command executes a **single script** that sets up the infrastructure and
generates the devcontainer.json configuration. Your IDE then creates the actual
dev container using that configuration.

### Supabase Modes

| Flag                | Mode     | What happens                              |
| ------------------- | -------- | ----------------------------------------- |
| (default)           | Isolated | Full Supabase stack per container via CLI |
| `--shared-supabase` | Shared   | Uses host's `supabase start` instance     |
| `--no-supabase`     | Disabled | No Supabase setup                         |

### Architecture (Isolated Mode - Default)

```
┌─────────────────────────────────────────────────────────────┐
│  HOST                                                        │
│                                                              │
│  supabase start (in container's project dir)                │
│  └─ ~10 containers on unique ports (54301-54309, etc.)      │
│       ▲                                                      │
│       │ host.docker.internal                                 │
│  ┌────┴───────────────────────────────────────────────┐     │
│  │  Dev Container (created by IDE)                     │     │
│  │  - Connects to Supabase via host.docker.internal   │     │
│  │  - .env files auto-configured with correct URLs    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture (Shared Mode)

```
┌─────────────────────────────────────────────────────────────┐
│  HOST                                                        │
│                                                              │
│  supabase start (one instance, default ports 54321-54329)   │
│       ▲           ▲           ▲                              │
│       │           │           │                              │
│  ┌────┴───┐  ┌────┴───┐  ┌────┴───┐                         │
│  │issue-1 │  │issue-2 │  │issue-3 │  (all share DB)         │
│  └────────┘  └────────┘  └────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Notes

- **Single-script execution** - One permission prompt
- **Isolated mode** uses Supabase CLI with modified ports per container
- **Shared mode** requires `supabase start` running on host first
- Uses **devcontainer.json standard** for IDE compatibility
- Dev container connects via `host.docker.internal`
- `.env` files are auto-updated with correct Supabase URLs
- GitHub token passed via `containerEnv` for authenticated git operations
- Claude Code auth via `CLAUDE_CODE_OAUTH_TOKEN` (from `~/.claude-token`)
