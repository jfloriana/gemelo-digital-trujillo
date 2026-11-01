"""Construye datos/extraccion_40_fuentes.csv a partir de las tablas 4, 6 y 7 del artículo
(CSV exportados de la aplicación: public/thesis/tables). Uso: python build_dataset.py <carpeta_tablas>"""
import csv, re, sys
from pathlib import Path

tablas = Path(sys.argv[1] if len(sys.argv) > 1 else "../datos/tablas_articulo")
out = Path(__file__).resolve().parent.parent / "datos" / "extraccion_40_fuentes.csv"

def leer(nombre):
    with open(tablas / nombre, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

# Casos de estudio que figuran en la descripción de cada fuente (Tabla 4).
# Grupo de ingreso: clasificación del Banco Mundial (V8 de la Tabla 3); revisar contra la fuente original.
CASOS = {
    "A5":  ("Elizabeth, NJ", "Estados Unidos", "Alto"),
    "A7":  ("Padua", "Italia", "Alto"),
    "A9":  ("Columbus, GA", "Estados Unidos", "Alto"),
    "A10": ("Delhi", "India", "Medio-bajo"),
    "A12": ("Toronto, Phoenix, Miami", "Canadá y Estados Unidos", "Alto"),
    "A13": ("Eindhoven", "Países Bajos", "Alto"),
    "A15": ("Ciudades de India", "India", "Medio-bajo"),
    "A17": ("São Paulo", "Brasil", "Medio-alto"),
    "A18": ("Toronto", "Canadá", "Alto"),
    "A20": ("Dublín", "Irlanda", "Alto"),
    "A26": ("Singapur", "Singapur", "Alto"),
    "A29": ("Bolonia", "Italia", "Alto"),
    "A31": ("Oporto", "Portugal", "Alto"),
}

def codigos(texto):
    return set(re.findall(r"A\d+", texto))

capas = {}
for fila in leer("tabla_06.csv"):
    n = int(fila["Capa"][0])
    capas[n] = codigos(fila["Fuentes"])
sbn = {fila["Código"] for fila in leer("tabla_07.csv")}

campos = ["codigo", "referencia", "anio", "tipo_registro", "escala", "clase", "tecnologia_enfoque",
          "L1_adquisicion", "L2_asimilacion", "L3_simulacion", "L4_optimizacion_sbn", "L5_visualizacion",
          "evalua_sbn", "caso_estudio", "pais", "grupo_ingreso"]
filas = []
for f in leer("tabla_04.csv"):
    cod = f["Código"].replace("†", "").strip()
    ref = f["Referencia"].replace("‡", "").strip()
    m = re.search(r"(\d{4}|s\. f\.)\s*$", ref)
    anio = m.group(1) if m else ""
    if cod == "—":
        tipo, cod = "complementaria", ""
    elif "†" in f["Código"]:
        tipo = "contextual"
    else:
        tipo = "corpus"
    en_corpus = tipo == "corpus"
    caso = CASOS.get(cod, ("", "", "")) if en_corpus else ("", "", "")
    filas.append({
        "codigo": cod, "referencia": ref, "anio": anio, "tipo_registro": tipo,
        "escala": f["Escala"], "clase": f["Clase"], "tecnologia_enfoque": f["Tecnología / enfoque principal"],
        **{k: (int(en_corpus and cod in capas[i + 1])) if en_corpus else "" for i, k in enumerate(
            ["L1_adquisicion", "L2_asimilacion", "L3_simulacion", "L4_optimizacion_sbn", "L5_visualizacion"])},
        "evalua_sbn": (int(cod in sbn)) if en_corpus else "",
        "caso_estudio": caso[0], "pais": caso[1], "grupo_ingreso": caso[2],
    })
out.parent.mkdir(exist_ok=True)
with open(out, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=campos); w.writeheader(); w.writerows(filas)
print(f"{len(filas)} filas escritas en {out}")
