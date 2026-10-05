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
import streamlit as st
from supabase import create_client
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import LeaveOneOut, learning_curve
from sklearn.preprocessing import LabelEncoder

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
    # Tab 2: curva de aprendizaje real (sklearn.learning_curve) sobre
    # los datos reales de zonas — muestra cómo mejora el modelo al
    # agregar más datos de entrenamiento.
    # ------------------------------------------------------------------
    with tab_curve:
        st.caption(
            "Curva de aprendizaje calculada con `sklearn.model_selection.learning_curve` "
            "sobre los datos reales de `urban_zones`, prediciendo **baseline_pm25** a partir "
            "de temperatura, cobertura arbórea, densidad edificada y población objetivo."
        )
        feature_cols = ["baseline_temp", "tree_cover", "built_density", "target_population"]
        target_col = "baseline_pm25"
        available = [c for c in feature_cols if c in zones.columns]

        if zones.empty or len(zones) < 6 or not available:
            st.warning(
                "Se necesitan al menos ~6 zonas con esas columnas para trazar una curva "
                "de aprendizaje con validación cruzada."
            )
        else:
            df = zones.dropna(subset=available + [target_col])
            X = df[available].to_numpy(dtype=float)
            y = df[target_col].to_numpy(dtype=float)

            algo_curve = st.radio(
                "Algoritmo", ["Regresión Lineal", "Random Forest"],
                horizontal=True, key="curve_algo",
            )
            estimator = (
                LinearRegression() if algo_curve == "Regresión Lineal"
                else RandomForestRegressor(n_estimators=100, random_state=42)
            )

            cv_folds = min(5, len(df))
            train_sizes, train_scores, test_scores = learning_curve(
                estimator, X, y, cv=cv_folds,
                train_sizes=np.linspace(0.3, 1.0, 6),
                scoring="r2",
            )
            curve_df = pd.DataFrame({
                "n_muestras": np.concatenate([train_sizes, train_sizes]),
                "R²": np.concatenate([train_scores.mean(axis=1), test_scores.mean(axis=1)]),
                "conjunto": ["Entrenamiento"] * len(train_sizes) + ["Validación"] * len(train_sizes),
            })
            fig = px.line(
                curve_df, x="n_muestras", y="R²", color="conjunto", markers=True,
                title=f"Curva de aprendizaje — {algo_curve} (CV={cv_folds} folds)",
            )
            fig.update_yaxes(range=[min(-0.5, curve_df["R²"].min()), 1.05])
            st.plotly_chart(fig, use_container_width=True)
            st.caption(
                "Con pocas zonas el R² de validación es ruidoso — esta curva ilustra el "
                "comportamiento esperado al crecer el dataset (más zonas/sensores), no una "
                "garantía de desempeño en producción."
            )

    # ------------------------------------------------------------------
    # Tab 3: entrenamiento en vivo sobre datos reales de zonas
    # ------------------------------------------------------------------
    with tab_train:
        st.caption(
            "Entrena un modelo real, en el momento, sobre los datos actuales de "
            "`urban_zones` (sin guardarlo ni escribir en la base de datos)."
        )
        all_features = [
            "baseline_temp", "tree_cover", "built_density",
            "target_population", "vulnerable_population", "vulnerability_level",
        ]
        available_features = [c for c in all_features if c in zones.columns]
        target_options = [c for c in ["baseline_pm25", "baseline_temp"] if c in zones.columns]

        if zones.empty or len(zones) < 6:
            st.warning("Se necesitan al menos ~6 zonas para entrenar con validación cruzada confiable.")
        else:
            col_a, col_b = st.columns(2)
            with col_a:
                target_live = st.selectbox("Variable a predecir", target_options, key="train_target")
            with col_b:
                algo_live = st.selectbox(
                    "Algoritmo",
                    ["Regresión Lineal", "Random Forest", "Gradient Boosting"],
                    key="train_algo",
                )
            feature_choices = [c for c in available_features if c != target_live]
            selected_features = st.multiselect(
                "Variables predictoras (features)", feature_choices,
                default=feature_choices, key="train_features",
            )

            if st.button("🚀 Entrenar ahora", use_container_width=True) and selected_features:
                df = zones.dropna(subset=selected_features + [target_live]).copy()
                X_df = df[selected_features].copy()
                if "vulnerability_level" in X_df.columns:
                    X_df["vulnerability_level"] = LabelEncoder().fit_transform(
                        X_df["vulnerability_level"].astype(str)
                    )
                X = X_df.to_numpy(dtype=float)
                y = df[target_live].to_numpy(dtype=float)

                if len(df) < 4:
                    st.error("Muy pocas zonas con datos completos para estas variables.")
                else:
                    if algo_live == "Regresión Lineal":
                        model = LinearRegression()
                    elif algo_live == "Random Forest":
                        model = RandomForestRegressor(n_estimators=150, random_state=42)
                    else:
                        model = GradientBoostingRegressor(random_state=42)

                    # Dataset pequeño (zonas) -> Leave-One-Out CV para métricas honestas
                    loo = LeaveOneOut()
                    y_pred_cv = np.zeros_like(y)
                    for train_idx, test_idx in loo.split(X):
                        model.fit(X[train_idx], y[train_idx])
                        y_pred_cv[test_idx] = model.predict(X[test_idx])

                    r2_cv = r2_score(y, y_pred_cv)
                    rmse_cv = float(np.sqrt(mean_squared_error(y, y_pred_cv)))
                    mae_cv = mean_absolute_error(y, y_pred_cv)

                    # modelo final entrenado con TODOS los datos, para importancia de variables
                    model.fit(X, y)
                    st.session_state["oe3_trained_model"] = model
                    st.session_state["oe3_trained_features"] = selected_features
                    st.session_state["oe3_trained_target"] = target_live
                    st.session_state["oe3_trained_algo"] = algo_live

                    c1, c2, c3 = st.columns(3)
                    c1.metric("R² (Leave-One-Out CV)", f"{r2_cv:.3f}")
                    c2.metric("RMSE (CV)", f"{rmse_cv:.3f}")
                    c3.metric("MAE (CV)", f"{mae_cv:.3f}")

                    fig = px.scatter(
                        x=y, y=y_pred_cv,
                        labels={"x": f"{target_live} real", "y": f"{target_live} predicho (CV)"},
                        title="Predicho vs. real (validación Leave-One-Out)",
                    )
                    lims = [min(y.min(), y_pred_cv.min()), max(y.max(), y_pred_cv.max())]
                    fig.add_trace(go.Scatter(x=lims, y=lims, mode="lines",
                                              line=dict(dash="dash", color="gray"), name="ideal"))
                    st.plotly_chart(fig, use_container_width=True)
                    st.success(
                        f"Entrenado con {len(df)} zonas, {len(selected_features)} variables. "
                        "Ve a la pestaña **Importancia de variables** para ver qué pesó más."
                    )
            elif not selected_features:
                st.info("Selecciona al menos una variable predictora.")

    # ------------------------------------------------------------------
    # Tab 4: importancia de variables del último modelo entrenado
    # ------------------------------------------------------------------
    with tab_imp:
        trained = st.session_state.get("oe3_trained_model")
        if trained is None:
            st.info("Entrena un modelo en la pestaña **Entrenar modelo en vivo** primero.")
        else:
            feats = st.session_state["oe3_trained_features"]
            target_live = st.session_state["oe3_trained_target"]
            algo_live = st.session_state["oe3_trained_algo"]
            st.caption(f"Modelo actual: **{algo_live}** prediciendo **{target_live}**.")

            if hasattr(trained, "feature_importances_"):
                imp = pd.DataFrame({
                    "variable": feats, "importancia": trained.feature_importances_,
                }).sort_values("importancia", ascending=True)
                fig = px.bar(
                    imp, x="importancia", y="variable", orientation="h",
                    title="Importancia de variables (impurity-based)",
                )
                st.plotly_chart(fig, use_container_width=True)
            elif hasattr(trained, "coef_"):
                imp = pd.DataFrame({
                    "variable": feats, "coeficiente": trained.coef_,
                }).sort_values("coeficiente", key=abs, ascending=True)
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
