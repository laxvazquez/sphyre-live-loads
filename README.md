# SPHYRE LIVE LOADS · Bridge Lab (v1.1)

Actualización de los modelos de carga viva móvil en una viga simplemente apoyada. Disponible en modalidad **web estática**; sin backend ni costos de cómputo de servidor.

## Modelos

- IMT 66.5 (<30m / >=30m): se preservó el motor previo.
- HS-20-44: ejes 8 / 32 / 32 kip, primer intervalo 14 ft y segundo intervalo 14–30 ft configurable. **La búsqueda de máximo se hace para la separación elegida, NO para la envolvente automática del rango completo.**
- HS-20 carril: ALTERNATIVA al camión según AASHTO Standard Specs; 0.64 kip/ft y carga puntual de 18 kip (momento) o 26 kip (cortante). No sumar camión + carril como se hace en HL-93.
- Cooper E-50 / E-80: dos locomotoras ficticias, 18 cargas de ejes y cola uniforme longitudinal **que se desplaza con las locomotoras** (E80 = 8 kip/ft, E50 = 5 kip/ft). Se incluyen ambos sentidos de circulación.

## Uso

Abrir `public/index.html` mediante un servidor local (por módulos ES) o desplegar como static site de Render con `publishPath=public` y `buildCommand=echo listo`.

Cálculo de reacciones RA/RB, diagramas de M/V, barrido de desplazamientos y exportación CSV.
Unidades: tonf, m. Conversiones: 1 kip = 0.45359237 tf, 1 ft = 0.3048 m.

## Alcances

Motor **longitudinal** en viga simplemente apoyada. Resultados NOMINALES sin factores de carga, sin distribución transversal, sin espectro de impacto, sin efectos dinámicos ferroviarios o frenado, sin cantidad de vías y sin combinaciones. El valor 1.33 es un multiplicador manual **solo de las cargas puntuales**; no se aplica por defecto y NO corresponde automáticamente al impacto ferroviario. La carga alternativa AREMA de 4 ejes debe comprobarse separadamente (NO está incluida en esta versión). Los valores de HS-20 camión se calculan para el intervalo de separación seleccionada; ensayar separación de 14 a 30 ft para obtener envolvente completa.

## Referencias base

- AASHTO HS-20-44 en *Standard Specifications*; ver NCHRP Report 322 figura E-5 y E-6: https://onlinepubs.trb.org/Onlinepubs/nchrp/nchrp_rpt_322.pdf
- WisDOT Bridge Manual, Chapter 38, figura 38.3-5 Cooper E80: https://wisconsindot.gov/dtsdManuals/strct/manuals/bridge/ch38.pdf
- SICT N-PRY-CAR-6-01-003/25 para IMT 66.5.

## Pruebas

`npm test` — 13 pruebas unitarias de conversión, geometría, equilibrio, cola móvil y búsqueda crítica.

## Render

Repositorio GitHub conectado. Direct build: `echo "static ready"`; ruta de publicación: `public`; rama: `main`; autoDeploy activado.
