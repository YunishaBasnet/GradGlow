from __future__ import annotations
from backend.etl.mapping import standardize_table, detect_table_from_filename
import os
import pandas as pd

KEYS = ["id_student", "code_module", "code_presentation"]

SCHEMAS: dict[str, set[str]] = {
    "studentInfo": {"id_student", "code_module", "code_presentation", "final_result"},
    "studentVle": {"id_student", "code_module", "code_presentation", "date", "sum_click"},
    "assessments": {"id_assessment", "code_module", "code_presentation", "date", "weight"},
    "studentAssessment": {"id_assessment", "id_student", "date_submitted", "score"},
}


def require_columns(df: pd.DataFrame, required_cols: list[str], name: str = "df") -> None:
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"{name} missing columns: {missing}")


def _read_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


def detect_file_type(df: pd.DataFrame) -> str | None:
    """
    Return the detected dataset type name, or None if no match.
    If a file matches more than one schema, raise (ambiguous).
    """
    cols = set(df.columns)
    matches = [name for name, required in SCHEMAS.items() if required.issubset(cols)]

    if len(matches) == 0:
        return None
    if len(matches) > 1:
        raise ValueError(f"Ambiguous file schema. Matches multiple types: {matches}")

    return matches[0]

def extract_raw_flexible(data_dir: str, source: str = "oulad") -> dict[str, pd.DataFrame]:
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    csv_files = [f for f in os.listdir(data_dir) if f.lower().endswith(".csv")]
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in: {data_dir}")

    detected: dict[str, pd.DataFrame] = {}

    for filename in csv_files:
        path = os.path.join(data_dir, filename)
        df = _read_csv(path)

        if source == "oulad":
            # your current behavior: detect by schema
            dtype = detect_file_type(df)
            if dtype is None:
                raise ValueError(f"Unknown CSV schema for file: {filename}")
        else:
            # external behavior: detect by filename, THEN map to canonical
            dtype = detect_table_from_filename(filename, source=source)
            if dtype is None:
                raise ValueError(
                    f"Could not detect table type from filename '{filename}' for source='{source}'. "
                    f"Update FILE_HINTS in mapping.py."
                )
            df = standardize_table(df, table_name=dtype, source=source)

        if dtype in detected:
            raise ValueError(f"Duplicate dataset type '{dtype}' detected. Files conflict (e.g., {filename}).")

        detected[dtype] = df

    missing_types = [t for t in SCHEMAS.keys() if t not in detected]
    if missing_types:
        raise ValueError(f"Missing required dataset types: {missing_types}")

    return detected



def clean_basic(dfs: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    """
    Basic cleaning only (safe types + remove impossible rows).
    No feature engineering here.
    """
    si = dfs["studentInfo"].copy()
    sv = dfs["studentVle"].copy()
    a = dfs["assessments"].copy()
    sa = dfs["studentAssessment"].copy()

    # ---- schema checks (still good to re-check) ----
    require_columns(si, KEYS + ["final_result"], "studentInfo")
    require_columns(sv, KEYS + ["date", "sum_click"], "studentVle")
    require_columns(a, ["id_assessment", "code_module", "code_presentation", "date", "weight"], "assessments")
    require_columns(sa, ["id_assessment", "id_student", "date_submitted", "score"], "studentAssessment")

    # ---- typing ----
    si["id_student"] = pd.to_numeric(si["id_student"], errors="coerce")
    sv["id_student"] = pd.to_numeric(sv["id_student"], errors="coerce")
    sa["id_student"] = pd.to_numeric(sa["id_student"], errors="coerce")

    sv["date"] = pd.to_numeric(sv["date"], errors="coerce")
    sv["sum_click"] = pd.to_numeric(sv["sum_click"], errors="coerce")

    a["date"] = pd.to_numeric(a["date"], errors="coerce")
    a["weight"] = pd.to_numeric(a["weight"], errors="coerce")

    sa["date_submitted"] = pd.to_numeric(sa["date_submitted"], errors="coerce")
    sa["score"] = pd.to_numeric(sa["score"], errors="coerce")

    # ---- drop missing keys / required identifiers ----
    si = si.dropna(subset=KEYS).drop_duplicates(subset=KEYS).copy()

    sv = sv.dropna(subset=KEYS + ["date", "sum_click"]).copy()
    a = a.dropna(subset=["id_assessment", "code_module", "code_presentation", "date", "weight"]).copy()
    sa = sa.dropna(subset=["id_assessment", "id_student", "date_submitted", "score"]).copy()

    # ---- remove impossible values ----
    sv = sv[sv["date"] >= 0].copy()
    sv["sum_click"] = sv["sum_click"].clip(lower=0)

    a = a[a["date"] >= 0].copy()
    a["weight"] = a["weight"].clip(lower=0)

    sa["score"] = sa["score"].clip(lower=0, upper=100)

    return {
        "studentInfo": si,
        "studentVle": sv,
        "assessments": a,
        "studentAssessment": sa,
    }


def extract_and_clean_flexible(data_dir: str, source: str = "oulad") -> dict[str, pd.DataFrame]:
    """
    Convenience function: flexible extract + (optional mapping) + basic cleaning.
    """
    return clean_basic(extract_raw_flexible(data_dir, source=source))