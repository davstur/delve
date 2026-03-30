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

## Technical Prerequisites

- Issue: #8 - Scaffold FastAPI server with health check and Docker config
- Issue: #9 - Design and implement Supabase schema for topics and nodes

## Implementation

- Issue: #10 - Implement CREATE_TOPIC API endpoint with Claude AI and web search
- Issue: #11 - Build Create Topic bottom sheet UI with loading and error states
- Issue: #12 - Build API client and topic state management
- Issue: #13 - Wire Create Topic flow end-to-end
- Created: 2026-03-30

## Notes

- This is the "aha!" moment — speed and quality here determine first impression
- The AI must produce genuinely interesting, well-structured breakdowns
- Topic input should accept anything: "Surfing", "How bridges work",
  "The history of jazz", "Quantum computing basics"
