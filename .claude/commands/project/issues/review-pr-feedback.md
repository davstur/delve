# Review PR Feedback Command

You are an AI assistant tasked with analyzing feedback on a pull request and
creating an actionable response plan. Your goal is to distinguish between valid
concerns requiring changes and misunderstandings that need clarification.

## Prerequisites

1. An open pull request with review comments
2. GitHub CLI (`gh`) configured and authenticated
3. Understanding of the project's conventions and design decisions

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which may include:

- PR number (optional - e.g., "#456" or just "456")
- `--context` flag followed by additional context information
- If no PR number provided, use the most recent PR you've been working with

Examples:

```
/project:issues:review-pr-feedback           # Use current/recent PR context
/project:issues:review-pr-feedback #456      # Specific PR
/project:issues:review-pr-feedback 456       # Alternative format
/project:issues:review-pr-feedback #456 --context "This PR is part of a larger refactor to improve performance"
/project:issues:review-pr-feedback --context "We're under a tight deadline for this feature"
```

### Parsing Context Flag

When `--context` is provided, extract and incorporate the additional context
into your analysis:

```bash
# Parse arguments for context flag
if [[ "$ARGUMENTS" == *"--context"* ]]; then
  CONTEXT_INFO="${ARGUMENTS#*--context }"
  # Remove context from PR number parsing
  PR_NUMBER="${ARGUMENTS%% --context*}"
fi
```

The provided context should influence:

- How you prioritize fixes vs follow-ups
- Your understanding of design decisions
- The urgency of addressing certain feedback
- Whether certain "improvements" are actually necessary

## Efficiency Mode

**For experienced users**: You can skip to section 3 (Create Response Plan) if
you've already mentally categorized the feedback while reading it. The framework
is a guide, not a rigid requirement.

## Review Process

### 1. Determine PR and Fetch Comments

```bash
# If no PR number provided, check recent context or current branch
if [ -z "$PR_NUMBER" ]; then
  # Try to find PR for current branch
  CURRENT_BRANCH=$(git branch --show-current)
  PR_NUMBER=$(gh pr list --head "$CURRENT_BRANCH" --json number -q '.[0].number')

  if [ -z "$PR_NUMBER" ]; then
    echo "No PR number provided and no PR found for current branch"
    echo "Please specify a PR number or ensure you have an open PR"
    exit 1
  fi
fi

# Get PR details and comments
gh pr view $PR_NUMBER --json title,body,reviews,comments

# Get review comments on specific code lines
gh api repos/:owner/:repo/pulls/$PR_NUMBER/comments
```

#### Identifying AI-Generated Reviews

**Important**: Reviews from repository owners or team members may actually be
AI-generated feedback posted via automation. The AI assistant often posts under
the account of whoever initiated the review command. Look for these indicators:

- Comments mentioning AI commands like "/project:issues:review" or
  "/project:issues:preflight"
- Structured format with sections like "Strengths", "Issues to Address",
  "Follow-up Issues"
- Deep analysis metrics like "Cognitive Complexity: X/100"
- Sign-off like "Review performed using /project:issues:review"

**These AI reviews should be treated as legitimate feedback**, not self-reviews.
The issues identified are typically real and should be addressed or
acknowledged.

### 1.5 Distinguish Review Sources

Determine who actually provided the feedback:

- **Human Reviewers**: Team members with genuine concerns/suggestions
- **AI-Assisted Reviews**: Automated analysis providing systematic feedback
- **Bot Comments**: CI/CD results, deployment status (Vercel, etc.)

**Note**: AI-assisted reviews often provide valuable insights about:

- Missing tests or error handling
- Performance considerations at scale
- Architectural improvements
- Technical debt to document

Treat these as you would a thorough human review.

### 2. Pragmatic Review Triage

**Goal: Get this PR merged with low friction while maintaining quality**

#### Quick Assessment

- Total comments: <count>
- Instant fixes (< 2 min each): <count>
- Needs discussion: <count>
- Out of scope: <count>

#### A. Instant Accept Categories (Just fix, don't debate):

Review each comment and identify these - fix immediately without discussion:

