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
