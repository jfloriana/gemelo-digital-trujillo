# Coeficientes del simulador de escenarios NBS

Código: `src/utils/nbsModel.ts` (función pura `computeNbs`) y `src/components/modules/NbsSimulatorModule.tsx` (interfaz).
Pruebas: `src/test/nbsModel.test.ts`.

**Estado de los resultados.** El simulador es un modelo heurístico de escenarios, no un modelo validado contra mediciones ni contra CFD. Sus salidas se marcan `SIMULADO` en la interfaz y en las exportaciones. Los coeficientes marcados [H] no tienen fuente primaria verificada y deben calibrarse (ENVI-met, CFD o mediciones en Trujillo) antes de citar los valores como resultado empírico.

Clave de origen: **[D]** documentado en una fuente del corpus; **[R]** referencia normativa o estándar; **[H]** heurístico del prototipo.

## Cambios respecto de la versión anterior

| Antes | Ahora |
|---|---|
| `Math.min(5.6, …)` sobre la reducción de temperatura | Saturación suave `ΔT = ΔT_sat·(1 − exp(−ΔT_suma/ΔT_sat))`, con `ΔT_sat` = mayor media documentada (5,0 °C). No hay recorte. |
| `Math.min(42, …)` sobre la reducción de PM2.5 | Sin recorte. La reducción es `1 − Π(1 − r_i)` con `r_i` por tipo de NBS. |
| Coeficientes de PM2.5 siempre positivos | `r_árboles = deposición − penalización por ventilación`; puede ser negativo. |
| Contribuciones lineales en nº de árboles y m² sin referencia al área | Fracciones de cobertura sobre un área de estudio explícita (parámetro), copas con radio y LAI. |
| `Math.min(48, …)` en PM10 y `Math.min(96, …)` en el índice de confort | Sin recorte arbitrario; el índice de confort se acota a 0–100 por definición de la escala. |

## Temperatura

Reducción de referencia a cobertura efectiva = 1 (°C). Se asume que la media reportada corresponde a cobertura plena; esto subestima el efecto de coberturas parciales típicas y no es una medición local.

| Constante | Valor | Origen | Fuente |
|---|---|---|---|
| `DT_REF_TREE` | 3,8 | [D] | Kumar, Debele et al. (2024), árboles de calle; `replicacion/datos/magnitudes_A30.csv` |
| `DT_REF_WALL` | 4,1 | [D] | Ídem, muros verdes |
| `DT_REF_ROOF` | 3,8 | [H] | Proxy: "balcones ajardinados" (Kumar, Debele et al., 2024). El techo verde no figura en esa tabla. |
| `DT_REF_RAIN` | 5,0 | [H] | Proxy: "jardines botánicos" (ídem). El jardín de lluvia no figura en esa tabla. |
| `DT_REF_PERM` | 1,0 | [H] | Sin fuente primaria verificada |
| `DT_SATURATION` | 5,0 | [D] | Mayor media documentada (jardines botánicos), Kumar, Debele et al. (2024). Es asíntota, no tope duro. |
| `K_EXT` | 0,5 | [R] | Coeficiente de extinción de Beer-Lambert para hoja esférica; intercepción = `1 − exp(−K_EXT·LAI)` |
| `CANYON_TRAP_SLOPE` | 0,18 | [H] | Conservado del prototipo; divide la reducción por `1 + (H/W − 1)·0,18` |
| Ajuste por albedo (techo, pavimento) | `1 + (0,5 − α)·0,4`; `1 + α·0,6` | [H] | Conservado del prototipo |
| `tempFactor` por modelo ML | 0,94–1,05 | [H] | Conservado; multiplica solo el aporte de árboles |

Cobertura de copas: `c = min(1, N·π·r²/A)` (geometría; `r` = 3,0 m [H], `A` = 20 000 m² [H], LAI = 3,0 [H]). Aporte de árboles: `ΔT_ref·c·(1 − exp(−K_EXT·LAI))`.

## PM2.5 con signo

Reducción relativa de referencia con cobertura efectiva = 1. Fuente: Kumar et al. (2024), "Air pollution abatement from Green-Blue-Grey infrastructure" (media ± DE de la reducción de contaminación del grupo): elementos lineales 23 ± 21 %, muros verdes 14 ± 27 %, techos verdes 13 ± 23 %, áreas no selladas 14 ± 20 %, infraestructura construida 14 ± 25 %. Estos valores provienen del resumen del artículo; verifíquese contra el texto completo antes de citar. Ese artículo no es A30 (A30 es el estudio de mitigación de calor del mismo grupo).

