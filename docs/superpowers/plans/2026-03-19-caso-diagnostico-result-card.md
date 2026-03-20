# Result Card unificado — CasoDiagnostico

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la barra de acciones de `CasoDiagnostico` con una tarjeta de resultado visualmente idéntica a `ResultPanel`, mostrando progreso de campos completados en lugar de puntos.

**Architecture:** Un único componente Svelte se modifica. Se añaden `$derived` reactivos (`allFieldKeys`, `filled`, `total`, `rating`) en el `<script>`. En el template se reemplaza `div.action-bar` por `div.result.card`. Los estilos del card se añaden al bloque `<style>` del componente.

**Tech Stack:** Svelte 5 (runes mode: `$state`, `$derived`), Astro 6 (static build), Node 22

**Spec:** `docs/superpowers/specs/2026-03-19-caso-diagnostico-result-card-design.md`

---

## Chunk 1: Script — derivados reactivos y limpieza

### Task 1: Añadir `$derived` para campos y rating

**Files:**
- Modify: `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`

Contexto del archivo actual (líneas clave del `<script>`):

```js
// Estado actual (lo que existe)
let progress      = $state(0);
let progressLabel = $state('0 / 0 campos completados');
let submitStatus  = $state('');
let submitMsg     = $state('');
let warnMsg       = $state('');
let pdfRequired   = $state(false);
```

- [ ] **Paso 1: Eliminar `submitMsg` y `progressLabel` del bloque de estado**

En `CasoDiagnostico.svelte`, en el bloque `$state` inicial, borrar estas dos líneas:
```js
let submitMsg     = $state('');
let progressLabel = $state('0 / 0 campos completados');
```

- [ ] **Paso 2: Añadir los `$derived` inmediatamente después del bloque de estado**

Después de `let pdfRequired = $state(false);` y antes del comentario `// ── Hash determinista`, insertar:

```js
// ── Derivados reactivos para el card de resultado ─────────
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
let rating = $derived(
  submitStatus === 'err'  ? { icon: '🔁', label: 'ERROR DE ENVÍO', color: '#ff3a3a' } :
  progress === 100        ? { icon: '🏆', label: 'COMPLETO',        color: '#00ff41' } :
  progress >= 50          ? { icon: '⚠️', label: 'INCOMPLETO',      color: '#ffb800' } :
                            { icon: '🔁', label: 'SIN COMPLETAR',   color: '#ff3a3a' }
);
```

- [ ] **Paso 3: Limpiar `updateProgress()` — eliminar `progressLabel`**

La función `updateProgress()` actualmente asigna `progressLabel`. Reemplazarla por:

```js
function updateProgress() {
  const allFields = getAllFieldKeys();
  const f = allFields.filter(k => respuestas[k]?.trim()).length;
  const t = allFields.length;
  progress = t > 0 ? Math.round((f / t) * 100) : 0;
}
```

(Se eliminan las líneas `progress = ...` y `progressLabel = ...` originales y se reescribe solo con `progress`.)

- [ ] **Paso 4: Eliminar todas las asignaciones a `submitMsg`**

Buscar en `handleSubmit()` estas tres asignaciones y eliminarlas:
- `submitMsg    = '⏳ Registrando…';`
- `submitMsg    = '✓ Tarea entregada al docente correctamente';`
- `submitMsg    = \`Error: ${err.message}\`;`

---

## Chunk 2: Template — top bar y card de resultado

### Task 2: Actualizar barra de progreso superior y reemplazar action-bar

**Files:**
- Modify: `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`

- [ ] **Paso 1: Actualizar la barra de progreso superior**

En el template, la barra de progreso muestra actualmente `{progressLabel}`. Como `progressLabel` ya no existe, reemplazar:

```svelte
<span class="prog-label">{progressLabel}</span>
```

por:

```svelte
<span class="prog-label">{filled} / {total} campos completados</span>
```

- [ ] **Paso 2: Reemplazar `div.action-bar` con `div.result.card`**

