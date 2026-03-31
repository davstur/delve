<!--
LIVING DOCUMENT - Update continuously during implementation.
-->

# Create Subtopics — Feature Breakdown

**Issues**: #24 (API endpoints), #25 (Frontend UI)
**Started**: 2026-03-31
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Phase 1 — Backend endpoints

## 📊 Overall Progress

| Priority | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| 🟢 MUST  | 5     | 0         | 0           | 5           |
| 🟡 SHOULD| 1     | 0         | 0           | 1           |

---

## 🎯 User-Facing Stories

| # | User Story | Priority | Status |
|---|-----------|----------|--------|
| 1 | User: see AI-suggested subtopics for any section | 🟢 MUST | ❌ |
| 2 | User: select suggestions + type custom labels | 🟢 MUST | ❌ |
| 3 | User: new child nodes appear in tree after creation | 🟢 MUST | ❌ |
| 4 | User: see loading states during suggest + create | 🟢 MUST | ❌ |
| 5 | User: cannot add subtopics to H4 (max depth enforced) | 🟢 MUST | ❌ |
| 6 | User: version created before adding subtopics | 🟡 SHOULD | ❌ |

## 📌 Technical Enablers

| # | Technical Work | Enables | Status |
|---|---------------|---------|--------|
| T1 | SUGGEST_SUBTOPICS prompt + tool_use | #1 | ❌ |
| T2 | CREATE_SUBTOPICS prompt + tool_use | #3 | ❌ |
| T3 | POST suggest-subtopics endpoint | #1 | ❌ |
| T4 | POST create subtopics endpoint (with depth check + version) | #3, #5, #6 | ❌ |
| T5 | suggestSubtopics() + createSubtopics() in api/client.ts | #1, #3 | ❌ |
| T6 | SubtopicPanel inline component | #1, #2, #4 | ❌ |
| T7 | Wire chip → panel → API → tree update | #3 | ❌ |

---

## 🔄 Implementation Sequence

### Phase 1: Backend — Suggest + Create Endpoints (#24)

- T1: SUGGEST_SUBTOPICS prompt (node + ancestors + existing children → 3 suggestions)
- T2: CREATE_SUBTOPICS prompt (node + labels → full child nodes with content)
- T3: POST /api/topics/{id}/nodes/{nodeId}/suggest-subtopics
- T4: POST /api/topics/{id}/nodes/{nodeId}/subtopics

**Key details**:
- Suggest: lightweight, no web search needed, no version snapshot
- Create: web search for content quality, version snapshot before mutation
- Depth check: reject if parent.depth >= 4
- New nodes: depth = parent.depth + 1, sort_order continues from existing children
- Reuse AI service patterns from expand_node (tool_use + Pydantic)
- Suggest returns: `[{ label, emoji }]` (3 items)
- Create accepts: `{ labels: string[] }` (1-5 items)
- Create returns: created nodes array

### Phase 2: Frontend — SubtopicPanel + Wire (#25)

- T5: Client functions in api/client.ts
- T6: SubtopicPanel component (suggestion chips + custom input + create button)
- T7: Wire into CollapsibleSection + Explorer tree update

**Key details**:
- Replace "Coming soon" alert on "Add subtopics" chip
- SubtopicPanel states: loading suggestions → display chips → selecting → creating → done
- Suggestion chips: toggleable (selected/unselected)
- Custom input: text field + "+" to add custom labels
- On create success: add new children to parent in tree state
- New nodes need branchColor inherited from parent's branch

---

## 🔧 Decisions

- **DEC-001**: Suggest uses no web search (speed) — just Claude reasoning from context
- **DEC-002**: Create uses web search for content quality (same as expand)
- **DEC-003**: Single AI call for all labels in create (batch, cap at 5 labels)
- **DEC-004**: sort_order: fetch MAX(sort_order) for parent's children right before insert, new nodes start at max+1
- **DEC-005**: Color for new nodes: server assigns parent's branch color (not AI-generated). H2 ancestor color inherited via buildTree.
- **DEC-006**: On-demand suggest (not pre-generated as product spec suggests). Pragmatic for MVP — avoids background jobs + new DB table. Revisit if latency is a UX problem.
- **DEC-007**: Version snapshot ordering: AI call → validate → snapshot → mutate (same as expand — no orphaned versions)
- **DEC-008**: Depth check: return 422 (not 400) for H4 parents. UI already hides chip; API is defense-in-depth.
- **DEC-009**: Include existing sibling labels in both suggest AND create prompts for deduplication.

---

## 📝 Session Log

### 2026-03-31 - Session 1
- Breakdown created
- Architect review: 10 findings (3 concerns, 7 improvements)
- Key changes: color server-assigned, version after AI, sort_order fetch-before-insert, suggest error state
- Next: Implementation
