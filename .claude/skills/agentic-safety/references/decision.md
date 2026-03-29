# Decision Framework

Choosing the right isolation approach for your workflow.

## Quick Decision Tree

```
Do you use Docker/Supabase locally?
├── No → Sandbox Only (simplest)
└── Yes
    ├── Okay with prompts for Docker commands? → Sandbox (exclude Docker)
    └── Want full autonomy?
        └── Dedicated Machine with skip-permissions
```

## Comparison Matrix

| Aspect                 | Sandbox Only  | Dedicated Machine          |
| ---------------------- | ------------- | -------------------------- |
| **Setup time**         | 5 min         | Machine setup              |
| **Docker support**     | No (excluded) | Yes                        |
| **Supabase CLI**       | Prompts       | Full                       |
| **Permission prompts** | ~84% fewer    | Zero (skip-permissions)    |
| **Blast radius**       | CWD + network | Entire machine             |
| **Recovery**           | Git reset     | Git reset / reinstall      |
| **Host safety**        | High          | Highest (separate machine) |

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

### Dedicated Machine (skip-permissions)

**Best for:** Maximum autonomy, Docker-heavy workflows, fully autonomous agents

Use a separate physical machine (e.g. a second MacBook Pro) as the isolation
boundary. The machine itself is the blast radius — agents can run with
`--dangerously-skip-permissions` safely because they cannot affect your primary
machine.

**Benefits:**

- Full Docker/Supabase access with zero prompts
- Native performance (no VM overhead)
- Complete isolation from primary workstation
- Use worktrees for parallel issue work

## By Workflow Type

| Workflow                            | Recommended Approach           |
| ----------------------------------- | ------------------------------ |
| Quick script on Mac                 | Sandbox only                   |
| Next.js without Supabase            | Sandbox only                   |
| Supabase project, okay with prompts | Sandbox (exclude supabase)     |
| Supabase project, want autonomy     | Dedicated machine              |
| Multiple parallel issues            | Dedicated machine + Worktrees  |
| Experimental/risky automation       | Dedicated machine (skip-perms) |

## Risk Assessment

| Risk                         | Sandbox         | Dedicated Machine    |
| ---------------------------- | --------------- | -------------------- |
| File destruction outside CWD | Blocked         | Contained to machine |
| Data exfiltration            | Domain-filtered | Contained to machine |
| System compromise            | Blocked         | Contained to machine |
| Docker abuse                 | N/A (excluded)  | Contained to machine |

## Migration Path

**Start simple, add isolation as needed:**

1. **Start:** Sandbox only (5 min setup)
2. **If Docker prompts annoy you:** Exclude Docker from sandbox
3. **If that's not enough:** Use a dedicated machine with skip-permissions

## Key Principle

> **Sandbox is for convenience (fewer prompts). A dedicated machine is for
> containment (blast radius).**

Use sandbox to reduce friction. Use a separate machine when you need hard
isolation.
