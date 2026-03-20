<script>
  import { onMount, onDestroy } from 'svelte';
  import { updateSection, isLocked, markVerified } from '../../stores/score.js';

  let { items = [], puntos = 20, mostrarRespuestas = true, entregaId = '' } = $props();

  const SK = `respuestas_v1_${entregaId}_fillInBlank`;

  let answers  = $state(Array(items.length).fill(''));
  let results  = $state(Array(items.length).fill(null));
  let verified = $state(false);
  let locked   = $state(isLocked.get());

  const unsubLock = isLocked.subscribe(v => { locked = v; });
  onDestroy(unsubLock);

  function calcScore() {
    const correct = results.filter(Boolean).length;
    return Math.round((correct / items.length) * puntos);
  }

  $effect(() => {
    if (typeof localStorage !== 'undefined' && entregaId) {
      localStorage.setItem(SK, JSON.stringify({ answers, verified, results }));
    }
  });

  onMount(() => {
    if (!entregaId) return;
    const raw = localStorage.getItem(SK);
    if (!raw) return;
    const d = JSON.parse(raw);
    answers  = d.answers  ?? answers;
    verified = d.verified ?? false;
    results  = d.results  ?? Array(items.length).fill(null);
    if (verified) {
      updateSection('fillInBlank', calcScore());
      markVerified('fillInBlank');
    }
  });

  function check() {
    if (locked) return;
    let correct = 0;
    results = items.map((item, i) => {
      const val = answers[i].trim().toLowerCase();
      const ok  = item.respuestas_validas.map(r => r.toLowerCase()).includes(val);
      if (ok) correct++;
      return ok;
    });
    updateSection('fillInBlank', Math.round((correct / items.length) * puntos));
    markVerified('fillInBlank');
    verified = true;
  }

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
</script>

<section class="ejercicio card" id="sec-fill">
  <header class="ej-header">
    <h2 class="ej-title">Sección 01 — Complete el Comando</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  <div class="terminal">
    <div class="term-bar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="term-title">Cisco IOS — Switch</span>
    </div>
    <div class="term-body">
      {#each items as item, i}
        <div class="term-line" class:correct={results[i] === true} class:wrong={results[i] === false}>
          <span class="term-prompt">{item.prompt}</span>
          <input
            class="term-input"
            type="text"
            bind:value={answers[i]}
            disabled={verified || locked}
            placeholder="___"
            onkeydown={e => handleKeydown(e, i)}
          />
          {#if item.post}<span class="term-post">{item.post}</span>{/if}
          {#if !verified && !locked}
            <span class="term-hint-key">Ctrl+Shift+Enter</span>
          {/if}
          <div class="term-desc">{item.desc}</div>
          {#if verified && results[i] === false && mostrarRespuestas}
            <div class="term-hint">✓ {item.respuestas_validas[0]}</div>
          {/if}
        </div>
      {/each}
    </div>
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
  .ej-actions { margin-top: 1rem; display: flex; gap: 0.5rem; }

  .terminal { background: #0a0e0a; border: 1px solid var(--border); border-radius: var(--radius, 8px); overflow: hidden; }
  .term-bar {
    background: #1a1e1a; padding: 0.4rem 0.75rem;
    display: flex; align-items: center; gap: 0.35rem;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .red    { background: #ff5f57; }
  .yellow { background: #febc2e; }
  .green  { background: #28c840; }
  .term-title { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); margin-left: auto; }
  .term-body  { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

  .term-line {
    display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem;
    padding: 0.4rem 0.5rem; border-radius: var(--radius-sm, 4px);
    border: 1px solid transparent; transition: border-color var(--transition, 150ms);
  }
  .term-line.correct { border-color: var(--color-correct); }
  .term-line.wrong   { border-color: var(--color-error); }

  .term-prompt { font-family: var(--font-mono); font-size: 0.82rem; color: #00ff41; white-space: nowrap; }
  .term-post   { font-family: var(--font-mono); font-size: 0.82rem; color: #00ff41; }
  .term-input {
    font-family: var(--font-mono); font-size: 0.82rem;
    background: transparent; border: none; border-bottom: 1px solid var(--text-muted);
    color: #00e5ff; padding: 0 0.2rem; min-width: 80px; flex: 1;
  }
  .term-input:focus { outline: none; border-bottom-color: var(--accent); }
  .term-input:disabled { color: var(--text-muted); cursor: not-allowed; }
  .term-desc { width: 100%; font-size: 0.75rem; color: var(--text-muted); }
  .term-hint { width: 100%; font-size: 0.72rem; color: var(--color-correct); font-family: var(--font-mono); }
  .term-hint-key {
    font-family: var(--font-mono); font-size: 0.6rem;
    color: rgba(139,92,246,0.45); margin-left: auto;
    white-space: nowrap;
  }
</style>
