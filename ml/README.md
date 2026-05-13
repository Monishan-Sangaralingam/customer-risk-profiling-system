# ML

Machine learning models and data processing for the Customer Risk Profiling System.

## Overview

This folder contains the end to end fraud risk model described in the ML planning docs:

- KMeans clustering for behavior grouping
- IsolationForest for anomaly detection
- Rule based risk boosts
- Final risk score = 0.4 * anomaly + 0.3 * cluster + 0.3 * rule
- Optional DBSCAN penalty for density based anomalies

## Files

- fraud_model.py: training and scoring CLI
- requirements.txt: Python dependencies

## Quick start

Install dependencies:

```bash
pip install -r requirements.txt
```

Train a model:

```bash
python fraud_model.py train --data path/to/train.csv --output-dir artifacts
```

Score new transactions:

```bash
python fraud_model.py score --data path/to/score.csv --model-dir artifacts --output scored.csv
```

## Expected columns

The model selects any of the following columns that exist in your dataset:

Numeric features:

- amount_ngn
- avg_transaction_amount
- account_age_days
- transaction_velocity
- transactions_last_1h
- transactions_last_24h
- behavioral_risk_score
- time_since_last_transaction
- transaction_hour
- shared_device_count
- shared_ip_count
- device_risk_score
- location_risk_score
- merchant_risk_score
- channel_risk_score
- overall_risk_score
- persona_risk_score

Binary features:

- is_night_transaction
- is_new_device
- geo_anomaly_flag

If timestamp is present but transaction_hour is not, it will be derived automatically.

## Notes

- Parquet inputs require pyarrow.
- DBSCAN is optional and can be expensive on large datasets.
