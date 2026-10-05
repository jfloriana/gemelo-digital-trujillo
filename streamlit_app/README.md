# Panel Streamlit — Motor de Datos del Gemelo Digital Trujillo

Dashboard independiente que simula ser el "motor" de la aplicación: muestra
en vivo los mismos datos que ya expone la app web (React/Vite), leyendo
directamente de la **misma base de datos Supabase**.

- **Solo lectura.** Usa la clave pública `anon` (la misma que el frontend),
  nunca la `service_role`. No puede escribir ni modificar nada.
- **No toca el proyecto React.** Es una carpeta aparte, con sus propias
  dependencias (Python), que puedes ejecutar en paralelo o borrar sin
  afectar la app web.
- **Módulos:** Resumen general, OE1 Diagnóstico de zonas, OE2 Red IoT &
  calibración, OE3 Modelos de IA, OE4 Catálogo NbS, OE5 Validación de tesis
  — el mismo mapa de objetivos específicos que la app web.

## Cómo correrlo

```bash
cd streamlit_app
pip install -r requirements.txt

# copia el ejemplo y pega tus credenciales (las mismas de .env.local del proyecto raíz)
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# edita .streamlit/secrets.toml con SUPABASE_URL y SUPABASE_ANON_KEY

streamlit run app.py
```

Se abre en `http://localhost:8501`.

## Credenciales

Necesitas `SUPABASE_URL` y `SUPABASE_ANON_KEY` — las mismas que usa la app
web (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` en el `.env.local` de la
raíz del proyecto). Son públicas por diseño (clave `anon`, solo lectura por
las políticas RLS de Supabase) — no son secretas en el mismo sentido que la
`service_role` o la `GEMINI_API_KEY`.

También puedes pasarlas como variables de entorno en vez de `secrets.toml`:

```bash
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_ANON_KEY="tu-clave-anon"
streamlit run app.py
```

## Desplegarlo (opcional)

Funciona tal cual en [Streamlit Community Cloud](https://streamlit.io/cloud):
sube esta carpeta a un repo (o usa el mismo repo con `Main file path:
streamlit_app/app.py`) y configura `SUPABASE_URL` / `SUPABASE_ANON_KEY` en
los "Secrets" del panel de Streamlit Cloud.
