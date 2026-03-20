# Design: Result Card unificado — CasoDiagnostico

**Fecha:** 2026-03-19
**Archivo objetivo:** `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`
**Referencia visual:** `astro-site/src/components/ui/ResultPanel.svelte`

---

## Estado actual del componente

La `div.action-bar.no-print` **todavía existe** en el template — es lo que se reemplaza.
El `<script>` conserva `submitMsg` y `progressLabel` como `$state`.
Los `$state` `progress`, `filled`, `total` **no existen aún** como derivados reactivos
en el nivel del módulo; `filled` y `total` son variables locales dentro de `updateProgress()`.

Lo que **ya está implementado** (no tocar):
- Guard `if (submitStatus === 'ok' || submitStatus === 'pending') return` en `handleSubmit`
- Máquina de estados del botón (`''` → `'pending'` → `'ok'` / `'err'`) en la action-bar
- Estilos `.btn-retry`, `.submit-ok` en `<style>`
- `div.pdf-required-banner` y `div.warn-banner`
- Toast de éxito/error

Lo que **falta implementar** (este plan):
1. Añadir `$derived` reactivos para `allFieldKeys`, `filled`, `total`
2. Añadir `$derived` para `rating` (basado en `progress` y `submitStatus`)
3. Reemplazar `div.action-bar` con `div.result.card` en el template
4. Añadir estilos del card al `<style>`
5. Eliminar `submitMsg`, `progressLabel` y `.submit-ind`, `.action-bar` de `<style>`

---

## Estructura del card (DOM — reemplaza div.action-bar)

```
div.result.card.no-print  (style="border-color:{rating.color}")
├── div.result-rating
│   ├── span.result-icon   {rating.icon}
│   └── span.result-label  style="color:{rating.color}"  {rating.label}
├── div.result-score
│   ├── {filled}
│   └── span.result-of " / {total} campos"
├── div.result-bar-wrap
│   └── div.result-bar  style="width:{progress}%; background:{rating.color}"
├── div.result-pct  "{progress}%"
├── [div.warn-banner]          — si warnMsg existe (ya implementado)
├── [div.pdf-required-banner]  — si pdfRequired (ya implementado)
└── div.result-actions
    ├── [button.btn.btn-print]  — si exportarPdf (ya implementado)
    └── [máquina de estados del envío]  — ya implementada, sin cambios
```

---

## Cambios en `<script>`

### Eliminar
```js
let submitMsg     = $state('');
let progressLabel = $state('');
```
(Y todas las asignaciones: `submitMsg = '...'`, `progressLabel = '...'`)

### Añadir derivados reactivos

```js
// Campos reactivos para el card
let allFieldKeys = $derived(
  [
    ...assignedCases.flatMap(c => {
      const base = c.id.toLowerCase().replace('-', '');
      return [
        ...c.questions.map((_, i) => `${base}-q${i + 1}`),
        `${base}-dictamen`,
      ];
    }),
    ...seccionesEstaticas.map(s => s.id),
  ]
);
let filled = $derived(allFieldKeys.filter(k => respuestas[k]?.trim()).length);
let total  = $derived(allFieldKeys.length);

// Reemplaza la lógica de updateProgress — progress sigue siendo $state,
// pero se actualiza también en setResponse y assignForStudent como antes.
// filled y total se leen desde los $derived en el template.
```

> **Nota:** `progress` permanece como `$state` actualizado dentro de `updateProgress()`
> (no se convierte a `$derived` para no romper la barra de progreso superior que
> ya funciona correctamente). `filled` y `total` son `$derived` nuevos que leen
> `assignedCases`, `seccionesEstaticas` y `respuestas`.

### Rating derivado

```js
let rating = $derived(
  submitStatus === 'err'  ? { icon: '🔁', label: 'ERROR DE ENVÍO', color: '#ff3a3a' } :
  progress === 100        ? { icon: '🏆', label: 'COMPLETO',        color: '#00ff41' } :
  progress >= 50          ? { icon: '⚠️', label: 'INCOMPLETO',      color: '#ffb800' } :
                            { icon: '🔁', label: 'SIN COMPLETAR',   color: '#ff3a3a' }
);
```

> Los valores de `submitStatus` (`''`, `'pending'`, `'ok'`, `'err'`) son los
> existentes en el componente y **no se modifican**. El rating usa `'err'`
> (no `'error'` que usa ResultPanel).

