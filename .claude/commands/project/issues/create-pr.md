# Create Pull Request Command

You are an experienced software developer tasked with creating a pull request
after implementation is complete. Your goal is to create a well-documented PR
that helps reviewers understand the changes and any implementation decisions.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for any commands (test, build, etc.).
If not configured, detect from lockfiles or default to `npm`.

## Prerequisites

1. Implementation is complete on a feature branch
2. All tests are passing
3. Code has been committed
4. You're not on main/master branch
5. **Recommended**: Run `/project:issues:preflight` first

### Preflight Check (Recommended)

Before creating a PR, check if preflight has been run:

```bash
# Look for breakdown file with preflight results
ISSUE_NUMBER=$(git branch --show-current | grep -oE '[0-9]+' | head -1)
BREAKDOWN_FILE=$(find docs/plans -name "*issue-${ISSUE_NUMBER}*breakdown*.md" 2>/dev/null | head -1)

if [ -n "$BREAKDOWN_FILE" ]; then
  # Check for preflight results section
  if grep -q "## Preflight Results" "$BREAKDOWN_FILE"; then
    echo "✅ Preflight results found in: $BREAKDOWN_FILE"
    # Extract and display latest preflight summary
  else
    echo "⚠️ No preflight results found. Consider running:"
    echo "   /project:issues:preflight #$ISSUE_NUMBER"
  fi
fi
```

**If preflight results exist**: Use the documented reflection and verification
results instead of re-analyzing. Display a summary:

```
📋 Found preflight results from 2026-01-25 14:32

Summary:
- Tests: ✅ Passed
- Simplify: 3 applied
- Verify: 5/5 requirements, 2 warnings

Warnings to address:
- TODO: Rate limiting (api/auth/reset.ts:89)
- Debug: console.log (services/email.ts:45)

Continue with PR creation? (y/n)
```

**If no preflight results**: Ask the user before proceeding:

```
⚠️ No preflight results found for this branch

Preflight runs quality checks before PR creation:
typecheck → lint → simplify → verify → compliance → reflect
```

Use AskUserQuestion with options:

- **Run preflight first** - Run `/project:issues:preflight` then continue with
  PR
- **Skip and create PR** - Proceed without preflight (may miss quality issues)

If user selects "Run preflight first":

1. Run `/project:issues:preflight #<issue_number>`
2. After preflight completes, continue with PR creation from Step 1

If user selects "Skip and create PR", continue with PR creation.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which may include:

- Issue number(s) (e.g., "#123" or "#123 #124 #125") - optional
- `--branch <name>` - specify branch name if not on the intended branch
- `--ready` - create as ready for review (default is draft)
- `--no-commit` or `--skip-commit` - skip automatic commit of uncommitted
  changes
- `--update` - update existing PR for current branch with fresh analysis
- `--skip-reflection` - skip the implementation reflection/workaround check

If no issue numbers provided, extract from current branch name.

Examples:

```
# Auto-detect from branch
/project:issues:create-pr

# Specify issues explicitly
/project:issues:create-pr #123
/project:issues:create-pr #123 #124 #125

# Create as ready (not draft)
/project:issues:create-pr --ready

# From specific branch
/project:issues:create-pr --branch feature/123-user-auth

# Skip automatic commit of uncommitted changes
/project:issues:create-pr --no-commit
/project:issues:create-pr --skip-commit

# Update existing PR with fresh analysis
/project:issues:create-pr --update
/project:issues:create-pr --update --ready  # Update and mark as ready

# Skip implementation reflection check
/project:issues:create-pr --skip-reflection
```

## PR Creation Process

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"PR creation in progress","command":"create-pr","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 1. Validate Environment

