import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request, status
from typing import Any, Dict

from backend.app.services.warnings import generate_warnings

router = APIRouter()


@router.get("/model-info")
def get_model_info(request: Request) -> Dict[str, Any]:
    predictor = getattr(request.app.state, "predictor", None)
    if not predictor or not predictor.model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained. Run: python -m backend.ml.train --xlsx data/responses.xlsx"
        )

    artifacts_dir = predictor.artifacts_dir
    files = {
        "meta": artifacts_dir / "meta.json",
        "data_report": artifacts_dir / "data_report.json",
        "distributions": artifacts_dir / "distributions.json",
        "metrics": artifacts_dir / "metrics.json",
        "feature_importance": artifacts_dir / "feature_importance.json"
    }

    loaded_data = {}
    for key, path in files.items():
        if not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Artifact {key}.json missing. Please retrain model."
            )
        with open(path, "r", encoding="utf-8") as f:
            loaded_data[key] = json.load(f)

    # Generate honest warnings
    warnings_list = generate_warnings(
        meta=loaded_data["meta"],
        data_report=loaded_data["data_report"],
        distributions=loaded_data["distributions"],
        metrics=loaded_data["metrics"]
    )

    return {
        "meta": loaded_data["meta"],
        "data_report": loaded_data["data_report"],
        "distributions": loaded_data["distributions"],
        "metrics": loaded_data["metrics"],
        "feature_importance": loaded_data["feature_importance"],
        "hyperparameters": loaded_data["meta"].get("hyperparameters", {}),
        "warnings": warnings_list
    }