- Build/CI failures
- Broken imports/exports
- Security vulnerabilities
- Accessibility violations
- Clear bugs introduced
- Convention violations with documented standards
- Typos and naming inconsistencies → **Action: Fix immediately, thank reviewer**

#### B. Context Check Categories (Reviewer might not see full picture):

For comments about potential issues or concerns:

- "This could break X" → Check: Did I test X? Is it covered?
- "What about edge case Y?" → Check: Is it handled elsewhere?
- "This seems inconsistent" → Check: Is there a pattern they missed?
- "Missing test for Z" → Check: Is it tested at integration level? → **Action:
  Either fix OR explain with specific file:line evidence**

#### C. Scope Evaluation (Protect PR focus):

Identify what's not part of this PR:

- Pre-existing issues? → "Good catch, but pre-existing. Created issue #X"
- Enhancement beyond PR goals? → "Great idea for follow-up PR"
- Style preferences without convention? → "Both approaches work. Following
  existing pattern."
- Performance optimization without metrics? → "Will benchmark if becomes
  bottleneck" → **Action: Deflect gracefully to keep PR moving**

#### D. Time/Value Matrix:

For remaining items, classify:

```
              Blocker | Not Blocker
< 2 min    →  Fix now | Fix now
2-10 min   →  Fix now | Fix if < 3 items total
> 10 min   →  Fix now | Create follow-up issue
```

### 2.5 Check Project Context

Quick context checks:

- Is this a hotfix? → Accept "good enough" fixes
- Under deadline? → Document workarounds in PR description
- Part of larger refactor? → Some inconsistencies acceptable
- Pre-production project? → Can make breaking changes

**If --context was provided:** Incorporate the additional context into your
analysis:

- Use CONTEXT_INFO to understand the broader picture
- Adjust triage priorities based on provided context
- Reference the context when explaining decisions to reviewers

### 3. Create Response Plan

Present a structured analysis:

```
📋 PR Feedback Analysis for #<pr_number>

## Context Provided
[Only show if --context was used]
<CONTEXT_INFO>

## Summary
Reviewed <X> comments from <reviewer_names>
- <Y> instant fixes (implementing now)
- <Z> need discussion/clarification
- <W> out of scope (creating follow-up issues)

## Instant Fixes (< 2 min each)

### Fixed ✅
- [Issue 1]: [What was fixed]
- [Issue 2]: [What was fixed]
- [Export missing]: Added to index.ts
- [Typo in variable name]: Renamed throughout

## Needs Discussion

### 1. [Potential Issue] - [Reviewer Name]
**Comment**: "[Quote key concern]"
**Context check**:
- ✅ Tested in [test file:line]
- ✅ Pattern established in [similar file:line]
**Response**: This is handled by [explanation with evidence]

### 2. [Design Question] - [Reviewer Name]
**Comment**: "[Quote feedback]"
**Our approach**: [Brief justification]
**Evidence**: See [file:line] for similar approved pattern

## Out of Scope (Follow-up Issues)

### 1. [Enhancement] - [Reviewer Name]
**Comment**: "[Quote suggestion]"
**Merit**: Good idea, but extends PR scope
**Action**: Will create issue #XXX after merge
**Title**: "Enhancement: [specific improvement]"

### 2. [Pre-existing Issue] - [Reviewer Name]
**Comment**: "[Quote concern]"
**Status**: Pre-existing in codebase
**Action**: Created issue #XXX to track separately

## Implementation Order

Based on the analysis, here's the recommended approach:

1. **Fix critical issues** (<estimated_time>):
   - [Issue 1]
   - [Issue 2]

2. **Post clarifying comments** (5 mins):
   - Explain [design decision 1]
   - Clarify [misunderstanding 2]

3. **Create follow-up issues** (after merge):
   - [Enhancement 1]
   - [Enhancement 2]

## Next Steps

Ready to proceed with fixes? (yes/no/discuss)

**⚠️ STOP HERE AND WAIT FOR USER RESPONSE**
Do not proceed to implementation until the user explicitly confirms.

**Success criteria before proceeding:**

- [ ] All blockers addressed
- [ ] All instant accepts completed
- [ ] Tests still pass
- [ ] Linting passes
- [ ] TypeScript checks pass

```

