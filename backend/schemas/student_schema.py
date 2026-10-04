from pydantic import BaseModel, Field


class CreateStudentRequest(BaseModel):
    """Payload used by a student to create a support request."""

    type: str = Field(
        min_length=2,
        max_length=100,
        description="Machine-readable request type.",
    )

    title: str = Field(
        min_length=2,
        max_length=200,
        description="User-facing request title.",
    )

    notes: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional information supplied by the student.",
    )


class StudentRequestResponse(BaseModel):
    """One student support request."""

    id: int
    student_id: str
    type: str
    title: str
    status: str
    submitted_at: str | None = None
    notes: str | None = None


class StudentRequestListResponse(BaseModel):
    """Collection of student support requests."""

    requests: list[StudentRequestResponse]
