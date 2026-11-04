from typing import Any, Dict, List, Optional
from backend.ml.config_loader import ConfigBundle


def generate_recommendations(
    predicted_profile_id: int,
    quotients: Dict[str, Dict[str, Any]],
    explanation_top_items: List[Dict[str, Any]],
    config_bundle: ConfigBundle
) -> Dict[str, Any]:
    """Generates deterministic, personalized recommendations according to Section 8."""
    profile_def = config_bundle.profiles_by_id[predicted_profile_id]
    next_target_id = profile_def.get("next_target")

    # 1. Profile 1 (next_target is None): All-Round Thriver
    if next_target_id is None:
        return {
            "target_profile": None,
            "focus": [],
            "maintain": config_bundle.maintain,
            "support_note": None,
            "disclaimer": config_bundle.disclaimer
        }

    target_profile_def = config_bundle.profiles_by_id[next_target_id]
    target_proto = target_profile_def["prototype"]

    # 2. Compute gaps: gap_q = prototype[target][q] - clip(z_q)
    # Clip z to [-clip, +clip] (clip = 2.0)
    clip_val = config_bundle.clip
    candidate_quotients = []

    for q in ("IQ", "EQ", "SQ", "AQ"):
        student_level = quotients[q]["level"]
        raw_z = float(quotients[q]["z"])
        clipped_z = max(-clip_val, min(clip_val, raw_z))
        target_z = float(target_proto.get(q, 0.0))
        gap = round(target_z - clipped_z, 4)

        # Quotients where student's level is 'H' are skipped even if the gap qualifies
        if student_level != "H" and gap >= 0.5:
            candidate_quotients.append({
                "quotient": q,
                "gap": gap,
                "z": raw_z,
                "level": student_level
            })

    # Sort by gap descending, at most 3
    candidate_quotients.sort(key=lambda x: x["gap"], reverse=True)
    focus_quotients = candidate_quotients[:3]

    # If none qualifies, use single quotient with lowest z (provided level is not H)
    if not focus_quotients:
        eligible = [
            {"quotient": q, "gap": 0.0, "z": float(quotients[q]["z"]), "level": quotients[q]["level"]}
            for q in ("IQ", "EQ", "SQ", "AQ")
            if quotients[q]["level"] != "H"
        ]
        if not eligible:
            eligible = [
                {"quotient": q, "gap": 0.0, "z": float(quotients[q]["z"]), "level": quotients[q]["level"]}
                for q in ("IQ", "EQ", "SQ", "AQ")
            ]
        eligible.sort(key=lambda x: x["z"])
        focus_quotients = [eligible[0]]

    # 3. Identify weak components of the student
    # Weak components are component tags of items with item_norm <= 0.5 or that appear in top-5 TabNet items
    weak_components: Dict[str, set] = {"IQ": set(), "EQ": set(), "SQ": set(), "AQ": set()}
    for item in explanation_top_items:
        comp = item.get("component")
        q = item.get("quotient")
        if comp and q in weak_components:
            weak_components[q].add(comp)

    # 4. Select actions per focus quotient
    # 3 actions for quotient with largest gap, 2 for others
    # Rank by: (a) number of components matching weak components, (b) library order
    chosen_action_ids = set()
    focus_blocks = []

    for idx, f_q in enumerate(focus_quotients):
        q_name = f_q["quotient"]
        q_level = f_q["level"]
        num_actions = 3 if idx == 0 else 2

        library_actions = config_bundle.actions.get(q_name, [])
        # Filter by student level matching action levels and not already chosen
        eligible_actions = [
            act for act in library_actions
            if q_level in act.get("levels", []) and act["id"] not in chosen_action_ids
        ]

        def action_rank(act, pos):
            comps = act.get("components", [])
            match_count = sum(1 for c in comps if c in weak_components[q_name])
            # Higher match count first, then lower pos (library order)
            return (-match_count, pos)

        ranked = sorted(enumerate(eligible_actions), key=lambda x: action_rank(x[1], x[0]))
        selected_for_quot = [act for _, act in ranked[:num_actions]]

        for act in selected_for_quot:
            chosen_action_ids.add(act["id"])

        focus_blocks.append({
            "quotient": q_name,
            "level": q_level,
            "gap": f_q["gap"],
            "actions": [
                {
                    "id": act["id"],
                    "title": act["title"],
                    "detail": act["detail"]
                }
                for act in selected_for_quot
            ]
        })

    # 5. Support note: when profile is 7 or when both EQ and AQ levels are L
    is_profile_7 = (predicted_profile_id == 7)
    both_eq_aq_low = (quotients["EQ"]["level"] == "L" and quotients["AQ"]["level"] == "L")
    support_note = config_bundle.support_note if (is_profile_7 or both_eq_aq_low) else None

    return {
        "target_profile": {
            "id": target_profile_def["id"],
            "name": target_profile_def["name"]
        },
        "focus": focus_blocks,
        "maintain": None,
        "support_note": support_note,
        "disclaimer": config_bundle.disclaimer
    }

