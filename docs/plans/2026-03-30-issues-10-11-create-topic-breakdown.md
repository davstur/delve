<!--
LIVING DOCUMENT - Update continuously during implementation.
GOLDEN RULE: If feature is live, remove planning details from this doc.
-->

# Create Topic — Feature Breakdown

**Issues**: #10 (API endpoint), #11 (Bottom sheet UI)
**Started**: 2026-03-30
**Last Updated**: 2026-03-30 by Claude (preflight)
**Status**: Implementation complete — preflight passed

---

## 🎯 Current Focus

**Active Phase**: Complete
**Next Action**: Create PR

## 📊 Overall Progress

| Priority | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| 🟢 MUST  | 4     | 4         | 0           | 0           |
| 🟡 SHOULD| 2     | 2         | 0           | 0           |

---

## 🎯 User-Facing Stories

| # | User Story | Value to User | Priority | Status |
|---|-----------|---------------|----------|--------|
| 1 | User: type a subject and get AI breakdown | Core "aha moment" — instant learning | 🟢 MUST | ✅ Done |
| 2 | User: see loading state during generation | Confidence the app is working | 🟢 MUST | ✅ Done |
| 3 | User: see error and retry on failure | Recover from problems | 🟢 MUST | ✅ Done |
| 4 | User: new topic appears in Home list | Topic persists after creation | 🟢 MUST | ✅ Done |
| 5 | User: see quality AI content with sources | Trust the information | 🟡 SHOULD | ✅ Done |
| 6 | User: smooth sheet + keyboard interaction | Feels polished, not janky | 🟡 SHOULD | ✅ Done |

## 📌 Technical Enablers

| # | Technical Work | Enables | Priority | Status |
|---|---------------|---------|----------|--------|
| T1 | CREATE_TOPIC prompt template + Claude API call (tool_use) | #1, #5 | 🟢 MUST | ✅ Done |
| T2 | POST /api/topics endpoint with Pydantic validation | #1, #3 | 🟢 MUST | ✅ Done |
| T3 | Persist topic + nodes + version (with snapshot) to Supabase | #1, #4 | 🟢 MUST | ✅ Done |
| T4 | CreateTopicSheet component + Storybook stories | #1, #2, #3, #6 | 🟢 MUST | ✅ Done |
| T5 | Wire FAB + empty-state button → sheet → API → navigation | #1, #4 | 🟢 MUST | ✅ Done |

---

## 🔄 Implementation Sequence

### Phase 1: Backend — CREATE_TOPIC Endpoint (Issue #10)

**Goal**: POST /api/topics returns a full topic with nodes from Claude AI.

- T1: Prompt template + Claude API service
- T2: POST /api/topics endpoint with Pydantic request/response models
- T3: Persist to Supabase (4-step sequential insert)

**Key technical details**:

1. **Claude API call**: Sonnet with `web_search_20250305` tool. Response contains
   multiple content blocks (text + web_search_tool_result). Extract JSON from text
   blocks. Timeout: 30 seconds on the Anthropic client.

2. **Pydantic validation**: Validate AI response — root (label, emoji, summary,
   sources) + 4-6 children (label, emoji, color, summary, sources).

3. **4-step sequential insert** (FK constraint order):
   - Step 1: Insert topic → capture topic.id
   - Step 2: Insert version (action="create_topic", snapshot={}) → capture version.id
   - Step 3: Insert root node (depth=1, sort_order=0, parent_id=NULL) → capture root.id
   - Step 4: Batch-insert child nodes (depth=2, sort_order=0,1,2..., parent_id=root.id)

4. **Error cleanup**: On failure after partial inserts, delete in reverse order
   (child nodes → root node → version → topic). Cannot rely on CASCADE because
   nodes.version_id has ON DELETE RESTRICT.

5. **Response shape**: Match GET /api/topics/{id} → `{"topic": {...}, "nodes": [...]}`
   with `nodeCount` added to topic object.

**Test approach (light)**: Manual curl test with 2-3 diverse topics.

### Phase 2: Frontend — Bottom Sheet UI (Issue #11)

**Goal**: User taps FAB or empty-state button, types topic, sees loading, gets result.

- T4: CreateTopicSheet component with @gorhom/bottom-sheet
- T5: Wire into Home screen — replace mock data with API, both buttons open sheet

**Key technical details**:

1. **Both buttons wired**: Empty-state "New Topic" button AND FAB must both open
   the sheet. Give distinct testIDs: `new-topic-button-empty` and `new-topic-fab`.

