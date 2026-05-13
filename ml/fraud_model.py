import argparse
import json
import os
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN, MiniBatchKMeans
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DEFAULT_NUMERIC_FEATURES = [
    "amount_ngn",
    "avg_transaction_amount",
    "account_age_days",
    "transaction_velocity",
    "transactions_last_1h",
    "transactions_last_24h",
    "behavioral_risk_score",
    "time_since_last_transaction",
    "transaction_hour",
    "shared_device_count",
    "shared_ip_count",
    "device_risk_score",
    "location_risk_score",
    "merchant_risk_score",
    "channel_risk_score",
    "overall_risk_score",
    "persona_risk_score",
]

DEFAULT_BINARY_FEATURES = [
    "is_night_transaction",
    "is_new_device",
    "geo_anomaly_flag",
]

TARGET_COLUMN = "is_fraud"


def load_data(path: str, max_rows: Optional[int]) -> pd.DataFrame:
    if path.lower().endswith(".parquet"):
        return pd.read_parquet(path)
    return pd.read_csv(path, nrows=max_rows)


def resolve_artifact_path(output_dir: str, artifact_file: str) -> str:
    if os.path.isabs(artifact_file):
        return artifact_file
    return os.path.join(output_dir, artifact_file)


def resolve_model_path(model_dir: str, model_file: Optional[str]) -> str:
    if model_file:
        return resolve_artifact_path(model_dir, model_file)

    joblib_path = os.path.join(model_dir, "model.joblib")
    if os.path.exists(joblib_path):
        return joblib_path

    pkl_path = os.path.join(model_dir, "model.pkl")
    if os.path.exists(pkl_path):
        return pkl_path

    return joblib_path


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    if "timestamp" in df.columns and "transaction_hour" not in df.columns:
        ts = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
        df["transaction_hour"] = ts.dt.hour

    if "transaction_hour" in df.columns and "is_night_transaction" not in df.columns:
        df["is_night_transaction"] = df["transaction_hour"].isin([0, 1, 2, 3, 4, 5]).astype(int)

    return df


def coerce_binary(df: pd.DataFrame, binary_features: List[str]) -> pd.DataFrame:
    for col in binary_features:
        if col in df.columns:
            df[col] = df[col].fillna(0).astype(int)
    return df


def coerce_numeric(df: pd.DataFrame, numeric_features: List[str]) -> pd.DataFrame:
    for col in numeric_features:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def select_features(
    df: pd.DataFrame,
    numeric_features: List[str],
    binary_features: List[str],
) -> Tuple[List[str], List[str]]:
    selected = []
    missing = []

    for col in numeric_features + binary_features:
        if col in df.columns:
            selected.append(col)
        else:
            missing.append(col)

    return selected, missing


def build_numeric_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )


def normalize(values: np.ndarray, vmin: float, vmax: float) -> np.ndarray:
    if vmax <= vmin:
        return np.zeros_like(values)
    scaled = (values - vmin) / (vmax - vmin)
    return np.clip(scaled, 0.0, 1.0)


def quantile_if_exists(df: pd.DataFrame, col: str, q: float) -> Optional[float]:
    if col not in df.columns:
        return None
    return float(df[col].quantile(q))


def build_rule_thresholds(df: pd.DataFrame) -> Dict[str, Optional[float]]:
    return {
        "amount_high": quantile_if_exists(df, "amount_ngn", 0.95),
        "velocity_high": quantile_if_exists(df, "transaction_velocity", 0.95),
        "tx_1h_high": quantile_if_exists(df, "transactions_last_1h", 0.95),
        "shared_device_high": quantile_if_exists(df, "shared_device_count", 0.95),
        "shared_ip_high": quantile_if_exists(df, "shared_ip_count", 0.95),
    }


