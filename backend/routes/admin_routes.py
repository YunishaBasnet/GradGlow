from pathlib import Path

import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.auth_models import (
    User,
    Student,
    RiskSnapshot,
    TrainingRun,
)
from backend.services.auth_service import hash_password


router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ---------------------------------------------------------
# ASSIGN / CHANGE STUDENT ADVISOR
# ---------------------------------------------------------

@router.patch("/students/{student_id}/advisor")
def assign_student_advisor(
    student_id: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    advisor_id = str(
        payload.get("advisor_id", "")
    ).strip()

    if not advisor_id:
        raise HTTPException(
            status_code=400,
            detail="Advisor ID is required",
        )

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    advisor_number = advisor_id

    if advisor_id.upper().startswith("A"):
        advisor_number = advisor_id[1:]

    try:
        advisor_user_id = int(advisor_number)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid advisor ID",
        )

    advisor = (
        db.query(User)
        .filter(
            User.id == advisor_user_id,
            User.role == "advisor",
        )
        .first()
    )

    if advisor is None:
        raise HTTPException(
            status_code=404,
            detail="Advisor account not found",
        )

    student.advisor_id = advisor_id.upper()

    db.commit()
    db.refresh(student)

    return {
        "message": "Advisor assigned successfully",
        "student_id": student.student_id,
        "student_name": student.full_name,
        "advisor_id": student.advisor_id,
        "advisor_email": advisor.username,
    }


BASE_DIR = Path(__file__).resolve().parents[2]

PROCESSED_FILE = (
    BASE_DIR
    / "generated"
    / "etl_processed"
    / "oulad_canonical_upload_cutoff28.csv"
)

STUDENT_ID_START = 100001


# ---------------------------------------------------------
# CSV / ML HELPERS
# ---------------------------------------------------------

def get_processed_df():
    if not PROCESSED_FILE.exists():
        return None

    try:
        return pd.read_csv(PROCESSED_FILE)
    except Exception:
        return None


def get_student_col(df):
    if df is None:
        return None

    if "student_id" in df.columns:
        return "student_id"

    if "id_student" in df.columns:
        return "id_student"

    return None


def get_avg_score_from_group(group):
    if "assessment_avg_score" in group.columns:
        return float(
            group["assessment_avg_score"]
            .fillna(0)
            .mean()
        )

    if "avg_assessment_score" in group.columns:
        return float(
            group["avg_assessment_score"]
            .fillna(0)
            .mean()
        )

    if "score" in group.columns:
        return float(
            group["score"]
            .fillna(0)
            .mean()
        )

    return 0.0


def calculate_risk(avg_score):
    if avg_score < 40:
        return "High", 85

    if avg_score < 65:
        return "Medium", 55

    return "Low", 20


# ---------------------------------------------------------
# STUDENT ID GENERATOR
# ---------------------------------------------------------

def generate_student_id(db: Session) -> str:
    """
    Generate the next available GradGlow student ID.

    Example:
        100001
        100002
        100003
    """

    students = db.query(Student.student_id).all()

    numeric_ids = []

    for row in students:
        value = row[0]

        if value is None:
            continue

        value = str(value).strip()

        if value.isdigit():
            numeric_ids.append(int(value))

    if not numeric_ids:
        return str(STUDENT_ID_START)

    next_id = max(
        max(numeric_ids) + 1,
        STUDENT_ID_START,
    )

    # Extra safety in case User contains an ID that
    # Student does not.
    while (
        db.query(User)
        .filter(User.username == str(next_id))
        .first()
        is not None
    ):
        next_id += 1

    return str(next_id)


# ---------------------------------------------------------
# CREATE STUDENT ACCOUNT
# ---------------------------------------------------------

