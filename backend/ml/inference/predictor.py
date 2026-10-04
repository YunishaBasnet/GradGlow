import pandas as pd

from backend.ml.loaders.model_loader import load_model_assets
from backend.ml.explainability.risk_explainer import (
    get_risk_label,
    get_top_factors,
    get_recommended_actions,
)


def predict_student_risk(feature_row: dict, module: str, presentation: str, checkpoint_week: int = 12):
    assets = load_model_assets(module, presentation, checkpoint_week)

    features = assets["features"]

    input_row = {}
    for feature in features:
        input_row[feature] = float(feature_row.get(feature, 0) or 0)

    X = pd.DataFrame([input_row])

    model = assets["model"]
    scaler = assets["scaler"]

    if hasattr(model, "named_steps"):
        probability = float(model.predict_proba(X)[0][1])
    else:
        X_input = scaler.transform(X) if scaler is not None else X
        probability = float(model.predict_proba(X_input)[0][1])

    risk_label = get_risk_label(probability, assets["thresholds"])
    top_factors = get_top_factors(feature_row)
    recommended_actions = get_recommended_actions(risk_label, top_factors)

    return {
        "risk_probability": probability,
        "risk_label": risk_label,
        "top_factors": top_factors,
        "recommended_actions": recommended_actions,
        "model_source": assets["model_source"],
        "model_week": assets["week_name"],
    }