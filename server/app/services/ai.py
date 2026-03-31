import json
import logging
import re

import anthropic

from app.config import settings
from app.prompts.create_topic import CREATE_TOPIC_PROMPT
from app.prompts.expand_node import EXPAND_NODE_PROMPT
from app.prompts.subtopics import CREATE_SUBTOPICS_PROMPT, SUGGEST_SUBTOPICS_PROMPT

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
            timeout=120.0,
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
        max_tokens=16000,
        tools=[
            {"type": "web_search_20250305", "name": "web_search", "max_uses": 3},
            CREATE_TOPIC_TOOL,
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract structured data from tool_use block
    for block in response.content:
        if block.type == "tool_use" and block.name == "create_topic_result":
            logger.info("tool_use keys: %s, stop_reason: %s", list(block.input.keys()), response.stop_reason)
            return _strip_cite_tags(block.input)

    # tool_use not found — log block types for debugging
    block_types = [b.type for b in response.content]
    logger.warning("Claude did not use create_topic_result tool. Block types: %s", block_types)

    # Fallback: try text blocks (log each attempt)
    for block in response.content:
        if block.type == "text":
            text = block.text.strip()
            if text.startswith("{"):
                try:
                    result = json.loads(text)
                    logger.warning("Used text-block JSON fallback instead of tool_use")
                    return result
                except json.JSONDecodeError as e:
                    logger.warning("Failed to parse text block as JSON: %s", e)

    logger.error("No structured response from Claude: %s", block_types)
    raise ValueError("AI did not return a structured response")


EXPAND_NODE_TOOL = {
    "name": "expand_node_result",
    "description": "Return the expanded node content",
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string", "description": "Expanded 3-5 paragraph content"},
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
        "required": ["summary", "sources"],
    },
}


def expand_node(
    topic_title: str,
    ancestor_path: str,
    current_summary: str,
    user_prompt: str | None = None,
) -> dict:
    """Call Claude to expand a node with richer content.

    Returns dict with 'summary' and 'sources'.
    """
    client = get_anthropic()

    focus_section = ""
    if user_prompt:
        focus_section = f"User wants to focus on: {user_prompt}\n"

    prompt = EXPAND_NODE_PROMPT.format(
        topic_title=topic_title,
        ancestor_path=ancestor_path,
        current_summary=current_summary,
        focus_section=focus_section,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        tools=[
            {"type": "web_search_20250305", "name": "web_search", "max_uses": 3},
            EXPAND_NODE_TOOL,
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract from tool_use block
    for block in response.content:
        if block.type == "tool_use" and block.name == "expand_node_result":
            data = block.input
            if "summary" in data and isinstance(data["summary"], str):
                data["summary"] = _CITE_RE.sub("", data["summary"])
            return data

    # Fallback: text block JSON
    block_types = [b.type for b in response.content]
    logger.warning("Claude did not use expand_node_result tool. Block types: %s", block_types)

    for block in response.content:
        if block.type == "text":
            text = block.text.strip()
            if text.startswith("{"):
                try:
                    result = json.loads(text)
                    if "summary" in result and isinstance(result["summary"], str):
                        result["summary"] = _CITE_RE.sub("", result["summary"])
                    logger.warning("Used text-block JSON fallback for expand_node")
                    return result
                except json.JSONDecodeError as e:
                    logger.warning("Failed to parse expand text block: %s", e)

    raise ValueError("AI did not return a structured response for expand")


SUGGEST_SUBTOPICS_TOOL = {
    "name": "suggest_subtopics_result",
    "description": "Return 3 subtopic suggestions",
    "input_schema": {
        "type": "object",
        "properties": {
            "suggestions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string"},
                        "emoji": {"type": "string"},
                    },
                    "required": ["label", "emoji"],
                },
            },
        },
        "required": ["suggestions"],
    },
}