@router.post("/students")
def create_student(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Create a student profile and login account.

    Student ID is generated automatically and is also
    used as the student's login username.
    """

    full_name = str(
        payload.get("full_name", "")
    ).strip()

    email = str(
        payload.get("email", "")
    ).strip().lower()

    password = str(
        payload.get("password", "")
    ).strip()

    program = str(
        payload.get("program", "")
    ).strip()

    advisor_id = str(
        payload.get("advisor_id", "")
    ).strip() or None

    current_module = str(
        payload.get("current_module", "")
    ).strip() or None

    current_presentation = str(
        payload.get("current_presentation", "")
    ).strip() or None

    year_raw = payload.get("year_of_study")

    # -------------------------
    # Validation
    # -------------------------

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Student full name is required",
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Student email is required",
        )

    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Invalid student email",
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Initial password is required",
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters",
        )

    year_of_study = None

    if year_raw not in (None, ""):
        try:
            year_of_study = int(year_raw)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="year_of_study must be a number",
            )

        if year_of_study < 1:
            raise HTTPException(
                status_code=400,
                detail="year_of_study must be at least 1",
            )

    existing_student_email = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if existing_student_email:
        raise HTTPException(
            status_code=409,
            detail="A student with this email already exists",
        )

    # -------------------------
    # Generate Student ID
    # -------------------------

    student_id = generate_student_id(db)

    # -------------------------
    # Create Student
    # -------------------------

    student = Student(
        student_id=student_id,
        full_name=full_name,
        email=email,
        program=program or None,
        year_of_study=year_of_study,
        advisor_id=advisor_id,
        current_module=current_module,
        current_presentation=current_presentation,
    )

    # -------------------------
    # Create Login User
    # -------------------------

    user = User(
        username=student_id,
        password_hash=hash_password(password),
        role="student",
        student_id=student_id,
    )

    try:
        db.add(student)
        db.add(user)

        db.commit()

        db.refresh(student)
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Student account created successfully",
        "student": {
            "id": student.id,
            "student_id": student.student_id,
            "full_name": student.full_name,
            "email": student.email,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "advisor_id": student.advisor_id,
            "current_module": student.current_module,
            "current_presentation": (
                student.current_presentation
            ),
        },
        "account": {
            "username": user.username,
            "role": user.role,
        },
    }


# ---------------------------------------------------------
# CREATE ADVISOR / UNIVERSITY ADMIN
# ---------------------------------------------------------

@router.post("/users")
def create_user(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Create an Advisor or University Admin.

    Staff authenticate using their university email.

    Student accounts should be created through
    POST /api/admin/students instead.
    """

    email = str(
        payload.get(
            "email",
            payload.get("username", ""),
        )
    ).strip().lower()

    password = str(
        payload.get("password", "")
    ).strip()

    role = str(
        payload.get("role", "")
    ).strip()

    if not email:
        raise HTTPException(
            status_code=400,
            detail="University email is required",
        )

    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="A valid university email is required",
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required",
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters",
        )

    if role not in {
        "advisor",
        "university_admin",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be advisor or university_admin. "
                "Create students through /api/admin/students."
            ),
        )

    existing = (
        db.query(User)
        .filter(User.username == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        username=email,
        password_hash=hash_password(password),
        role=role,
        student_id=None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Staff account created successfully",
        "id": user.id,
        "email": user.username,
        "username": user.username,
        "role": user.role,
    }


# ---------------------------------------------------------
# ADMIN SUMMARY
# ---------------------------------------------------------

@router.get("/summary")
def admin_summary(
    db: Session = Depends(get_db),
):
    df = get_processed_df()
    student_col = get_student_col(df)

    csv_students = 0
    high_risk_count = 0

    total_predictions = (
        db.query(RiskSnapshot).count()
    )

    if df is not None and student_col:
        csv_students = int(
            df[student_col].nunique()
        )

        for _, group in df.groupby(
            student_col,
            dropna=True,
        ):
            avg_score = (
                get_avg_score_from_group(group)
            )

            risk_label, _ = calculate_risk(
                avg_score
            )

            if risk_label == "High":
                high_risk_count += 1

        if total_predictions == 0:
            total_predictions = csv_students

    db_students = db.query(Student).count()

    total_students = (
        db_students
        if db_students > 0
        else csv_students
    )

    return {
        "total_students": total_students,
        "total_predictions": total_predictions,
        "high_risk_count": high_risk_count,
        "training_runs": (
            db.query(TrainingRun).count()
        ),
        "advisor_accounts": (
            db.query(User)
            .filter(User.role == "advisor")
            .count()
        ),
        "admin_accounts": (
            db.query(User)
            .filter(
                User.role == "university_admin"
            )
            .count()
        ),
    }


# ---------------------------------------------------------
# ADMIN STUDENT LIST
# ---------------------------------------------------------

@router.get("/students")
def admin_students(
    db: Session = Depends(get_db),
):
    """
    Return real GradGlow student records.

    Student IDs shown here are the same IDs students
    use to sign in.
    """

    students = (
        db.query(Student)
        .order_by(Student.student_id.asc())
        .all()
    )

    results = []

    for student in students:

        latest_risk = (
            db.query(RiskSnapshot)
            .filter(
                RiskSnapshot.student_id
                == student.student_id
            )
            .order_by(
                RiskSnapshot.checkpoint_week.desc(),
                RiskSnapshot.id.desc(),
            )
            .first()
        )

        risk_label = (
            latest_risk.risk_label
            if latest_risk
            else "Unknown"
        )

        risk_score = 0

        if latest_risk:
            if (
                latest_risk.final_overall_risk
                is not None
            ):
                risk_score = (
                    latest_risk.final_overall_risk
                )
            elif (
                latest_risk.overall_risk
                is not None
            ):
                risk_score = (
                    latest_risk.overall_risk
                )

        account = (
            db.query(User)
            .filter(
                User.student_id
                == student.student_id
            )
            .first()
        )

        results.append(
            {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.full_name,
                "full_name": student.full_name,
                "email": student.email,
                "program": student.program,
                "year_of_study": (
                    student.year_of_study
                ),
                "advisor_id": student.advisor_id,
                "course": student.current_module,
                "module": student.current_module,
                "presentation": (
                    student.current_presentation
                ),
                "risk_label": risk_label,
                "risk": risk_label,
                "risk_score": risk_score,
                "status": risk_label,
                "account_status": (
                    "Active"
                    if account is not None
                    else "No Account"
                ),
                "login_id": (
                    account.username
                    if account is not None
                    else None
                ),
            }
        )

    return results


# ---------------------------------------------------------
# ADMIN STAFF LIST
# ---------------------------------------------------------

@router.get("/users")
def admin_users(
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(
            User.role.in_(
                [
                    "advisor",
                    "university_admin",
                ]
            )
        )
        .order_by(User.role.asc(), User.username.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "email": user.username,
            "username": user.username,
            "role": user.role,
        }
        for user in users
    ]