# Code Quality Check Command

You are a meticulous software engineer performing a complete code quality check.
This command runs **typecheck first, then lint**, fixing all issues to the
highest quality standard.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands below. If not
configured, detect from lockfiles or default to `npm`.

## Core Philosophy

**Proper fixes over workarounds. Always.**

This command combines:

1. `/project:quality:typecheck` - Fix all type errors properly
2. `/project:quality:lint` - Fix all lint errors properly
3. Additional quality checks (with `--full`) - Discover and run checks from
   pre-commit hooks, CI/CD, and package.json scripts

All phases follow the same quality standards:

- Real fixes, not escape hatches
- Use existing patterns, extend when needed
- Collect exceptions for user approval
- **Collect ambiguities for user decision** - When facing unclear situations
  (multiple valid approaches, unclear intent, potential side effects), don't
  guess. Track these alongside exceptions and present them for user decision
  before applying any fix.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- `--scope "package"` - Focus on specific package/directory
- `--strict` - Fail on any exceptions (CI mode)
- `--checkpoint` - Pause for approval when exceptions found in each phase
- `--typecheck-only` - Run only typecheck phase
- `--lint-only` - Run only lint phase
- `--full` - After typecheck+lint, discover and run additional quality checks
- `--auto` - With `--full`, run all discovered checks without prompting

Examples:

```
/project:quality:code-check                    # Full check: typecheck → lint
/project:quality:code-check --scope "core"     # Check specific package
/project:quality:code-check --strict           # No exceptions allowed (CI)
/project:quality:code-check --checkpoint       # Pause between phases if exceptions
/project:quality:code-check --typecheck-only   # Just typecheck
/project:quality:code-check --lint-only        # Just lint
/project:quality:code-check --full             # Discover and run additional checks
/project:quality:code-check --full --auto      # Run all discovered checks automatically
```

**Default behavior**: Run both phases, fix everything properly, then present all
exceptions for approval at the end.

## Code Check Process

### Phase 1: Typecheck

Run the typecheck phase following `/project:quality:typecheck` standards:

```bash
pnpm typecheck 2>&1
```

**Fix all type errors using proper types:**

- Category A: Fix immediately with proper types
- Category B: Extend domain types, then fix
- Category C: Track for approval (rare - only for genuine gaps)

**Iterate until typecheck passes** (or only Category C remains).

Track all Category C exceptions found during this phase.

### Phase 2: Lint

After typecheck passes, run the lint phase following `/project:quality:lint`
standards:

```bash
pnpm lint 2>&1
```

**Fix all lint errors properly:**

- Category A: Fix immediately (remove unused, use correct patterns)
- Category B: Extend repositories/utils, then fix
- Category C: Track for approval (rare - only for justified suppressions)

**Iterate until lint passes** (or only Category C remains).

Track all Category C exceptions found during this phase.

### Phase 2.5: Discover Additional Checks (with `--full`)

**Skip this phase unless `--full` flag is set.**

After typecheck and lint pass (or only Category C remains), offer to discover
additional quality checks:

```
✅ Typecheck: Passed (12 errors fixed, 1 escape pending)
✅ Lint: Passed (8 errors fixed, 2 suppressions pending)

Would you like to discover and run additional quality checks?
This will scan package.json, pre-commit hooks, and CI configs.

[y] Yes, discover checks
[n] No, proceed to exception approval
```

If user selects "y" (or `--auto` flag is present), proceed to Phase 3. If user
selects "n", skip to Phase 4 (Combined Exception Approval).

### Phase 3: Run Discovered Quality Checks

**Prerequisites**: `--full` flag AND (user confirmed OR `--auto` flag).

#### Step 3.1: Discover Available Checks

**Handle discovery ambiguities**: When scanning, you may encounter unclear
situations. Don't guess - track these for user decision:

- Scripts with unclear purpose (e.g., `check:all` - does it include typecheck?)
- Multiple similar scripts (e.g., `test`, `test:unit`, `test:all` - which to
  run?)
- CI jobs that may duplicate local checks
- Pre-commit hooks with complex logic

Present these ambiguities alongside discovered checks for user clarification.

Scan the following sources in order:

**A. Package.json Scripts**

Look for scripts matching these patterns (exclude already-run typecheck/lint):

- `test`, `test:*` - Test suites
- `format`, `format:check`, `prettier` - Formatting
- `check`, `check:*` - Various checks
- `build`, `build:*` - Build verification
- `validate`, `audit` - Security/dependency checks

**B. Pre-commit Hooks**

Check `.husky/pre-commit` and `.pre-commit-config.yaml` for quick checks.

**C. CI/CD Configurations**

Check `.github/workflows/*.yml` for quality-related jobs.

#### Step 3.2: Present Discovered Checks

