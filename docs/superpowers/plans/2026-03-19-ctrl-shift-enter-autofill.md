# Ctrl+Shift+Enter autofill — FillInBlank, Ordering, MultipleChoice

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir el atajo Ctrl+Shift+Enter en los tres componentes estáticos (`FillInBlank`, `Ordering`, `MultipleChoice`) para que rellene la respuesta correcta — igual al patrón ya implementado en `CasoDiagnostico` y `VlsmExercise`.

**Architecture:** `FillInBlank` y `Ordering` usan `onkeydown` por input individual (rellena solo el campo activo). `MultipleChoice` usa un listener global en `document` vía `onMount`/`onDestroy` porque los radio buttons no tienen foco de texto — rellena todas las preguntas a la vez. Se añade texto de ayuda sutil en cada sección.

**Tech Stack:** Svelte 5 (runes, `$state`, `$props`), Astro 6 (static)

**Referencias de patrón:**
- `CasoDiagnostico.svelte` — `onkeydown` por textarea
- `VlsmExercise.svelte` — listener global en document

---

## Chunk 1: FillInBlank.svelte

### Task 1: Atajo por input en FillInBlank

**Files:**
- Modify: `astro-site/src/components/ejercicios/FillInBlank.svelte`

Estado actual relevante:
- `answers[i]` — `$state` array de strings
- `item.respuestas_validas[0]` — primera respuesta válida (correcta del docente)
- `verified`, `locked` — gates; el input está `disabled` cuando alguno es `true`
- `opts` en el `<input>`: `bind:value={answers[i]}`

- [ ] **Paso 1: Añadir función `handleKeydown` en el `<script>`**

Localizar el bloque de `reset()` y el comentario de cierre del script (la función termina en la línea con `}`):
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('fillInBlank', false);
    answers  = Array(items.length).fill('');
    results  = Array(items.length).fill(null);
    verified = false;
    updateSection('fillInBlank', 0);
  }
```

Reemplazar por (añadir `handleKeydown` inmediatamente después):
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('fillInBlank', false);
    answers  = Array(items.length).fill('');
    results  = Array(items.length).fill(null);
    verified = false;
    updateSection('fillInBlank', 0);
  }

  function handleKeydown(e, i) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && !verified && !locked) {
      e.preventDefault();
      answers[i] = items[i].respuestas_validas[0];
    }
  }
```

- [ ] **Paso 2: Añadir `onkeydown` al `<input>` en el template**

Localizar:
```svelte
          <input
            class="term-input"
            type="text"
            bind:value={answers[i]}
            disabled={verified || locked}
            placeholder="___"
          />
```

Reemplazar por:
```svelte
          <input
            class="term-input"
            type="text"
            bind:value={answers[i]}
            disabled={verified || locked}
            placeholder="___"
            onkeydown={e => handleKeydown(e, i)}
          />
```

- [ ] **Paso 3: Añadir texto de ayuda después del input**

Localizar:
```svelte
          {#if item.post}<span class="term-post">{item.post}</span>{/if}
          <div class="term-desc">{item.desc}</div>
```

Reemplazar por:
```svelte
          {#if item.post}<span class="term-post">{item.post}</span>{/if}
          {#if !verified && !locked}
            <span class="term-hint-key">Ctrl+Shift+Enter</span>
          {/if}
          <div class="term-desc">{item.desc}</div>
```

- [ ] **Paso 4: Añadir estilo `.term-hint-key` en `<style>`**

Localizar:
```css
  .term-hint { width: 100%; font-size: 0.72rem; color: var(--color-correct); font-family: var(--font-mono); }
```

Reemplazar por:
```css
  .term-hint { width: 100%; font-size: 0.72rem; color: var(--color-correct); font-family: var(--font-mono); }
  .term-hint-key {
    font-family: var(--font-mono); font-size: 0.6rem;
    color: rgba(139,92,246,0.45); margin-left: auto;
    white-space: nowrap;
  }
```

---

## Chunk 2: Ordering.svelte

### Task 2: Atajo por select en Ordering

**Files:**
- Modify: `astro-site/src/components/ejercicios/Ordering.svelte`

Estado actual relevante:
- `selections[i]` — `$state` array; inicializado como `fill('')` pero los valores que asigna el usuario son números (los `<option value={o}>` donde `o` es número)
- `paso.orden` — número entero correcto para esa posición (mismo tipo que las opciones)
- `check()` usa `parseInt(selections[i]) === paso.orden` → la asignación `selections[i] = pasos[i].orden` (número) es compatible porque `parseInt(número) === número`

- [ ] **Paso 1: Añadir función `handleKeydown` en el `<script>`**

Localizar:
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('ordering', false);
    selections = Array(pasos.length).fill('');
    results    = null;
    verified   = false;
    updateSection('ordering', 0);
  }
```

Reemplazar por:
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('ordering', false);
    selections = Array(pasos.length).fill('');
    results    = null;
    verified   = false;
    updateSection('ordering', 0);
  }

  function handleKeydown(e, i) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && !verified && !locked) {
      e.preventDefault();
      selections[i] = pasos[i].orden;
    }
  }
```

