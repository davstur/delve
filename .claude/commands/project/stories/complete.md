# Complete Story Command

You mark stories as complete by adding metadata and archiving them, maintaining
a historical record of implemented features.

## Prerequisites

1. Check that `docs/user-stories/active/` and `docs/user-stories/completed/`
   directories exist
2. Verify story exists in active folder before completion

## Command Usage

```
/project:stories:complete "invoice-pdf-export"
```

<arguments>
#$ARGUMENTS
</arguments>

## Process

1. **Search for story** in `/docs/user-stories/active/`
   - Match by filename (with or without .md extension)
   - If not found, list active stories for selection

2. **Check implementation status**:

   ```bash
   # Search for issues referencing this story
   gh issue list --state all --search "invoice-pdf-export"
   ```

   If open issues exist:

   ```
   ⚠️ Found open issues for this story:
   - #123: Add PDF export API endpoint (open)
   - #124: Create PDF template (open)

   Complete story anyway? (y/N)
   ```

3. **Add completion metadata** to the story file:

   ```markdown
   ## Implementation

   - Completed: [today's date]
   - Related PRs: [if found via gh pr list]
   - Final implementation notes: [any learnings]
   ```

4. **Move file** from `/docs/user-stories/active/` to
   `/docs/user-stories/completed/`

5. **Update story-map.md** if it exists:
   - Move story reference to completed section
   - Update completion date
   - Note any follow-up stories created

6. **Summary**:

   ```
   ✅ Story completed: invoice-pdf-export.md

   Summary:
   - Duration: [calculated from git history]
   - Related issues: [count]
   - PRs merged: [count]

   Story archived to: docs/user-stories/completed/invoice-pdf-export.md

   Any follow-up stories needed? (y/N)
   ```

## Completion Checks

Before marking complete:

- All acceptance criteria should be met
- Related GitHub issues should be closed
- Any follow-up work should be captured in new stories

## Integration Notes

- Completed stories serve as documentation of what was built
- They maintain the full history including implementation notes
- Useful for retrospectives and understanding past decisions
- Can be referenced when similar features are requested
