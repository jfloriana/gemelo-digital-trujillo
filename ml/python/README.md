# Motor IA en Python + Streamlit (CRISP-DM) — EcoTwin Trujillo

Espejo offline del **Laboratorio IA** de la app web, con las mismas fases,
métricas y tests. Úsalo para tesis cuando necesites re-entrenar fuera del
navegador o mostrar el pipeline CRISP-DM en Python.

## Requisitos

```bash
cd ml/python
pip install -r requirements.txt
```

## 1) Entrenamiento por CLI

```bash
# El CSV sale del módulo web: Entrenamiento IA → Descargar dataset (CSV)
python train.py --csv dataset_entrenamiento_80filas.csv --out outputs
```

Genera en `outputs/`:

- `trials.json` — 8 combinaciones (lineal + k∈{3,5,7,9} + MLP) con R²/RMSE/MAE/MAPE, CV 5-fold, ruido ±10% y brecha por dominios, ordenadas por RMSE.
- `predicciones_campeon.csv` — real vs predicho del ganador.
- `t_student.json` — T pareada ref↔hw + Wilcoxon por par y variable.

## 2) App Streamlit (las 6 fases CRISP-DM)

```bash
streamlit run app.py
```

Sube el mismo CSV y recorre: negocio → datos (EDA) → preparación →
entrenamiento → evaluación → artefactos.

## Paridad con la web (`src/utils/mlTraining.ts`)

| Pieza | Web | Python |
|---|---|---|
| Split | cronológico 80/20 | `split_chrono` igual |
| Modelos | lineal / kNN k=5 / MLP 4-8-1 | `LinearRegression` / `KNeighborsRegressor` / `MLPRegressor` |
| Métricas | R², RMSE, MAE, MAPE | idem (sklearn) |
| Robustez | CV 5-fold, ruido ±10%, brecha dominios | idem |
| Inferencia | T-Student pareada + Wilcoxon propios | `scipy.stats.ttest_rel` + `wilcoxon` |

Nota: los valores pueden diferir en decimales (solvers distintos), pero el
orden de los modelos y las conclusiones deben coincidir. Si no coinciden,
reporta el caso: es hallazgo, no bug.
