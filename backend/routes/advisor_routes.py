from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.advisor_schema import (
    AdvisorStudentDetailResponse,
    AdvisorStudentListResponse,
)
from backend.services.advisor_service import (
    get_advisor_students,
    get_student_detail,
)


router = APIRouter(
    prefix="/api/advisor",
    tags=["Advisor"],
)


@router.get(
    "/students",
    response_model=AdvisorStudentListResponse,
)
def advisor_students(
    advisor_id: str | None = None,
    db: Session = Depends(get_db),
):
    return {
        "students": get_advisor_students(
            db,
            advisor_id,
        )
    }


@router.get(
    "/students/{student_id}",
    response_model=AdvisorStudentDetailResponse,
)
def advisor_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
):
    student = get_student_detail(
        db,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    return student
