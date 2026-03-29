---
description: >
  Evaluate where project knowledge belongs across dimensions: CLAUDE.md, rules,
  or skills. Use when the user asks to "create a rule", "write a skill",
  "remember this", when a user asks about "codebase conventions" or "convention
  violations", or when a conversation reveals a pattern or recurring mistake
  that should be codified. Also use when evaluating whether something belongs in
  one dimension versus another, migrating existing knowledge files, or
  reorganizing knowledge.
---

# Knowledge Placement Guide

## The Knowledge System

| Tier   | Dimension                      | Mechanism     | Loading                        | Purpose                                           | Design                                                    |
| ------ | ------------------------------ | ------------- | ------------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| **0**  | **PLATFORM.md**                | Built-in      | Always (foundational)          | Vision, principles, strategic trade-offs          | Narrative; why we build the way we do                     |
| **0**  | **CLAUDE.md**                  | Built-in      | Always (every session)         | Domain model, non-negotiable rules                | Ultra-concise; every line must prevent mistakes           |
| **1a** | **Rules** (`.claude/rules/`)   | Built-in      | Always or path-scoped          | Concise instructions that prevent coding mistakes | Checklist format, ~50 lines, link out for depth           |
| **1b** | **Skills** (`.claude/skills/`) | Built-in      | Intent-detected by description | Workflows, domain knowledge, complex procedures   | Loaded on demand; can be verbose; reference files OK      |
| **2**  | **Enforcement**                | Tooling       | Pre-commit hooks + CI/CD       | Automated convention checks that catch violations | Code-quality scripts, lint rules, type checks, validators |
| **3**  | **Guides** (Reference)         | Documentation | Manual lookup                  | Deep rationale, history, examples, edge cases     | Living documents, ADRs, pattern guides                    |

## Reliability Hierarchy

```
Most reliable (always active)
  |- Enforcement (pre-commit hooks + CI -- blocks violations automatically)
  |- PLATFORM.md
  |- CLAUDE.md
  |- Rules (no globs -- always loaded)
  |- Rules (with globs -- loaded when files touched)
  |- Skills (description-matched to user intent)
Least reliable (requires manual trigger)
```

Enforcement is the most reliable tier -- it catches violations regardless of
whether Claude (or a developer) remembered the convention. But it only catches
violations _after_ code is written. AI knowledge tiers help write correct code
the first time. Both encode the same conventions through different mechanisms.

## Decision Tree

First, consider enforcement. Then route to the appropriate AI knowledge tier.

```
Step 1: Can this convention be enforced automatically?
=========================================================
|- Is the violation a pattern detectable by static analysis?
|   |- YES -> Consider a code-quality script or lint rule
|   |         (scripts/validate/code-quality/, ESLint plugin, etc.)
|   +- NO  -> AI knowledge only (proceed to Step 2)
|
|- If enforceable: does Claude also need to KNOW the convention
|  to write correct code on the first attempt?
|   |- YES -> Enforcement AND an AI knowledge tier (proceed to Step 2)
|   +- NO  -> Enforcement alone is sufficient (purely mechanical pattern)

Step 2: Which AI knowledge tier?
=========================================================
Is this knowledge...

|- A core principle, vision, or strategic choice of the platform?
|   |- Explains WHY we use a tool/pattern over alternatives?      -> PLATFORM.md
|   |- Describes a strategic trade-off (chosen + why)?            -> PLATFORM.md
|   |- Platform vision or user priorities?                         -> PLATFORM.md
|
|- A non-negotiable that applies EVERY session?
|   |- Can it be said in 1-3 lines?                  -> CLAUDE.md
|   +- Needs a checklist or structured format?        -> Rule (no globs)
|
|- A non-negotiable coding instruction?
|   |- Can you target it with a file-path glob where it's relevant >80%?
|   |  +- YES                                         -> Rule (with globs)
|   |- Is it un-targetable (any file type, or a mindset/philosophy)?
|   |  +- YES                                         -> CLAUDE.md
|   +- Is it relevant to an ACTIVITY, not a file type?
|      +- YES                                         -> Skill
|
|- A workflow or procedure triggered by user intent?   -> Skill
|
|- Deep reference with rationale/history/examples?     -> Skill references/ or docs/guides/
|   If it supports a skill workflow -> skill's references/ directory
|   If it's standalone reference   -> docs/guides/ or docs/architecture/
|
+- None of the above?                                  -> Don't codify it
    Transient context, session-specific notes, or one-off guidance
    doesn't need permanent storage.
```

