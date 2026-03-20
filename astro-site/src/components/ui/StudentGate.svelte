<script>
  import { onMount, tick } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let { grupos = [], entregaId = '', scriptUrl = '' } = $props();

  const SK = `estudiante_v1_${entregaId}`;

  let nombre             = $state('');
  let cedula             = $state('');
  let grupo              = $state('');
  let fecha              = $state(new Date().toISOString().split('T')[0]);
  let nivel              = $state('');
  let visible            = $state(false);
  let bloqueado          = $state(false);
  let cedulaNoEncontrada = $state(false);
  let recuperando        = $state(false);

  let hayRoster = $derived(grupos.some(g => g.estudiantes?.length > 0));

  let canStart = $derived(
    hayRoster
      ? bloqueado
      : nombre.trim().length >= 3 && cedula.trim().length >= 5 && grupo !== ''
  );

  function showExercises() {
    const wrap = document.getElementById('exercises-wrap');
    if (wrap) wrap.style.display = 'block';
  }

  function buscarEnRoster(ced) {
    for (const g of grupos) {
      const e = g.estudiantes?.find(est => est.cedula.trim() === ced.trim());
      if (e) return { nombre: e.nombre, nivel: e.nivel ?? '', grupo: g.id, turno: g.turno ?? '' };
    }
    return null;
  }

  async function restoreFromSheet(ced) {
    if (localStorage.getItem(SK)) return;
    if (!scriptUrl) return;

    try {
      recuperando = true;
      const url = `${scriptUrl}?action=student&cedula=${encodeURIComponent(ced)}&tipo=${encodeURIComponent(entregaId)}`;
      const res  = await fetch(url);
      const json = await res.json();

      if (json.ok && json.row) {
        const row = json.row;
        const data = {
          nombre: row.nombre, cedula: row.cedula,
          grupo:  row.grupo,  fecha:  row.fecha ?? fecha,
          turno:  grupos.find(g => g.id === row.grupo)?.turno ?? '',
          nivel:  nivel,
        };
        localStorage.setItem(SK, JSON.stringify(data));

        let hayRespuestas = false;
        if (row.extras) {
          try {
            const extras = JSON.parse(row.extras);
            if (extras.answers) {
              ['fillInBlank', 'matching', 'ordering', 'multipleChoice'].forEach(sec => {
                if (extras.answers[sec]) {
                  localStorage.setItem(
                    `respuestas_v1_${entregaId}_${sec}`,
                    JSON.stringify(extras.answers[sec])
                  );
                  hayRespuestas = true;
                }
              });
            }
          } catch { /* extras no parseable, se ignora */ }
        }

        // Si se restauraron respuestas, recargar para que los componentes las lean
        if (hayRespuestas && typeof window !== 'undefined') {
          recuperando = false;
          window.location.reload();
          return;
        }
      }
    } catch { /* fallo de red, se ignora */ }
    finally { recuperando = false; }
  }

  async function onCedulaInput(e) {
    const val = e.target.value.trim();
    cedulaNoEncontrada = false;
    bloqueado = false;
    if (!hayRoster || val.length < 9) return;

    const found = buscarEnRoster(val);
    if (found) {
      nombre = found.nombre;
      grupo  = found.grupo;
      nivel  = found.nivel;
      bloqueado = true;
      await restoreFromSheet(val);
      await tick();
      iniciar();
    } else {
      cedulaNoEncontrada = true;
    }
  }

  function iniciar() {
    if (!canStart) return;
    const turno = grupos.find(g => g.id === grupo)?.turno ?? '';
    const data = { nombre: nombre.trim(), cedula: cedula.trim(), grupo, fecha, turno, nivel };
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
      cedula = data.cedula ?? '';
      grupo  = data.grupo  ?? '';
      fecha  = data.fecha  ?? fecha;
      nivel  = data.nivel  ?? '';
      const turno = grupos.find(g => g.id === grupo)?.turno ?? data.turno ?? '';
      studentStore.set({ nombre, cedula, grupo, fecha, turno, nivel });
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
      <p class="gate-sub">Complete sus datos antes de comenzar.</p>

      <div class="gate-form">
        <label class="field">
          <span class="field-label">Cédula / Documento de identidad *</span>
          <input type="text" bind:value={cedula} oninput={onCedulaInput}
                 placeholder="9 dígitos sin guiones — Ej: 207890123" required autocomplete="off" inputmode="numeric" />
          {#if cedula.trim().length > 0 && cedula.trim().length < 9}
            <span class="field-hint">Ingresa los 9 dígitos tal como aparece en la cédula (sin guiones).</span>
          {/if}
          {#if cedulaNoEncontrada}
            <span class="field-error">Cédula no registrada en esta tarea. Consulta al docente.</span>
          {/if}
          {#if recuperando}
            <span class="field-hint">⏳ Recuperando progreso previo…</span>
          {/if}
        </label>

        {#if hayRoster}
          <label class="field">
            <span class="field-label">Nombre completo</span>
            <input type="text" value={nombre} disabled class:field-filled={bloqueado} />
          </label>
          <label class="field">
            <span class="field-label">Grupo</span>
            <input type="text" value={grupos.find(g => g.id === grupo)?.nombre ?? ''} disabled class:field-filled={bloqueado} />
          </label>
        {:else}
          <label class="field">
            <span class="field-label">Nombre completo *</span>
            <input type="text" bind:value={nombre} placeholder="Apellido Apellido, Nombre" required autocomplete="name" />
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
        {/if}

        <label class="field">
          <span class="field-label">Fecha</span>
          <input type="date" bind:value={fecha} />
        </label>
      </div>

      {#if !hayRoster || bloqueado}
        <button class="btn btn-primary gate-btn" disabled={!canStart} onclick={iniciar}>
          ▶ Iniciar
        </button>
      {/if}

      {#if !canStart && !cedulaNoEncontrada && !recuperando}
        <p class="gate-hint">
          {hayRoster
            ? 'Ingresa tu cédula para identificarte automáticamente.'
            : 'Complete nombre (mín. 3 caracteres), cédula (mín. 5 dígitos) y grupo.'}
        </p>
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
  .field-error  { font-family: var(--font-mono); font-size: var(--text-xs, 0.7rem); color: var(--color-error, #ff3a3a); margin-top: 0.2rem; }
  .field-hint   { font-family: var(--font-mono); font-size: var(--text-xs, 0.7rem); color: var(--text-muted); margin-top: 0.2rem; }

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
  input:disabled { cursor: default; }
  .field-filled { border-color: var(--color-correct, #00ff41); background: rgba(0,255,65,0.04); color: var(--text-primary); opacity: 1; }

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
