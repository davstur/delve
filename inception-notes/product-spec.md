# Delve — Project Spec

## Vision

A mobile app that replaces mindless scrolling with AI-powered learning. You pick a topic, get an interactive hierarchical breakdown, and drill deeper into any branch. The app generates new content on demand — expanding sections, adding subtopics, or enriching existing nodes — building a persistent, growing knowledge base over time.

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **AI Backend:** Claude API directly (Sonnet for content generation, with native web search tool for grounded content)
- **API Server:** New Google Cloud Run Python server (FastAPI), blueprinted from existing project
- **Database:** Supabase (Postgres) — stores topics, nodes, exploration history
- **Local Storage:** AsyncStorage for UI state (node expansion state per topic, last scroll position)
- **Component Development:** Storybook for React Native
- **Testing:** XcodeBuildMCP + iOS Simulator Skill for Claude Code automated testing

## Core Data Model

### Topics Table

```
topics
├── id: uuid
├── title: string
├── emoji: string
├── created_at: timestamp
├── last_visited_at: timestamp
```

### Nodes Table

```
nodes
├── id: uuid
├── topic_id: uuid (FK → topics)
├── parent_id: uuid | null (FK → nodes)
├── label: string
├── emoji: string
├── color: string
├── summary: string
├── content: string | null (expanded rich content)
├── depth: number
├── sources: jsonb | null (array of [{title, url}] from web search)
├── created_at: timestamp
├── version_id: uuid (FK → topic_versions)
```

### Topic Versions Table

```
topic_versions
├── id: uuid
├── topic_id: uuid (FK → topics)
├── action: string ("initial" | "expand" | "create-subtopics")
├── target_node_id: uuid | null (the node the action was performed on)
├── created_at: timestamp
├── node_snapshot: jsonb (full topic state at this point)
```

Every AI action creates a new version before applying changes. The `node_snapshot` stores the complete topic state as JSON, making rollback straightforward — just restore the snapshot.

**Versioning model:** The topic keeps the same `id` throughout its lifecycle. Versions accumulate in `topic_versions` — like Git commits on a single repo. Restoring a version replaces the current nodes with the snapshot's contents, and creates a new version entry recording the restore action.

The version history doubles as an activity log: "March 29 — went deeper on 'Pipeline'" becomes a natural timeline of your learning journey.

**Trade-off:** Storing full snapshots is storage-heavy compared to storing diffs, but for a personal app with text-only nodes, even hundreds of versions per topic will be trivially small (a few MB). Simplicity wins here.

Each topic is a subject (e.g., "Surfing", "Nuclear Power"). Nodes are stored flat in Supabase with parentId references, reconstructed into hierarchies in memory.

### Topic Suggestions Table

```
topic_suggestions
├── id: uuid
├── label: string
├── emoji: string
├── rationale: string (why this was suggested, e.g. "connects to your interest in ocean physics")
├── created_at: timestamp
├── used: boolean (true if user created this topic)
```

### Subtopic Suggestions Table

```
subtopic_suggestions
├── id: uuid
├── node_id: uuid (FK → nodes — the node these suggestions are for)
├── label: string
├── emoji: string
├── created_at: timestamp
├── used: boolean (true if user selected this suggestion)
```

Pre-generated when a node is created. When the user taps "Add subtopics," suggestions are already there — no AI call needed. Refreshed if the node's content changes (e.g., after an expand action).

### Quiz Results Table

```
quiz_results
├── id: uuid
├── topic_id: uuid (FK → topics)
├── branch_node_id: uuid | null (FK → nodes — null for full-topic quiz, or specific branch)
├── questions: jsonb (the questions, options, correct answers)
├── answers: jsonb (user's selected answers)
├── score: integer
├── total: integer
├── created_at: timestamp
```

## Screen Architecture

