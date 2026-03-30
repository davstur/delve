import json
import logging

import anthropic

from app.config import settings
from app.prompts.create_topic import CREATE_TOPIC_PROMPT

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None


def get_anthropic() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(
            api_key=settings.anthropic_api_key,
            timeout=30.0,
        )
    return _client


def generate_topic(user_input: str) -> dict:
    """Call Claude with web search to generate a topic breakdown.

    Returns the parsed JSON structure with label, emoji, summary, sources, children.
    Raises ValueError if the response cannot be parsed.
    """
    client = get_anthropic()
    prompt = CREATE_TOPIC_PROMPT.format(user_input=user_input)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        tools=[{"type": "web_search_20250305"}],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract JSON from text content blocks (web search results are separate blocks)
    json_text = None
    for block in response.content:
        if block.type == "text":
            text = block.text.strip()
            if text.startswith("{"):
                json_text = text
                break

    if not json_text:
        # Try last text block even if it doesn't start with {
        for block in reversed(response.content):
            if block.type == "text" and "{" in block.text:
                # Extract JSON from potential surrounding text
                text = block.text
                start = text.index("{")
                end = text.rindex("}") + 1
                json_text = text[start:end]
                break

    if not json_text:
        logger.error("No JSON found in Claude response: %s", response.content)
        raise ValueError("AI did not return valid JSON")

    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI JSON: %s\nText: %s", e, json_text[:500])
        raise ValueError(f"AI returned invalid JSON: {e}") from e