def compute_rule_score(df: pd.DataFrame, thresholds: Dict[str, Optional[float]]) -> np.ndarray:
    score = pd.Series(0.0, index=df.index, dtype=float)

    amount_high = thresholds.get("amount_high")
    velocity_high = thresholds.get("velocity_high")
    tx_1h_high = thresholds.get("tx_1h_high")
    shared_device_high = thresholds.get("shared_device_high")
    shared_ip_high = thresholds.get("shared_ip_high")

    if amount_high is not None and "is_new_device" in df.columns and "amount_ngn" in df.columns:
        score += np.where(
            (df["is_new_device"] == 1) & (df["amount_ngn"] > amount_high),
            30,
            0,
        )

    if "geo_anomaly_flag" in df.columns:
        score += np.where(df["geo_anomaly_flag"] == 1, 25, 0)

    if tx_1h_high is not None and "transactions_last_1h" in df.columns:
        score += np.where(df["transactions_last_1h"] > tx_1h_high, 20, 0)

    if velocity_high is not None and "transaction_velocity" in df.columns:
        score += np.where(df["transaction_velocity"] > velocity_high, 15, 0)

    if shared_device_high is not None and "shared_device_count" in df.columns:
        score += np.where(df["shared_device_count"] > shared_device_high, 15, 0)

    if shared_ip_high is not None and "shared_ip_count" in df.columns:
        score += np.where(df["shared_ip_count"] > shared_ip_high, 10, 0)

    if amount_high is not None and "is_night_transaction" in df.columns and "amount_ngn" in df.columns:
        score += np.where(
            (df["is_night_transaction"] == 1) & (df["amount_ngn"] > amount_high),
            10,
            0,
        )

    return score.clip(0, 100).to_numpy()


def fit_dbscan(
    X_num: np.ndarray,
    sample_size: int,
    eps: float,
    min_samples: int,
    random_state: int,
) -> Tuple[Optional[np.ndarray], Optional[float]]:
    if X_num.shape[0] == 0:
        return None, None

    if X_num.shape[0] > sample_size:
        rng = np.random.default_rng(random_state)
        idx = rng.choice(X_num.shape[0], size=sample_size, replace=False)
        X_sample = X_num[idx]
    else:
        X_sample = X_num

    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    dbscan.fit(X_sample)

    if not hasattr(dbscan, "components_") or len(dbscan.components_) == 0:
        return None, None

    return dbscan.components_, eps


def compute_dbscan_noise(
    X_num: np.ndarray,
    core_samples: Optional[np.ndarray],
    eps: Optional[float],
    chunk_size: int,
) -> np.ndarray:
    if core_samples is None or eps is None or len(core_samples) == 0:
        return np.zeros(X_num.shape[0], dtype=int)

    nn = NearestNeighbors(n_neighbors=1)
    nn.fit(core_samples)

    flags = np.zeros(X_num.shape[0], dtype=int)
    for start in range(0, X_num.shape[0], chunk_size):
        end = min(start + chunk_size, X_num.shape[0])
        dist, _ = nn.kneighbors(X_num[start:end])
        flags[start:end] = (dist[:, 0] > eps).astype(int)

    return flags


def risk_to_action(risk: np.ndarray, allow_max: float, challenge_max: float) -> np.ndarray:
    actions = np.full(risk.shape, "block", dtype=object)
    actions[risk <= challenge_max] = "challenge"
    actions[risk <= allow_max] = "allow"
    return actions