| Constante | Valor | Origen | Uso |
|---|---|---|---|
| `D_TREE` | 0,23 | [D] | Elementos lineales (árboles de calle, setos) |
| `D_WALL` | 0,14 | [D] | Muros verdes |
| `D_ROOF` | 0,13 | [D] | Techos verdes |
| `D_PERM` | 0,14 | [D] | Áreas no selladas |
| `D_RAIN` | 0,14 | [H] | Proxy: infraestructura construida |
| `PM25_REF` | 5 µg/m³ | [R] | Guía anual de la OMS (2021). La deposición solo actúa sobre la fracción `g = 1 − PM25_REF/PM25` por encima de esa referencia; no es el fondo local medido. |
| `P_TREE` | 0,30 | [H] | Aumento relativo máximo de PM2.5 con cobertura 1 y ventilación nula |
| `pmFactor` por modelo ML | 0,92–1,15 | [H] | Conservado; multiplica la deposición de árboles |

Efecto de los árboles: `r_árboles = D_TREE·c·(1 − exp(−K_EXT·LAI))·g − P_TREE·c·(1 − V)`.

- El signo depende del nivel de PM2.5 (vía `g`) y de la ventilación `V`.
- Coherencia cualitativa con la fuente: los árboles de calle muestran efecto adverso en cañones y beneficioso en vía abierta (Kumar et al., 2024).
- Muros, techos, pavimento permeable y jardines de lluvia no llevan penalización de ventilación (supuesto [H]).
- El total combina los tipos de forma multiplicativa: `reducción = 1 − Π(1 − r_i)`.
- Un valor negativo significa que el escenario aumenta la concentración.

## Índice de ventilación del cañón

`V = V_viento · V_geometría`, entre 0 y 1.

| Constante | Valor | Origen | Nota |
|---|---|---|---|
| `U_REF` | 3,0 m/s | [H] | `V_viento = min(1, u/U_REF)` |
| `HW_ISOLATED`, `HW_WAKE` | 0,3 y 0,65 | [R] | Regímenes de flujo en cañones (Oke, 1988): aislado, interferencia de estela y rasante |
| `HW_DEEP` | 2,0 | [H] | |
| `V_AT_WAKE`, `V_AT_DEEP` | 0,6 y 0,2 | [H] | `V_geometría` = 1 hasta 0,3; 0,6 en 0,65; 0,2 desde 2,0; interpolación lineal |

## Regla R1 (ventilación)

Se activa cuando la cobertura de copas es `≥ R1_DENSE_CANOPY` (0,25 [H]) **y** `V < R1_MIN_VENT` (0,35 [H]).

- Al activarse, la interfaz muestra un aviso, `recommendationBlocked = true` y el escenario guardado lleva `ruleR1Active`.
- El máximo sugerido de árboles corresponde a la cobertura `R1_SPARSE_CANOPY` (0,15 [H]).
- Cada transición de inactiva a activa se registra en `localStorage` (`nbs_rule_log_r1`, hasta 200 eventos, con fecha, zona, cobertura, ventilación y mensaje) y el contador aparece en el aviso.
- Los umbrales son heurísticos y deben calibrarse.

## Serie horaria de respaldo

`generateHourlyReadings` (`src/data/trujilloData.ts`) genera series por fórmula (curva solar, picos de tráfico y viento aleatorio). Cada lectura lleva `origin: 'SIMULADA/FALLBACK'`; las leídas de Supabase llevan `origin: 'MEDICION'`; una lectura sin `origin` se trata como simulada. La interfaz (módulo de diagnóstico) muestra un aviso "SIMULADA / FALLBACK" y las exportaciones (CSV con columna `origen_dato`, Apéndice B del informe) la marcan.

## Pendiente

- Calibrar los coeficientes [H] con ENVI-met/CFD o con mediciones en Trujillo.
- Verificar los valores de PM2.5 contra el texto completo de Kumar et al. (2024).
- Sustituir los proxies de techo verde y jardín de lluvia por valores propios de esas intervenciones.
