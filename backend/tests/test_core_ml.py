import sys
from pathlib import Path
import unittest

_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import numpy as np
import pandas as pd

from backend.ml.config_loader import load_and_validate_configs, FEATURE_ORDER
from backend.ml.encode import norm, encode_single_answer, match_headers, encode_dataset
from backend.ml.scoring import normalize_item_score, compute_quotient_scores, compute_dataset_norms, compute_z_and_levels
from backend.ml.labelling import assign_profile_label


class TestCoreMLEncoding(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_bundle = load_and_validate_configs()
        cls.questions_by_id = {q["id"]: q for q in cls.config_bundle.questions}

    def test_norm_function(self):
        # Curly quotes, dashes, whitespace, trailing punctuation
        raw = "  “How’re you feeling—today?”: *  "
        expected = '"how\'re you feeling-today?"'
        self.assertEqual(norm(raw), expected)

    def test_every_scored_option_maps_to_configured_score(self):
        # Every option label of every scored single question must map to its configured score
        for q in self.config_bundle.scored_questions:
            if q["type"] == "single":
                for opt in q["options"]:
                    score, matched_label, is_unmatched = encode_single_answer(q, opt["label"])
                    self.assertFalse(is_unmatched, f"Option '{opt['label']}' in {q['id']} was unmatched")
                    self.assertEqual(score, float(opt["score"]), f"Score mismatch for {q['id']} '{opt['label']}'")
                    self.assertEqual(matched_label, opt["label"])

    def test_curly_quotes_and_dashes_in_options(self):
        # Q13 has "Excellent (A's)"
        q13 = self.questions_by_id["Q13"]
        curly_label = "Excellent (A’s)"
        score, label, is_unmatched = encode_single_answer(q13, curly_label)
        self.assertFalse(is_unmatched)
        self.assertEqual(score, 4.0)

    def test_longest_match_containment(self):
        # Q35 options: "Very comfortable" (4), "Somewhat comfortable" (3), "Not very comfortable" (2), "Uncomfortable" (1)
        # "Not very comfortable" should NEVER match "Very comfortable"
        q35 = self.questions_by_id["Q35"]
        score, label, is_unmatched = encode_single_answer(q35, "I am Not very comfortable with that")
        self.assertFalse(is_unmatched)
        self.assertEqual(score, 2.0)
        self.assertEqual(label, "Not very comfortable")

    def test_q8_other_fallback(self):
        # Q8: a non-empty cell that matches nothing counts as "Other" (score 2)
        q8 = self.questions_by_id["Q8"]
        score, label, is_unmatched = encode_single_answer(q8, "Sticky notes on my monitor")
        self.assertFalse(is_unmatched)
        self.assertEqual(score, 2.0)
        self.assertEqual(label, "Other")

    def test_multi_select_with_commas_in_labels(self):
        # Q36 options have commas inside option labels:
        # "Talking to Someone (e.g., friends, family, counselor)"
        # "Relaxation Techniques (e.g., deep breathing, meditation)"
        q36 = self.questions_by_id["Q36"]
        cell_val = (
            "Talking to Someone (e.g., friends, family, counselor), "
            "Relaxation Techniques (e.g., deep breathing, meditation)"
        )
        score, label, is_unmatched = encode_single_answer(q36, cell_val)
        self.assertFalse(is_unmatched)
        # 2 adaptive, 0 avoid => score = 2.0
        self.assertEqual(score, 2.0)

    def test_q10_count_selected_rule(self):
        # Q10 counts intrinsic motivators: "Desire to learn", "Future goals" (0 to 2)
        q10 = self.questions_by_id["Q10"]
        
        # Both intrinsic selected
        score, _, _ = encode_single_answer(q10, "Desire to learn, Grades, Future goals")
        self.assertEqual(score, 2.0)
        
        # One intrinsic selected
        score, _, _ = encode_single_answer(q10, "Grades, Future goals, Peer influence")
        self.assertEqual(score, 1.0)
        
        # Zero intrinsic selected
        score, _, _ = encode_single_answer(q10, "Grades, Parental expectations")
        self.assertEqual(score, 0.0)

    def test_q36_adaptive_minus_avoidance_rule(self):
        q36 = self.questions_by_id["Q36"]
        
        # 3 adaptive, 1 avoid => 3 - 1 = 2
        all_cell = (
            "Talking to Someone (e.g., friends, family, counselor), "
            "Relaxation Techniques (e.g., deep breathing, meditation), "
            "Creative Outlets through Hobbies (e.g., drawing, writing, playing music), "
            "Avoidance or Distraction (e.g., ignoring the problem, procrastinating)"
        )
        score, _, _ = encode_single_answer(q36, all_cell)
        self.assertEqual(score, 2.0)

        # 0 adaptive, 1 avoid => 0 - 1 = -1 -> clamped to 0
        avoid_only = "Avoidance or Distraction (e.g., ignoring the problem, procrastinating)"
        score, _, _ = encode_single_answer(q36, avoid_only)
        self.assertEqual(score, 0.0)


class TestCoreMLScoring(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_bundle = load_and_validate_configs()

    def test_item_normalization_bounds(self):
        # Normalization must stay within [0, 1]
        self.assertEqual(normalize_item_score(1, 1, 5), 0.0)
        self.assertEqual(normalize_item_score(5, 1, 5), 1.0)
        self.assertEqual(normalize_item_score(3, 1, 5), 0.5)
        # Clamp testing
        self.assertEqual(normalize_item_score(0, 1, 5), 0.0)
        self.assertEqual(normalize_item_score(6, 1, 5), 1.0)

    def test_quotient_score_from_known_inputs(self):
        # All items 0.5 => all quotient scores 50.0
        item_norms = {qid: 0.5 for qid in FEATURE_ORDER}
        q_scores = compute_quotient_scores(item_norms)
        for q in ("IQ", "EQ", "SQ", "AQ"):
            self.assertEqual(q_scores[q]["score"], 50.0)

    def test_z_scores_and_level_cutoffs(self):
        norms = {
            "IQ": {"mean": 50.0, "sd": 10.0},
            "EQ": {"mean": 50.0, "sd": 10.0},
            "SQ": {"mean": 50.0, "sd": 10.0},
            "AQ": {"mean": 50.0, "sd": 10.0}
        }
        # z = -0.5 is L, z = +0.5 is H, between is Avg
        res = compute_z_and_levels({"IQ": 45.0, "EQ": 55.0, "SQ": 50.0, "AQ": 40.0}, norms, z_low=-0.5, z_high=0.5)
        self.assertEqual(res["IQ"]["z"], -0.5)
        self.assertEqual(res["IQ"]["level"], "L")
        self.assertEqual(res["EQ"]["z"], 0.5)
        self.assertEqual(res["EQ"]["level"], "H")
        self.assertEqual(res["SQ"]["z"], 0.0)
        self.assertEqual(res["SQ"]["level"], "Avg")
        self.assertEqual(res["AQ"]["z"], -1.0)
        self.assertEqual(res["AQ"]["level"], "L")


class TestCoreMLLabelling(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_bundle = load_and_validate_configs()

    def test_each_prototype_maps_to_its_own_profile(self):
        for profile in self.config_bundle.profiles:
            proto_z = {q: float(profile["prototype"][q]) for q in ("IQ", "EQ", "SQ", "AQ")}
            res = assign_profile_label(proto_z, self.config_bundle)
            self.assertEqual(res["id"], profile["id"], f"Prototype for {profile['name']} did not map to itself")
            self.assertEqual(res["distance"], 0.0)

    def test_tie_breaking_to_lowest_profile_id(self):
        # Point (1.0, -0.5, -0.5, 0.0) has squared distance 1.5 to P2, P3, and P6.
        # Ties must go to lowest ID: Profile 2
        tied_z = {"IQ": 1.0, "EQ": -0.5, "SQ": -0.5, "AQ": 0.0}
        res = assign_profile_label(tied_z, self.config_bundle)
        self.assertEqual(res["id"], 2)

    def test_borderline_flag(self):
        # Tied point produces distance gap 0.0 < 0.25, so borderline must be True
        tied_z = {"IQ": 1.0, "EQ": -0.5, "SQ": -0.5, "AQ": 0.0}
        res = assign_profile_label(tied_z, self.config_bundle)
        self.assertTrue(res["borderline"])
        self.assertLess(res["distance_gap"], self.config_bundle.label_margin)


if __name__ == "__main__":
    unittest.main()
