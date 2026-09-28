"""Motor Python espejo del Laboratorio IA web (metodología CRISP-DM).

Lee el CSV descargado del módulo (columnas: sensor,hora,temp_c,hr_pct,
viento_ms,radiacion,pm25,fuente), entrena lineal + k-NN + MLP con split
cronológico 80/20, CV 5-fold, ruido ±10%, brecha por dominios y T-Student
pareada + Wilcoxon. Guarda artefactos JSON + predicciones CSV en outputs/.

Uso:
    pip install -r requirements.txt
    python train.py --csv dataset_entrenamiento.csv --out outputs
"""

import argparse
import json
import os
from datetime import datetime

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.neighbors import KNeighborsRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

FEATURES = ["temp_c", "hr_pct", "viento_ms", "radiacion"]
TARGET = "pm25"


def load_dataset(path):
    df = pd.read_csv(path)
    df = df.dropna(subset=FEATURES + [TARGET])
    return df.reset_index(drop=True)


def metrics(y, p):
    y = np.asarray(y, dtype=float)
    p = np.asarray(p, dtype=float)
    mape = float(np.mean(np.abs((y - p) / np.where(y == 0, np.nan, y))) * 100)
    return {
        "r2": float(r2_score(y, p)),
        "rmse": float(np.sqrt(mean_squared_error(y, p))),
        "mae": float(mean_absolute_error(y, p)),
        "mape": float(mape) if np.isfinite(mape) else None,
    }


def build_model(kind, hyper):
    if kind == "linear":
        return LinearRegression()
    if kind == "knn":
        return KNeighborsRegressor(n_neighbors=int(hyper.get("k", 5)))
    return MLPRegressor(
        hidden_layer_sizes=(int(hyper.get("hidden", 8)),),
        max_iter=int(hyper.get("epochs", 300)),
        learning_rate_init=float(hyper.get("lr", 0.05)),
        random_state=int(hyper.get("seed", 42)),
    )


GRID = (
    [("linear", {})]
    + [("knn", {"k": k}) for k in (3, 5, 7, 9)]
    + [
        ("mlp", {"hidden": 4, "epochs": 200, "lr": 0.05}),
        ("mlp", {"hidden": 8, "epochs": 200, "lr": 0.05}),
        ("mlp", {"hidden": 8, "epochs": 400, "lr": 0.02}),
    ]
)


def split_chrono(df, ratio=0.8):
    cut = max(4, int(len(df) * ratio))
    return df.iloc[:cut].copy(), df.iloc[cut:].copy()


def evaluate(model, scaler, test):
    Xt = scaler.transform(test[FEATURES].to_numpy())
    pred = model.predict(Xt)
    return pred, metrics(test[TARGET].to_numpy(), pred)


def cross_val(df, kind, hyper, seed=42, k=5):
    X = df[FEATURES].to_numpy()
    y = df[TARGET].to_numpy()
    kf = KFold(n_splits=k, shuffle=True, random_state=seed)
    r2s = []
    for tr_idx, te_idx in kf.split(X):
        scaler = StandardScaler().fit(X[tr_idx])
        model = build_model(kind, {**hyper, "seed": seed})
        model.fit(scaler.transform(X[tr_idx]), y[tr_idx])
        r2s.append(r2_score(y[te_idx], model.predict(scaler.transform(X[te_idx]))))
    return {"mean_r2": float(np.mean(r2s)), "std_r2": float(np.std(r2s))}


def noise_test(df, kind, hyper, seed=42, base_rmse=None):
    train, test = split_chrono(df)
    scaler = StandardScaler().fit(train[FEATURES].to_numpy())
    model = build_model(kind, {**hyper, "seed": seed})
    model.fit(scaler.transform(train[FEATURES].to_numpy()), train[TARGET].to_numpy())
    rng = np.random.default_rng(seed + 555)
    Xn = test[FEATURES].to_numpy() * (1 + (rng.random(test[FEATURES].shape) - 0.5) * 0.2)
    pred = model.predict(scaler.transform(Xn))
    rmse = float(np.sqrt(mean_squared_error(test[TARGET].to_numpy(), pred)))
    degrad = ((rmse - base_rmse) / base_rmse * 100) if base_rmse else None
    return {"noise_rmse": rmse, "degrad_pct": degrad}


