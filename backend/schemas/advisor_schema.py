from typing import Any

from pydantic import BaseModel, ConfigDict


class AdvisorStudentResponse(BaseModel):
    """Summary of one student shown on the advisor dashboard."""

    id: int
    student_id: str
    full_name: str | None = None
    email: str | None = None
    program: str | None = None
    year_of_study: int | None = None
    advisor_id: str | None = None

    contact_status: str | None = None
    last_contact_date: str | None = None
    contacted_by: str | None = None

    current_module: str | None = None
    current_presentation: str | None = None

    risk_label: str
    overall_risk: float
    final_overall_risk: float | None = None
    checkpoint_week: int | None = None


class AdvisorStudentListResponse(BaseModel):
    """Collection of students visible to an advisor."""

    students: list[AdvisorStudentResponse]


class EnrollmentResponse(BaseModel):
    """Student enrollment information."""

    id: int
    student_id: str
    course_key: str | None = None
    course_name: str | None = None
    year_label: str | None = None
    is_current: bool


class RiskSnapshotResponse(BaseModel):
    """Advisor-facing student risk snapshot."""

    model_config = ConfigDict(protected_namespaces=())

    id: int
    student_id: str
    course_key: str | None = None
    checkpoint_week: int

    overall_risk: float | None = None
    course_risk: float | None = None
    risk_label: str | None = None

    why_risk: Any = None
    recommended_actions: Any = None
    advisor_actions: Any = None

    global_ml_risk: float | None = None
    course_aggregated_risk: float | None = None
    final_overall_risk: float | None = None

    model_source: str | None = None
    top_factors: Any = None


class ContactResponse(BaseModel):
    """Advisor contact information for a student."""

    status: str | None = None
    last_contact_date: str | None = None
    contacted_by: str | None = None
    notes: Any = None


class AdvisorStudentDetailResponse(BaseModel):
    """Complete advisor-facing details for one student."""

    id: int
    student_id: str
    full_name: str | None = None
    email: str | None = None
    program: str | None = None
    year_of_study: int | None = None
    advisor_id: str | None = None

    contact: ContactResponse

    current_module: str | None = None
    current_presentation: str | None = None

    enrollments: list[EnrollmentResponse]
    latest_risk: RiskSnapshotResponse | None = None
    risk_history: list[RiskSnapshotResponse]

    risk_label: str
    overall_risk: float

    top_factors: Any = None
    recommended_actions: Any = None
