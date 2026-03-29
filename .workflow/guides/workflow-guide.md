# Agentic Coding Workflow Guide

## Overview

This workflow implements "agentic coding" - development powered by AI agents
where each piece of work makes the next piece easier through intelligent
automation and reusable patterns. From initial business idea to shipped code,
every stage builds on the previous one.

## Core Philosophy

- **Catch problems at the lowest value stage** - Review plans before
  implementation
- **Leverage AI for research and implementation** - Humans focus on vision and
  review
- **Maintain human oversight** - AI proposes, humans dispose
- **Build on existing patterns** - Each issue learns from the codebase
- **User story driven** - Features derived from user needs, not vice versa

## Workflow Stages

### 0. Project Inception (New Projects)

**Input:** Brain dump of business/product idea **Command:** `/start-new-project`
**Output:** Complete documentation package (vision, stories, roadmap,
architecture) **Complexity:** High - requires significant thinking and
decision-making

### 1. Story Management

**Suggest Stories from Discovery:** **Input:** Discovery issue numbers
containing research findings **Command:**
`/project:stories:suggest --from-issues "69,70,71"` **Output:** Suggested user
stories based on discovery insights **Complexity:** Low - analysis and
extraction

**Create Stories:** **Input:** New feature idea or story activation **Command:**
`/project:stories:create "description"` or `/project:stories:activate [name]`
**Output:** Properly formatted user story in appropriate folder **Complexity:**
Low - mostly formatting and organizing

### 2. Issue Planning & Creation

**Suggest Phase:** **Input:** Milestone or feature area **Command:**
`/project:issues:suggest "For milestone X"` **Output:** List of potential issues
with groupings **Complexity:** Low - analysis and suggestions only

**Create Phase:** **Input:** One or more issue descriptions **Command:**
`/project:issues:create "Issue 1" "Issue 2"` **Output:** Comprehensive GitHub
issues with deep research and automatic prioritization **Complexity:** Medium -
requires codebase understanding

### 3. Issue Prioritization

**Note:** Issues are automatically prioritized during creation. Manual
prioritization is only needed for:

- Issues created with `--no-prioritize` flag
- Adjusting priorities based on new context
- Weekly priority reviews

**Input:** Issue numbers to prioritize **Command:**
`/project:issues:prioritize #123` or `/project:issues:prioritize --review`
**Output:** Priority labels based on roadmap and context **Complexity:** Low -
strategic alignment check

### 4. Human Review

**Who:** Product owner, tech lead, or senior developer **Actions:**

- Review generated issue for accuracy
- Confirm priority assignment
- Clarify requirements
- Adjust scope if needed
- **Move to "Todo" status in project board when approved**
- **Move to "Ready" status when fully prepared for implementation**
  **Complexity:** Low - mainly verification

### 5. Implementation

**Input:** Approved GitHub issue **Command:**
`/project:issues:implement #[issue-number]` **Output:** Working code with tests
and PR **Complexity:** High - actual development work

**Note:** Automatically moves issue to "In Progress" on project board

### 6. Quality Review (Recommended)

**Input:** Completed implementation **Commands:**

- `/project:issues:preflight` - Pre-PR quality checks (typecheck, lint,
  simplify, verify, compliance)
- `/project:issues:review` - External model bug-finding review loop

**Output:** Quality-verified code ready for PR **Complexity:** Low - automated
checks

### 7. Code Review & Merge

**Who:** Human developers or AI agents (Charlie) **Actions:**

- Review code quality
- Verify tests pass
- Check acceptance criteria met **Complexity:** Medium - requires careful review

## Complete Flow

```
Business Idea → /start-new-project → Documentation Package
                                   ↓
                            User Stories → Backlog
                                   ↓
Sprint Planning → /project:milestones:suggest → Milestones (optional)
                                              ↓
        Discovery Issues → /project:stories:suggest → User Stories
                                                   ↓
                 /project:stories:activate → Active Story
                                       ↓
    /project:issues:suggest → Issue Suggestions
                         ↓
         /project:issues:create → GitHub Issues (with auto-priority)
                                             ↓
                                  Human Review → Todo → Ready
                                                    ↓
                           /project:issues:implement #123 → Implementation
                                                 ↓
                    /project:issues:preflight → Quality Checks
                                         ↓
                    /project:issues:create-pr → PR → /project:issues:review → Done
```

## Why This Works

### Efficiency Gains

