"""Gemelo Digital Trujillo — Motor IA en Python + Streamlit (CRISP-DM).

Ejecución:
    pip install -r requirements.txt
    streamlit run app.py

Sube el CSV descargado del módulo web (botón "Descargar dataset") y recorre
las 6 fases CRISP-DM con los mismos datos y métricas del laboratorio web.
"""

import io
import json

import pandas as pd
import streamlit as st

from train import (
    FEATURES,
    cross_val,
    domain_gap,
    load_dataset,
    noise_test,
    run_all,
    ttests,
)

st.set_page_config(page_title="EcoTwin Trujillo — Motor IA (CRISP-DM)", layout="wide")
st.title("Motor IA con Datasets Públicos — CRISP-DM")
st.caption("Espejo Python del Laboratorio IA web · lineal + k-NN + MLP · PM2.5")

uploaded = st.file_uploader("1) Carga el dataset (CSV del módulo web)", type=["csv"])
if not uploaded:
    st.info("Sube el CSV para activar las fases 2–6.")
    st.stop()

df = load_dataset(uploaded)
st.success(f"Dataset: {len(df)} filas · públicas={(df['fuente'] == 'public').sum()} · calibradas={(df['fuente'] == 'calibrated').sum()}")

with st.expander("Fase 1 — Comprensión del negocio", expanded=True):
    st.write("Predecir PM2.5 desde meteorología (Temp, HR, viento, radiación) con datos abiertos + red calibrada. Éxito: RMSE bajo y estable entre dominios.")

with st.expander("Fase 2 — Comprensión de los datos (EDA)", expanded=True):
    st.write(df[FEATURES + ["pm25"]].describe())
    st.write("Correlación Pearson:")
    st.write(df[FEATURES + ["pm25"]].corr(numeric_only=True))
    st.bar_chart(df["pm25"].value_counts(bins=10, sort=False))

with st.expander("Fase 3 — Preparación", expanded=True):
    st.write("Split cronológico 80/20 (sin barajar: respeta el orden temporal), features y target tal cual vienen del CSV.")

if st.button("Fase 4 — Entrenar 3 modelos + grid de hiperparámetros"):
    if len(df) < 12:
        st.error(f"Mínimo 12 filas (hay {len(df)}). Espera al cron horario de la app web.")
        st.stop()
    with st.spinner("Entrenando…"):
        results = run_all(df)
    st.session_state["results"] = results
    st.success(f"Campeón: {results[0]['model']} {results[0]['hyper']} (RMSE={results[0]['metrics']['rmse']:.2f})")

results = st.session_state.get("results")
if results:
    with st.expander("Fase 5 — Evaluación: métricas y validación cruzada", expanded=True):
        st.write(pd.DataFrame([{
            "modelo": r["model"], "hiper": json.dumps(r["hyper"]),
            "R²": round(r["metrics"]["r2"], 3), "RMSE": round(r["metrics"]["rmse"], 2),
            "CV R²": round(r["cv"]["mean_r2"], 3),
            "ruido+%": round(r["noise"]["degrad_pct"] or 0, 1),
            "pub→cal": r["gap"]["pub_to_cal"], "cal→pub": r["gap"]["cal_to_pub"],
        } for r in results]))
        tts = ttests(df)
        st.write("T-Student pareada ref↔hw + Wilcoxon:")
        st.write(pd.DataFrame(tts) if tts else pd.DataFrame([{"aviso": "sin pares suficientes"}]))

    with st.expander("Fase 6 — Despliegue: artefactos", expanded=True):
        st.download_button(
            "Descargar trials.json",
            data=json.dumps(results, ensure_ascii=False, indent=2),
            file_name="trials.json",
            mime="application/json",
        )
        st.caption("Los artefactos por modelo (pesos) se generan con: python train.py --csv <archivo> --out outputs")
        st.info("Paridad con la app web: mismo split, mismas métricas y mismos tests (ver mlTraining.ts).")
