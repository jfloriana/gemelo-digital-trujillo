"""
Gemelo Digital Microescala Trujillo — Panel Streamlit (motor de datos)
=======================================================================
Simula el "motor" de la aplicación web (React/Vite) mostrando EN VIVO los
mismos datos que ya expone la app: zonas (OE1), red IoT (OE2), modelos de
IA (OE3), catálogo NbS (OE4) y validación de tesis (OE5).

Es un panel de SOLO LECTURA, independiente del proyecto React — no lo
modifica ni depende de él. Se conecta a la MISMA base de datos Supabase
(con la clave pública anónima, igual que el frontend), así que cualquier
cambio hecho en la app web (o en el panel de administración de Supabase)
se refleja aquí también.

Ejecutar:
    pip install -r requirements.txt
    streamlit run app.py
"""

from __future__ import annotations

import os
from datetime import datetime

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st
from supabase import create_client

# ----------------------------------------------------------------------
# Configuración / conexión a Supabase
# ----------------------------------------------------------------------

st.set_page_config(
    page_title="Gemelo Digital Trujillo — Motor de Datos",
    page_icon="🌳",
    layout="wide",
)


def _get_credential(key: str) -> str | None:
    """Busca la credencial en st.secrets primero, luego en variables de entorno."""
    try:
        if key in st.secrets:
            return str(st.secrets[key])
    except Exception:
        pass
    return os.environ.get(key)


SUPABASE_URL = _get_credential("SUPABASE_URL") or _get_credential("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = _get_credential("SUPABASE_ANON_KEY") or _get_credential("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    st.error(
        "**Faltan credenciales de Supabase.**\n\n"
        "Crea el archivo `.streamlit/secrets.toml` (copia `.streamlit/secrets.toml.example`) "
        "con:\n\n"
        "```toml\n"
        'SUPABASE_URL = "https://tu-proyecto.supabase.co"\n'
        'SUPABASE_ANON_KEY = "tu-clave-publica-anon"\n'
        "```\n\n"
        "Usa la **misma URL y clave anónima** (`anon public`) que ya usa la app web — "
        "están en `.env.local` del proyecto principal, bajo `VITE_SUPABASE_URL` y "
        "`VITE_SUPABASE_ANON_KEY`. Es una clave de solo lectura pública, segura de usar aquí."
    )
    st.stop()

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ----------------------------------------------------------------------
# Cliente del motor de IA (microservicio FastAPI aparte — fastapi_engine/)
# ----------------------------------------------------------------------

AI_ENGINE_URL = (_get_credential("AI_ENGINE_URL") or "http://localhost:8000").rstrip("/")


def ai_engine_health() -> bool:
    try:
        r = requests.get(f"{AI_ENGINE_URL}/health", timeout=2)
        return r.status_code == 200
    except requests.RequestException:
        return False


def ai_engine_get(path: str, params: dict | None = None) -> dict:
    r = requests.get(f"{AI_ENGINE_URL}{path}", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def ai_engine_post(path: str, payload: dict) -> dict:
    r = requests.post(f"{AI_ENGINE_URL}{path}", json=payload, timeout=60)
    r.raise_for_status()
    return r.json()


# ----------------------------------------------------------------------
# Carga de datos (mismas tablas que useSupabaseData.ts en el frontend)
# ----------------------------------------------------------------------

@st.cache_data(ttl=30, show_spinner=False)
def load_zones() -> pd.DataFrame:
    r = supabase.table("urban_zones").select("*").order("id").execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=30, show_spinner=False)
def load_sensors() -> pd.DataFrame:
    r = supabase.table("sensor_nodes").select("*").order("code").execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=30, show_spinner=False)
def load_models() -> pd.DataFrame:
    r = supabase.table("ai_models").select("*").order("r2", desc=True).execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=30, show_spinner=False)
def load_nbs() -> pd.DataFrame:
    r = supabase.table("nbs_interventions").select("*").order("id").execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=30, show_spinner=False)
def load_objectives() -> pd.DataFrame:
    r = supabase.table("thesis_objectives").select("*").order("code").execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=30, show_spinner=False)
def load_objective_metrics() -> pd.DataFrame:
    r = supabase.table("thesis_objective_metrics").select("*").execute()
    return pd.DataFrame(r.data)


