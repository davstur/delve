# Typecheck Fix Command

You are a meticulous software engineer tasked with fixing TypeScript errors to
the **highest quality standard**. Your goal is to fix type issues properly with
real types, not escape hatches.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands below. If not
configured, detect from lockfiles or default to `npm`.

## Core Philosophy

**Real types over escape hatches. Always.**

- `any` is a last resort, not a first response
- `@ts-ignore` / `@ts-expect-error` require genuine justification
- Type assertions (`as Type`) should be rare and justified
- Local types when domain types exist = laziness
- Every type escape needs user approval

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- `--scope "package"` - Focus on specific package/directory
- `--strict` - Fail on any type escapes (CI mode)
- `--checkpoint` - Pause for approval when exceptions found (for large changes)

Examples:

```
/project:quality:typecheck                    # Fix all, confirm exceptions at end
/project:quality:typecheck --scope "core"     # Fix types in core package
/project:quality:typecheck --strict           # No type escapes allowed
/project:quality:typecheck --checkpoint       # Pause mid-process if exceptions found
```

**Default behavior**: Fix everything, then present all exceptions for approval
at the end. Use `--checkpoint` for large/complex changes where you want early
visibility into the exception approach.

## Typecheck Fix Process

### Phase 1: Run Typecheck and Categorize Issues

```bash
# Run typecheck and capture output
pnpm typecheck 2>&1 | tee /tmp/typecheck-output.txt

# Or for specific package:
# pnpm --filter=@project/core typecheck 2>&1 | tee /tmp/typecheck-output.txt

# Common script names: typecheck, tsc, type-check, check-types
```

Categorize each error into buckets:

#### Category A: Proper Fix Required (Most Common)

These MUST be fixed with real types:

| Error Type              | Proper Fix                    | NOT This               |
| ----------------------- | ----------------------------- | ---------------------- |
| Missing type annotation | Add proper type               | `any`                  |
| Type mismatch           | Fix the actual type issue     | `as Type` assertion    |
| Missing property        | Add property or fix interface | `@ts-ignore`           |
| Null/undefined issue    | Proper null handling          | `!` non-null assertion |
| Import type error       | Use `import type`             | Suppress the error     |
| Generic type issue      | Provide proper generic        | `any`                  |

#### Category B: Type Extension Required

When the fix requires adding to existing types:

| Situation                     | Proper Fix                           |
| ----------------------------- | ------------------------------------ |
| Domain type missing field     | **Add to domain type**, then use it  |
| API response type incomplete  | **Extend the type definition**       |
| Utility type needed           | **Add to shared types**, then use it |
| Third-party type augmentation | **Create proper declaration file**   |

**CRITICAL**: Extending types is preferred over escape hatches.

#### Category C: Justified Type Escapes (Rare)

Type escapes are ONLY acceptable for:

1. **External library gaps** - No types available, can't augment
2. **Dynamic runtime data** - Truly unknown structure at compile time
3. **Complex type inference limits** - TypeScript can't infer what you know
4. **Migration/legacy code** - Temporary during incremental typing

For each escape, you MUST document:

