import os
import joblib
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict

app = FastAPI(title="Customer Risk Profiling ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolution paths for the .pkl model file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_LOCATIONS = [
    os.path.join(CURRENT_DIR, "model.pkl"),
    os.path.join(CURRENT_DIR, "..", "..", "ml", "fraud_detection_model.pkl"),
    os.path.join(CURRENT_DIR, "fraud_detection_model.pkl"),
    "model.pkl",
    "fraud_detection_model.pkl"
]

model = None
model_path_used = None

for loc in MODEL_LOCATIONS:
    if os.path.exists(loc):
        try:
            model = joblib.load(loc)
            model_path_used = os.path.abspath(loc)
            print(f"[ML Service] Successfully loaded trained ML model (.pkl) from: {model_path_used}")
            break
        except Exception as e:
            print(f"[ML Service] Error loading model from {loc}: {e}")

if model is None:
    print("[ML Service] WARNING: No .pkl model file found in search paths!")
    if os.getenv("REQUIRE_MODEL", "false").lower() == "true":
        raise RuntimeError("The trained model could not be loaded; refusing to serve heuristic predictions.")
elif hasattr(model, "set_params"):
    # Keep inference within the CPU/memory budget of a free instance.
    model.set_params(**{name: 1 for name in model.get_params() if name.endswith("n_jobs")})

FEATURE_NAMES = [
    "txCount30d",
    "totalAmount30d",
    "avgTxnAmount30d",
    "maxTxnAmount30d",
    "amountStddev30d",
    "spendVelocity7dVsPrev7d",
    "txVelocity7dVsPrev7d",
    "ecomRatio30d",
    "posRatio30d",
    "atmRatio30d",
    "uniqueMerchantCount30d",
    "riskyMerchantCount30d",
    "newDeviceFlagRecent",
    "newCountryFlagRecent"
]

def map_risk_level(score: float) -> str:
    if score >= 70.0:
        return "High"
    elif score >= 40.0:
        return "Medium"
    else:
        return "Low"

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "ml-service",
        "model_loaded": model is not None,
        "model_path": model_path_used
    }

@app.post("/predict")
async def predict(data: Dict[str, Any]):
    """
    Accepts FeatureDTO features from backend risk-score-service,
    runs inference through the trained .pkl model pipeline,
    and returns risk_score (0-100) and risk_level.
    """
    try:
        # Build normalized feature dictionary with safe defaults
        feature_dict = {}
        for feat in FEATURE_NAMES:
            val = data.get(feat)
            if val is None:
                # Handle possible snake_case variants
                snake_feat = ''.join(['_' + c.lower() if c.isupper() else c for c in feat]).lstrip('_')
                val = data.get(snake_feat, 0.0)
            
            # Convert booleans to 1/0
            if isinstance(val, bool):
                val = 1 if val else 0
            elif val is None:
                val = 0.0
            else:
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    val = 0.0
            
            feature_dict[feat] = [val]

        df = pd.DataFrame(feature_dict, columns=FEATURE_NAMES)

        if model is not None:
            # Predict risk probability using calibrated model
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(df)[0]
                # Index 1 is the high-risk / fraud probability
                fraud_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            else:
                raw_pred = model.predict(df)[0]
                fraud_prob = float(raw_pred)

            risk_score = round(fraud_prob * 100.0, 2)
            # Bound risk_score between 0 and 100
            risk_score = max(0.0, min(100.0, risk_score))
        else:
            # Fallback heuristic calculation if model not present
            spend_vel = feature_dict["spendVelocity7dVsPrev7d"][0]
            risky_merch = feature_dict["riskyMerchantCount30d"][0]
            new_dev = feature_dict["newDeviceFlagRecent"][0]
            new_ctry = feature_dict["newCountryFlagRecent"][0]
            
            base_score = 15.0
            if spend_vel > 2.0:
                base_score += 30.0
            if risky_merch > 0:
                base_score += 25.0
            if new_dev == 1:
                base_score += 15.0
            if new_ctry == 1:
                base_score += 15.0
            risk_score = min(100.0, base_score)

        risk_level = map_risk_level(risk_score)

        return {
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "error": None
        }

    except Exception as e:
        print(f"[ML Service Error] {e}")
        return {
            "risk_score": 25.0,
            "risk_level": "Low",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
