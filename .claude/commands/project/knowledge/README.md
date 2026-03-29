# Knowledge Commands

Commands for managing project knowledge across all tiers.

## Available Commands

### `/project:knowledge:add`

Add new knowledge to the project. Automatically routes to the right tier:

| Tier              | Location             | When                                        |
| ----------------- | -------------------- | ------------------------------------------- |
| CLAUDE.md         | `./CLAUDE.md`        | Non-negotiable, every session               |
| Rules             | `.claude/rules/`     | Coding instructions (always or path-scoped) |
| Skills            | `.claude/skills/`    | Workflows, procedures (intent-triggered)    |
| PLATFORM.md       | `./PLATFORM.md`      | Strategic context, domain knowledge         |
| Architecture docs | `docs/architecture/` | Strategic decisions, system design          |

**Usage:**

```
/project:knowledge:add "always use branded types for entity IDs"
/project:knowledge:add "when writing repos, use .returns<T[]>()" --destination rule
/project:knowledge:add --path .claude/rules/testing.md "add cleanup convention"
```

### `/project:knowledge:improve`

Audit and refine existing knowledge artifacts.

```
/project:knowledge:improve --rules              # Audit all rules
/project:knowledge:improve --all                # Full system audit
/project:knowledge:improve "testing patterns"   # Search and improve
/project:knowledge:improve --file .claude/rules/testing.md
```

## Decision Tree

See the `knowledge-placement` skill for the full routing decision tree and
format guidelines for each tier.

## Replaces

These commands replace the retired `/project:memory:add`,
`/project:memory:improve`, and `/project:conventions:*` commands. Knowledge is
now routed to the appropriate tier rather than stored in a separate system.
