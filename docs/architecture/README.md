# Delve — Architecture Overview

## System Diagram

```
┌─────────────────┐     HTTPS/JSON     ┌──────────────────┐     SQL      ┌───────────┐
│                 │ ──────────────────► │                  │ ──────────► │           │
│  React Native   │                    │  FastAPI Server   │             │  Supabase │
│  Expo App       │ ◄──────────────── │  (Cloud Run)      │ ◄────────── │  Postgres │
│                 │                    │                  │             │           │
└─────────────────┘                    └────────┬─────────┘             └───────────┘
                                                │
                                                │ Claude API
                                                │ (Sonnet + web search)
                                                ▼
                                       ┌──────────────────┐
                                       │  Anthropic API   │
                                       └──────────────────┘
```

## Key Architectural Decisions

1. **All traffic through Cloud Run** — the app has a single API client. No
   direct Supabase connection from the mobile app. This keeps API keys
   server-side and lets us evolve the backend without app updates.

2. **Flat node storage, in-memory trees** — nodes stored flat in Postgres with
   `parent_id` references. Reconstructed into hierarchies client-side. This
   makes queries simple and avoids nested document complexity.

3. **Full-snapshot versioning** — every AI action snapshots the entire topic
   state as JSON before applying changes. Simple restore: replace nodes with
   snapshot. No diff computation needed.

4. **Structured JSON responses** — all AI prompts return typed JSON. No
   free-text parsing. The app renders JSON directly into components.

5. **Web search grounding** — all content generation uses Claude's web search
   tool. Content is factual and cited, not hallucinated.

## Component Architecture (Mobile)

```
App (Expo Router)
├── (tabs)/
│   └── index.tsx          — Home screen (topic list)
├── topic/[id].tsx         — Explorer screen (stack push, hides tab bar)
├── components/
│   ├── CollapsibleSection — Core content display (H1-H4)
│   ├── ExpandPanel        — Inline expand prompt
│   ├── SubtopicPanel      — Subtopic suggestions + create
│   ├── AddTopicPanel      — New topic creation
│   ├── TopicCard          — Home screen topic tile
│   ├── QuizView           — Quiz question + score screens
│   ├── VersionHistoryList — Version timeline
│   ├── VersionViewer      — Read-only snapshot viewer
│   ├── BreadcrumbTrail    — Ancestor path display
│   └── DepthIndicator     — Visual depth dots
├── api/
│   └── client.ts          — Single API client for Cloud Run
├── store/
│   └── topicStore.ts      — In-memory topic/node state
└── types/
    └── index.ts           — Shared TypeScript types
```

## API Server Architecture (Cloud Run)

```
server/
├── main.py                — FastAPI app, CORS, middleware
├── routers/
│   ├── topics.py          — Topic CRUD + AI generation
│   ├── nodes.py           — Node operations (expand, subtopics)
│   ├── quiz.py            — Quiz generation + submission
│   └── versions.py        — Version history + restore
├── services/
│   ├── ai.py              — Claude API client, prompt construction
│   ├── db.py              — Supabase client, queries
│   └── web_search.py      — Web search tool configuration
├── prompts/
│   ├── system.py          — Shared system prompt
│   ├── create_topic.py    — CREATE_TOPIC template
│   ├── expand_node.py     — EXPAND_NODE template
│   ├── subtopics.py       — SUGGEST/CREATE_SUBTOPICS templates
│   └── quiz.py            — GENERATE_QUIZ template
├── models/
│   └── schemas.py         — Pydantic request/response models
└── config.py              — Environment variables, settings
```

## Data Flow: Create Topic

```
1. User types "Surfing" → taps Create
2. App POST /topics {title: "Surfing"}
3. Cloud Run constructs CREATE_TOPIC prompt with web search tool
4. Claude API returns structured JSON (root + H2 branches with sources)
5. Cloud Run validates JSON against Pydantic schema
6. Cloud Run inserts topic + nodes into Supabase
7. Cloud Run creates initial version snapshot
8. Cloud Run returns full topic to app
9. App navigates to Explorer, renders collapsible tree
```

## Data Flow: Expand Node

```
1. User taps "Expand" on "How Swells Form", types "focus on physics"
2. App POST /topics/{id}/nodes/{nodeId}/expand {prompt: "focus on physics"}
3. Cloud Run fetches node + ancestor chain from Supabase
4. Cloud Run creates version snapshot (pre-expansion)
5. Cloud Run constructs EXPAND_NODE prompt with context + user prompt
6. Claude API returns enriched content JSON with sources
7. Cloud Run updates node in Supabase (new summary, sources)
8. Cloud Run returns updated node to app
9. App replaces section content, animates transition
```

## See Also

- [ADR 001: Initial Stack](decisions/001-initial-stack.md) — why these technologies
- [Product Vision](../product/VISION.md) — what we're building and why
- [MVP Spec](../product/MVP_SPEC.md) — what's in scope
