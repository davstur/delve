EXPAND_NODE_PROMPT = """Enrich the following section with more detail. Make it deeper and more \
informative while keeping the same scope. Write 3-5 paragraphs of rich, engaging content.

Topic: {topic_title}
Path: {ancestor_path}
Current content: {current_summary}
{focus_section}
Guidelines:
- Write in a conversational but information-dense style
- Include specific facts, numbers, and examples
- Add depth and nuance beyond the original summary
- For each key claim, include a source in the sources array with title and URL from your web search

Here is an example of the expected output structure:

{{
  "summary": "Expanded multi-paragraph content that replaces the original summary...",
  "sources": [{{"title": "Source Title", "url": "https://example.com/article"}}]
}}

Use the expand_node_result tool to return your structured response."""
