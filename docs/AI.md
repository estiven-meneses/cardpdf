# Reglas para IAs que editan CardPDF

Estiven quiere código limpio, compacto y sin adornos. Si una instrucción de este archivo choca con un pedido puntual del usuario, gana el pedido puntual.

## Idioma y tono

- Responde en **español**, corto, al punto. Sin relleno.
- No inventes metáforas ni nombres de features que el usuario no usó.
- Pregunta solo si estás bloqueado. Si se puede inferir, actúa.

## Antes de tocar código

Contéstales en silencio (y al usuario solo si hay duda real):

1. ¿Esto es UI, motor de canvas, recorte/perspectiva o carga de archivos?
2. ¿Otra IA o rama está tocando la misma zona? Si sí, **no la pises**. Lee `docs/BRANCHING.md`.
3. ¿El cambio introduce un segundo botón o texto que ya existe en la misma pantalla? Si sí, no lo hagas.
4. ¿Hace falta un framework, backend o dependencia nueva? Si no es imprescindible, no la agregues.
5. ¿Hay ítems `pending` en `logs/local/_pending.json` de tu zona? Si sí, arréglalos y márcalos `resolved`. No toques los `resolved`.

## Estructura y orden

- Un archivo = una responsabilidad. No sigas hinchando `src/legacy/app.js` ni `index.html`: si el cambio es un módulo nuevo, créalo en `src/`.
- Nombres en español para copy de UI; en inglés para IDs, funciones y archivos (`deselectCards`, `viewport-scroller`).
- Funciones pequeñas, con nombre que diga qué hacen. Cero comentarios que repitan el código.
- No dejes código muerto, `console.log` ni TODOs eternos.
- No crees markdown, READMEs extra ni carpetas “por si acaso”.
- No toques archivos que no pediste (incluye `GEMINI.md`, `IMPLEMENTATION_PLAN.md` y assets personales).

## UI (regla de oro)

- **App, no web.** Lee `docs/SHELL.md`. Celular = iPhone (Hoja / Ajustes / Salida, sin encabezado). Escritorio = Ajustes | Hoja | Salida a la derecha.
- **Cero redundancia**: un botón = una acción por pantalla. Nada de “Ejemplo” dos veces, ni pastilla dentro de pastilla.
- **Cero emojis** en HTML, toasts, tooltips, alertas o botones. Solo SVG vectorial propio, nítido, 24×24.
- Táctil: controles de acción ≥ 44px. Escritorio: espacio generoso, jerarquía clara.
- Copy mínimo. Si el icono o el contexto ya lo dicen, no pongas un título extra.
- Al cambiar UI, verifica el flujo de punta a punta (no solo un screenshot). Si no hay browser, dilo.
- Salida (`#panel-output`) no se mezcla con Ajustes (`#panel-controls`). Exportar no vuelve al panel izquierdo.

## Dominios que no se pisan

| Zona | Archivos / funciones típicas | Quién la toca |
|---|---|---|
| Carga, cámara, recorte inmediato, blueprint, reset total | `loadFileIntoCard`, `captureCameraPhoto`, `detectDocumentQuad` | Anti-Gravity (`feature/antigravity`) |
| Barra rápida, deselección, zoom/scroll, iconos, logs, shell | `#canvas-quick-bar`, `deselectCards`, `#viewport-scroller` | Cursor (`feature/cursor`) |
| La del encargo del chat | — | Claude (`feature/claude`), Codex (`feature/codex`) |
| Homografía / perspectiva / lupa | `openCropModal`, `warpQuadToRectangle`, `cropState` | No reescribir “de paso” |

Si tu tarea es de una zona, no “aprovechas” para rehacer la otra.

## Canvas y medidas

- CR80 = `85.6 × 53.98 mm`. Escala por defecto `150`. Radio por defecto `5 mm` (o el factory vigente).
- Frente / Dorso se posicionan en mm reales sobre la hoja. No hardcodees píxeles de hoja.
- Selección visual (`selectedCardId`) ≠ pestaña de ajustes (`activeCardId`). Deseleccionar oculta barra y recuadros.

## Hosting y backend

- **Vite + TypeScript**, con React para las superficies nuevas. El lienzo y el
  recorte siguen en `src/legacy/`, sin tipar todavía.
- Deploy: **dos hostings a la vez**, ambos desde `main` y ambos compilando.
  - Netlify (`cardpdf.netlify.app`) es el que esta vivo hoy. Config en
    `netlify.toml`, funcion en `netlify/functions/logs.js`.
  - Vercel es el destino. Config en `vercel.json`, funcion en `api/logs.js`.
  - La logica de ambos endpoints vive en `shared/log-entry.js`: se toca ahi,
    no en cada copia.
- **Nada se sirve sin compilar.** Si cambias como se construye la app, revisa
  los dos archivos de config, o un hosting queda sirviendo la raiz cruda.
- `api/logs.js` recoge los errores del cliente en producción (ver `docs/LOGS.md`).
- **Supabase** para login y fotos privadas. Sin las variables de entorno la app
  corre igual, 100% en el cliente: el backend es opcional, no obligatorio.

## Git y varias IAs (léete `docs/START.md` y `docs/BRANCHING.md`)

- Al primer turno: entra a tu rama. Cursor `feature/cursor`. Anti-Gravity `feature/antigravity`. Claude `feature/claude`. Codex `feature/codex`.
- Créala desde `origin/main` si no existe. Usa tu worktree en `.worktrees/<id>`.
- `main` no se edita a mano: se llega ahí integrando tu rama ya verificada.
- **Prohibido** merge/rebase entre features hermanas.
- Si no estás en tu rama, cámbiate. No “arregles” un conflicto de la otra.
- Commitea y pushea tu rama al terminar. A `main` se llega con merge, nunca editándola.
- No force-push a `main` ni a la rama ajena. No `--no-verify`.
- Mensajes cortos, estilo del repo: el *por qué*, no el listado de archivos.

## Qué no hacer nunca

- Incluir carnets, fotos o datos personales reales en el repo.
- Reintroducir emojis o botones de ejemplo duplicados.
- Cambiar `loadFileIntoCard` / detección de perspectiva “para limpiar”.
- Instalar librerías grandes (React, Tailwind build, etc.) en medio de un arreglo puntual. Eso es una migración, no un parche.
- Reinvestigar un log con `status: "resolved"`. Ya lo cerró otra IA.
