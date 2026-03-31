<!--
LIVING DOCUMENT - Update continuously during implementation.
-->

# Expand Node — Feature Breakdown

**Issues**: #21 (API endpoint), #22 (Frontend wiring)
**Started**: 2026-03-31
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Phase 1 — Backend endpoint

## 📊 Overall Progress

| Priority | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| 🟢 MUST  | 4     | 0         | 0           | 4           |
| 🟡 SHOULD| 1     | 0         | 0           | 1           |

---

## 🎯 User-Facing Stories

| # | User Story | Priority | Status |
|---|-----------|----------|--------|
| 1 | User: expand any section for richer detail | 🟢 MUST | ❌ |
| 2 | User: provide optional focus prompt ("explain like I'm 5") | 🟢 MUST | ❌ |
| 3 | User: see inline loading during expansion | 🟢 MUST | ❌ |
| 4 | User: see error + retry if expansion fails | 🟢 MUST | ❌ |
| 5 | User: expanded content has web-sourced citations | 🟡 SHOULD | ❌ |

## 📌 Technical Enablers

| # | Technical Work | Enables | Status |
|---|---------------|---------|--------|
| T1 | EXPAND_NODE prompt template | #1, #2 | ❌ |
| T2 | POST /api/topics/{id}/nodes/{nodeId}/expand endpoint | #1, #3, #4 | ❌ |
| T3 | Version snapshot before expansion | #1 (rollback safety) | ❌ |
| T4 | Ancestor chain builder (node → root path) | #1 | ❌ |
| T5 | ExpandPanel inline UI component | #2, #3, #4 | ❌ |
| T6 | Wire chip → panel → API → tree update in Explorer | #1 | ❌ |
| T7 | expandNode() in api/client.ts | #1 | ❌ |

---

## 🔄 Implementation Sequence

### Phase 1: Backend — EXPAND_NODE Endpoint (#21)

- T1: Prompt template in `server/app/prompts/expand_node.py`
- T4: Ancestor chain: walk parent_id from node to root
- T3: Version snapshot: fetch all topic nodes, save as JSONB before mutation
- T2: POST endpoint with Pydantic validation + node update

**Key details**:
- Reuse `generate_topic` pattern but with EXPAND_NODE prompt
- AI response: `{ summary: string, content: string | null, sources: Source[] }`
- Simpler than CREATE_TOPIC — single node update, not multi-insert
- Update node's summary, sources, updated_at. Optionally set content field.
- Version action: "expand"

### Phase 2: Frontend — Wire Expand Chip (#22)

- T7: `expandNode(topicId, nodeId, prompt?)` in api/client.ts
- T5: ExpandPanel component (inline input + submit)
- T6: Wire into CollapsibleSection + Explorer state update

**Key details**:
- Replace "Coming soon" alert on Expand chip with real flow
- ExpandPanel: small inline text input below chip, "Go" button
- States: idle → input panel open → loading → success (content updates) / error
- On success: update the specific node in Explorer's tree state (not full refetch)
- On error: show inline error with retry

---

## 🔧 Decisions

- **DEC-001**: Update node in-place in tree state (not refetch entire topic)
- **DEC-002**: Version snapshot includes all nodes (same as create_topic pattern)
- **DEC-003**: Use tool_use for structured AI response (same pattern as create_topic)

---

## 📝 Session Log

### 2026-03-31 - Session 1
- Breakdown created, skipping bounce (follows established pattern)
- Next: Phase 1 implementation