- **Research once, implement correctly** - Upfront research prevents rework
- **Parallel execution** - Multiple agents can work simultaneously
- **Reduced context switching** - Humans review batches, not individual lines
- **Compound knowledge** - Each project makes the next one easier

### Quality Improvements

- **Consistent patterns** - AI learns and applies codebase conventions
- **Comprehensive testing** - Tests are generated alongside code
- **Better documentation** - Issues and stories become living documentation
- **User-focused development** - Stories keep features grounded in real needs

### Human Leverage

- **Focus on high-value work** - Strategy, architecture, complex problems
- **Async collaboration** - Review when convenient, not when blocked
- **Teaching through examples** - Each issue improves future generations
- **Clear decision points** - Humans control what gets built and when

## Best Practices

1. **Be specific in initial descriptions** - More detail upfront = better
   results
2. **Review plans before implementation** - 5 minutes of review saves hours of
   rework
3. **Run multiple agents in parallel** - Start new work while waiting for
   reviews
4. **Maintain issue templates** - Consistency improves AI performance
5. **Regular retrospectives** - Refine prompts based on outcomes
6. **Run preflight before PRs** - Use `/project:issues:preflight` for quality
   checks (typecheck, lint, simplify, verify, compliance)
7. **Review with external model** - Use `/project:issues:review` for unbiased
   bug-finding after creating the PR

## Testing Philosophy

The workflow integrates comprehensive testing at every stage:

### Issue Creation

- **Manual testing checklists** are automatically generated based on
  requirements
- **Test scenarios** cover happy paths, edge cases, and error states
- **Browser/device requirements** are specified based on project type
- **Performance benchmarks** are defined when relevant

### Implementation

- **Test-first development** - Write tests before implementation
- **Manual testing execution** - Run through the checklist before PR
- **Test documentation** - Results are included in PR descriptions
- **Evidence capture** - Screenshots/recordings for UI changes

### Quality Gates

- **Automated tests** must pass before PR creation
- **Manual testing checklist** must be completed
- **Test results** must be documented in PR
- **Known issues** must be disclosed

### When Manual Testing is Required

- All user-facing features
- Security-related changes
- Performance optimizations
- Cross-browser compatibility
- Accessibility requirements

The goal is to catch issues early and ensure quality through systematic testing
at both automated and manual levels.

## Priority System

The workflow uses a simple label-based priority system:

### Priority Labels

- **critical** 🔴 - Required to proceed / succeed
- **high** 🟠 - High user value, next sprint
- **medium** 🟡 - Important but not urgent
- **low** 🟢 - Someday/maybe

### State Labels

- **📝 draft** - Issue needs fleshing out
- **❓ needs-clarification** - Requires human decision/input
- Dependencies tracked via native GitHub blocking relationships

### Type Labels

- **✨ enhancement** - New features
- **🐛 bug** - Something broken
- **⚙️ chore** - Technical work, docs, refactoring, dependencies
- **👷‍♂️ manual** - Human tasks (account setup, configs, no code)

### Area Labels (Optional)

Apply only when relevant for planning or expertise:

- **🏗️ infrastructure** - DevOps, deployment, CI/CD
- **🏎️ performance** - Speed, optimization, efficiency
- **🤺 security** - Auth, vulnerabilities, compliance
- **🎨 ui/ux** - Specific improvements to existing UI/UX
- **💸 tech-debt** - Code quality, refactoring, cleanup
- **💎 reliability** - Stability, validation, defensive programming

### Status Tracking

Issue status is tracked in the GitHub Project board columns:

- **No Status** - New issues land here
- **Todo** - Approved and ready to work on
- **In Progress** - Currently being implemented
- **Done** - Completed and closed

### Using Priorities

1. Issues are automatically prioritized during creation
2. To skip auto-prioritization, use:
   `/project:issues:create "Issue" --no-prioritize`
3. Add context when adjusting:
   `/project:issues:prioritize #123 "customer waiting"`
4. Weekly run `/project:issues:prioritize --review` to realign
5. Check current state with `/project:issues:prioritize --status`
6. Focus on 🔴 critical items first

### Custom Context

Both prioritize and implement commands accept additional context:

- `/project:issues:prioritize #123 --context "this is blocking payments"`
- `/project:issues:implement #123 --context "coordinate with Sarah on API design"`

This context helps the AI make better decisions and follow your specific
guidance.

## Milestone-Driven Development