def train(args: argparse.Namespace) -> None:
    df = load_data(args.data, args.max_rows)
    df = add_time_features(df)
    df = coerce_binary(df, DEFAULT_BINARY_FEATURES)
    df = coerce_numeric(df, DEFAULT_NUMERIC_FEATURES)

    features, missing = select_features(df, DEFAULT_NUMERIC_FEATURES, DEFAULT_BINARY_FEATURES)
    if not features:
        raise ValueError("No usable features found in the dataset.")

    pipeline = build_numeric_pipeline()
    X = pipeline.fit_transform(df[features])

    kmeans = MiniBatchKMeans(
        n_clusters=args.kmeans_clusters,
        random_state=args.random_state,
        batch_size=args.kmeans_batch_size,
    )
    kmeans.fit(X)
    cluster_distance_raw = kmeans.transform(X).min(axis=1)

    isoforest = IsolationForest(
        n_estimators=args.iso_estimators,
        max_samples=args.iso_max_samples,
        random_state=args.random_state,
        n_jobs=args.jobs,
    )
    isoforest.fit(X)
    anomaly_raw = -isoforest.decision_function(X)

    rule_thresholds = build_rule_thresholds(df)
    rule_score = compute_rule_score(df, rule_thresholds)

    cluster_min = float(np.min(cluster_distance_raw))
    cluster_max = float(np.max(cluster_distance_raw))
    anomaly_min = float(np.min(anomaly_raw))
    anomaly_max = float(np.max(anomaly_raw))

    cluster_score = normalize(cluster_distance_raw, cluster_min, cluster_max) * 100.0
    anomaly_score = normalize(anomaly_raw, anomaly_min, anomaly_max) * 100.0

    weights = {
        "anomaly": args.weight_anomaly,
        "cluster": args.weight_cluster,
        "rule": args.weight_rule,
    }

    dbscan_core = None
    dbscan_eps = None
    dbscan_noise = np.zeros(X.shape[0], dtype=int)
    if args.enable_dbscan:
        dbscan_core, dbscan_eps = fit_dbscan(
            X,
            sample_size=args.dbscan_sample,
            eps=args.dbscan_eps,
            min_samples=args.dbscan_min_samples,
            random_state=args.random_state,
        )
        dbscan_noise = compute_dbscan_noise(
            X,
            core_samples=dbscan_core,
            eps=dbscan_eps,
            chunk_size=args.dbscan_chunk,
        )

    risk_score = (
        weights["anomaly"] * anomaly_score
        + weights["cluster"] * cluster_score
        + weights["rule"] * rule_score
        + (dbscan_noise * args.dbscan_penalty)
    )
    risk_score = np.clip(risk_score, 0, 100)

    metrics = {}
    if TARGET_COLUMN in df.columns:
        y_true = df[TARGET_COLUMN].fillna(0).astype(int).to_numpy()
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, risk_score / 100.0))
            metrics["pr_auc"] = float(average_precision_score(y_true, risk_score / 100.0))
        except ValueError:
            metrics["roc_auc"] = None
            metrics["pr_auc"] = None
        y_pred = (risk_score >= args.challenge_max).astype(int)
        metrics["f1_at_block_threshold"] = float(f1_score(y_true, y_pred))

    os.makedirs(args.output_dir, exist_ok=True)
    artifact_path = resolve_artifact_path(args.output_dir, args.artifact_file)
    meta_path = os.path.join(args.output_dir, "meta.json")

    joblib.dump(
        {
            "pipeline": pipeline,
            "kmeans": kmeans,
            "isoforest": isoforest,
            "dbscan_core": dbscan_core,
        },
        artifact_path,
    )

    meta = {
        "features": features,
        "missing_features": missing,
        "rule_thresholds": rule_thresholds,
        "weights": weights,
        "allow_max": args.allow_max,
        "challenge_max": args.challenge_max,
        "cluster_distance_min": cluster_min,
        "cluster_distance_max": cluster_max,
        "anomaly_score_min": anomaly_min,
        "anomaly_score_max": anomaly_max,
        "dbscan_enabled": args.enable_dbscan,
        "dbscan_eps": dbscan_eps,
        "dbscan_penalty": args.dbscan_penalty,
        "metrics": metrics,
    }

    with open(meta_path, "w", encoding="utf-8") as handle:
        json.dump(meta, handle, indent=2)

    print("Training complete")
    print(f"Model artifact: {artifact_path}")
    print(f"Metadata: {meta_path}")
    if metrics:
        print("Metrics:")
        for key, value in metrics.items():
            if value is None:
                print(f"  {key}: n/a")
            else:
                print(f"  {key}: {value:.4f}")