# ----------------------------------------------------------------------
# Sidebar
# ----------------------------------------------------------------------

st.sidebar.title("🌳 Gemelo Digital Trujillo")
st.sidebar.caption("Motor de datos — panel Streamlit de solo lectura")

if st.sidebar.button("🔄 Refrescar datos", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

st.sidebar.markdown("---")
page = st.sidebar.radio(
    "Módulo",
    [
        "📊 Resumen General",
        "🗺️ OE1 · Diagnóstico de Zonas",
        "📡 OE2 · Red IoT & Sensores",
        "🤖 OE3 · Modelos de IA",
        "🌿 OE4 · Catálogo NbS",
        "✅ OE5 · Validación de Tesis",
    ],
)
st.sidebar.markdown("---")
st.sidebar.caption(
    "Conectado a la misma base de datos Supabase que usa la app web "
    "(react-vite). Clave anónima de solo lectura."
)
st.sidebar.caption(f"Última carga: {datetime.now().strftime('%H:%M:%S')}")

st.sidebar.markdown("---")
_engine_ok = ai_engine_health()
if _engine_ok:
    st.sidebar.success(f"🧠 Motor de IA (FastAPI) conectado\n\n`{AI_ENGINE_URL}`")
else:
    st.sidebar.error(
        f"🧠 Motor de IA (FastAPI) sin conexión\n\n`{AI_ENGINE_URL}`\n\n"
        "Corre: `cd fastapi_engine && uvicorn main:app --reload --port 8000`"
    )

zones = load_zones()
sensors = load_sensors()
models = load_models()
nbs = load_nbs()
objectives = load_objectives()
metrics = load_objective_metrics()


# ----------------------------------------------------------------------
# Página 1: Resumen general
# ----------------------------------------------------------------------

if page.startswith("📊"):
    st.title("Resumen General del Gemelo Digital")
    st.caption("Vista agregada equivalente al Hub 3D de la app web (`digital_twin`).")

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Zonas monitoreadas", len(zones))
    c2.metric("Sensores IoT", len(sensors))
    online = int((sensors["status"] == "online").sum()) if not sensors.empty else 0
    c3.metric("Sensores en línea", f"{online}/{len(sensors)}")
    pop = int(zones["target_population"].sum()) if not zones.empty else 0
    c4.metric("Población cubierta", f"{pop:,}")
    done = int(objectives["status"].isin(["Completado", "Validado"]).sum()) if not objectives.empty else 0
    c5.metric("Objetivos de tesis OK", f"{done}/{len(objectives)}")

    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if not zones.empty:
            fig = px.bar(
                zones.sort_values("baseline_temp", ascending=False),
                x="name", y="baseline_temp", color="department",
                title="Temperatura base por zona (°C)",
                labels={"name": "Zona", "baseline_temp": "°C"},
            )
            fig.update_layout(xaxis_tickangle=-35, showlegend=True)
            st.plotly_chart(fig, use_container_width=True)
    with col2:
        if not zones.empty:
            fig = px.bar(
                zones.sort_values("baseline_pm25", ascending=False),
                x="name", y="baseline_pm25", color="vulnerability_level",
                title="PM2.5 base por zona (µg/m³)",
                labels={"name": "Zona", "baseline_pm25": "µg/m³"},
            )
            fig.update_layout(xaxis_tickangle=-35)
            st.plotly_chart(fig, use_container_width=True)

    if not models.empty:
        best = models.iloc[0]
        st.info(
            f"**Mejor modelo IA actual:** {best['name']} ({best['architecture']}) — "
            f"$R^2$ = {best['r2']:.4f} · inferencia {best['inference_time_ms']} ms"
        )


# ----------------------------------------------------------------------
# Página 2: OE1 Diagnóstico de zonas
# ----------------------------------------------------------------------

elif page.startswith("🗺️"):
    st.title("OE1 · Diagnóstico de Microescala")
    st.caption("Línea base ambiental de cada zona urbana — tabla `urban_zones`.")

    if zones.empty:
        st.warning("No hay zonas cargadas.")
    else:
        cols = [
            "name", "district", "department", "vulnerability_level",
            "baseline_temp", "baseline_pm25", "tree_cover", "built_density",
            "target_population", "vulnerable_population", "primary_pollution_source",
        ]
        st.dataframe(zones[cols], use_container_width=True, hide_index=True)

        st.markdown("#### Detalle de una zona")
        zone_name = st.selectbox("Selecciona una zona", zones["name"].tolist())
        z = zones[zones["name"] == zone_name].iloc[0]
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Temp. base", f"{z['baseline_temp']} °C")
        c2.metric("PM2.5 base", f"{z['baseline_pm25']} µg/m³")
        c3.metric("Cobertura arbórea", f"{z['tree_cover']}%")
        c4.metric("Densidad edificada", f"{z['built_density']}%")
        st.write(f"**Fuente principal de contaminación:** {z['primary_pollution_source']}")
        st.write(f"**Descripción:** {z['description']}")


# ----------------------------------------------------------------------
# Página 3: OE2 Red IoT & Sensores
# ----------------------------------------------------------------------

elif page.startswith("📡"):
    st.title("OE2 · Arquitectura IoT y Calibración en 2 Etapas")
    st.caption("Telemetría de los nodos sensores — tabla `sensor_nodes`.")

    if sensors.empty:
        st.warning("No hay sensores cargados.")
    else:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total sensores", len(sensors))
        c2.metric("En línea", int((sensors["status"] == "online").sum()))
        c3.metric("En alerta", int((sensors["status"] == "warning").sum()))
        c4.metric("Fuera de línea", int((sensors["status"] == "offline").sum()))

        avg_raw = sensors["r2_score_raw"].mean()
        avg_cal = sensors["r2_score_calibrated"].mean()
        st.markdown(
            f"**Calibración higroscópica 2 etapas (Zhivkov et al.):** "
            f"$R^2$ crudo promedio **{avg_raw:.2f}** → $R^2$ calibrado promedio **{avg_cal:.2f}**"
        )

        fig = px.bar(
            sensors.melt(
                id_vars=["code"],
                value_vars=["r2_score_raw", "r2_score_calibrated"],
                var_name="etapa", value_name="r2",
            ),
            x="code", y="r2", color="etapa", barmode="group",
            title="R² por sensor: crudo vs. calibrado",
            labels={"code": "Sensor", "r2": "R²"},
        )
        st.plotly_chart(fig, use_container_width=True)

        st.dataframe(
            sensors[[
                "code", "name", "zone_name", "sensor_type", "calibration_status",
                "status", "r2_score_raw", "r2_score_calibrated", "battery_pct", "rssi",
            ]],
            use_container_width=True, hide_index=True,
        )

        st.markdown("#### Última lectura de un sensor")
        sensor_code = st.selectbox("Sensor", sensors["code"].tolist())
        s = sensors[sensors["code"] == sensor_code].iloc[0]
        if isinstance(s.get("last_reading"), dict) and s["last_reading"]:
            lr = s["last_reading"]
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Temp.", f"{lr.get('temperature', '—')} °C")
            c2.metric("PM2.5", f"{lr.get('pm25', '—')} µg/m³")
            c3.metric("Humedad", f"{lr.get('humidity', '—')} %")
            c4.metric("AQI", f"{lr.get('aqiIndex', '—')} ({lr.get('aqiCategory', '—')})")
            with st.expander("JSON completo de la última lectura"):
                st.json(lr)
        else:
            st.caption("Sin lectura reciente registrada para este sensor.")


# ----------------------------------------------------------------------
# Página 4: OE3 Modelos de IA
# ----------------------------------------------------------------------

elif page.startswith("🤖"):
    st.title("OE3 · Modelos de Inteligencia Artificial & Benchmarks")
    st.caption(
        "Comparativa de modelos publicados (`ai_models`) + laboratorio de entrenamiento "
        "en vivo sobre los datos reales de zonas (`urban_zones`)."
    )

    tab_cmp, tab_curve, tab_train, tab_imp = st.tabs([
        "📊 Comparación de modelos",
        "📈 Curva de aprendizaje",
        "🧪 Entrenar modelo en vivo",
        "🔍 Importancia de variables",
    ])

    # ------------------------------------------------------------------
    # Tab 1: comparación de modelos (datos reales de ai_models)
    # ------------------------------------------------------------------
    with tab_cmp:
        if models.empty:
            st.warning("No hay modelos cargados.")
        else:
            R2_TARGET = 0.95
            best = models.iloc[0]
            passes = best["r2"] >= R2_TARGET
            st.metric(
                "Mejor modelo vs. umbral de tesis (R² ≥ 0.95)",
                f"{best['name']}: {best['r2']:.4f}",
                delta="Cumple ✅" if passes else "No cumple ⚠️",
                delta_color="normal" if passes else "inverse",
            )

            fig = px.bar(
                models, x="name", y="r2", color="status",
                title="R² por modelo",
                labels={"name": "Modelo", "r2": "R²"},
            )
            fig.add_hline(y=R2_TARGET, line_dash="dash", line_color="red",
                           annotation_text="Umbral R² = 0.95")
            st.plotly_chart(fig, use_container_width=True)

            st.dataframe(
                models[[
                    "name", "architecture", "reference_author", "year", "r2", "rmse",
                    "mae", "mape", "inference_time_ms", "spatial_resolution", "status",
                ]],
                use_container_width=True, hide_index=True,
            )

            st.markdown("#### Comparación multi-métrica normalizada")
            metric_cols = ["r2", "rmse", "mae", "mape", "inference_time_ms"]
            norm = models[["name"] + metric_cols].copy()
            for col in metric_cols:
                lo, hi = norm[col].min(), norm[col].max()
                if hi == lo:
                    norm[col] = 1.0
                elif col == "r2":
                    norm[col] = (norm[col] - lo) / (hi - lo)
                else:
                    # para errores/tiempo, menor es mejor -> invertir escala
                    norm[col] = 1 - (norm[col] - lo) / (hi - lo)

            fig_radar = go.Figure()
            for _, row in norm.iterrows():
                fig_radar.add_trace(go.Scatterpolar(
                    r=[row[c] for c in metric_cols] + [row[metric_cols[0]]],
                    theta=["R²", "RMSE", "MAE", "MAPE", "Latencia"] + ["R²"],
                    fill="toself", name=row["name"],
                ))
            fig_radar.update_layout(
                polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
                title="Perfil normalizado por modelo (1.0 = mejor en esa métrica)",
                showlegend=True,
            )
            st.plotly_chart(fig_radar, use_container_width=True)

    # ------------------------------------------------------------------
    # Tab 2: curva de aprendizaje — calculada por el motor FastAPI
    # (fastapi_engine/main.py), no en este proceso.
    # ------------------------------------------------------------------
    with tab_curve:
        st.caption(
            "Curva de aprendizaje calculada por el **motor de IA (FastAPI)** — "
            f"`GET {AI_ENGINE_URL}/api/learning-curve` — sobre los datos reales de "
            "`urban_zones`, prediciendo **baseline_pm25** a partir de temperatura, "
            "cobertura arbórea, densidad edificada y población objetivo."
        )
        if not _engine_ok:
            st.error(
                "El motor de IA (FastAPI) no está disponible. Corre `uvicorn main:app "
                "--reload --port 8000` dentro de `fastapi_engine/` y refresca esta página."
            )
        else:
            algo_curve_label = st.radio(
                "Algoritmo", ["Regresión Lineal", "Random Forest", "Gradient Boosting"],
                horizontal=True, key="curve_algo",
            )
            algo_curve = {
                "Regresión Lineal": "linear",
                "Random Forest": "random_forest",
                "Gradient Boosting": "gradient_boosting",
            }[algo_curve_label]

            try:
                data = ai_engine_get("/api/learning-curve", {"algorithm": algo_curve, "target": "baseline_pm25"})
            except requests.RequestException as exc:
                st.error(f"Error consultando el motor de IA: {exc}")
            else:
                curve_df = pd.DataFrame({
                    "n_muestras": data["train_sizes"] + data["train_sizes"],
                    "R²": data["train_r2"] + data["val_r2"],
                    "conjunto": (
                        ["Entrenamiento"] * len(data["train_sizes"])
                        + ["Validación"] * len(data["train_sizes"])
                    ),
                })
                fig = px.line(
                    curve_df, x="n_muestras", y="R²", color="conjunto", markers=True,
                    title=f"Curva de aprendizaje — {algo_curve_label} (CV={data['cv_folds']} folds)",
                )
                fig.update_yaxes(range=[min(-0.5, curve_df["R²"].min()), 1.05])
                st.plotly_chart(fig, use_container_width=True)
                st.caption(
                    "Con pocas zonas el R² de validación es ruidoso — esta curva ilustra el "
                    "comportamiento esperado al crecer el dataset (más zonas/sensores), no una "
                    "garantía de desempeño en producción."
                )

    # ------------------------------------------------------------------
    # Tab 3: entrenamiento en vivo — delegado al motor FastAPI
    # (POST /api/train). Este panel solo pinta la respuesta.
    # ------------------------------------------------------------------
    with tab_train:
        st.caption(
            "Entrena un modelo real, en el momento, llamando al **motor de IA (FastAPI)** "
            f"— `POST {AI_ENGINE_URL}/api/train` — que lee `urban_zones` de Supabase "
            "y entrena ahí mismo (nada se guarda ni se escribe en la base de datos)."
        )
        all_features = [
            "baseline_temp", "tree_cover", "built_density",
            "target_population", "vulnerable_population", "vulnerability_level",
        ]
        available_features = [c for c in all_features if c in zones.columns]
        target_options = [c for c in ["baseline_pm25", "baseline_temp"] if c in zones.columns]

        if not _engine_ok:
            st.error(
                "El motor de IA (FastAPI) no está disponible. Corre `uvicorn main:app "
                "--reload --port 8000` dentro de `fastapi_engine/` y refresca esta página."
            )
        elif zones.empty or len(zones) < 6:
            st.warning("Se necesitan al menos ~6 zonas para entrenar con validación cruzada confiable.")
        else:
            col_a, col_b = st.columns(2)
            with col_a:
                target_live = st.selectbox("Variable a predecir", target_options, key="train_target")
            with col_b:
                algo_live_label = st.selectbox(
                    "Algoritmo",
                    ["Regresión Lineal", "Random Forest", "Gradient Boosting"],
                    key="train_algo",
                )
            algo_live = {
                "Regresión Lineal": "linear",
                "Random Forest": "random_forest",
                "Gradient Boosting": "gradient_boosting",
            }[algo_live_label]

            feature_choices = [c for c in available_features if c != target_live]
            selected_features = st.multiselect(
                "Variables predictoras (features)", feature_choices,
                default=feature_choices, key="train_features",
            )

            if st.button("🚀 Entrenar ahora (vía FastAPI)", use_container_width=True) and selected_features:
                try:
                    result = ai_engine_post("/api/train", {
                        "target": target_live,
                        "features": selected_features,
                        "algorithm": algo_live,
                    })
                except requests.HTTPError as exc:
                    detail = exc.response.json().get("detail", str(exc)) if exc.response is not None else str(exc)
                    st.error(f"El motor de IA rechazó la solicitud: {detail}")
                except requests.RequestException as exc:
                    st.error(f"No se pudo contactar al motor de IA: {exc}")
                else:
                    st.session_state["oe3_train_result"] = result

            result = st.session_state.get("oe3_train_result")
            if result:
                c1, c2, c3 = st.columns(3)
                c1.metric("R² (Leave-One-Out CV)", f"{result['r2']:.3f}")
                c2.metric("RMSE (CV)", f"{result['rmse']:.3f}")
                c3.metric("MAE (CV)", f"{result['mae']:.3f}")

                y = np.array(result["y_true"])
                y_pred_cv = np.array(result["y_pred"])
                fig = px.scatter(
                    x=y, y=y_pred_cv,
                    labels={"x": f"{result['target']} real", "y": f"{result['target']} predicho (CV)"},
                    title="Predicho vs. real (validación Leave-One-Out, vía motor FastAPI)",
                )
                lims = [min(y.min(), y_pred_cv.min()), max(y.max(), y_pred_cv.max())]
                fig.add_trace(go.Scatter(x=lims, y=lims, mode="lines",
                                          line=dict(dash="dash", color="gray"), name="ideal"))
                st.plotly_chart(fig, use_container_width=True)
                st.success(
                    f"Entrenado por el motor con {result['n_samples']} zonas, "
                    f"{len(result['features'])} variables. Ve a la pestaña "
                    "**Importancia de variables** para ver qué pesó más."
                )
            elif not selected_features:
                st.info("Selecciona al menos una variable predictora.")

    # ------------------------------------------------------------------
    # Tab 4: importancia de variables — viene directo en la respuesta
    # JSON de POST /api/train (el motor FastAPI ya la calculó).
    # ------------------------------------------------------------------
    with tab_imp:
        result = st.session_state.get("oe3_train_result")
        if result is None:
            st.info("Entrena un modelo en la pestaña **Entrenar modelo en vivo** primero.")
        else:
            st.caption(
                f"Modelo actual: **{result['algorithm']}** prediciendo **{result['target']}** "
                f"— calculado por el motor de IA (FastAPI)."
            )
            feats = result["features"]

            if result.get("feature_importances"):
                imp = pd.DataFrame(
                    sorted(result["feature_importances"].items(), key=lambda kv: kv[1]),
                    columns=["variable", "importancia"],
                )
                fig = px.bar(
                    imp, x="importancia", y="variable", orientation="h",
                    title="Importancia de variables (impurity-based)",
                )
                st.plotly_chart(fig, use_container_width=True)
            elif result.get("coefficients"):
                imp = pd.DataFrame(
                    sorted(result["coefficients"].items(), key=lambda kv: abs(kv[1])),
                    columns=["variable", "coeficiente"],
                )
                fig = px.bar(
                    imp, x="coeficiente", y="variable", orientation="h",
                    title="Coeficientes de la regresión lineal",
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("Este algoritmo no expone importancia de variables directamente.")


# ----------------------------------------------------------------------
# Página 5: OE4 Catálogo NbS
# ----------------------------------------------------------------------

elif page.startswith("🌿"):
    st.title("OE4 · Catálogo de Soluciones Basadas en la Naturaleza")
    st.caption("Intervenciones NbS disponibles para el simulador — tabla `nbs_interventions`.")

    if nbs.empty:
        st.warning("No hay intervenciones NbS cargadas.")
    else:
        fig = px.scatter(
            nbs, x="pm_reduction_percent", y="cooling_capacity_c",
            size="unit_cost_pen", color="type", hover_name="name",
            title="Reducción de PM2.5 vs. enfriamiento por intervención (tamaño = costo S/.)",
            labels={"pm_reduction_percent": "Reducción PM2.5 (%)", "cooling_capacity_c": "Enfriamiento (°C)"},
        )
        st.plotly_chart(fig, use_container_width=True)

        show_cols = [
            "name", "type", "cooling_capacity_c", "pm_reduction_percent",
            "unit_cost_pen", "unit_maintenance_pen_year", "water_retention_l_m2",
            "co2_sequestration_kg_year", "acoustic_damping_db",
        ]
        st.dataframe(nbs[show_cols], use_container_width=True, hide_index=True)

        st.markdown("#### Flora recomendada por intervención")
        for _, row in nbs.iterrows():
            flora = row.get("recommended_flora") or []
            if flora:
                st.write(f"**{row['name']}:** " + ", ".join(flora))


# ----------------------------------------------------------------------
# Página 6: OE5 Validación de tesis
# ----------------------------------------------------------------------

elif page.startswith("✅"):
    st.title("OE5 · Validación de Hipótesis y Cumplimiento de Tesis")
    st.caption("Matriz de objetivos específicos — tablas `thesis_objectives` + `thesis_objective_metrics`.")

    if objectives.empty:
        st.warning("No hay objetivos de tesis cargados.")
    else:
        avg_progress = objectives["progress_percent"].mean()
        st.metric("Avance global de la tesis", f"{avg_progress:.0f}%")

        for _, obj in objectives.iterrows():
            with st.container(border=True):
                c1, c2 = st.columns([4, 1])
                c1.subheader(f"{obj['code']} — {obj['title']}")
                c2.metric("Estado", obj["status"])
                st.progress(int(obj["progress_percent"]) / 100)
                st.caption(obj["summary"])
                obj_metrics = metrics[metrics["objective_code"] == obj["code"]] if not metrics.empty else pd.DataFrame()
                if not obj_metrics.empty:
                    st.dataframe(
                        obj_metrics[["name", "target", "achieved", "compliance"]],
                        use_container_width=True, hide_index=True,
                    )


# ----------------------------------------------------------------------
st.markdown("---")
st.caption(
    "Datos en vivo desde Supabase — mismo backend que la aplicación web "
    "(react-vite, gemelo-digital-trujillo.vercel.app). Este panel no escribe "
    "ni modifica datos: usa la clave pública anónima de solo lectura."
)
