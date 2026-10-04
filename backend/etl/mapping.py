# ETL/mapping.py
from __future__ import annotations

import pandas as pd

# Canonical required columns per table (your pipeline contract)
REQUIRED_BY_TABLE: dict[str, list[str]] = {
    "studentInfo": ["id_student", "code_module", "code_presentation", "final_result"],
    "studentVle": ["id_student", "code_module", "code_presentation", "date", "sum_click"],
    "assessments": ["id_assessment", "code_module", "code_presentation", "date", "weight"],
    "studentAssessment": ["id_assessment", "id_student", "date_submitted", "score"],
}

# For NON-OULAD datasets: how to rename their columns into your canonical names.
# - oulad: identity (no renaming)
# - univX: YOU fill the left-side names to match that university's CSV headers
RENAME_MAP: dict[str, dict[str, dict[str, str]]] = {
    "oulad": {
        "studentInfo": {},
        "studentVle": {},
        "assessments": {},
        "studentAssessment": {},
    },
    "external": {
        # Example placeholders — replace left keys with the real column names from that university.
        "studentInfo": {
            # "Student_ID": "id_student",
            # "Module": "code_module",
            # "Presentation": "code_presentation",
            # "Result": "final_result",
            # "Gender": "gender",
            # "Disability": "disability",
        },
        "studentVle": {
            # "Student_ID": "id_student",
            # "Module": "code_module",
            # "Presentation": "code_presentation",
            # "Day": "date",
            # "Clicks": "sum_click",
        },
        "assessments": {
            # "Assessment_ID": "id_assessment",
            # "Module": "code_module",
            # "Presentation": "code_presentation",
            # "DueDay": "date",
            # "WeightPct": "weight",
        },
        "studentAssessment": {
            # "Assessment_ID": "id_assessment",
            # "Student_ID": "id_student",
            # "SubmittedDay": "date_submitted",
            # "Score": "score",
        },
    },
}

# For NON-OULAD datasets: how we recognize which file is which table (since schemas differ pre-mapping).
# Rule: filename contains these substrings (case-insensitive).
FILE_HINTS: dict[str, dict[str, list[str]]] = {
    "external": {
        "studentInfo": ["studentinfo", "student_info"],
        "studentVle": ["studentvle", "student_vle", "vle"],
        "assessments": ["assessments", "assessment_meta"],
        "studentAssessment": ["studentassessment", "student_assessment", "assessment_scores"],
    }
}


def require_columns(df: pd.DataFrame, required_cols: list[str], name: str = "df") -> None:
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"{name} missing columns: {missing}")


def _normalize_strings(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    # IMPORTANT: use pandas "string" dtype so missing stays <NA>, not "nan"
    for c in cols:
        if c in df.columns:
            df[c] = df[c].astype("string").str.strip()
    return df


def _normalize_categories_studentinfo(df: pd.DataFrame) -> pd.DataFrame:
    # Only normalize if these columns exist (OULAD may not have all)
    df = _normalize_strings(df, ["gender", "final_result", "disability", "highest_education", "imd_band", "age_band"])

    if "gender" in df.columns:
        df["gender"] = df["gender"].str.upper()
        df.loc[df["gender"].isin(["MALE", "M"]), "gender"] = "M"
        df.loc[df["gender"].isin(["FEMALE", "F"]), "gender"] = "F"

    if "disability" in df.columns:
        df["disability"] = df["disability"].str.upper()
        df.loc[df["disability"].isin(["YES", "Y"]), "disability"] = "Y"
        df.loc[df["disability"].isin(["NO", "N"]), "disability"] = "N"

    if "final_result" in df.columns:
        # Make results consistent with OULAD values
        fr = df["final_result"].str.strip().str.lower()
        df.loc[fr.isin(["pass", "passed"]), "final_result"] = "Pass"
        df.loc[fr.isin(["fail", "failed"]), "final_result"] = "Fail"
        df.loc[fr.isin(["withdrawn", "withdraw", "wd"]), "final_result"] = "Withdrawn"

    # Optional: fill unknown categories if you want (safe for ML)
    for c in ["highest_education", "imd_band", "age_band"]:
        if c in df.columns:
            df[c] = df[c].fillna("Unknown")

    return df


def standardize_table(df: pd.DataFrame, table_name: str, source: str = "oulad") -> pd.DataFrame:
    """
    Convert a dataset from <source> into your canonical schema for <table_name>.
    Steps:
      1) rename columns (source-specific)
      2) normalize categories (studentInfo only)
      3) enforce required columns (fail fast)
    """
    df = df.copy()

    if source not in RENAME_MAP:
        raise ValueError(f"Unknown source='{source}'. Add it to RENAME_MAP in mapping.py.")

    if table_name not in REQUIRED_BY_TABLE:
        raise ValueError(f"Unknown table_name='{table_name}'. Expected one of {list(REQUIRED_BY_TABLE.keys())}")

    rename_map = RENAME_MAP[source].get(table_name, {})
    if rename_map:
        df = df.rename(columns=rename_map)

    # StudentInfo category normalization (helps external datasets be consistent)
    if table_name == "studentInfo":
        df = _normalize_categories_studentinfo(df)

    # Enforce contract
    require_columns(df, REQUIRED_BY_TABLE[table_name], name=f"{source}:{table_name}")

    return df


def detect_table_from_filename(filename: str, source: str) -> str | None:
    """
    For external sources (pre-mapping), we use filename hints to decide table type.
    """
    fname = filename.lower()

    hints = FILE_HINTS.get(source)
    if not hints:
        return None

    matches = []
    for table_name, substrings in hints.items():
        if any(s in fname for s in substrings):
            matches.append(table_name)

    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        raise ValueError(f"Ambiguous filename '{filename}' matches multiple tables: {matches}")
    return None