# Code Simplify Command

You are invoking the code simplifier agent to remove unnecessary complexity from
changed files.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands. If not configured,
detect from lockfiles or default to `npm`.

## Prerequisites

Before running simplification:

1. Tests must pass
2. Typecheck must pass
3. Lint must pass

If any fail, fix them first.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- `--files "file1.ts file2.ts"` - Explicit list of files to simplify
- `--scope "package"` - Focus on specific package/directory
- `--dry-run` - Show what would be simplified without applying
- No arguments: Default to branch diff from main

Examples:

```
/project:quality:simplify                           # All files changed on branch
/project:quality:simplify --files "src/api/user.ts" # Specific file
/project:quality:simplify --scope "packages/core"   # Specific package
/project:quality:simplify --dry-run                 # Preview only
```

## Process

### Step 1: Determine Scope

Identify which files to simplify:

```bash
# Default: All files changed on current branch vs main
git diff main...HEAD --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$'

# If --files provided: Use explicit list
# If --scope provided: Filter to that directory
```

Report the scope:

```
📁 Files to simplify (X total):
- src/services/user.ts
- src/api/orders.ts
- src/components/Dashboard.tsx
```

### Step 2: Verify Prerequisites

```bash
# Run tests
pnpm test

# Run typecheck
pnpm typecheck

# Run lint
pnpm lint
```

If any fail:

```
❌ Prerequisites not met

Tests: ✅ Pass
Typecheck: ❌ 3 errors
Lint: ✅ Pass

Please fix typecheck errors before running simplify.
Run: /project:quality:typecheck
```

Exit without simplifying.

### Step 3: Load and Execute Agent

Load the code simplifier agent from `.claude/agents/code-simplifier.md`.

Pass:

- List of files to simplify
- Dry-run flag if set

The agent will:

1. Analyze each file for simplification opportunities
2. Apply high-confidence simplifications (unless dry-run)
3. Run tests after each change
4. Rollback any that break tests
5. Report results

### Step 4: Final Verification

After simplification:

```bash
# Re-run all checks
pnpm test && pnpm typecheck && pnpm lint
```

### Step 5: Report Results

Present the agent's report:

```
## Code Simplification Complete

### Applied (X simplifications)

1. **Inlined single-use helper** - src/services/user.ts:45
   `formatUserName()` → inline template literal

2. **Removed dead code** - src/api/orders.ts:123
   Unreachable code after early return

### Reverted (Y attempted, tests failed)

1. **Inline attempt failed** - src/utils/helpers.ts:67
   Function was mocked in tests, kept original

### Skipped (Z potential, needs review)

- src/api/webhook.ts:34 - Defensive check might be intentional
- src/config/index.ts:12 - Config object used elsewhere

### Summary

| Category | Count |
|----------|-------|
| Applied  | X     |
| Reverted | Y     |
| Skipped  | Z     |

✅ All tests passing
✅ Typecheck passing
✅ Lint passing
```

## Dry Run Mode

If `--dry-run` is set, show what would be simplified without applying:

```
## Code Simplification Preview (Dry Run)

### Would Apply (X simplifications)

1. **Would inline single-use helper** - src/services/user.ts:45
   `formatUserName()` called once, could be inlined

2. **Would remove dead code** - src/api/orders.ts:123
   Code after return statement is unreachable

### Would Skip (Y potential issues)

- src/api/webhook.ts:34 - Defensive check, might be intentional

Run without --dry-run to apply these simplifications.
```

## Success Output

```
✅ Code Simplification Complete

Applied: 5 simplifications
Reverted: 1 (tests failed)
Skipped: 2 (needs human review)

All checks passing. Ready for next step.
```

## Persist Results to Breakdown File

If a breakdown file exists for the current issue, append simplification results:

```bash
# Find breakdown file for this issue
ISSUE_NUMBER=$(git branch --show-current | grep -oE '[0-9]+' | head -1)
BREAKDOWN_FILE=$(find docs/plans -name "*issue-${ISSUE_NUMBER}*breakdown*.md" 2>/dev/null | head -1)

if [ -n "$BREAKDOWN_FILE" ]; then
  echo "📝 Appending simplification results to: $BREAKDOWN_FILE"
fi
```

**Append format** (under `## Simplification Log`):

```markdown
### Simplification - 2026-01-25 14:32

**Applied (3)**:

1. Inlined `formatUserName()` - src/services/user.ts:45
2. Removed unreachable code - src/api/orders.ts:123
3. Simplified conditional - src/utils/helpers.ts:89

**Skipped (1)**:

- src/api/webhook.ts:34 - Defensive check, needs review
```

When called from preflight, results are included in the preflight summary
instead.

## Integration with Preflight

This command is called by `/project:issues:preflight` as part of the pre-PR
workflow. When called from preflight:

- Scope is already determined (branch diff)
- Prerequisites are already verified
- Results feed into the overall preflight report (not written separately)

## Failure Modes

If you find yourself:

1. **Many simplifications break tests** → Code is more coupled than it looks.
   Stop and investigate.
2. **No simplifications found** → Code might already be simple. That's fine.
3. **Simplifying test code** → Stop. Tests are intentionally explicit.
4. **Prerequisites keep failing** → Fix those first, don't bypass.
