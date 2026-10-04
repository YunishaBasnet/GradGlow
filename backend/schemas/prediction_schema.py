from pydantic import BaseModel, ConfigDict, Field


class PredictionResult(BaseModel):
    """One student-risk prediction returned by the ML pipeline."""

    model_config = ConfigDict(protected_namespaces=())

    student_id: str
    course_key: str
    checkpoint_week: int

    risk_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
    )

    risk_label: str

    top_factors: list[str]
    recommended_actions: list[str]

    model_source: str
    model_week: str


class PredictionGenerateResponse(BaseModel):
    """Response returned after generating predictions."""

    status: str
    source_file: str
    checkpoint_week: int
    rows_processed: int

    # prediction_service currently returns only a sample of predictions
    predictions: list[PredictionResult]


class PredictionStatusResponse(BaseModel):
    """Current readiness of the prediction pipeline."""

    status: str
    canonical_dataset_available: bool
    canonical_dataset: str
    generate_endpoint: str
    message: str