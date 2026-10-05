# Motor de IA — servicio FastAPI

Microservicio independiente que expone el motor de entrenamiento/evaluación
de IA (OE3) como una API REST. El panel Streamlit (`streamlit_app/`) lo
consume por HTTP — simula una arquitectura de microservicios real: el
"motor de IA" vive aparte de la capa de presentación.

- **Solo lectura hacia Supabase.** Usa la misma clave pública `anon` que el
  resto del proyecto. No escribe nada.
- **No entrena nada en segundo plano.** Cada request de `/api/train` o
  `/api/learning-curve` entrena en el momento, sobre los datos actuales de
  `urban_zones`, y devuelve el resultado — no persiste modelos.

## Cómo correrlo

```bash
cd fastapi_engine
pip install -r requirements.txt
cp .env.example .env
# edita .env con SUPABASE_URL y SUPABASE_ANON_KEY (las mismas del proyecto)

uvicorn main:app --reload --port 8000
```

Docs interactivas (Swagger): http://localhost:8000/docs

## Endpoints

- `GET /health` — ping de disponibilidad.
- `GET /api/zones/summary` — cuántas zonas hay y qué columnas/targets están
  disponibles para entrenar.
- `GET /api/learning-curve?algorithm=linear|random_forest|gradient_boosting&target=baseline_pm25`
  — curva de aprendizaje real (`sklearn.learning_curve`) sobre las zonas.
- `POST /api/train` — entrena un modelo en vivo con validación Leave-One-Out:

  ```json
  {
    "target": "baseline_pm25",
    "features": ["baseline_temp", "tree_cover", "built_density"],
    "algorithm": "random_forest"
  }
  ```

  Devuelve métricas (R², RMSE, MAE), predicciones de validación cruzada e
  importancia de variables (o coeficientes, según el algoritmo).

## Consumido por

El panel Streamlit (`streamlit_app/app.py`, pestañas de OE3 "Curva de
aprendizaje", "Entrenar modelo en vivo" e "Importancia de variables") llama
a esta API en vez de ejecutar scikit-learn en su propio proceso. Configura
la URL del motor en `streamlit_app/.streamlit/secrets.toml` con
`AI_ENGINE_URL = "http://localhost:8000"` (es el valor por defecto si no se
especifica).
