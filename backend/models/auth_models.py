from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Float, Integer, String, Text

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        nullable=False,
        default="student",
    )

    student_id = Column(
        String,
        nullable=True,
        index=True,
    )


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    program = Column(String, nullable=True)
    year_of_study = Column(Integer, nullable=True)

    advisor_id = Column(String, nullable=True, index=True)

    contact_status = Column(String, nullable=True)
    last_contact_date = Column(String, nullable=True)
    contacted_by = Column(String, nullable=True)
    contact_notes = Column(Text, nullable=True)

    current_module = Column(String, nullable=True)
    current_presentation = Column(String, nullable=True)


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        nullable=False,
        index=True,
    )

    course_key = Column(String, nullable=True)
    course_name = Column(String, nullable=True)
    year_label = Column(String, nullable=True)

    is_current = Column(
        Boolean,
        nullable=False,
        default=False,
    )


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        nullable=False,
        index=True,
    )

    course_key = Column(String, nullable=True)

    checkpoint_week = Column(
        Integer,
        nullable=False,
        default=4,
    )

    overall_risk = Column(Float, nullable=True)
    course_risk = Column(Float, nullable=True)

    risk_label = Column(String, nullable=True)

    why_risk = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    advisor_actions = Column(Text, nullable=True)

    global_ml_risk = Column(Float, nullable=True)
    course_aggregated_risk = Column(Float, nullable=True)
    final_overall_risk = Column(Float, nullable=True)

    model_source = Column(String, nullable=True)
    top_factors_json = Column(Text, nullable=True)


class StudentRequest(Base):
    __tablename__ = "student_requests"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        nullable=False,
        index=True,
    )

    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")

    submitted_at = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        nullable=False,
        index=True,
    )

    from_role = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(String, nullable=True)
    is_read = Column(Integer, nullable=True)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        String,
        nullable=False,
        index=True,
    )

    slot = Column(String, nullable=True)
    status = Column(String, nullable=True)
    created_at = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        String,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).isoformat(),
    )

    model_source = Column(String, nullable=True)
    status = Column(String, nullable=True)
