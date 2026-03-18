<script>
  import { onMount } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let { grupos = [], entregaId = '' } = $props();

  const SK = `estudiante_v1_${entregaId}`;

  let nombre  = $state('');
  let grupo   = $state('');
  let fecha   = $state(new Date().toISOString().split('T')[0]);
  let visible = $state(false); // whether to show the modal

  let canStart = $derived(nombre.trim().length >= 3 && grupo !== '');

  function showExercises() {
    const wrap = document.getElementById('exercises-wrap');
    if (wrap) wrap.style.display = 'block';
  }

  function iniciar() {
    if (!canStart) return;
    const data = { nombre: nombre.trim(), grupo, fecha };
    localStorage.setItem(SK, JSON.stringify(data));
    studentStore.set(data);
    visible = false;
    showExercises();
  }

  onMount(() => {
    const stored = localStorage.getItem(SK);
    if (stored) {
      const data = JSON.parse(stored);
      nombre = data.nombre ?? '';
      grupo  = data.grupo  ?? '';
      fecha  = data.fecha  ?? fecha;
      studentStore.set({ nombre, grupo, fecha });
      showExercises();
    } else {
      visible = true;
    }
  });
</script>

{#if visible}
  <div class="gate-overlay">
    <div class="gate-modal card">
      <div class="gate-icon">🖥️</div>
      <h2 class="gate-title">Identificación del Estudiante</h2>
      <p class="gate-sub">Antes de comenzar, complete sus datos. Esta información se guarda localmente.</p>

      <div class="gate-form">
        <label class="field">
          <span class="field-label">Nombre completo *</span>
          <input
            type="text"
            bind:value={nombre}
            placeholder="Apellido Apellido, Nombre"
            required
            autocomplete="name"
          />
        </label>

        <label class="field">
          <span class="field-label">Grupo *</span>
          <select bind:value={grupo}>
            <option value="">— Seleccione su grupo —</option>
            {#each grupos as g}
              <option value={g.id}>{g.nombre}</option>
            {/each}
          </select>
        </label>

        <label class="field">
          <span class="field-label">Fecha</span>
          <input type="date" bind:value={fecha} />
        </label>
      </div>

      <button
        class="btn btn-primary gate-btn"
        disabled={!canStart}
        onclick={iniciar}
      >
        ▶ Iniciar Tarea
      </button>

      {#if !canStart}
        <p class="gate-hint">Ingrese su nombre (mínimo 3 caracteres) y seleccione su grupo.</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .gate-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .gate-modal {
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    animation: gate-in 0.25s ease;
  }

  @keyframes gate-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .gate-icon  { font-size: 2.5rem; }
  .gate-title { font-size: 1.1rem; color: var(--accent); text-align: center; margin: 0; }
  .gate-sub   { font-size: 0.78rem; color: var(--text-muted); text-align: center; font-family: var(--font-mono); margin: 0; }

  .gate-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field { display: flex; flex-direction: column; gap: 0.3rem; width: 100%; }
  .field-label {
    font-family: var(--font-mono); font-size: 0.7rem;
    color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
  }

  input, select {
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.45rem 0.65rem;
    transition: border-color var(--transition);
    width: 100%;
    box-sizing: border-box;
  }
  input:focus, select:focus { outline: none; border-color: var(--accent); }

  .gate-btn {
    width: 100%;
    padding: 0.65rem;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
  }
  .gate-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .gate-hint {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    text-align: center;
    margin: 0;
  }
</style>
