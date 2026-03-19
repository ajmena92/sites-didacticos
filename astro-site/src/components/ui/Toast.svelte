<script>
  import { onMount, onDestroy } from 'svelte';

  let {
    tipo = 'success',   // 'success' | 'error'
    titulo = '',
    mensaje = '',
    onReintentar = null,
    onClose = null,
  } = $props();

  let visible = $state(true);
  let timer = null;

  function handleClose() {
    visible = false;
    setTimeout(() => { onClose?.(); }, 160);
  }

  function handleReintentar() {
    handleClose();
    setTimeout(() => { onReintentar?.(); }, 160);
  }

  onMount(() => {
    if (tipo === 'success') {
      timer = setTimeout(() => handleClose(), 4000);
    }
  });

  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast toast-{tipo}" role="alert" aria-live="polite">
    <div class="toast-header">
      <span class="toast-icon">{tipo === 'success' ? '[+]' : '[!]'}</span>
      <span class="toast-titulo">{titulo}</span>
      <button class="toast-close" onclick={handleClose} aria-label="Cerrar">✕</button>
    </div>
    {#if mensaje}
      <p class="toast-msg">{mensaje}</p>
    {/if}
    {#if onReintentar && tipo === 'error'}
      <div class="toast-btns">
        <button class="btn toast-retry" onclick={handleReintentar}>↺ Reintentar</button>
        <button class="btn toast-dismiss" onclick={handleClose}>✕ Cerrar</button>
      </div>
    {/if}
    {#if tipo === 'success'}
      <div class="toast-bar">
        <div class="toast-bar-fill"></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    min-width: 280px;
    max-width: 360px;
    background: var(--surface-card, #161b22);
    border: 1px solid;
    border-radius: var(--radius, 8px);
    padding: 0.9rem 1rem;
    font-family: var(--font-mono);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    animation: toast-in 200ms ease forwards;
  }

  .toast-success {
    border-color: var(--color-correct, #00ff41);
    border-left: 3px solid var(--color-correct, #00ff41);
  }

  .toast-error {
    border-color: var(--color-error, #ff3a3a);
    border-left: 3px solid var(--color-error, #ff3a3a);
  }

  .toast-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .toast-icon {
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .toast-success .toast-icon { color: var(--color-correct, #00ff41); }
  .toast-error   .toast-icon { color: var(--color-error, #ff3a3a); }

  .toast-titulo {
    font-family: var(--font-display, var(--font-mono));
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    flex: 1;
    color: var(--text-primary);
  }

  .toast-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.8rem;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  .toast-close:hover { color: var(--text-primary); }

  .toast-msg {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 0 0 0.5rem 0;
    line-height: 1.5;
  }

  .toast-btns {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .toast-retry {
    font-size: 0.75rem;
    padding: 0.3rem 0.7rem;
    background: rgba(255, 58, 58, 0.12);
    border-color: var(--color-error, #ff3a3a);
    color: var(--color-error, #ff3a3a);
  }
  .toast-retry:hover { background: rgba(255, 58, 58, 0.22); }

  .toast-dismiss {
    font-size: 0.75rem;
    padding: 0.3rem 0.7rem;
  }

  /* Progress bar that drains over 4 s */
  .toast-bar {
    height: 3px;
    background: rgba(0, 255, 65, 0.2);
    border-radius: 100px;
    overflow: hidden;
    margin-top: 0.6rem;
  }
  .toast-bar-fill {
    height: 100%;
    background: var(--color-correct, #00ff41);
    border-radius: 100px;
    animation: drain 4s linear forwards;
  }

  @keyframes drain {
    from { width: 100%; }
    to   { width: 0%; }
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
