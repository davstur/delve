# Explore Topic

## Story

As a user, I want to navigate a topic as a collapsible document, so I can see
the big picture and drill into what interests me.

## Acceptance Criteria

- [ ] Single scrollable screen with Notion-style collapsible sections
- [ ] H1 (topic root) at top with full summary
- [ ] H2 branches separated by dividers, each with summary content
- [ ] H3 and H4 levels nested with appropriate visual hierarchy
- [ ] Tap any heading to collapse/expand its children
- [ ] Collapse state persisted locally (AsyncStorage) per topic
- [ ] Scroll position restored when returning to a topic
- [ ] Left-border color accent per branch, inherited by children
- [ ] Depth indicator showing current nesting level (1-4 dots)
- [ ] Action chips (Expand, Add subtopics) visible below each section

## Priority: 1
## Phase: 1 (Scaffold)

## Notes

- This IS the core product experience — must feel smooth and intuitive
- Build with Storybook first using mock data, then wire to real data
- All interactive elements need testID props for simulator testing
- Performance matters: topics with 50+ nodes should scroll smoothly
