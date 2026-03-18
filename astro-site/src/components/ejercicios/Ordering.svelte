<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  let { pasos = [], contexto = '', puntos = 5 } = $props();

  let selections = $state(Array(pasos.length).fill(''));
  let results  = $state(null);
  let verified = $state(false);
  let locked   = $state(false);
  const opts   = pasos.map((_, i) => i + 1);

  onMount(() => {
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function check() {
    if (locked) return;
    results  = pasos.map((paso, i) => parseInt(selections[i]) === paso.orden);
    const allCorrect = results.every(Boolean);
    updateSection('ordering', allCorrect ? puntos : 0);
    verified = true;
  }

  function reset() {
    selections = Array(pasos.length).fill('');
    results    = null;
    verified   = false;
    updateSection('ordering', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 03 — Ordene la Secuencia</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  {#if contexto}
    <p class="ej-ctx">{contexto}</p>
  {/if}

  <div class="order-list">
    {#each pasos as paso, i}
      <div class="order-item" class:correct={results?.[i] === true} class:wrong={results?.[i] === false}>
        <select bind:value={selections[i]} disabled={verified || locked}>
          <option value="">—</option>
          {#each opts as o}
            <option value={o}>{o}</option>
          {/each}
        </select>
        <span class="order-cmd">{paso.label}</span>
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
  .order-item.correct { border-color: var(--color-correct); background: #00ff4110; }
  .order-item.wrong   { border-color: var(--color-error);   background: #ff3a3a10; }
  select {
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); color: var(--text-primary);
    font-family: var(--font-mono); font-size: 0.82rem;
    padding: 0.3rem 0.4rem; width: 3rem;
  }
  select:disabled { opacity: 0.6; cursor: not-allowed; }
  .order-cmd { font-family: var(--font-mono); font-size: 0.82rem; color: #00e5ff; }
</style>
