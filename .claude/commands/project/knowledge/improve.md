# Improve Knowledge Entry

You refine existing knowledge artifacts — rules, skills, CLAUDE.md sections, or
PLATFORM.md — so they stay concise, actionable, and well-placed.

This command runs in two phases:

1. **Review & Plan (default)** — analyze the target, surface issues, and propose
   concrete edits. Wait for the human to confirm or adjust.
2. **Apply** — after approval, implement the agreed changes and show the result.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Interpret arguments in this order:

- First argument (optional): search text identifying the knowledge to improve.
  If omitted with a dimension flag, review all files in that dimension.
- `--rules` — focus on `.claude/rules/` files
- `--skills` — focus on `.claude/skills/` files
- `--claude-md` — focus on CLAUDE.md
- `--platform` — focus on PLATFORM.md
- `--file path/to/file` — target a specific file
- `--aggressive` — lean harder on reductions (merge, drop verbose examples)
- `--all` — audit the entire knowledge system

If no dimension flag or file is provided, search across all knowledge locations
for the provided text.

Example invocations:

```
/project:knowledge:improve "ripgrep guidance"
/project:knowledge:improve --rules
/project:knowledge:improve --platform --aggressive
/project:knowledge:improve --file .claude/rules/testing.md
/project:knowledge:improve --all
```

## Phase 1 — Review & Plan (always run first)

Load the `knowledge-placement` skill for tier definitions, format guidelines,
and the decision tree.

### 1. Resolve Target

- If `--file` provided, load that file; error if missing.
- If dimension flag provided without search text, list all files in that
  dimension and audit each.
- If search text provided, search across the locations in the skill's "Existing
  Coverage Check" section. If nothing matches, suggest `/project:knowledge:add`
  instead.
- If `--all`, audit every knowledge file systematically.

### 2. Validate Placement

For each file, use the skill's decision tree to confirm it's in the right tier.
Flag misplaced content and recommend the correct location.

### 3. Analyze Content Quality

For each file:

- **Check length**: Rules under 50 lines, skills focused, CLAUDE.md scannable.
- **Check for generic content** (CRITICAL): Cut anything that would apply to any
  project. The AI already knows general best practices.
- **Check rationales**: Should state project-specific reasons, not theoretical
  benefits.
- **Check actionability**: Every statement should tell the AI what to DO.
- **Check for overlap**: Flag content duplicated across tiers.
- **Check for staleness**: Flag references to files, patterns, or tools that no
  longer exist.
- **Check format**: Does it follow the skill's format guidelines for its tier?

### 4. Present the Plan

```
🛠️ Knowledge Improvement Plan
Target: .claude/rules/testing.md
Current length: 85 lines (consider trimming to ~40)
Placement: correct (always-loaded guardrail)
Content actions:
  - Cut generic "why testing matters" section (lines 12-20) → AI knows this
  - Replace 30-line example with file reference to tests/example.test.ts
  - Merge duplicate bullets about test naming
  - Update stale reference to removed utility function
Target length: ~40 lines
Next step: Confirm / Adjust / Cancel
```

Wait for human confirmation. If the user declines, exit gracefully.

## Phase 2 — Apply (after confirmation)

1. Reload the file (in case it changed during discussion).
2. Apply the agreed changes. Keep directives concise and project-specific.
3. If relocation was agreed, move the file and mention the new path.
4. Output the full file in a fenced block with a brief diff summary.

### Completion

```
✅ Knowledge Updated
- File: .claude/rules/testing.md
- Length: 42 lines (was 85)
- Changes: cut generic content, merged duplicates, updated references
- Placement: confirmed correct (.claude/rules/)
```

If follow-up work was discovered (e.g., split a large file, update related
files), call it out as a recommendation.

## Audit Mode (`--all`)

When auditing the full knowledge system, produce a summary table:

```
📊 Knowledge System Audit

Rules (.claude/rules/):
  ✅ git-commit-guard.md (28 lines) — concise, well-placed
  ⚠️  testing.md (85 lines) — too long, has generic content
  ❌ old-pattern.md — references deleted file, stale

Skills (.claude/skills/):
  ✅ claude-permissions/ — well-structured, progressive disclosure

CLAUDE.md:
  ✅ Concise project overview (30 lines)

PLATFORM.md:
  ⚠️  Missing (consider creating for domain context)

Recommendations:
  1. Trim testing.md (cut generic content)
  2. Remove old-pattern.md (stale)
  3. Consider creating PLATFORM.md
```

Then ask which items to address, and proceed with Phase 1 → Phase 2 for each.
