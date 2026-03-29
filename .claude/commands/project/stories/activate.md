# Activate Story Command

You activate stories by moving them from backlog to active development, ensuring
they're ready for implementation.

## Prerequisites

1. Check that `docs/user-stories/backlog/` and `docs/user-stories/active/`
   directories exist
2. Verify story exists in backlog before attempting activation

## Command Usage

```
/project:stories:activate "invoice-pdf-export"
```

<arguments>
#$ARGUMENTS
</arguments>

## Process

1. **Search for story** in `/docs/user-stories/backlog/`
   - Match by filename (with or without .md extension)
   - If not found, list available stories and ask for selection

2. **Read and display the story** for review:

   ```
   Story: invoice-pdf-export.md

   [Display story content]

   Ready to activate? (Y/n)
   ```

3. **Check completeness**:
   - Has clear acceptance criteria?
   - Dependencies resolved?
   - Technical notes adequate?
   - No open questions that block implementation?

   If incomplete:

   ```
   ⚠️ This story may not be ready:
   - [List any issues]

   Activate anyway? (y/N)
   ```

4. **Move file** from `/docs/user-stories/backlog/` to
   `/docs/user-stories/active/`

5. **Update story-map.md** if it exists:
   - Move story reference from backlog section to active section
   - Update any status indicators

6. **Offer next steps**:

   ```
   ✅ Story activated: invoice-pdf-export.md

   Next steps:
   1. Create implementation issues: /project:issues:create --story "invoice-pdf-export"
   2. Or suggest issues first: /project:issues:suggest "For story invoice-pdf-export"

   Create issues now? (Y/n)
   ```

## Error Handling

- **Story not found**: List all stories in backlog with numbers for selection
- **Already active**: Check if story is already in active folder
- **Multiple matches**: List matches and ask which one
- **File permissions**: Ensure we can move files between directories

## Integration Notes

- This is primarily a file operation (move from backlog/ to active/)
- The activation signals that a story is ready for implementation
- Active stories are referenced when creating issues with `--story` flag
- Only stories in active/ should have associated GitHub issues
