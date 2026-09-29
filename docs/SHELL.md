# Shell: CardPDF es una aplicación, no una página web

CardPDF se diseña y se comporta como **app nativa**. Nunca como sitio web con encabezado de marca, columnas de blog o export mezclado con la entrada.

## Tres zonas (fijas)

| Zona | Qué es | IDs |
|---|---|---|
| **Hoja** | Lienzo / mesa de trabajo | `#panel-canvas`, `#viewport-container` |
| **Ajustes** | Entrada y configuración | `#panel-sidebar`, `#panel-controls` |
| **Salida** | Exportar, imprimir, copiar | `#panel-output`, `#panel-export` |

No metas Salida dentro de Ajustes. No metas Ajustes dentro de la Hoja. Un botón = una acción por pantalla.

## Celular (iPhone)

- Cero encabezado de marca. Cero chrome de sitio web.
- Estructura: lienzo a pantalla + tab bar inferior `Hoja | Ajustes | Salida`.
- PWA en iOS: conserva `apple-mobile-web-app-capable=yes` junto con
  `apple-mobile-web-app-status-bar-style=black-translucent`, como en Nexus Flow
  y clon-raindrop. Apple indica que el estilo de barra de estado solo surte
  efecto si se activa primero el modo de aplicación con esa metaetiqueta.
  `viewport-fit=cover` y el padding de safe area completan el diseño. Tras
  cambiar la cabecera hay que borrar la app de la pantalla de inicio y volver
  a agregarla para que iOS actualice su configuración de arranque.
- Controles tactiles en movil: minimo 44pt (`--ctl-h`), como pide Apple.
- En Safari, la tab bar usa `position: fixed; bottom: 0`. En la PWA instalada
  de iOS, `100dvh` y `height: 100%` pueden perder el alto de la barra de estado:
  `html.ios-standalone` y `body` usan `100vh`, y la tab bar se ancla al `body`
  con `position: absolute; bottom: 0`. El modo se detecta al iniciar con
  `navigator.standalone`. Lo que se apoye en la barra usa `--tabbar-total`.

- La hoja entra con zoom 1.0, que es "entera en el hueco libre": el hueco se
  mide con las posiciones reales de la toolbar, la píldora de estado y la barra
  rápida (`resizeCanvasViewport`). No pongas un zoom de arranque fijo tipo 85%:
  solo sirve para un tamaño de pantalla.
- Safe area (`viewport-fit=cover`). Controles de acción ≥ 44px.
- Tema, reinicio, Simple/Avanzado e idioma (banderas EN/ES, inglés por defecto) van siempre visibles.
- Modo **Simple**: sin Ajustes, valores de fábrica, pestañas `Hoja | Salida`. Modo **Avanzado**: el shell completo.
- La hoja no comparte pantalla con paneles: una pestaña visible a la vez.

### Franja inferior de la PWA: solución comprobada

Confirmada por Estiven en su iPhone el 29-09-2026. Síntoma: en la PWA instalada
la barra `Hoja | Salida` terminaba unos 59 pt por encima del borde; en Safari
parecía bien porque su barra de direcciones ocupaba la zona inferior. El fallo
seguía después de reinstalar la PWA. Cambiar solo metadatos, `safe-area` o
`bottom: 0` no lo resolvió.

La combinación problemática era `black-translucent` + `viewport-fit=cover` con
raíz de `height: 100%`/`100dvh` y `body` fijo. iOS podía calcular el alto de la
vista menos la barra de estado, dejando una franja vacía de esa misma altura.
La corrección está en `index.html` y `src/styles/app.css`: detectar
`navigator.standalone`, poner `html` y `body` a `100vh`, dejar el `body` en
flujo con `position: relative` y situar `#app-tabbar` en `position: absolute;
bottom: 0`. Safari conserva su `fixed; bottom: 0`.

Para cambios futuros, prueba **Safari y la PWA instalada por separado** en un
iPhone real: hoja, Ajustes, Salida y pantalla completa. Un emulador de escritorio
no reproduce la medición errónea de `100dvh` al iniciar la PWA. Si se cambia
la cabecera/manifest, reinstala la PWA; si solo cambia CSS/JS, ciérrala por
completo y vuelve a abrirla.

## Escritorio (app de escritorio)

- Cero layout de página web. No hay header horizontal de sitio.
- Tres columnas fijas: **Ajustes | Hoja | Salida**. En modo Simple se oculta Ajustes.
- Salida va a la **derecha** (`#panel-output`), con el chrome de la app (marca, tema, reinicio) arriba de exportar.
- Cada columna scrollea por dentro. El body no scrollea.
- Espacio generoso. Sin pastilla dentro de pastilla.

## Qué no hacer

- No devolver la exportación al panel izquierdo.
- No inventar una cuarta pestaña o un segundo botón de descargar.
- No tratar el lienzo como un `<article>` de web: es el viewport de la app.
