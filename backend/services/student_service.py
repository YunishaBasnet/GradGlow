from sqlalchemy.orm import Session
from backend.models.auth_models import Student, RiskSnapshot, StudentRequest, Message, Appointment


def get_student_dashboard(db: Session, student_id: str):
    student = db.query(Student).filter(Student.student_id == student_id).first()

    if not student:
        return None

    latest_risk = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.student_id == student_id)
        .order_by(RiskSnapshot.checkpoint_week.desc())
        .first()
    )

    return {
        "student": {
            "student_id": student.student_id,
            "full_name": student.full_name,
            "email": student.email,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "advisor_id": student.advisor_id,
            "current_module": student.current_module,
            "current_presentation": student.current_presentation,
        },
        "risk": {
            "risk_label": latest_risk.risk_label if latest_risk else "Unknown",
            "risk_score": latest_risk.final_overall_risk if latest_risk and latest_risk.final_overall_risk is not None else latest_risk.overall_risk if latest_risk else 0,
            "why_risk": latest_risk.why_risk if latest_risk else None,
            "recommended_actions": latest_risk.recommended_actions if latest_risk else None,
            "top_factors": latest_risk.top_factors_json if latest_risk else None,
        },
    }


def get_student_requests(db: Session, student_id: str):
    return (
        db.query(StudentRequest)
        .filter(StudentRequest.student_id == student_id)
        .order_by(StudentRequest.id.desc())
        .all()
    )


def get_student_messages(db: Session, student_id: str):
    return (
        db.query(Message)
        .filter(Message.student_id == student_id)
        .order_by(Message.id.asc())
        .all()
    )


def get_student_appointments(db: Session, student_id: str):
    return (
        db.query(Appointment)
        .filter(Appointment.student_id == student_id)
        .order_by(Appointment.id.desc())
        .all()
    )