2. **Sheet states**:
   - **Idle**: Input auto-focused, keyboard open, "Explore" button (disabled when empty).
     Placeholder: "What are you curious about?"
   - **Loading**: Dismiss locked (`enablePanDownToClose={false}`), keyboard dismissed.
     Show topic name prominently + "Exploring [topic]..." with animated indicator.
   - **Error**: Input preserved, error message + "Try Again" button.
     After 3 failures: "Try a different topic" suggestion.
   - **Success**: Navigate immediately to /topic/[id], sheet cleans up behind transition.

3. **Keyboard**: `keyboardBehavior="interactive"`, auto-focus on open, dismiss on submit.

4. **Input validation**: Min 2 chars, max 200. Inline validation, not alert.

5. **Home screen data**: Replace MOCK_TOPICS with API fetch. Use `useFocusEffect` to
   refetch on screen focus (covers back-navigation after creation).

6. **Client timeout**: 45 seconds on fetch call. Show timeout-specific error message.

7. **Accessibility**: `accessibilityLabel` on FAB ("Create new topic"),
   `accessibilityHint` on submit, announce loading state.

**Test approach (light)**: Manual test on iOS Simulator — full flow from FAB tap to Explorer.

---

## 🧪 Testing Checkpoints

| After Phase | Stories Testable | 🚦 Gate | 🤖 AI | 👤 User | Notes |
|-------------|-----------------|---------|-------|---------|-------|
| Phase 1     | None (backend)  | —       | —     | —       | Test via curl |
| Phase 2     | #1-#6 (all)     | Final   | ⬜    | ⬜      | Full flow testable |

### Quality Gate: Phase 2 (Final)

**Validate now (structural):**
- [ ] Bottom sheet interaction feels right (open, loading lock, dismiss)
- [ ] Loading state shows topic name + animated indicator
- [ ] Navigation to Explorer after creation works
- [ ] Topic appears in Home list on back navigation (real API, not mock)
- [ ] Empty-state button works for first-time users

**Defer to final walkthrough:**
- Spacing, typography tweaks in sheet
- Loading animation refinement
- Error message wording polish

---

## 👀 Human Validation

- [ ] AI-generated content quality — are breakdowns interesting and accurate?
- [ ] Response time — realistic expectation with web search (likely 5-15s, not <5s)
- [ ] Source citations — are URLs real and relevant?
- [ ] Bottom sheet keyboard interaction on actual iOS device
- [ ] Loading state feel — does it build anticipation or feel slow?

---

## 🔧 Decision Log

### DEC-001: Error cleanup strategy (revised post-review)
**Status**: Decided
**Decision**: On failure, delete in explicit reverse order: child nodes → root node → version → topic. Cannot use CASCADE because nodes.version_id has ON DELETE RESTRICT.
**Rationale**: Architect review identified that CASCADE won't work with RESTRICT FKs.

### DEC-002: Where to construct the prompt
**Status**: Decided
**Decision**: `server/app/prompts/create_topic.py` — separate module.
**Rationale**: Follows architecture doc structure.

### DEC-003: Initial version record
**Status**: Decided
**Decision**: Create sentinel version with action="create_topic" and empty snapshot `{}`. Required because nodes.version_id is NOT NULL.
**Rationale**: PLATFORM.md says "Creates Version: No (initial)" but schema constraint requires it. Sentinel version is pragmatic — can be excluded from version history UI later.

### DEC-004: Web search response parsing
**Status**: Decided
**Decision**: Extract JSON from the last text content block in Claude's response. Web search tool results appear as separate content blocks — sources are included in the JSON per the prompt instruction.
**Rationale**: Claude returns structured JSON in text blocks alongside web_search_tool_result blocks.

### DEC-005: Loading state UX
**Status**: Decided
**Decision**: Show topic name prominently + "Exploring [topic]..." with animated indicator. Lock sheet dismiss during loading.
**Rationale**: 5-15s with web search is the danger zone. Showing what was submitted + progress prevents user anxiety.

---

## Post-Implementation

1. Review 👀 Human Validation items above
2. Run preflight check: `/project:issues:preflight`
3. Create PR: `/project:issues:create-pr`

## 📝 Session Log

### 2026-03-30 - Session 1
- Started: Breakdown creation
- Architect review: 9 findings (3 concerns, 6 improvements)
- UX review: 10 findings (3 UX risks, 4 specification gaps, 1 taste, 2 improvements)
- Key changes: cleanup strategy revised, loading UX specified, empty-state button added, timeouts added
- Next: Phase 1 implementation
