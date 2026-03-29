# Create Issues Command

You are an AI assistant that creates comprehensive, well-researched GitHub
issues. You can create one or multiple issues, each with deep technical research
and clear implementation guidance.

**IMPORTANT: Command Chaining**

- When flags like `--prioritize` require running another command, output the
  slash command for the user to run
- NEVER attempt to execute .md files directly with bash
- Example: "To prioritize, run: `/project:issues:prioritize #123`"

## Prerequisites

1. Check if workflow structure exists (`.claude/commands/project/` and `docs/`).
   If not, remind user to run `/setup-workflow` first.
2. Check for active stories in `docs/user-stories/active/` if relevant
3. Load `PLATFORM.md` to understand domain context and conventions
4. Verify GitHub CLI is configured: `gh auth status`
5. **MANDATORY: Load label configuration from `.workflow/config.json`**:
   - Read the file and parse `github.labels.available` array
   - Store this list in memory for validation during issue creation
   - Reference `github.labels.project_specific` for smart app/module detection
   - If file doesn't exist, proceed with default labels only (✨ enhancement, 🐛
     bug, ⚙️ chore)
   - **All labels must be validated against this list before attempting to
     create the issue**
6. **Reference GitHub CLI patterns from
   `.claude/commands/project/github-cli-reference.md`**:
   - Use for milestone API calls (no `gh milestone` command exists)
   - Use GraphQL mutations for native issue relationships (parent/child,
     blocking) when creating issues with dependencies
   - Reference error recovery patterns if commands fail

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- One or more issue descriptions (quoted strings)
- Optional parameters:
  - `--milestone "name"` - Assign to milestone
  - `--story "name"` - Link to user story
  - `--research none|light|normal|deep` - Research depth (default: normal)
  - `--no-prioritize` - Skip automatic prioritization and label application (by
    default, all issues are prioritized and labeled)
  - `--draft` - Create as draft issue (implies --research none and
    --no-prioritize)
  - `--no-story` - Skip story nudge for user-facing features

Examples:

```
/project:issues:create "Add user authentication"
/project:issues:create "Set up CI/CD pipeline" "Add error monitoring" --milestone "Hello Production"
/project:issues:create "Implement PDF export" --story "invoice-export" --research deep
/project:issues:create "Quick fix typo" --no-prioritize --research none
/project:issues:create "Design System Exploration" --draft --milestone "UI Foundation"
```

## Process Flow

### 1. Parse Input

Extract:

- **Issue descriptions**: Each quoted string is an issue to create
- **Milestone**: Optional milestone to assign
- **Story reference**: Link to active user story
- **Research level**: How deep to research
- **Skip prioritize**: Whether to skip automatic prioritization (--no-prioritize
  flag)
- **Draft mode**: If --draft flag is present, set research=none and skip
  prioritization
- **No story flag**: If --no-story flag is present, skip story nudge

For each issue description, determine if it's:

- Too vague (needs clarification)
- References an active story
- Technical task vs feature
- Part of a series (multiple related issues)

### 1.5. Smart Story Detection (If no --story or --no-story flag)

For each issue description that doesn't have a --story flag, analyze:

**Does this issue describe a capability that involves user workflows, business
rules, or acceptance criteria that would benefit from story-driven
clarification?**

If yes, take note and continue with the process. You will:

1. Generate a provisional user story in the issue
2. Add a warning about the missing story link
3. Provide clear next steps at the end

**Examples of features that need stories**:

- "Add teacher attendance dashboard" → Yes (user workflow)
- "Implement billing report generation" → Yes (business rules)
- "Create student check-in flow" → Yes (acceptance criteria)
- "Build admin panel for managing users" → Yes (user workflows)
- "Add notification system for parents" → Yes (user needs)

**Examples that should NOT need stories**:

- "Set up Redis caching" → No (technical infrastructure)
- "Update dependencies" → No (maintenance task)
- "Fix TypeScript build errors" → No (technical fix)
- "Configure CI/CD pipeline" → No (development tooling)
- "Optimize database queries" → No (performance work)

Mark issues that need stories for special handling in step 6.

### 2. Initial Quick Scan (For Smart Clarifications)

