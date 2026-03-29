# Delve

AI-powered knowledge exploration app. Users pick topics, get interactive
hierarchical breakdowns, and drill deeper into any branch.

## Key Documentation

- **Product**: `docs/product/VISION.md`, `docs/product/MVP_SPEC.md`
- **Architecture**: `docs/architecture/README.md`
- **Domain model**: `PLATFORM.md` (user roles, terminology, hierarchy rules)
- **User stories**: `docs/user-stories/backlog/`
- **Brand**: `docs/brand/BRAND_GUIDE.md`
- **Decisions**: `inception-notes/decisions.md`

## Tech Stack

- **Mobile**: React Native + Expo (managed workflow), Expo Router, TypeScript
- **API**: Python FastAPI on Google Cloud Run
- **AI**: Claude Sonnet via Anthropic Python SDK, with web search tool
- **Database**: Supabase (Postgres)
- **Components**: Storybook for React Native

## Development Guidelines

- All interactive components must include `testID` props for simulator testing
- AI responses are structured JSON validated by Pydantic — never parse free text
- All app traffic routes through Cloud Run — no direct Supabase from the app
- Node hierarchy max depth: 4 levels (H1 > H2 > H3 > H4)
- Nodes stored flat with `parent_id`, reconstructed into trees client-side
- Every AI mutation (expand, create subtopics) must snapshot before applying

## Prompt Templates

See `inception-notes/product-spec.md` for full prompt templates until they're
implemented in `server/prompts/`.

## Build & Test

- Storybook: component development and visual testing
- XcodeBuildMCP: build, install, and launch on iOS Simulator
- iOS Simulator Skill: accessibility-based UI navigation for automated testing
