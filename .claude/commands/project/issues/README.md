# Issue Commands

Commands for managing GitHub issues from suggestion through implementation.

## GitHub CLI Reference

These commands extensively use GitHub CLI (`gh`). For command patterns and
troubleshooting:

- [`../github-cli-reference.md`](../github-cli-reference.md) - Complete GitHub
  CLI reference for this workflow

## Available Commands

### `/project:issues:suggest`

Suggests issues based on milestone or feature context.

**Usage:**

```
/project:issues:suggest "For milestone Authentication"
/project:issues:suggest "For implementing user profiles"
```

**Arguments:**

- Context (required) - Milestone name or feature description

**Output:**

- Groups issues as must-have vs nice-to-have
- Shows dependencies between issues
- Provides copy-paste ready commands

---

### `/project:issues:create`

Creates comprehensive GitHub issues with deep research.

**Usage:**

```
/project:issues:create "Add user authentication"
/project:issues:create "Login API" "Signup API" "Password reset"
```

**Arguments:**

- Issue titles (required) - One or more issue descriptions

**Flags:**

- `--milestone "name"` - Link to specific milestone
- `--story "name"` - Link to active user story
- `--research none|light|normal|deep` - Control research depth (default: normal)
- `--no-prioritize` - Skip automatic prioritization (by default, all issues are
  prioritized)
- `--context "text"` - Additional context that may trigger clarifying questions
- `--draft` - Create as draft issue (implies --research none and
  --no-prioritize)

**Features:**

- **Automatic prioritization** - Issues are prioritized by default based on
  roadmap alignment
- **Smart clarifications** - Asks upfront questions for fundamental decisions
  (app structure, user flows)
- **Deep research** - Analyzes codebase patterns and generates implementation
  plans
- **Draft mode** - Quickly capture ideas as placeholder issues for later
  refinement
- **Manual testing checklists** - Generates comprehensive test scenarios for
  each issue

**Examples:**

```
# Create with milestone (auto-prioritized)
/project:issues:create "Add login" --milestone "Auth" --research deep

# Multiple issues without prioritization
/project:issues:create "Fix typo" "Update README" --no-prioritize

# With context that may trigger clarifications
/project:issues:create "Add admin dashboard" --context "Check docs/architecture/README.md for admin portal plans"

# Draft issues for future work
/project:issues:create "Design System" --draft --milestone "UI Foundation"

# Quick task
/project:issues:create "Update deps" --research none --no-prioritize
```

---

### `/project:issues:breakdown-feature`

Breaks down issues or features into value-driven mini user stories.

**Usage:**

```
/project:issues:breakdown-feature #123
/project:issues:breakdown-feature #123 #124 #125
/project:issues:breakdown-feature --milestone "Authentication Core"
/project:issues:breakdown-feature "Add search functionality"
```

**Arguments:**

- Issue numbers - Specific issues to break down
- Feature description - Direct description of feature to analyze

**Flags:**

- `--milestone "name"` - Break down all issues in milestone
- `--research none|light|normal|deep` - Research depth (default: normal)
- `--format table|stories|both` - Output format (default: both)
- `--skip-status-check` - Skip checking implementation status (checks by
  default)
- `--no-bounce` - Skip expert review after plan generation

**Output:**

- Mini user stories with acceptance criteria
- Priority categorization (Must/Should/Nice to Have)
- Progress tracking with acceptance test results
- User feedback and scope change documentation
- Implementation phases based on dependencies

**Features:**

- Creates a **living document** for feature lifecycle tracking
- Tracks acceptance criteria completion
- Documents user feedback and scope changes
- Compares actual vs estimated effort
- Identifies all potential value beyond requirements
- Suggests logical groupings for implementation
- Saves breakdown to `docs/plans/` as single source of truth

---

### `/project:issues:breakdown-technical`

Breaks down technical/infrastructure work into implementation blocks with
dependencies.

**Usage:**

```
/project:issues:breakdown-technical #159
/project:issues:breakdown-technical "API authentication refactor"
/project:issues:breakdown-technical #234 --research deep
```

**Arguments:**

- Issue numbers - Specific technical issues to break down
- Description - Direct description of technical work

**Flags:**

- `--research none|light|normal|deep` - Research depth (default: normal)
- `--format table|blocks|both` - Output format (default: both)
- `--skip-status-check` - Skip checking existing implementations (checks by
  default)
- `--no-bounce` - Skip expert review after plan generation

**Output:**

- Implementation blocks with testable milestones
- Decision points highlighted with 📌 markers
- Quality gates between phases
- Quick verification commands for each phase
- Dependency graph showing parallel/sequential work
- Status tracking of existing components (automatic)
- Risk assessment and mitigation strategies
- Fallback options for each phase

**Features:**

- Creates a **living document** for continuous progress tracking
- Focuses on technical deliverables with testable outcomes
- Highlights decision points needing stakeholder input
- Provides quality gates with verification commands
- Maps dependencies for optimal parallel development
- Tracks implementation progress, decisions, and discoveries
- Enables seamless handoffs between sessions/developers
- Highlights technical risks with fallback strategies
- Saves breakdown to `docs/plans/` as single source of truth

