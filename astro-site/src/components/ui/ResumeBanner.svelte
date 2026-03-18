<script>
  import { onMount } from 'svelte';

  let { entregaId = '' } = $props();

  let show = $state(false);
  let timer;

  onMount(() => {
    const hasData = ['fillInBlank', 'matching', 'ordering', 'multipleChoice'].some(
      sec => localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`) !== null
    );
    if (hasData) {
      show = true;
      timer = setTimeout(() => { show = false; }, 6000);
    }
    return () => clearTimeout(timer);
  });
</script>

{#if show}
  <div class="banner" role="status">
    <span class="banner-icon">↩</span>
    <span class="banner-text">Retomando tu trabajo anterior — tus respuestas han sido restauradas.</span>
    <button class="banner-close" onclick={() => { show = false; clearTimeout(timer); }} aria-label="Cerrar">✕</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    background: #00ff4115;
    border: 1px solid var(--color-correct, #00ff41);
    border-radius: var(--radius-sm, 4px);
    margin-bottom: 1rem;
    animation: slide-in 0.3s ease;
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .banner-icon { font-size: 1rem; }
  .banner-text {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-correct, #00ff41);
    flex: 1;
  }
  .banner-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0;
    line-height: 1;
  }
  .banner-close:hover { color: var(--text-primary); }
</style>
