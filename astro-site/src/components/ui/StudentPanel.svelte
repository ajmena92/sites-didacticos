<script>
  import { onMount } from 'svelte';

  let { grupos = [], entregaId = '' } = $props();

  const SK = `estudiante_v1_${entregaId}`;

  let nombre = $state('');
  let grupo  = $state('');
  let fecha  = $state(new Date().toISOString().split('T')[0]);
  let saved  = $state(false);
  let saveTimer;

  function save() {
    localStorage.setItem(SK, JSON.stringify({ nombre, grupo, fecha }));
    saved = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saved = false; }, 2000);
  }

  onMount(() => {
    const stored = localStorage.getItem(SK);
    if (stored) {
      const data = JSON.parse(stored);
      nombre = data.nombre ?? '';
      grupo  = data.grupo  ?? '';
      fecha  = data.fecha  ?? fecha;
    }
  });
</script>

<div class="panel card">
  <div class="panel-grid">
    <label class="field">
      <span class="field-label">Nombre completo *</span>
      <input type="text" bind:value={nombre} oninput={save} placeholder="Apellido Apellido, Nombre" required />
    </label>
    <label class="field">
      <span class="field-label">Grupo</span>
      <select bind:value={grupo} onchange={save}>
        <option value="">— Seleccione —</option>
        {#each grupos as g}
          <option value={g.id}>{g.nombre}</option>
        {/each}
      </select>
    </label>
    <label class="field">
      <span class="field-label">Fecha</span>
      <input type="date" bind:value={fecha} onchange={save} />
    </label>
  </div>
  <div class="save-ind" class:show={saved}>● GUARDADO</div>
</div>

<style>
  .panel { margin-bottom: 1.5rem; }
  .panel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-label { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  input, select {
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
    transition: border-color var(--transition);
  }
  input:focus, select:focus { outline: none; border-color: var(--accent); }
  .save-ind { margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-correct); opacity: 0; transition: opacity 0.3s; }
  .save-ind.show { opacity: 1; }
</style>
