from pathlib import Path

from fastapi import UploadFile

from backend.etl.run_etl import run_etl


# =========================================================
# PATHS / CONFIGURATION
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

UPLOAD_DIR = PROJECT_ROOT / "uploads"

PROCESSED_DIR = (
    PROJECT_ROOT
    / "generated"
    / "etl_processed"
)

ALLOWED_EXTENSIONS = {".csv"}

# Maximum size allowed for ONE uploaded CSV file.
# studentVle.csv is ~433 MB, so 500 MB gives us enough room.
MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024

# Read/write uploads 1 MB at a time instead of loading
# the entire file into memory.
UPLOAD_CHUNK_SIZE = 1024 * 1024


# =========================================================
# EXCEPTIONS
# =========================================================

class UploadValidationError(ValueError):
    """Raised when an uploaded file is invalid."""
    pass


# =========================================================
# FILENAME VALIDATION
# =========================================================

def _get_safe_filename(
    filename: str | None,
) -> str:
    """
    Validate an uploaded filename and remove directory
    components so files cannot escape the upload directory.
    """

    if not filename:
        raise UploadValidationError(
            "Uploaded file has no filename."
        )

    safe_filename = (
        Path(filename)
        .name
        .replace(" ", "_")
    )

    if not safe_filename:
        raise UploadValidationError(
            "Uploaded filename is invalid."
        )

    extension = (
        Path(safe_filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:
        raise UploadValidationError(
            "Only CSV files are supported."
        )

    return safe_filename


# =========================================================
# SAVE ONE FILE
# =========================================================

async def save_upload_file(
    file: UploadFile,
) -> dict[str, str | int | None]:
    """
    Validate and save one uploaded CSV.

    The file is streamed to disk in chunks so large datasets
    such as studentVle.csv are not loaded completely into RAM.
    """

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_filename = _get_safe_filename(
        file.filename
    )

    file_path = (
        UPLOAD_DIR
        / safe_filename
    )

    total_size = 0

    try:

        with file_path.open("wb") as destination:

            while True:

                chunk = await file.read(
                    UPLOAD_CHUNK_SIZE
                )

                if not chunk:
                    break

                total_size += len(chunk)

                # -----------------------------------------
                # SIZE VALIDATION
                # -----------------------------------------

                if (
                    total_size
                    > MAX_UPLOAD_SIZE_BYTES
                ):
                    raise UploadValidationError(
                        f"The uploaded file "
                        f"'{safe_filename}' exceeds "
                        "the 500 MB size limit."
                    )

                destination.write(chunk)

    except Exception:

        # Remove incomplete files if upload fails.
        file_path.unlink(
            missing_ok=True
        )

        raise

    finally:

        await file.close()

    # ---------------------------------------------
    # EMPTY FILE VALIDATION
    # ---------------------------------------------

    if total_size == 0:

        file_path.unlink(
            missing_ok=True
        )

        raise UploadValidationError(
            f"The uploaded file "
            f"'{safe_filename}' is empty."
        )

    return {
        "filename": safe_filename,
        "file_path": str(file_path),
        "content_type": file.content_type,
        "size_bytes": total_size,
    }


# =========================================================
# SAVE MULTIPLE FILES
# =========================================================

async def save_upload_files(
    files: list[UploadFile],
) -> list[dict[str, str | int | None]]:
    """
    Validate and save multiple uploaded CSV files.
    """

    if not files:
        raise UploadValidationError(
            "At least one file must be uploaded."
        )

    saved_files = []

    for file in files:

        saved_file = await save_upload_file(
            file
        )

        saved_files.append(
            saved_file
        )

    return saved_files


# =========================================================
# RUN ETL
# =========================================================

def run_etl_for_upload(
    cutoff_day: int = 28,
    source: str = "oulad",
) -> dict[str, str | int]:
    """
    Run the ETL pipeline using CSV files stored in the
    project upload directory.
    """

    # ---------------------------------------------
    # CHECK UPLOAD DIRECTORY
    # ---------------------------------------------

    if not UPLOAD_DIR.exists():

        raise FileNotFoundError(
            "Upload directory does not exist."
        )

    uploaded_csv_files = list(
        UPLOAD_DIR.glob("*.csv")
    )

    if not uploaded_csv_files:

        raise FileNotFoundError(
            "No uploaded CSV files were found."
        )

    # ---------------------------------------------
    # CREATE OUTPUT DIRECTORY
    # ---------------------------------------------

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ---------------------------------------------
    # RUN ETL PIPELINE
    # ---------------------------------------------

    run_etl(
        data_dir=str(UPLOAD_DIR),
        out_dir=str(PROCESSED_DIR),
        cutoff_day=cutoff_day,
        source=source,
    )

    # ---------------------------------------------
    # EXPECTED CANONICAL OUTPUT
    # ---------------------------------------------

    canonical_file = (
        PROCESSED_DIR
        / (
            f"{source}_canonical_upload_"
            f"cutoff{cutoff_day}.csv"
        )
    )

    if not canonical_file.is_file():

        raise FileNotFoundError(
            "ETL completed but the expected "
            "canonical dataset was not created: "
            f"{canonical_file}"
        )

    # ---------------------------------------------
    # SUCCESS
    # ---------------------------------------------

    return {
        "status": "completed",
        "processed_dir": str(
            PROCESSED_DIR
        ),
        "canonical_upload_file": str(
            canonical_file
        ),
        "uploaded_file_count": len(
            uploaded_csv_files
        ),
        "cutoff_day": cutoff_day,
    }