- [ ] **Paso 2: Añadir `onkeydown` al `<select>` en el template**

Localizar:
```svelte
        <select bind:value={selections[i]} disabled={verified || locked}>
```

Reemplazar por:
```svelte
        <select
          bind:value={selections[i]}
          disabled={verified || locked}
          onkeydown={e => handleKeydown(e, i)}
        >
```

- [ ] **Paso 3: Añadir texto de ayuda en la cabecera**

Localizar:
```svelte
  <header class="ej-header">
    <h2 class="ej-title">Sección 03 — Ordene la Secuencia</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>
```

Reemplazar por:
```svelte
  <header class="ej-header">
    <h2 class="ej-title">Sección 03 — Ordene la Secuencia</h2>
    <span class="ej-pts">{puntos} pts</span>
    {#if !verified && !locked}
      <span class="ej-hint-key">Ctrl+Shift+Enter en cada select</span>
    {/if}
  </header>
```

- [ ] **Paso 4: Añadir estilo `.ej-hint-key` en `<style>`**

Localizar:
```css
  .ej-ctx    { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; }
```

Reemplazar por:
```css
  .ej-ctx    { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; }
  .ej-hint-key {
    font-family: var(--font-mono); font-size: 0.6rem;
    color: rgba(139,92,246,0.45);
  }
```

---

## Chunk 3: MultipleChoice.svelte

### Task 3: Listener global en MultipleChoice

**Files:**
- Modify: `astro-site/src/components/ejercicios/MultipleChoice.svelte`

Estado actual relevante:
- `selections[qi]` — índice de opción seleccionada (número) o `null`
- `pregunta.correcta` — índice correcto (número)
- El `import { onMount, onDestroy }` ya existe en línea 2
- El `onMount` existente (líneas 23-36) restaura estado de localStorage — **no se toca**
- El `onDestroy` existente (línea 15) llama a `unsubLock()` — **se refactoriza para añadir cleanup del listener**

> **Nota de orden:** Se añade `handleGlobalKeydown` y un segundo `onMount` **después** de
> `reset()` (línea 54). El `onMount` existente en línea 23 permanece donde está; Svelte
> ejecuta todos los `onMount` registrados. No hay que reordenar el código existente.

- [ ] **Paso 1: Añadir `handleGlobalKeydown` y segundo `onMount` después de `reset()`**

Localizar:
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('multipleChoice', false);
    selections = Array(preguntas.length).fill(null);
    results    = null;
    verified   = false;
    updateSection('multipleChoice', 0);
  }
```

Reemplazar por:
```js
  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('multipleChoice', false);
    selections = Array(preguntas.length).fill(null);
    results    = null;
    verified   = false;
    updateSection('multipleChoice', 0);
  }

  function handleGlobalKeydown(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && !verified && !locked) {
      e.preventDefault();
      selections = preguntas.map(p => p.correcta);
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
  });
```

- [ ] **Paso 2: Refactorizar `onDestroy` para incluir cleanup del listener**

Localizar:
```js
  const unsubLock = isLocked.subscribe(v => { locked = v; });
  onDestroy(unsubLock);
```

Reemplazar por:
```js
  const unsubLock = isLocked.subscribe(v => { locked = v; });
  onDestroy(() => {
    unsubLock();
    document.removeEventListener('keydown', handleGlobalKeydown);
  });
```

- [ ] **Paso 3: Añadir texto de ayuda en la cabecera**

Localizar:
```svelte
  <header class="ej-header">
    <h2 class="ej-title">Sección 04 — Preguntas de Escenario</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>
```

Reemplazar por:
```svelte
  <header class="ej-header">
    <h2 class="ej-title">Sección 04 — Preguntas de Escenario</h2>
    <span class="ej-pts">{puntos} pts</span>
    {#if !verified && !locked}
      <span class="ej-hint-key">Ctrl+Shift+Enter → todas</span>
    {/if}
  </header>
```

- [ ] **Paso 4: Añadir estilo `.ej-hint-key` en `<style>`**

Localizar:
```css
  .ej-actions { margin-top: 1rem; }
```

Reemplazar por:
```css
  .ej-actions { margin-top: 1rem; }
  .ej-hint-key {
    font-family: var(--font-mono); font-size: 0.6rem;
    color: rgba(139,92,246,0.45);
  }
```

---

## Chunk 4: Build y commit

### Task 4: Verificar y commitear

- [ ] **Paso 1: Build**

```bash
cd /mnt/c/dev/sites-didacticos/astro-site && \
  export NVM_DIR="$HOME/.nvm" && \
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" && \
  nvm use 22 && \
  npm run build 2>&1 | tail -15
```

Esperado: `✓ Completed` sin errores.

- [ ] **Paso 2: Commit**

```bash
cd /mnt/c/dev/sites-didacticos && \
  git add \
    astro-site/src/components/ejercicios/FillInBlank.svelte \
    astro-site/src/components/ejercicios/Ordering.svelte \
    astro-site/src/components/ejercicios/MultipleChoice.svelte && \
  git commit -m "feat: Ctrl+Shift+Enter autofill en FillInBlank, Ordering y MultipleChoice

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
