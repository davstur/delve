# Add Project Knowledge

You help capture reusable project knowledge in the right place and format. This
command routes knowledge to the correct dimension using the knowledge-placement
decision tree.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

The input is the knowledge to capture — a convention, pattern, gotcha, or
decision. Optional flags:

- `--destination rule|skill|claudemd|platform|doc` — override auto-routing
- `--path <file>` — target a specific existing file to update

## Core Principle: Reminders, Not Tutorials

Project knowledge reminds an expert AI about **project-specific choices**, not
general best practices. The AI already knows TypeScript, React, database
patterns, etc.

**Test:** If you removed the project name and file paths, would this apply to
any codebase? If yes, it's too generic to codify. Push back.

## Process

### Phase 1 — Classify & Route

Load the `knowledge-placement` skill (read
`.claude/skills/knowledge-placement/SKILL.md`) and apply its decision tree:

1. **Restate the knowledge** — summarize what the user wants to capture.

2. **Check for existing coverage** — search across all dimensions:

   ```
   PLATFORM.md                    — strategic principles, vision
   CLAUDE.md                      — non-negotiable rules
   .claude/rules/**/*.md          — existing rules
   .claude/skills/*/SKILL.md      — existing skills
   docs/architecture/**/*.md      — architecture docs
   docs/guides/**/*.md            — living guides
   ```

   If already covered: show where and ask if user wants to update/extend it.

3. **Route using the decision tree:**

   ```
   Is this knowledge...
   ├─ A core principle, vision, or strategic trade-off?
   │                                              → PLATFORM.md
   │
   ├─ A non-negotiable for EVERY session?
   │   ├─ 1-3 lines?                              → CLAUDE.md
   │   └─ Needs structure/checklist?               → Rule (no globs)
   │
   ├─ A coding instruction for specific files?     → Rule (with globs)
   │   Determine glob patterns from the codebase
   │
   ├─ A workflow or procedure?                     → Skill
   │   (intent-triggered, complex, multi-step)
   │
   ├─ Deep reference with history/examples?        → Skill references/ or docs/guides/
   │   (rationale, edge cases, decision trees — too verbose for a rule)
   │
   ├─ Strategic or architectural knowledge?        → docs/architecture/ or docs/guides/
   │   (design decisions, system diagrams, domain strategy)
   │
   └─ Too generic / already covered?               → Push back
       Explain why and suggest alternatives
   ```

4. **Present the routing decision:**

   ```
   📍 Knowledge Routing

   Knowledge: "<summary>"
   Existing coverage: <none | partial in X | fully covered in Y>
   Destination: <dimension + file path>
   Rationale: <why this dimension>

   Format:
     <preview of how it will look in the target file>

   Next step: Confirm / Adjust / Cancel
   ```

   If the knowledge spans multiple dimensions (e.g., a concise rule AND a
   detailed skill reference), propose both and explain the linking pattern.

### Phase 2 — Apply (after confirmation)

Format and write the knowledge for its destination:

**For Rules (`.claude/rules/`):**

- Add YAML `globs` frontmatter with glob patterns (verify patterns match actual
  files using Glob tool)
- Checklist format, imperative directives
- Aim for under 50 lines
- If updating existing rule: use Edit to add/modify sections

**For Skills (`.claude/skills/`):**

- Description field with trigger phrases (this is what causes loading)
- Body can be verbose with examples and references
- If merging into existing skill: show the diff

**For CLAUDE.md:**

- Ultra-concise addition to the appropriate section
- Every line must prevent mistakes in EVERY session

**For PLATFORM.md:**

- Strategic level — vision, principles, trade-offs
- Not implementation details (those go in rules/skills)

**For Architecture/Guide docs:**

- Follow existing doc format in target directory
- Use documentation naming conventions (see knowledge-placement skill)

### Phase 3 — Verify & Summarize

```
✅ Knowledge Added

Destination: <file path>
Dimension: <rule | skill | CLAUDE.md | PLATFORM.md | doc>
Lines added: <N>
Format: <glob-scoped rule | always-loaded rule | skill merge | new file | ...>

Cross-references:
  - <any linked files>

Verification:
  - [ ] Content is project-specific (not generic)
  - [ ] Format matches destination conventions
  - [ ] No duplicate coverage across dimensions
```

## Anti-patterns (push back on these)

- **Generic principles** the AI already knows ("always handle errors") — unless
  there's a project-specific twist
- **One-time context** that won't recur — suggest an ADR instead
- **Verbose explanations** better suited as guides — route to `docs/guides/`
- **Duplicates** of existing knowledge — show the existing coverage instead
