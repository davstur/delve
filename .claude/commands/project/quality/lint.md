# Lint Fix Command

You are a meticulous software engineer tasked with fixing lint errors to the
**highest quality standard**. Your goal is to fix issues properly, not work
around them.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands below. If not
configured, detect from lockfiles or default to `npm`.

## Core Philosophy

**Proper fixes over workarounds. Always.**

- `eslint-disable` is a last resort, not a first response
- `any` type requires genuine justification
- Local types when domain types exist = laziness
- Every suppression needs user approval

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- `--scope "package"` - Focus on specific package/directory
- `--strict` - Fail on any suppression (CI mode)
- `--checkpoint` - Pause for approval when exceptions found (for large changes)

Examples:

```
/project:quality:lint                    # Fix all, confirm exceptions at end
/project:quality:lint --scope "core"     # Fix lint in core package
/project:quality:lint --strict           # No suppressions allowed
/project:quality:lint --checkpoint       # Pause mid-process if exceptions found
```

**Default behavior**: Fix everything, then present all exceptions for approval
at the end. Use `--checkpoint` for large/complex changes where you want early
visibility into the exception approach.

## Lint Fix Process

### Phase 0: Load Project-Specific Patterns

**FIRST**: Check for project-specific lint documentation:

```bash
# Common locations for project-specific lint patterns
ls -la LINT*.md lint*.md .github/LINT*.md docs/LINT*.md 2>/dev/null
```

If found (e.g., `LINT-PATTERNS-LIVE.md`), read it to understand:

- **Project utilities** to use instead of raw patterns (e.g., `debugLog` vs
  `console.log`)
- **Import conventions** specific to this codebase
- **Component conventions** (e.g., use `<Stack>` instead of `space-y-*`)
- **Approved suppressions** already documented
- **Learned patterns** from previous fixes

Project-specific patterns **override** generic guidance. For example:

- Generic: "Remove console.log"
- Project: "Replace with `debugLog` from `@project/core`"

### Phase 1: Run Lint and Categorize Issues

```bash
# Run lint and capture output
pnpm lint 2>&1 | tee /tmp/lint-output.txt

# Or for specific package:
# pnpm --filter=@project/core lint 2>&1 | tee /tmp/lint-output.txt
```

Categorize each error into one of these buckets:

#### Category A: Proper Fix Required (Most Common)

These MUST be fixed properly, no suppressions:

| Error Type                        | Proper Fix                   | NOT This                           |
| --------------------------------- | ---------------------------- | ---------------------------------- |
| Unused import                     | Remove the import            | `// eslint-disable`                |
| Unused variable                   | Remove or use it             | Prefix with `_` unless intentional |
| Missing type                      | Add proper type from domain  | `any`                              |
| Direct DB call (when repo exists) | Use repository method        | `eslint-disable no-restricted-*`   |
| Wrong eslint rule name            | Use correct rule name        | Different disable comment          |
| Type import style                 | Use `import type`            | `eslint-disable`                   |
| `let` never reassigned            | Change to `const`            | Leave as `let`                     |
| `\|\| []` for arrays/objects      | Use `?? []` (nullish)        | `eslint-disable`                   |
| Console statements                | Use project logger utility   | `eslint-disable no-console`        |
| Invalid anchor href (`#`)         | Use Link component or button | Leave placeholder                  |

**Accessibility (jsx-a11y) fixes** - common patterns:

| Error                    | Proper Fix                                            |
| ------------------------ | ----------------------------------------------------- |
| Label not associated     | Add `htmlFor` matching input `id`                     |
| Click on non-interactive | Add `role="button"`, `tabIndex={0}`, keyboard handler |
| Missing alt text         | Add descriptive `alt` attribute                       |
| Invalid href             | Use proper route or change to `<button>`              |

#### Category B: Pattern Extension Required

When the fix requires adding to existing patterns:

