# Decision Framework

Choosing the right isolation approach for your workflow.

## Quick Decision Tree

```
Do you use Docker/Supabase locally?
├── No → Sandbox Only (simplest)
└── Yes
    ├── Okay with prompts for Docker commands? → Sandbox (exclude Docker)
    └── Want full autonomy?
        └── VM + Sandbox (recommended for Docker workflows)
```

## Comparison Matrix

| Aspect                 | Sandbox Only  | VM Only                 | Sandbox + VM |
| ---------------------- | ------------- | ----------------------- | ------------ |
| **Setup time**         | 5 min         | 45 min                  | 50 min       |
| **Docker support**     | No (excluded) | Yes                     | Yes          |
| **Supabase CLI**       | Prompts       | Full                    | Full         |
| **Permission prompts** | ~84% fewer    | Zero (skip-permissions) | ~84% fewer   |
| **Blast radius**       | CWD + network | Entire VM               | Entire VM    |
| **Recovery**           | Git reset     | Git/VM clone            | Git/VM clone |
| **Host safety**        | High          | Highest                 | Highest      |

## Approach Details

### Sandbox Only

**Best for:** Light development, no Docker dependencies

**Setup:**

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

**Trade-off:** Docker commands prompt or fail. MCP tools can partially
compensate.

### VM Only

**Best for:** Maximum autonomy, don't want any prompts

**Setup:**

1. Create Ubuntu VM in UTM
2. Install Docker, Node, Claude Code
3. Use `claude --dangerously-skip-permissions`

**Trade-off:** More setup, but zero friction once running.

### Sandbox + VM (Recommended for Docker workflows)

**Best for:** Docker-heavy work with defense-in-depth

**Setup:**

1. Create VM (same as VM Only)
2. Enable sandbox inside VM
3. Exclude Docker from sandbox

**Benefits:**

- VM contains all damage
- Sandbox adds OS-level restrictions for non-Docker commands
- Best of both approaches

## By Workflow Type

| Workflow                            | Recommended Approach       |
| ----------------------------------- | -------------------------- |
| Quick script on Mac                 | Sandbox only               |
| Next.js without Supabase            | Sandbox only               |
| Supabase project, okay with prompts | Sandbox (exclude supabase) |
| Supabase project, want autonomy     | VM + Sandbox               |
| Multiple parallel issues            | VM + Sandbox + Worktrees   |
| Experimental/risky automation       | VM only (skip-permissions) |

## Risk Assessment

| Risk                         | Sandbox         | VM              | Sandbox + VM                |
| ---------------------------- | --------------- | --------------- | --------------------------- |
| File destruction outside CWD | Blocked         | Contained to VM | Blocked + Contained         |
| Data exfiltration            | Domain-filtered | Contained to VM | Domain-filtered + Contained |
| System compromise            | Blocked         | Contained to VM | Blocked + Contained         |
| Docker abuse                 | N/A (excluded)  | Contained to VM | Contained to VM             |

## Migration Path

**Start simple, add isolation as needed:**

1. **Start:** Sandbox only (5 min setup)
2. **If Docker prompts annoy you:** Exclude Docker, use MCP tools
3. **If that's not enough:** Set up VM
4. **For parallel work:** Add worktrees inside VM

## Key Principle

> **Sandbox is for convenience (fewer prompts). VM is for containment (blast
> radius).**

Use sandbox to reduce friction. Use VM when you need hard isolation.
