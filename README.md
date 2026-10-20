# SPHYRE LIVE LOADS · Bridge Lab (v1.0)

Simulador web móvil para análisis **longitudinal** bajo cargas móviles virtuales IMT 66.5, utilizando un modelo **simplemente apoyado**. Sitio estático (HTML/CSS/JS módulos ECMAScript); no requiere servidores ni dependencias de producción.

## Funcionalidades

- Modelo IMT 66.5 según **N-PRY-CAR-6-01-003/25, E.1.2.1**.
  - `L < 30 m`: fuerzas `[5, 12, 12, 12.5, 12.5, 12.5] tf`, distancias al primer eje `[0,4.4,5.6,12.8,14,15.2] m`, sin carga uniforme.
  - `L >= 30 m`: fuerzas `[5,24,37.5] tf`, distancias `[0,5,14] m` y carga `w(L) = min(1, (L-30)/60) tf/m` aplicada en el claro completo.
- Reducción 0.90 del modelo para carretera Tipo C, configurable; un factor separado opcional sobre cargas concentradas P (valor 1.33 **ilustrativo**, NO preseleccionado ni automáticamente normativo).
- Modelo de viga simple: reacciones RA y RB y diagramas de M(x), V(x).
- Optimizador de posición del modelo móvil que devuelve M máximo global y V máximo absoluto global, con posición del primer eje y coordenada crítica de la trabe.
- Dos controles deslizantes, reproducción animada, sentido reversible, simulación SVG de trabe AASHTO y camión **ilustrativo** (los modelos IMT son cargas virtuales).
- Exportación CSV de diagramas (valores para la posición actual) y máximos móviles; PWA instalable con caché offline.

## Reproducción local

```shell
cd sphyre-live-loads
npm test
python -m http.server 8080 -d public
```

Abrir http://localhost:8080. Para probar en celular usar un servidor HTTPS o desplegar en Render. No abrir `index.html` con `file://` porque importa módulos ES.

## Publicar en Render (vía GitHub)

1. Crear un repositorio nuevo en GitHub, por ejemplo `sphyre-live-loads`. Subir todo el contenido de esta carpeta al directorio raíz del repositorio; `render.yaml` debe quedar visible en la raíz.
2. En Render, elegir **New > Blueprint** y seleccionar ese repositorio. Confirmar el servicio estático `sphyre-live-loads` y aplicar. Render usa automáticamente el archivo `render.yaml`.
3. Alternativa: **New > Static Site**, seleccionar repositorio, Build command: `echo "Sphyre Live Loads - frontend listo"`, Publish directory: `public`, branch: `main`.
4. Esperar estado **Live** y verificar URL asignada `https://...onrender.com`, abrir en móvil, mover el vehículo y comprobar indicadores y exportación CSV.
5. Nuevas versiones: actualizar `main`; `autoDeployTrigger: commit` activa el despliegue automático.

La configuración de Render no requiere claves secretas ni base de datos. [Documentación de Render](https://render.com/docs/static-sites) · [Blueprint YAML](https://render.com/docs/blueprint-spec).

## Limitaciones y alcance

- **Versión de análisis longitudinal de una sola viga simplemente apoyada:** no modela continuidad, múltiples carriles simultáneos, distribución transversal, rigidez del tablero, esviaje, efectos de fatiga, deformaciones, combinaciones, efectos de impacto normativos automáticos ni verificación de capacidad resistente.
- La carga uniforme está sobre **todo el claro** mientras se desplaza el vehículo, según el modelo longitudinal para la viga simple, y no cambia con la posición del primer eje.
- El incremento de P con valor 1.33 se presenta solamente como una **opción manual ilustrativa**. El usuario debe corroborar los factores de carga y disposiciones vigentes que apliquen al proyecto, incluyendo factores de carriles.
- **Las fuerzas de ejes y las separaciones representan un vehículo virtual normativo;** el camión dibujado es solo una representación pedagógica, no el vehículo con dimensiones físicas reales.
- La posición del modelo móvil se define por el **primer eje listado**, que puede estar antes de la entrada al claro (posición negativa). Las cifras se calculan internamente con precisión doble; la interfaz redondea a 2 decimales.
- La fuerza cortante se representa a derecha de cada eje concentrado (en el punto de carga hay salto); la envolvente |V| se calcula mediante reacciones extremas, observables como límites al acercar ejes a los apoyos.
- No usar esta versión como fundamento único de un proyecto ejecutivo sin validación independiente por un ingeniero responsable.

## Archivos

- `public/index.html` interfaz
- `public/style.css` tema visual
- `public/engine.js` motor estructural en JS aislado
- `public/app.js` visualización, controles y exportación
- `public/sw.js` / `manifest.webmanifest` PWA
- `tests/engine.test.mjs` pruebas de motor
- `render.yaml` configuración de sitio estático Render
