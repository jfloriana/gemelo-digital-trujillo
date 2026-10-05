"""Motor de IA — Gemelo Digital Trujillo (servicio FastAPI)
=============================================================
Microservicio independiente que expone el "motor de IA" (entrenamiento y
evaluación de modelos) como una API REST. El panel Streamlit (y, a futuro,
la app web) lo consume por HTTP en vez de ejecutar scikit-learn en el mismo
proceso — simula una arquitectura de microservicios real para la tesis.

Lee los mismos datos de Supabase (tabla `urban_zones`), con la clave
pública `anon` de solo lectura. No escribe nada en la base de datos.

Ejecución:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Docs interactivas: http://localhost:8000/docs
"""

from __future__ import annotations

import os
from typing import Literal

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import LeaveOneOut, learning_curve
from sklearn.preprocessing import LabelEncoder
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "Faltan SUPABASE_URL / SUPABASE_ANON_KEY. Copia .env.example a .env y "
        "pega las mismas credenciales anónimas que usa la app web."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI(
    title="Gemelo Digital Trujillo — Motor de IA",
    description="API del motor de entrenamiento/evaluación de IA (OE3), consumida por el panel Streamlit.",
    version="1.0.0",
)

# Permite que el panel Streamlit (otro puerto) y, a futuro, la app web
# (otro origen) consuman esta API desde el navegador si hace falta.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Algorithm = Literal["linear", "random_forest", "gradient_boosting"]

ALL_FEATURES = [
    "baseline_temp", "tree_cover", "built_density",
    "target_population", "vulnerable_population", "vulnerability_level",
]


def _build_estimator(algorithm: Algorithm):
    if algorithm == "linear":
        return LinearRegression()
    if algorithm == "random_forest":
        return RandomForestRegressor(n_estimators=150, random_state=42)
    if algorithm == "gradient_boosting":
        return GradientBoostingRegressor(random_state=42)
    raise HTTPException(status_code=400, detail=f"Algoritmo desconocido: {algorithm}")


def _load_zones() -> pd.DataFrame:
    r = supabase.table("urban_zones").select("*").order("id").execute()
    df = pd.DataFrame(r.data)
    if df.empty:
        raise HTTPException(status_code=503, detail="No hay zonas en Supabase.")
    return df


def _encode_features(df: pd.DataFrame, features: list[str]) -> np.ndarray:
    X_df = df[features].copy()
    if "vulnerability_level" in X_df.columns:
        X_df["vulnerability_level"] = LabelEncoder().fit_transform(
            X_df["vulnerability_level"].astype(str)
        )
    return X_df.to_numpy(dtype=float)


# ----------------------------------------------------------------------
# Esquemas
# ----------------------------------------------------------------------

class TrainRequest(BaseModel):
    target: str = Field(..., examples=["baseline_pm25"])
    features: list[str] = Field(..., min_length=1, examples=[["baseline_temp", "tree_cover"]])
    algorithm: Algorithm = "random_forest"


class TrainResponse(BaseModel):
    n_samples: int
    cv_strategy: str = "leave_one_out"
    algorithm: str
    target: str
    features: list[str]
    r2: float
    rmse: float
    mae: float
    y_true: list[float]
    y_pred: list[float]
    feature_importances: dict[str, float] | None = None
    coefficients: dict[str, float] | None = None


class LearningCurveResponse(BaseModel):
    algorithm: str
    cv_folds: int
    train_sizes: list[int]
    train_r2: list[float]
    val_r2: list[float]


# ----------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "gemelo-digital-ai-engine"}


@app.get("/api/zones/summary")
def zones_summary():
    """Metadatos rápidos para que el consumidor sepa qué puede entrenar."""
    df = _load_zones()
    return {
        "n_zones": len(df),
        "available_features": [c for c in ALL_FEATURES if c in df.columns],
        "available_targets": [c for c in ["baseline_pm25", "baseline_temp"] if c in df.columns],
    }


@app.get("/api/learning-curve", response_model=LearningCurveResponse)
def learning_curve_endpoint(
    algorithm: Algorithm = "linear",
    target: str = "baseline_pm25",
):
    df = _load_zones()
    features = [c for c in ["baseline_temp", "tree_cover", "built_density", "target_population"] if c in df.columns]
    df = df.dropna(subset=features + [target])
    if len(df) < 6:
        raise HTTPException(status_code=422, detail="Se necesitan al menos 6 zonas con datos completos.")

    X = df[features].to_numpy(dtype=float)
    y = df[target].to_numpy(dtype=float)
    estimator = _build_estimator(algorithm)
    cv_folds = min(5, len(df))

    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=cv_folds,
        train_sizes=np.linspace(0.3, 1.0, 6),
        scoring="r2",
    )
    return LearningCurveResponse(
        algorithm=algorithm,
        cv_folds=cv_folds,
        train_sizes=[int(n) for n in train_sizes],
        train_r2=[float(s) for s in train_scores.mean(axis=1)],
        val_r2=[float(s) for s in test_scores.mean(axis=1)],
    )


@app.post("/api/train", response_model=TrainResponse)
def train_endpoint(req: TrainRequest):
    df = _load_zones()

    missing = [f for f in req.features if f not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Columnas no encontradas: {missing}")
    if req.target not in df.columns:
        raise HTTPException(status_code=422, detail=f"Columna objetivo no encontrada: {req.target}")

    df = df.dropna(subset=req.features + [req.target])
    if len(df) < 4:
        raise HTTPException(status_code=422, detail="Muy pocas zonas con datos completos para estas variables.")

    X = _encode_features(df, req.features)
    y = df[req.target].to_numpy(dtype=float)

    model = _build_estimator(req.algorithm)

    # Dataset pequeño (zonas) -> Leave-One-Out CV para métricas honestas.
    loo = LeaveOneOut()
    y_pred_cv = np.zeros_like(y)
    for train_idx, test_idx in loo.split(X):
        model.fit(X[train_idx], y[train_idx])
        y_pred_cv[test_idx] = model.predict(X[test_idx])

    r2 = r2_score(y, y_pred_cv)
    rmse = float(np.sqrt(mean_squared_error(y, y_pred_cv)))
    mae = mean_absolute_error(y, y_pred_cv)

    # Modelo final sobre TODOS los datos, para extraer importancia de variables.
    model.fit(X, y)

    feature_importances = None
    coefficients = None
    if hasattr(model, "feature_importances_"):
        feature_importances = dict(zip(req.features, (float(v) for v in model.feature_importances_)))
    elif hasattr(model, "coef_"):
        coefficients = dict(zip(req.features, (float(v) for v in model.coef_)))

    return TrainResponse(
        n_samples=len(df),
        algorithm=req.algorithm,
        target=req.target,
        features=req.features,
        r2=float(r2),
        rmse=rmse,
        mae=float(mae),
        y_true=[float(v) for v in y],
        y_pred=[float(v) for v in y_pred_cv],
        feature_importances=feature_importances,
        coefficients=coefficients,
    )
