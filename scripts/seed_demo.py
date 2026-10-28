"""Insert synthetic evaluation data through the normal application APIs.

No extra Python packages required. Run --help for usage.
"""
import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

AUTHORIZATION = {}


def call(base, path, payload=None):
    headers = {"Content-Type": "application/json"}
    if base.rstrip("/") in AUTHORIZATION:
        headers["Authorization"] = "Bearer " + AUTHORIZATION[base.rstrip("/")]
    request = Request(
        base.rstrip("/") + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
    )
    try:
        with urlopen(request, timeout=240) as response:
            return json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"{request.full_url}: HTTP {error.code}: {error.read().decode()}") from error


def seed(transactions_url, risk_url, ml_url):
    # Wake services before transaction writes, so risk scoring can reach ML.
    health = call(ml_url, "/health")
    if not health.get("model_loaded"):
        raise RuntimeError("ML model is not loaded. Check the ML deployment logs before seeding.")
    for base in (transactions_url, risk_url):
        if call(base, "/actuator/health").get("status") != "UP":
            raise RuntimeError(f"Service is not ready: {base}")

    existing = call(transactions_url, "/api/transactions")
    markers = {tx.get("merchantCode") for tx in existing}
    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)
    for customer_id in (9001, 9002, 9003):
        for day in (12, 9, 6, 3, 0):
            marker = f"DEMO-{customer_id}-{day}"
            if customer_id == 9003 and day <= 6:
                marker += "-CRYPTO"
            if marker in markers:
                continue
            risky = customer_id == 9003 and day <= 6
            payload = {
                "customerId": customer_id,
                "amount": 180000 if risky else (1500 if customer_id == 9002 else 250),
                "currency": "LKR",
                "channel": "ECOM" if risky else "POS",
                "merchantCode": marker,
                "deviceCode": f"DEMO-DEVICE-{day if risky else customer_id}",
                "location": "SG" if risky else "LK",
                "transactionDatetime": (now - timedelta(days=day)).isoformat(),
            }
            result = call(transactions_url, "/api/transactions", payload)
            print(f"Customer {customer_id}: transaction {result['transactionId']} "
                  f"({result.get('transactionStatus')}, risk {result.get('riskScore')})")
        score = call(risk_url, f"/api/risk/calculate/{customer_id}?trigger=MANUAL")
        print(f"Customer {customer_id}: {score['score']} / {score['category']}")
    print("Demo data ready. Open the frontend and refresh the dashboard.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transactions", required=True, help="Transaction service public URL (no /api suffix)")
    parser.add_argument("--risk", required=True, help="Risk service public URL (no /api suffix)")
    parser.add_argument("--ml", required=True, help="ML service public URL")
    parser.add_argument("--email", required=True, help="Email of an account registered in the application")
    parser.add_argument("--password-env", default="RISKGUARD_PASSWORD", help="Environment variable containing the account password")
    args = parser.parse_args()
    password = os.environ.get(args.password_env)
    if not password:
        parser.error(f"Set {args.password_env} to your account password")
    session = call(args.transactions, "/api/auth/login", {"email": args.email, "password": password})
    for base in (args.transactions, args.risk):
        AUTHORIZATION[base.rstrip("/")] = session["token"]
    seed(args.transactions, args.risk, args.ml)