```bash
# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ ERROR: Cannot create PR from main/master branch"
  echo "Please switch to your feature branch first"
  exit 1
fi

# Check if --update flag is present to determine flow
if [[ "$ARGS" == *"--update"* ]]; then
  # Check for existing PR
  EXISTING_PR=$(gh pr list --head "$CURRENT_BRANCH" --json number,title,url,isDraft -q '.[0]')
  if [ -z "$EXISTING_PR" ]; then
    echo "❌ ERROR: No existing PR found for branch $CURRENT_BRANCH"
    echo "Remove --update flag to create a new PR"
    exit 1
  fi
  PR_NUMBER=$(echo "$EXISTING_PR" | jq -r '.number')
  echo "🔄 Found existing PR #$PR_NUMBER to update"
fi

# IMPORTANT: The breakdown file in docs/plans/ is a living document that tracks
# planning, implementation decisions, review findings, and preflight results.
# It MUST always be committed with the PR — never exclude it.
# Before committing, ensure the breakdown file is up to date (status fields,
# completed items, session log, etc.).

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  # Check if --no-commit or --skip-commit flag is present
  if [[ "$ARGS" == *"--no-commit"* ]] || [[ "$ARGS" == *"--skip-commit"* ]]; then
    echo "⚠️  You have uncommitted changes (skipping commit due to --no-commit/--skip-commit flag)"
    echo "Files with uncommitted changes:"
    git status --short
  else
    echo "📝 Found uncommitted changes. Committing all remaining files..."

    # Show what will be committed
    echo "Files to commit:"
    git status --short

    # Add all changes (including docs/plans/ breakdown file)
    git add -A

    # Commit with a descriptive message
    # If Sentry issue IDs were found in step 2.1, append them to the commit
    # message body so Sentry's GitHub integration auto-resolves the issues.
    # Example: git commit -m "feat: Complete implementation for PR
    #
    # Fixes STUDIO-G"
    git commit -m "feat: Complete implementation for PR" || {
      echo "⚠️  No changes to commit or commit failed"
    }
  fi
fi

# Ensure branch is pushed
echo "🚀 Pushing branch to remote..."
git push -u origin "$CURRENT_BRANCH" 2>/dev/null || git push
```

### 2. Extract Issue Information

```bash
# Extract issue numbers from branch name or arguments
if [ -z "$ISSUE_NUMBERS" ]; then
  # Extract from branch (e.g., feature/123-description or feature/123-124-125-description)
  ISSUE_NUMBERS=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+' | head -5)
fi

# Fetch issue details for each
for issue in $ISSUE_NUMBERS; do
  gh issue view $issue --json title,body,labels
done
```

### 2.1 Detect Sentry Issue References

After fetching issue details in step 2, check if any issue carries the
`sentry-issue` label. If so:

1. Read the issue body for a **Sentry Cleanup** section (pattern:
   `Fixes [PROJECT-ID]`, e.g., `Fixes STUDIO-G`, `Fixes STUDIO-42`)
2. Extract all Sentry issue IDs (one or more, comma-separated is also valid:
   `Fixes STUDIO-Q, STUDIO-Y, STUDIO-J`)
3. Store these IDs — they will be included in both the **PR body** (step 5) and
   the **commit message**. If a commit was already created in step 1 before
   Sentry IDs were discovered, amend it to add the Sentry trailer:
   `git commit --amend -m "$(git log -1 --format=%B)" -m "Fixes STUDIO-X"`

If no `sentry-issue` label is found, skip this step entirely.

### 3. Implementation Reflection (Blocking Check)

Before creating the PR, reflect on the implementation work and identify any
workarounds or compromises that may need discussion.

**Note:** This step is skipped if `--skip-reflection` flag is provided.

#### 3.1 Gather Context

Review your implementation context:

- Your conversation history during this implementation
- The breakdown file in `docs/plans/` (if one exists for this issue)
- The actual code changes made (`git diff main...HEAD`)

#### 3.2 Identify Workarounds & Compromises

Ask yourself: During implementation, did I make any decisions that:

1. **May not capture true business intent** - e.g., fallback logic that assumes
   behavior, FK constraints that might need different ON DELETE behavior
