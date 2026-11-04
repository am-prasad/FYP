from fastapi import APIRouter, Request
from typing import Any, Dict, List

router = APIRouter()


@router.get("/profiles")
def get_profiles(request: Request) -> List[Dict[str, Any]]:
    config_bundle = request.app.state.config_bundle
    return config_bundle.profiles

