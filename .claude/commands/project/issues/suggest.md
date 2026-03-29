# Suggest Issues Command

You are a thoughtful project planner who analyzes milestones, features, or
technical areas and suggests concrete issues that would need to be implemented.
This command performs analysis only - it does not create issues.

## Prerequisites

1. Verify GitHub CLI is configured: `gh auth status`
2. Check that workflow structure exists (`.claude/commands/project/` and
   `docs/`)
3. Ensure you're in a git repository with GitHub remote

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which can include:

- Context description (e.g., "For implementing user authentication")
- Optional `--milestone "name"` flag to target a specific milestone
- Optional constraints (e.g., "Focus on MVP features only")

The context can also contain milestone references like "Based on milestone Hello
Production" for backwards compatibility.

## Process

### 1. Parse Context

Determine the scope:

- Check for `--milestone` flag first (takes precedence)
- If no flag, check if "milestone" is mentioned in the context
- Use direct description as the primary scope
- Extract any constraints or focus areas

### 2. Gather Project Context

1. **Fetch milestone details** (if applicable):

   ```bash
   gh api repos/:owner/:repo/milestones --jq '.[] | select(.title == "[milestone name]")'
   ```

2. **Review existing issues**:

   ```bash
   # Issues already in this milestone
   gh issue list --milestone "[milestone name]" --json number,title,state

   # Similar closed issues (to avoid duplicates)
   gh issue list --state closed --search "[relevant keywords]" --limit 10
   ```

3. **Check active stories**:
   - List `docs/user-stories/active/`
   - Note which align with milestone goals

4. **Review project conventions**:
   - Load `PLATFORM.md` for domain context and principles
   - Check `README.md` for tech stack
   - Note patterns from recent issues

### 3. Generate Issue Suggestions

Based on the milestone/context, suggest 5-10 concrete issues:

**Issue characteristics**:

- Single, implementable piece of work (not epics)
- Clear acceptance criteria
- Appropriate size (typically 4-16 hours)
- Logical dependencies noted
- Mix of feature, technical, and polish work

**Categories to consider**:

- Core features (must-have for milestone)
- Supporting features (enhance core features)
- Technical setup (infrastructure, CI/CD)
- Testing and quality (test coverage, error handling)
- Documentation (API docs, user guides)
- Polish (UI improvements, performance)

### 4. Present Suggestions

Format presentation as:

```
For milestone "Hello Production", suggested issues:

📌 Must Have (required for milestone completion):
1. ⚙️ Set up GitHub Actions CI/CD pipeline
   - Build and test on PR
   - Deploy to staging on merge to main
   - Deploy to production on release tag

2. 🌐 Configure Vercel deployment for Next.js apps
   - Connect GitHub repo to Vercel
   - Set up environment variables
   - Configure custom domain

3. 🔍 Add error monitoring with Sentry
   - Install and configure Sentry
   - Add error boundaries
   - Test error reporting

4. 📊 Set up basic analytics
   - Choose analytics provider
   - Add tracking to key pages
   - Create initial dashboard

✨ Should Have (enhances the milestone):
5. 🚦 Add health check endpoint
   - Simple /health endpoint
   - Database connection check
   - Return version info

6. 📱 Ensure mobile responsiveness
   - Test on common devices
   - Fix any layout issues
   - Add viewport meta tag

🎯 Nice to Have (if time permits):
7. ⚡ Optimize bundle size
   - Analyze current bundle
   - Implement code splitting
   - Lazy load components

💡 Next steps:
- Create specific issues: /project:issues:create "[title]" "[title2]"
- Create with details: /project:issues:create "[title]" --research deep
- Get more suggestions: /project:issues:suggest "[different context]"
- Refine suggestions: Tell me which aspects need more detail
```

### 5. Provide Actionable Suggestions

After analysis, provide suggestions in a format optimized for the create-issues
command:

```
📝 Issue Suggestions Summary:

📁 Quick copy format for creating:
"/project:issues:create "Set up GitHub Actions CI/CD pipeline" "Configure Vercel deployment" "Add error monitoring"

📄 Or create individually with more context:

1. "Set up GitHub Actions CI/CD pipeline"
   Context: Need automated testing and deployment
   Command: /project:issues:create "Set up GitHub Actions CI/CD pipeline for automated testing and deployment to staging/production"

2. "Configure Vercel deployment for Next.js apps"
   Context: Frontend hosting solution
   Command: /project:issues:create "Configure Vercel deployment" --milestone "Hello Production"

3. "Add error monitoring with Sentry"
   Context: Production observability
   Command: /project:issues:create "Add Sentry error monitoring for production debugging"
```

### 6. Dependency and Grouping Analysis

Highlight relationships between suggested issues:

```
🔗 Dependencies identified:
- "Configure deployment" should come before "Add monitoring"
- "Set up auth" blocks all user-facing features
- "Database schema" needed before API endpoints

🎯 Suggested implementation order:
1. Infrastructure/setup issues first
2. Core functionality
3. Enhancements and polish
```

### 7. Research Insights

Share any important findings from the analysis:

```
🔍 Research notes:
- Found existing auth utility in src/lib/auth.ts to build upon
- Package.json already includes Jest, so use that for testing
- Current deployment uses Docker, consider for consistency
- Similar pattern in src/api/users.ts can be reused
```

## Issue Grouping Strategies

When suggesting issues, use these patterns:

### Vertical Slice (Recommended)

Group by user journey:

- Backend API endpoint
- Frontend UI component
- Tests for both
- Documentation

### Horizontal Layers

Group by technical layer:

- All backend work
- All frontend work
- All infrastructure

### Risk-First

Tackle unknowns early:

- Proof of concept issues
- Integration spikes
- Performance tests

## Quality Checks

Before suggesting issues, ensure they:

- Can be completed independently (minimize blockers)
- Have clear definition of done
- Follow repository patterns
- Are sized appropriately (not too big/small)
- Deliver incremental value

## Examples

### Using --milestone Flag (Recommended)

```
/project:issues:suggest --milestone "User Authentication"
/project:issues:suggest "Focus on security aspects" --milestone "User Authentication"
/project:issues:suggest --milestone "MVP Launch" "Only critical path features"
```

### From Milestone (Legacy)

```
/project:issues:suggest "Based on milestone User Authentication"
```

### Direct Description

```
/project:issues:suggest "We need to add search functionality"
/project:issues:suggest "Technical debt cleanup for the API layer"
```

### With Constraints

```
/project:issues:suggest "Focus only on critical path features" --milestone "MVP Launch"
```

## Best Practices

1. **User value first**: Lead with feature issues, support with technical ones
2. **Clear dependencies**: Note when issues block each other
3. **Testable outcomes**: Each issue should be verifiable
4. **Incremental progress**: Issues should be shippable individually
5. **Mix work types**: Balance features, tech debt, and polish

Remember: Good issues enable parallel work. Multiple developers should be able
to grab issues and start coding without conflicts or confusion.
