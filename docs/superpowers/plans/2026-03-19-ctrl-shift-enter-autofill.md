# Ctrl+Shift+Enter autofill — FillInBlank, Ordering, MultipleChoice

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir el atajo Ctrl+Shift+Enter en los tres componentes estáticos (`FillInBlank`, `Ordering`, `MultipleChoice`) para que, al estar enfocado en un input, rellene la respuesta correcta — igual al patrón ya implementado en `CasoDiagnostico` y `VlsmExercise`.

**Architecture:** Cada componente implementa el handler de forma independiente siguiendo el mismo patrón: `onkeydown` por input (FillInBlank, Ordering) para rellenar solo el campo activo; listener global de sección en `onMount`/`onDestroy` (MultipleChoice, donde los radio buttons no tienen foco de texto). Se añade texto de ayuda "Ctrl+Shift+Enter → respuesta correcta" visible solo cuando la sección no está verificada ni bloqueada.

**Tech Stack:** Svelte 5 (runes, `$state`, `$props`), Astro 6 (static)

**Referencias de patrón:**
- `CasoDiagnostico.svelte` — `onkeydown` por textarea, `handleKeydown(e, key, answer)`
- `VlsmExercise.svelte` — listener global en document, `autoFillAll()`

---

## Chunk 1: FillInBlank.svelte

### Task 1: Atajo por input en FillInBlank

**Files:**
- Modify: `astro-site/src/components/ejercicios/FillInBlank.svelte`

Estado actual del componente:
- `answers[i]` — `$state`, array de strings con las respuestas del estudiante
- `item.respuestas_validas[0]` — primera respuesta válida (la correcta del docente)
- `verified`, `locked` — gates para deshabilitar edición
- El `<input>` usa `bind:value={answers[i]}`

- [ ] **Paso 1: Añadir función `handleKeydown` en el `<script>`**

Después de la función `reset()` (línea 63), insertar:

```js
  function handleKeydown(e, i) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && !verified && !locked) {
      e.preventDefault();
      answers[i] = items[i].respuestas_validas[0];
    }
  }
```

- [ ] **Paso 2: Añadir `onkeydown` al `<input>` en el template**

Localizar el `<input>` actual:
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

- [ ] **Paso 3: Añadir texto de ayuda después del `<input>`**

Después del `{#if item.post}` (línea 90), insertar antes del `<div class="term-desc">`:
```svelte
          {#if !verified && !locked}
            <span class="term-hint-key">Ctrl+Shift+Enter</span>
          {/if}
```

- [ ] **Paso 4: Añadir estilo `.term-hint-key` en `<style>`**

Después de `.term-hint { ... }` (línea 145), añadir:
```css
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

Estado actual:
- `selections[i]` — `$state`, array; cada posición guarda el número de orden elegido
- `paso.orden` — número correcto para esa posición
- El `<select>` usa `bind:value={selections[i]}`
- `opts = pasos.map((_, i) => i + 1)` — opciones numéricas

- [ ] **Paso 1: Añadir función `handleKeydown` en el `<script>`**

Después de la función `reset()` (línea 63), insertar:

```js
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

- [ ] **Paso 3: Añadir texto de ayuda en la cabecera de sección**

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

Después de `.ej-ctx { ... }` (línea 112), añadir:
```css
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

Estado actual:
- `selections[qi]` — índice de la opción seleccionada (número) o `null`
- `pregunta.correcta` — índice correcto (número)
- Los radio buttons usan `bind:group={selections[qi]}`
- No hay foco de texto, por lo que se usa listener global en `document`

> **Nota de diseño:** A diferencia de FillInBlank y Ordering, MultipleChoice usa radio
> buttons sin texto de input. Se adjunta el listener al `document` en `onMount` para
> capturar el atajo globalmente cuando la sección está visible. El atajo rellena TODAS
> las preguntas a la vez (comportamiento igual a VlsmExercise).

- [ ] **Paso 1: Añadir listener global en `onMount` / `onDestroy`**

El `import { onMount, onDestroy }` ya existe en la línea 2.

Después de la función `reset()` (línea 54), insertar:

```js
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

Después del `onDestroy` existente (línea 15 — `const unsubLock = isLocked.subscribe(...)`), añadir cleanup del listener. Localizar:

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

> **Importante:** `handleGlobalKeydown` debe estar declarada ANTES de `onMount` para
> evitar el error "used before declaration". Asegurarse de que el orden en el script sea:
> `reset()` → `handleGlobalKeydown` → `onMount` → `onDestroy`.
>
> El `onMount` existente (líneas 23-36) se mantiene igual; se añade un segundo `onMount`
> para el listener del teclado. Svelte permite múltiples `onMount`.

- [ ] **Paso 2: Añadir texto de ayuda en la cabecera**

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

- [ ] **Paso 3: Añadir estilo `.ej-hint-key` en `<style>`**

Después de `.ej-actions { ... }` (línea 101), añadir:
```css
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

Esperado: `✓ Completed` sin errores. Si hay error de Svelte, verificar:
- `handleKeydown` declarada antes de usarse en el template
- `handleGlobalKeydown` declarada antes de `onMount`

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
