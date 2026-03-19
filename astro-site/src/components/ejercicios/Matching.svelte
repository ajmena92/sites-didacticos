<script>
  import { onMount, onDestroy } from 'svelte';
  import { updateSection, isLocked, markVerified } from '../../stores/score.js';

  let { pares = [], puntos = 10, entregaId = '' } = $props();

  const SK = `respuestas_v1_${entregaId}_matching`;

  let shuffledCmds = $state([]);
  let shuffledDefs = $state([]);
  let selCmd  = $state(null);
  let selDef  = $state(null);
  let matched = $state({});
  let done    = $state(false);
  let locked  = $state(isLocked.get());

  const unsubLock = isLocked.subscribe(v => { locked = v; });
  onDestroy(unsubLock);

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function calcPartialScore() {
    const correct = Object.values(matched).filter(Boolean).length;
    return Math.round((correct / pares.length) * puntos);
  }

  $effect(() => {
    if (typeof localStorage !== 'undefined' && entregaId && shuffledCmds.length > 0) {
      localStorage.setItem(SK, JSON.stringify({
        matched, done,
        shuffledCmds: shuffledCmds.map(p => p.id),
        shuffledDefs: shuffledDefs.map(p => p.id),
      }));
    }
  });

  onMount(() => {
    if (entregaId) {
      const raw = localStorage.getItem(SK);
      if (raw) {
        const d = JSON.parse(raw);
        matched = d.matched ?? {};
        done    = d.done    ?? false;
        // Restore shuffled order
        const cmdIds = d.shuffledCmds ?? [];
        const defIds = d.shuffledDefs ?? [];
        shuffledCmds = cmdIds.length ? cmdIds.map(id => pares.find(p => p.id === id)).filter(Boolean) : shuffle(pares);
        shuffledDefs = defIds.length ? defIds.map(id => pares.find(p => p.id === id)).filter(Boolean) : shuffle(pares);
        if (Object.keys(matched).length > 0) {
          updateSection('matching', calcPartialScore());
          if (done) markVerified('matching');
        }
        return;
      }
    }
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
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

    // Update partial score immediately
    updateSection('matching', calcPartialScore());

    if (!correct) {
      setTimeout(() => {
        const { [wrongCmdId]: _, ...rest } = matched;
        matched = rest;
        updateSection('matching', calcPartialScore());
      }, 800);
    }

    if (Object.values(matched).filter(Boolean).length === pares.length) {
      done = true;
      updateSection('matching', puntos);
      markVerified('matching');
    }
  }

  function reset() {
    if (typeof localStorage !== 'undefined' && entregaId) localStorage.removeItem(SK);
    markVerified('matching', false);
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
    matched = {};
    selCmd  = null;
    selDef  = null;
    done    = false;
    updateSection('matching', 0);
  }
</script>

<section class="ejercicio card" id="sec-match">
  <header class="ej-header">
    <h2 class="ej-title">Sección 02 — Relacione Columnas</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  <!-- Desktop: two-column grid -->
  <div class="match-grid desktop-only">
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

  <!-- Mobile: select per definition -->
  <div class="match-mobile mobile-only">
    {#each shuffledDefs as defPar}
      {@const matchedId = Object.keys(matched).find(id => matched[id] === true && id === defPar.id)}
      <div class="mobile-row" class:correct={matched[defPar.id] === true}>
        <p class="mobile-def">{defPar.definicion}</p>
        <select
          disabled={done || locked || matched[defPar.id] === true}
          onchange={(e) => {
            const cmdId = e.target.value;
            if (!cmdId) return;
            const cmdPar = pares.find(p => p.id === cmdId);
            if (!cmdPar) return;
            selCmd = cmdPar;
            selDef = defPar;
            tryMatch();
            e.target.value = '';
          }}
        >
          <option value="">— Seleccione comando —</option>
          {#each shuffledCmds as cmdPar}
            {#if matched[cmdPar.id] !== true}
              <option value={cmdPar.id}>{cmdPar.comando}</option>
            {/if}
          {/each}
        </select>
      </div>
    {/each}
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

  /* Desktop layout */
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

  /* Mobile layout */
  .match-mobile { display: flex; flex-direction: column; gap: 0.75rem; }
  .mobile-row {
    display: flex; flex-direction: column; gap: 0.4rem;
    padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--radius-sm, 4px);
    transition: border-color var(--transition);
  }
  .mobile-row.correct { border-color: var(--color-correct); background: #00ff4110; }
  .mobile-def { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-primary); margin: 0; }
  .match-mobile select {
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); color: var(--text-primary);
    font-family: var(--font-mono); font-size: 0.78rem; padding: 0.35rem 0.5rem;
    width: 100%; box-sizing: border-box;
  }
  .match-mobile select:disabled { opacity: 0.5; }

  /* Responsive visibility */
  .desktop-only { display: grid; }
  .mobile-only  { display: none; }

  @media (max-width: 600px) {
    .desktop-only { display: none; }
    .mobile-only  { display: flex; }
  }
</style>
