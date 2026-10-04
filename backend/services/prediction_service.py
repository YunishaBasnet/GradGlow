import json
import math

import pandas as pd
from sqlalchemy.orm import Session

from backend.models.auth_models import Student, RiskSnapshot
from backend.ml.inference.predictor import predict_student_risk


# =========================================================
# FEATURE NORMALIZATION
# =========================================================

FEATURE_RENAME_MAP = {
    "id_student": "student_id",
    "assessment_avg_score": "avg_assessment_score",
    "assessment_weighted_avg": "weighted_assessment_score",
    "assessment_count": "assessments_submitted_count",
}


DEFAULT_MODEL_FEATURES = {
    "late_submission_rate": 0.0,
    "avg_submission_delay_days": 0.0,
    "engagement_consistency": 0.0,
    "clicks_first_4_weeks": 0.0,
    "assessments_submitted_first_4_weeks": 0.0,
    "num_of_prev_attempts": 0.0,
    "studied_credits": 0.0,
}


def _safe_value(value, default=0.0):
    """
    Convert pandas NaN/None values into a safe default.
    """
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except (TypeError, ValueError):
        pass

    return value


def normalize_feature_row(row: dict) -> dict:
    """
    Normalize ETL column names to the feature names expected
    by the trained ML models.
    """
    normalized = {}

    for key, value in row.items():
        normalized_key = FEATURE_RENAME_MAP.get(key, key)
        normalized[normalized_key] = _safe_value(value)

    for feature, default_value in DEFAULT_MODEL_FEATURES.items():
        normalized.setdefault(feature, default_value)

    return normalized


# =========================================================
# STUDENT UPSERT
# =========================================================

def upsert_student_from_row(
    db: Session,
    row: dict,
) -> Student:
    """
    Create the student if missing.

    If the student already exists, update the current module
    and presentation from the latest processed enrollment row.

    No commit occurs here. The caller controls the transaction.
    """
    student_id = str(
        row.get("student_id")
        or row.get("id_student")
        or ""
    ).strip()

    if not student_id:
        raise ValueError(
            "Canonical row is missing student_id."
        )

    module = str(
        row.get("code_module") or ""
    ).strip()

    presentation = str(
        row.get("code_presentation") or ""
    ).strip()

    student = (
        db.query(Student)
        .filter(
            Student.student_id == student_id
        )
        .first()
    )

    if student is None:
        student = Student(
            student_id=student_id,
            full_name=f"Student {student_id}",
            email=None,
            program=module or None,
            year_of_study=1,
            advisor_id=None,
            current_module=module or None,
            current_presentation=presentation or None,
        )

        db.add(student)
        # flush the new student into the current transaction
        # this prevents duplicate INSERT attempts when the same student appears again before the batch is commiteed.
        db.flush()

    else:
        student.current_module = module or student.current_module
        student.current_presentation = (
            presentation
            or student.current_presentation
        )

        if not student.program and module:
            student.program = module

    return student


# =========================================================
# RISK SNAPSHOT UPSERT
# =========================================================

def upsert_risk_snapshot(
    db: Session,
    *,
    student_id: str,
    module: str,
    presentation: str,
    checkpoint_week: int,
    result: dict,
) -> RiskSnapshot:
    """
    Create or update one prediction for:

        student + course + checkpoint week

    This makes prediction generation safe to rerun without
    continuously creating duplicate RiskSnapshot rows.
    """
    course_key = f"{module}-{presentation}"

    snapshot = (
        db.query(RiskSnapshot)
        .filter(
            RiskSnapshot.student_id == student_id,
            RiskSnapshot.course_key == course_key,
            RiskSnapshot.checkpoint_week == checkpoint_week,
        )
        .first()
    )

    top_factors_json = json.dumps(
        result.get("top_factors", [])
    )

    recommended_actions_json = json.dumps(
        result.get("recommended_actions", [])
    )

    if snapshot is None:
        snapshot = RiskSnapshot(
            student_id=student_id,
            course_key=course_key,
            checkpoint_week=checkpoint_week,
        )

        db.add(snapshot)

    snapshot.overall_risk = result["risk_probability"]
    snapshot.course_risk = result["risk_probability"]
    snapshot.risk_label = result["risk_label"]

    snapshot.why_risk = top_factors_json
    snapshot.top_factors_json = top_factors_json

    snapshot.recommended_actions = (
        recommended_actions_json
    )

    snapshot.final_overall_risk = (
        result["risk_probability"]
    )

    snapshot.model_source = result["model_source"]

    return snapshot


