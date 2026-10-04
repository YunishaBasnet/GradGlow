import logging
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.ml.loaders.model_loader import ModelAssetError
from backend.schemas.prediction_schema import (
    PredictionGenerateResponse,
    PredictionStatusResponse,

)

from backend.services.prediction_service import (
    run_predictions_from_canonical_csv,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/predictions",
    tags=["Predictions"],
)


DatabaseSession = Annotated[Session, Depends(get_db)]


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_CANONICAL_FILE = (
    PROJECT_ROOT
    / "generated"
    / "etl_processed"
    / "oulad_canonical_upload_cutoff28.csv"
)

@router.post(
    "/generate",
    response_model=PredictionGenerateResponse,
    summary="Generate student-risk predictions",
    description=(
        "Read the canonical ETL dataset, run the trained machine-learning "
        "model for every student, store risk snapshots in the database, "
        "and return a prediction summary."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Canonical ETL dataset not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid checkpoint week or dataset",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Prediction processing failed",
        },
    },
)
def generate_predictions(
    db: DatabaseSession,

) -> dict:
    checkpoint_week = 4  # Default checkpoint week since it's no longer passed as a parameter
    """
    Generate predictions from the latest canonical ETL dataset.
    """
    if not DEFAULT_CANONICAL_FILE.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Canonical ETL dataset was not found. "
                "Upload and process student data before generating predictions."
            ),
        )

    try:
        result = run_predictions_from_canonical_csv(
            db=db,
            canonical_csv_path=str(DEFAULT_CANONICAL_FILE),
            checkpoint_week=checkpoint_week,
        )

        return {
            "status": result.get("status", "completed"),
            "source_file": DEFAULT_CANONICAL_FILE.name,
            "checkpoint_week": checkpoint_week,
            "rows_processed": result.get("rows_processed", 0),
            "predictions": result.get("predictions", []),
        }

    except ModelAssetError as exc:
        logger.warning(
            "Model assets could not be loaded: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        logger.warning(
            "Prediction input file was not found: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A required prediction file was not found.",
        ) from exc

    except ValueError as exc:
        logger.warning(
            "Invalid prediction input: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        logger.exception(
            "Unexpected error while generating predictions."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Prediction processing failed. "
                "Check the backend logs for more information."
            ),
        ) from exc


@router.get(
    "/status",
    response_model=PredictionStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Check prediction-system status",
)
def prediction_status() -> dict:
    """
    Report whether the canonical dataset is available for prediction.
    """
    canonical_file_exists = DEFAULT_CANONICAL_FILE.is_file()

    return {
        "status": (
            "ready"
            if canonical_file_exists
            else "waiting_for_data"
        ),
        "canonical_dataset_available": canonical_file_exists,
        "canonical_dataset": str(DEFAULT_CANONICAL_FILE),
        "generate_endpoint": "/api/predictions/generate",
        "message": (
            "Prediction system is ready."
            if canonical_file_exists
            else (
                "Canonical ETL dataset is missing. "
                "Upload and process data first."
            )
        ),
    }