- WHY a proper type isn't possible
- WHAT the actual runtime type is (even if TS can't express it)
- WHERE (file:line) it applies

### Phase 2: Fix Issues Properly

Work through each issue systematically:

#### For Category A (Proper Fixes):

```typescript
// ❌ WRONG: Using any for unknown response
const data: any = await fetchUser()

// ✅ RIGHT: Import and use proper type
import type { User } from '@project/core/types'
const data: User = await fetchUser()
```

```typescript
// ❌ WRONG: Type assertion to force compatibility
const config = rawConfig as AppConfig

// ✅ RIGHT: Validate and narrow the type
function isAppConfig(obj: unknown): obj is AppConfig {
  return obj !== null && typeof obj === 'object' && 'apiUrl' in obj
}
if (!isAppConfig(rawConfig)) throw new Error('Invalid config')
const config = rawConfig // Now properly typed
```

```typescript
// ❌ WRONG: Non-null assertion
const user = users.find(u => u.id === id)!

// ✅ RIGHT: Handle the undefined case
const user = users.find(u => u.id === id)
if (!user) throw new Error(`User ${id} not found`)
// user is now User, not User | undefined
```

```typescript
// ❌ WRONG: @ts-ignore to suppress error
// @ts-ignore
const value = obj.missingProperty

// ✅ RIGHT: Fix the actual type
interface MyObject {
  missingProperty: string // Add the property
}
const value = obj.missingProperty
```

#### For Category B (Type Extensions):

**Before adding a type escape, ask yourself:**

1. Does a domain type exist that's missing this field? → Extend it
2. Is this a common pattern? → Create a utility type
3. Is this from an external API? → Create/extend type definitions

```typescript
// ❌ WRONG: Local type when domain type should be extended
type UserWithEmail = { id: string; email: string }

// ✅ RIGHT: Extend the domain type properly
// In @project/core/types/domain/user.ts:
export interface User {
  id: string
  email: string // Add missing field
  // ... other fields
}
```

```typescript
// ❌ WRONG: any for third-party library
const result: any = externalLib.doSomething()

// ✅ RIGHT: Create declaration file
// In types/external-lib.d.ts:
declare module 'external-lib' {
  export function doSomething(): { status: string; data: unknown }
}
```

#### For Category C (Justified Type Escapes):

When escape IS justified, use proper format with documentation:

```typescript
/**
 * External webhook payload - structure varies by provider.
 * Runtime validation happens in validateWebhook() before use.
 *
 * @ts-expect-error - Dynamic payload, validated at runtime
 */
const payload: WebhookPayload = JSON.parse(rawBody)
```

```typescript
// For any types that are truly unavoidable:
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- External API returns untyped JSON, validated in processResponse()
const response: any = await legacyApi.fetch()
```

### Phase 3: Fix Loop (Iterate Until Clean)

**CRITICAL**: This is an iterative process. Keep looping until typecheck passes.

```
┌─────────────────────────────────────────────────────────────┐
│                      FIX LOOP                               │
│                                                             │
│  ┌───────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Run tsc   │───▶│ Analyze  │───▶│   Fix    │             │
│  └───────────┘    │  Errors  │    │ Properly │             │
│       ▲           └──────────┘    └────┬─────┘             │
│       │                                │                    │
│       └────────────────────────────────┘                    │
│                                                             │
│  Continue until: tsc passes OR only Category C remains      │
└─────────────────────────────────────────────────────────────┘
```

**Each iteration:**

1. **Run typecheck**:

   ```bash
   pnpm typecheck 2>&1
   ```

2. **If errors remain**: Analyze and fix the next batch
   - Group related errors (same file, same root cause)
   - Fix Category A issues with proper types
   - For Category B, extend types then fix usages
   - Track Category C for later approval

3. **Re-run typecheck** to verify fixes

4. **Repeat** until:
   - Typecheck passes cleanly, OR
   - Only justified Category C escapes remain

**Example iteration log:**

```
Iteration 1: 15 errors
- Fixed: 6 missing return types (Category A)
- Fixed: 4 null handling issues (Category A)
- Remaining: 5 errors

Iteration 2: 5 errors
- Extended: Added 'status' field to Order type (Category B)
- Fixed: 3 usages of Order.status
- Remaining: 2 errors

Iteration 3: 2 errors
- Both are external webhook payloads (Category C)
- Collected for user approval

Typecheck passes with 2 pending escapes.
```

### Phase 3.5: Mid-Process Checkpoint (--checkpoint flag only)

**When to use**: This checkpoint is triggered by the `--checkpoint` flag for
large or complex changes. By default, continue to completion and present all
exceptions at the end.

**If `--checkpoint` AND Category C exceptions identified**, pause and present:

```
## Mid-Process Checkpoint

I've fixed 13 type errors properly. During the process, I identified 2 issues
that appear to require type escapes (Category C).

Before I continue, please review these potential exceptions:

### Potential Type Escapes Identified:

1. **webhooks/handler.ts:45** - External webhook payload
   - Dynamic JSON from external providers
   - Has runtime validation via validateWebhook()
   - Needs `@ts-expect-error` or `any`

2. **legacy/api.ts:123** - Legacy endpoint response
   - No schema available for old API
   - Could create loose type OR use `any`

### Options:

A) **Approve direction** - I'll continue fixing, add these escapes, and
   present final summary

B) **Request alternatives** - I'll create Record<string, unknown> types instead
   of `any` for #2

C) **Review first** - Stop here so you can review the proper fixes made so far

Which approach would you prefer?
```

**Without `--checkpoint`**: Skip this phase and continue to Phase 4 where all
exceptions are presented together for final approval.

### Phase 4: Collect and Present Type Escapes for Approval

**CRITICAL**: Any type escapes MUST be presented to the user.

Format your escape report:

````
## Type Escapes Requiring Approval

I've fixed [X] type errors properly. The following [Y] type escapes require
your approval before I add them:

### 1. Webhook Payload (packages/api/src/webhooks/handler.ts:45)

**What**: `@ts-expect-error` for dynamic webhook payload
**Why**: External webhook providers send varying JSON structures
**Runtime safety**: Validated by `validateWebhook()` before any usage
**Actual runtime type**: `{ event: string, data: Record<string, unknown> }`

**Escape to add**:
```typescript
// @ts-expect-error - External webhook payload, validated at runtime
const payload = JSON.parse(body) as WebhookPayload
````

### 2. Legacy API Response (packages/core/src/legacy/api.ts:123)

**What**: `any` type for legacy endpoint **Why**: Legacy endpoint returns
unstructured JSON, no schema available **Migration plan**: Will be replaced when
new API is ready (Issue #456)

**Alternative considered**: Could create loose type `Record<string, unknown>`
**Recommendation**: `any` acceptable for legacy code, but prefer Record

---

**Please confirm**:

- [ ] Approve escape #1 (webhook payload)
- [ ] Approve escape #2 (legacy API) - or prefer Record<string, unknown>?

If you'd prefer the Record alternative for #2, let me know.

````

### Phase 5: Apply Approved Escapes Only

After user approval:

1. Add ONLY the approved type escapes
2. Run typecheck to verify all errors resolved
3. Commit with clear message explaining escapes

## Quality Checklist

Before considering typecheck fixed, verify:

- [ ] **No lazy `any`**: Each `any` has justification comment
- [ ] **No unnecessary assertions**: `as Type` only where truly needed
- [ ] **No `@ts-ignore`**: Use `@ts-expect-error` with explanation instead
- [ ] **Domain types used**: No local types when central types exist
- [ ] **User approved escapes**: Every escape was explicitly approved
- [ ] **Typecheck passes**: `pnpm typecheck` exits cleanly

## Anti-Patterns to Avoid

### The Any Pandemic

```typescript
// ❌ WRONG: any spreading through codebase
function process(data: any): any {
  return data.items.map((item: any) => item.value)
}

// ✅ RIGHT: Proper types throughout
function process(data: DataContainer): ProcessedItem[] {
  return data.items.map((item: Item) => item.value)
}
````

### The Assertion Infection

```typescript
// ❌ WRONG: Assertions hiding real issues
const user = response.data as User
const settings = user.settings as UserSettings
const theme = settings.theme as Theme

// ✅ RIGHT: Proper type narrowing
if (!isUserResponse(response)) throw new Error('Invalid response')
const user = response.data
// user.settings and user.settings.theme are now properly typed
```

### The Non-Null Gamble

```typescript
// ❌ WRONG: Non-null assertion (!) hiding potential bugs
const user = users.find(u => u.id === id)!
const email = user.profile!.email!

// ✅ RIGHT: Explicit null handling
const user = users.find(u => u.id === id)
if (!user) throw new NotFoundError(`User ${id}`)
if (!user.profile?.email) throw new ValidationError('Email required')
const email = user.profile.email
```

### The Local Type Duplication

```typescript
// ❌ WRONG: Creating local types that duplicate domain
interface LocalUser {
  id: string
  name: string
  email: string
}

// ✅ RIGHT: Import from domain
import type { User } from '@project/core/types/domain'
```

## Success Output

```
✅ Typecheck Fix Complete

Fixed properly: 18 errors
- 7 missing type annotations added
- 5 null handling issues fixed
- 4 type imports corrected
- 2 domain types extended

Approved escapes: 2
- webhooks/handler.ts (external payload)
- legacy/api.ts (legacy endpoint)

All escapes documented with justification.
Typecheck passes cleanly.

Next: Review changes and commit.
```

## Failure Modes

If you find yourself:

1. **Adding many `any` types** → Stop. Find proper types.
2. **Using lots of assertions** → Stop. Fix the actual types.
3. **Ignoring errors** → Stop. Understand what TS is protecting against.
4. **Creating local types** → Stop. Check domain types first.

When in doubt: Fix properly. Ask the user if unsure about approach.
