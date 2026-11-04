from typing import Any, Dict, List


def generate_warnings(
    meta: Dict[str, Any],
    data_report: Dict[str, Any],
    distributions: Dict[str, Any],
    metrics: Dict[str, Any]
) -> List[str]:
    """Generates the permanent and conditional honest warnings required by Section 8.7."""
    warnings: List[str] = [
        "Labels come from a scoring rule applied to the same answers, so accuracy shows how well TabNet reproduces the rule, not an independent clinical truth.",
        "Class imbalance is not handled by design; per-class metrics show the effect.",
        "Profiles are relative to the reference sample used for the norms."
    ]

    # Conditional: is_demo
    if meta.get("is_demo") or data_report.get("is_demo"):
        warnings.append("This model was trained on synthetic demo data, not real responses.")

    # Conditional: rows_used < 300
    rows_used = data_report.get("rows_used", 0)
    if rows_used < 300:
        warnings.append(f"Small dataset ({rows_used} rows used): results are indicative only.")

    # Conditional: test set smaller than 30
    split_info = distributions.get("split", {})
    test_size = split_info.get("test_size", 0)
    if test_size < 30:
        warnings.append(f"Test set has only {test_size} students (smaller than recommended threshold of 30).")

    # Conditional: unstratified split
    if split_info.get("stratified") is False:
        warnings.append("Split was unstratified due to low per-class sample counts.")

    # Conditional: classes with 0 or < 5 students
    profiles_dist = distributions.get("profiles", [])
    for p in profiles_dist:
        name = p.get("name", f"Profile {p.get('profile_id')}")
        count = p.get("count", 0)
        if count == 0:
            warnings.append(f"{name} has zero students in the dataset.")
        elif count < 5:
            warnings.append(f"{name} has only {count} students.")

    return warnings

