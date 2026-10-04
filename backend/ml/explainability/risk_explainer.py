def get_risk_label(probability: float, thresholds: dict) -> str:
    high = float(thresholds.get("high", 0.7))
    medium = float(thresholds.get("medium", 0.4))

    if probability >= high:
        return "High"
    if probability >= medium:
        return "Medium"
    return "Low"


def get_top_factors(row: dict) -> list[str]:
    reasons = []

    if float(row.get("assessments_submitted_count", 0) or 0) == 0:
        reasons.append("No assessments submitted")

    if float(row.get("weighted_assessment_score", 0) or 0) < 50:
        reasons.append("Low weighted assessment score")

    if float(row.get("late_submission_rate", 0) or 0) >= 0.3:
        reasons.append("Many late submissions")

    if float(row.get("total_vle_clicks", 0) or 0) < 200:
        reasons.append("Low LMS engagement")

    if float(row.get("engagement_consistency", 0) or 0) < 30:
        reasons.append("Inconsistent engagement")

    if not reasons:
        reasons.append("No strong risk signals")

    return reasons[:3]


def get_recommended_actions(risk_label: str, top_factors: list[str]) -> list[str]:
    actions = []

    if risk_label == "High":
        actions.append("Schedule advisor meeting as soon as possible")
    elif risk_label == "Medium":
        actions.append("Monitor student progress and send support message")
    else:
        actions.append("Continue regular monitoring")

    if "Low LMS engagement" in top_factors:
        actions.append("Encourage student to access weekly learning materials")

    if "Many late submissions" in top_factors:
        actions.append("Discuss time management and assignment planning")

    if "Low weighted assessment score" in top_factors:
        actions.append("Recommend academic tutoring or review sessions")

    return actions