---

## Cambios en el template

Reemplazar:

```svelte
<div class="action-bar no-print">
  ...
</div>
```

Por:

```svelte
{#if assignedCases.length > 0}
  <div class="result card no-print" style="border-color:{rating.color}">
    <div class="result-rating">
      <span class="result-icon">{rating.icon}</span>
      <span class="result-label" style="color:{rating.color}">{rating.label}</span>
    </div>
    <div class="result-score">{filled} <span class="result-of">/ {total} campos</span></div>
    <div class="result-bar-wrap">
      <div class="result-bar" style="width:{progress}%; background:{rating.color}"></div>
    </div>
    <div class="result-pct">{progress}%</div>

    {#if warnMsg}
      <div class="warn-banner">{warnMsg}</div>
    {/if}

    {#if pdfRequired}
      <div class="pdf-required-banner">
        ...  <!-- estructura existente, sin cambios -->
      </div>
    {/if}

    <div class="result-actions">
      {#if exportarPdf}
        <button class="btn btn-print" onclick={handlePrint}>🖨️ Imprimir / PDF</button>
      {/if}
      <!-- Máquina de estados del botón — sin cambios -->
      {#if submitStatus === ''}
        <button class="btn btn-submit" onclick={handleSubmit}>📤 Enviar al docente</button>
      {:else if submitStatus === 'pending'}
        <button class="btn btn-submit" disabled>⏳ Enviando…</button>
      {:else if submitStatus === 'ok'}
        <span class="submit-ok">✓ Tarea entregada</span>
      {:else if submitStatus === 'err'}
        <button class="btn btn-retry" onclick={handleSubmit}>↺ Reintentar envío</button>
      {/if}
    </div>
  </div>
{/if}
```

> El bloque está ya envuelto en `{#if assignedCases.length > 0}` — igual que antes.

---

## Cambios en `<style>`

### Eliminar
```css
.action-bar { ... }
.submit-ind { ... }
.submit-ind.ok { ... }
.submit-ind.err { ... }
```

### Añadir (mismos valores que ResultPanel, con `transition: width 0.8s ease`)

```css
.result       { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
.result-rating { display: flex; align-items: center; gap: 0.5rem; }
.result-icon   { font-size: 1.8rem; }
.result-label  { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
.result-score  { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); }
.result-of     { font-size: 1rem; color: var(--text-muted); }
.result-bar-wrap { width: 100%; max-width: 400px; background: var(--border); border-radius: 100px; height: 8px; overflow: hidden; }
.result-bar    { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
.result-pct    { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); }
.result-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
```

> Nota: `transition: width 0.8s ease` para coincidir con `ResultPanel` (no `0.3s`).

---

## Lo que NO cambia

- Barra de progreso superior (`div.prog-wrap`) y su estilo `.prog-wrap`, `.prog-fill`
- `progress` como `$state` y su actualización dentro de `updateProgress()`
- `getAllFieldKeys()` como función (puede coexistir con los `$derived` nuevos o eliminarse si se migra toda su lógica a `allFieldKeys`)
- Toast de éxito/error
- `handleSubmit`, `handlePrint`, `saveState`, `loadState`, `assignForStudent`
- Guard `if (submitStatus === 'ok' || submitStatus === 'pending') return`
- Estilos `.btn-retry`, `.btn-submit`, `.submit-ok`, `.pdf-required-banner`, `.warn-banner`

---

## Verificación

1. `nvm use 22 && npm run build` — sin errores de compilación
2. Sin estudiante identificado: el card no aparece (igual que antes)
3. 0 campos llenos: card rojo 🔁 SIN COMPLETAR, 0 / N campos, 0%
4. Campos parciales (< 50%): card rojo 🔁 SIN COMPLETAR
5. Campos parciales (≥ 50%): card ámbar ⚠️ INCOMPLETO
6. Todos los campos: card verde 🏆 COMPLETO, N / N campos, 100%
7. Flujo éxito: card queda verde, botón → "✓ Tarea entregada", no re-envía
8. Flujo error: card cambia a rojo 🔁 ERROR DE ENVÍO, banner PDF, botón → "↺ Reintentar"
9. Barra de progreso superior sigue actualizándose en tiempo real
10. `ResultPanel` de CCNA1 no cambia
