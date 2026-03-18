<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  let { preguntas = [], puntos = 5, mostrarRespuestas = true } = $props();

  let selections = $state(Array(preguntas.length).fill(null));
  let results    = $state(null);
  let verified   = $state(false);
  let locked     = $state(false);

  onMount(() => {
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function check() {
    if (locked) return;
    results = preguntas.map((p, i) => selections[i] === p.correcta);
    const correct = results.filter(Boolean).length;
    updateSection('multipleChoice', Math.round((correct / preguntas.length) * puntos));
    verified = true;
  }

  function reset() {
    selections = Array(preguntas.length).fill(null);
    results    = null;
    verified   = false;
    updateSection('multipleChoice', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 04 — Preguntas de Escenario</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  {#each preguntas as pregunta, qi}
    <div class="question" class:correct={results?.[qi] === true} class:wrong={results?.[qi] === false}>
      <p class="q-text"><span class="q-num">{qi + 1}.</span> {pregunta.texto}</p>
      <div class="q-opts">
        {#each pregunta.opciones as opcion, oi}
          <label
            class="q-opt"
            class:selected={selections[qi] === oi}
            class:correct-opt={verified && mostrarRespuestas && oi === pregunta.correcta}
            class:wrong-opt={verified && selections[qi] === oi && oi !== pregunta.correcta}
          >
            <input
              type="radio"
              name={`q${qi}`}
              value={oi}
              bind:group={selections[qi]}
              disabled={verified || locked}
            />
            {opcion}
          </label>
        {/each}
      </div>
    </div>
  {/each}

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
  .ej-actions { margin-top: 1rem; }
  .question {
    padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm, 4px);
    margin-bottom: 0.75rem; transition: border-color var(--transition);
  }
  .question.correct { border-color: var(--color-correct); }
  .question.wrong   { border-color: var(--color-error); }
  .q-text { font-size: 0.88rem; margin-bottom: 0.75rem; }
  .q-num  { font-family: var(--font-mono); color: var(--accent); margin-right: 0.25rem; }
  .q-opts { display: flex; flex-direction: column; gap: 0.4rem; }
  .q-opt {
    display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.4rem 0.6rem;
    border: 1px solid var(--border); border-radius: var(--radius-sm, 4px);
    font-size: 0.82rem; cursor: pointer;
    transition: border-color var(--transition), background var(--transition);
  }
  .q-opt:hover:not(.correct-opt):not(.wrong-opt) { border-color: var(--accent); }
  .q-opt.selected    { border-color: var(--accent); background: var(--accent); color: #000; }
  .q-opt.correct-opt { border-color: var(--color-correct); background: #00ff4122; color: var(--color-correct); }
  .q-opt.wrong-opt   { border-color: var(--color-error); background: #ff3a3a22; }
  input[type="radio"] { margin-top: 0.15rem; accent-color: var(--accent); }
</style>
