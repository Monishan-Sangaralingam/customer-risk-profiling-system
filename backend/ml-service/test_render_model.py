"""Run from this folder: python -m unittest test_render_model -v."""
import os
import unittest
from unittest.mock import patch

os.environ["REQUIRE_MODEL"] = "true"

from fastapi.testclient import TestClient
from app import app, model


class RenderModelTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_requires_real_trained_model(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["model_loaded"])
        self.assertEqual(model.get_params()["classifier__n_jobs"], 1)

    def test_prediction_uses_model_for_normal_and_risky_features(self):
        normal = dict(txCount30d=18, totalAmount30d=1800, avgTxnAmount30d=100,
                      maxTxnAmount30d=200, amountStddev30d=30,
                      spendVelocity7dVsPrev7d=1, txVelocity7dVsPrev7d=1,
                      ecomRatio30d=0.3, posRatio30d=0.5, atmRatio30d=0.2,
                      uniqueMerchantCount30d=5, riskyMerchantCount30d=0,
                      newDeviceFlagRecent=False, newCountryFlagRecent=False)
        risky = dict(normal, spendVelocity7dVsPrev7d=5, txVelocity7dVsPrev7d=4,
                     riskyMerchantCount30d=5, newDeviceFlagRecent=True,
                     newCountryFlagRecent=True, maxTxnAmount30d=200000)
        with patch.object(model, "predict_proba", wraps=model.predict_proba) as predict:
            results = [self.client.post("/predict", json=data) for data in (normal, risky)]
            self.assertEqual(predict.call_count, 2)
        for result in results:
            self.assertEqual(result.status_code, 200)
            self.assertIsNone(result.json()["error"])
            self.assertGreaterEqual(result.json()["risk_score"], 0)
            self.assertLessEqual(result.json()["risk_score"], 100)
        self.assertGreater(results[1].json()["risk_score"], results[0].json()["risk_score"])


if __name__ == "__main__":
    unittest.main()