---

### `/project:issues:prioritize`

Manages issue priorities based on roadmap alignment.

**Usage:**

```
/project:issues:prioritize #123
/project:issues:prioritize #123 #124 #125
/project:issues:prioritize --review
/project:issues:prioritize --status
```

**Arguments:**

- Issue numbers - Specific issues to prioritize

**Flags:**

- `--review` - Review all open issues for priority adjustments
- `--status` - Show current priority distribution
- `--context "text"` - Add context for priority decision

**Priority Levels:**

- 🔴 Critical - Drop everything
- 🟠 High - Next sprint
- 🟡 Medium - Important but not urgent
- 🟢 Low - Someday/maybe

---

### `/project:issues:flesh-out`

Completes draft issues with comprehensive research.

**Usage:**

```
/project:issues:flesh-out #123
```

**Arguments:**

- Issue number (required) - Issue to enhance

**Prerequisites:**

- Issue should have 📝 draft label
- References `/project:issues:create` template

---

### `/project:issues:update`

Updates existing issues with new information.

**Usage:**

```
/project:issues:update #123 "Add support for bulk operations"
```

**Arguments:**

- Issue number (required) - Issue to update
- Update description (required) - What to add/change

**Process:**

- Maintains issue structure
- Adds update history
- Adjusts affected sections

---

### `/project:issues:review-pr-feedback`

Analyzes PR review comments and creates an actionable response plan.

**Usage:**

```
/project:issues:review-pr-feedback         # Use current PR context
/project:issues:review-pr-feedback #456    # Specific PR
```

**Arguments:**

- PR number (optional) - Defaults to current branch's PR or recent context

**Process:**

1. Fetches and analyzes all review comments
2. Categorizes feedback (valid fixes, clarifications, already addressed)
3. Creates implementation plan for valid concerns
4. Drafts professional responses for misunderstandings
5. Identifies good suggestions for future issues

**Output:**

- Structured analysis of all feedback
- Clear action items with priority
- Ready-to-post clarifying responses
- Follow-up issue suggestions

---

### `/project:issues:implement`

Implements one or more issues as code.

**Usage:**

```
/project:issues:implement #123
/project:issues:implement #123 #124 #125
/project:issues:implement --milestone "Authentication"
```

**Arguments:**

- Issue numbers - Specific issues to implement

**Flags:**

- `--milestone "name"` - Implement issues from milestone (AI groups)
- `--context "text"` - Implementation guidance

**Prerequisites:**

- Issues must be in "Ready" status (human reviewed and prepared)
- No blocking labels (draft, needs-clarification, etc.) and no native blocking
  relationships

**Process:**

1. Validates issue readiness
2. For milestones: groups related issues
3. Implements code with tests
4. Executes manual testing checklist from issue
5. Creates pull request with test results

---

### `/project:issues:preflight`

Complete pre-PR quality check orchestrating all quality tools.

**Usage:**

```
/project:issues:preflight #123              # Full preflight for issue #123
/project:issues:preflight                   # Preflight without issue verification
/project:issues:preflight --with-tests      # Include local test run
/project:issues:preflight --skip-simplify   # Skip simplification step
/project:issues:preflight --skip-compliance  # Skip compliance check
/project:issues:preflight --strict          # Fail on any warnings
```

**Arguments:**

- Issue number (optional) - Issue to verify against

**Flags:**

- `--with-tests` - Include test run (tests run in CI/CD by default)
- `--skip-simplify` - Skip the simplification step
- `--skip-verify` - Skip the verification step
- `--skip-compliance` - Skip the compliance check step
- `--strict` - Treat any warning as failure

**Process:**

```
typecheck → lint → simplify → [re-check] → verify → compliance → reflect
```

1. **Typecheck** - Catch type errors
2. **Lint** - Fix style issues (auto-fix enabled)
3. **Simplify** - Clean up code (code-simplifier agent)
4. **Re-check** - Typecheck & lint again if simplify made changes
5. **Verify** - Check requirements coverage (verify-implementation agent)
6. **Compliance** - Check against PLATFORM.md principles, rules, and skill
   patterns
7. **Reflect** - Summary of all changes for human review

**Output:**

- Step-by-step status with issues found
- Simplifications applied and skipped
- Verification warnings
- Compliance violations and evolution candidates
- Reflection summary for PR review

---

### `/project:issues:bounce`

Validates plans with an external model to catch unknown unknowns.

**Usage:**

```
/project:issues:bounce                                    # Bounce current context
/project:issues:bounce "Should we use JWT or sessions?"   # Specific question
/project:issues:bounce docs/plans/breakdown.md             # Bounce a plan file
```

**Arguments:**

- Topic or question (optional) - Defaults to conversation context
- Path to plan file (optional) - Bounce a specific breakdown

