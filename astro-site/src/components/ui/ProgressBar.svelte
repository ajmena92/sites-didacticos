<script>
  import { onDestroy } from 'svelte';
  import { sectionProgress } from '../../stores/score.js';

  let progress = $state(sectionProgress.get());
  const unsub = sectionProgress.subscribe(v => { progress = v; });
  onDestroy(unsub);

  const sections = [
    { key: 'fillInBlank',    label: 'Complete el Comando' },
    { key: 'matching',       label: 'Relacione Columnas' },
    { key: 'ordering',       label: 'Ordene la Secuencia' },
    { key: 'multipleChoice', label: 'Escenarios' },
  ];

  let doneCount = $derived(Object.values(progress).filter(Boolean).length);
  let total = $derived(sections.length);
  let pct   = $derived(Math.round((doneCount / total) * 100));
</script>

<div class="progress-wrap card">
  <div class="progress-header">
    <span class="progress-title">Progreso</span>
    <span class="progress-pct">{doneCount}/{total} secciones</span>
  </div>
  <div class="progress-bar-track">
    <div class="progress-bar-fill" style="width:{pct}%"></div>
  </div>
  <div class="progress-steps">
    {#each sections as sec}
      <div class="progress-step" class:done={progress[sec.key]}>
        <span class="step-icon">{progress[sec.key] ? '✓' : '○'}</span>
        <span class="step-label">{sec.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .progress-wrap {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .progress-title {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .progress-pct {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--accent);
  }

  .progress-bar-track {
    background: var(--border);
    border-radius: 100px;
    height: 4px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--color-correct, #00ff41);
    border-radius: 100px;
    transition: width 0.5s ease;
  }

  .progress-steps {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .progress-step {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
    transition: color 0.3s;
  }
  .progress-step.done { color: var(--color-correct, #00ff41); }
  .step-icon { font-size: 0.7rem; }
</style>
