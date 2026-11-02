# Uso de IA en la revisión (registro de auditoría)

Herramienta: Claude (Anthropic), modelo de IA. Fecha de las tareas: 1 de noviembre de 2026.
Las salidas no tuvieron verificación humana independiente.

## Tarea 1. Registro de búsquedas (solo arXiv)
Instrucción dada: ejecutar únicamente la cadena de arXiv de la Tabla 1 mediante su API pública y guardar fecha, cadena exacta y número de registros en `protocolo/registro_busquedas.csv`; dejar en blanco Scopus, Web of Science y ScienceDirect (requieren acceso institucional) y no inventar datos.
Salida: `protocolo/registro_busquedas.csv` (arXiv: 8 registros únicos; 2026-11-01).

## Tarea 2. Segundo codificador
Instrucción dada: codificar L1-L5 y `evalua_sbn` (1/0) de las 31 fuentes del corpus leyendo solo título y resumen, sin consultar `datos/extraccion_40_fuentes.csv`; dejar en blanco las fuentes sin resumen accesible y anotar el motivo.
Salida: `protocolo/codificacion_segundo_revisor.csv` (22 de 31 fuentes codificadas) y `salidas/kappa_codificadores.csv` (script `scripts/calcular_kappa.py`).
Advertencia de independencia: la IA vio por error las filas A1 y A2 de la extracción original antes de codificar; ambas llevan aviso en la columna `nota`.

## Otros usos
Reestructuración del manuscrito, apoyo en el protocolo y las definiciones, scripts de Python para frecuencias y figuras, depuración de la redacción y propuesta de correcciones tras la revisión por pares (ver la Declaración de uso de IA del artículo).

## Tarea 3. Corrección del simulador y salidas de replicación (2026-11-02)
Instrucción dada: eliminar los topes fijos del simulador de escenarios NBS, documentar los coeficientes, añadir la regla R1 de ventilación, marcar la serie de respaldo como simulada, añadir pruebas y regenerar las salidas de replicación.
Salida: `src/utils/nbsModel.ts`, `docs/coeficientes_simulador.md`, `src/test/nbsModel.test.ts`, `replicacion/salidas/escenarios_simulador.csv` y `replicacion/CHANGELOG_replicacion.md`.
Advertencia: los coeficientes marcados [H] en `docs/coeficientes_simulador.md` son heurísticos y no tienen verificación humana ni calibración empírica.
