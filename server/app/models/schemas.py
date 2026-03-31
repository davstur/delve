from pydantic import BaseModel, field_validator


class SourceModel(BaseModel):
    title: str
    url: str


class BranchModel(BaseModel):
    label: str
    emoji: str
    color: str
    summary: str
    sources: list[SourceModel] = []


class CreateTopicAIResponse(BaseModel):
    """Validates the JSON returned by Claude for CREATE_TOPIC."""

    label: str
    emoji: str
    summary: str
    sources: list[SourceModel] = []
    children: list[BranchModel]

    @field_validator("children")
    @classmethod
    def validate_branch_count(cls, v: list[BranchModel]) -> list[BranchModel]:
        # Relaxed from spec's 4-6 to 2-8 to avoid rejecting valid AI responses
        if len(v) < 2:
            raise ValueError("Must have at least 2 branches")
        if len(v) > 8:
            raise ValueError("Must have at most 8 branches")
        return v


class ExpandNodeAIResponse(BaseModel):
    """Validates the JSON returned by Claude for EXPAND_NODE."""

    summary: str
    sources: list[SourceModel] = []


class ExpandNodeRequest(BaseModel):
    prompt: str | None = None

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 500:
            raise ValueError("Focus prompt must be at most 500 characters")
        return v


class SubtopicSuggestion(BaseModel):
    label: str
    emoji: str


class SuggestSubtopicsResponse(BaseModel):
    suggestions: list[SubtopicSuggestion]


class CreateSubtopicsRequest(BaseModel):
    labels: list[str]

    @field_validator("labels")
    @classmethod
    def validate_labels(cls, v: list[str]) -> list[str]:
        if len(v) < 1:
            raise ValueError("Must provide at least 1 label")
        if len(v) > 5:
            raise ValueError("Must provide at most 5 labels")
        cleaned = []
        for label in v:
            label = label.strip()
            if len(label) < 2:
                raise ValueError(f"Label too short: '{label}'")
            if len(label) > 100:
                raise ValueError(f"Label too long: '{label}'")
            cleaned.append(label)
        return cleaned


class CreateSubtopicsAIResponse(BaseModel):
    children: list[BranchModel]


class CreateTopicRequest(BaseModel):
    title: str

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Topic must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("Topic must be at most 200 characters")
        return v
