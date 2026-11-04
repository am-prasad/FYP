import sys
from pathlib import Path
import unittest

_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from types import SimpleNamespace
from fastapi import HTTPException

from backend.app.main import app
from backend.app.core.db import SessionLocal
from backend.app.core.schemas import PredictRequest
from backend.app.api.health import get_health
from backend.app.api.questionnaire import get_questionnaire
from backend.app.api.predict import predict_assessment
from backend.app.api.scoring import get_scoring_info
from backend.app.api.model_info import get_model_info
from backend.app.api.profiles import get_profiles
from backend.app.services.worked_example import SAMPLE_ANSWERS
from backend.app.services.recommend import generate_recommendations
from backend.ml.config_loader import load_and_validate_configs


class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_bundle = load_and_validate_configs()
        cls.mock_request = SimpleNamespace(app=app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_health_endpoint(self):
        data = get_health(self.mock_request)
        self.assertEqual(data.status, "ok")
        self.assertTrue(data.model_loaded)
        self.assertIsNotNone(data.model_version)

    def test_questionnaire_endpoint(self):
        data = get_questionnaire(self.mock_request)
        self.assertIn("questions", data)
        self.assertEqual(len(data["questions"]), 38)
        # Verify scores are NOT leaked in questionnaire options
        for q in data["questions"]:
            if "options" in q:
                for opt in q["options"]:
                    self.assertNotIn("score", opt, f"Score leaked in questionnaire question {q['id']}")

    def test_scoring_endpoint(self):
        data = get_scoring_info(self.mock_request)
        self.assertIn("overview_steps", data)
        self.assertIn("items_per_quotient", data)
        self.assertIn("question_mapping", data)
        self.assertIn("formulas", data)
        self.assertIn("norms", data)
        self.assertIn("prototypes", data)
        self.assertIn("worked_example", data)
        self.assertIn("limitations", data)

    def test_model_info_endpoint(self):
        data = get_model_info(self.mock_request)
        self.assertIn("meta", data)
        self.assertIn("data_report", data)
        self.assertIn("distributions", data)
        self.assertIn("metrics", data)
        self.assertIn("feature_importance", data)
        self.assertIn("warnings", data)
        self.assertIsInstance(data["warnings"], list)

    def test_profiles_endpoint(self):
        data = get_profiles(self.mock_request)
        self.assertEqual(len(data), 7)

    def test_predict_happy_path(self):
        # Using valid sample answers
        answers = dict(SAMPLE_ANSWERS)
        answers["Q1"] = "17-18"
        answers["Q2"] = "Female"
        answers["Q3"] = "12th"
        answers["Q4"] = ["Visual (seeing)", "Reading/Writing"]
        answers["Q11"] = "Mathematics"
        answers["Q24"] = "Some"
        answers["Q25"] = "Daily"
        answers["Q29"] = "No"
        answers["Q38"] = "Academic Challenge (e.g., difficult subject, failing a test, completing a major project)"

        payload = PredictRequest(consent=True, answers=answers)
        data = predict_assessment(payload, self.mock_request, self.db)

        # Check all required fields from Section 7
        self.assertIsNotNone(data.submission_id)
        self.assertIsNotNone(data.model_version)
        self.assertIsNotNone(data.quotients)
        for q in ("IQ", "EQ", "SQ", "AQ"):
            self.assertIn(q, data.quotients)
            q_info = data.quotients[q]
            self.assertIsNotNone(q_info.score)
            self.assertIsNotNone(q_info.z)
            self.assertIn(q_info.level, ["H", "Avg", "L"])
            self.assertIsNotNone(q_info.norm_mean)
            self.assertIsNotNone(q_info.norm_sd)
            self.assertGreater(q_info.items_used, 0)

        self.assertIsNotNone(data.rule_profile)
        self.assertIn(data.rule_profile.id, range(1, 8))
        self.assertIsNotNone(data.rule_profile.name)
        self.assertIsNotNone(data.rule_profile.borderline)

        pred = data.prediction
        self.assertIn(pred.profile_id, range(1, 8))
        self.assertIsNotNone(pred.name)
        self.assertIsNotNone(pred.subtitle)
        self.assertGreaterEqual(pred.probability, 0.0)
        self.assertLessEqual(pred.probability, 1.0)
        self.assertEqual(len(pred.probabilities), 7)
        prob_sum = sum(p.p for p in pred.probabilities)
        self.assertAlmostEqual(prob_sum, 1.0, delta=0.01)

        exp = data.explanation
        self.assertEqual(len(exp.top_items), 5)
        for ti in exp.top_items:
            self.assertIsNotNone(ti.question_id)
            self.assertIsNotNone(ti.short)
            self.assertIsNotNone(ti.quotient)
            self.assertIsNotNone(ti.component)
            self.assertIsNotNone(ti.answer)
            self.assertGreaterEqual(ti.item_score, 0.0)
            self.assertLessEqual(ti.item_score, 1.0)

        self.assertIsNotNone(data.recommendations)
        self.assertIsNotNone(data.disclaimer)

    def test_predict_validation_errors(self):
        # 1. Missing consent (consent=False) raises Pydantic ValidationError
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            PredictRequest(consent=False, answers=SAMPLE_ANSWERS)

        # 2. Unknown question ID raises 422
        bad_answers = dict(SAMPLE_ANSWERS)
        bad_answers["Q999"] = "Random"
        req = PredictRequest(consent=True, answers=bad_answers)
        with self.assertRaises(HTTPException) as cm:
            predict_assessment(req, self.mock_request, self.db)
        self.assertEqual(cm.exception.status_code, 422)
        self.assertIn("Unknown question ID", cm.exception.detail)

        # 3. Missing required question (e.g. Q5) raises 422
        missing_answers = dict(SAMPLE_ANSWERS)
        del missing_answers["Q5"]
        req = PredictRequest(consent=True, answers=missing_answers)
        with self.assertRaises(HTTPException) as cm:
            predict_assessment(req, self.mock_request, self.db)
        self.assertEqual(cm.exception.status_code, 422)
        self.assertIn("Missing required question", cm.exception.detail)

        # 4. Unknown option for single choice question raises 422
        invalid_opt_answers = dict(SAMPLE_ANSWERS)
        invalid_opt_answers["Q1"] = "17-18"
        invalid_opt_answers["Q2"] = "Female"
        invalid_opt_answers["Q3"] = "12th"
        invalid_opt_answers["Q4"] = ["Visual (seeing)"]
        invalid_opt_answers["Q11"] = "Mathematics"
        invalid_opt_answers["Q24"] = "Some"
        invalid_opt_answers["Q25"] = "Daily"
        invalid_opt_answers["Q29"] = "No"
        invalid_opt_answers["Q38"] = "Academic Challenge (e.g., difficult subject, failing a test, completing a major project)"
        invalid_opt_answers["Q5"] = "In space"
        req = PredictRequest(consent=True, answers=invalid_opt_answers)
        with self.assertRaises(HTTPException) as cm:
            predict_assessment(req, self.mock_request, self.db)
        self.assertEqual(cm.exception.status_code, 422)
        self.assertIn("Invalid option", cm.exception.detail)


class TestRecommendationLogic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_bundle = load_and_validate_configs()

    def test_profile_1_returns_maintain_and_no_target(self):
        quotients = {
            "IQ": {"score": 85.0, "z": 1.2, "level": "H"},
            "EQ": {"score": 80.0, "z": 1.1, "level": "H"},
            "SQ": {"score": 78.0, "z": 1.0, "level": "H"},
            "AQ": {"score": 82.0, "z": 1.1, "level": "H"}
        }
        recs = generate_recommendations(
            predicted_profile_id=1,
            quotients=quotients,
            explanation_top_items=[],
            config_bundle=self.config_bundle
        )
        self.assertIsNone(recs["target_profile"])
        self.assertEqual(recs["focus"], [])
        self.assertIsNotNone(recs["maintain"])
        self.assertEqual(len(recs["maintain"]), 4)

    def test_profile_7_returns_support_note_and_target_6(self):
        quotients = {
            "IQ": {"score": 25.0, "z": -1.2, "level": "L"},
            "EQ": {"score": 20.0, "z": -1.3, "level": "L"},
            "SQ": {"score": 18.0, "z": -1.4, "level": "L"},
            "AQ": {"score": 22.0, "z": -1.1, "level": "L"}
        }
        recs = generate_recommendations(
            predicted_profile_id=7,
            quotients=quotients,
            explanation_top_items=[],
            config_bundle=self.config_bundle
        )
        self.assertIsNotNone(recs["target_profile"])
        self.assertEqual(recs["target_profile"]["id"], 6)
        self.assertIsNotNone(recs["support_note"])

    def test_no_duplicate_actions_recommended(self):
        quotients = {
            "IQ": {"score": 35.0, "z": -0.8, "level": "L"},
            "EQ": {"score": 30.0, "z": -0.9, "level": "L"},
            "SQ": {"score": 45.0, "z": -0.2, "level": "Avg"},
            "AQ": {"score": 32.0, "z": -0.8, "level": "L"}
        }
        recs = generate_recommendations(
            predicted_profile_id=2,
            quotients=quotients,
            explanation_top_items=[],
            config_bundle=self.config_bundle
        )
        all_action_ids = []
        for fb in recs["focus"]:
            for act in fb["actions"]:
                all_action_ids.append(act["id"])
        self.assertEqual(len(all_action_ids), len(set(all_action_ids)), "Actions contained duplicates")


if __name__ == "__main__":
    unittest.main()
