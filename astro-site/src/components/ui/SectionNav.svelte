<script>
  import { onMount, onDestroy } from 'svelte';
  import { sectionProgress } from '../../stores/score.js';

  let progress = $state(sectionProgress.get());
  const unsub = sectionProgress.subscribe(v => { progress = v; });
  onDestroy(unsub);

  const sections = [
    { id: 'sec-fill',   key: 'fillInBlank',    short: 'S1' },
    { id: 'sec-match',  key: 'matching',        short: 'S2' },
    { id: 'sec-order',  key: 'ordering',        short: 'S3' },
    { id: 'sec-choice', key: 'multipleChoice',  short: 'S4' },
  ];

  let active = $state('');
  let observers = [];

  onMount(() => {
    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) active = sec.id; },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  });

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<nav class="sec-nav">
  {#each sections as sec}
    <button
      class="sec-btn"
      class:active={active === sec.id}
      class:done={progress[sec.key]}
      onclick={() => scrollTo(sec.id)}
      title={sec.id}
    >
      {sec.short}{progress[sec.key] ? ' ✓' : ''}
    </button>
  {/each}
</nav>

<style>
  .sec-nav {
    position: sticky;
    top: 0;
    z-index: 9;
    display: flex;
    gap: 0.4rem;
    padding: 0.4rem 0;
    background: var(--bg, #0d1117);
    border-bottom: 1px solid var(--border);
    margin-bottom: 1rem;
  }
  .sec-btn {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
    background: var(--surface, #161b22);
    color: var(--text-muted);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .sec-btn:hover { border-color: var(--accent); color: var(--text-primary); }
  .sec-btn.active { border-color: var(--accent); color: var(--accent); }
  .sec-btn.done   { color: var(--color-correct, #00ff41); border-color: var(--color-correct, #00ff41); }
</style>