2. **A senior architect might handle differently** - e.g., manual cleanup that
   should be a cascade, tight coupling that could be decoupled
3. **Are pragmatic shortcuts** - e.g., hardcoded values, skipped edge cases,
   simplified error handling
4. **Deviate from stated requirements** - even if for good reason

For each identified item, note:

- What the workaround is
- Why you implemented it this way
- What a cleaner approach might look like

#### 3.3 Check for Prior Confirmation

For each workaround identified, check:

- Was this explicitly discussed with the user during implementation?
- Did the user confirm this approach was acceptable?
- Is it documented in the issue or breakdown?

#### 3.4 Pause if Unconfirmed Workarounds Exist

**If you have unconfirmed workarounds, STOP and present them to the user:**

```
⚠️  Implementation Reflection - Workarounds Identified

Before creating the PR, I want to flag some implementation decisions that
may warrant discussion:

1. **[Short description]**
   - What I did: [explanation]
   - Cleaner approach: [what a senior architect might prefer]

2. **[Short description]**
   - What I did: [explanation]
   - Cleaner approach: [what a senior architect might prefer]

How would you like to proceed?
- A) Address these now before creating the PR
- B) Include them as known items in the PR description for reviewer awareness
- C) They're fine as-is, proceed without noting them
```

**Wait for user response before continuing.**

If the user chooses (A), help them address the issues first, then restart this
command.

If the user chooses (B), include the workarounds in the "Implementation
Decisions" section of the PR description.

If the user chooses (C), proceed without special documentation.

#### 3.5 Check Test Results

```bash
# Look for recent test runs
npm test --summary 2>/dev/null || echo "No test summary available"
```

### 4. Gather Manual Testing Results

Look for manual testing evidence:

- Screenshots in common locations
- Test result documentation
- Performance metrics

```bash
# Check for test evidence
find . -name "*.png" -o -name "*.jpg" -o -name "test-results.*" | grep -E "(screenshot|test)" | head -10
```

### 5. Build PR Description

Create comprehensive PR description with:

```markdown
## Description

[Brief summary of implementation]

Closes #[issue_number]

**IMPORTANT**: When closing multiple issues, each MUST have its own `Closes` or
`Fixes` keyword on a **separate line**:
```

Closes #100 Closes #101 Closes #102

```

**INCORRECT** — these will NOT reliably close issues:
```

Closes #100, #101, #102 Closes #100 Closes #101 Closes #102

````

**If Sentry issue IDs were found in step 2.1**, add a Sentry Cleanup section
right after the `Closes` lines (omit this section entirely if no Sentry IDs):

```markdown
## Sentry Cleanup

Fixes STUDIO-G

(Auto-resolves linked Sentry issues on merge)
````

For multiple Sentry issues, list them comma-separated on one line:

```markdown
## Sentry Cleanup

Fixes STUDIO-Q, STUDIO-Y, STUDIO-J

(Auto-resolves linked Sentry issues on merge)
```

## Changes

- [List key changes made]
- [Organized by component/area]

## Testing

### Automated Tests

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Coverage: X%

### Manual Testing Results

[Copy from issue's manual testing checklist with actual results]

## Notes for Reviewers

### Implementation Decisions

[Key architectural or design decisions made during implementation]

### Known Workarounds & Compromises

[If any were identified during reflection and user chose to document them]

- **[Workaround]**: [What was done] → [What cleaner approach might exist]

### Areas Requiring Special Attention

- **[Area]**: [What to review carefully and why]

### Technical Debt Created

[If any, with follow-up tickets if created]

## Screenshots/Evidence

[If applicable]

```

### 6. Create or Update the Pull Request

**REQUIRED PR Title Format:**

