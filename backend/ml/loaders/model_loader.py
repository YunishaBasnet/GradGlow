import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODELS_DIRECTORY = PROJECT_ROOT / "models"

SUPPORTED_CHECKPOINT_WEEKS = (4, 8, 12)

DEFAULT_THRESHOLDS = {
    "medium": 0.40,
    "high": 0.70,
}


class ModelAssetError(RuntimeError):
    """Raised when required machine-learning assets cannot be loaded."""


def _normalize_folder_value(value: str, field_name: str) -> str:
    """
    Validate a module or presentation name before using it in a path.
    """
    normalized = str(value).strip()

    if not normalized:
        raise ModelAssetError(f"{field_name} cannot be empty.")

    if "/" in normalized or "\\" in normalized or ".." in normalized:
        raise ModelAssetError(
            f"Invalid {field_name}: {normalized!r}."
        )

    return normalized


def _select_checkpoint_week(
    requested_week: int,
    model_directory: Path,
) -> int:
    """
    Select the nearest available checkpoint model.

    For example:
    - week 3 uses week 4
    - week 6 uses week 4 or week 8, whichever is nearest
    - week 10 uses week 8 or week 12, whichever is nearest
    """
    available_weeks = [
        week
        for week in SUPPORTED_CHECKPOINT_WEEKS
        if (model_directory / f"risk_model_week{week}.pkl").exists()
    ]

    if not available_weeks:
        raise ModelAssetError(
            f"No model files were found in: {model_directory}"
        )

    return min(
        available_weeks,
        key=lambda week: (
            abs(week - requested_week),
            week,
        ),
    )


def _resolve_model_directory(
    module: str,
    presentation: str,
) -> tuple[Path, str]:
    """
    Resolve the best model directory.

    The module-specific model is preferred. A global model is used as a
    fallback when a module-specific model is unavailable.
    """
    module = _normalize_folder_value(module, "module")
    presentation = _normalize_folder_value(
        presentation,
        "presentation",
    )

    candidates = [
        (
            MODELS_DIRECTORY / module / presentation,
            f"{module}/{presentation}",
        ),
        (
            MODELS_DIRECTORY / "global" / presentation,
            f"global/{presentation}",
        ),
        (
            MODELS_DIRECTORY / "global" / "fallback",
            "global/fallback",
        ),
    ]

    for directory, source in candidates:
        if directory.is_dir():
            return directory, source

    raise ModelAssetError(
        "No model directory was found for "
        f"module={module!r}, presentation={presentation!r}. "
        f"Expected a directory under {MODELS_DIRECTORY}."
    )


def _load_feature_names(path: Path) -> list[str]:
    """
    Load one feature name per line from a text file.
    """
    if not path.is_file():
        raise ModelAssetError(
            f"Feature file was not found: {path}"
        )

    features = [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    if not features:
        raise ModelAssetError(
            f"Feature file is empty: {path}"
        )

    if len(features) != len(set(features)):
        raise ModelAssetError(
            f"Feature file contains duplicate names: {path}"
        )

    return features


def _load_json_file(
    path: Path,
    *,
    required: bool,
    default: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Load and validate a JSON object.
    """
    if not path.is_file():
        if required:
            raise ModelAssetError(
                f"Required JSON file was not found: {path}"
            )

        return dict(default or {})

    try:
        content = json.loads(
            path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as exc:
        raise ModelAssetError(
            f"Invalid JSON in {path}: {exc}"
        ) from exc

    if not isinstance(content, dict):
        raise ModelAssetError(
            f"Expected a JSON object in: {path}"
        )

    return content


def _load_serialized_asset(
    path: Path,
    *,
    required: bool,
) -> Any | None:
    """
    Load a trusted model or scaler file using joblib.

    Pickle/joblib files must only come from trusted project sources.
    """
    if not path.is_file():
        if required:
            raise ModelAssetError(
                f"Required model asset was not found: {path}"
            )

        return None

    try:
        return joblib.load(path)
    except Exception as exc:
        raise ModelAssetError(
            f"Could not load model asset {path}: {exc}"
        ) from exc


def _normalize_thresholds(
    thresholds: dict[str, Any],
) -> dict[str, float]:
    """
    Validate and normalize medium/high risk thresholds.
    """
    try:
        medium = float(
            thresholds.get(
                "medium",
                DEFAULT_THRESHOLDS["medium"],
            )
        )
        high = float(
            thresholds.get(
                "high",
                DEFAULT_THRESHOLDS["high"],
            )
        )
    except (TypeError, ValueError) as exc:
        raise ModelAssetError(
            "Risk thresholds must be numeric."
        ) from exc

    if not 0 <= medium <= 1:
        raise ModelAssetError(
            "The medium-risk threshold must be between 0 and 1."
        )

    if not 0 <= high <= 1:
        raise ModelAssetError(
            "The high-risk threshold must be between 0 and 1."
        )

    if medium >= high:
        raise ModelAssetError(
            "The medium-risk threshold must be lower than "
            "the high-risk threshold."
        )

    return {
        "medium": medium,
        "high": high,
    }


@lru_cache(maxsize=64)
def load_model_assets(
    module: str,
    presentation: str,
    checkpoint_week: int = 12,
) -> dict[str, Any]:
    """
    Load all assets needed to predict student risk.

    Assets are cached so the model is not read from disk for every request.
    """
    try:
        requested_week = int(checkpoint_week)
    except (TypeError, ValueError) as exc:
        raise ModelAssetError(
            "checkpoint_week must be an integer."
        ) from exc

    model_directory, model_source = _resolve_model_directory(
        module=module,
        presentation=presentation,
    )

    selected_week = _select_checkpoint_week(
        requested_week=requested_week,
        model_directory=model_directory,
    )

    model_path = (
        model_directory
        / f"risk_model_week{selected_week}.pkl"
    )
    scaler_path = (
        model_directory
        / f"scaler_week{selected_week}.pkl"
    )
    features_path = (
        model_directory
        / f"features_week{selected_week}.txt"
    )
    thresholds_path = (
        model_directory
        / f"thresholds_week{selected_week}.json"
    )
    metrics_path = (
        model_directory
        / f"metrics_week{selected_week}.json"
    )
    model_info_path = (
        model_directory
        / f"model_info_week{selected_week}.json"
    )

    model = _load_serialized_asset(
        model_path,
        required=True,
    )

    if not hasattr(model, "predict_proba"):
        raise ModelAssetError(
            f"The loaded model does not support predict_proba(): "
            f"{model_path}"
        )

    scaler = _load_serialized_asset(
        scaler_path,
        required=False,
    )

    features = _load_feature_names(features_path)

    raw_thresholds = _load_json_file(
        thresholds_path,
        required=False,
        default=DEFAULT_THRESHOLDS,
    )
    thresholds = _normalize_thresholds(raw_thresholds)

    metrics = _load_json_file(
        metrics_path,
        required=False,
    )
    model_info = _load_json_file(
        model_info_path,
        required=False,
    )

    return {
        "model": model,
        "scaler": scaler,
        "features": features,
        "thresholds": thresholds,
        "metrics": metrics,
        "model_info": model_info,
        "model_source": model_source,
        "model_directory": str(model_directory),
        "requested_week": requested_week,
        "selected_week": selected_week,
        "week_name": f"week{selected_week}",
    }


def clear_model_cache() -> None:
    """
    Clear cached model assets after retraining or replacing model files.
    """
    load_model_assets.cache_clear()
