SUGGEST_SUBTOPICS_PROMPT = """Suggest 3 subtopics for the following section. Each subtopic should \
be a distinct area worth exploring that doesn't overlap with existing children.

Topic: {topic_title}
Path: {ancestor_path}
Current section: {node_label}
Current summary: {node_summary}
{existing_children_section}
Return exactly 3 suggestions. Each should have a short, clear label and a relevant emoji.

Use the suggest_subtopics_result tool to return your suggestions."""

CREATE_SUBTOPICS_PROMPT = """Create detailed content for the following subtopics under the given \
section. Each subtopic should have rich, informative content with specific facts and examples.

Topic: {topic_title}
Path: {ancestor_path}
Parent section: {node_label}
Parent summary: {node_summary}
{existing_siblings_section}
Subtopics to create:
{labels_list}

Guidelines:
- Write 8-10 sentences per subtopic summary
- Include specific facts, numbers, and examples
- Each subtopic should be distinct from siblings listed above
- Include 1-3 source URLs from your web search for each subtopic
- Use the parent's color ({parent_color}) for all subtopics

Here is an example of the expected output structure:

{{
  "children": [
    {{
      "label": "Subtopic Title",
      "emoji": "🔬",
      "color": "#4F46E5",
      "summary": "Detailed 8-10 sentence summary...",
      "sources": [{{"title": "Source Title", "url": "https://example.com"}}]
    }}
  ]
}}

Use the create_subtopics_result tool to return your structured response."""