```

feat: <Descriptive title summarizing the changes> (#<issue_numbers>)

````

- Title must describe **what** the PR does, not just reference issue numbers
- Issue number(s) go in parentheses at the end, comma-separated if multiple
- For single issue: use the issue title or a clear summary
- For multiple issues: write a title that captures the combined scope

Examples:

- `feat: Add user authentication flow (#123)` ✅
- `feat: Add subscription management (#123, #124, #125)` ✅
- `feat: Implement issues #123, #124, #125` ❌ (not descriptive)
- `feat: Add auth flow` ❌ (missing issue number)

The descriptive title and issue number(s) in parentheses are both **mandatory**.

```bash
# Check if updating existing PR
if [[ "$ARGS" == *"--update"* ]]; then
  echo "📝 Updating existing PR #$PR_NUMBER..."

  # Update PR body with fresh analysis
  gh pr edit $PR_NUMBER --body "$PR_BODY"

  # Update draft/ready status if specified
  if [[ "$ARGS" == *"--ready"* ]]; then
    gh pr ready $PR_NUMBER
    echo "✅ Marked PR #$PR_NUMBER as ready for review"
  fi

  # Get PR URL for output
  PR_URL=$(gh pr view $PR_NUMBER --json url -q .url)

else
  # Create new PR (always as draft unless --ready flag is provided)
  DRAFT_FLAG="--draft"
  if [[ "$ARGS" == *"--ready"* ]]; then
    DRAFT_FLAG=""
  fi

  # Create PR title - MUST be descriptive with issue number(s) in parentheses
  # Format: feat: <Descriptive title> (#123) or (#123, #124, #125)
  ISSUE_NUMS_FORMATTED=$(echo $ISSUE_NUMBERS | sed 's/ /, #/g' | sed 's/^/#/')

  if [ ${#ISSUE_NUMBERS[@]} -eq 1 ]; then
    # Single issue - use issue title
    ISSUE_TITLE=$(gh issue view $ISSUE_NUMBERS --json title -q .title)
    PR_TITLE="feat: $ISSUE_TITLE (#$ISSUE_NUMBERS)"
  else
    # Multiple issues - summarize the combined scope (DO NOT just list issue numbers)
    # Fetch titles and create a descriptive summary
    PR_TITLE="feat: <summarize combined scope of all issues> ($ISSUE_NUMS_FORMATTED)"
  fi

  # Create the PR
  PR_URL=$(gh pr create $DRAFT_FLAG \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main)

  PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')
fi
````

## Success Output

**⚠️ MANDATORY**: Use this exact output format. Do not customize or skip steps.

For new PR:

```
✅ Pull Request created successfully!

📝 PR #456: [Title]
🔗 URL: https://github.com/owner/repo/pull/456
📊 Status: Draft (or Ready for review)
🎯 Implements: #123, #124, #125

✨ Included:
- [Summary of what the PR contains]

Next steps:
1. Run `/project:issues:review` for external model bug-finding ← ALWAYS include this
2. Wait for CI checks to pass
3. Address any findings/failures
4. Mark as ready and request human reviews
```

For updated PR:

```
✅ Pull Request updated successfully!

📝 PR #456: [Title]
🔗 URL: https://github.com/owner/repo/pull/456
📊 Status: Draft (or Ready for review)
🎯 Implements: #123, #124, #125

✨ Updated with:
- [Summary of what changed]

Next steps:
1. Run `/project:issues:review` for external model bug-finding ← ALWAYS include this
2. Wait for CI checks to pass
3. Address any findings/failures
4. Notify reviewers of updates if needed
```

## Error Handling

- **No feature branch**: Guide to create branch first
- **Uncommitted changes**: List files and suggest commit
- **No issues detected**: Ask user to specify
- **PR already exists**: Show existing PR URL (when not using --update)
- **No PR exists for --update**: Error message to remove --update flag

**Update workflow status** (after PR is created/updated successfully):

```bash
mkdir -p .workflow && echo '{"phase":"Ready for review","command":"create-pr","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

## Tips

- Always create as draft first to let CI run
- Include screenshots for UI changes
- Reference specific test files in PR description
- Tag relevant reviewers based on code areas
