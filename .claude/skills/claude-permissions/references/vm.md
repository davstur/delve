# VM-Based Isolation

Use a Linux VM as the primary safety boundary for agentic development.

## When to Use

**Good fit:**

- Docker-heavy workflows (Supabase, containers)
- Want `--dangerously-skip-permissions` level autonomy
- Need full isolation from host machine
- Parallel work on multiple issues (worktrees)

**Overkill for:**

- Light scripting
- Projects without Docker dependencies
- When sandbox provides enough isolation

## Core Concept

> **macOS is the UI. Linux VM is the machine.**

- VM is the **blast radius** for all agent activity
- macOS becomes a thin client (IDE, browser)
- All risky automation happens inside the VM
- Agents can destroy VM contents but can't escape to host

## Recommended Setup

**VM Software:** UTM (free, uses Apple Virtualization or QEMU)

**VM Specs:**

- RAM: 16GB+ (32GB recommended for multiple Supabase stacks)
- CPU: 6+ cores
- Disk: 100GB (Docker images add up)
- OS: Ubuntu Server 24.04 ARM64

**Note:** Use QEMU emulation on macOS Sequoia (Apple Virtualization has
networking bugs).

## Inside the VM

Install:

- Docker (via get.docker.com)
- Node.js (via nvm)
- pnpm, yarn
- Supabase CLI (direct download)
- GitHub CLI
- Claude Code

Create alias:

```bash
alias cc="claude --dangerously-skip-permissions"
```

This is **safe inside VM** because the VM is the isolation boundary.

## IDE Workflow

**WebStorm/VS Code Remote Development:**

1. Connect via SSH to VM
2. Open project folder inside VM
3. Files live in VM, edits feel local

**Port Forwarding:**

- Access VM services from Mac browser
- `http://dev-vm:3000` → app
- `http://dev-vm:54323` → Supabase Studio

## Per-Issue Isolation (Worktrees)

Inside the VM, use git worktrees for parallel work:

```bash
# Create worktree with isolated Supabase
/project:worktree:create issue-123 --supabase-start

# Each worktree gets unique Supabase ports
# issue-123 → ports 54331-54339
# issue-456 → ports 54341-54349
```

**Why worktrees, not VMs per issue:**

- Worktrees are lightweight
- VM handles safety already
- Full Supabase CLI access in each worktree

## Recovery Strategy

1. **Git reset** - most issues
2. **VM clone rollback** - risky experiments
3. **Full VM rebuild** - rare, ~30 min via bootstrap script

## Combining with Sandbox

**Recommended:** Enable sandbox inside VM too (defense-in-depth)

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

This gives:

- VM as hard boundary
- Sandbox for additional OS-level restrictions
- Docker/Supabase excluded but contained by VM

## Setup Guide

See `tooling/vm/README.md` for:

- Step-by-step VM creation
- Bootstrap script
- Port exposure configuration
- Troubleshooting