## Key Design Principles

### PLATFORM.md

- **Test**: "Does this explain WHY we build a certain way?" If not -> probably a
  rule or CLAUDE.md.
- Strategic level: vision, principles, trade-offs, domain context.
- User roles, terminology, business rules.
- Not implementation details (those go in rules/skills).

### CLAUDE.md

- **Test**: "Would removing this line cause mistakes in EVERY session?" If no ->
  remove it.
- Non-negotiable rules section is the highest-priority knowledge in the project.
- Keep lean. Domain model, non-negotiable rules, dev commands, MCP tools.

### Rules

- **Test**: "Would removing this cause Claude to make coding mistakes?" If not,
  cut it.
- **Targetability test**: Can you write a glob where the rule is relevant >80%
  of the time? If not -> CLAUDE.md or skill instead.
- Checklist format. Numbered items, each a clear do/don't.
- One topic per file. Descriptive filename (`query-performance.md`, not
  `rule-3.md`).
- Link out for depth: "Full reference: `docs/guides/detailed-doc.md`"
- Aim for under 50 lines. If approaching 100+, split or move detail to
  reference.
- Default to path-scoped. Only go always-loaded if truly universal.
- See `references/rules.md` for the template and anti-patterns.

### Skills

- Description field is critical -- it's what triggers loading. Include trigger
  phrases and concrete examples.
- Body is only loaded AFTER the skill triggers. "When to use" sections in the
  body don't help with triggering -- put that in the description.
- Supporting files (`references/`, `scripts/`, `assets/`) keep SKILL.md focused.
  Aim for <500 lines in SKILL.md.
- Best for multi-step workflows, domain procedures, or complex decision-making.
- `user-invocable: false` hides from `/` menu but Claude can still auto-invoke.
  `disable-model-invocation: true` fully prevents Claude from invoking it.
- `context: fork` runs skills in isolated subagent (good for research/analysis).
- See `references/skills.md` for the full reference including all frontmatter
  fields, string substitutions, dynamic context injection, and anti-patterns.

## When a Convention Spans Multiple Dimensions

Many conventions need coverage in more than one dimension. Common combinations:

**Enforcement + AI knowledge**: The code-quality script catches violations
automatically; the rule or CLAUDE.md entry helps Claude write it correctly the
first time so the hook doesn't reject the commit.

```
Code-quality script (scripts/validate/code-quality/branded-id-usage.ts):
  Detects incorrect ID patterns at pre-commit and CI.

Rule (.claude/rules/branded-ids.md):
  "Always use branded ID types (UserId, CourseId) -- never raw strings."
  Claude writes correct code; the script catches anything that slips through.
```

**Rule + depth**: A concise coding guard AND deep reference material. The rule
provides the actionable checklist; the skill's `references/` directory (or
`docs/guides/`) holds the depth.

```
Rule (.claude/rules/topic.md):
  "Never use ?? DEFAULT for invariant data. Three cases: throw, let crash, or captureException."
  Links to -> Full reference: docs/guides/detailed-pattern-guide.md

Skill reference (.claude/skills/my-skill/references/patterns.md):
  Decision tree, examples, anti-patterns, rationale for the workflow.
```

**Enforcement alone**: Purely mechanical patterns (import ordering, formatting,
unused imports) that don't require Claude to understand the convention -- the
tooling handles it automatically.

## Existing Coverage Check

Before adding knowledge, search these locations:

```
PLATFORM.md
CLAUDE.md
.claude/rules/**/*.md
.claude/skills/*/
scripts/validate/code-quality/**
docs/architecture/**/*.md
docs/guides/**/*.md
```

If content already exists: update in place rather than creating duplicates. If a
code-quality script already enforces the convention, decide whether Claude also
needs AI knowledge to write it correctly on the first attempt.

## Process

1. **Identify the knowledge** -- What pattern, principle, or procedure needs
   codifying?
2. **Use the decision tree** -- Determine which dimension(s) it belongs in.
3. **Check for existing coverage** -- Search CLAUDE.md, rules, and skills for
   overlap.
4. **Write in the right format** -- Follow the design principles for that
   dimension.
5. **Cross-link** -- If a rule needs depth, link to the reference doc or skill
   reference.
6. **Verify** -- For rules: does every line prevent mistakes? For skills: does
   the description trigger correctly?

## Core Principle

Project knowledge reminds an expert AI about **project-specific choices**. If
you removed the project name and file paths, would this apply to any codebase?
If yes, it's too generic -- push back.