Localizar el bloque:
```svelte
{#if assignedCases.length > 0}
  {#if warnMsg}
    <div class="warn-banner">{warnMsg}</div>
  {/if}

  <!-- Banner de error con PDF obligatorio -->
  {#if pdfRequired}
    <div class="pdf-required-banner no-print">
      ...
    </div>
  {/if}

  <div class="action-bar no-print">
    {#if submitStatus === ''}
      <button class="btn btn-submit" onclick={handleSubmit}>📤 Enviar al docente</button>
    {:else if submitStatus === 'pending'}
      <button class="btn btn-submit" disabled>⏳ Enviando…</button>
    {:else if submitStatus === 'ok'}
      <span class="submit-ok">✓ Tarea entregada</span>
    {:else if submitStatus === 'err'}
      <button class="btn btn-retry" onclick={handleSubmit}>↺ Reintentar envío</button>
    {/if}

    {#if exportarPdf}
      <button class="btn btn-print" onclick={handlePrint}>
        🖨️ Imprimir / PDF
      </button>
    {/if}
  </div>
{/if}
```

Reemplazarlo en su totalidad con:

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
        <div class="pdf-req-icon">⚠️</div>
        <div class="pdf-req-content">
          <strong>No se pudo entregar en línea.</strong>
          <span>Debes imprimir el PDF y entregarlo físicamente al docente. El registro en línea falló.</span>
        </div>
        <button class="btn btn-pdf-urgent" onclick={handlePrint}>
          🖨️ Imprimir PDF ahora
        </button>
      </div>
    {/if}

    <div class="result-actions">
      {#if exportarPdf}
        <button class="btn btn-print" onclick={handlePrint}>🖨️ Imprimir / PDF</button>
      {/if}
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

> Nota: `pdf-required-banner` pierde la clase `no-print` porque el card padre ya la tiene. Mantener el contenido HTML interno idéntico al original.

---

## Chunk 3: Estilos — añadir card, eliminar action-bar

### Task 3: Actualizar bloque `<style>`

**Files:**
- Modify: `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`

- [ ] **Paso 1: Eliminar `.action-bar` del bloque `<style>`**

Localizar y borrar:
```css
/* Barra de acciones */
.action-bar {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  padding-top: 0.5rem; margin-bottom: 0.5rem;
}
```

- [ ] **Paso 2: Eliminar `.submit-ind` si existe**

Buscar y eliminar si existen las reglas `.submit-ind`, `.submit-ind.ok`, `.submit-ind.err`. (El revisor indicó que es posible que ya no estén — si no existen, omitir.)

- [ ] **Paso 3: Añadir estilos del card de resultado**

Al final del bloque `<style>`, antes de los bloques `@media`, insertar:

```css
/* Card de resultado */
.result {
  text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: 0.8rem;
}
.result-rating { display: flex; align-items: center; gap: 0.5rem; }
.result-icon   { font-size: 1.8rem; }
.result-label  { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
.result-score  { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); }
.result-of     { font-size: 1rem; color: var(--text-muted); }
.result-bar-wrap {
  width: 100%; max-width: 400px;
  background: var(--border); border-radius: 100px; height: 8px; overflow: hidden;
}
.result-bar    { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
.result-pct    { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); }
.result-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
```

---

## Chunk 4: Verificación y commit

### Task 4: Build, verificación visual y commit

**Files:**
- Modify: `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`

- [ ] **Paso 1: Build**

```bash
cd astro-site && \
  export NVM_DIR="$HOME/.nvm" && \
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" && \
  nvm use 22 && \
  npm run build 2>&1 | tail -15
```

Esperado: `✓ Completed` sin errores. Si hay errores de compilación Svelte, revisar que:
- Los `$derived` no referencien variables que aún no están declaradas
- `progressLabel` no sea referenciado en ningún lugar del template ni del script
- `submitMsg` no sea referenciado en el template

- [ ] **Paso 2: Verificación de estados del card (inspección visual)**

Abrir `astro-site/dist/adm-soporte/modulo1/tarea/diagnostico-hardware/index.html` en un browser o usar `npm run preview` y navegar a esa ruta.

Checklist visual:
- [ ] Sin identificación → card no aparece (mensaje de espera)
- [ ] Con identificación, 0 campos llenos → card rojo, 🔁 SIN COMPLETAR, `0 / 20 campos`, `0%`
- [ ] Con ≥ 50% de campos → card ámbar, ⚠️ INCOMPLETO
- [ ] Con 100% de campos → card verde, 🏆 COMPLETO, `N / N campos`, `100%`
- [ ] Barra de progreso superior sigue actualizando mientras se escribe (reactiva)
- [ ] Barra del card también actualiza

- [ ] **Paso 3: Commit**

```bash
cd /mnt/c/dev/sites-didacticos && \
  git add astro-site/src/components/ejercicios/CasoDiagnostico.svelte && \
  git commit -m "feat: unificar CasoDiagnostico con card de resultado de ResultPanel

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
