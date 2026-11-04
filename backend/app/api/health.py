from fastapi import APIRouter, Request
from backend.app.core.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health(request: Request):
    predictor = getattr(request.app.state, "predictor", None)
    if predictor and predictor.model_loaded:
        return HealthResponse(
            status="ok",
            model_loaded=True,
            model_version=predictor.meta.get("model_version")
        )
    return HealthResponse(
        status="ok",
        model_loaded=False,
        model_version=None
    )

