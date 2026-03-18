<script>
  import { onMount, onDestroy } from 'svelte';

  let { fechaApertura, fechaCierre } = $props();

  let timeLeft = $state('');
  let progress = $state(0);
  let urgency = $state('normal');
  let statusLabel = $state('');
  let interval;

  function calcState() {
    const now = Date.now();
    const open = new Date(fechaApertura).getTime();
    const close = new Date(fechaCierre).getTime();

    if (now < open) {
      statusLabel = '⏳ PRÓXIMAMENTE';
      timeLeft = '';
      progress = 0;
      urgency = 'normal';
      return;
    }

    if (now > close) {
      statusLabel = '📁 TAREA CERRADA';
      timeLeft = '00d : 00h : 00m : 00s';
      progress = 100;
      urgency = 'danger';
      document.documentElement.setAttribute('data-clock', 'danger');
      window.dispatchEvent(new CustomEvent('deadline-reached'));
      clearInterval(interval);
      return;
    }

    const remaining = close - now;
    const total = close - open;
    progress = Math.round(((now - open) / total) * 100);

    const days  = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const mins  = Math.floor((remaining % 3600000) / 60000);
    const secs  = Math.floor((remaining % 60000) / 1000);

    timeLeft = `${String(days).padStart(2,'0')}d : ${String(hours).padStart(2,'0')}h : ${String(mins).padStart(2,'0')}m : ${String(secs).padStart(2,'0')}s`;

    if (remaining < 7200000)      urgency = 'danger';
    else if (remaining < 86400000) urgency = 'warning';
    else                           urgency = 'normal';

    statusLabel = '✅ ENTREGA ABIERTA';
    document.documentElement.setAttribute('data-clock', urgency);
  }

  onMount(() => {
    calcState();
    interval = setInterval(calcState, 1000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<div class="clock" data-urgency={urgency}>
  <div class="clock-label">⏰ {statusLabel}</div>
  {#if timeLeft}
    <div class="clock-time">{timeLeft}</div>
    <div class="clock-bar-wrap">
      <div class="clock-bar" style="width:{progress}%"></div>
    </div>
    <div class="clock-dates">
      Abierta: {new Date(fechaApertura).toLocaleDateString('es-CR', {day:'2-digit',month:'short'})} ·
      Cierra: {new Date(fechaCierre).toLocaleDateString('es-CR', {day:'2-digit',month:'short'})}
    </div>
  {/if}
</div>

<style>
  .clock {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--clock-color, var(--accent, #00b4d8));
    border-radius: var(--radius, 8px);
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .clock-label { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); }
  .clock-time  { font-family: var(--font-display); font-size: 1.5rem; color: var(--clock-color, var(--accent)); letter-spacing: 0.05em; }
  .clock-bar-wrap { background: var(--border); border-radius: 100px; height: 6px; overflow: hidden; }
  .clock-bar { height: 100%; background: var(--clock-color, var(--accent)); border-radius: 100px; transition: width 1s linear; }
  .clock-dates { font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); }
</style>
