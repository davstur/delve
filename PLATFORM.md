# Delve — Platform Knowledge

## Domain Terminology

| Term | Meaning |
|---|---|
| **Topic** | A top-level subject the user explores (e.g., "Surfing", "Nuclear Power") |
| **Node** | A single section within a topic's hierarchy. Has label, summary, optional expanded content |
| **Root node** | The H1-level node representing the topic itself |
| **Branch** | An H2-level node — a major subdivision of a topic |
| **Depth** | Nesting level: 1 (H1/root) through 4 (H4/Bold, max) |
| **Expand** | AI action: enrich a node's content with more detail |
| **Create subtopics** | AI action: add child nodes under an existing node |
| **Version** | A full snapshot of a topic's node tree, created before each AI action |
| **Sources** | Web URLs cited by the AI during content generation |
| **Explorer** | The core screen showing a topic as a collapsible document |

## User Roles

| Role | Description |
|---|---|
| **User** | Single-player for MVP. The person exploring topics. No auth, no multi-user. |

## Hierarchy Levels

| Depth | Visual Style | Can Expand | Can Add Subtopics |
|---|---|---|---|
| 1 (H1) | 28pt bold, topic root | Yes | Yes |
| 2 (H2) | 22pt semibold, branch | Yes | Yes |
| 3 (H3) | 18pt medium, section | Yes | Yes |
| 4 (H4/Bold) | 16pt semibold, detail | Yes | No (max depth) |

## AI Actions & Their Outputs

| Action | Input | Output | Creates Version |
|---|---|---|---|
| Create topic | Subject string | Root + 4-6 H2 branches | No (initial) |
| Expand node | Node + ancestors + optional prompt | Enriched summary + sources | Yes |
| Suggest subtopics | Node + ancestors + existing children | 3 suggestions (label + emoji) | No |
| Create subtopics | Node + selected labels | Full child nodes with content | Yes |
| Generate quiz | All nodes in topic | 5-10 MCQ questions | No |
| Suggest topics | All topic summaries | 5-8 suggestions with rationale | No |

## Constraints

- Maximum 4 depth levels enforced by UI (H4 nodes cannot add children)
- All AI responses are structured JSON — no free-text parsing
- All content generation uses web search for grounding
- All data access goes through Cloud Run — no direct Supabase from app
- Node trees stored flat (parent_id references), reconstructed client-side