def score(args: argparse.Namespace) -> None:
    artifact_path = resolve_model_path(args.model_dir, args.model_file)
    meta_path = os.path.join(args.model_dir, "meta.json")

    if not os.path.exists(artifact_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("Model artifacts not found. Train the model first.")

    artifacts = joblib.load(artifact_path)
    with open(meta_path, "r", encoding="utf-8") as handle:
        meta = json.load(handle)

    df = load_data(args.data, args.max_rows)
    df = add_time_features(df)
    df = coerce_binary(df, DEFAULT_BINARY_FEATURES)
    df = coerce_numeric(df, DEFAULT_NUMERIC_FEATURES)

    features = meta["features"]
    missing = [col for col in features if col not in df.columns]
    for col in missing:
        df[col] = np.nan

    pipeline = artifacts["pipeline"]
    kmeans = artifacts["kmeans"]
    isoforest = artifacts["isoforest"]
    dbscan_core = artifacts.get("dbscan_core")

    X = pipeline.transform(df[features])

    cluster_distance_raw = kmeans.transform(X).min(axis=1)
    anomaly_raw = -isoforest.decision_function(X)

    cluster_score = (
        normalize(
            cluster_distance_raw,
            meta["cluster_distance_min"],
            meta["cluster_distance_max"],
        )
        * 100.0
    )
    anomaly_score = (
        normalize(
            anomaly_raw,
            meta["anomaly_score_min"],
            meta["anomaly_score_max"],
        )
        * 100.0
    )

    rule_score = compute_rule_score(df, meta["rule_thresholds"])

    dbscan_noise = np.zeros(X.shape[0], dtype=int)
    if meta.get("dbscan_enabled"):
        dbscan_noise = compute_dbscan_noise(
            X,
            core_samples=dbscan_core,
            eps=meta.get("dbscan_eps"),
            chunk_size=args.dbscan_chunk,
        )

    weights = meta["weights"]
    risk_score = (
        weights["anomaly"] * anomaly_score
        + weights["cluster"] * cluster_score
        + weights["rule"] * rule_score
        + (dbscan_noise * meta.get("dbscan_penalty", 0.0))
    )
    risk_score = np.clip(risk_score, 0, 100)

    actions = risk_to_action(risk_score, meta["allow_max"], meta["challenge_max"])

    output = df.copy()
    output["risk_score"] = risk_score
    output["action"] = actions

    if args.include_components:
        output["risk_anomaly"] = anomaly_score
        output["risk_cluster"] = cluster_score
        output["risk_rule"] = rule_score
        output["risk_dbscan"] = dbscan_noise * meta.get("dbscan_penalty", 0.0)

    if args.output.lower().endswith(".parquet"):
        output.to_parquet(args.output, index=False)
    else:
        output.to_csv(args.output, index=False)

    print(f"Scored data saved to: {args.output}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fraud risk modeling pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    train_parser = subparsers.add_parser("train", help="Train the fraud model")
    train_parser.add_argument("--data", required=True, help="Path to training dataset")
    train_parser.add_argument("--output-dir", default="artifacts", help="Output directory")
    train_parser.add_argument("--max-rows", type=int, default=None, help="Limit rows")
    train_parser.add_argument(
        "--artifact-file",
        default="model.joblib",
        help="Model artifact filename (e.g., model.pkl)",
    )
    train_parser.add_argument("--kmeans-clusters", type=int, default=8, help="KMeans clusters")
    train_parser.add_argument("--kmeans-batch-size", type=int, default=2048, help="KMeans batch size")
    train_parser.add_argument("--iso-estimators", type=int, default=200, help="IsolationForest trees")
    train_parser.add_argument("--iso-max-samples", default="auto", help="IsolationForest max samples")
    train_parser.add_argument("--jobs", type=int, default=-1, help="Parallel jobs")
    train_parser.add_argument("--random-state", type=int, default=42, help="Random state")
    train_parser.add_argument("--allow-max", type=float, default=30.0, help="Allow threshold")
    train_parser.add_argument("--challenge-max", type=float, default=60.0, help="Challenge threshold")
    train_parser.add_argument("--weight-anomaly", type=float, default=0.4, help="Weight for anomaly")
    train_parser.add_argument("--weight-cluster", type=float, default=0.3, help="Weight for cluster")
    train_parser.add_argument("--weight-rule", type=float, default=0.3, help="Weight for rules")
    train_parser.add_argument("--enable-dbscan", action="store_true", help="Enable DBSCAN")
    train_parser.add_argument("--dbscan-sample", type=int, default=20000, help="DBSCAN sample size")
    train_parser.add_argument("--dbscan-eps", type=float, default=0.8, help="DBSCAN eps")
    train_parser.add_argument("--dbscan-min-samples", type=int, default=10, help="DBSCAN min samples")
    train_parser.add_argument("--dbscan-penalty", type=float, default=10.0, help="DBSCAN penalty")
    train_parser.add_argument("--dbscan-chunk", type=int, default=50000, help="DBSCAN chunk size")
    train_parser.set_defaults(func=train)

    score_parser = subparsers.add_parser("score", help="Score transactions")
    score_parser.add_argument("--data", required=True, help="Path to scoring dataset")
    score_parser.add_argument("--model-dir", default="artifacts", help="Model directory")
    score_parser.add_argument("--output", required=True, help="Output file path")
    score_parser.add_argument(
        "--model-file",
        default=None,
        help="Model artifact filename (e.g., model.pkl)",
    )
    score_parser.add_argument("--max-rows", type=int, default=None, help="Limit rows")
    score_parser.add_argument("--include-components", action="store_true", help="Include risk components")
    score_parser.add_argument("--dbscan-chunk", type=int, default=50000, help="DBSCAN chunk size")
    score_parser.set_defaults(func=score)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