def domain_gap(df, kind, hyper, seed=42):
    out = {}
    for tr_dom, te_dom, key in (("public", "calibrated", "pub_to_cal"), ("calibrated", "public", "cal_to_pub")):
        tr = df[df["fuente"] == tr_dom]
        te = df[df["fuente"] == te_dom]
        if len(tr) < 5 or len(te) < 3:
            out[key] = None
            continue
        scaler = StandardScaler().fit(tr[FEATURES].to_numpy())
        model = build_model(kind, {**hyper, "seed": seed})
        model.fit(scaler.transform(tr[FEATURES].to_numpy()), tr[TARGET].to_numpy())
        pred = model.predict(scaler.transform(te[FEATURES].to_numpy()))
        out[key] = float(np.sqrt(mean_squared_error(te[TARGET].to_numpy(), pred)))
    return out


def ttests(df):
    """T pareada ref↔hw por zona (si hay columnas sensor/hora) + Wilcoxon."""
    res = []
    if "sensor" not in df.columns or "hora" not in df.columns:
        return res
    pubs = df[df["sensor"].str.startswith("PUB-", na=False)]
    cals = df[~df["sensor"].str.startswith("PUB-", na=False)]
    for sensor, gpub in pubs.groupby("sensor"):
        for _, grow in cals.groupby("sensor"):
            merged = pd.merge(
                gpub[["hora", "temp_c", "pm25"]].rename(columns={"temp_c": "t_r", "pm25": "p_r"}),
                grow[["hora", "temp_c", "pm25"]].rename(columns={"temp_c": "t_h", "pm25": "p_h"}),
                on="hora",
                how="inner",
            )
            if len(merged) < 3:
                continue
            for col_r, col_h, var in (("t_r", "t_h", "T"), ("p_r", "p_h", "PM")):
                d = (merged[col_r] - merged[col_h]).to_numpy()
                t_stat, p_val = stats.ttest_rel(merged[col_r], merged[col_h])
                try:
                    w_res = stats.wilcoxon(d)
                    w_p = float(w_res.pvalue)
                except Exception:
                    w_p = None
                res.append({
                    "par": f"{sensor}↔{grow['sensor'].iloc[0]}",
                    "variable": var,
                    "n": int(len(d)),
                    "t": float(t_stat),
                    "p": float(p_val),
                    "wilcoxon_p": w_p,
                })
    return res


def run_all(df, seed=42):
    if len(df) < 12:
        raise ValueError(f"Se requieren mínimo 12 filas (hay {len(df)}). Espera al cron horario.")
    results = []
    for kind, hyper in GRID:
        train, test = split_chrono(df)
        scaler = StandardScaler().fit(train[FEATURES].to_numpy())
        model = build_model(kind, {**hyper, "seed": seed})
        model.fit(scaler.transform(train[FEATURES].to_numpy()), train[TARGET].to_numpy())
        pred, met = evaluate(model, scaler, test)
        cv = cross_val(df, kind, hyper, seed)
        nz = noise_test(df, kind, hyper, seed, met["rmse"])
        gap = domain_gap(df, kind, hyper, seed)
        results.append({
            "model": kind, "hyper": hyper, "seed": seed,
            "n_train": len(train), "n_test": len(test),
            "metrics": met, "cv": cv, "noise": nz, "gap": gap,
        })
    results.sort(key=lambda r: r["metrics"]["rmse"])
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", default="outputs")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    df = load_dataset(args.csv)
    print(f"Filas: {len(df)} (public={int((df['fuente'] == 'public').sum())}, cal={int((df['fuente'] == 'calibrated').sum())})")

    results = run_all(df, args.seed)
    for r in results:
        print(f"{r['model']:7s} {str(r['hyper']):38s} R²={r['metrics']['r2']:.3f} RMSE={r['metrics']['rmse']:.2f} CV={r['cv']['mean_r2']:.3f}")
    best = results[0]
    print(f"Campeón: {best['model']} {best['hyper']}")

    with open(os.path.join(args.out, "trials.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Predicciones del campeón (reentrenado en el split para guardar preds)
    train, test = split_chrono(df)
    scaler = StandardScaler().fit(train[FEATURES].to_numpy())
    model = build_model(best["model"], {**best["hyper"], "seed": args.seed})
    model.fit(scaler.transform(train[FEATURES].to_numpy()), train[TARGET].to_numpy())
    pred = model.predict(scaler.transform(test[FEATURES].to_numpy()))
    out_df = test[["sensor", "hora", TARGET]].copy()
    out_df["predicho"] = np.round(pred, 2)
    out_df.to_csv(os.path.join(args.out, "predicciones_campeon.csv"), index=False)

    tts = ttests(df)
    with open(os.path.join(args.out, "t_student.json"), "w", encoding="utf-8") as f:
        json.dump(tts, f, ensure_ascii=False, indent=2)
    print(f"T-Student: {len(tts)} comparaciones en t_student.json")
    print(f"Artefactos en {args.out}/")


if __name__ == "__main__":
    main()