# =========================================================
# SINGLE PREDICTION
# =========================================================

def run_single_prediction(
    db: Session,
    student_id: str,
    module: str,
    presentation: str,
    feature_row: dict,
    checkpoint_week: int = 12,
    *,
    commit: bool = True,
):
    """
    Run ML inference for one student/course and upsert the
    corresponding RiskSnapshot.
    """
    result = predict_student_risk(
        feature_row=feature_row,
        module=module,
        presentation=presentation,
        checkpoint_week=checkpoint_week,
    )

    snapshot = upsert_risk_snapshot(
        db=db,
        student_id=student_id,
        module=module,
        presentation=presentation,
        checkpoint_week=checkpoint_week,
        result=result,
    )

    if commit:
        db.commit()
        db.refresh(snapshot)

    return {
        "student_id": student_id,
        "course_key": snapshot.course_key,
        "checkpoint_week": checkpoint_week,
        **result,
    }


# =========================================================
# CANONICAL DATASET PREDICTIONS
# =========================================================

def run_predictions_from_canonical_csv(
    db: Session,
    canonical_csv_path: str,
    checkpoint_week: int = 12,
):
    """
    Run predictions for every canonical student-course row.

    Students and RiskSnapshots are upserted rather than
    blindly inserted, making repeated generation safe.

    Database changes are committed in batches rather than
    committing twice for every canonical row.
    """
    df = pd.read_csv(canonical_csv_path)

    if df.empty:
        raise ValueError(
            "Canonical prediction dataset is empty."
        )

    required_columns = {
        "id_student",
        "code_module",
        "code_presentation",
    }

    missing_columns = (
        required_columns
        - set(df.columns)
    )

    if missing_columns:
        raise ValueError(
            "Canonical dataset is missing required columns: "
            + ", ".join(sorted(missing_columns))
        )

    results = []

    batch_size = 500

    try:
        for row_number, raw_row in df.iterrows():
            row = normalize_feature_row(
                raw_row.to_dict()
            )

            student = upsert_student_from_row(
                db,
                row,
            )

            student_id = student.student_id

            module = str(
                row.get("code_module")
                or student.current_module
                or ""
            ).strip()

            presentation = str(
                row.get("code_presentation")
                or student.current_presentation
                or ""
            ).strip()

            if not module:
                raise ValueError(
                    f"Row {row_number} is missing code_module."
                )

            if not presentation:
                raise ValueError(
                    f"Row {row_number} is missing code_presentation."
                )

            prediction = run_single_prediction(
                db=db,
                student_id=student_id,
                module=module,
                presentation=presentation,
                feature_row=row,
                checkpoint_week=checkpoint_week,
                commit=False,
            )

            results.append(prediction)

            if len(results) % batch_size == 0:
                db.commit()

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "status": "completed",
        "rows_processed": len(results),

        # Only return a preview through the API rather than
        # sending tens of thousands of predictions.
        "predictions": results[:10],
    }


# =========================================================
# LEGACY SERVICE ENTRY POINT
# =========================================================

def run_prediction(processed_data: dict):
    return {
        "status": "ready",
        "message": (
            "Use run_predictions_from_canonical_csv(db, path) "
            "after ETL completes."
        ),
        "processed_data": processed_data,
    }