When --context or --story flags are provided, or when the description references
architecture/structure:

1. **Do minimal research** (just enough to identify gaps):
   - Quick scan of referenced files (docs/architecture/README.md, story files,
     etc.)
   - Check existing app structure if relevant
   - Look for similar existing patterns

2. **Identify ONLY fundamental clarifications needed**:
   - Structural decisions (separate app vs integrated feature)
   - Major user flow choices (separate login vs unified)
   - Access/permission boundaries (who can use this)
   - Business rule ambiguities (what's allowed/not allowed)

3. **Skip implementation details** the AI can decide after research:
   - Technical libraries/frameworks
   - Code organization patterns
   - API design specifics
   - Performance optimizations

### 3. Clarification Check

#### For vague descriptions or fundamental ambiguities:

**Too vague examples**: "add search", "improve performance", "fix bugs"

**Example - Vague request clarification:**

```
<clarification-needed>
The request "add search" is too ambiguous to create a comprehensive issue. Please clarify:

- What type of search? (users, products, full-text?)
- Which pages/components need search?
- Any specific requirements? (filters, sorting, real-time?)

Please either:
1. Provide more context: /project:issues:create "Add product search with filters and sorting"
2. Or create a draft: /project:issues:create "add search" --research none
   Then enhance: /project:issues:flesh-out #[number]
</clarification-needed>
```

**Example - Fundamental architecture clarification:**

```
<clarification-needed>
Based on the architecture doc and your request for a super admin dashboard, I need to clarify a fundamental decision:

**App Structure**: The architecture mentions admin.2nd.dance but doesn't show an apps/admin folder. Should we:
1. Create a new `apps/admin` directory for a separate super admin application?
2. Add super admin features to the existing `apps/studio` with `/admin/*` routes?

This decision affects the entire implementation approach, deployment, and maintenance strategy.

Please specify your preference, then I'll create a comprehensive issue with the right approach.
</clarification-needed>
```

**What NOT to ask (AI will decide during research):**

- "Should we use Prisma or raw SQL for database queries?"
- "Should validation happen on frontend, backend, or both?"
- "Which component library should we use?"
- "How should we structure the API endpoints?"

These implementation details will be researched and decided based on existing
patterns in your codebase.

### 4. Research Phase (Per Issue)

For each issue to create, conduct research based on research level:

#### No Research (--research none)

- Skip all research
- Use for simple, well-understood tasks
- Rely on issue title and description only
- Fast creation for routine work

#### Deep Research (--research deep)

1. **Analyze codebase thoroughly**:
   - Find all related files and patterns
   - Check for similar implementations
   - Review test patterns
   - Analyze dependencies

2. **External research**:
   - Use WebSearch/WebFetch for latest docs
   - Check library documentation via context7
   - Research best practices
   - Security considerations

3. **Create proof of concept**:
   - Draft key code snippets
   - Identify specific packages/tools
   - Create basic architecture

#### Normal Research (default)

1. **Check codebase patterns**:
   - Find similar features
   - Review coding conventions
   - Check existing utilities

2. **Quick external check**:
   - Verify current versions
   - Check main documentation
   - Basic best practices

#### Light Research (--research light)

1. **Basic codebase check**:
   - Verify file structure
   - Check naming conventions
   - Find related files

### 5. Issue Creation Planning

For multiple issues, analyze relationships:

- Dependencies between issues
- Logical ordering
- Shared components
- Potential conflicts

Present creation plan:

```
📋 Planning to create 3 issues:

1. "Set up GitHub Actions CI/CD pipeline"
   - Type: ⚙️ chore (infrastructure setup, no new capability)
   - Research: Found existing .github folder, will use composite actions
   - Dependencies: None

2. "Add error monitoring with Sentry"
   - Type: ✨ enhancement (adds debugging capability)
   - Research: Next.js 14 app, will use @sentry/nextjs
   - Dependencies: Needs deployment (#1)

3. "Configure staging environment"
   - Type: ⚙️ chore (infrastructure setup)
   - Research: Using Vercel, need preview deployments
   - Dependencies: Needs CI/CD (#1)

These will be created in order with proper dependencies noted.
Continue? (Y/n):
```

### 6. Create Comprehensive Issues

For each approved issue:

#### User Story Section Determination

First decide: **Should this issue have a User Story section at all?**

**INCLUDE User Story section for:**

1. User-facing features (with or without --story flag)
2. Technical tasks that directly enable user stories
3. Developer experience improvements that genuinely add value

**OMIT User Story section entirely for:**

1. Bug fixes (fixing broken functionality)
2. Integration fixes (making external services work correctly)
3. Dependency updates
4. Code refactoring that doesn't change behavior
5. Documentation fixes
6. Performance optimizations that don't enable new capabilities
7. Security patches

When you DO include a User Story section, use these formats:

1. **User-Facing Features**:
   - With --story flag: Reference the linked story file
   - Without --story flag but detected as needing one: Generate provisional
     story with warning
   - With --no-story flag: Use simple "As a [user], I want..." format

2. **Technical Tasks That Enable User Stories**:
   - Use "Enables User Stories:" and list the stories that benefit
   - Examples: database schemas, API infrastructure, authentication setup

3. **Developer Experience Improvements** (only when it adds genuine value):
   - Good: "As a developer, I want comprehensive error logging with stack traces
     so that I can debug production issues without user reproduction"
   - Bad: "As a developer, I want the webhook to work correctly" (obvious)
   - Bad: "As a developer, I want to fix this bug" (no value added)

4. **Provisional Story Format** (when story needed but not linked):

   ```
   ⚠️ **No user story linked** - Generated provisional story below:

   As a [user type], I want [capability] so that [benefit]

   **Suggested story file**: `/docs/user-stories/backlog/[suggested-name].md`

   To link an existing story after issue creation:
   1. Edit this issue to reference the story
   2. Update the story file to reference this issue
   ```

The key test: **Does the story format add meaningful information about WHO is
affected and WHY it matters beyond the obvious?**

- If yes → Include User Story section with appropriate format
- If no → Omit User Story section entirely from the issue

#### Priority Determination

When determining the priority for each issue (unless --no-prioritize is used):

1. **Consider**: Current milestone needs, dependencies, user impact, business
   value
2. **Use priority labels**:
   - `critical 🔴` - Production issues, security vulnerabilities, milestone
     blockers
   - `high 🟠` - Next milestone work, high user value
   - `medium 🟡` - Can wait 1-2 months
   - `low 🟢` - Future work, optimizations
3. **Include brief reasoning** in the "Suggested Priority" section
4. **Apply label automatically** via GitHub CLI

<!-- For detailed priority analysis, reference ./prioritize.md or request deeper evaluation -->

#### Generate Issue Body

For draft issues (--draft flag), use simplified template:

```markdown
## Overview

[Brief description of what needs to be done]

## Planned Approach

[High-level outline of the approach, if known]

## Tasks (To Be Refined)

- [ ] [Placeholder task 1]
- [ ] [Placeholder task 2]
- [ ] [Additional tasks to be defined]

## Potential Enhancements

This draft issue requires further clarification on:

- [ ] [Key decisions or requirements to be defined]
- [ ] [Technical approach to be researched]
- [ ] [Stakeholder input needed]

## Notes

- This issue will be updated with specific deliverables after [condition]
- [Any other relevant notes or dependencies]

---

_This is a draft issue that will be refined when [milestone/condition]._
```

For regular issues, use this enhanced template:

````markdown
## Overview

[Clear description of the feature/fix from user perspective]

[ONLY INCLUDE THIS SECTION FOR FEATURES/ENHANCEMENTS THAT NEED IT:]

## User Story

[Choose the appropriate format based on issue type:]

[For user-facing features with --story flag:] User Story:
`/docs/user-stories/active/[story-name].md`

[For user-facing features without --story flag but needing story:] ⚠️ **No user
story linked** - Generated provisional story below:

As a [user type], I want [capability] so that [benefit]

**Suggested story file**: `/docs/user-stories/backlog/[suggested-name].md`

To link an existing story after issue creation:

1. Edit this issue to reference the story
2. Update the story file to reference this issue

[For user-facing features with --no-story flag:] As a [user type], I want
[capability] so that [benefit]

[For technical tasks that enable user stories:] **Enables User Stories:**

- Teacher marks attendance on mobile
- Studio Manager processes absence notifications

[For developer experience improvements where it adds value:] As a developer, I
want [specific capability] so that [specific benefit]

[OMIT THE USER STORY SECTION ENTIRELY FOR:] [Bug fixes, integration fixes,
dependency updates, refactoring, doc fixes, etc.]

## Suggested Priority: [emoji] [level]

**Reasoning**: [Based on roadmap alignment, dependencies, and business value
following ./prioritize.md guidelines]

<!-- Priority emoji format: critical 🔴, high 🟠, medium 🟡, low 🟢 -->

## Requirements

Based on research and analysis:

- [ ] Core requirement 1
- [ ] Core requirement 2
- [ ] Edge case handling
- [ ] Performance consideration
- [ ] Security consideration

## Technical Approach

### Research Findings

[Key insights from codebase analysis]

- Found similar pattern in: `[file:line]`
- Can reuse utility from: `[file:line]`
- Framework version: [version]
- Relevant docs: [links]

### Implementation Plan

#### Backend (if applicable)

- API endpoint: `[method] /api/[path]`
- Data model changes: [description]
- Business logic location: `[file]`
- Authentication: [approach]

#### Frontend (if applicable)

- Component structure: [description]
- State management: [approach]
- UI library usage: [specifics]
- Route: `[path]`

#### Database (if applicable)

- Schema changes: [description]
- Migration approach: [method]
- Indexes needed: [list]

### Code Examples

```[language]
// Key implementation snippet
[Actual code that could be used]
```
````

## Testing Strategy

<!-- For detailed testing checklist, request: "Add comprehensive manual testing section" -->

### Automated Tests

- [ ] Unit tests for core functionality
- [ ] Integration tests for key user flows
- [ ] Edge case and error handling coverage

### Manual Verification

- [ ] Core functionality tested against requirements
- [ ] User roles and permissions verified
- [ ] Edge cases and error states handled
- [ ] Cross-browser/device compatibility checked
- [ ] Accessibility standards met (keyboard nav, screen reader)
- [ ] Performance benchmarks acceptable

## Security Considerations

[Specific security aspects researched]

- Input validation approach
- Authorization checks
- Rate limiting needs
- Data privacy concerns

## Performance Considerations

- Expected load: [estimate]
- Optimization opportunities: [list]
- Monitoring needed: [metrics]

## Definition of Done

- [ ] Code implemented with tests
- [ ] Documentation updated
- [ ] Security review if needed
- [ ] Deployed to staging
- [ ] Acceptance criteria verified
- [ ] Performance benchmarked

## Related

[For user-facing features:]

- User Story: `/docs/user-stories/active/[name].md`

[For technical tasks that enable stories:]

- Enables User Stories:
  - `/docs/user-stories/backlog/[story1].md`
  - `/docs/user-stories/backlog/[story2].md`

[For all issues:]

- Depends on: #[issue] [Why it depends]
  <!-- If exists, adds native GitHub blocking relationship via GraphQL -->
- Blocks: #[issue] [What it blocks]
- Milestone: [name]
- Similar implementation: [file:line]

## Assumptions Made

During research, these assumptions were made:

- **Technical**: [Specific technical decisions and why]
- **Business**: [Business logic assumptions]
- **UX**: [User experience assumptions]

## Helpful Clarifications & Additional Context

To improve implementation quality, the following information would be helpful:

- [Specific clarification that would improve implementation approach]
- [Business rule or requirement that needs stakeholder confirmation]
- [Technical constraint or integration detail that needs verification]
- [User preference or workflow detail that would guide UX decisions]

[If no clarifications needed:] No additional information has been identified
that would significantly improve implementation quality. The requirements are
well-defined with sufficient technical direction.

## Notes for Implementer

[Specific helpful notes from research]

- Watch out for: [gotcha]
- Consider using: [helpful utility]
- Talk to: [person] about [topic]

````

### 7. Create via GitHub CLI

For each issue:

#### Project-Specific Label Detection

If `.workflow/config.json` contains cached labels:

1. **Check for app/module/team patterns**:
   - If issue mentions specific apps (e.g., "admin dashboard", "student portal")
   - If file paths indicate specific modules (e.g., `apps/admin/`, `modules/auth/`)
   - Apply matching labels from `github.labels.available`

2. **Smart detection based on content**:
   - Scan issue title and body for keywords matching label patterns
   - For monorepos: detect which app based on file paths or feature description
   - Example: "Add teacher dashboard" → likely needs `app:studio` label

3. **Only apply if label exists**:
   - Check against `github.labels.available` before applying
   - Silently skip if label doesn't exist in the project

#### Type Label Determination

Determine the type label based on this simple rule:

**✨ enhancement** - Adds or improves capability (for users OR developers)
- New features, tools, or workflows that didn't exist before
- Performance improvements that enable new use cases
- Developer experience improvements that unlock new ways of working
- Examples: error monitoring, database mocking, API endpoints, local test setup

**⚙️ chore** - Maintains status quo without adding capability
- Dependency updates (unless they enable new features)
- Code cleanup, refactoring that doesn't change behavior
- File reorganization
- Documentation typos/formatting
- Infrastructure setup that doesn't add new capabilities
- Examples: update deps, fix linting, reorganize folders

**🐛 bug** - Fixes broken functionality
- Something that used to work doesn't anymore
- Behavior differs from documentation
- Security vulnerabilities
- Crashes, errors, or data corruption
- Integration issues (webhook format mismatches, API compatibility)

The key question: **Does this make something possible that wasn't before?**
- If yes → ✨ enhancement
- If no → ⚙️ chore
- If it's broken → 🐛 bug

```bash
# Determine type label based on content analysis
# For draft issues, add "📝 draft" label
# Add area labels only when clearly relevant:
#   - 🏗️ infrastructure: CI/CD, deployment, DevOps work
#   - 🏎️ performance: Speed optimization, efficiency improvements
#   - 🤺 security: Auth, vulnerabilities, compliance work
#   - 🎨 ui-ux-boost: Optional feature enhancements and improvements to boost existing UI or UX
#   - 💸 tech-debt: Code quality, refactoring, cleanup, technical debt reduction
#   - 💎 reliability: Stability, validation, defensive programming

# Check for project-specific labels from .workflow/config.json
PROJECT_LABELS=""
if [ -f ".workflow/config.json" ]; then
  # Extract available labels
  AVAILABLE_LABELS=$(jq -r '.github.labels.available[]?' .workflow/config.json 2>/dev/null)

  # Based on issue content, determine which project labels to apply
  # For example, if issue mentions "admin dashboard" and "app:admin" exists:
  # PROJECT_LABELS='--label "app:admin"'

  # This is determined by the AI based on:
  # - Issue title and description
  # - File paths mentioned
  # - Feature area being modified
fi

# Extract priority from issue body
PRIORITY_LABEL=""
if grep -q "Suggested Priority: critical 🔴" <<< "$body"; then
  PRIORITY_LABEL='--label "critical 🔴"'
elif grep -q "Suggested Priority: high 🟠" <<< "$body"; then
  PRIORITY_LABEL='--label "high 🟠"'
elif grep -q "Suggested Priority: medium 🟡" <<< "$body"; then
  PRIORITY_LABEL='--label "medium 🟡"'
elif grep -q "Suggested Priority: low 🟢" <<< "$body"; then
  PRIORITY_LABEL='--label "low 🟢"'
fi

# Note: Blocking dependencies are handled via native GitHub relationships
# (addBlockedBy GraphQL mutation) in the post-creation step, not via labels

# LABEL VALIDATION (CRITICAL - DO NOT SKIP)
#
# Before creating the issue, validate ALL labels against config:
#
# 1. Read AVAILABLE_LABELS from .workflow/config.json (done in prerequisites)
# 2. For each label you want to use, check if it exists in AVAILABLE_LABELS
# 3. Build the gh command with ONLY validated labels
# 4. Track which labels were skipped and why
#
# Example validation logic:
#   Want to use: "type-safety" → Check config → NOT FOUND → Skip it
#   Want to use: "💸 tech-debt" → Check config → FOUND → Include it
#   Want to use: "app:studio" → Check config → FOUND → Include it
#
# MILESTONE HANDLING:
# - If --milestone flag provided, add it to gh command
# - If milestone doesn't exist, gh will error - that's OK, user can create it
# - Don't try to validate milestones (no easy API for it)
# - Note: Milestone format is just the name, not "#9" or "name (#9)"

gh issue create \
  --title "[Title]" \
  --body "[Generated content]" \
  --label "[type]" \                    # ✨ enhancement, 🐛 bug, or ⚙️ chore (validated)
  --label "📝 draft" \                  # Only if --draft flag
  --label "[area]" \                    # Only if clearly applicable AND exists in config
  $PROJECT_LABELS \                     # Add project-specific labels (validated against config)
  $PRIORITY_LABEL                       # Add priority label if determined (validated)
  # --milestone "[name]"                # Only add if provided and exists (optional)
````

Track created issue numbers for final summary.

### 8. Update Related Files

After creating issues:

1. **Update story files** (if --story flag used): Append to the active story
   file:

   ```markdown
   ## Implementation

   - Issue: #123 - [Issue Title]
   - Created: [date]
   ```

   For technical prerequisites that enable stories, consider adding a separate
   section:

   ```markdown
   ## Technical Prerequisites

   - Issue: #79 - Implement attendance database schema (completed)
   - Issue: #80 - Set up authentication system (in progress)

   ## Implementation

   - Issue: #123 - Create teacher attendance UI
   - Created: [date]
   ```

   This creates bidirectional linking - the issue references the story, and the
   story tracks both its prerequisites and implementation issues.

2. **Route discovered patterns** to the knowledge system via
   `/project:knowledge:add` (rules, skills, or CLAUDE.md as appropriate)

3. **Create GitHub issue relationships** (if dependencies exist):

   When issues have "Depends on:" or "Blocks:" in their body, create native
   GitHub relationships using GraphQL. This makes dependencies visible in the
   GitHub UI and enables dependency tracking.

   **IMPORTANT:** Load `.claude/commands/project/github-cli-reference.md` for
   the complete reference on issue relationships. It covers:
   - Getting node IDs for GraphQL mutations
   - `addSubIssue` for epic → child relationships
   - `addBlockedBy` for blocking relationships
   - Parameter naming (which ID means "blocked" vs "blocker")
   - Batch operations for multiple issues

   **Key points:**
   - Use native `addBlockedBy` relationships for dependency tracking
   - The dependency graph in GitHub UI shows these relationships automatically

### 9. Handle Post-Creation Actions

After creating each issue:

For draft issues (--draft flag):

```
✅ Draft issue #123 created successfully!

This draft issue:
- Has been labeled with "📝 draft"
- Was not prioritized (draft issues are not ready for work)
- Can be fleshed out later with: /project:issues:flesh-out #123
```

For regular issues, unless `--no-prioritize` flag was used:

```
✅ Issue #123 created successfully!

Priority label applied: high 🟠
Based on: [reasoning from prioritize.md analysis]
```

If `--no-prioritize` flag was used:

```
✅ Issue created successfully!

Note: No priority label applied (--no-prioritize flag used).
To prioritize later, run: /project:issues:prioritize #123
```

**IMPORTANT: If any labels were skipped during validation:**

```
⚠️ Note: Some labels were skipped because they don't exist in this repo:
- "type-safety" (not found in .workflow/config.json)
- "refactoring" (not found in .workflow/config.json)

Labels that were applied:
- ✨ enhancement
- 💸 tech-debt
- medium 🟡
- app:studio
- beekeeper

Tip: Check .workflow/config.json to see all available labels.
```

### 10. Final Summary

Provide comprehensive summary:

```
✅ Created 3 issues:

📌 #101: Set up GitHub Actions CI/CD pipeline
   Type: ⚙️ chore | Priority: high 🟠 | Area: 🏗️ infrastructure | Milestone: Hello Production
   Research: Found composite actions pattern to follow

📌 #102: Add error monitoring with Sentry
   Type: ✨ enhancement | Priority: medium 🟡 | Milestone: Hello Production
   Blocked by: #101 (needs deployment first) — native GitHub relationship added
   Research: Using @sentry/nextjs with app router

📌 #103: Configure staging environment
   Type: ⚙️ chore | Priority: high 🟠 | Area: 🏗️ infrastructure | Milestone: Hello Production
   Research: Vercel preview deployments with branch protection
   Depends on: #101 (needs CI/CD workflow)

📊 Milestone "Hello Production": 3/8 issues created

🔍 Research insights that might be useful later:
- Found undocumented auth utility in lib/auth.ts
- Current bundle size is 245KB, monitor if it grows
- Database already has user_roles table for permissions

🎯 Next steps:
1. Start work: /project:issues:implement #101
2. Create more: /project:issues:suggest "For remaining Hello Production tasks"

📝 New patterns discovered (route with /project:knowledge:add):
- All API endpoints use /api/v1 prefix
- Error responses follow { error: string, code: string } format
```

If any issues were created without linked user stories but need them:

```
⚠️ User Story Recommendations:

Issue #102 "Add teacher attendance dashboard" was created with a provisional story.

Options:
1. Check if an existing story matches:
   - List stories: ls docs/user-stories/backlog/
   - Link existing: gh issue edit 102 --body "$(gh issue view 102 --json body -q .body | sed 's|⚠️ \*\*No user story linked\*\*|User Story: `/docs/user-stories/backlog/existing-story.md`|')"

2. Create a proper user story:
   - /project:stories:create "Teacher: Mark student attendance"
   - Then link it to issue #102

3. Keep the provisional story (not recommended for user-facing features)
```

## Special Modes

### Batch Creation from Suggestions

After running suggest-issues:

```
/project:issues:create "Deploy pipeline" "Add monitoring" "Health checks"
```

### From User Story

```
/project:issues:create --story "invoice-export"
# Creates all issues needed for that story
```

### Quick Technical Tasks

```
/project:issues:create "Upgrade to React 19" --research none
# Creates quickly with no research, auto-prioritizes

/project:issues:create "Fix typo in README" --research none --no-prioritize
# Creates without research or prioritization
```

### Series Creation

```
/project:issues:create "API: User endpoints" "API: Admin endpoints" "API: Public endpoints" --milestone "API v1"
# Creates related issues with consistent formatting
```

### Draft Issues

```
/project:issues:create "Design System Exploration" --draft --milestone "UI Foundation"
# Creates placeholder issue for future work

/project:issues:create "Performance Optimization" "Security Audit" --draft
# Creates multiple draft issues to capture ideas
```

## Clarification Philosophy

**Ask clarifications for:**

- Fundamental architectural decisions that change the entire approach
- User-facing behavior that affects product design
- Business rules that determine feature scope
- Access control and security boundaries

**Make assumptions for:**

- Technical implementation details (document in "Assumptions Made")
- Code organization and patterns (follow existing codebase)
- Library/tool choices (research and choose best fit)
- Performance optimizations (can be refined during implementation)

**Document in Helpful Clarifications & Additional Context:**

- Clarifications from users/stakeholders that would improve implementation
  quality
- Business rules or requirements that need confirmation
- Technical constraints that could be verified with the team
- User preferences or workflow details that would guide design decisions
- Integration details that need stakeholder input

The goal: Only interrupt the user for decisions that would fundamentally change
what gets built, not how it gets built. Use Helpful Clarifications & Additional
Context to document information that would improve implementation quality.

## Quality Checks

Before creating each issue, verify:

- **Specific**: Can a developer start work without questions?
- **Measurable**: Clear success criteria
- **Achievable**: Scoped to 4-16 hours of work
- **Relevant**: Aligns with current milestone/roadmap
- **Time-bound**: Has context about urgency

## Error Handling

- **No arguments**: Show usage examples
- **Ambiguous description**: Request clarification
- **Research failures**: Proceed with warning, note in issue
- **Duplicate detection**: Check existing issues, warn if similar
- **API limits**: Batch in groups, wait between

Remember: Great issues enable great code. Time spent on research and clarity
pays off tenfold during implementation.
