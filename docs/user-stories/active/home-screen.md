# Home Screen

## Story

As a user, I want to see my topics and quickly start a new one, so I can jump
into learning with minimal friction.

## Acceptance Criteria

- [ ] Display list of existing topics with emoji, title, node count, last visited
- [ ] "New Topic" button prominently visible
- [ ] Empty state on first launch with prompt to create first topic
- [ ] Tapping a topic navigates to the Explorer screen
- [ ] Topics sorted by last visited (most recent first)

## Priority: 1
## Phase: 1 (Scaffold)

## Implementation

- Issue: #1 - Initialize Expo project with TypeScript and Router
- Issue: #2 - Configure Storybook for React Native
- Issue: #3 - Build TopicCard component with Storybook stories
- Issue: #4 - Build Home Screen with topic list and empty state
- Created: 2026-03-29

## Notes

- Home screen is the app's first impression — must feel inviting, not empty
- Empty state should make it obvious what to do: "What are you curious about?"
- Node count and last visited give a sense of growing knowledge base
