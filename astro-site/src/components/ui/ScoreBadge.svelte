<script>
  import { onDestroy } from 'svelte';
  import { totalScore } from '../../stores/score.js';

  let { totalPuntos = 0 } = $props();

  let score = $state(totalScore.get());
  const unsub = totalScore.subscribe(v => { score = v; });
  onDestroy(unsub);
</script>

<div class="badge-score">
  <span class="score-val">{score}</span>
  <span class="score-sep">/</span>
  <span class="score-total">{totalPuntos}</span>
  <span class="score-label">pts</span>
</div>

<style>
  .badge-score {
    display: inline-flex; align-items: baseline; gap: 0.15rem;
    font-family: var(--font-display);
    background: var(--surface-card, #161b22);
    border: 1px solid var(--accent); border-radius: 100px;
    padding: 0.2rem 0.8rem;
  }
  .score-val   { font-size: 1.1rem; color: var(--accent); font-weight: 700; }
  .score-sep   { font-size: 0.85rem; color: var(--text-muted); }
  .score-total { font-size: 0.85rem; color: var(--text-muted); }
  .score-label { font-size: 0.65rem; color: var(--text-muted); margin-left: 0.1rem; }
</style>
