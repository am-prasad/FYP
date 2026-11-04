from fastapi import APIRouter, Request
from typing import Any, Dict, List

router = APIRouter()


@router.get("/questionnaire")
def get_questionnaire(request: Request) -> Dict[str, Any]:
    config_bundle = request.app.state.config_bundle
    questions_cleaned = []
    
    for q in config_bundle.questions:
        q_copy = {
            "id": q["id"],
            "header": q["header"],
            "short": q["short"],
            "type": q["type"],
            "section": q["section"],
            "required": q.get("required", False),
            "scored": q.get("scored", False),
            "sensitive": q.get("sensitive", False),
            "note": q.get("note", "")
        }
        
        # Options without exposing raw scores in the assessment questionnaire payload
        if "options" in q:
            q_copy["options"] = [{"label": opt["label"]} for opt in q["options"]]
            
        questions_cleaned.append(q_copy)

    # Maintain sections order
    sections_order = []
    for q in config_bundle.questions:
        sec = q.get("section")
        if sec and sec not in sections_order:
            sections_order.append(sec)

    return {
        "version": config_bundle.questions_data.get("version", "1.0"),
        "sections": sections_order,
        "questions": questions_cleaned
    }