| Situation                 | Proper Fix                                |
| ------------------------- | ----------------------------------------- |
| Repository missing method | **Add method to repository**, then use it |
| Domain type missing       | **Add to central types**, then use it     |
| Utility function missing  | **Add to utils**, then use it             |

**CRITICAL**: Extending patterns is preferred over suppression.

#### Category C: Justified Suppressions (Rare)

Suppressions are ONLY acceptable for:

1. **Test utilities** - Raw DB operations for setup/teardown
2. **Migration scripts** - One-time operations
3. **External library gaps** - No types available from vendor
4. **Intentional patterns** - Documented architectural decisions
5. **React hooks with intentional deps** - When you deliberately exclude
   dependencies

**Common justified case: react-hooks/exhaustive-deps**

```typescript
// ✅ JUSTIFIED: Intentionally trigger only on length change, not every mutation
useEffect(() => {
  scrollToPosition(visibleItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [visibleItems.length]) // Only re-run when count changes, not content

// ❌ NOT JUSTIFIED: Just avoiding the warning without understanding
useEffect(() => {
  doSomething(data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Wrong - should include `data` or use ref pattern
```

For each suppression, you MUST document:

- WHY a proper fix isn't possible
- WHAT the justification is
- WHERE (file:line) it applies

### Phase 2: Fix Issues Properly

Work through each issue systematically:

#### For Category A (Proper Fixes):

```typescript
// ❌ WRONG: Suppressing unused import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UnusedThing } from './module'

// ✅ RIGHT: Remove the import
// (just delete the line)
```

```typescript
// ❌ WRONG: Using `any` for laziness
const data: any = fetchData()

// ✅ RIGHT: Find and use proper type
import type { UserData } from '@project/core/types'
const data: UserData = fetchData()
```

```typescript
// ❌ WRONG: Suppressing direct DB access when repo exists
// eslint-disable-next-line no-restricted-properties
const { data } = await supabase.from('users').select('*')

// ✅ RIGHT: Use or extend the repository
const users = await userRepository.findAll()

// ✅ RIGHT (if method missing): Add method first, then use
// In repository:
async findAll(): Promise<User[]> {
  const { data } = await this.client.from('users').select('*')
  return data ?? []
}
// Then in calling code:
const users = await userRepository.findAll()
```

#### For Category B (Pattern Extensions):

**Before adding a suppression, ask yourself:**

1. Does a repository exist for this entity? → Add method to it
2. Does a domain type exist for this concept? → Use it or extend it
3. Is this a common utility? → Add to shared utils

```typescript
// ❌ WRONG: Local type when domain type should exist
type LocalUserStatus = 'active' | 'inactive' | 'pending'

// ✅ RIGHT: Use or add to central domain types
// In @project/core/types/domain/user.ts:
export type UserStatus = 'active' | 'inactive' | 'pending'

// Then import and use:
import type { UserStatus } from '@project/core/types'
```

#### For Category C (Justified Suppressions):

When suppression IS justified, use proper format:

```typescript
/**
 * Test utilities for database setup/teardown.
 *
 * Direct supabase.from() is intentionally used (not repositories) because:
 * 1. Test cleanup needs raw DELETE without business logic
 * 2. Test data generation needs direct INSERT for fixtures
 * 3. Repositories add validation that interferes with test setup
 */
/* eslint-disable no-restricted-properties */

// ... file contents
```

For inline suppressions:

```typescript
// eslint-disable-next-line no-restricted-properties -- Test cleanup requires raw DELETE
await supabase.from('test_data').delete().eq('test_run_id', runId)
```

### Phase 3: Fix Loop (Iterate Until Clean)

**CRITICAL**: This is an iterative process. Keep looping until lint passes.

```
┌─────────────────────────────────────────────────────────────┐
│                      FIX LOOP                               │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Run Lint │───▶│ Analyze  │───▶│   Fix    │              │
│  └──────────┘    │  Errors  │    │ Properly │              │
│       ▲          └──────────┘    └────┬─────┘              │
│       │                               │                     │
│       └───────────────────────────────┘                     │
│                                                             │
│  Continue until: lint passes OR only Category C remains     │
└─────────────────────────────────────────────────────────────┘
```