### 1. Home Screen
- List of your topics (subjects you've explored)
- "Start a new topic" button — AI suggestions are pre-loaded (see below), or user can freetext any subject
- Shows total nodes explored, last visited date per topic

### Topic Suggestions (pre-generated)
- After each AI action (expand, create subtopics, new topic), the server triggers a background call to refresh topic suggestions based on updated exploration history
- Suggestions stored in Supabase (`topic_suggestions` table) so they're instantly available when the user opens the "Add topic" panel
- 5-8 suggestions kept fresh at all times, rotated as the user explores more
- Stale suggestions (older than ~7 days or already used) are replaced on the next refresh
- Same approach can be used for subtopic suggestions: pre-generate when a node is created, store alongside the node

### 2. Explorer Screen (the core experience)
- Single scrollable document, Notion-style collapsible sections
- Maximum 4 levels of hierarchy, mapped to visual styles:
  - **H1** = Topic root (e.g., "Surfing")
  - **H2** = First-level branches (e.g., "The Wave", "How to Surf") — separated by dividers
  - **H3** = Second-level sections (e.g., "How Swells Form")
  - **Bold** = Third-level detail (e.g., "Surf Forecasting") — max depth
- Tap any heading to collapse/expand its children
- Action chips (Expand, Add subtopics) appear inline below each section's content
- Quiz button appears at the bottom of each H2 branch

### 3. User Actions

**At the topic level (H1):**
- "+ Add topic" button at the bottom of the page
- Opens a panel with AI-suggested topics (based on exploration history) plus freetext input
- User can pick a suggestion or type any topic → AI generates the full H1-H2 structure

**On every section (H2, H3, Bold):**
- **Expand** — enriches the current section's content. Opens an inline panel with an optional freetext prompt (e.g., "focus on the physics" or "explain like I'm 5"). If left blank, AI enriches with general detail.
- **Add/Create subtopics** — opens a panel with AI-suggested subtopics (contextual to the section) plus freetext. User can select one or more suggestions, type a custom one, or both. Button label adapts: "Create subtopics" if none exist, "Add subtopics" if some already do.
- "Add subtopics" only available on H1, H2, and H3 nodes (since Bold / depth 4 is the maximum depth)

### 4. Quiz Mode (available per topic)
- Accessible from the topic level (H1) — "Test yourself on: Surfing"
- Generates questions drawn from all nodes across the entire topic
- Multiple choice, 4 options each, 5-10 questions scaled to the topic's size
- AI generates questions on demand based on all content that exists in the topic
- Questions can test connections across branches (e.g., linking wave physics to safety)
- Shows score at the end with pointers to nodes worth revisiting
- Quiz results stored per topic so you can see improvement over time

### 5. Topic Discovery Screen (future)
- AI-suggested new topics based on your exploration history
- "You've explored nuclear energy and climate policy — you might like: Carbon Capture"

## AI Integration Architecture

### API Server (Cloud Run + Python)
A Python FastAPI server that:
- Receives requests from the app with action type + context
- Constructs prompts and calls Claude API via the Anthropic Python SDK
- Validates and returns structured JSON to the app
- Handles rate limiting and error recovery
- Stores/retrieves data from Supabase

### Database (Supabase)
Two core tables plus supporting tables as defined above.

Supabase gives you: Postgres querying (e.g. "all nodes at depth 2 for this topic"), real-time subscriptions if needed later, row-level security, and automatic backups.

### Routing
All app traffic goes through Cloud Run. The app has a single API client — no direct Supabase connection. Cloud Run handles both AI generation and CRUD operations against Supabase.

Key endpoints:
- `GET /topics` — list all topics for the user
- `POST /topics` — create a new topic (AI generates root + first level)
- `GET /topics/{id}` — fetch a full topic with all nodes
- `POST /topics/{id}/nodes/{node_id}/expand` — AI enriches node content (accepts optional prompt)
- `POST /topics/{id}/nodes/{node_id}/suggest-subtopics` — AI returns 3 subtopic suggestions
- `POST /topics/{id}/nodes/{node_id}/create-subtopics` — generate selected/freetext subtopics
- `POST /topics/suggest` — AI suggests new topics based on exploration history (called in background, results cached in DB)
- `POST /topics/{id}/quiz` — AI generates quiz from all nodes in the topic
- `POST /topics/{id}/quiz/submit` — submit answers, store results
- `PATCH /topics/{id}/nodes/{node_id}` — mark node as visited, clear "new" flag
- `GET /topics/{id}/versions` — list version history for a topic
- `POST /topics/{id}/versions/{version_id}/restore` — rollback topic to a previous version

### Prompt Strategy
Each AI action sends:
- The current node's content
- The ancestor chain (path from root to current node) for context
- The action type (expand / create-subtopics / new-topic)
- A system prompt defining the JSON output schema
- **Web search tool enabled** — Claude can search the web to ground content in real sources

The AI returns structured JSON that the app can directly render — no parsing of free-form text. Each node includes source URLs so users can verify and explore further.

### Web Search Integration
- All content generation requests include the `web_search_20250305` tool
- System prompt instructs Claude to research topics using web search and cite sources
- Each node stores an optional `sources` array: `[{title, url}]`
- Sources displayed as small linked references below each section's content
- Domain allow/block lists can be configured to prefer high-quality sources (e.g., Wikipedia, academic sites, reputable publications)

### Content Quality
- System prompt instructs Claude to write concise, factual, engaging content
- Each summary: 8-10 sentences, information-dense, conversational tone
- Each expanded content block: 3-5 paragraphs with specific facts, numbers, examples
- Subtopic suggestions should be genuinely distinct, not overlapping

## Prompt Templates

### System Prompt (shared across all actions)

```
You are a knowledge explorer that creates engaging, factual educational content.
Use web search to ground your content in real sources. Always cite your sources.

Rules:
- Write in a conversational but information-dense style
- Include specific facts, numbers, and examples — not vague generalities
- Each summary should be 8-10 sentences
- Return ONLY valid JSON matching the schema below — no markdown, no preamble
- Emoji should be a single relevant emoji character
- Color should be a hex color string that feels thematically appropriate
- Sources should include title and URL for each source consulted
```

### Create New Topic

```
Action: CREATE_TOPIC

Create a comprehensive overview of the following topic, broken into 4-6 
major branches (H2 level). Each branch should have a clear, distinct focus.

Topic: {{user_input}}
{{#if suggestion_rationale}}
Context: This was suggested because: {{suggestion_rationale}}
{{/if}}

Return JSON:
{
  "label": "string",
  "emoji": "string",
  "summary": "string (8-10 sentences overview of the entire topic)",
  "sources": [{"title": "string", "url": "string"}],
  "children": [
    {
      "label": "string",
      "emoji": "string",
      "color": "string (hex)",
      "summary": "string (8-10 sentences)",
      "sources": [{"title": "string", "url": "string"}]
    }
  ]
}
```

### Expand Node Content

```
Action: EXPAND_NODE

Enrich the following section with more detail. Make it deeper and more 
informative while keeping the same scope.

Topic: {{topic_title}}
Path: {{ancestor_chain}} (e.g. "Surfing > The Wave > How Swells Form")
Current content: {{node_summary}}
{{#if user_prompt}}
User wants to focus on: {{user_prompt}}
{{/if}}

Return JSON:
{
  "summary": "string (expanded content, 3-5 paragraphs)",
  "sources": [{"title": "string", "url": "string"}]
}
```

### Suggest Subtopics

```
Action: SUGGEST_SUBTOPICS

Suggest 3 subtopics that would naturally sit underneath the following section.
They should be genuinely distinct from each other and from any existing 
subtopics.

Topic: {{topic_title}}
Path: {{ancestor_chain}}
Current content: {{node_summary}}
{{#if existing_children}}
Existing subtopics (do NOT duplicate): {{existing_children_labels}}
{{/if}}

Return JSON:
{
  "suggestions": [
    {
      "label": "string",
      "emoji": "string"
    }
  ]
}
```

### Create Subtopics

```
Action: CREATE_SUBTOPICS

Generate full content for the following subtopics under the given section.

Topic: {{topic_title}}
Path: {{ancestor_chain}}
Parent content: {{node_summary}}
Subtopics to create: {{selected_labels_and_freetext}}
Target depth: {{target_depth}} (current parent is depth {{parent_depth}})

Return JSON:
{
  "children": [
    {
      "label": "string",
      "emoji": "string",
      "color": "string (hex)",
      "summary": "string (8-10 sentences)",
      "sources": [{"title": "string", "url": "string"}]
    }
  ]
}
```

### Suggest New Topics

```
Action: SUGGEST_TOPICS

Based on the user's exploration history, suggest 5-8 new topics they might 
find interesting. Each suggestion should connect to something they've already 
explored, but open up a new area of knowledge.

User's existing topics: {{topic_titles_and_summaries}}
Previously suggested (do NOT repeat): {{previous_suggestions}}

Return JSON:
{
  "suggestions": [
    {
      "label": "string",
      "emoji": "string",
      "rationale": "string (1 sentence explaining the connection)"
    }
  ]
}
```

### Generate Quiz

```
Action: GENERATE_QUIZ

Create a quiz testing understanding of the following topic. Draw questions 
from across all sections. Include questions that test connections between 
different branches, not just isolated facts.

Topic: {{topic_title}}
Full content: {{all_node_summaries_with_paths}}

Return JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0-3,
      "explanation": "string (brief explanation of the correct answer)",
      "related_node_path": "string (path to the most relevant section)"
    }
  ]
}
```

## Storybook Component Stories

Each component gets a full set of stories covering its key states. Stories use mock data and should be buildable before any API integration.

### CollapsibleSection
- **Default (H1 level):** Topic root with children, expanded
- **H2 level:** Branch section with children, expanded
- **H3 level:** Sub-section with children, collapsed
- **Bold level (H4):** Leaf node, no children, no "Add subtopics" chip
- **With sources:** Section displaying 2-3 source links below content
- **Loading state:** Skeleton/shimmer while AI generates content
- **Long content:** Section after "Expand" with 8-10 sentence summary
- **Freshly generated:** Node with "NEW" badge

### ExpandPanel
- **Empty prompt:** Panel open, input field empty, expand button active
- **With prompt:** User has typed a freetext prompt
- **Loading:** Spinner while AI enriches content

### SubtopicPanel
- **With suggestions (no existing children):** "Create subtopics" label, 3 AI suggestions, freetext field
- **With suggestions (has children):** "Add subtopics" label, 3 AI suggestions
- **Selections made:** 2 suggestions selected, generate button active
- **Freetext only:** No suggestions selected, custom text entered
- **Loading:** Generating subtopics

### AddTopicPanel
- **With suggestions:** 3-5 pre-cached topic suggestions with rationale, freetext field
- **Suggestion selected:** One suggestion highlighted
- **Freetext entered:** Custom topic typed, suggestions deselected
- **Loading:** Generating new topic structure

### TopicCard (Home Screen)
- **Default:** Topic with title, emoji, node count, last visited date
- **New:** Recently created topic with highlight
- **Empty state:** No topics yet, prompt to create first one

### QuizView
- **Question state:** Progress bar, question text, 4 answer options
- **Score screen (perfect):** All correct, celebratory
- **Score screen (partial):** Some wrong, pointers to review
- **Score screen (low):** Encouragement to revisit content
- **Loading:** Generating quiz questions

### VersionHistoryList
- **Multiple versions:** Chronological list with action icons, target node names, timestamps
- **Single version:** Just the initial creation

### VersionViewer
- **Read-only mode:** Collapsible document with version banner, "Restore" and "Back" buttons, no action chips

### BreadcrumbTrail
- **Shallow (2 levels):** Topic > Section
- **Deep (4 levels):** Topic > Branch > Section > Detail
- **Overflow:** Long labels truncated gracefully

### DepthIndicator
- **Each depth level:** 1 through 4 segments filled

## Claude Code Developer Workflow

### Simulator Testing Setup
Claude Code can build, test, and iterate on the app using iOS simulator automation:

- **XcodeBuildMCP** (pre-configured with Claude Code): Build, install, launch, and run tests on the simulator. Commands: `/build`, `/run`, `/test`.
- **iOS Simulator Skill** (install to `~/.claude/skills/ios-simulator-skill`): 21 production scripts for semantic UI navigation using accessibility APIs. Finds elements by meaning (text, type, testID) not pixel coordinates.
- **Expo MCP** (for React Native level testing): Find and tap elements by `testID`, take screenshots for visual verification.

### Testing Workflow
1. Claude Code makes changes to a component
2. Builds the app via XcodeBuildMCP
3. Launches in simulator
4. Navigates to the relevant screen using accessibility-based taps
5. Takes a screenshot and verifies the UI visually
6. Iterates if needed

### Key Requirement
All interactive React Native components must include `testID` props for automated testing:
```jsx
<TouchableOpacity testID="expand-button" onPress={handleExpand}>
<TouchableOpacity testID="add-subtopics-button" onPress={handleSubtopics}>
<TouchableOpacity testID="quiz-button" onPress={handleQuiz}>
```

### CLAUDE.md Configuration
The project root should include a `CLAUDE.md` file instructing Claude Code on:
- Build commands and simulator preferences
- Component file structure and naming conventions
- How to run Storybook vs the main app
- Testing workflow (build → launch → navigate → verify)

## Build Phases

### Phase 1 — Scaffold & Static Content
- Expo project setup with Expo Router
- Storybook configuration
- Core components built in Storybook with mock data:
  - CollapsibleSection, BreadcrumbTrail, ContentCard, SubtopicCard, AIActionButton, DepthIndicator
- Explorer screen assembled from components
- Home screen with hardcoded sample topics
- Navigation between screens

### Phase 2 — AI Integration
- Cloud Run FastAPI server deployed
- Claude API prompt templates for expand / create-subtopics / new-topic
- Loading states and error handling in the UI
- "New topic" flow: user enters subject → AI generates root + first level

### Phase 3 — Persistence (Supabase)
- Supabase table schema for topics and nodes
- CRUD operations via Cloud Run server
- Save/load topics across app restarts and devices
- Track exploration history (when each node was first visited)
- Mark new nodes, clear "new" badge after viewing
- **Version history screen:** chronological list of versions per topic (action, target node, timestamp)
- **Version viewer:** read-only overlay rendering a past snapshot using the same collapsible components, with a banner showing version info and "Restore" / "Back to current" buttons. No action chips in this mode.

### Phase 4 — Polish & Mobile UX
- Animations (section expansion, new node appearance, screen transitions)
- Haptic feedback on AI actions
- Dark mode (default) + light mode
- Responsive layout (phone vs tablet)
- Onboarding flow for first launch
- **Inline visuals:** web images (Wikimedia Commons API) + structured diagrams (charts, comparisons) specified by AI per node

### Phase 5 — Smart Features (future)
- Topic recommendations based on history
- Search across all your topics
- Spaced repetition: "revisit this node you learned 7 days ago"
- Quiz generation per node
- Share a topic branch as an image or link

## Outlook — Future Enhancements

### Version History Enhancements
- **Diff highlighting:** When viewing a past version, highlight nodes that were added or changed in subsequent versions. Requires comparing two JSON snapshots — doable but adds complexity.
- **Timeline slider:** A horizontal scrubber at the bottom of the explorer showing all versions as dots. Drag to scrub through the topic's history and watch sections appear/disappear in real time.

### Inline Visuals
- **Web images:** Pull relevant images from Wikimedia Commons API (freely licensed). AI specifies search queries per node; images displayed as inline cards with attribution.
- **AI-generated diagrams:** Claude outputs structured data for reusable chart components — bar charts, comparison grids, process flows, scale visualizations. A small library of renderers on the app side.
- **AI-generated illustrations:** Call an image generation API (DALL-E, Flux, Stable Diffusion) from Cloud Run. Claude writes the prompt, API returns a custom illustration. Best for stylized infographics rather than photorealism.
- **Hybrid approach:** AI decides the best visual type per node — a photo for Pipeline, a diagram for fission, a bar chart for safety stats, nothing where text suffices. Each node includes an optional `visual` spec in its JSON.

## Decisions

1. **Offline behavior:** Requires connectivity for now. Local caching of previously loaded topics can be added later as an enhancement.
2. **Content length:** 8-10 sentences per summary — information-dense, conversational tone.
3. **Topic limits:** Max depth of 4 levels (H1/H2/H3/Bold) enforced by UI. No limit on number of nodes per topic.
4. **Visuals:** Text-only for now. Inline images and diagrams are in the Outlook section for future phases.
5. **Authentication:** Simple API key baked into the app. Can be upgraded to proper auth if the app is ever shared publicly.