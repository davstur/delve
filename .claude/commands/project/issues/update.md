# Update Issues Command

You update existing GitHub issues with new information while maintaining the
structure and quality established by the create command.

## Prerequisites

1. GitHub CLI must be configured (`gh auth status`)
2. **REQUIRED: Verify `create.md` command exists in same directory**
   - This command defines the issue structure we maintain
   - Check for `./create.md` relative to this update.md file
   - If not found, abort with: "Missing required command: create.md"
3. Load cached labels from `.workflow/config.json` if available:
   - Check `github.labels.available` for quick validation of what labels exist
   - Reference `github.labels.project_specific` for app/module/team labels
4. **IMPORTANT: Load `.claude/commands/project/github-cli-reference.md`**:
   - Essential when updating issues that have or need dependency relationships
   - Covers GraphQL mutations for parent/child and blocking relationships
   - Includes parameter naming (which ID means "blocked" vs "blocker")
   - Reference error recovery patterns if commands fail

## Command Usage

```
/project:issues:update #123 "Add support for bulk operations"
/project:issues:update #123 "Customer requested CSV export option"
```

<arguments>
#$ARGUMENTS
</arguments>

## Process

1. **Verify template reference**:
   - Check that `./create.md` exists (in same directory as this command)
   - If missing: "ERROR: Cannot proceed without create.md command template"

2. **Parse arguments**:
   - Extract issue number
   - Extract update description/context

3. **Fetch current issue**:

   ```bash
   gh issue view [issue-number] --json title,body,labels,state
   ```

4. **Validate issue state**:
   - If closed → error: "Cannot update closed issue"
   - If has "📝 draft" label → suggest using flesh-out instead

5. **Analyze update request**:
   - What type of update? (new requirement, clarification, scope change)
   - Which sections need updating?
   - Does this change the technical approach?

6. **Research if needed**:
   - If technical change: research new approach
   - If new requirement: consider impact on existing plan
   - Check if this affects dependencies

7. **Update relevant sections**: Depending on the update type:

   **New Requirement**:
   - Add to Requirements section
   - Update Technical Approach if needed
   - Adjust Testing Strategy (add new manual test scenarios)
   - Review Potential Enhancements (remove resolved, add new)
   - Note in update history

   **Scope Change**:
   - Update Overview
   - Revise Requirements
   - Adjust estimates/complexity
   - Update Potential Enhancements based on new scope

   **Technical Change**:
   - Update Technical Approach
   - Revise implementation plan
   - Check if testing approach changes (update manual test scenarios)
   - Review if technical decisions resolve any enhancements

   **For Potential Enhancements section**:
   - If missing: Add section with current enhancement opportunities
   - If exists: Review all items, mark resolved ones or remove
   - Add new items discovered during update research
   - Ensure items focus on clarifications that would improve the issue

8. **Add update history**: Append to issue body:

   ```markdown
   ## Updates

   ### [Today's date] - [Brief description]

   - [What changed]
   - [Why it changed]
   - [Impact on implementation]
   ```

9. **Present changes**:

   ```
   Updating issue #123: [Title]

   Update type: [New requirement/Scope change/Technical update]

   Changes:
   [Show diff or highlight changes]

   Apply update? (Y/n)
   ```

10. **Update the issue**:

    ```bash
    gh issue edit [issue-number] --body "[updated content]"
    ```

11. **Consider label updates**:

- Add "❓ needs-clarification" if update creates questions
- Add native GitHub blocking relationship if update reveals blockers (see
  `github-cli-reference.md` for `addBlockedBy` GraphQL mutation)
- Suggest priority re-evaluation if scope changed significantly
- Check `.workflow/config.json` for project-specific labels:
  - If update changes which app/module is affected, update labels
  - Example: Moving from "app:admin" to "app:studio" if scope shifts
  - Only apply labels that exist in `github.labels.available`

## Update Types Examples

### Adding Requirements

```
Original: "User can export data"
Update: "Add CSV format option"
Result: Requirements section gets "- [ ] Support CSV export format"
```

### Technical Clarification

```
Update: "Use Next.js App Router instead of Pages"
Result: Technical Approach revised with new patterns
```

### Scope Reduction

```
Update: "Skip email notifications for MVP"
Result: Requirement moved to "Future Enhancements" section
```

## Quality Checks

- Maintain issue structure from create template
- Keep update history for traceability
- Don't lose existing information
- Flag if update invalidates existing work
- Ensure Potential Enhancements section is current and actionable
- Remove outdated enhancement items, keep only relevant ones

## Integration Notes

- Updates should be incremental, not replacements
- Maintain history of changes for context
- Consider impact on implementation if issue is "In Progress"
- Significant updates may warrant priority re-evaluation
