# Quiz Mode

## Story

As a user, I want to test my understanding of a topic with a quiz, so I can
validate what I've learned and identify gaps.

## Acceptance Criteria

- [ ] "Quiz" button accessible from topic level (H1)
- [ ] AI generates 5-10 multiple choice questions based on all topic content
- [ ] Questions test connections across branches, not just isolated facts
- [ ] Each question has 4 options, one correct
- [ ] Progress bar shows current question number
- [ ] After completion: score, per-question explanations, related node paths
- [ ] Quiz results stored in Supabase (score, answers, timestamp)
- [ ] Can retake — results history shows improvement over time

## Priority: 3
## Phase: 2 (AI Integration) + Phase 3 (Persistence for results)

## Dependencies

- Requires GENERATE_QUIZ prompt template
- Requires quiz_results table in Supabase

## Notes

- Quiz closes the learning loop — "I browsed" becomes "I know"
- Questions that connect branches are more interesting: "Given what you
  learned about wave physics, which safety factor is most affected by swell
  period?"
- Score screen should point to specific nodes worth revisiting
