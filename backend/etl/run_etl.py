import os
from backend.etl.extract import extract_and_clean_flexible
from backend.etl.transform_engagement import build_engagement_features
from backend.etl.transform_assessment import build_assessment_features
from backend.etl.build_canonical import build_canonical
import logging
logging.basicConfig(level=logging.INFO)

def run_etl(data_dir="dataset/raw", out_dir="dataset/processed", cutoff_day=28, source="oulad"):
    os.makedirs(out_dir, exist_ok=True)

    d = extract_and_clean_flexible(data_dir, source=source)

    eng = build_engagement_features(d["studentVle"], cutoff_day)
    ass = build_assessment_features(d["studentAssessment"], d["assessments"], cutoff_day)

    print("Train Dataset:")
    train = build_canonical(d["studentInfo"], eng, ass, include_target=True, verbose=True)

    print("Upload Dataset:")
    upload = build_canonical(d["studentInfo"], eng, ass, include_target=False, verbose=True)

    train_path = os.path.join(out_dir, f"{source}_canonical_train_cutoff{cutoff_day}.csv")
    upload_path = os.path.join(out_dir, f"{source}_canonical_upload_cutoff{cutoff_day}.csv")

    train.to_csv(train_path, index=False)
    upload.to_csv(upload_path, index=False)

    print("Saved:")
    print(" Train -", train_path, train.shape)
    print(" Upload -", upload_path, upload.shape)

if __name__ == "__main__":
    run_etl(source="oulad")
    