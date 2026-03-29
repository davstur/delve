# Delve — Roadmap

## Phase 1: Scaffold & Static Content

**Goal:** Buildable app with mock data, all core components in Storybook.

- Expo project setup with Expo Router
- Storybook configuration for React Native
- Core components built with mock data:
  - CollapsibleSection (H1-H4 visual hierarchy)
  - BreadcrumbTrail, DepthIndicator
  - TopicCard (home screen)
  - ExpandPanel, SubtopicPanel, AddTopicPanel
  - QuizView, VersionHistoryList, VersionViewer
- Explorer screen assembled from components
- Home screen with hardcoded sample topics
- Navigation between Home and Explorer

**Stories:** home-screen, explore-topic

---

## Phase 2: AI Integration

**Goal:** Core learning loop works end-to-end with live AI.

- Cloud Run FastAPI server deployed
- Claude API integration with web search tool
- Prompt templates: CREATE_TOPIC, EXPAND_NODE, SUGGEST_SUBTOPICS, CREATE_SUBTOPICS, GENERATE_QUIZ
- Pydantic response validation
- Create topic flow (freetext → AI → rendered tree)
- Expand node flow (optional prompt → enriched content)
- Create subtopics flow (suggestions → selection → generation)
- Quiz generation and scoring
- Loading states and error handling
- Source citations displayed inline

**Stories:** create-topic, expand-node, create-subtopics, source-citations, quiz-mode (generation)

---

## Phase 3: Persistence

**Goal:** Topics survive app restarts. Version history enables fearless exploration.

- Supabase schema: topics, nodes, topic_versions, quiz_results tables
- Cloud Run CRUD endpoints for all tables
- Save/load topics across restarts
- Version snapshots before AI mutations
- Version history UI (list + read-only viewer + restore)
- Quiz result storage and history
- Last visited tracking

**Stories:** topic-persistence, version-history, quiz-mode (results storage)

---

## Phase 4: Polish & Mobile UX

**Goal:** Feels like a real app, not a prototype.

- Animations: section expand/collapse, new node appearance, screen transitions
- Haptic feedback on AI actions
- Dark mode (default) + light mode
- Responsive layout (phone vs tablet)
- Onboarding flow for first launch
- Performance optimization for large topics (50+ nodes)

---

## Phase 5: Smart Features

**Goal:** The app gets smarter the more you use it.

- Topic suggestions based on exploration history
- Pre-cached subtopic suggestions per node
- Search across all topics
- Spaced repetition reminders
- Share topic branches as images or links
- Inline visuals (web images, AI-generated diagrams)

**Stories:** topic-suggestions, subtopic-suggestions

---

## Success Metrics by Phase

| Phase | Key Metric | Target |
|---|---|---|
| 1 | All components render in Storybook | 100% coverage |
| 2 | Topic creation time | < 5 seconds |
| 2 | Node expansion time | < 3 seconds |
| 3 | Data survives app restart | 100% reliability |
| 3 | Version restore works correctly | Zero data loss |
| 4 | Smooth 60fps scrolling with 50+ nodes | No jank |
| 5 | User returns within 48 hours | >50% retention |
