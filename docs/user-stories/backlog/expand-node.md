# Expand Node

## Story

As a user, I want to enrich any section with more detail, optionally with a
focus prompt, so I can go deeper on what interests me.

## Acceptance Criteria

- [ ] "Expand" chip appears below every section's content (H2, H3, H4)
- [ ] Tapping opens an inline panel with optional freetext prompt
- [ ] Examples shown as placeholder: "focus on the physics", "explain like I'm 5"
- [ ] Submitting triggers AI expansion (< 3 seconds target)
- [ ] Loading state shown inline while generating
- [ ] Expanded content replaces the original summary (3-5 paragraphs)
- [ ] Sources updated/added from web search
- [ ] Version created before expansion (for rollback)

## Priority: 1
## Phase: 2 (AI Integration)

## Dependencies

- Requires EXPAND_NODE prompt template
- Requires version history system (for snapshot before expansion)

## Notes

- Freetext prompt is optional — blank means "enrich with general detail"
- The ancestor chain (path from root) is sent to AI for context
- This is where the depth of Delve shines — each expansion should feel
  rewarding, revealing genuinely new information
