"""Regenera las Tablas 5, 6 y 10 y las Figuras 1 y 3 del artículo a partir de datos/.
Uso: python analisis_descriptivo.py   (ejecutar antes build_dataset.py)"""
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

raiz = Path(__file__).resolve().parent.parent
sal = raiz / "salidas"; sal.mkdir(exist_ok=True)
df = pd.read_csv(raiz / "datos" / "extraccion_40_fuentes.csv", encoding="utf-8-sig")
corpus = df[df.tipo_registro == "corpus"].copy()
N = len(corpus)
assert N == 31, N

corpus["anio"] = corpus["anio"].astype(int)
corpus["escala_cat"] = corpus["escala"].map({"Ciudad": "Ciudad / metropolitana", "Revisión": "Revisión multiescala",
                                             "Micro": "Microescala", "Barrio": "Barrio / distrito / local"})
corpus["tecnologia"] = corpus["clase"].map({"GD": "Gemelo digital", "Rev.": "Revisión / síntesis / perspectiva",
                                            "Monit.": "Monitoreo, sensores y datos observacionales",
                                            "Sim.": "Simulación numérica física o híbrida"})

def frec(serie, orden=None):
    c = serie.value_counts()
    if orden: c = c.reindex(orden)
    return pd.DataFrame({"n": c, "%": (100 * c / N).round(1)})

t5 = pd.concat({
    "Año": frec(corpus["anio"], sorted(corpus["anio"].unique())),
    "Escala espacial": frec(corpus["escala_cat"]),
    "Tecnología primaria": frec(corpus["tecnologia"]),
    "Evalúa SBN": frec(corpus["evalua_sbn"].map({1: "Sí", 0: "No"})),
})
t5.to_csv(sal / "tabla_05_recalculada.csv", encoding="utf-8-sig")
print("TABLA 5\n", t5, "\n")

nombres = {"L1_adquisicion": "1. Adquisición", "L2_asimilacion": "2. Asimilación", "L3_simulacion": "3. Simulación",
           "L4_optimizacion_sbn": "4. Optimización de SBN", "L5_visualizacion": "5. Visualización participativa"}
t6 = pd.DataFrame({"n": [int(corpus[c].sum()) for c in nombres]}, index=list(nombres.values()))
t6["%"] = (100 * t6["n"] / N).round(1)
t6.to_csv(sal / "tabla_06_recalculada.csv", encoding="utf-8-sig")
print("TABLA 6\n", t6, "\n")
capas_por_fuente = corpus[list(nombres)].sum(axis=1)
print("Máximo de capas cubiertas por una fuente:", int(capas_por_fuente.max()))
micro = corpus[corpus.escala == "Micro"]
print("Fuentes de microescala:", len(micro), f"({100*len(micro)/N:.1f} %)\n")

geo = corpus[corpus["pais"].notna()]
ing = geo["grupo_ingreso"].value_counts()
print("Casos geolocalizados:", len(geo), "\n", (ing.astype(str) + " (" + (100 * ing / len(geo)).round(1).astype(str) + " %)"), "\n")

a30 = pd.read_csv(raiz / "datos" / "magnitudes_A30.csv")
m = a30["media_reduccion_C"]; de_intra = a30["de_reportada_C"]
t10 = {"media_de_medias": round(m.mean(), 2), "DE_entre_tipos_(n-1)": round(m.std(ddof=1), 2),
       "min": m.min(), "max": m.max(), "DE_intra_min": de_intra.min(), "DE_intra_max": de_intra.max(),
       "DE_intra_media": round(de_intra.mean(), 2), "razon_DEintra/DEentre": round(de_intra.mean() / m.std(ddof=1), 1),
       "diferencia_max_min": round(m.max() - m.min(), 1)}
pd.Series(t10).to_csv(sal / "tabla_10_recalculada.csv", encoding="utf-8-sig", header=["valor"])
print("TABLA 10 (A30)\n", pd.Series(t10), "\n")

# Figura 1
fig, ax = plt.subplots(1, 3, figsize=(14, 4))
t5.loc["Año"]["n"].plot.bar(ax=ax[0], color="#2a9d8f"); ax[0].set_title("(a) Año de publicación")
t5.loc["Escala espacial"]["n"].plot.barh(ax=ax[1], color="#e9c46a"); ax[1].set_title("(b) Escala espacial")
t5.loc["Tecnología primaria"]["n"].plot.barh(ax=ax[2], color="#264653"); ax[2].set_title("(c) Tecnología primaria")
for a in ax: a.set_xlabel(""); a.set_ylabel("")
ax[0].set_ylabel("Fuentes (n)"); plt.tight_layout(); fig.savefig(sal / "fig1_distribucion_corpus.png", dpi=200); plt.close(fig)

# Figura 3
fig, ax = plt.subplots(1, 2, figsize=(13, 4.5), gridspec_kw={"width_ratios": [3, 2]})
ax[0].errorbar(a30["media_reduccion_C"], range(len(a30)), xerr=a30["de_reportada_C"], fmt="o", color="#264653", capsize=3, label="A30: media ± DE reportada")
ax[0].scatter([1.0], [len(a30)], color="#e76f51", label="A13: ≈1 °C (aire, simulado)")
ax[0].hlines(len(a30) + 1, 3, 4, color="#e9c46a", lw=6, label="A2: hasta 3-4 °C (interior)")
ax[0].set_yticks(list(range(len(a30))) + [len(a30), len(a30) + 1]); ax[0].set_yticklabels(list(a30["tipo_infraestructura"]) + ["A13", "A2"])
ax[0].set_xlabel("Reducción de temperatura (°C)"); ax[0].set_title("(a) Reducción de temperatura"); ax[0].legend(fontsize=8)
ax[1].bar(["A6: PM\n(hasta −30 %)", "A13: dispersión NO₂\n(≈ +10 %)"], [30, 10], color=["#2a9d8f", "#e9c46a"])
ax[1].set_ylabel("Cambio (%)"); ax[1].set_title("(b) Contaminantes")
plt.tight_layout(); fig.savefig(sal / "fig3_magnitudes_reportadas.png", dpi=200); plt.close(fig)
print("Figuras escritas en", sal)
