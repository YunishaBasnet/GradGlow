import numpy as np
import pandas as pd


KEYS = ["id_student", "code_module", "code_presentation"]


def build_assessment_features(
    student_assessment: pd.DataFrame,
    assessments: pd.DataFrame,
    cutoff_day: int,
) -> pd.DataFrame:
    """
    Build assessment features using only information available
    on or before cutoff_day.

    Returns one row per:
        (id_student, code_module, code_presentation)
    """

    # 1. Merge student submissions with assessment metadata.
    df = student_assessment.merge(
        assessments,
        on=["id_assessment"],
        how="left",
        validate="many_to_one",
    )

    # 2. Convert required columns to numeric.
    for col in [
        "date_submitted",
        "score",
        "weight",
        "date",
    ]:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce",
        )

    # Remove unusable rows.
    df = df.dropna(
        subset=[
            "date_submitted",
            "score",
            "weight",
            "date",
        ]
    ).copy()

    # 3. Defensive cleaning.
    df["score"] = df["score"].clip(
        lower=0,
        upper=100,
    )

    df = df[df["weight"] >= 0].copy()

    # 4. Prevent future-data leakage.
    #
    # Only submissions known by the checkpoint are included.
    df = df[
        df["date_submitted"] <= cutoff_day
    ].copy()

    if df.empty:
        return pd.DataFrame(
            columns=KEYS
            + [
                "assessment_count",
                "assessment_avg_score",
                "assessment_weighted_avg",
                "late_submission_rate",
                "avg_submission_delay_days",
                "assessments_submitted_first_4_weeks",
            ]
        )

    # 5. Keep the latest known submission for each assessment.
    #
    # If two submissions happened on the same day,
    # retain the higher score.
    df = (
        df.sort_values(
            ["date_submitted", "score"]
        )
        .groupby(
            KEYS + ["id_assessment"],
            as_index=False,
        )
        .last()
    )

    # ---------------------------------------------------------
    # Assessment performance features
    # ---------------------------------------------------------

    df["weighted_component"] = (
        df["score"] * df["weight"]
    )

    grouped = df.groupby(KEYS)

    assessment_count = (
        grouped["id_assessment"]
        .nunique()
        .rename("assessment_count")
    )

    assessment_avg = (
        grouped["score"]
        .mean()
        .rename("assessment_avg_score")
    )

    weighted_sum = grouped[
        "weighted_component"
    ].sum()

    weight_sum = grouped["weight"].sum()

    assessment_weighted_avg = (
        weighted_sum
        / weight_sum.replace(0, np.nan)
    ).rename("assessment_weighted_avg")

    # ---------------------------------------------------------
    # Submission timing features
    # ---------------------------------------------------------

    # Positive delay = submitted after due date.
    # Negative delay = submitted before due date.
    df["submission_delay_days"] = (
        df["date_submitted"] - df["date"]
    )

    df["is_late"] = (
        df["submission_delay_days"] > 0
    ).astype(int)

    late_submission_rate = (
        df.groupby(KEYS)["is_late"]
        .mean()
        .rename("late_submission_rate")
    )

    avg_submission_delay_days = (
        df.groupby(KEYS)["submission_delay_days"]
        .mean()
        .rename("avg_submission_delay_days")
    )

    # ---------------------------------------------------------
    # First-four-weeks feature
    # ---------------------------------------------------------

    first_four_weeks = (
        df[df["date_submitted"] <= 28]
        .groupby(KEYS)["id_assessment"]
        .nunique()
        .rename(
            "assessments_submitted_first_4_weeks"
        )
    )

    # ---------------------------------------------------------
    # Combine all features
    # ---------------------------------------------------------

    out = pd.concat(
        [
            assessment_count,
            assessment_avg,
            assessment_weighted_avg,
            late_submission_rate,
            avg_submission_delay_days,
            first_four_weeks,
        ],
        axis=1,
    ).reset_index()

    # Students who submitted assessments but none during
    # the first four weeks should receive 0.
    out[
        "assessments_submitted_first_4_weeks"
    ] = (
        out[
            "assessments_submitted_first_4_weeks"
        ]
        .fillna(0)
        .astype(int)
    )

    return out