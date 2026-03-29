# Subtopic Suggestions (Post-MVP)

## Story

As a user, I want subtopic suggestions pre-loaded when I tap "Add subtopics",
so the experience feels instant.

## Acceptance Criteria

- [ ] When a node is created, trigger background AI call for 3 subtopic suggestions
- [ ] Suggestions stored in subtopic_suggestions table linked to the node
- [ ] When user taps "Add subtopics", suggestions are already available (no wait)
- [ ] Suggestions refreshed if node content changes (e.g., after expand)
- [ ] Falls back to on-demand generation if no cached suggestions exist

## Priority: 4
## Phase: 5 (Smart Features)

## Notes

- This is a UX optimization — removes the wait time from the subtopic flow
- For MVP, suggestions are generated on-demand when the panel opens
- Pre-caching adds background API calls and storage, worth it only once
  the core flow is proven
