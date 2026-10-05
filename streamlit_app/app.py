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

import pandas as pd
import plotly.express as px
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
    st.caption("Comparativa real de modelos — tabla `ai_models`.")

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
