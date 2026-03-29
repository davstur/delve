---
name: agentic-safety
description:
  Guide for setting up safe agentic/autonomous AI development environments. Use
  when users ask about (1) choosing between sandbox vs VM isolation, (2) setting
  up Claude Code for autonomous operation, (3) understanding constraints like
  Docker/Supabase compatibility, (4) configuring skip-permissions safely, (5)
  defense-in-depth strategies. Triggers on questions about agentic development
  safety, isolation approaches, VM setup for Claude Code, or "how do I run
  Claude autonomously/safely".
---

# Agentic Safety

Choose and configure the right isolation approach for autonomous AI development.

## Decision Tree

```
Do you use Docker/Supabase locally?
├── No → Sandbox Only
└── Yes
    ├── Okay with prompts for Docker commands? → Sandbox (exclude Docker)
    └── Want full autonomy? → VM + Sandbox
```

For detailed comparison, see [references/decision.md](references/decision.md).

## Quick Recommendations

| Workflow                    | Approach                   |
| --------------------------- | -------------------------- |
| Light dev, no Docker        | Sandbox only               |
| Supabase, okay with prompts | Sandbox (exclude supabase) |
| Supabase, want autonomy     | VM + Sandbox               |
| Parallel issues             | VM + Sandbox + Worktrees   |

## Core Principle

> **Sandbox = convenience (fewer prompts). VM = containment (blast radius).**

## Key Constraints

Before choosing an approach, understand these constraints:

1. **Docker incompatible with sandbox** - blocks socket access
2. **Supabase CLI needs Docker** - must exclude from sandbox or use VM
3. **MCP tools bypass sandbox** - alternative to Docker-dependent CLIs
4. **Containers on macOS can't have both** isolation AND Docker access

For full details, see [references/constraints.md](references/constraints.md).

## Approaches

### Sandbox Only (5 min setup)

OS-level filesystem/network isolation. ~84% fewer prompts.

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

See [references/sandbox.md](references/sandbox.md).

### Dedicated Machine (skip-permissions)

Use a separate machine (e.g. a second MacBook) as the blast radius for fully
autonomous agent work. Run `claude --dangerously-skip-permissions` safely
because the machine itself is the isolation boundary.

## Related

- **For pattern syntax and allow/deny lists:** Use the `permissions` skill

## Resources

- [references/decision.md](references/decision.md) - Full comparison matrix
- [references/constraints.md](references/constraints.md) - Known limitations
- [references/sandbox.md](references/sandbox.md) - Sandbox deep-dive
