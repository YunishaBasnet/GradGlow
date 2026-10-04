import json
from typing import Any

from sqlalchemy.orm import Session

from backend.models.auth_models import (
    Enrollment,
    RiskSnapshot,
    Student,
)


def _parse_json_value(
    value: str | None,
    default: Any,
) -> Any:
    """
    Safely convert a JSON string stored in the database into Python data.

    Returns the supplied default value when the field is empty or contains
    invalid JSON.
    """
    if value is None or value.strip() == "":
        return default

    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def _risk_to_dict(
    risk: RiskSnapshot | None,
) -> dict[str, Any] | None:
    """
    Convert a RiskSnapshot database model into a JSON-serializable dictionary.
    """
    if risk is None:
        return None

    return {
        "id": risk.id,
        "student_id": risk.student_id,
        "course_key": risk.course_key,
        "checkpoint_week": risk.checkpoint_week,
        "overall_risk": risk.overall_risk,
        "course_risk": risk.course_risk,
        "risk_label": risk.risk_label,
        "why_risk": _parse_json_value(
            risk.why_risk,
            risk.why_risk or [],
        ),
        "recommended_actions": _parse_json_value(
            risk.recommended_actions,
            risk.recommended_actions or [],
        ),
        "advisor_actions": _parse_json_value(
            risk.advisor_actions,
            risk.advisor_actions or [],
        ),
        "global_ml_risk": risk.global_ml_risk,
        "course_aggregated_risk": risk.course_aggregated_risk,
        "final_overall_risk": risk.final_overall_risk,
        "model_source": risk.model_source,
        "top_factors": _parse_json_value(
            risk.top_factors_json,
            [],
        ),
    }


def _enrollment_to_dict(
    enrollment: Enrollment,
) -> dict[str, Any]:
    """
    Convert an Enrollment database model into a JSON-serializable dictionary.
    """
    return {
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "course_key": enrollment.course_key,
        "course_name": enrollment.course_name,
        "year_label": enrollment.year_label,
        "is_current": bool(enrollment.is_current),
    }


def _get_latest_risk_snapshot(
    db: Session,
    student_id: str,
) -> RiskSnapshot | None:
    """
    Return the latest risk snapshot for a student.

    Higher checkpoint weeks are treated as newer. The database ID is used as
    a secondary ordering field.
    """
    return (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.student_id == student_id)
        .order_by(
            RiskSnapshot.checkpoint_week.desc(),
            RiskSnapshot.id.desc(),
        )
        .first()
    )


def get_advisor_students(
    db: Session,
    advisor_id: str | None = None,
) -> list[dict[str, Any]]:
    """
    Return students visible to an advisor.

    When advisor_id is provided, only students assigned to that advisor are
    returned. Each result includes the student's latest available risk data.
    """
    query = db.query(Student)

    if advisor_id is not None and advisor_id.strip():
        query = query.filter(
            Student.advisor_id == advisor_id.strip()
        )

    students = query.order_by(Student.full_name.asc()).all()

    results: list[dict[str, Any]] = []

    for student in students:
        latest_risk = _get_latest_risk_snapshot(
            db=db,
            student_id=student.student_id,
        )

        results.append(
            {
                "id": student.id,
                "student_id": student.student_id,
                "full_name": student.full_name,
                "email": student.email,
                "program": student.program,
                "year_of_study": student.year_of_study,
                "advisor_id": student.advisor_id,
                "contact_status": student.contact_status,
                "last_contact_date": student.last_contact_date,
                "contacted_by": student.contacted_by,
                "current_module": student.current_module,
                "current_presentation": (
                    student.current_presentation
                ),
                "risk_label": (
                    latest_risk.risk_label
                    if latest_risk is not None
                    else "unknown"
                ),
                "overall_risk": (
                    latest_risk.overall_risk
                    if latest_risk is not None
                    else 0.0
                ),
                "final_overall_risk": (
                    latest_risk.final_overall_risk
                    if latest_risk is not None
                    else None
                ),
                "checkpoint_week": (
                    latest_risk.checkpoint_week
                    if latest_risk is not None
                    else None
                ),
            }
        )

    return results


def get_student_detail(
    db: Session,
    student_id: str,
) -> dict[str, Any] | None:
    """
    Return complete advisor-facing details for one student.

    The response includes student information, enrollments, latest risk,
    complete risk history, contact notes, recommendations, and risk factors.
    """
    normalized_student_id = student_id.strip()

    student = (
        db.query(Student)
        .filter(Student.student_id == normalized_student_id)
        .first()
    )

    if student is None:
        return None

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == normalized_student_id
        )
        .order_by(
            Enrollment.is_current.desc(),
            Enrollment.course_name.asc(),
        )
        .all()
    )

    risk_snapshots = (
        db.query(RiskSnapshot)
        .filter(
            RiskSnapshot.student_id == normalized_student_id
        )
        .order_by(
            RiskSnapshot.checkpoint_week.desc(),
            RiskSnapshot.id.desc(),
        )
        .all()
    )

    latest_risk = (
        risk_snapshots[0]
        if risk_snapshots
        else None
    )

    return {
        "id": student.id,
        "student_id": student.student_id,
        "full_name": student.full_name,
        "email": student.email,
        "program": student.program,
        "year_of_study": student.year_of_study,
        "advisor_id": student.advisor_id,
        "contact": {
            "status": student.contact_status,
            "last_contact_date": student.last_contact_date,
            "contacted_by": student.contacted_by,
            "notes": _parse_json_value(
                student.contact_notes,
                [],
            ),
        },
        "current_module": student.current_module,
        "current_presentation": student.current_presentation,
        "enrollments": [
            _enrollment_to_dict(enrollment)
            for enrollment in enrollments
        ],
        "latest_risk": _risk_to_dict(latest_risk),
        "risk_history": [
            _risk_to_dict(snapshot)
            for snapshot in risk_snapshots
        ],
        "risk_label": (
            latest_risk.risk_label
            if latest_risk is not None
            else "unknown"
        ),
        "overall_risk": (
            latest_risk.overall_risk
            if latest_risk is not None
            else 0.0
        ),
        "top_factors": (
            _parse_json_value(
                latest_risk.top_factors_json,
                [],
            )
            if latest_risk is not None
            else []
        ),
        "recommended_actions": (
            _parse_json_value(
                latest_risk.recommended_actions,
                latest_risk.recommended_actions or [],
            )
            if latest_risk is not None
            else []
        ),
    }