The workflow supports milestone-based planning to bridge the gap between
high-level roadmap and individual issues.

### Command Philosophy: Suggest vs Create

Commands are split into two types for clarity and control:

**Suggest Commands** (Analysis & Planning):

- `/project:milestones:suggest` - Analyzes project state, suggests next phases
- `/project:issues:suggest` - Analyzes needs, suggests concrete work items
- Fast, discussion-oriented, no side effects
- Output optimized for copy-paste into create commands

**Create Commands** (Execution):

- `/project:milestones:create` - Creates actual GitHub milestones
- `/project:issues:create` - Creates comprehensive GitHub issues with deep
  research
- Thorough research, side effects, generates artifacts
- Can create one or many items at once

This separation ensures you always have full control over what gets created
while benefiting from AI analysis.

### Milestone Planning

**Suggest Phase:** Use `/project:milestones:suggest` to:

- Review existing GitHub milestones and progress
- Analyze ROADMAP.md and current state
- Get 2-3 suggested milestones for the next phase
- Receive actionable suggestions

**Create Phase:** Use `/project:milestones:create "Name 1" "Name 2"` to:

- Create one or more milestones
- Set due dates with `--due`
- Add descriptions automatically or manually

Example interaction:

```
/project:milestones:suggest

Current milestones:
- "MVP Launch" (80% complete)

Based on ROADMAP Stage 1 and current progress:

🚀 Suggested: "Hello Production"
   Get the basic app deployed
   - Why now: Core features ready, need deployment
   - Scope: ~1 week

📍 Suggested: "Foundation + Auth"
   Complete authentication system
   - Why now: Blocks all user features
   - Scope: ~2 weeks

Create which milestones? (1, 2, both, modify)
```

### Populating Milestones

**Suggest Phase:** Use `/project:issues:suggest "Based on milestone X"` to:

- Analyze what issues are needed
- Group as must-have vs nice-to-have
- Get copy-paste ready suggestions
- See dependencies and ordering

**Create Phase:** Use
`/project:issues:create "Issue 1" "Issue 2" --milestone "X"` to:

- Create multiple issues with deep research
- Auto-link to milestone
- Set up dependencies
- Generate comprehensive implementation plans

Example:

```
/project:issues:suggest "Based on milestone Hello Production"

Must have:
- Deploy to Vercel
- Configure domains
- Set up monitoring

Should have:
- Add health checks
- Configure previews

Create these 5 issues? (y/n/edit)
```

### Milestone Workflow

1. **Plan Phase**: Run `/project:milestones:suggest` during planning
2. **Create Milestones**: Use `/project:milestones:create "Name 1" "Name 2"`
3. **Suggest Work**: Run `/project:issues:suggest "For milestone Name 1"`
4. **Create Issues**: Use
   `/project:issues:create "Issue 1" "Issue 2" --milestone "Name 1"`
5. **Prioritize**: Run `/project:issues:prioritize` on created issues
6. **Execute**: Work through issues with `/project:issues:implement`
7. **Track**: Monitor progress via `gh milestone list`

This approach provides focused sprints while maintaining flexibility and human
control at each step.

## Story-Driven Development

The workflow promotes a story-driven approach that bridges discovery and
implementation:

### Discovery to Stories Flow

1. **Discovery Research**: Create research issues to understand user needs

   ```bash
   /project:issues:create "Research FDS teacher workflows" --research deep
   ```

2. **Extract Stories**: After discovery, extract actionable user stories

   ```bash
   /project:stories:suggest --from-issues "69,70,71"
   ```

   This analyzes discovery findings and suggests stories like:
   - "Teacher: Quick class attendance marking"
   - "Studio Owner: Daily attendance reports"

3. **Create Implementation Issues**: Link issues to stories for traceability
   ```bash
   /project:issues:create "Build attendance UI" --story "teacher-quick-attendance"
   ```

### Smart Story Nudges

When creating issues without a `--story` flag, the system analyzes if the issue
would benefit from story-driven clarification:

**Features that trigger a nudge**:

- User-facing workflows (dashboards, forms, reports)
- Business rule implementations (billing, permissions)
- Features with complex acceptance criteria

**Technical work that doesn't need stories**:

- Infrastructure setup (Redis, CI/CD)
- Performance optimizations
- Dependency updates
- Bug fixes

The nudge is helpful, not blocking - you can always use `--no-story` to proceed
without a story.

### Benefits of Story-Driven Development

