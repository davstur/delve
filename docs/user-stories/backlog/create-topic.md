# Create Topic

## Story

As a user, I want to type any subject and get an instant hierarchical
breakdown, so I can start exploring immediately.

## Acceptance Criteria

- [ ] Tapping "New Topic" opens input with freetext field
- [ ] User types a subject and taps "Create"
- [ ] Loading state while AI generates content (< 5 seconds target)
- [ ] AI returns topic root (H1) with 4-6 H2 branches
- [ ] Each branch has emoji, color, and 8-10 sentence summary
- [ ] Content is grounded via web search with source citations
- [ ] Navigates to Explorer screen showing the new topic
- [ ] Error state if AI generation fails

## Priority: 1
## Phase: 2 (AI Integration)

## Dependencies

- Requires Cloud Run API server deployed
- Requires Claude API with web search tool configured
- Requires CREATE_TOPIC prompt template

## Notes

- This is the "aha!" moment — speed and quality here determine first impression
- The AI must produce genuinely interesting, well-structured breakdowns
- Topic input should accept anything: "Surfing", "How bridges work",
  "The history of jazz", "Quantum computing basics"
