<script>
  import { onMount, onDestroy } from 'svelte';
  import { updateSection, isLocked, markVerified } from '../../stores/score.js';

  let { pasos = [], contexto = '', puntos = 5, entregaId = '' } = $props();

  const SK = `respuestas_v1_${entregaId}_ordering`;

  let selections = $state(Array(pasos.length).fill(''));
  let results  = $state(null);
  let verified = $state(false);
  let locked   = $state(isLocked.get());
  const opts   = pasos.map((_, i) => i + 1);

  const unsubLock = isLocked.subscribe(v => { locked = v; });
  onDestroy(unsubLock);

  // Track which numbers are used more than once
  let usedNums = $derived(
    selections.reduce((acc, v) => {
      if (v !== '') acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {})
  );

  $effect(() => {
    if (typeof localStorage !== 'undefined' && entregaId) {
      localStorage.setItem(SK, JSON.stringify({ selections, verified, results }));
    }
  });

  onMount(() => {
    if (!entregaId) return;
    const raw = localStorage.getItem(SK);
    if (!raw) return;
    const d = JSON.parse(raw);
    selections = d.selections ?? Array(pasos.length).fill('');
    verified   = d.verified  ?? false;
    results    = d.results   ?? null;
    if (verified) {
      const allCorrect = (results ?? []).every(Boolean);
      updateSection('ordering', allCorrect ? puntos : 0);
      markVerified('ordering');
    }
  });

  function check() {
    if (locked) return;
    results  = pasos.map((paso, i) => parseInt(selections[i]) === paso.orden);
    const allCorrect = results.every(Boolean);
    updateSection('ordering', allCorrect ? puntos : 0);
    markVerified('ordering');
    verified = true;
  }

  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('ordering', false);
    selections = Array(pasos.length).fill('');
    results    = null;
    verified   = false;
    updateSection('ordering', 0);
  }
</script>

<section class="ejercicio card" id="sec-order">
  <header class="ej-header">
    <h2 class="ej-title">Sección 03 — Ordene la Secuencia</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  {#if contexto}
    <p class="ej-ctx">{contexto}</p>
  {/if}

  <div class="order-list">
    {#each pasos as paso, i}
      {@const isDuplicate = !verified && selections[i] !== '' && usedNums[selections[i]] > 1}
      <div
        class="order-item"
        class:correct={results?.[i] === true}
        class:wrong={results?.[i] === false}
        class:duplicate={isDuplicate}
      >
        <select bind:value={selections[i]} disabled={verified || locked}>
          <option value="">—</option>
          {#each opts as o}
            <option value={o}>{o}</option>
          {/each}
        </select>
        <span class="order-cmd">{paso.label}</span>
        {#if isDuplicate}
          <span class="dup-warn" title="Número duplicado">⚠</span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="ej-actions">
    {#if !verified}
      <button class="btn btn-primary" onclick={check} disabled={locked}>▶ Verificar</button>
    {:else}
      <button class="btn" onclick={reset}>↺ Reiniciar</button>
    {/if}
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-ctx    { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; }
  .ej-actions { margin-top: 1rem; }
  .order-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .order-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.5rem 0.75rem; border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); transition: border-color var(--transition);
  }
  .order-item.correct   { border-color: var(--color-correct); background: #00ff4110; }
  .order-item.wrong     { border-color: var(--color-error);   background: #ff3a3a10; }
  .order-item.duplicate { border-color: #ffb800; background: #ffb80010; }
  select {
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); color: var(--text-primary);
    font-family: var(--font-mono); font-size: 0.82rem;
    padding: 0.3rem 0.4rem; width: 3rem;
  }
  select:disabled { opacity: 0.6; cursor: not-allowed; }
  .order-cmd { font-family: var(--font-mono); font-size: 0.82rem; color: #00e5ff; flex: 1; }
  .dup-warn  { font-size: 0.75rem; color: #ffb800; }
</style>
