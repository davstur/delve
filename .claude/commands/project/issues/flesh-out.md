# Flesh-out Issues Command

You complete draft GitHub issues with comprehensive research and planning,
transforming sketches into implementation-ready specifications.

## Prerequisites

1. GitHub CLI must be configured (`gh auth status`)
2. **REQUIRED: Verify `create.md` command exists in same directory**
   - This command defines the issue template we follow
   - Check for `./create.md` relative to this flesh-out.md file
   - If not found, abort with: "Missing required command: create.md"
3. Load `PLATFORM.md` to understand domain context and conventions

## Command Usage

```
/project:issues:flesh-out #123
```

<arguments>
#$ARGUMENTS
</arguments>

## Process

1. **Verify template reference**:
   - Check that `./create.md` exists (in same directory as this command)
   - If missing: "ERROR: Cannot proceed without create.md command template"

2. **Fetch the issue**:

   ```bash
   gh issue view [issue-number] --json title,body,labels,state
   ```

3. **Validate issue state**:
   - Check for "📝 draft" label → proceed
   - If no draft label → ask: "Issue #123 doesn't have a draft label. Treat as
     draft anyway? (y/N)"
   - If closed → error: "Cannot flesh out closed issue"

4. **Analyze current content**:
   - What sections exist?
   - What's missing compared to create template?
   - What details need expansion?

5. **Research Phase** (following create command approach):
   - Analyze codebase for patterns and conventions
   - Check latest documentation using WebSearch/context7
   - Identify similar implementations
   - Research best practices for the specific feature
   - Consider security and performance implications

6. **Generate missing sections**: Use the comprehensive template from
   `./create.md`:
   - Overview
   - User Story (if applicable)
   - Requirements (detailed)
   - Technical Approach (with research findings)
   - Testing Strategy (including comprehensive manual testing checklist)
   - Security Considerations
   - Performance Considerations
   - Definition of Done
   - Related issues/dependencies
   - Assumptions Made
   - Potential Enhancements (review and update based on research)

   **Special attention to Testing Strategy**:
   - Ensure manual testing checklist is concrete and actionable
   - MUST replace ALL placeholder text with specific test scenarios
   - Create numbered steps that developers can actually follow
   - Include specific test data/accounts (e.g., "admin@test.com", not "[user]")
   - List actual user roles from the system (not generic "Role 1", "Role 2")
   - Specify exact error messages (e.g., "Email already exists", not "[error]")
   - Each test item must include:
     - Test name/description
     - Exact steps to execute
     - Expected result with specific values
     - Space for actual result documentation
   - Include categories: Prerequisites, Core Functionality, User Roles &
     Permissions, Edge Cases, Error Recovery, Cross-Environment, Accessibility
   - Example format:
     ```
     - [ ] **Studio owner invites teacher**
       - Steps: 1) Login as owner@studio.com 2) Navigate to /team 3) Click "Invite" 4) Enter teacher@example.com
       - Expected: Email sent, invitation appears in list with "Pending" status
       - Actual: ___________
     ```
   - Include specific test scenarios derived from requirements
   - Add edge cases discovered during research
   - Specify browser/device testing needs based on project type
   - Include performance benchmarks when relevant

7. **Handle Potential Enhancements**:
   - If section exists: Review items, mark resolved ones as complete or remove
   - If section missing: Add it based on research findings
   - Identify new enhancement opportunities discovered during research
   - Keep only items that truly require stakeholder input or future
     clarification

8. **Present enhanced issue**:

   ```
   Enhanced issue #123: [Title]

   [Show complete enhanced content]

   Changes:
   - Added technical approach with research
   - Expanded requirements with edge cases
   - Added comprehensive testing strategy
   - Updated potential enhancements based on research
   - [List other additions]

   Update issue? (Y/n)
   ```

9. **Update the issue**:

   ```bash
   gh issue edit [issue-number] --body "[enhanced content]"
   ```

10. **Update labels**:

```bash
# Remove draft label
gh issue edit [issue-number] --remove-label "📝 draft"

# Suggest moving to Todo status
echo "Issue fleshed out. Move to 'Todo' status in project board for review, then to 'Ready' when prepared for implementation."
```

## Quality Checks

Before updating:

- All create template sections present
- Research is current (check dates on docs)
- Technical approach is detailed
- Testing covers unit/integration/manual
- Assumptions are explicit

**Manual Testing Validation**:

- [ ] No placeholder text remains (no "[user]", "[action]", "[expected]")
- [ ] Each test has numbered steps that can be followed
- [ ] Test data is specific (real emails, usernames, values)
- [ ] Expected results include exact messages/behaviors
- [ ] Edge cases are realistic for the feature
- [ ] At least one test per acceptance criterion
- [ ] Browser/device requirements explicitly stated

**Manual Testing Checklist Quality**:

- [ ] Each test scenario has clear steps
- [ ] Expected outcomes are specific
- [ ] Edge cases from requirements are covered
- [ ] Browser/device needs match project type
- [ ] Performance criteria have measurable targets
- [ ] Security tests verify authorization and validation
- [ ] Test data requirements are documented

## Example Flow

```
$ /project:issues:flesh-out #123

Fetching issue #123...
✓ Issue is marked as draft
✓ Template reference found

Analyzing current content...
Missing sections:
- Technical Approach
- Testing Strategy
- Security Considerations

Researching...
✓ Found similar pattern in src/api/users.ts
✓ Latest Next.js 14 docs recommend App Router
✓ Security: Need rate limiting for this endpoint

[Shows enhanced issue]

Update issue? Y

✅ Issue #123 fleshed out
📝 Removed draft label
➡️ Move to Todo for review, then to Ready for implementation
```
