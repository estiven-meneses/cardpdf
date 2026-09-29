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
- PWA en iOS: cabecera y manifest calcados de City Service, que en el mismo
  iPhone llega al borde. **No vuelvas a poner
  `<meta name="apple-mobile-web-app-capable">`**: abre la app en el modo "web
  clip" antiguo, iOS le da a la vista el alto de pantalla menos la barra de
  estado y queda una franja vacia bajo la barra inferior. Eso lo decide iOS al
  abrir la app; ningun CSS lo corrige. Basta `mobile-web-app-capable` + el
  manifest con `display: standalone`. Tras tocar cabecera o manifest hay que
  borrar la app de la pantalla de inicio y volver a agregarla.
- Controles tactiles en movil: minimo 44pt (`--ctl-h`), como pide Apple.
- La tab bar es `position: fixed; bottom: 0` y el `body` es `fixed; inset: 0`,
  como en nexusFlow. No la devuelvas al flujo ni midas la app con `100dvh`: en
  la PWA de iOS ese alto no siempre es el de la pantalla y la barra quedaba
  flotando por encima del borde. Lo que se apoye en ella usa `--tabbar-total`.
- La hoja entra con zoom 1.0, que es "entera en el hueco libre": el hueco se
  mide con las posiciones reales de la toolbar, la píldora de estado y la barra
  rápida (`resizeCanvasViewport`). No pongas un zoom de arranque fijo tipo 85%:
  solo sirve para un tamaño de pantalla.
- Safe area (`viewport-fit=cover`). Controles de acción ≥ 44px.
- Tema, reinicio, Simple/Avanzado e idioma (banderas EN/ES, inglés por defecto) van siempre visibles.
- Modo **Simple**: sin Ajustes, valores de fábrica, pestañas `Hoja | Salida`. Modo **Avanzado**: el shell completo.
- La hoja no comparte pantalla con paneles: una pestaña visible a la vez.

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
