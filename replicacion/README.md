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
