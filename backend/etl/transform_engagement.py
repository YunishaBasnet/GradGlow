import pandas as pd


KEYS = ["id_student", "code_module", "code_presentation"]


def build_engagement_features(
    student_vle: pd.DataFrame,
    cutoff_day: int,
) -> pd.DataFrame:
    """
    Build engagement features using only information available
    before the cutoff day.

    Returns one row per:
        (id_student, code_module, code_presentation)
    """

    df = student_vle.copy()

    # 1. Prevent future-data leakage.
    df = df[df["date"] < cutoff_day].copy()

    if df.empty:
        return pd.DataFrame(
            columns=KEYS
            + [
                "total_vle_clicks",
                "active_days_count",
                "weeks_active_count",
                "avg_clicks_per_week",
                "engagement_consistency",
                "clicks_first_4_weeks",
            ]
        )

    # 2. Total VLE clicks before the checkpoint.
    total_clicks = (
        df.groupby(KEYS)["sum_click"]
        .sum()
        .reset_index(name="total_vle_clicks")
    )

    # 3. Number of unique active days.
    active_days = (
        df[df["sum_click"] > 0]
        .groupby(KEYS)["date"]
        .nunique()
        .reset_index(name="active_days_count")
    )

    # 4. Number of unique active weeks.
    df["week"] = df["date"] // 7

    weeks_active = (
        df[df["sum_click"] > 0]
        .groupby(KEYS)["week"]
        .nunique()
        .reset_index(name="weeks_active_count")
    )

    # 5. Clicks during the first four weeks.
    #
    # Day 28 is the end of the first four-week period.
    first_four_weeks = (
        df[df["date"] <= 28]
        .groupby(KEYS)["sum_click"]
        .sum()
        .reset_index(name="clicks_first_4_weeks")
    )

    # 6. Merge engagement features.
    engagement = total_clicks.merge(
        active_days,
        on=KEYS,
        how="left",
    )

    engagement = engagement.merge(
        weeks_active,
        on=KEYS,
        how="left",
    )

    engagement = engagement.merge(
        first_four_weeks,
        on=KEYS,
        how="left",
    )

    # 7. Fill missing count/activity values.
    engagement["active_days_count"] = (
        engagement["active_days_count"].fillna(0)
    )

    engagement["weeks_active_count"] = (
        engagement["weeks_active_count"].fillna(0)
    )

    engagement["clicks_first_4_weeks"] = (
        engagement["clicks_first_4_weeks"].fillna(0)
    )

    # 8. Average clicks per active week.
    engagement["avg_clicks_per_week"] = (
        engagement["total_vle_clicks"]
        / engagement["weeks_active_count"].replace(0, 1)
    )

    # 9. Engagement consistency.
    #
    # This follows the original ML feature engineering:
    # active days / active weeks.
    engagement["engagement_consistency"] = (
        engagement["active_days_count"]
        / engagement["weeks_active_count"].replace(0, 1)
    )

    return engagement