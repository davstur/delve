# Delve — Story Map

## User Journey: Skeptical -> Trying -> Hooked

```
DISCOVER          FIRST TOPIC         EXPLORE           BUILD KNOWLEDGE     VALIDATE
(Home Screen)     (Create Flow)       (Explorer)        (Return Visit)      (Quiz)
─────────────     ──────────────      ─────────────     ─────────────────   ──────────
See empty state   Type a topic        Read summaries    See topic list      Take quiz
      │           AI generates tree   Collapse/expand   Continue exploring  See score
      ▼                 │             Tap "Expand"      Add subtopics       Review weak areas
Tap "New Topic"         ▼                  │            Version history     Retake quiz
                  See breakdown            ▼
                  in seconds          Go deeper
                        │             with focus
                        ▼             prompt
                  "Aha!" moment
```

## Story Dependencies (Critical Path)

```
home-screen ──► create-topic ──► explore-topic ──► expand-node
                                       │                │
                                       ▼                ▼
                                 collapse-sections   create-subtopics
                                       │                │
                                       ▼                ▼
                                 topic-persistence   version-history
                                       │
                                       ▼
                                  quiz-mode
```

## Active Stories

1. [home-screen](user-stories/active/home-screen.md) — Landing experience **[ACTIVE]**

## Stories by Priority

### Priority 1 — Core Loop (must work for any value)
1. ~~[home-screen](user-stories/active/home-screen.md) — Landing experience~~ **[ACTIVE]**
2. [create-topic](user-stories/backlog/create-topic.md) — First topic creation
3. [explore-topic](user-stories/backlog/explore-topic.md) — Navigate the knowledge tree
4. [expand-node](user-stories/backlog/expand-node.md) — Go deeper on any section

### Priority 2 — Growth & Depth (makes it sticky)
5. [create-subtopics](user-stories/backlog/create-subtopics.md) — Branch out
6. [topic-persistence](user-stories/backlog/topic-persistence.md) — Save and restore
7. [source-citations](user-stories/backlog/source-citations.md) — Grounded content

### Priority 3 — Confidence & Safety (trust the product)
8. [version-history](user-stories/backlog/version-history.md) — Undo AI changes
9. [quiz-mode](user-stories/backlog/quiz-mode.md) — Validate learning

### Priority 4 — Engagement (post-MVP)
10. [topic-suggestions](user-stories/backlog/topic-suggestions.md) — AI recommends topics
11. [subtopic-suggestions](user-stories/backlog/subtopic-suggestions.md) — Pre-cached suggestions
