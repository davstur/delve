# Topic Suggestions (Post-MVP)

## Story

As a returning user, I want AI-suggested topics based on my exploration
history, so I always have something interesting to explore next.

## Acceptance Criteria

- [ ] After each AI action, background refresh of topic suggestions
- [ ] 5-8 suggestions kept fresh, stored in topic_suggestions table
- [ ] Suggestions shown in "New Topic" panel alongside freetext input
- [ ] Each suggestion has label, emoji, and rationale (connection to history)
- [ ] Stale suggestions (>7 days or already used) replaced on next refresh
- [ ] User can pick a suggestion or ignore and type freetext

## Priority: 4
## Phase: 5 (Smart Features)

## Notes

- Only valuable after user has 5+ topics — needs history to suggest well
- Rationale is key: "You explored nuclear energy and climate policy — try
  Carbon Capture" makes the suggestion feel intelligent, not random