**Flags:**

- `--one-iteration` - Single bounce, no back-and-forth (default: iterates to
  agreement)
- `--context "text"` - Additional context to include
- `--deep` - Use higher reasoning from start
- `--model <name>` - Model to use (default: codex)

**Process:**

1. Extracts topic/plan from input or conversation context
2. Builds contextualized prompt with codebase patterns
3. Sends to external model for validation
4. Iterates until agreement or soft cap (5 rounds)
5. Presents summary with agreed points and decisions needed

**Output:**

- Agreed points with reasoning
- Decisions requiring user input
- Unknown unknowns surfaced
- Model suggestions being skipped (with rationale)

---

### `/project:issues:review`

Bug-finding review loop powered by an external model.

**Usage:**

```
/project:issues:review                              # Full review loop vs main
/project:issues:review --base develop               # Review against develop
/project:issues:review --one-iteration              # Single pass, no loop
```

**Arguments:**

- None (reviews current branch changes)

**Flags:**

- `--base <branch>` - Branch to diff against (default: main)
- `--one-iteration` - Single review pass, no loop (default: loops until clean)
- `--context "text"` - Custom context for assessment
- `--model <name>` - Model to use (default: codex)

**Process:**

1. External model reviews diff (unbiased, no custom prompt)
2. Claude assesses findings against codebase context
3. Challenges disagreements with model
4. Implements agreed fixes
5. Re-reviews until clean or hard cap (10 iterations)

**Output:**

- Issues fixed (with file:line references)
- Disagreed items (user decides)
- Not applicable suggestions (with rationale)

---

### `/project:issues:create-pr`

Creates a pull request for the current branch.

**Usage:**

```
/project:issues:create-pr                    # Create PR for current branch
/project:issues:create-pr #123               # Link to specific issue
/project:issues:create-pr #123 #124          # Link to multiple issues
```

**Arguments:**

- Issue numbers (optional) - Issues this PR addresses

**Flags:**

- `--draft` - Create as draft PR
- `--base <branch>` - Target branch (default: main)

**Process:**

1. Validates branch has commits ahead of base
2. Generates PR title and description from commits/issues
3. Links related issues
4. Creates PR with proper formatting

## Issue Lifecycle

```
suggest → create → breakdown (with bounce) → implement → preflight → create-pr → review → review-pr-feedback
         ↓              ↓
     draft → flesh-out  ├─ breakdown-feature (user value)
         ↓              └─ breakdown-technical (implementation)
    existing → update
```

**Typical implementation flow:**

1. **suggest/create** - Define the work
2. **breakdown** - Plan approach (auto-bounces with external model)
3. **implement** - Write code and tests
4. **preflight** - Quality checks (typecheck, lint, simplify, verify,
   compliance)
5. **create-pr** - Commit, push, create PR (anchor point)
6. **review** - External model bug-finding loop (on committed code)
7. **review-pr-feedback** - Address human reviewer comments

Note: Issues are automatically prioritized during creation unless
`--no-prioritize` is used.

## Label System

**Priority Labels:**

- `critical 🔴` - Required immediately
- `high 🟠` - High value, next sprint
- `medium 🟡` - Important, not urgent
- `low 🟢` - Nice to have

**State Labels:**

- `📝 draft` - Needs fleshing out
- Native GitHub blocking relationships for dependency tracking
- `❓ needs-clarification` - Requires decisions
- `👷‍♂️ manual` - Human task only

**Type Labels:**

- `✨ enhancement` - New features
- `🐛 bug` - Fixes
- `⚙️ chore` - Technical work

**Area Labels (Optional):**

- `🏗️ infrastructure` - DevOps, CI/CD
- `🏎️ performance` - Optimization
- `🤺 security` - Auth, compliance
- `🎨 ui/ux` - UI improvements
- `💸 tech-debt` - Code quality, refactoring, cleanup
- `💎 reliability` - Stability, validation, defensive programming

## Board Status

Issues progress through project board columns:

- **No Status** - New/unreviewed
- **Todo** - Approved but not yet ready
- **Ready** - Prepared for implementation
- **In Progress** - Being implemented
- **Done** - Completed

## Best Practices

1. Always create issues for work >30 minutes
2. Move to "Todo" only after human review
3. Move to "Ready" when fully prepared for implementation
4. Keep issues focused (4-16 hours of work)
5. Use milestones to group related work
6. Update issues rather than creating duplicates

## Testing Philosophy

The workflow emphasizes comprehensive testing at multiple levels:

**Issue Creation:**

- Manual testing checklists are generated based on requirements
- Test scenarios cover happy paths, edge cases, and error states
- Browser/device testing needs are specified

**Implementation:**

- Manual testing checklist must be executed before creating PR
- Test results are documented in the PR description
- Evidence (screenshots, recordings) is captured when relevant

**Quality Standards:**

- All user-facing features require manual testing
- Security and performance changes need specific test verification
- Test data and cleanup requirements are documented
