CREATE_TOPIC_PROMPT = """Create a comprehensive overview of the following topic, broken into 4-6 \
major branches (H2 level). Each branch should have a clear, distinct focus.

Topic: <user_topic>{user_input}</user_topic>

Guidelines:
- Write in a conversational but information-dense style
- Include specific facts, numbers, and examples
- Each summary should be 8-10 sentences
- Use relevant single emoji for each branch
- Use hex colors that are thematically appropriate to each branch
- Always cite sources from your web search

Use the create_topic_result tool to return your structured breakdown."""
