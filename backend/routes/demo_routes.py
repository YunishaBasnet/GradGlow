from fastapi import APIRouter, HTTPException

from backend.data.northbridge_demo import (
    get_demo_summary,
    get_demo_students,
    get_demo_advisors,
    get_student_by_id,
    get_advisor_by_email,
    get_students_for_advisor,
)

router = APIRouter(
    prefix="/api/demo",
    tags=["Demo"],
)


@router.get("/admin/dashboard")
def admin_dashboard():
    return get_demo_summary()


@router.get("/admin/students")
def admin_students():
    return get_demo_students()


@router.get("/admin/advisors")
def admin_advisors():
    return get_demo_advisors()


@router.get("/student/{student_id}")
def student_dashboard(student_id: str):
    student = get_student_by_id(student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


@router.get("/advisor/by-email/{email}")
def advisor_dashboard(email: str):
    advisor = get_advisor_by_email(email)

    if not advisor:
        raise HTTPException(status_code=404, detail="Advisor not found")

    students = get_students_for_advisor(email)

    return {
        "advisor": advisor,
        "students": students,
        "summary": {
            "assigned_students": len(students),
            "high_risk": sum(
                1 for s in students
                if s["overall_risk"] == "High Risk"
            ),
            "moderate_risk": sum(
                1 for s in students
                if s["overall_risk"] == "Moderate Risk"
            ),
            "low_risk": sum(
                1 for s in students
                if s["overall_risk"] == "Low Risk"
            ),
        },
    }