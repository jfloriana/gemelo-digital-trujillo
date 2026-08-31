# Gemelo Digital Microescala — Calidad del Aire y NbS | Trujillo

Plataforma de **Gemelo Digital a microescala (5 m x 5 m)** para el monitoreo, predicción y mitigación de contaminantes atmosféricos e isla de calor urbano en **Trujillo, La Libertad — Perú**, mediante sensores IoT de bajo costo calibrados, modelos de IA / Deep Learning y simulación de **Soluciones basadas en la Naturaleza (NbS)** con flora nativa.

> Proyecto de Tesis de Posgrado — Investigación aplicada a planificación urbana, salud pública y resiliencia climática en ciudades intermedias costeras.

**Investigador líder:** Ing. Joel Arevalo · **Ámbito:** 6 zonas críticas de Trujillo (Centro Histórico, Corredor Mayorista, Mansiche, El Porvenir, Víctor Larco, La Hermelinda) · **Población beneficiada estimada:** 132.500 hab. (41.000 en riesgo crítico protegidos)

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Asistente IA — Chatbot Trujillo](#asistente-ia--chatbot-trujillo)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración — Variables de Entorno](#configuración--variables-de-entorno)
- [Ejecución](#ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos de la Plataforma](#módulos-de-la-plataforma)
- [Modelos de IA Soportados](#modelos-de-ia-soportados)
- [Catálogo NbS](#catálogo-nbs)
- [Exportación de Reportes](#exportación-de-reportes)
- [Despliegue](#despliegue)
- [Solución de Problemas](#solución-de-problemas)
- [Licencia y Créditos](#licencia-y-créditos)

---

## Características Principales

- **Gemelo Digital 3D en Vivo** — Visualización interactiva del cañón urbano con malla 5 m x 5 m, H/W ratio 0.8–2.1 y sincronización bidireccional físico-virtual (latencia media IoT 1.2 s).
- **Asistente IA Conversacional — Chatbot Trujillo** — Widget flotante contextual que responde sobre calidad del aire, interpretación de PM2.5/UHI/PET/TCS, recomienda intervenciones NbS por zona con flora nativa y explica el benchmark de modelos IA. Potenciado por Gemini (`@google/genai`) con fallback local si no hay API key.
- **Diagnóstico Microescalar (OE1)** — Variabilidad calle a calle de PM2.5/PM10/NO₂/O₃, temperatura, UHI, PET y TCS. Hasta 285 % de delta en < 100 m.
- **Arquitectura 3 Capas (OE2)** — Capa Física (sensores + LiDAR/OSM/BIM), Capa de Datos (ingesta MQTT/REST/WebSocket + QA/QC 2 etapas) y Capa de Modelado (inferencia IA), bajo marco REFLECT de 7 capas.
- **Motor IA & Deep Learning (OE3)** — Benchmark de 5 modelos (1D-CNN R² 0.9925, GNN, Bi-LSTM, Bayesian Spatiotemporal, Random Forest) con inferencia 4.8 ms.
- **Simulador NbS Verde (OE4)** — Escenarios A/B con 5 tipologías (arbolado, techo verde, muro verde, pavimento permeable, jardín de lluvia), flora nativa costeña y cálculo de costo, enfriamiento ΔT, reducción PM2.5, captura CO₂ y confort térmico.
- **Validación & Políticas (OE5)** — Validación estadística (p < 0.001), B/C ratio 3.4 y trazabilidad de los 5 Objetivos de Tesis.
- **Gestión de Acceso por Rol** — Investigador, Planificador, Analista, Admin IoT y Ciudadano con permisos diferenciados (`canSimulateMl`, `canInjectIoT`, `canExportReports`).
- **Exportación Multiformato** — Excel (xlsx), PDF (jsPDF), Word (docx) y CSV — dataset completo de zonas, sensores, modelos, NbS y escenario activo.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| UI / SPA | React | 19.0.1 |
| Lenguaje | TypeScript | 5.8.2 |
| Build | Vite | 6.2.3 + @vitejs/plugin-react 5.0.4 |
| Estilos | Tailwind CSS | 4.1.14 + @tailwindcss/vite 4.1.14, autoprefixer 10.4.21 |
| Gráficos | Recharts | 3.10.1 |
| Animación | Motion | 12.23.24 |
| Iconografía | lucide-react | 0.546.0 |
| IA / Chatbot | @google/genai | 2.4.0 — Gemini 2.0 Flash para motor predictivo y asistente conversacional |
| Exportación | xlsx 0.18.5, jspdf 4.2.1, jspdf-autotable 5.0.8, docx 9.7.1, file-saver 2.0.5 |
| Utilidades | dotenv 17.2.3, express 4.21.2 (tipos), esbuild 0.25.0, tsx 4.21.0 |
| Tipos | @types/node 22.14.0, @types/express 4.17.21 |

> Gestor de paquetes recomendado: **npm** (compatible con **bun** — `bun.lock` incluido). Node.js ≥ 18.18 requerido (recomendado 20 LTS).

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│  Capa Física                                            │
│  Sensores PMS5003 / SPS30 + BME680 / OPC-N3 · LiDAR ·   │
│  OSM · BIM · Cañones urbanos H/W 0.8–2.1 · Malla 5m    │
└──────────────────────┬──────────────────────────────────┘
                       │ MQTT / REST / WebSocket (1.2 s)
┌──────────────────────▼──────────────────────────────────┐
│  Capa de Datos                                          │
│  Ingesta → QA/QC 2 etapas (Zhivkov) → Calibración       │
│  R² 0.31→0.94 · Hygroscopic / Thermal Drift correction   │
└──────────────────────┬──────────────────────────────────┘
                       │ Series temporales t-12
┌──────────────────────▼──────────────────────────────────┐
│  Capa de Modelado (IA)                                  │
│  1D-CNN (Naveed et al. 2025) · GNN · Bi-LSTM ·          │
│  Bayesian ST · RF  —  Inferencia 4.8 ms                 │
└──────────────────────┬──────────────────────────────────┘
                       │ ΔT / ΔPM2.5 / PET / TCS / Costo
┌──────────────────────▼──────────────────────────────────┐
│  Frontend SPA (React + Vite)                            │
│  DigitalTwinCanvas · 5 Módulos OE · Simulador NbS ·     │
│  Reportes (xlsx/pdf/docx/csv) · Chatbot IA              │
└──────────────────────┬──────────────────────────────────┘
                       │ Widget flotante contextual
┌──────────────────────▼──────────────────────────────────┐
│  Asistente IA — Chatbot Trujillo (Gemini 2.0)           │
│  System prompt con trujilloData.ts · Fallback local     │
│  Acciones: explicar zona, recomendar NbS, comparar IA   │
└─────────────────────────────────────────────────────────┘
```

Marco de referencia: **REFLECT (7 capas: Retrieve, Establish, Facilitate, Lump, Examine, Cognition, Take)** — Li et al. (2026), Teutscher et al. (2025).

---

## Asistente IA — Chatbot Trujillo

Widget flotante disponible en todas las vistas autenticadas (esquina inferior derecha). Responde en español, con contexto completo de la plataforma — no es un chat genérico.

### Qué puede hacer

- **Interpretar calidad del aire y confort térmico** — explica en lenguaje ciudadano qué significa un PM2.5 de 68.9 µg/m³ en La Hermelinda, el delta UHI de 6.2 °C en Mayorista o un TCS de 42/100, y qué hacer.
- **Recomendar NbS por zona** — sugiere tipología óptima, flora nativa costeña, costo PEN, enfriamiento esperado y reducción de PM2.5. Ej.: “¿qué planto en El Porvenir con 500 m² y S/ 15 000?”.
- **Explicar modelos IA** — compara 1D-CNN vs GNN/Bi-LSTM/RF (R², inferencia, resolución 5–25 m) y recomienda modelo según caso de uso.
- **Navegación guiada** — lleva al módulo correcto: “llévame al simulador NbS”, “abre OE1 para ver serie horaria”, “exporta el reporte en PDF”.
- **Responder con datos vivos** — usa `TRUJILLO_ZONES`, `SENSOR_NODES`, `NBS_CATALOG`, `AI_MODELS_BENCHMARK` y el escenario A/B activo como contexto del system prompt.

### Cómo funciona

- **Motor:** `@google/genai` — `Gemini 2.0 Flash` con system prompt curado que inyecta las 6 zonas, 6 nodos sensores y catálogo NbS. Streaming de respuesta.
- **Fallback sin API key:** motor local por reglas (keyword matching) que responde sobre zonas, sensores, NbS y modelos con datos de `src/data/trujilloData.ts`. La plataforma es 100 % funcional en modo demo.
- **Contexto por zona activa:** el chatbot conoce la zona seleccionada en el canvas y adapta recomendaciones de flora y costo.
- **Privacidad:** no envía datos personales; solo métricas ambientales anonimizadas como contexto. Historial en memoria del navegador (no persiste en servidor).

### Configuración

La misma clave que el motor predictivo. Ver [Configuración — Variables de Entorno](#configuración--variables-de-entorno).

```env
# Requerida solo si quieres Gemini en chatbot y funciones IA generativa
GEMINI_API_KEY="tu_gemini_api_key"
# En cliente Vite expón como VITE_GEMINI_API_KEY si el chatbot se ejecuta en browser
VITE_GEMINI_API_KEY="tu_gemini_api_key"
```

Sin la clave, el chatbot opera en modo local. Con la clave, usa Gemini automáticamente.

### Uso

1. Inicia sesión (cualquier rol: investigador, planificador, analista, admin_iot, ciudadano).
2. Haz clic en la burbuja de chat (abajo a la derecha).
3. Prueba los prompts rápidos o escribe tu pregunta.

**Ejemplos de prompts:**

- “¿Qué tan grave es el aire en El Porvenir hoy y qué NbS recomiendas con menor costo?”
- “Compara el 1D-CNN con el GNN para predecir PM2.5 en un cañón H/W 2.1”
- “¿Qué flora nativa del catálogo captura más CO₂ por sol invertido?”
- “Explícame el PET de 36.8 °C en Mayorista como si fuera vecino”
- “Llévame al módulo de validación y resume el B/C ratio”

> Ubicación del componente en código: `src/components/assistant/TrujilloChatbot.tsx` (widget flotante) — integrado en `src/App.tsx` fuera del router para estar disponible en los 7 módulos.

---

## Requisitos Previos

| Requisito | Versión mínima | Verificación |
|-----------|---------------|--------------|
| Node.js | 18.18 (recomendado 20 LTS) | `node -v` |
| npm | 9.x | `npm -v` |
| Git | 2.x | `git --version` |
| Navegador | Chrome/Edge/Firefox última versión | — |
| (Opcional) Bun | 1.x | `bun --version` |

> No requiere base de datos. Los datos de demostración de las 6 zonas y 6 nodos sensores están incluidos en `src/data/trujilloData.ts`.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/jfloriana/gemelo-digital-trujillo.git
cd gemelo-digital-trujillo
```

### 2. Instalar dependencias

Con **npm** (recomendado):

```bash
npm install
```

Con **bun** (alternativo, usa `bun.lock`):

```bash
bun install
```

### 3. Configurar variables de entorno

```bash
# Linux / macOS
cp .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local
```

Edita `.env.local` y completa los valores requeridos (ver siguiente sección). El archivo `.env.local` está ignorado por Git (`.gitignore`).

### 4. Verificar la instalación

```bash
npm run lint   # chequeo de tipos: tsc --noEmit (sin errores = OK)
```

---

## Configuración — Variables de Entorno

Crea `.env.local` en la raíz del proyecto a partir de `.env.example`:

```env
# Requerida para chatbot y funciones IA generativa (Gemini).
# Consíguela en https://aistudio.google.com/app/apikey
GEMINI_API_KEY="tu_gemini_api_key"

# Si el chatbot se ejecuta en el navegador (Vite), expón la clave con prefijo VITE_:
VITE_GEMINI_API_KEY="tu_gemini_api_key"

# URL pública donde se sirve la app (usada para callbacks y enlaces).
# En local: http://localhost:3000
APP_URL="http://localhost:3000"
```

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | Sí, si usas chatbot o funciones generativas | API Key de Google Gemini. Consíguela en https://aistudio.google.com/app/apikey |
| `VITE_GEMINI_API_KEY` | Sí, si el chatbot corre en cliente Vite | Misma clave expuesta al bundle (Vite solo expone variables `VITE_*`) |
| `APP_URL` | No | URL base de la aplicación. Por defecto Vite usa `http://localhost:3000` |

> **Nota:** La app funciona en modo demo sin `GEMINI_API_KEY`/`VITE_GEMINI_API_KEY` para visualización, diagnóstico, simulador NbS y chatbot en modo local. La clave solo es necesaria para respuestas generativas con `@google/genai`.

Vite expone variables con prefijo `VITE_` al cliente. Mantén secretos sensibles fuera del bundle en producción y rota la clave si fue expuesta.

---

## Ejecución

### Desarrollo

```bash
npm run dev
```

- URL: **http://localhost:3000** (host `0.0.0.0` — accesible en red local)
- HMR activado. Edita cualquier archivo en `src/` y el navegador recarga automáticamente.
- El chatbot aparece como burbuja flotante una vez inicias sesión; pruébalo con `VITE_GEMINI_API_KEY` configurada o en fallback local.

Con bun:

```bash
bun run dev
```

### Build de producción

```bash
npm run build
```

Genera `dist/` optimizado (Vite + esbuild). Para previsualizar el build:

```bash
npm run preview
# Sirve dist/ en http://localhost:4173 por defecto
```

### Limpiar artefactos

```bash
npm run clean
# Equivalente a: rm -rf dist server.js
```

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite en puerto 3000, host 0.0.0.0 |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run clean` | Elimina `dist/` y `server.js` |

---

## Estructura del Proyecto

```
gemelo-digital-trujillo/
├── public/                          # Activos estáticos
├── src/
│   ├── components/
│   │   ├── assistant/
│   │   │   └── TrujilloChatbot.tsx  # Widget flotante — asistente IA con Gemini + fallback local
│   │   ├── auth/
│   │   │   ├── AuthScreen.tsx       # Gateway de autenticación (pantalla completa)
│   │   │   └── LoginModal.tsx       # Modal de login
│   │   ├── digitaltwin/
│   │   │   └── DigitalTwinCanvas.tsx# Visualizador 3D interactivo + malla 5m
│   │   ├── layout/
│   │   │   └── Header.tsx           # Header global + exportación rápida
│   │   └── modules/
│   │       ├── DiagnosisModule.tsx      # OE1 — Diagnóstico microescalar
│   │       ├── ArchitectureModule.tsx   # OE2 — Arquitectura 3 capas
│   │       ├── AiEngineModule.tsx       # OE3 — Benchmark modelos IA
│   │       ├── NbsSimulatorModule.tsx   # OE4 — Simulador escenarios NbS
│   │       ├── ValidationPolicyModule.tsx # OE5 — Validación & políticas
│   │       ├── ReportsModule.tsx        # Exportador multiformato
│   │       └── IoTIntegrationModule.tsx # Telemetría MQTT/REST + QA/QC 2 etapas
│   ├── context/
│   │   └── AuthContext.tsx          # Autenticación y permisos por rol (5 roles)
│   ├── data/
│   │   └── trujilloData.ts          # 6 zonas, 6 nodos IoT, 5 modelos IA, 5 NbS, 5 OEs
│   ├── utils/
│   │   ├── cryptoUtils.ts           # Utilidades criptográficas
│   │   └── exportUtils.ts           # Exportación xlsx / pdf / docx / csv
│   ├── App.tsx                      # Shell principal + navegación 8 módulos + chatbot
│   ├── main.tsx                     # Entry point React
│   ├── types.ts                     # Tipos: User, SensorNode, UrbanZone, AiModelMetric, NbsIntervention, SimulationScenario, IoT
│   └── index.css                    # Estilos globales Tailwind
├── index.html                       # HTML entry (Vite)
├── vite.config.ts                   # Config Vite + React + Tailwind + alias @
├── tsconfig.json                    # TypeScript ES2022 / bundler / react-jsx
├── vercel.json                      # Rewrite SPA para Vercel
├── package.json
├── bun.lock
├── .env.example
└── .gitignore
```

Path alias: `import ... from '@/src/...'` resuelve a la raíz del proyecto (ver `vite.config.ts` y `tsconfig.json`).

---

## Módulos de la Plataforma

| Módulo | Ruta (UI) | Objetivo de Tesis | Descripción |
|--------|-----------|-------------------|-------------|
| Gemelo Digital 3D en Vivo | `digital_twin` | Transversal | Canvas interactivo, selector de zona, tarjetas de malla, IA predilecta, mitigación térmica y población beneficiada |
| OE1: Diagnóstico Microescala | `diagnosis` | OE1 | Series horarias, variabilidad PM2.5 y UHI por zona y nodo sensor |
| OE2: Arquitectura 3 Capas | `architecture` | OE2 | Diagrama físico-datos-modelado + marco REFLECT + latencia y malla |
| OE3: Modelos IA & Deep Learning | `ai_engine` | OE3 | Comparativa R²/RMSE/MAE/MAPE, tiempo de entrenamiento e inferencia, resolución espacial |
| OE4: Simulador NbS Verde | `nbs_simulator` | OE4 | Configuración A/B de intervenciones, flora recomendada y cálculo de impacto/costo |
| OE5: Validación & Políticas | `validation` | OE5 | Métricas de cumplimiento, p-valor, población y B/C ratio |
| IoT: Integración & Telemetría | `iot` | OE2 | Ingesta MQTT/REST/WebSocket, inyector de paquetes, QA/QC 2 etapas y logs en vivo |
| Reportes | `reports` | Transversal | Exportación consolidada con escenario activo |
| **Asistente IA — Chatbot** | `widget flotante` | Transversal | Burbuja contextual (Gemini 2.0 + fallback) para consultas, recomendaciones NbS y navegación guiada |

Acceso controlado por `AuthContext` — sin usuario autenticado se muestra `AuthScreen` (gateway). El chatbot hereda el rol y adapta el nivel de detalle.

---

## Modelos de IA Soportados

| Modelo | Referencia | R² | RMSE | Inferencia | Resolución | Uso recomendado |
|--------|------------|----|------|------------|------------|-----------------|
| **1D-CNN (2 capas)** | Naveed et al. 2025 | **0.9925** | 1.42 | 4.8 ms | 5 m (edificación/cañón) | Predicción tiempo real PM2.5 y temperatura |
| GNN (Topología vial) | Zhivkov et al. 2025 | 0.9510 | 2.85 | 14.2 ms | 10 m (manzana) | Atribución vehicular (65 %) |
| Bi-LSTM | Li et al. 2026 | 0.9380 | 3.20 | 8.5 ms | 15 m (nodo) | Inversión térmica y ciclos diurnos |
| Bayesian Spatiotemporal | Li et al. / Elizabeth NJ 2026 | 0.9140 | 3.90 | 28.0 ms | 10 m (fachada) | Cuantificación de incertidumbre |
| Random Forest (300 trees) | Babu Saheer et al. 2025 | 0.8870 | 4.60 | 2.1 ms | 25 m (barrio) | Baseline e interpretabilidad |

Definidos en `src/data/trujilloData.ts:AI_MODELS_BENCHMARK`. El chatbot puede compararlos y recomendar el óptimo según resolución y latencia requerida.

---

## Catálogo NbS

| Intervención | ID | Enfriamiento | ΔPM2.5 | Costo (PEN) | Flora nativa ejemplo |
|--------------|----|-------------|--------|-------------|----------------------|
| Corredores de Arbolado Urbano | `nbs-arbolado` | 3.2 °C | 28.5 % | 380 / árbol | Molle costeño, Huarango, Jacarandá |
| Techos Verdes Extensivos | `nbs-techo-verde` | 3.8 °C | 22.0 % | 145 / m² | Sedum spp., Aptenia, Portulaca |
| Jardines Verticales / Muros Verdes | `nbs-muro-verde` | 2.6 °C | 24.8 % | 220 / m² | Hedera helix, Ficus pumila |
| Pavimentos Permeables | `nbs-pavimento-permeable` | 2.1 °C | 14.5 % | 110 / m² | Bermuda grass, gravas volcánicas |
| Jardines de Lluvia / Bio-retención | `nbs-jardin-lluvia` | 2.9 °C | 26.0 % | 160 / m² | Vetiver, Canna indica |

Cada intervención reporta además retención hídrica (L/m²), secuestro CO₂ (kg/año) y amortiguación acústica (dB). Ver `src/data/trujilloData.ts:NBS_CATALOG`. El chatbot recomienda la combinación óptima según zona, presupuesto y meta ΔT/ΔPM2.5.

---

## Exportación de Reportes

Desde el **Header** (exportación rápida) o el módulo **Reportes**:

| Formato | Función | Contenido |
|---------|---------|-----------|
| Excel `.xlsx` | `exportToExcel` | Zonas, nodos sensores, benchmark IA, catálogo NbS, OEs y escenario activo |
| PDF `.pdf` | `exportToPDF` | Informe consolidado con tablas (`jspdf` + `jspdf-autotable`) |
| Word `.docx` | `exportToWord` | Documento estructurado (`docx`) |
| CSV `.csv` | `exportToCSV` | Serie de nodos sensores |

Implementación en `src/utils/exportUtils.ts`. Requiere permiso `canExportReports` según rol. El chatbot puede generar el reporte sugerido y llevarte al módulo.

---

## Despliegue

### Vercel (recomendado)

El proyecto incluye `vercel.json` con rewrite SPA (`/(.*)` → `/index.html`) y `framework: vite`.

**Opción A — CLI:**

```bash
npm i -g vercel
vercel          # primer despliegue (preview)
vercel --prod   # producción
```

**Opción B — Dashboard:**

1. Importa el repositorio en https://vercel.com/new
2. Framework preset: **Vite** (autodetectado)
3. Build command: `npm run build` · Output directory: `dist`
4. Añade variables de entorno (`GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`, `APP_URL`) en Project Settings → Environment Variables
5. Deploy

### Otros hosting estáticos

Cualquier hosting estático compatible con SPA (Netlify, Cloudflare Pages, GitHub Pages, Nginx):

```bash
npm run build
# Sube el contenido de dist/ y configura fallback a index.html
```

Para Netlify/Cloudflare añade regla `_redirects`: `/*  /index.html  200`.

---

## Solución de Problemas

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `GEMINI_API_KEY is not defined` / chatbot en modo local | `.env.local` no creado o variable vacía | `cp .env.example .env.local` y completar `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`; reiniciar `npm run dev` |
| Chatbot responde “modo local” aunque hay clave | Clave con prefijo incorrecto en Vite | En cliente usa `VITE_GEMINI_API_KEY`; en server `GEMINI_API_KEY`; verifica `import.meta.env` |
| Puerto 3000 ocupado | Otro proceso en 3000 | `npm run dev -- --port 3001` o liberar el puerto (`lsof -i :3000` / `netstat -ano`) |
| `tsc --noEmit` con errores | Tipos desactualizados | `npm install` y verificar `tsconfig.json` |
| Pantalla en blanco tras `build` | Falta rewrite SPA en hosting | Verificar `vercel.json` o regla de fallback a `index.html` |
| `bun install` falla | Versión de Bun desactualizada | `bun upgrade` o usar `npm install` |
| HMR no recarga | `DISABLE_HMR=true` en entorno | Quitar la variable o reiniciar sin ella |

---

## Licencia y Créditos

- **Licencia del código:** Apache-2.0 (ver cabecera en `src/App.tsx`).
- **Datos y referencias científicas:** Naveed et al. (2025), Zhivkov et al. (2025), Li et al. (2026), Abbas et al. (2025) — GREENPASS®, entre otros citados en los módulos OE1–OE5.
- **Institución:** Universidad Nacional de Trujillo — Posgrado.
- **Contacto del proyecto:** Ing. Joel Arevalo — `joelandersonarevalo@gmail.com`

---

> ¿Dudas sobre instalación o despliegue? Abre un issue en el repositorio o contacta al investigador líder. Para reproducir resultados académicos, consulta los módulos OE1–OE5 y exporta el dataset desde **Reportes → Excel**. El asistente IA puede guiarte paso a paso dentro de la plataforma.