### 4. Execute Fixes (ONLY AFTER USER APPROVAL)

**PREREQUISITE: User must have explicitly approved the plan above.** If no
approval given, do not proceed with this section.

Once approved, implement the necessary changes:

```bash
# Create a new commit for review fixes
git add [modified files]
git commit -m "fix: address PR review feedback

- [Fix 1 description]
- [Fix 2 description]

Addresses review comments from @reviewer"

# Push changes
git push
```

### 5. Post Review Responses

Create ONE comprehensive response addressing all points:

```bash
gh pr comment <pr_number> --body "## ✅ PR Review Feedback Addressed

Thank you for the review! Here's how I've addressed each point:

### Fixed
- **[Issue 1]**: [What was changed] (commit: abc123)
- **[Issue 2]**: [What was changed] (commit: abc123)

### Clarifications
- **[Topic 1]**: [Brief explanation with context/file:line reference]
- **[Topic 2]**: [Brief explanation with context/file:line reference]

### Future Improvements
- **[Suggestion]**: Good idea! Created issue #XXX to track this

All changes implemented and tested. Ready for re-review."
```

For individual responses when needed:

```bash
# Reply to specific comment thread
gh api -X POST repos/:owner/:repo/pulls/comments/<comment_id>/replies \
  -f body="[Specific response to that comment]"
```

## Common Response Templates

### For "any" type complaints in tests:

"Using `any` for mock objects as they're test doubles that only need specific
properties for testing. Added justification comment."

### For "could be extracted" suggestions:

"Good point for future refactoring. Current implementation keeps related logic
together for clarity. Will consider extraction if this grows further."

### For "missing test" comments:

"This scenario is covered by integration test in [file:line]. The unit test
focuses on the specific business logic."

### For "prefer X over Y" style comments:

"Both approaches are valid. Current implementation follows the pattern
established in [similar_file:line]."

### For performance suggestions without metrics:

"Interesting optimization. Current implementation handles our use case
efficiently. Will benchmark if this becomes a bottleneck."

### For "this could use a library" suggestions:

"Considered using [library], but our use case is simple enough that adding a
dependency isn't warranted. Can revisit if requirements grow."

## Example Scenarios

### Scenario 1: Security Concern vs Design Choice

```
Reviewer: "This exposes user IDs in the API response - security risk!"

Analysis:
- Check: Are these internal database IDs or public UUIDs?
- If UUIDs: Explain they're designed to be public
- If DB IDs: Valid concern, needs fixing
```

### Scenario 2: Performance Suggestion

```
Reviewer: "This query could be optimized with an index"

Analysis:
- Check current query performance
- Evaluate index impact on writes
- If valid: Fix now or create follow-up issue based on severity
```

### Scenario 3: Code Style Preference

```
Reviewer: "I prefer destructuring here"

Analysis:
- Check CLAUDE.md and .claude/rules/ for style guidelines
- If no rule: Explain current approach is valid
- If rule exists: Fix to match
```

## Success Output

```
✅ PR Review Feedback Processed

Fixed:
- [Issue 1]: [What was changed]
- [Issue 2]: [What was changed]

Clarified:
- [Topic 1]: Posted explanation
- [Topic 2]: Posted explanation

Follow-up Issues Created:
- #[number]: [Enhancement title]

The PR is now ready for re-review.
Would you like to request another review? (yes/no)
```

## Tips

- **Speed over perfection**: Fix obvious issues immediately, debate later
- **Protect scope**: Don't let feature creep delay the merge
- **Evidence over arguments**: Use file:line references, not lengthy
  explanations
- **Acknowledge good catches**: Thank reviewers for valid findings, even
  pre-existing ones
- **Batch responses**: One comprehensive response is better than many small ones
- **Time-box fixes**: If fixing takes > 10 min and isn't blocking, make it a
  follow-up

Remember: The goal is to merge good code quickly, not to achieve perfection.
Reviews are iterative - this PR doesn't have to solve everything.
