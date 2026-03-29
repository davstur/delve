# Delve — MVP Specification

## MVP Goal

Prove that AI-powered topic exploration is engaging enough to replace
doomscrolling. A single user should be able to pick a topic, explore it deeply,
and come back the next day to continue.

## MVP Scope (Phases 1-3)

### Must Have (MVP)

- **Home screen** with topic list, "new topic" button, basic stats
- **Explorer screen** with collapsible sections (H1-H4), inline action chips
- **Create topic** flow — freetext input, AI generates root + H2 branches
- **Expand node** — enrich any section with optional focus prompt
- **Create subtopics** — AI suggestions + freetext, up to 4 levels deep
- **Persistence** — topics and nodes saved to Supabase via Cloud Run
- **Version history** — every AI action creates a snapshot, list + restore UI
- **Quiz mode** — per-topic quiz with score and review pointers
- **Sources** — web search grounded content with inline citations

### Deferred (Post-MVP)

- Topic suggestions (AI-recommended based on history)
- Subtopic pre-suggestions (cached suggestions per node)
- Inline visuals (images, diagrams, charts)
- Animations and haptic feedback
- Dark/light mode toggle (ship dark-only for MVP)
- Onboarding flow
- Search across topics
- Spaced repetition
- Sharing
- Offline support

## Success Criteria

1. **Engagement**: A test user explores 3+ topics in their first session
2. **Depth**: Average topic reaches 15+ nodes across 3+ depth levels
3. **Retention**: User returns within 48 hours to continue exploring
4. **Quality**: Content is factual, sourced, and genuinely informative
5. **Performance**: Topic creation < 5 seconds, node expansion < 3 seconds

## MVP User Flow

```
Open app
  → See topic list (empty on first launch)
  → Tap "New Topic"
  → Type "Nuclear Power" (or any subject)
  → See hierarchical breakdown appear (H1 + 4-6 H2 branches)
  → Scroll through, tap to collapse/expand sections
  → Tap "Expand" on "How Reactors Work"
    → Optionally type "focus on safety systems"
    → See enriched content with sources
  → Tap "Create subtopics" on "Types of Reactors"
    → See 3 AI suggestions (e.g., PWR, BWR, CANDU)
    → Select 2, type "Molten Salt" as custom
    → See 3 new H3 sections appear
  → Tap "Quiz" at bottom
    → Answer 5-10 questions
    → See score + pointers to review
  → Return to home, see topic with node count
  → Close app, reopen next day — everything is there
```

## Technical MVP Stack

- **Mobile**: React Native + Expo (managed workflow), Expo Router
- **API**: Python FastAPI on Google Cloud Run
- **AI**: Claude API (Sonnet) with web search tool
- **Database**: Supabase (Postgres)
- **Local state**: AsyncStorage for UI preferences (collapse state, scroll)
