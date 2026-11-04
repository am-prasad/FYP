import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.models_db import Submission
from backend.app.core.schemas import PredictRequest, PredictResponse
from backend.app.services.recommend import generate_recommendations

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict_assessment(
    payload: PredictRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    predictor = getattr(request.app.state, "predictor", None)
    if not predictor or not predictor.model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained. Run: python -m backend.ml.train --xlsx data/responses.xlsx"
        )

    try:
        pred_res = predictor.predict(payload.answers)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

    # Generate recommendations
    recs = generate_recommendations(
        predicted_profile_id=pred_res["prediction"]["profile_id"],
        quotients=pred_res["quotients"],
        explanation_top_items=pred_res["explanation"]["top_items"],
        config_bundle=predictor.config_bundle
    )

    submission_id = str(uuid.uuid4())
    demographics = pred_res.get("demographics", {})

    # Save to SQLite table submissions (strict privacy: no text, no sensitive, no identifiers)
    submission = Submission(
        id=submission_id,
        created_at=datetime.now(timezone.utc),
        consent=payload.consent,
        age_group=str(demographics.get("Q1")) if demographics.get("Q1") else None,
        gender=str(demographics.get("Q2")) if demographics.get("Q2") else None,
        grade=str(demographics.get("Q3")) if demographics.get("Q3") else None,
        scored_answers=pred_res["scored_answers"],
        quotient_scores={q: pred_res["quotients"][q]["score"] for q in ("IQ", "EQ", "SQ", "AQ")},
        rule_profile_id=pred_res["rule_profile"]["id"],
        model_profile_id=pred_res["prediction"]["profile_id"],
        model_version=pred_res["model_version"]
    )
    db.add(submission)
    db.commit()

    return PredictResponse(
        submission_id=submission_id,
        model_version=pred_res["model_version"],
        quotients=pred_res["quotients"],
        rule_profile=pred_res["rule_profile"],
        prediction=pred_res["prediction"],
        explanation=pred_res["explanation"],
        recommendations=recs,
        disclaimer=predictor.config_bundle.disclaimer
    )

