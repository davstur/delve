# Rules Reference

Detailed guidance for creating `.claude/rules/` files. See the main SKILL.md for
the broader knowledge placement framework.

## What rules are (from official Claude Code docs)

Rules are **concise project instructions** that prevent mistakes. They're
modular pieces of CLAUDE.md -- same priority, auto-loaded.

> "For each line, ask: 'Would removing this cause Claude to make mistakes?' If
> not, cut it."

## Path-scoped vs always-loaded

- **With `globs`**: Only loads when matching files are touched. Use when the
  instruction is specific to a file type or domain.
- **Without `globs`**: Loads every session, same as CLAUDE.md. Use sparingly --
  every always-loaded rule costs context in every session.

Default to glob-scoped. Only go always-loaded if the instruction applies
regardless of what files are being edited.

## Template

```markdown
---
globs:
  - "relevant/glob/**/*.ts"
---

# [Topic] Rules

When [doing what], check against these [N] rules.

Full reference: `docs/path/to/detailed-doc.md`

## Checklist

1. **[Name]** -- [Concise instruction]. Never [anti-pattern].

2. **[Name]** -- [Concise instruction]. **Boundary**: [When this doesn't apply].
```

## Anti-patterns

- **Too verbose**: If it reads like documentation, it belongs in a skill
  reference, not a rule
- **Too broad paths**: `["**/*.ts"]` loads for every TypeScript file -- is the
  rule truly relevant everywhere? Three failure modes:
  - **Mindset/philosophy** (e.g., "quality over speed") -- belongs in CLAUDE.md,
    not a broad rule
  - **Un-targetable guardrail** (e.g., a prefix that could appear in any file)
    -- CLAUDE.md
  - **Activity-based** (e.g., "when fixing lint, use these utilities") -- skill
    (globs match paths, not intent)
  - **Exception**: A broad glob is OK for ~3-line pointer rules that trigger a
    skill invocation
- **Duplicating skill content**: If the content is a workflow or deep pattern
  guide loaded on-demand, it belongs in a skill, not a rule
- **Missing the "why"**: A rule without brief rationale gets ignored. One clause
  explaining why is enough.
- **Using rules as reference docs**: Rules are actionable checklists. If you
  need decision trees, examples, and history, that's a skill reference. Put the
  checklist in a rule and the depth in the skill's `references/` directory.
- **Dead workflows**: If a rule describes a process nobody follows (e.g.,
  creating files that don't exist in the project), delete it rather than
  maintaining it.