```
## Discovered Quality Checks

Based on your project configuration, I found these additional checks:

### Quick Checks (fast, safe to run)
| # | Source | Check | Command |
|---|--------|-------|---------|
| 1 | package.json | Format check | pnpm format:check |
| 2 | .husky/pre-commit | Lint-staged | npx lint-staged |

### Test Suites (may take longer)
| # | Source | Check | Command |
|---|--------|-------|---------|
| 3 | package.json | Unit tests | pnpm test |
| 4 | package.json | E2E tests | pnpm test:e2e |

### Build Verification
| # | Source | Check | Command |
|---|--------|-------|---------|
| 5 | package.json | Build | pnpm build |

---

### Ambiguities (need your input)

**A. Test script overlap**
Found both `test` and `test:unit`. Does `test` run all tests or just unit tests?
→ Should I run: (a) just `test`, (b) just `test:unit`, (c) both?

**B. CI check duplication**
CI workflow runs `pnpm check:all`. Does this duplicate typecheck/lint already run?
→ Should I: (a) skip it, (b) run it anyway, (c) you tell me what it does?

---

**Select checks to run:**

- `a` - Run all checks (1-5)
- `q` - Quick checks only (1-2)
- `t` - Tests only (3-4)
- `1,3,5` - Specific checks by number
- `n` - Skip, proceed to exception approval

Also answer ambiguities A, B above (e.g., "A:a, B:c it runs security audit only")
```

**If `--auto` flag is present**, skip ambiguous checks and run only clearly
understood ones. Report skipped ambiguities in the summary.

#### Step 3.3: Execute Selected Checks

For each selected check, follow the appropriate fix loop:

**A. Auto-fixable Checks (Format, etc.)**

```bash
# Run check
pnpm format:check 2>&1

# If errors found, run auto-fix
pnpm format

# Re-verify
pnpm format:check 2>&1
```

**B. Non-fixable Checks (Tests, Build)**

For checks that cannot be auto-fixed, report failures and pause for user:

```
### Test Results - Action Required

❌ pnpm test failed with 3 errors

**Failed Tests:**

1. `src/utils/date.test.ts:45` - formatDate handles null
2. `src/api/user.test.ts:123` - createUser validates email
3. `src/api/user.test.ts:156` - createUser handles duplicate

---

**Options:**
- [r] I've fixed the issues, re-run tests
- [s] Skip tests (will note in final report)
- [v] View full test output

What would you like to do?
```

Track any skipped checks for the final report.

#### Step 3.4: Discovered Checks Summary

```
### Phase 3 Complete - Discovered Checks Summary

| Check | Status | Notes |
|-------|--------|-------|
| pnpm format:check | ✅ Passed | Auto-fixed 5 files |
| npx lint-staged | ✅ Passed | — |
| pnpm test | ⚠️ Skipped | 3 failures (user deferred) |
| pnpm build | ✅ Passed | — |

Proceeding to exception approval...
```

### Phase 4: Combined Exception and Ambiguity Approval

Present ALL exceptions AND ambiguities from all phases for user decision:

```
## Code Quality Check Complete - Decisions Required

### Summary

| Phase     | Fixed Properly | Pending Exceptions | Ambiguities |
|-----------|----------------|-------------------|-------------|
| Typecheck | 18 errors      | 2 escapes         | 1 decision  |
| Lint      | 23 errors      | 3 suppressions    | 0           |
| Discovered| 4 checks run   | —                 | 2 decisions |
| **Total** | **41 errors**  | **5 exceptions**  | **3 decisions** |

---

### Ambiguities (decisions needed before fixes)

#### A. Type approach choice (packages/api/src/handlers/webhook.ts:89)

**Context**: Handler receives `event.data` which could be typed as:
- Option 1: `unknown` with runtime validation (safer, more verbose)
- Option 2: Generic `WebhookPayload<T>` (cleaner, requires type param)
- Option 3: Union of known payload types (strictest, may miss new types)

**My recommendation**: Option 2 with runtime validation fallback
→ Which approach do you prefer?

#### B. Import organization (multiple files)

**Context**: Found mixed import styles - some files group by source, others alphabetize.
**Options**: (a) Alphabetize all, (b) Group by source, (c) Leave as-is
→ Which style should I apply?

#### C. Test coverage gap (from discovered checks)

**Context**: `pnpm test` passes but coverage dropped from 80% to 72%.
**Options**: (a) Add tests now, (b) Create issue and proceed, (c) Ignore for now
→ How should I handle this?

---

### Type Escapes (from typecheck phase)

#### 1. Webhook Payload (packages/api/src/webhooks/handler.ts:45)

**What**: `@ts-expect-error` for dynamic webhook payload
**Why**: External webhook providers send varying JSON structures
**Runtime safety**: Validated by `validateWebhook()` before use

#### 2. Legacy API Response (packages/core/src/legacy/api.ts:123)

**What**: `any` type for legacy endpoint
**Why**: Legacy endpoint returns unstructured JSON
**Migration plan**: Will be replaced (Issue #456)

---

### Lint Suppressions (from lint phase)

#### 3. Test Utilities (packages/test-utils/src/db-helpers.ts)

**What**: File-level `no-restricted-properties` suppression
**Why**: Test setup/teardown needs raw DELETE/INSERT operations
**Justification**: Infrastructure code, not domain code

#### 4. Change Detection (packages/beekeeper/src/sync/change-detection.ts)

**What**: File-level `no-restricted-properties` suppression
**Why**: Bulk comparison queries for sync operations
**Alternative**: Could add repository methods (more work, cleaner)

#### 5. Migration Script (packages/db/src/migrations/001-initial.ts)

**What**: Direct DB queries
**Why**: One-time migration, repositories didn't exist yet

---

### Please Confirm

**Ambiguities:**
- [ ] Decision A: Type approach → ___
- [ ] Decision B: Import style → ___
- [ ] Decision C: Coverage gap → ___

**Exceptions:**
- [ ] Approve type escape #1 (webhook payload)
- [ ] Approve type escape #2 (legacy API)
- [ ] Approve suppression #3 (test utilities)
- [ ] Approve suppression #4 (change detection) - or prefer repository methods?
- [ ] Approve suppression #5 (migration script)

Or specify alternatives for any you'd like handled differently.
```

