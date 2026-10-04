import logging
import pandas as pd

logger = logging.getLogger(__name__)

KEYS = ["id_student", "code_module", "code_presentation"]

DEMOGRAPHIC_COLS = [
    "gender",
    "region",
    "highest_education",
    "imd_band",
    "age_band",
    "num_of_prev_attempts",
    "studied_credits",
    "disability",
]


def _check_required_columns(df: pd.DataFrame, required_cols: list[str], name: str) -> None:
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"{name} is missing required columns: {missing}")


def _assert_unique_keys(df: pd.DataFrame, name: str, example_n: int = 5) -> None:
    dup_mask = df.duplicated(subset=KEYS, keep=False)
    if not dup_mask.any():
        return

    # Count of rows participating in duplicated groups
    duplicated_rows_count = int(dup_mask.sum())

    # Count of unique duplicated KEY groups
    duplicated_key_groups = int(df.loc[dup_mask, KEYS].drop_duplicates().shape[0])

    # Show some example offending keys
    examples = (
        df.loc[dup_mask, KEYS]
        .drop_duplicates()
        .head(example_n)
        .values.tolist()
    )

    raise ValueError(
        f"Duplicate KEYS detected in {name}. "
        f"Duplicated rows involved: {duplicated_rows_count}. "
        f"Duplicated key groups: {duplicated_key_groups}. "
        f"Example offending KEYS: {examples}"
    )


def make_target_at_risk(df: pd.DataFrame) -> pd.Series:
    return df["final_result"].isin(["Fail", "Withdrawn"]).astype(int)


def build_canonical(
    student_info: pd.DataFrame,
    engagement_features: pd.DataFrame,
    assessment_features: pd.DataFrame,
    include_target: bool = True,
    verbose: bool = False,
) -> pd.DataFrame:

    # =========================
    # Contract enforcement
    # =========================
    _check_required_columns(student_info, KEYS, "student_info")
    _check_required_columns(engagement_features, KEYS, "engagement_features")
    _check_required_columns(assessment_features, KEYS, "assessment_features")
    if include_target:
        _check_required_columns(student_info, ["final_result"], "student_info")

    # =========================
    # Uniqueness enforcement
    # =========================
    _assert_unique_keys(student_info, "student_info")
    _assert_unique_keys(engagement_features, "engagement_features")
    _assert_unique_keys(assessment_features, "assessment_features")

    # =========================
    # Build base (inference-safe)
    # =========================
    base_cols = KEYS + [c for c in DEMOGRAPHIC_COLS if c in student_info.columns]
    out = student_info[base_cols].copy()
    base_row_count = len(out)

    # =========================
    # Merge engagement
    # =========================
    out = out.merge(engagement_features, on=KEYS, how="left")
    if len(out) != base_row_count:
        raise ValueError("Row explosion after merging engagement_features (duplicate KEYS somewhere).")

    # =========================
    # Merge assessment
    # =========================
    out = out.merge(assessment_features, on=KEYS, how="left")
    if len(out) != base_row_count:
        raise ValueError("Row explosion after merging assessment_features (duplicate KEYS somewhere).")

    # =========================
    # Missing feature rate diagnostics (no print)
    # =========================
    eng_cols = [c for c in engagement_features.columns if c not in KEYS]
    ass_cols = [c for c in assessment_features.columns if c not in KEYS]

    if verbose and eng_cols:
        missing_eng_rate = float(out[eng_cols].isna().any(axis=1).mean())
        logger.info("%% rows missing engagement features (pre-fill): %.2f%%", missing_eng_rate * 100)

    if verbose and ass_cols:
        missing_ass_rate = float(out[ass_cols].isna().any(axis=1).mean())
        logger.info("%% rows missing assessment features (pre-fill): %.2f%%", missing_ass_rate * 100)

    # Fill numeric NaNs with 0 (after measuring)
    numeric_cols = out.select_dtypes(include="number").columns
    numeric_cols = [c for c in numeric_cols if c not in KEYS]
    out[numeric_cols] = out[numeric_cols].fillna(0)

    # =========================
    # Training-only label merge + completeness check
    # =========================
    if include_target:
        label_df = student_info[KEYS + ["final_result"]].copy()
        label_df["target_at_risk"] = make_target_at_risk(label_df)
        label_df = label_df[KEYS + ["target_at_risk"]]

        _assert_unique_keys(label_df, "label_df")

        out = out.merge(label_df, on=KEYS, how="left")
        if len(out) != base_row_count:
            raise ValueError("Row explosion after merging labels (duplicate KEYS somewhere).")

        if out["target_at_risk"].isna().any():
            raise ValueError("Missing labels detected after merge (training data is incomplete).")

    return out