1. **Clear User Value**: Every feature ties back to a user need
2. **Better Acceptance Criteria**: Stories define "done" from user perspective
3. **Prioritization Context**: Easier to prioritize based on user impact
4. **Living Documentation**: Stories document the "why" behind features
5. **Scope Control**: Stories prevent feature creep by defining boundaries

## Command Reference

### Story Management

**`/project:stories:suggest`** - Extract user stories from discovery findings

- `--from-issues "69,70,71"` - Analyze specific discovery issues
- `--user-type "teacher"` - Filter suggestions by user type
- Extracts user needs from research and suggests actionable stories

Examples:

```bash
# From discovery issues
/project:stories:suggest --from-issues "69,70,71"

# Filter by user type
/project:stories:suggest --from-issues "69,70,71" --user-type "teacher"

# From general context
/project:stories:suggest "Based on FDS discovery findings"
```

**`/project:stories:create`** - Create new user stories

Examples:

```bash
# Single story
/project:story "Teacher: Quick class attendance"

# Multiple stories
/project:story "Teacher: Quick attendance" "Owner: View reports"
```

**`/project:stories:activate`** - Move story from backlog to active

**`/project:stories:complete`** - Archive completed story

### Issue Management

**`/project:issues:create`** - Create one or more GitHub issues

- `--milestone "name"` - Assign to a specific milestone
- `--story "name"` - Link to an active user story
- `--research none|light|normal|deep` - Control research depth (default: normal)
- `--no-prioritize` - Skip automatic prioritization (by default, all issues are
  prioritized)
- `--draft` - Create as draft issue for later refinement (implies --research
  none and --no-prioritize)
- `--no-story` - Skip story nudge for user-facing features

Examples:

```bash
# Multiple issues for a milestone (auto-prioritized)
/project:issues:create "Deploy pipeline" "Add monitoring" --milestone "Hello Production"

# Deep research for complex feature (auto-prioritized)
/project:issues:create "Add real-time sync" --research deep --story "collaboration"

# Draft issue to capture idea
/project:issues:create "Design System" --draft --milestone "UI Foundation"

# Quick task without prioritization
/project:issues:create "Update dependencies" --research none --no-prioritize

# User feature without story nudge
/project:issues:create "Add teacher dashboard" --no-story
```

**`/project:issues:flesh-out`** - Complete a draft issue with full research
**`/project:issues:update`** - Update issue with additional information

Examples:

```bash
# Flesh out a draft issue
/project:issues:flesh-out #123

# Update with new requirements
/project:issues:update #123 "Add support for bulk operations"
```

**`/project:issues:prioritize`** - Manage issue priorities

- `#123` - Analyze and set priority for specific issues
- `--review` - Review all open issues and suggest adjustments
- `--status` - Show current priority distribution
- `--context "text"` - Add context to guide priority decisions

Examples:

```bash
# Set priority with context
/project:issues:prioritize #123 --context "Critical for demo next week"

# Weekly priority review
/project:issues:prioritize --review

# Check priority distribution
/project:issues:prioritize --status
```

### Milestone Management

**`/project:milestones:create`** - Create GitHub milestones

- `--context "text"` - Additional context to guide milestone scope and
  description

Examples:

```bash
# Single milestone with context
/project:milestones:create "MVP Launch" --context "Core features ready for first users"

# Multiple milestones (order implies progression)
/project:milestones:create "Foundation" "Authentication" "First Feature"
```

### Implementation

**`/project:issues:implement`** - Implement issues

- Accepts multiple issues: `#123 #124 #125`
- `--milestone "name"` - Implement issues from a milestone (AI groups
  intelligently)
- `--context "text"` - Add implementation guidance

Examples:

```bash
# Single issue with guidance
/project:issues:implement #123 --context "Follow the new API patterns from last week"

# Multiple related issues
/project:issues:implement #123 #124 #125

# Milestone-based (AI chooses grouping)
/project:issues:implement --milestone "Authentication Core"
/project:issues:implement --milestone "Hello Production" --context "focus on MVP features"
```

### Quality & Compliance

**`/project:issues:preflight`** - Complete pre-PR quality check

- Orchestrates: typecheck → lint → simplify → verify → compliance → reflect
- `--light` - For bug fixes and small changes (typecheck → lint → test-adequacy)
- `--with-tests` - Include local test run
- `--skip-simplify` - Skip simplification step
- `--skip-compliance` - Skip compliance check
- `--strict` - Fail on any warnings