**Each iteration:**

1. **Run lint**:

   ```bash
   pnpm lint 2>&1
   ```

2. **If errors remain**: Analyze and fix the next batch
   - Group related errors (same file, same type)
   - Fix Category A issues immediately
   - For Category B, extend patterns then fix
   - Track Category C for later approval

3. **Re-run lint** to verify fixes and catch any new issues introduced

4. **Repeat** until:
   - Lint passes cleanly, OR
   - Only justified Category C suppressions remain

**Do NOT batch all fixes then run once** - iterative verification catches issues
introduced by fixes (e.g., removing an import that's actually used elsewhere).

**Example iteration log:**

```
Iteration 1: 28 errors
- Fixed: 12 unused imports (Category A)
- Fixed: 3 wrong rule names (Category A)
- Remaining: 13 errors

Iteration 2: 13 errors
- Fixed: 5 missing type imports (Category A)
- Extended: Added findByIds() to UserRepository (Category B)
- Fixed: 4 direct DB calls now use repository
- Remaining: 4 errors

Iteration 3: 4 errors
- All 4 are test utility files needing raw DB access (Category C)
- Collected for user approval

Lint passes with 4 pending suppressions.
```

### Phase 3.5: Mid-Process Checkpoint (--checkpoint flag only)

**When to use**: This checkpoint is triggered by the `--checkpoint` flag for
large or complex changes. By default, continue to completion and present all
exceptions at the end.

**If `--checkpoint` AND Category C exceptions identified**, pause and present:

```
## Mid-Process Checkpoint

I've fixed 24 lint errors properly. During the process, I identified 4 issues
that appear to require suppressions (Category C).

Before I continue, please review these potential exceptions:

### Potential Suppressions Identified:

1. **test-utils/db-helpers.ts** - 12 direct DB calls
   - Appears to be test infrastructure
   - Likely needs file-level suppression

2. **sync/change-detection.ts** - 4 bulk queries
   - Performance-critical sync operations
   - Could add repository methods OR suppress

### Options:

A) **Approve direction** - I'll continue fixing, add these suppressions, and
   present final summary

B) **Request alternatives** - I'll implement repository methods for #2 instead
   of suppressing

C) **Review first** - Stop here so you can review the proper fixes made so far

Which approach would you prefer?
```

**Without `--checkpoint`**: Skip this phase and continue to Phase 4 where all
exceptions are presented together for final approval.

### Phase 4: Collect and Present Suppressions for Approval

**CRITICAL**: Any remaining suppressions MUST be presented to the user.

Format your suppression report:

````
## Suppressions Requiring Approval

I've fixed [X] lint errors properly. The following [Y] suppressions require
your approval before I add them:

### 1. Test Utilities (packages/test-utils/src/db-helpers.ts)

**What**: File-level `no-restricted-properties` suppression
**Why**: Test setup/teardown needs raw DELETE/INSERT operations
**Justification**:
- Repositories have domain validation that prevents test data manipulation
- Test cleanup needs to bypass business logic constraints
- This is infrastructure code, not domain code

**Suppression to add**:
```typescript
/* eslint-disable no-restricted-properties */
````

### 2. Change Detection Sync (packages/beekeeper/src/sync/change-detection.ts)

**What**: File-level `no-restricted-properties` suppression **Why**: Bulk
comparison queries for sync operations **Justification**:

- Performance-critical bulk lookups not suitable for per-record repository calls
- Sync comparison needs raw access for efficiency

**Alternative considered**: Could add `findManyForComparison()` to repository
**Recommendation**: Suppression is acceptable here, but repository method would
be cleaner

---

**Please confirm**:

- [ ] Approve suppression #1 (test utilities)
- [ ] Approve suppression #2 (change detection)
- [ ] Request alternative approach for any

If you'd prefer I implement the repository method alternative for #2, let me
know.

````

### Phase 5: Apply Approved Suppressions Only

After user approval:

1. Add ONLY the approved suppressions
2. Run lint to verify all errors resolved
3. Commit with clear message explaining suppressions

```bash
git add -A && git commit -m "fix: Resolve lint errors with proper fixes

Proper fixes:
- Removed unused imports in actions.ts
- Added missing type imports in queries.ts
- Used repository pattern for DB access in handlers.ts

Approved suppressions (with justification):
- test-utils/db-helpers.ts: Test cleanup requires raw DELETE
- sync/change-detection.ts: Bulk comparison needs direct queries

All suppressions approved by user."
````

## Quality Checklist

Before considering lint fixed, verify:

- [ ] **No lazy suppressions**: Each `eslint-disable` has clear justification
- [ ] **No unnecessary `any`**: All `any` types have comments explaining why
- [ ] **Domain types used**: No local types when central types exist
- [ ] **Repository pattern followed**: No direct DB access when repos exist
- [ ] **User approved suppressions**: Every suppression was explicitly approved
- [ ] **Lint passes**: `pnpm lint` exits cleanly

## Anti-Patterns to Avoid

### The Suppression Cascade

```typescript
// ❌ WRONG: Adding suppressions without understanding the issue
// eslint-disable-next-line no-restricted-syntax
const result = data || null

// ✅ RIGHT: Understand why the rule exists and fix properly
const result = data ?? null // Use nullish coalescing
```

### The Any Escape Hatch

```typescript
// ❌ WRONG: Using any because "it's faster"
const response: any = await api.fetch()

// ✅ RIGHT: Define or import proper types
import type { ApiResponse } from '@project/core/types'
const response: ApiResponse = await api.fetch()
```

### The Local Type Shortcut

```typescript
// ❌ WRONG: Local enum when domain enum exists
type Status = 'pending' | 'complete' // Duplicating domain types!

// ✅ RIGHT: Import from domain
import type { OrderStatus } from '@project/core/types/domain'
```

### The Wrong Rule Name

```typescript
// ❌ WRONG: Wrong rule name (won't suppress anything)
// eslint-disable-next-line no-restricted-syntax
await supabase.from('users') // Still errors because rule is `no-restricted-properties`

// ✅ RIGHT: Use correct rule name
// eslint-disable-next-line no-restricted-properties -- Justification here
await supabase.from('users')
```

## Success Output

```
✅ Lint Fix Complete

Fixed properly: 23 errors
- 8 unused imports removed
- 5 types corrected (used domain types)
- 6 repository methods used/added
- 4 eslint rule names corrected

Approved suppressions: 3
- test-utils/db-helpers.ts (test infrastructure)
- sync/change-detection.ts (bulk sync operations)
- migrations/001-initial.ts (one-time migration)

All suppressions documented with justification.
Lint passes cleanly.

Next: Review changes and commit.
```

## When to Escalate (Ask User)

Don't guess on these - ask for guidance:

- **Any `any` type** that requires judgment (not just removal)
- **Public API changes** (exported functions, interfaces)
- **Security-related code** (auth, permissions, validation)
- **Components >300 lines** (may need architectural decision)
- **Complex generics** or type inference issues
- **Cross-cutting concerns** (affects multiple packages)
- **Performance implications** (caching, queries, rendering)

Format your escalation:

```
⚠️ Escalation Required

**File**: src/auth/middleware.ts:45
**Error**: no-explicit-any on permission check
**Context**: This handles role-based access control

Options I see:
1. Create `PermissionCheck` type (involves API design)
2. Use `unknown` with type guards (safer but verbose)
3. Suppress with justification (quick but not ideal)

Which approach would you prefer?
```

## Failure Modes

If you find yourself:

1. **Adding many suppressions** → Stop. Most likely improper approach.
2. **Using `any` frequently** → Stop. Find proper types.
3. **Creating local types** → Stop. Check domain types first.
4. **Not understanding the rule** → Stop. Research what it's protecting against.

When in doubt: Fix properly. Ask the user if unsure about approach.
