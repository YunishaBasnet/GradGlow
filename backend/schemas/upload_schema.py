from pydantic import BaseModel, Field


class UploadedFileResponse(BaseModel):
    """Metadata for one successfully uploaded CSV file."""

    filename: str
    file_path: str
    content_type: str | None = None
    size_bytes: int = Field(..., ge=0)


class ETLResultResponse(BaseModel):
    """Result of ETL processing after an upload."""

    status: str
    processed_dir: str
    canonical_upload_file: str
    uploaded_file_count: int = Field(..., ge=1)
    cutoff_day: int = Field(..., ge=1)


class UploadResponse(BaseModel):
    """Response returned after upload and ETL processing."""

    upload_status: str
    files: list[UploadedFileResponse]
    etl: ETLResultResponse
