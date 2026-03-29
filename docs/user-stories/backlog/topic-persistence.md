# Topic Persistence

## Story

As a user, I want my topics saved across app restarts and devices, so my
knowledge base is always available.

## Acceptance Criteria

- [ ] Topics and nodes stored in Supabase via Cloud Run API
- [ ] All CRUD operations go through Cloud Run (no direct Supabase from app)
- [ ] Topics load on app open with full node hierarchy
- [ ] New nodes saved immediately after AI generation
- [ ] Last visited timestamp updated when opening a topic
- [ ] Nodes flat-stored with parentId, reconstructed into tree in memory
- [ ] Graceful error handling if network unavailable

## Priority: 2
## Phase: 3 (Persistence)

## Dependencies

- Requires Supabase schema (topics, nodes, topic_versions tables)
- Requires Cloud Run CRUD endpoints

## Notes

- App should feel instant: load topic list first, lazy-load full node trees
- Consider optimistic UI: show changes immediately, sync in background
