from __future__ import annotations

from typing import Iterable
import pandas as pd


def require_columns(df: pd.DataFrame, required_cols: Iterable[str], name: str = "df") -> None:
    """
    Check that all required columns exist in df.
    """
    required_cols = list(required_cols)  # lets you pass list/tuple/set safely
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"{name} missing columns: {missing}")


def require_unique_keys(df: pd.DataFrame, keys: Iterable[str], name: str = "df") -> None:
    """
    Check that the key columns exist and there are no duplicate key rows.
    """
    keys = list(keys)
    require_columns(df, keys, name)

    duplicates = int(df.duplicated(subset=keys).sum())
    if duplicates > 0:
        raise ValueError(f"{name} has {duplicates} duplicate rows for keys {keys}")


def require_no_missing(df: pd.DataFrame, cols: Iterable[str], name: str = "df") -> None:
    """
    Check that specified columns contain no missing (NaN) values.
    """
    cols = list(cols)
    require_columns(df, cols, name)

    missing_counts = {c: int(df[c].isna().sum()) for c in cols}
    bad = {c: n for c, n in missing_counts.items() if n > 0}
    if bad:
        raise ValueError(f"{name} has missing values: {bad}")


def require_in_range(
    df: pd.DataFrame,
    col: str,
    low: float | None = None,
    high: float | None = None,
    name: str = "df",
) -> None:
    """
    Optional: Check numeric column values are within [low, high].
    Only checks non-missing values.
    """
    require_columns(df, [col], name)

    s = pd.to_numeric(df[col], errors="coerce").dropna()

    if low is not None and (s < low).any():
        raise ValueError(f"{name}.{col} has values < {low}")
    if high is not None and (s > high).any():
        raise ValueError(f"{name}.{col} has values > {high}")