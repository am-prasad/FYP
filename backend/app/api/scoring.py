from fastapi import APIRouter, HTTPException, Request, status
from typing import Any, Dict, List
from backend.app.services.worked_example import generate_worked_example

router = APIRouter()


@router.get("/scoring")
def get_scoring_info(request: Request) -> Dict[str, Any]:
    predictor = getattr(request.app.state, "predictor", None)
    if not predictor or not predictor.model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained. Run: python -m backend.ml.train --xlsx data/responses.xlsx"
        )

    config_bundle = predictor.config_bundle

    # Full question mapping table data
    question_mapping: List[Dict[str, Any]] = []
    for q in config_bundle.questions:
        qid = q["id"]
        is_scored = q.get("scored", False)
        q_type = q.get("type")
        
        # Format scoring rule / answer-to-score text
        if is_scored:
            if q.get("rule"):
                r = q["rule"]
                if r.get("type") == "count_selected":
                    scoring_rule_text = f"Count of intrinsic motivators selected ({', '.join(r.get('count_options', []))}), range 0-2"
                elif r.get("type") == "adaptive_minus_avoidance":
                    scoring_rule_text = (
                        "Number of adaptive strategies selected minus 1 if avoidance selected, clamped to [0, 3]"
                    )
                else:
                    scoring_rule_text = str(r)
            else:
                scoring_rule_text = ", ".join(
                    f"{opt['label']} = {opt.get('score')}" for opt in q.get("options", [])
                )
        else:
            scoring_rule_text = q.get("note", "Not used for scoring.")

        question_mapping.append({
            "id": qid,
            "header": q["header"],
            "short": q["short"],
            "type": q_type,
            "section": q["section"],
            "scored": is_scored,
            "quotient": q.get("quotient"),
            "component": q.get("component"),
            "direction": q.get("direction"),
            "score_min": q.get("score_min"),
            "score_max": q.get("score_max"),
            "scoring_rule": scoring_rule_text,
            "is_reversed": "REVERSED" in (q.get("direction") or "").upper(),
            "note": q.get("note", "")
        })

    # Items per quotient
    items_per_quotient = [
        {"quotient": "IQ", "count": 6, "items": ["Q6", "Q7", "Q8", "Q9", "Q10", "Q13"], "description": "IQ / CQ (cognitive and study ability)"},
        {"quotient": "EQ", "count": 5, "items": ["Q17", "Q18", "Q20", "Q26", "Q35"], "description": "EQ (emotional regulation and expression)"},
        {"quotient": "SQ", "count": 9, "items": ["Q5", "Q14", "Q15", "Q22", "Q23", "Q27", "Q28", "Q30", "Q31"], "description": "SQ (social and interpersonal support)"},
        {"quotient": "AQ", "count": 4, "items": ["Q12", "Q19", "Q36", "Q37"], "description": "AQ (adversity and resilience)"}
    ]

    # Formulas & constants
    formulas = {
        "item_normalization": {
            "name": "Item Normalization",
            "formula": "item_norm = (raw_value - score_min) / (score_max - score_min)",
            "range": "[0, 1]"
        },
        "quotient_score": {
            "name": "Quotient Score",
            "formula": "quotient_score = mean(item_norm_in_quotient) * 100",
            "range": "[0, 100]",
            "note": "Averaging normalised item scores keeps quotients directly comparable despite differing question counts."
        },
        "z_score": {
            "name": "Standardized z-score",
            "formula": "z = (quotient_score - norm_mean) / norm_sd",
            "note": "Population standard deviation (ddof=0) frozen from the reference sample."
        },
        "level_classification": {
            "name": "Level Classification",
            "thresholds": {
                "Low (L)": f"z <= {config_bundle.z_low}",
                "Average (Avg)": f"{config_bundle.z_low} < z < {config_bundle.z_high}",
                "High (H)": f"z >= {config_bundle.z_high}"
            }
        },
        "prototype_matching": {
            "name": "Nearest Prototype Rule",
            "formula": "distance = sqrt(sum((clip(z_q) - prototype_q)^2))",
            "clip": config_bundle.clip,
            "label_margin": config_bundle.label_margin,
            "tie_breaking": "Lowest profile ID",
            "borderline_rule": f"Flagged borderline if (second_nearest - nearest) < {config_bundle.label_margin}"
        }
    }

    # Worked example
    worked_example = generate_worked_example(config_bundle, predictor.norms)

    # Limitations
    limitations = [
        "Self-reported answers: Results reflect student self-assessment rather than observed performance.",
        "IQ / CQ proxy: The cognitive and study quotient is an academic self-regulation proxy, not a formal psychometric clinical IQ assessment.",
        "AQ item count: The adversity quotient is measured by 4 items, providing an indicative baseline that benefits from contextual follow-up.",
        "Content judgement mapping: Question assignments and weights reflect expert curricular judgement and should undergo continuous empirical review.",
        "Norm relativity: Scores and profiles are evaluated relative to the reference sample distribution rather than an absolute population norm."
    ]

    return {
        "overview_steps": [
            {"step": 1, "title": "Encode Text Answers", "description": "Google Form text responses are mapped to calibrated ordinal numbers or rule values."},
            {"step": 2, "title": "Normalize Items", "description": "Each item score is scaled to [0, 1] using its specific minimum and maximum score boundaries."},
            {"step": 3, "title": "Calculate Quotients", "description": "Items in each quotient are averaged and scaled to 0-100, ensuring equal comparability."},
            {"step": 4, "title": "Standardize to Reference Norms", "description": "Quotient scores are standardized into z-scores and categorized into High, Average, or Low."},
            {"step": 5, "title": "Nearest Prototype Assignment", "description": "Euclidean distance to seven 4-dimensional prototype vectors determines the rule profile."},
            {"step": 6, "title": "Deep Learning TabNet Reproduction", "description": "TabNet processes the 24 item features to produce predictive classification and local attention masks."}
        ],
        "items_per_quotient": items_per_quotient,
        "question_mapping": question_mapping,
        "formulas": formulas,
        "norms": predictor.norms,
        "prototypes": config_bundle.profiles,
        "worked_example": worked_example,
        "limitations": limitations
    }

