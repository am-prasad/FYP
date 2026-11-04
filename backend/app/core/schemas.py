from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    consent: bool
    answers: Dict[str, Any]

    @field_validator("consent")
    @classmethod
    def check_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Informed consent is required to take the assessment.")
        return v


class QuotientDetail(BaseModel):
    score: float
    z: float
    level: str
    norm_mean: float
    norm_sd: float
    items_used: int


class ProfileSummary(BaseModel):
    id: int
    name: str
    borderline: Optional[bool] = None


class ProfileProbability(BaseModel):
    id: int
    name: str
    p: float


class RunnerUp(BaseModel):
    id: int
    name: str
    p: float


class PredictionDetail(BaseModel):
    profile_id: int
    name: str
    subtitle: str
    probability: float
    probabilities: List[ProfileProbability]
    borderline: bool
    runner_up: RunnerUp


class TopItemExplanation(BaseModel):
    question_id: str
    short: str
    quotient: str
    component: str
    answer: str
    item_score: float
    importance: float


class ExplanationDetail(BaseModel):
    top_items: List[TopItemExplanation]
    quotient_importance: Dict[str, float]


class ActionDetail(BaseModel):
    id: str
    title: str
    detail: str


class FocusBlock(BaseModel):
    quotient: str
    level: str
    gap: float
    actions: List[ActionDetail]


class TargetProfile(BaseModel):
    id: int
    name: str


class RecommendationsDetail(BaseModel):
    target_profile: Optional[TargetProfile] = None
    focus: List[FocusBlock] = []
    maintain: Optional[List[Dict[str, Any]]] = None
    support_note: Optional[str] = None
    disclaimer: str


class PredictResponse(BaseModel):
    submission_id: str
    model_version: str
    quotients: Dict[str, QuotientDetail]
    rule_profile: ProfileSummary
    prediction: PredictionDetail
    explanation: ExplanationDetail
    recommendations: RecommendationsDetail
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str] = None

