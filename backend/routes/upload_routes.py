from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.schemas.upload_schema import UploadResponse
from backend.services.upload_service import (
    run_etl_for_upload,
    save_upload_file,
    save_upload_files,
)


router = APIRouter(
    prefix="/api/uploads",
    tags=["Uploads"],
)


@router.post(
    "/",
    response_model=UploadResponse,
)
async def upload_file(
    file: UploadFile = File(...),
):
    """
    Upload one CSV file and run the ETL pipeline.
    """
    try:
        saved_file = await save_upload_file(file)

        etl_result = run_etl_for_upload(
            cutoff_day=28,
            source="oulad",
        )

        return {
            "upload_status": "completed",
            "files": [saved_file],
            "etl": etl_result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


@router.post(
    "/multiple",
    response_model=UploadResponse,
)
async def upload_files(
    files: list[UploadFile] = File(...),
):
    """
    Upload multiple CSV files and run the ETL pipeline.
    """
    try:
        saved_files = await save_upload_files(files)

        etl_result = run_etl_for_upload(
            cutoff_day=28,
            source="oulad",
        )

        return {
            "upload_status": "completed",
            "files": saved_files,
            "etl": etl_result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
