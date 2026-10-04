import random
from datetime import datetime

from backend.database import SessionLocal
from backend.models.auth_models import (
    User,
    Student,
    RiskSnapshot,
)
from backend.services.auth_service import hash_password


FIRST_NAMES = [
    "James", "Emma", "Liam", "Olivia", "Noah", "Sophia",
    "Mason", "Isabella", "Ethan", "Mia", "Lucas", "Charlotte",
    "Amelia", "Harper", "Evelyn", "Daniel", "Ava", "Benjamin",
]

LAST_NAMES = [
    "Smith", "Johnson", "Brown", "Taylor", "Anderson",
    "Thomas", "Jackson", "White", "Harris", "Martin",
    "Thompson", "Garcia", "Martinez", "Robinson",
]

PROGRAMS = [
    "Computer Science",
    "Business Administration",
    "Information Systems",
    "Cybersecurity",
    "Data Science",
    "Accounting",
    "Psychology",
    "Biology",
]

HIGH_RISK_COUNT = 30
MODERATE_RISK_COUNT = 140
LOW_RISK_COUNT = 530

TOTAL_STUDENTS = (
    HIGH_RISK_COUNT
    + MODERATE_RISK_COUNT
    + LOW_RISK_COUNT
)

TOTAL_ADVISORS = 20


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def create_demo_data():
    db = SessionLocal()

    print("Clearing old demo data...")

    db.query(RiskSnapshot).delete()
    db.query(Student).delete()

    advisor_users = (
        db.query(User)
        .filter(User.role == "advisor")
        .all()
    )

    for advisor in advisor_users:
        db.delete(advisor)

    student_users = (
        db.query(User)
        .filter(User.role == "student")
        .all()
    )

    for student in student_users:
        db.delete(student)

    db.commit()

    print("Creating advisors...")

    advisor_ids = []

    for i in range(1, TOTAL_ADVISORS + 1):

        advisor_email = f"advisor{i}@gradglow.edu"

        advisor = User(
            username=advisor_email,
            password_hash=hash_password("123456"),
            role="advisor",
        )

        db.add(advisor)

        advisor_ids.append(f"A{i:03}")

    db.commit()

    print("Creating students and predictions...")

    student_counter = 100001

    risk_distribution = (
        ["High"] * HIGH_RISK_COUNT
        + ["Medium"] * MODERATE_RISK_COUNT
        + ["Low"] * LOW_RISK_COUNT
    )

    random.shuffle(risk_distribution)

    for risk_label in risk_distribution:

        student_id = str(student_counter)

        full_name = random_name()

        advisor_id = random.choice(advisor_ids)

        email = (
            full_name.lower()
            .replace(" ", ".")
            + "@student.gradglow.edu"
        )

        program = random.choice(PROGRAMS)

        student_user = User(
            username=student_id,
            password_hash=hash_password("123456"),
            role="student",
        )

        db.add(student_user)

        student = Student(
            student_id=student_id,
            full_name=full_name,
            email=email,
            program=program,
            year_of_study=random.randint(1, 4),
            advisor_id=advisor_id,
            current_module=random.choice(
                ["CS101", "BUS202", "DS301", "CYB220"]
            ),
            current_presentation="2025J",
        )

        db.add(student)

        if risk_label == "High":
            risk_score = random.randint(75, 95)

        elif risk_label == "Medium":
            risk_score = random.randint(45, 69)

        else:
            risk_score = random.randint(10, 39)

        snapshot = RiskSnapshot(
            student_id=student_id,
            checkpoint_week=12,
            overall_risk=float(risk_score),
            course_risk=float(risk_score),
            risk_label=risk_label,
            why_risk="Generated demo prediction",
            recommended_actions="Advisor follow-up recommended",
            advisor_actions="Pending",
            final_overall_risk=float(risk_score),
            model_source="Demo Seed",
            top_factors_json='["Assessment", "Engagement"]',
        )

        db.add(snapshot)

        student_counter += 1

    db.commit()

    print("Demo data created successfully.")
    print(f"Students: {TOTAL_STUDENTS}")
    print(f"Advisors: {TOTAL_ADVISORS}")

    db.close()


if __name__ == "__main__":
    create_demo_data()