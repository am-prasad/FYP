import sys
from pathlib import Path

# Ensure project root and backend dir are in sys.path regardless of launch cwd
_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import CORS_ORIGINS
from backend.app.core.db import engine, Base
from backend.ml.config_loader import load_and_validate_configs
from backend.ml.predict import ModelPredictor

from backend.app.api.health import router as health_router
from backend.app.api.questionnaire import router as questionnaire_router
from backend.app.api.predict import router as predict_router
from backend.app.api.scoring import router as scoring_router
from backend.app.api.model_info import router as model_info_router
from backend.app.api.profiles import router as profiles_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Psychometric Profiling API",
    description="FastAPI service for scoring questionnaires, running TabNet classification, explaining results, and providing personalised growth actions.",
    version="1.0.0",
    lifespan=lifespan
)

# Ensure database tables and ML state are initialized immediately
Base.metadata.create_all(bind=engine)
app.state.config_bundle = load_and_validate_configs()
app.state.predictor = ModelPredictor()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(questionnaire_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(scoring_router, prefix="/api")
app.include_router(model_info_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Psychometric Profiling API is running. Access docs at /docs"}
