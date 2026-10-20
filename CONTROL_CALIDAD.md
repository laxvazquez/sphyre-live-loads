# Control de calidad — SPHYRE LIVE LOADS v1.0

## Verificaciones realizadas

- 7/7 pruebas automáticas con Node.js (`npm test`): modelo IMT 66.5, transición a L=30, w(L), carga puntual, carga uniforme, equilibrio de fuerzas, momentos nulos en apoyos, inversión de ejes y posición móvil optimizada frente a barrido independiente.
- Prueba de navegador Chromium en escritorio (1440 px) y teléfono (390 px) sobre HTML con los scripts locales incorporados: sin excepciones JavaScript. La vista móvil mantiene el ancho de documento en 390 px, sin desbordamiento horizontal.
- Prueba de interacción: el claro L=25 m activa modelo de 6 ejes; la opción de carretera C reduce los resultados un 10%; botón de V crítico dirige la sección a la vecindad del apoyo y muestra su cortante correspondiente.
- Configuración `render.yaml` comprobada sintácticamente como YAML, y claves `type:web`, `runtime:static`, `staticPublishPath`, `autoDeployTrigger` contrastadas con el esquema/documentación oficial de Render.

## Revisión pendiente ANTES de diseño ejecutivo

- Validar contra memorias de cálculo independientes y la edición normativa contractual del proyecto.
- Definir cómo incorporar el incremento dinámico que realmente corresponda: la opción 1.33 es manual y solo escala cargas P, no w.
- Verificar combinaciones de diseño, efecto de presencia múltiple, distribución transversal y configuraciones distintas a una viga simple antes de aplicar las máximas demandas a elementos estructurales.
- El renderizado del vehículo es conceptual; la norma define cargas virtuales, no la silueta de un camión real.

## Estado de publicación

Código y configuración de Render listos para repositorio Git. El despliegue remoto aún requiere que el código exista en un repositorio GitHub/GitLab/Bitbucket conectado a Render. No es posible declarar el servicio público o el sitio `onrender.com` hasta que el despliegue esté en estado **Live** y su URL responda correctamente.
