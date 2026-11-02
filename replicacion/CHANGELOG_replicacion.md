# Cambios en el material de replicación

## 2026-11-02

### Simulador de escenarios NBS (código de la plataforma)
- **Se eliminan los topes fijos de 5,6 °C y 42 %.** En la versión anterior ambos topes estaban activos en las 16 zonas del escenario por defecto, es decir, los resultados publicados eran el valor del tope y no el resultado del modelo.
- **Nuevo modelo** (`src/utils/nbsModel.ts`, documentado en `docs/coeficientes_simulador.md`):
  - la temperatura satura suavemente hacia 5,0 °C (mayor media documentada, Kumar, Debele et al. 2024), con fracciones de cobertura, LAI (Beer-Lambert) y área de estudio explícitas;
  - el efecto sobre PM2.5 tiene signo variable: deposición (depende del nivel de PM2.5) menos penalización por ventilación del cañón;
  - regla R1: no se recomienda arbolado denso con ventilación baja, y cada activación queda registrada.
- **Series horarias de respaldo** marcadas `SIMULADA / FALLBACK` en la interfaz, el CSV de telemetría y el informe.
- Pruebas: `src/test/nbsModel.test.ts` (19 pruebas nuevas).

### Archivos de `replicacion/`
- `salidas/escenarios_simulador.csv` (nuevo) y `scripts/exportar_escenarios.mjs` (nuevo): escenario por defecto por zona, con el resultado anterior (con topes) al lado para comparar. Se regenera con `node replicacion/scripts/exportar_escenarios.mjs` desde la raíz del repositorio.
- `protocolo/registro_busquedas.csv`: columnas renombradas a `base, fecha, cadena, filtros, resultados` (más `ejecutado_por`). Los filtros de Scopus, Web of Science y ScienceDirect se tomaron de la Tabla 1; fecha, cadena y resultados de esas tres bases siguen en blanco.
- `scripts/calcular_kappa.py`: las rutas ahora son relativas al script, así que funciona desde cualquier carpeta. El kappa no cambia (n = 22).
- `protocolo/codificacion_segundo_revisor.csv`: se corrigió la fuente del resumen de A30. El segundo codificador había leído el resumen de "Air pollution abatement from Green-Blue-Grey infrastructure", y A30 (202 estudios, 51 tipos) es "Urban heat mitigation by green and blue infrastructure" (Kumar, Debele et al., 2024). Se verificó con el resumen correcto: los valores 1/0 no cambian y el kappa tampoco.
- `datos/` (extracción y Tablas 4, 7 y 8): cambio del autor de A30 a "Kumar, Debele, …".
- `protocolo/uso_de_ia.md` y `pendientes/`: incorporados al repositorio.
