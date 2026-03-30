import json
import logging

import anthropic

from app.config import settings
from app.prompts.create_topic import CREATE_TOPIC_PROMPT

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None

# Tool definition that forces Claude to return structured JSON
CREATE_TOPIC_TOOL = {
    "name": "create_topic_result",
    "description": "Return the structured topic breakdown",
    "input_schema": {
        "type": "object",
        "properties": {
            "label": {"type": "string", "description": "Topic title"},
            "emoji": {"type": "string", "description": "Single emoji for the topic"},
            "summary": {"type": "string", "description": "8-10 sentence overview"},
            "sources": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "url": {"type": "string"},
                    },
                    "required": ["title", "url"],
                },
            },
            "children": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string"},
                        "emoji": {"type": "string"},
                        "color": {"type": "string", "description": "Hex color"},
                        "summary": {"type": "string"},
                        "sources": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "url": {"type": "string"},
                                },
                                "required": ["title", "url"],
                            },
                        },
                    },
                    "required": ["label", "emoji", "color", "summary", "sources"],
                },
            },
        },
        "required": ["label", "emoji", "summary", "sources", "children"],
    },
}


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

    Uses tool_use to get structured JSON — no free-text parsing.
    Returns the parsed dict with label, emoji, summary, sources, children.
    Raises ValueError if the response is invalid.
    """
    client = get_anthropic()
    prompt = CREATE_TOPIC_PROMPT.format(user_input=user_input)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        tools=[
            {"type": "web_search_20250305"},
            CREATE_TOPIC_TOOL,
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract structured data from tool_use block
    for block in response.content:
        if block.type == "tool_use" and block.name == "create_topic_result":
            return block.input

    # Fallback: check for JSON in text blocks (in case Claude doesn't use the tool)
    for block in response.content:
        if block.type == "text":
            text = block.text.strip()
            if text.startswith("{"):
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    continue

    logger.error("No structured response from Claude: %s", [b.type for b in response.content])
    raise ValueError("AI did not return a structured response")
