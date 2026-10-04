from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.auth_models import User, Student, StudentRequest
from backend.schemas.student_schema import (
    CreateStudentRequest,
    StudentRequestListResponse,
    StudentRequestResponse,
)
from backend.services.auth_dependency import get_current_user
from backend.services.student_service import (
    get_student_appointments,
    get_student_dashboard,
    get_student_messages,
    get_student_requests,
)


router = APIRouter(
    prefix="/api/student",
    tags=["Student"],
)


DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]



def serialize_student_request(request: StudentRequest) -> dict:
    return {
        "id": request.id,
        "student_id": request.student_id,
        "type": request.type,
        "title": request.title,
        "status": request.status,
        "submitted_at": request.submitted_at,
        "notes": request.notes,
    }


def verify_student_access(
    student_id: str,
    current_user: User,
) -> None:
    if (
        current_user.role == "student"
        and current_user.student_id != student_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another student's data",
        )


@router.get("/{student_id}/dashboard")
def student_dashboard(
    student_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict:
    verify_student_access(student_id, current_user)

    data = get_student_dashboard(db, student_id)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return data


@router.get("/{student_id}/requests", response_model=StudentRequestListResponse)
def student_requests(
    student_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict:
    verify_student_access(student_id, current_user)

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    requests = get_student_requests(db, student_id)

    return {
        "requests": [
            serialize_student_request(request)
            for request in requests
        ]
    }


@router.post(
    "/{student_id}/requests",
     response_model=StudentRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student_request(
    student_id: str,
    request_data: CreateStudentRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict:
    verify_student_access(student_id, current_user)

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    new_request = StudentRequest(
        student_id=student_id,
        type=request_data.type.strip(),
        title=request_data.title.strip(),
        status="pending",
        submitted_at=datetime.now(timezone.utc).isoformat(),
        notes=(
            request_data.notes.strip()
            if request_data.notes
            else None
        ),
    )

    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return serialize_student_request(new_request)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create the student request.",
        ) from exc


@router.get("/{student_id}/messages")
def student_messages(
    student_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict:
    verify_student_access(student_id, current_user)

    return {
        "messages": get_student_messages(db, student_id)
    }


@router.get("/{student_id}/appointments")
def student_appointments(
    student_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict:
    verify_student_access(student_id, current_user)

    return {
        "appointments": get_student_appointments(db, student_id)
    }
