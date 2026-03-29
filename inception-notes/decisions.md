# Delve — Key Decisions

Captured during project inception (2026-03-29). Each decision includes the
reasoning so future-us can revisit with context.

## Problem Space

**Why knowledge exploration?**
People have genuine curiosity but the tools to satisfy it are all high-friction.
Wikipedia is a wall of text. YouTube takes 20 minutes for 2 minutes of insight.
ChatGPT conversations disappear. There's a gap between "I wonder about X" and
actually understanding X — and phones are where that curiosity happens.

**Why replace scrolling specifically?**
Scrolling is a habit loop: boredom → open app → dopamine → repeat. If we can
insert "learning" into that same loop with equally low friction, we capture
existing behavior rather than fighting it. The competitor isn't Khan Academy —
it's Instagram.

## Target User

**Why "curious scrollers" and not students or professionals?**
Students have structured curricula. Professionals have specific needs. Curious
scrollers have *unstructured* curiosity and *no* existing tool for it. They're
underserved, they have time (they're currently wasting it), and they're
reachable through the same channels as social apps.

## Solution Approach

**Why hierarchical trees instead of linear chat?**
Linear conversations bury information. A tree structure lets you see the big
picture and drill into specifics. It's scannable (like a table of contents),
explorable (like a wiki), and persistent (unlike a chat). The hierarchy also
maps naturally to how knowledge is organized.

**Why AI-generated content instead of curated content?**
Curated content doesn't scale to "any topic." AI can generate a structured
breakdown of literally anything in seconds. Web search grounding ensures
factual accuracy. The trade-off is quality control — but Claude with web search
produces surprisingly good educational content, and the user can always drill
deeper or redirect.

**Why max 4 depth levels?**
Tested mentally: H1 > H2 > H3 > H4 covers topic > branch > section > detail.
Deeper than that and the hierarchy becomes confusing on mobile. If someone
needs more depth, they can expand a node's content rather than nesting deeper.

## MVP Feature Selection

**Why include quizzes in MVP?**
Quizzes close the learning loop. Without them, Delve is "interesting to browse"
but not "I actually learned something." The quiz score creates a measurable
sense of progress and a reason to revisit content. They're also relatively
cheap to build — one prompt template, one UI screen.

**Why include version history in MVP?**
Version history is cheap insurance. Every AI action already needs to store
results — snapshotting before each action adds minimal complexity. Without it,
a bad AI expansion could ruin a carefully built topic with no way back. The UI
(list + restore) is simple.

**Why defer topic suggestions?**
Suggestions require exploration history to be meaningful. On day one, there's
no history. Freetext topic creation is sufficient for MVP. Suggestions become
valuable after the user has 5+ topics — that's a retention feature, not an
acquisition feature.

**Why defer inline visuals?**
Text-only is simpler to build, faster to render, and easier to version. Images
add complexity (storage, caching, attribution, layout). The core value prop —
interactive knowledge exploration — works with text alone. Visuals are polish,
not proof-of-concept.

## Technical Choices

**Why React Native + Expo over native Swift?**
Speed of development. One codebase, hot reload, massive ecosystem. Expo
managed workflow avoids native build complexity. The app is content-heavy, not
animation-heavy — React Native handles this well. Can eject to bare workflow
later if needed.

**Why a Python FastAPI server instead of calling Claude directly from the app?**
Security (API keys stay server-side), flexibility (can add rate limiting,
caching, prompt engineering without app updates), and Supabase access
(server handles all DB operations — app has a single API client). Also:
the Anthropic Python SDK is the best-supported client.

**Why Supabase over Firebase or raw Postgres?**
Supabase gives us Postgres (relational queries for hierarchical data), a nice
dashboard, row-level security for later, real-time subscriptions if needed, and
automatic backups. All for free tier. Firebase's document model is awkward for
hierarchical data with cross-references.

**Why full snapshots instead of diffs for versioning?**
For a personal app with text nodes, even hundreds of versions per topic are
trivially small (a few MB). Full snapshots make restore dead simple: replace
current nodes with snapshot. Diff-based versioning adds complexity (computing
diffs, applying patches, handling conflicts) for negligible storage savings.

## Business Model

**Why free/personal first?**
This is a personal tool. Build it, use it, prove the concept. If it's
genuinely better than scrolling, the engagement data will speak for itself.
Monetization options later: premium features (offline, sharing, advanced
quizzes), subscription, or freemium with usage limits on AI calls.

## What We're NOT Building

- **Social features** — no sharing, no profiles, no comments. Learning is
  personal. Social can come later if there's demand.
- **Structured courses** — no curricula, no prerequisites, no "complete this
  before that." Delve is curiosity-driven, not goal-driven.
- **Offline mode** — requires connectivity. Caching previously loaded topics
  is a future enhancement.
- **Multi-platform** — mobile-first. Web version is possible later via React
  Native Web, but mobile is where scrolling happens.
- **User accounts / auth** — simple API key for MVP. Real auth only matters
  if the app goes public.