CREATE_SUBTOPICS_TOOL = {
    "name": "create_subtopics_result",
    "description": "Return created subtopic content",
    "input_schema": {
        "type": "object",
        "properties": {
            "children": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string"},
                        "emoji": {"type": "string"},
                        "color": {"type": "string"},
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
        "required": ["children"],
    },
}


def suggest_subtopics(
    topic_title: str,
    ancestor_path: str,
    node_label: str,
    node_summary: str,
    existing_children: list[str],
) -> list[dict]:
    """Suggest 3 subtopics. Returns list of {label, emoji}."""
    client = get_anthropic()

    existing_section = ""
    if existing_children:
        existing_section = "Existing children (avoid duplicating these):\n" + "\n".join(
            f"- {c}" for c in existing_children
        ) + "\n"

    prompt = SUGGEST_SUBTOPICS_PROMPT.format(
        topic_title=topic_title,
        ancestor_path=ancestor_path,
        node_label=node_label,
        node_summary=node_summary,
        existing_children_section=existing_section,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        tools=[SUGGEST_SUBTOPICS_TOOL],
        messages=[{"role": "user", "content": prompt}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "suggest_subtopics_result":
            suggestions = block.input.get("suggestions")
            if not isinstance(suggestions, list) or len(suggestions) == 0:
                logger.error("AI returned empty/malformed suggestions: %s", list(block.input.keys()))
                raise ValueError("AI returned no suggestions")
            return suggestions

    raise ValueError("AI did not return subtopic suggestions")


def create_subtopics(
    topic_title: str,
    ancestor_path: str,
    node_label: str,
    node_summary: str,
    labels: list[str],
    parent_color: str,
    existing_siblings: list[str],
) -> list[dict]:
    """Create full content for subtopics. Returns list of child dicts."""
    client = get_anthropic()

    siblings_section = ""
    if existing_siblings:
        siblings_section = "Existing siblings (make content distinct from these):\n" + "\n".join(
            f"- {s}" for s in existing_siblings
        ) + "\n"

    labels_list = "\n".join(f"{i+1}. {label}" for i, label in enumerate(labels))

    prompt = CREATE_SUBTOPICS_PROMPT.format(
        topic_title=topic_title,
        ancestor_path=ancestor_path,
        node_label=node_label,
        node_summary=node_summary,
        existing_siblings_section=siblings_section,
        labels_list=labels_list,
        parent_color=parent_color,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16000,
        tools=[
            {"type": "web_search_20250305", "name": "web_search", "max_uses": 5},
            CREATE_SUBTOPICS_TOOL,
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "create_subtopics_result":
            data = block.input
            children = data.get("children")
            if not isinstance(children, list) or len(children) == 0:
                logger.error("AI returned empty/malformed children: %s", list(data.keys()))
                raise ValueError("AI returned no subtopic content")
            for child in children:
                if "summary" in child and isinstance(child["summary"], str):
                    child["summary"] = _CITE_RE.sub("", child["summary"])
            return children

    # Fallback
    block_types = [b.type for b in response.content]
    logger.warning("Claude did not use create_subtopics_result tool: %s", block_types)

    for block in response.content:
        if block.type == "text":
            text = block.text.strip()
            if text.startswith("{"):
                try:
                    result = json.loads(text)
                    children = result.get("children", [])
                    for child in children:
                        if "summary" in child and isinstance(child["summary"], str):
                            child["summary"] = _CITE_RE.sub("", child["summary"])
                    return children
                except json.JSONDecodeError as e:
                    logger.warning("Failed to parse subtopics text block: %s", e)

    raise ValueError("AI did not return subtopic content")


_CITE_RE = re.compile(r'</?cite[^>]*>')


def _strip_cite_tags(data: dict) -> dict:
    """Remove <cite> tags that web search injects into text fields."""
    if "summary" in data and isinstance(data["summary"], str):
        data["summary"] = _CITE_RE.sub("", data["summary"])
    for child in data.get("children", []):
        if "summary" in child and isinstance(child["summary"], str):
            child["summary"] = _CITE_RE.sub("", child["summary"])
    return data
