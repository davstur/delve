CREATE_TOPIC_PROMPT = """Create a comprehensive overview of the following topic, broken into 4-6 \
major branches (H2 level). Each branch should have a clear, distinct focus.

Topic: {user_input}

Guidelines:
- Write in a conversational but information-dense style
- Include specific facts, numbers, and examples
- Each summary should be 8-10 sentences
- Use relevant single emoji for each branch
- Use hex colors that are thematically appropriate to each branch
- Always cite sources from your web search

Return ONLY valid JSON with this exact structure (no markdown, no preamble):
{{
  "label": "string (topic title)",
  "emoji": "string (single emoji)",
  "summary": "string (8-10 sentences overview of the entire topic)",
  "sources": [{{"title": "string", "url": "string"}}],
  "children": [
    {{
      "label": "string (branch title)",
      "emoji": "string (single emoji)",
      "color": "string (hex color like #4F46E5)",
      "summary": "string (8-10 sentences)",
      "sources": [{{"title": "string", "url": "string"}}]
    }}
  ]
}}"""
