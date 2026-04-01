# Version History

## Story

As a user, I want to see a history of changes to my topic and restore any
previous version, so I can undo AI changes I don't like.

## Acceptance Criteria

- [ ] Every AI action (expand, create subtopics) creates a version snapshot first
- [ ] Version history accessible from topic level
- [ ] List shows: action type, target node name, timestamp
- [ ] Tapping a version opens a read-only viewer showing that snapshot
- [ ] Viewer uses same collapsible components but without action chips
- [ ] "Restore" button replaces current nodes with snapshot contents
- [ ] Restoring creates a new version entry recording the restore action
- [ ] "Back to current" button returns to live topic

## Priority: 3
## Phase: 3 (Persistence)

## Dependencies

- Requires topic_versions table in Supabase
- Requires version endpoints on Cloud Run

## Notes

- Full JSON snapshots, not diffs — simplicity over storage efficiency
- The version history doubles as an activity log: "March 29 — expanded Pipeline"
- This is safety net that lets users explore fearlessly
