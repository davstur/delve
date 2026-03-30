CREATE_TOPIC_PROMPT = """Create a comprehensive overview of the following topic, broken into 4-6 \
major branches (H2 level). Each branch should have a clear, distinct focus.

Topic: <user_topic>{user_input}</user_topic>

Guidelines:
- Write in a conversational but information-dense style
- Include specific facts, numbers, and examples
- Each summary should be 8-10 sentences
- Use relevant single emoji for each branch
- Use hex colors that are thematically appropriate to each branch
- For each branch and the overview, include 1-3 sources in the sources array with the title and URL of web pages you referenced. These are required — do not leave sources empty.

Here is an example of the expected output structure (for the topic "Coffee"):

{{
  "label": "Coffee",
  "emoji": "☕",
  "summary": "Coffee is one of the most widely consumed beverages in the world, with over 2 billion cups drunk daily...",
  "sources": [{{"title": "International Coffee Organization", "url": "https://www.ico.org/"}}],
  "children": [
    {{
      "label": "Origins & History",
      "emoji": "🌍",
      "color": "#8B4513",
      "summary": "Coffee's origins trace back to the Ethiopian highlands, where legend says a goat herder named Kaldi discovered...",
      "sources": [{{"title": "History of Coffee", "url": "https://en.wikipedia.org/wiki/History_of_coffee"}}]
    }}
  ]
}}

Use the create_topic_result tool to return your structured breakdown."""
