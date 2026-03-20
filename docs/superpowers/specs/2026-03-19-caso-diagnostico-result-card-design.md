# Design: Result Card unificado — CasoDiagnostico

**Fecha:** 2026-03-19
**Archivo objetivo:** `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`
**Referencia visual:** `astro-site/src/components/ui/ResultPanel.svelte`

---

## Objetivo

Reemplazar la barra de acciones actual de `CasoDiagnostico` con una tarjeta de resultado
que tenga exactamente la misma estructura visual que `ResultPanel`, adaptando las métricas
de *puntos obtenidos* → *campos completados*.

---

## Estructura del card (DOM)

```
div.result.card  (borde dinámico según rating)
├── div.result-rating
│   ├── span.result-icon   (emoji según rating)
│   └── span.result-label  (texto según rating, color dinámico)
├── div.result-score
│   ├── {filled}
│   └── span.result-of " / {total} campos"
├── div.result-bar-wrap
│   └── div.result-bar  (width:{progress}%, background:{rating.color})
├── div.result-pct  "{progress}%"
├── [div.warn-banner]          — si warnMsg existe
├── [div.pdf-required-banner]  — si pdfRequired
└── div.result-actions
    ├── [button.btn.btn-print]  — si exportarPdf
    └── [estado del envío]      — máquina de estados ya implementada
```

---

## Lógica de rating (derived)

| Condición (evaluadas en orden) | Color | Icon | Label |
|---|---|---|---|
| `submitStatus === 'err'` | `#ff3a3a` | 🔁 | ERROR DE ENVÍO |
| `progress === 100` | `#00ff41` | 🏆 | COMPLETO |
| `progress >= 50` | `#ffb800` | ⚠️ | INCOMPLETO |
| `progress < 50` | `#ff3a3a` | 🔁 | SIN COMPLETAR |

Se implementa como `$derived` al igual que en `ResultPanel`:

```js
let rating = $derived(
  submitStatus === 'err'  ? { icon: '🔁', label: 'ERROR DE ENVÍO', color: '#ff3a3a' } :
  progress === 100        ? { icon: '🏆', label: 'COMPLETO',        color: '#00ff41' } :
  progress >= 50          ? { icon: '⚠️', label: 'INCOMPLETO',      color: '#ffb800' } :
                            { icon: '🔁', label: 'SIN COMPLETAR',   color: '#ff3a3a' }
);
```

---

## Barra de progreso superior

Se mantiene sin cambios. Proporciona feedback en tiempo real mientras el estudiante
llena los campos. El card al fondo la repite como resumen consolidado.

---

## Cambios en el bloque `<script>`

- Añadir `$derived` para `rating` (usando `submitStatus` y `progress`)
- Añadir `$derived` para `filled` (campos con contenido) y `total` (total de campos)
- Eliminar `submitMsg` y su uso — el estado queda cubierto por el card y el toast

---

## Cambios en el template

- Reemplazar `div.action-bar` por `div.result.card` con el DOM descrito arriba
- Mantener `div.warn-banner` y `div.pdf-required-banner` dentro del card
- Mantener la máquina de estados del botón de envío en `div.result-actions`

---

## Cambios en `<style>`

Añadir los estilos del card al bloque `<style>` del componente (encapsulados por Svelte,
no disponibles desde `base.css`):

```css
.result       { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
.result-rating { display: flex; align-items: center; gap: 0.5rem; }
.result-icon   { font-size: 1.8rem; }
.result-label  { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
.result-score  { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); }
.result-of     { font-size: 1rem; color: var(--text-muted); }
.result-bar-wrap { width: 100%; max-width: 400px; background: var(--border); border-radius: 100px; height: 8px; overflow: hidden; }
.result-bar    { height: 100%; border-radius: 100px; transition: width 0.3s ease; }
.result-pct    { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); }
.result-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
```

Eliminar: `.action-bar`, `.submit-ind`

---

## Lo que NO cambia

- Barra de progreso superior (`div.prog-wrap`)
- Toast de éxito/error
- Lógica de `handleSubmit`, `handlePrint`, `saveState`, `loadState`
- `div.pdf-required-banner` (se mueve dentro del card)
- `div.warn-banner` (se mueve dentro del card)
- Máquina de estados del botón (idle → pending → ok/err)
- Guard `if (submitStatus === 'ok' || submitStatus === 'pending') return`

---

## Verificación

1. `nvm use 22 && npm run build` — sin errores
2. Flujo éxito: card verde 🏆 COMPLETO, botón → "✓ Tarea entregada"
3. Flujo error: card rojo 🔁 ERROR DE ENVÍO, banner PDF, botón → "↺ Reintentar"
4. Progreso parcial: card ámbar ⚠️ INCOMPLETO
5. Sin campos: card rojo 🔁 SIN COMPLETAR
6. ResultPanel en CCNA1 no cambia
