# Material de replicación de la revisión integradora

Contenido
- `datos/extraccion_40_fuentes.csv`: tabla de extracción de las 40 fuentes.
- `datos/magnitudes_A30.csv`: medias y DE reportadas por Kumar et al. (2024), Tabla 9 del artículo.
- `datos/tablas_articulo/`: las Tablas 1-4 y 6-10 del artículo en CSV (copia de `public/thesis/tables`).
- `protocolo/protocolo_revision.md`: cadenas de búsqueda, criterios y variables (Tablas 1-3).
- `scripts/build_dataset.py` y `scripts/analisis_descriptivo.py`: regeneran el CSV, las Tablas 5, 6 y 10 y las Figuras 1 y 3 (en `salidas/`).

Replicación
```
pip install -r requirements.txt
cd scripts
python build_dataset.py ../datos/tablas_articulo
python analisis_descriptivo.py
```
Las versiones de `requirements.txt` son con las que se verificó la ejecución (Python 3.13.18); los scripts usan solo funciones básicas y funcionan con Python 3.10 o superior.

Límites: la Figura 2 es un diagrama dibujado a mano y no se regenera. No se registraron fecha ni conteos de las búsquedas.

Segundo codificador (modelo de IA)
- `protocolo/codificacion_segundo_revisor.csv` lo codificó **Claude, un modelo de IA, no una persona**. Es una comprobación de consistencia con otro lector, no un acuerdo entre dos revisores humanos.
- Codificó L1-L5 y `evalua_sbn` leyendo solo título y resumen de cada fuente, obtenidos de OpenAlex, Crossref y arXiv (columna `fuente_resumen`). No consultó `datos/extraccion_40_fuentes.csv` antes de terminar, con una excepción: al revisar el encabezado vio por error las filas A1 y A2. Ambas llevan un aviso en la columna `nota` y conviene calcular el kappa también sin ellas.
- Quedaron en blanco 9 de las 31 fuentes (A5, A9, A12, A13, A21, A22, A25, A27, A29) porque no se localizó la fuente o su resumen no era accesible; el motivo está en `nota`. El kappa se calcula sobre las 22 restantes.
- Resultado: `python scripts/calcular_kappa.py` escribe `salidas/kappa_codificadores.csv`.

Registro de búsquedas
- `protocolo/registro_busquedas.csv`: solo arXiv fue ejecutada (2026-11-01, API pública). Scopus, Web of Science y ScienceDirect siguen en blanco y deben ejecutarse con acceso institucional.