### Phase 5: Apply Decisions and Approved Exceptions

After user approval:

1. Apply user decisions for ambiguities first (these may affect fixes)
2. Add ONLY the approved exceptions (both type escapes and lint suppressions)
3. Re-run all checks to verify clean:
   ```bash
   pnpm typecheck && pnpm lint
   ```
4. Commit with comprehensive message

```bash
git add -A && git commit -m "fix: Resolve all type and lint errors with proper fixes

Typecheck (18 errors fixed):
- Added proper types for API responses
- Extended Order type with status field
- Fixed null handling in user service

Lint (23 errors fixed):
- Removed unused imports across 8 files
- Used repository pattern for DB access
- Corrected eslint rule names

Approved exceptions (5 total):
Type escapes:
- webhooks/handler.ts: External payload, runtime validated
- legacy/api.ts: Legacy endpoint, pending migration

Lint suppressions:
- test-utils/db-helpers.ts: Test infrastructure
- sync/change-detection.ts: Bulk sync operations
- migrations/001-initial.ts: One-time migration

All exceptions approved by user."
```

## Quality Checklist

Before considering code check complete:

- [ ] **Typecheck passes**: `pnpm typecheck` exits cleanly
- [ ] **Lint passes**: `pnpm lint` exits cleanly
- [ ] **No lazy `any`**: Each `any` has justification
- [ ] **No lazy suppressions**: Each `eslint-disable` has justification
- [ ] **Domain types used**: No local types when central types exist
- [ ] **Repository pattern followed**: No direct DB access when repos exist
- [ ] **User approved all exceptions**: Every exception explicitly approved
- [ ] **Discovered checks addressed** (if `--full`): All selected checks pass or
      are explicitly deferred

## Success Output

### Default (without `--full`)

```
✅ Code Quality Check Complete

Typecheck:
- Fixed properly: 18 type errors
- Approved escapes: 2

Lint:
- Fixed properly: 23 lint errors
- Approved suppressions: 3

Total: 41 issues fixed, 5 exceptions (user approved)

All checks pass:
✅ pnpm typecheck
✅ pnpm lint

Ready for commit.
```

### With `--full` flag

```
✅ Code Quality Check Complete

Core Checks:
- Typecheck: 18 errors fixed, 2 approved escapes
- Lint: 23 errors fixed, 3 approved suppressions

Discovered Checks:
- pnpm format:check: ✅ Auto-fixed 5 files
- npx lint-staged: ✅ Passed
- pnpm test: ⚠️ 3 failures (deferred - see #123)
- pnpm build: ✅ Passed

Summary: 41 issues fixed, 5 exceptions approved, 1 check deferred

All passing checks:
✅ pnpm typecheck
✅ pnpm lint
✅ pnpm format:check
✅ pnpm build

Deferred items:
⚠️ pnpm test (3 failures) - Track in issue before merge

Ready for commit (with noted deferrals).
```

## Failure Modes

If you find yourself:

1. **Many type escapes** → Stop. Types exist, find them.
2. **Many lint suppressions** → Stop. Proper patterns exist.
3. **Skipping validation** → Stop. Run both checks.
4. **Not waiting for approval** → Stop. User must confirm exceptions.
5. **Skipping all discovered checks** (with `--full`) → Pause. Consider if
   checks are valuable before skipping all.
6. **Build failing repeatedly** → Stop. May indicate deeper issues that need
   investigation.

When in doubt: Fix properly. Ask the user if unsure.

## Alternative: Separate Commands

For focused work, use the individual commands:

```
/project:quality:typecheck    # Just fix types
/project:quality:lint         # Just fix lint
```

Use this combined command for comprehensive pre-commit/pre-PR checks.
