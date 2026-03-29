# Quality Commands

Commands for maintaining code quality to the highest standards.

## Philosophy

**Quality means proper fixes, not workarounds.**

These commands guide AI agents to:

- Fix issues at their root, not suppress them
- Use existing patterns and types, not create shortcuts
- Extend patterns when needed (repos, types, utils)
- Present exceptions for explicit user approval
- Document all justified deviations

## Recommended Workflow

```
implement → /project:issues:preflight → /project:issues:review → /project:issues:create-pr
```

**Preflight** (now in `/issues/`) orchestrates these quality tools plus
verification and compliance checking. See
[`../issues/README.md`](../issues/README.md) for details.

## Available Commands

### `/project:quality:simplify`

Invoke the code simplifier agent to remove unnecessary complexity.

```
/project:quality:simplify                           # All files on branch
/project:quality:simplify --files "src/api/user.ts" # Specific file
/project:quality:simplify --dry-run                 # Preview only
```

### `/project:quality:code-check`

Complete quality check: typecheck → lint, with combined approval.

```
/project:quality:code-check                    # Full check, approve at end
/project:quality:code-check --scope "core"     # Check specific package
/project:quality:code-check --strict           # No exceptions allowed (CI)
/project:quality:code-check --checkpoint       # Pause between phases
```

### `/project:quality:typecheck`

Fix TypeScript errors with proper types.

```
/project:quality:typecheck                    # Fix all type errors properly
/project:quality:typecheck --scope "core"     # Fix types in specific package
/project:quality:typecheck --strict           # No type escapes allowed
/project:quality:typecheck --checkpoint       # Pause if exceptions found
```

### `/project:quality:lint`

Fix lint errors with high quality standards.

```
/project:quality:lint                    # Fix all lint errors properly
/project:quality:lint --scope "core"     # Fix lint in specific package
/project:quality:lint --strict           # No suppressions allowed
/project:quality:lint --checkpoint       # Pause if exceptions found
```

## Key Behaviors

All commands share these behaviors:

### 1. Three-Category System

| Category | Description         | Action                                |
| -------- | ------------------- | ------------------------------------- |
| **A**    | Proper Fix Required | Fix immediately with correct approach |
| **B**    | Pattern Extension   | Extend repo/types/utils, then use it  |
| **C**    | Justified Exception | Rare - requires user approval         |

### 2. Iterative Fix Loop

```
Run check → Fix batch → Re-run → Repeat until clean
```

Don't batch all fixes - iterate to catch issues introduced by fixes.

### 3. Exception Approval

By default, complete all fixes then present exceptions for approval. Use
`--checkpoint` for large changes to get early visibility.

### 4. No Workarounds

The commands explicitly prohibit:

- `any` without justification
- `eslint-disable` without justification
- Local types when domain types exist
- Direct DB access when repositories exist

## Quality Standards

### No Lazy Suppressions

```typescript
// ❌ WRONG
// eslint-disable-next-line no-restricted-properties
const data = await supabase.from('users').select('*')

// ✅ RIGHT
const users = await userRepository.findAll()
```

### No Unjustified `any`

```typescript
// ❌ WRONG
const response: any = await fetch(url)

// ✅ RIGHT
import type { ApiResponse } from '@project/core/types'
const response: ApiResponse = await fetch(url)
```

### No Local Types When Domain Types Exist

```typescript
// ❌ WRONG
type UserStatus = 'active' | 'inactive'

// ✅ RIGHT
import type { UserStatus } from '@project/core/types/domain'
```

### Justified Exceptions Require Approval

All exceptions must be:

1. Explicitly justified (why proper fix isn't possible)
2. Presented to user for approval
3. Documented in the code
4. Committed with clear explanation

## When to Use These Commands

- **Before commits**: Run `code-check` to ensure quality
- **Before PRs**: Run `code-check --strict` if possible
- **After making changes**: Run relevant check to fix issues
- **CI/CD**: Use `--strict` flag to prevent any exceptions

## Flag Reference

| Flag               | Description                                      |
| ------------------ | ------------------------------------------------ |
| `--scope "pkg"`    | Focus on specific package/directory              |
| `--strict`         | Fail on any exceptions (no suppressions/escapes) |
| `--checkpoint`     | Pause for approval when exceptions found         |
| `--typecheck-only` | (code-check only) Run only typecheck             |
| `--lint-only`      | (code-check only) Run only lint                  |
