<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  let { pares = [], puntos = 10 } = $props();

  let shuffledCmds = $state([]);
  let shuffledDefs = $state([]);
  let selCmd  = $state(null);
  let selDef  = $state(null);
  let matched = $state({});
  let done    = $state(false);
  let locked  = $state(false);

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  onMount(() => {
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function selectCmd(par) {
    if (done || locked || matched[par.id] !== undefined) return;
    selCmd = par;
    tryMatch();
  }

  function selectDef(par) {
    if (done || locked || matched[par.id] !== undefined) return;
    selDef = par;
    tryMatch();
  }

  function tryMatch() {
    if (!selCmd || !selDef) return;
    const correct    = selCmd.id === selDef.id;
    const wrongCmdId = selCmd.id;
    matched = { ...matched, [wrongCmdId]: correct };
    selCmd = null;
    selDef = null;

    if (!correct) {
      setTimeout(() => {
        const { [wrongCmdId]: _, ...rest } = matched;
        matched = rest;
      }, 800);
    }

    if (Object.values(matched).filter(Boolean).length === pares.length) {
      done = true;
      updateSection('matching', puntos);
    }
  }

  function reset() {
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
    matched = {};
    selCmd  = null;
    selDef  = null;
    done    = false;
    updateSection('matching', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 02 — Relacione Columnas</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  <div class="match-grid">
    <div class="match-col">
      {#each shuffledCmds as par}
        <button
          class="match-btn cmd"
          class:selected={selCmd?.id === par.id}
          class:correct={matched[par.id] === true}
          class:wrong={matched[par.id] === false}
          disabled={done || locked || matched[par.id] === true}
          onclick={() => selectCmd(par)}
        >{par.comando}</button>
      {/each}
    </div>
    <div class="match-col">
      {#each shuffledDefs as par}
        <button
          class="match-btn def"
          class:selected={selDef?.id === par.id}
          class:correct={matched[par.id] === true}
          class:wrong={matched[par.id] === false}
          disabled={done || locked || matched[par.id] === true}
          onclick={() => selectDef(par)}
        >{par.definicion}</button>
      {/each}
    </div>
  </div>

  {#if done}
    <p class="match-done">¡Todas las coincidencias correctas! +{puntos} pts</p>
  {/if}

  <div class="ej-actions">
    <button class="btn" onclick={reset} disabled={locked}>↺ Reiniciar</button>
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-actions { margin-top: 1rem; }
  .match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .match-col  { display: flex; flex-direction: column; gap: 0.5rem; }
  .match-btn {
    padding: 0.6rem 0.8rem; border: 1px solid var(--border); border-radius: var(--radius-sm, 4px);
    background: var(--surface, #0d1117); color: var(--text-primary);
    font-family: var(--font-mono); font-size: 0.78rem; text-align: left;
    cursor: pointer; transition: border-color var(--transition), background var(--transition);
  }
  .match-btn:hover:not(:disabled)   { border-color: var(--accent); }
  .match-btn.selected                { border-color: var(--accent); background: var(--accent); color: #000; }
  .match-btn.correct                 { border-color: var(--color-correct); background: #00ff4122; color: var(--color-correct); cursor: default; }
  .match-btn.wrong                   { border-color: var(--color-error); background: #ff3a3a22; }
  .match-btn:disabled:not(.correct)  { opacity: 0.5; cursor: not-allowed; }
  .match-done { margin-top: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem; color: var(--color-correct); text-align: center; }
  @media (max-width: 640px) { .match-grid { grid-template-columns: 1fr; } }
</style>
