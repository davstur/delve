# ADR 001: Initial Technology Stack

**Status:** Accepted
**Date:** 2026-03-29

## Context

We need to choose a technology stack for Delve, a mobile app that provides
AI-powered interactive knowledge exploration. Key requirements:

- Mobile-first (iOS initially, Android possible later)
- Fast development iteration
- AI content generation with web search
- Persistent hierarchical data storage
- Single developer building the MVP

## Decision

### Mobile App: React Native + Expo (managed workflow)

**Why:** One codebase, hot reload, huge ecosystem. Expo managed workflow
eliminates native build configuration. The app is content-heavy (scrollable
text with collapsible sections) — not animation or graphics heavy — so React
Native's performance characteristics are well-suited.

**Why not Swift/SwiftUI:** Would produce a better iOS experience but doubles
development time if we ever want Android. For an MVP testing product-market
fit, speed matters more than native polish.

**Why not Flutter:** Smaller ecosystem, Dart is less widely known. React Native
has better library support for the tools we need (Storybook, testing).

### Navigation: Expo Router

**Why:** File-based routing matches mental model. Deep linking comes free.
Standard for new Expo projects.

### API Server: Python FastAPI on Google Cloud Run

**Why Python:** Anthropic's Python SDK is the most mature. FastAPI gives us
async, auto-generated docs, Pydantic validation. Python is ideal for the
"construct prompt, call API, validate response" workflow.

**Why Cloud Run:** Scales to zero (no cost when idle), auto-scales under load,
simple deployment (Docker image), no server management. Perfect for a
single-developer project.

**Why not call Claude directly from the app:** API key security. Can't ship
the Anthropic API key in a mobile app. Also: server-side prompt engineering
means we can iterate prompts without app updates.

### AI: Claude API (Sonnet) with web search tool

**Why Claude:** Best structured output quality among current models. Web search
tool built-in — no separate search API needed. Sonnet balances quality and
speed for content generation.

**Why web search:** Content must be factual and verifiable. Web search grounds
Claude's responses in real sources, providing citations users can check.

### Database: Supabase (Postgres)

**Why Postgres:** Hierarchical data (nodes with parent_id) maps naturally to
relational queries. "All nodes for topic X at depth 2" is a simple WHERE
clause. JSONB for version snapshots.

**Why Supabase over raw Postgres:** Dashboard, automatic backups, row-level
security (for future multi-user), real-time subscriptions (for future features).
Generous free tier. Still just Postgres underneath.

**Why not Firebase:** Document model is awkward for hierarchical data with
cross-references. Firestore queries are limited compared to SQL. Vendor
lock-in is higher.

### Component Development: Storybook for React Native

**Why:** Build and test UI components in isolation before wiring to real data.
Catches visual bugs early. Enables Phase 1 (scaffold) to proceed without the
API server.

### Local Storage: AsyncStorage

**Why:** Only used for UI state: collapse/expand state per topic, scroll
position, theme preference. Not for content — that lives in Supabase.

## Consequences

- **Positive:** Fast iteration, single codebase, strong AI integration,
  reliable persistence, component-driven development
- **Negative:** React Native performance ceiling for complex animations
  (acceptable for our content-heavy UI), Cloud Run cold starts (mitigated
  by min instances in production)
- **Risks:** Expo managed workflow may need ejection for some native features
  (can be done later if needed)