Examples:

```bash
# Full preflight for issue
/project:issues:preflight #123

# Preflight without issue verification
/project:issues:preflight

# Include test run
/project:issues:preflight --with-tests
```

**`/project:issues:review`** - External model bug-finding review loop

- Unbiased review by external model (no custom prompt)
- Iterates until clean or hard cap (10 iterations)
- `--one-iteration` - Single pass, no loop
- `--base <branch>` - Branch to diff against (default: main)

Examples:

```bash
# Full review loop
/project:issues:review

# Single pass
/project:issues:review --one-iteration

# Review against develop
/project:issues:review --base develop
```

## Pragmatic Development

### When to Create Issues

- Features taking >30 minutes
- Bugs reported by users
- Work that needs discussion
- Tasks you might forget

### When to Skip Issues

- Typos and formatting fixes
- Small improvements while coding
- Obvious refactoring
- Dev experience improvements

The workflow helps with big decisions but doesn't block small improvements. Use
good judgment - if creating an issue takes longer than the fix, just fix it!

## Getting Started

1. Run `/setup-workflow` to set up this workflow
2. Run `/start-new-project "your idea"` for new projects
3. Use `/project:stories:create "feature description"` to create stories
4. Plan sprints with `/project:milestones:suggest` (optional)
5. Suggest issues with `/project:issues:suggest`
6. Create issues with `/project:issues:create`
7. Prioritize with `/project:issues:prioritize #123`
8. Implement with `/project:issues:implement #123`

## GitHub Project Board Configuration

The workflow integrates with GitHub Projects v2 for issue tracking. Since
projects are owned by users/organizations (not repositories), you may need to
specify which project to use.

To configure your project, create `.workflow/config.json`:

```json
{
  "github": {
    "project_title": "Your Project Name"
  },
  "ide": {
    "command": "cursor",
    "name": "Cursor"
  },
  "packageManager": "pnpm",
  "update": {
    "sources": [
      {
        "type": "local",
        "path": "/path/to/agentic-coding/workflow",
        "enabled": true
      },
      {
        "type": "github",
        "url": "https://github.com/owner/repo",
        "enabled": false
      }
    ]
  }
}
```

**Configuration options:**

- `github.project_title`: The GitHub Project board name to use for issue
  tracking
- `ide.command`: The shell command to open your IDE (e.g., `cursor`, `webstorm`,
  `code`)
- `ide.name`: Human-readable name for the IDE (shown in output messages)
- `packageManager`: The package manager to use for commands (`npm`, `pnpm`, or
  `yarn`). Scripts will auto-detect from lockfiles if not configured.

The `update.sources` array allows you to configure multiple update sources:

- Sources are tried in order (first enabled source wins)
- Set `enabled: false` to disable a source temporarily
- Local sources use `path`, GitHub sources use `url`
- The update script will use the first enabled source it finds

The workflow will automatically detect your project during setup or prompt you
to configure it when needed.

## Document Maintenance Guide

### Living Documents (Update Regularly)

- **`story-map.md`** - Your product roadmap and priorities
- **`/user-stories/active/`** - Stories currently being worked on
- **`ROADMAP.md`** - Next priorities and phases
- **`PLATFORM.md`** - Domain knowledge, principles, strategic context
- **`CLAUDE.md`** - Project rules and instructions for AI
- **`.claude/rules/`** - Technical guardrails (always-loaded or path-scoped)
- **`.claude/skills/`** - Pattern knowledge (on-demand, intent-triggered)
- **`BRAND_GUIDE.md`** - Evolves with product maturity
- **`docs/architecture/decisions/`** - Technical architecture decisions (ADRs)
- **GitHub Issues/PRs** - Day-to-day work tracking

### Static References (Rarely Change)

- **`VISION.md`** - Core product purpose
- **`workflow-guide.md`** - This workflow documentation
- **`docs/architecture/README.md`** - Only update for major system changes
- **`inception-notes/decisions.md`** - Historical business/product decisions
- **Initial inception docs** - Keep as historical context

### Archive Only (Never Update)

- **`/user-stories/completed/`** - Historical record of what was built
- **`/user-stories/discarded/`** - Ideas that didn't make it (with reasons)

## Metrics to Track

- Time from idea to merged PR
- Number of review cycles needed
- Test coverage percentage
- Parallel work capacity
- Story completion rate
