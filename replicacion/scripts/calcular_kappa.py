"""Acuerdo entre codificadores (kappa de Cohen) para las variables L1-L5 y evalua_sbn.

Uso (desde replicacion/):
    python scripts/calcular_kappa.py
Requiere que protocolo/codificacion_segundo_revisor.csv esté completo (1/0).
"""
import pandas as pd
import numpy as np

VARS = ["L1_adquisicion", "L2_asimilacion", "L3_simulacion",
        "L4_optimizacion_sbn", "L5_visualizacion", "evalua_sbn"]

a = pd.read_csv("datos/extraccion_40_fuentes.csv")
a = a[a.tipo_registro == "corpus"].set_index("codigo")
b = pd.read_csv("protocolo/codificacion_segundo_revisor.csv").set_index("codigo")

def kappa(x, y):
    x, y = np.asarray(x, int), np.asarray(y, int)
    po = (x == y).mean()
    pe = sum(((x == v).mean()) * ((y == v).mean()) for v in (0, 1))
    return np.nan if pe == 1 else (po - pe) / (1 - pe)

filas = []
for v in VARS:
    m = b[v].notna() & (b[v].astype(str).str.strip() != "")
    if m.sum() == 0:
        continue
    x, y = a.loc[b.index[m], v], b.loc[m, v].astype(int)
    filas.append({"variable": v, "n": int(m.sum()),
                  "acuerdo_simple": round(float((x.values == y.values).mean()), 3),
                  "kappa": round(float(kappa(x, y)), 3)})
res = pd.DataFrame(filas)
print(res.to_string(index=False) if len(res) else "Sin codificación del segundo revisor todavía.")
res.to_csv("salidas/kappa_codificadores.csv", index=False)
