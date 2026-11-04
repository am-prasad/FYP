from typing import Any, Dict, List
from backend.ml.config_loader import ConfigBundle, FEATURE_ORDER
from backend.ml.encode import encode_single_answer
from backend.ml.scoring import normalize_item_score, compute_quotient_scores, compute_z_and_levels
from backend.ml.labelling import assign_profile_label


SAMPLE_ANSWERS = {
    "Q5": "Alone",
    "Q6": "Frequently",
    "Q7": "2-3 hours",
    "Q8": "Smartphone Apps",
    "Q9": "Rarely",
    "Q10": ["Desire to learn", "Future goals"],
    "Q12": "Try harder next time",
    "Q13": "Good (B's)",
    "Q14": "Sometimes",
    "Q15": "Yes",
    "Q17": "Sometimes",
    "Q18": "Moderate",
    "Q19": "Confident",
    "Q20": "Often",
    "Q22": "Yes",
    "Q23": "Friendly but not close",
    "Q26": "Sometimes",
    "Q27": "Somewhat supportive",
    "Q28": "Rarely",
    "Q30": "No",
    "Q31": "Yes",
    "Q35": "Somewhat comfortable",
    "Q36": [
        "Talking to Someone (e.g., friends, family, counselor)",
        "Relaxation Techniques (e.g., deep breathing, meditation)"
    ],
    "Q37": "Resilient"
}


def generate_worked_example(
    config_bundle: ConfigBundle,
    norms: Dict[str, Dict[str, float]]
) -> Dict[str, Any]:
    """Generates worked example step-by-step using actual scoring logic."""
    scored_questions = {q["id"]: q for q in config_bundle.scored_questions}

    items_detail = []
    item_norms = {}

    for qid in FEATURE_ORDER:
        q_def = scored_questions[qid]
        raw_val = SAMPLE_ANSWERS.get(qid)
        raw_score, label, _ = encode_single_answer(q_def, raw_val)
        
        s_min = float(q_def["score_min"])
        s_max = float(q_def["score_max"])
        norm_val = normalize_item_score(raw_score, s_min, s_max)
        item_norms[qid] = norm_val

        items_detail.append({
            "question_id": qid,
            "short": q_def["short"],
            "quotient": q_def["quotient"],
            "component": q_def["component"],
            "answer": label or str(raw_val),
            "raw_value": raw_score,
            "score_min": s_min,
            "score_max": s_max,
            "normalised_value": round(norm_val, 4)
        })

    # Quotients
    q_res = compute_quotient_scores(item_norms)
    quotient_scores = {q: q_res[q]["score"] for q in ("IQ", "EQ", "SQ", "AQ")}

    # z-scores and levels
    z_res = compute_z_and_levels(
        quotient_scores=quotient_scores,
        norms=norms,
        z_low=config_bundle.z_low,
        z_high=config_bundle.z_high
    )

    # Prototype distances
    z_dict = {q: z_res[q]["z"] for q in ("IQ", "EQ", "SQ", "AQ")}
    label_res = assign_profile_label(z_dict, config_bundle)

    prototype_distances = []
    for p in config_bundle.profiles:
        pid = p["id"]
        prototype_distances.append({
            "profile_id": pid,
            "name": p["name"],
            "prototype": p["prototype"],
            "distance": label_res["all_distances"].get(pid, 0.0),
            "is_assigned": (pid == label_res["id"])
        })

    return {
        "items": items_detail,
        "quotients": z_res,
        "prototypes": prototype_distances,
        "assigned_profile": {
            "id": label_res["id"],
            "name": label_res["name"],
            "distance": label_res["distance"],
            "distance_gap": label_res["distance_gap"],
            "borderline": label_res["borderline"]
        }
    }

