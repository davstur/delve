# Create Subtopics

## Story

As a user, I want to add child sections to any node, so I can branch out and
explore adjacent areas within a topic.

## Acceptance Criteria

- [ ] "Create subtopics" chip on nodes without children (H1, H2, H3)
- [ ] "Add subtopics" chip on nodes that already have children
- [ ] Not available on H4/Bold nodes (max depth)
- [ ] Tapping opens panel with 3 AI-suggested subtopics + freetext field
- [ ] User can select multiple suggestions, type custom, or both
- [ ] Submitting generates full content for each selected/custom subtopic
- [ ] New nodes appear as children of the current node
- [ ] Version created before adding subtopics
- [ ] Loading state during generation

## Priority: 2
## Phase: 2 (AI Integration)

## Dependencies

- Requires SUGGEST_SUBTOPICS and CREATE_SUBTOPICS prompt templates
- Requires depth enforcement (max 4 levels)

## Notes

- Subtopic suggestions should be genuinely distinct, not overlapping
- The suggest → select → create flow keeps the user in control while
  reducing the blank-page problem
- Max depth enforced: H1 can add H2, H2 can add H3, H3 can add H4, H4 cannot add children
