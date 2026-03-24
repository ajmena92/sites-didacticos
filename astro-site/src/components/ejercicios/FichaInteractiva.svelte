<script>
  import { onDestroy, onMount } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let {
    etapas            = [],
    evaluacion        = {},
    matrices_contexto = {},
    entregaId         = '',
    scriptUrl         = '',
    exportarPdf       = false,
    tituloTarea       = '',
    cursoNombre       = '',
    docenteNombre     = '',
  } = $props();

  const STORAGE_KEY = `ficha_${entregaId}`;

  // ── State ─────────────────────────────────────────────────────
  let pasosCompletados = $state({});   // { p1: true, p2: true, ... }
  let respuestasSelect = $state({});   // { p1: 'c', opC: 'c', ... }
  let respuestasMatrix = $state({});   // { opA: [[48,127],...], ... }
  let quizRespuestas   = $state({});   // { q1: 'correct', ... }
  let errores          = $state(0);
  let completada       = $state(false);
  let submitStatus     = $state('');   // '' | 'pending' | 'ok' | 'err'
  let calificacion     = $state('');
  let hintVisible      = $state({});   // { p1: true, ... }
  let quizIncorrectas  = $state([]);   // IDs of questions wrong on last attempt
  let student          = $state({ nombre: '', cedula: '', grupo: '', fecha: '' });

  const unsub = studentStore.subscribe(v => { student = v; });
  onDestroy(unsub);

  // ── Derived ───────────────────────────────────────────────────
  let totalPasos = $derived(etapas.reduce((n, e) => n + e.pasos.length, 0));
  let pasosOk    = $derived(Object.values(pasosCompletados).filter(Boolean).length);
  let progreso   = $derived(totalPasos > 0 ? Math.round(pasosOk / totalPasos * 100) : 0);

  let quizDesbloqueado = $derived(
    etapas.every(e => e.pasos.every(p => pasosCompletados[p.id]))
  );

  function etapaDesbloqueada(idx) {
    if (idx === 0) return true;
    return etapas[idx - 1].pasos.every(p => pasosCompletados[p.id]);
  }

  function pasoDesbloqueado(etapaIdx, pasoIdx) {
    if (!etapaDesbloqueada(etapaIdx)) return false;
    if (pasoIdx === 0) return true;
    const prevPaso = etapas[etapaIdx].pasos[pasoIdx - 1];
    return !!pasosCompletados[prevPaso.id];
  }

  // ── localStorage ─────────────────────────────────────────────
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pasosCompletados,
        respuestasSelect,
        respuestasMatrix,
        quizRespuestas,
        errores,
        completada,
        calificacion,
      }));
    } catch {}
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  // ── Select verification ───────────────────────────────────────
  function checkSelect(pasoId, correcto) {
    const val = respuestasSelect[pasoId];
    if (!val) return;
    if (val === correcto) {
      pasosCompletados = { ...pasosCompletados, [pasoId]: true };
      saveState();
    } else {
      errores++;
      hintVisible = { ...hintVisible, [pasoId]: true };
      saveState();
    }
  }

  // ── Matrix verification ───────────────────────────────────────
  function checkMatrix(pasoId, solucion) {
    const vals = respuestasMatrix[pasoId] ?? [];
    let ok = true;
    for (let i = 0; i < solucion.length; i++) {
      for (let j = 0; j < solucion[i].length; j++) {
        const cell = vals[i]?.[j] ?? '';
        if (cell === '' || parseInt(cell) !== solucion[i][j]) ok = false;
      }
    }
    if (ok) {
      pasosCompletados = { ...pasosCompletados, [pasoId]: true };
      saveState();
    } else {
      errores++;
      hintVisible = { ...hintVisible, [pasoId]: true };
      saveState();
    }
  }

  function setMatrixVal(pasoId, nRows, nCols, i, j, val) {
    const current = respuestasMatrix[pasoId]
      ?? Array.from({ length: nRows }, () => Array(nCols).fill(''));
    const next = current.map(r => [...r]);
    next[i][j] = val;
    respuestasMatrix = { ...respuestasMatrix, [pasoId]: next };
  }

  // ── Final evaluation ──────────────────────────────────────────
  function evalQuiz() {
    const preguntas = evaluacion.preguntas ?? [];
    const sinResponder = preguntas.filter(q => !quizRespuestas[q.id]);
    if (sinResponder.length) return;

    const incorrectas = preguntas.filter(q => quizRespuestas[q.id] !== q.correcto);
    if (incorrectas.length) {
      errores += incorrectas.length;
      quizIncorrectas = incorrectas.map(q => q.id);
      saveState();
      return;
    }

    quizIncorrectas = [];
    const nivel = calcNivel(errores);
    calificacion = nivel;
    completada   = true;
    saveState();
    autoSubmit();
  }

  function calcNivel(err) {
    const umbrales = evaluacion.calificacion?.umbrales ?? [];
    for (const u of umbrales) {
      if (err <= u.max_errores) return u.nivel;
    }
    return 'Inicial';
  }

  // ── Submit to Apps Script ─────────────────────────────────────
  async function autoSubmit() {
    if (!scriptUrl) return;
    submitStatus = 'pending';

    const fichaState = {
      pasosCompletados, respuestasSelect, respuestasMatrix, quizRespuestas, errores,
    };

    const payload = {
      nombre:       student.nombre,
      cedula:       student.cedula,
      grupo:        student.grupo,
      fecha:        student.fecha,
      tipo:         entregaId,
      calificacion: calificacion,
      errores:      errores,
      extras:       JSON.stringify({ fichaState }),
    };

    try {
      const res  = await fetch(scriptUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ ok: res.ok }));
      submitStatus = (res.ok && json.ok !== false) ? 'ok' : 'err';
    } catch {
      submitStatus = 'err';
    }
  }

  // ── onMount: restore state ────────────────────────────────────
  onMount(() => {
    const stored = loadState();
    if (stored) {
      pasosCompletados = stored.pasosCompletados ?? {};
      respuestasSelect = stored.respuestasSelect ?? {};
      respuestasMatrix = stored.respuestasMatrix ?? {};
      quizRespuestas   = stored.quizRespuestas   ?? {};
      errores          = stored.errores          ?? 0;
      completada       = stored.completada       ?? false;
      calificacion     = stored.calificacion     ?? '';
    }
  });
</script>

<!-- Progress bar -->
<div class="ficha-progress">
  <div class="fp-label">
    <span>Progreso etapas</span>
    <span class="fp-pct">{progreso} %</span>
  </div>
  <div class="fp-bar"><div class="fp-fill" style="width:{progreso}%"></div></div>
</div>

<!-- Stages -->
{#each etapas as etapa, ei}
  {@const desbloqueada = etapaDesbloqueada(ei)}
  <div class="ficha-card" class:locked={!desbloqueada}>

    {#if !desbloqueada}
      <div class="lock-overlay">
        <span class="lock-ico">🔐</span>
        <span class="lock-txt">Completá la etapa anterior para continuar</span>
      </div>
    {/if}

    <div class="card-header">
      <div class="card-icon ci-{etapa.tag_color ?? 'blue'}">{etapa.icono ?? '📋'}</div>
      <div>
        <div class="card-title">{etapa.titulo}</div>
        {#if etapa.subtitulo}<div class="card-sub">{etapa.subtitulo}</div>{/if}
      </div>
      {#if etapa.tag}
        <span class="card-tag tag-{etapa.tag_color ?? 'blue'}">{etapa.tag}</span>
      {/if}
    </div>

    <div class="card-body">

      {#if etapa.contexto}
        <div class="ctx-box">
          <span class="ctx-ico">📡</span>
          <p>{etapa.contexto}</p>
        </div>
      {/if}

      {#if etapa.mostrar_matrices}
        {#if etapa.intro}
          <p class="intro-text">{etapa.intro}</p>
        {/if}
        <div class="matrices-row">
          {#each Object.entries(matrices_contexto) as [key, mat]}
            <div class="mat-wrap">
              <div class="mat-label mat-{mat.color}">{mat.label}</div>
              <table class="mat-tbl">
                <thead>
                  <tr class="hdr">
                    <td></td>
                    {#each mat.cols as col}<td>{col}</td>{/each}
                  </tr>
                </thead>
                <tbody>
                  {#each mat.data as row, ri}
                    <tr class="rh">
                      <td>{mat.rows[ri]}</td>
                      {#each row as cell}<td>{cell}</td>{/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/each}
        </div>
      {/if}

      <div class="step-list">
        {#each etapa.pasos as paso, pi}
          {@const unlocked = pasoDesbloqueado(ei, pi)}
          {@const done = !!pasosCompletados[paso.id]}
          <div class="step-item" class:step-done={done} class:step-locked={!unlocked}>

            <div class="step-num" class:num-done={done}>{done ? '✓' : paso.num}</div>

            <div class="step-content">
              <div class="step-title">{paso.titulo}</div>
              <p class="step-desc">{paso.descripcion}</p>

              {#if paso.tipo === 'select'}
                <div class="ctrl-row">
                  <select
                    class="ans-sel"
                    class:sel-ok={done}
                    class:sel-bad={hintVisible[paso.id] && !done}
                    disabled={done || !unlocked}
                    bind:value={respuestasSelect[paso.id]}
                  >
                    <option value="">{paso.placeholder ?? 'Seleccioná...'}</option>
                    {#each paso.opciones ?? [] as opt}
                      <option value={opt.valor}>{opt.texto}</option>
                    {/each}
                  </select>
                  {#if !done && unlocked}
                    <button class="btn-check" onclick={() => checkSelect(paso.id, paso.correcto)}>
                      Verificar
                    </button>
                  {/if}
                  <span class="res-ico">{done ? '✅' : (hintVisible[paso.id] ? '❌' : '')}</span>
                </div>

              {:else if paso.tipo === 'matrix-input'}
                {@const nRows = paso.rows?.length ?? 0}
                {@const nCols = paso.cols?.length ?? 0}
                <div class="matrix-input-wrap">
                  <div class="col-hdrs">
                    <div class="spacer"></div>
                    {#each paso.cols ?? [] as col}
                      <span class="col-hdr">{col}</span>
                    {/each}
                  </div>
                  {#each paso.rows ?? [] as rowLabel, ri}
                    <div class="mat-row">
                      <span class="row-lbl">{rowLabel}</span>
                      {#each paso.cols ?? [] as _, ci}
                        {@const val = respuestasMatrix[paso.id]?.[ri]?.[ci] ?? ''}
                        {@const sol = paso.solucion?.[ri]?.[ci]}
                        <input
                          type="number"
                          class="mat-inp"
                          class:inp-ok={done}
                          class:inp-bad={hintVisible[paso.id] && !done && val !== '' && parseInt(String(val)) !== sol}
                          disabled={done || !unlocked}
                          placeholder={paso.placeholders?.[ri]?.[ci] ?? ''}
                          value={val}
                          oninput={(e) => setMatrixVal(paso.id, nRows, nCols, ri, ci, e.target.value)}
                        />
                      {/each}
                    </div>
                  {/each}
                </div>
                {#if !done && unlocked}
                  <div class="ctrl-row" style="margin-top:.6rem">
                    <button class="btn-check" onclick={() => checkMatrix(paso.id, paso.solucion)}>
                      Verificar
                    </button>
                    <span class="res-ico">{hintVisible[paso.id] ? '❌' : ''}</span>
                  </div>
                {:else if done}
                  <span class="res-ico" style="display:block;margin-top:.4rem">✅</span>
                {/if}
              {/if}

              {#if hintVisible[paso.id] && paso.hint}
                <div class="hint-box">{paso.hint}</div>
              {/if}

            </div>
          </div>
        {/each}
      </div>

    </div>
  </div>
{/each}

<!-- Final evaluation -->
<div class="ficha-card" class:locked={!quizDesbloqueado}>
  {#if !quizDesbloqueado}
    <div class="lock-overlay">
      <span class="lock-ico">🔐</span>
      <span class="lock-txt">Completá las dos etapas para desbloquear la evaluación</span>
    </div>
  {/if}

  <div class="card-header">
    <div class="card-icon ci-amber">🧠</div>
    <div>
      <div class="card-title">{evaluacion.titulo ?? 'Evaluación'}</div>
      {#if evaluacion.subtitulo}<div class="card-sub">{evaluacion.subtitulo}</div>{/if}
    </div>
    <span class="card-tag tag-amber">Evaluación</span>
  </div>

  <div class="card-body">
    {#each evaluacion.preguntas ?? [] as preg, qi}
      <div class="quiz-q">
        <p class="q-txt">{qi + 1}. {preg.texto}</p>
        {#if quizIncorrectas.includes(preg.id)}
          <p class="q-wrong-hint">❌ Respuesta incorrecta — revisá y volvé a enviar.</p>
        {/if}
        {#each preg.opciones as opt}
          <label
            class="q-opt"
            class:q-sel={quizRespuestas[preg.id] === opt.valor}
            class:q-wrong={quizIncorrectas.includes(preg.id) && quizRespuestas[preg.id] === opt.valor}
            class:q-opt-disabled={completada}
          >
            <input
              type="radio"
              name={preg.id}
              value={opt.valor}
              disabled={completada}
              checked={quizRespuestas[preg.id] === opt.valor}
              onchange={() => { quizRespuestas = { ...quizRespuestas, [preg.id]: opt.valor }; }}
            />
            <span>{opt.texto}</span>
          </label>
        {/each}
      </div>
    {/each}

    {#if !completada}
      {@const todasRespondidas = (evaluacion.preguntas ?? []).every(q => quizRespuestas[q.id])}
      <button
        class="btn-eval"
        disabled={!todasRespondidas || !quizDesbloqueado}
        onclick={evalQuiz}
      >
        Enviar evaluación →
      </button>
    {/if}
  </div>
</div>

<!-- Report -->
{#if completada}
  <div class="report-card">
    <div class="rep-emoji">🎓</div>
    <div class="rep-title">¡Práctica completada!</div>
    <div class="rep-sub">{tituloTarea} · {cursoNombre}</div>

    <div class="rep-stats">
      <div class="rep-stat">
        <div class="rs-lbl">Pasos OK</div>
        <div class="rs-val" style="color:var(--color-correct)">{pasosOk + (evaluacion.preguntas?.length ?? 0)}</div>
      </div>
      <div class="rep-stat">
        <div class="rs-lbl">Errores</div>
        <div class="rs-val" style="color:var(--color-error)">{errores}</div>
      </div>
      <div class="rep-stat">
        <div class="rs-lbl">Nivel</div>
        <div class="rs-val nivel-{calificacion.toLowerCase()}">{calificacion}</div>
      </div>
    </div>

    <div class="rep-name">{student.nombre} · {student.grupo} · {student.fecha}</div>
    {#if docenteNombre}<div class="rep-docente">Docente: {docenteNombre}</div>{/if}

    {#if submitStatus === 'pending'}
      <p class="submit-ind pending">⏳ Registrando…</p>
    {:else if submitStatus === 'ok'}
      <p class="submit-ind ok">✓ Registrado automáticamente</p>
    {:else if submitStatus === 'err'}
      <p class="submit-ind err">⚠ No se pudo registrar automáticamente</p>
      <button class="btn-resend" onclick={autoSubmit}>🔁 Reintentar envío</button>
    {/if}

    {#if exportarPdf}
      <button class="btn-pdf" onclick={() => window.print()}>🖨️ Exportar PDF</button>
    {/if}
  </div>
{/if}

<style>
  .ficha-card {
    position: relative;
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 1.2rem;
  }
  .ficha-card.locked { pointer-events: none; }

  .lock-overlay {
    position: absolute; inset: 0; z-index: 10;
    background: rgba(10,11,18,.82);
    backdrop-filter: blur(7px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: .4rem; border-radius: 14px;
  }
  .lock-ico { font-size: 2rem; }
  .lock-txt { font-size: .82rem; color: var(--text-muted); font-weight: 600; }

  .card-header {
    padding: 1rem 1.3rem;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: .8rem;
  }
  .card-icon {
    width: 38px; height: 38px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; flex-shrink: 0;
  }
  .ci-blue   { background: rgba(79,142,247,.14); }
  .ci-purple { background: rgba(124,58,237,.14); }
  .ci-amber  { background: rgba(245,158,11,.14); }
  .card-title { font-size: .97rem; font-weight: 700; }
  .card-sub   { font-size: .72rem; color: var(--text-muted); margin-top: .1rem; }
  .card-tag {
    margin-left: auto; font-size: .67rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em;
    padding: .18rem .55rem; border-radius: 4px; white-space: nowrap;
  }
  .tag-blue   { background: rgba(79,142,247,.15);  color: #93c5fd; }
  .tag-purple { background: rgba(167,139,250,.15); color: #c4b5fd; }
  .tag-amber  { background: rgba(245,158,11,.15);  color: #fcd34d; }
  .card-body { padding: 1.3rem; }

  .ficha-progress {
    margin-bottom: 1.2rem;
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: 10px; padding: .7rem 1rem;
  }
  .fp-label { display: flex; justify-content: space-between; font-size: .75rem; color: var(--text-muted); margin-bottom: .4rem; }
  .fp-pct   { color: var(--accent); font-weight: 700; }
  .fp-bar   { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .fp-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), #22c55e); border-radius: 3px; transition: width .5s ease; }

  .ctx-box {
    display: flex; gap: .8rem; align-items: flex-start;
    background: rgba(79,142,247,.07); border: 1px solid rgba(79,142,247,.22);
    border-radius: 10px; padding: 1rem 1.1rem; margin-bottom: 1.2rem;
  }
  .ctx-ico { font-size: 1.5rem; flex-shrink: 0; }
  .ctx-box p { font-size: .85rem; line-height: 1.7; color: var(--text-muted); }
  .intro-text { font-size: .84rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem; }

  .matrices-row { display: flex; flex-wrap: wrap; gap: 1.2rem; margin-bottom: 1.4rem; }
  .mat-wrap { background: var(--surface2, #161b22); border: 1px solid var(--border); border-radius: 9px; padding: .9rem 1.1rem; }
  .mat-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; margin-bottom: .4rem; }
  .mat-accent { color: var(--accent); }
  .mat-purple { color: #c4b5fd; }
  .mat-tbl { border-collapse: separate; border-spacing: 3px; font-family: var(--font-mono); font-size: .82rem; }
  .mat-tbl .hdr td { background: rgba(79,142,247,.15); color: var(--accent); font-size: .7rem; padding: .25rem .6rem; border-radius: 4px; text-align: center; }
  .mat-tbl .rh td  { background: var(--surface, #0d1117); padding: .32rem .6rem; border-radius: 4px; text-align: center; min-width: 36px; }
  .mat-tbl .rh td:first-child { background: rgba(124,58,237,.18); color: #c4b5fd; font-weight: 700; }

  .step-list { display: flex; flex-direction: column; gap: 1.3rem; border-left: 2px solid var(--border); padding-left: 1.4rem; margin-left: .3rem; }
  .step-item { position: relative; }
  .step-item.step-locked { opacity: .45; pointer-events: none; }
  .step-num {
    position: absolute; left: -2.1rem; top: .05rem;
    width: 25px; height: 25px; border-radius: 50%;
    background: #7c3aed; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: .72rem; font-weight: 700;
  }
  .num-done { background: #22c55e !important; }
  .step-title { font-size: .95rem; font-weight: 700; margin-bottom: .35rem; }
  .step-desc  { font-size: .84rem; color: var(--text-muted); line-height: 1.65; margin-bottom: .65rem; }
  .step-content { width: 100%; }

  .ctrl-row { display: flex; align-items: center; flex-wrap: wrap; gap: .6rem; }
  .ans-sel {
    background: var(--surface2, #161b22); border: 2px solid var(--border);
    border-radius: 7px; padding: .48rem 1.8rem .48rem .7rem;
    color: var(--text-primary); font-size: .83rem;
    appearance: none; cursor: pointer; transition: border-color .2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237c8ca8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right .5rem center; background-size: .88em;
    max-width: 380px; width: 100%;
  }
  .ans-sel:focus { outline: none; border-color: var(--accent); }
  .sel-ok  { border-color: #22c55e !important; background-color: rgba(34,197,94,.07); }
  .sel-bad { border-color: var(--color-error, #ef4444) !important; }
  .btn-check {
    background: var(--surface2, #161b22); border: 1px solid var(--border);
    color: var(--accent); padding: .48rem 1rem;
    border-radius: 7px; font-size: .82rem; font-weight: 700;
    cursor: pointer; transition: background .15s;
  }
  .btn-check:hover { background: rgba(79,142,247,.12); }
  .res-ico { font-size: 1.05rem; }

  .matrix-input-wrap { display: inline-block; }
  .col-hdrs { display: flex; gap: 5px; margin-bottom: 4px; }
  .spacer   { width: 36px; }
  .col-hdr  { width: 62px; text-align: center; font-size: .68rem; color: var(--accent); font-weight: 700; font-family: var(--font-mono); }
  .mat-row  { display: flex; gap: 5px; margin-bottom: 4px; align-items: center; }
  .row-lbl  { width: 36px; font-size: .68rem; color: #c4b5fd; font-weight: 700; font-family: var(--font-mono); }
  .mat-inp  {
    width: 62px; height: 40px; text-align: center;
    background: var(--surface2, #161b22); border: 2px solid var(--border);
    border-radius: 6px; color: var(--text-primary);
    font-family: var(--font-mono); font-size: .88rem; font-weight: 600;
    transition: border-color .2s;
  }
  .mat-inp:focus { outline: none; border-color: var(--accent); }
  .inp-ok  { border-color: #22c55e !important; background: rgba(34,197,94,.09); }
  .inp-bad { border-color: var(--color-error, #ef4444) !important; background: rgba(239,68,68,.09); }

  .hint-box {
    background: rgba(124,58,237,.1); border: 1px solid rgba(124,58,237,.28);
    border-radius: 7px; padding: .6rem .85rem;
    font-size: .79rem; color: #c4b5fd; line-height: 1.6; margin-top: .5rem;
  }

  .quiz-q { background: var(--surface2, #161b22); border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: .9rem; }
  .q-txt  { font-size: .88rem; font-weight: 600; line-height: 1.55; margin-bottom: .8rem; }
  .q-wrong-hint { font-size: .78rem; color: var(--color-error, #ef4444); margin-bottom: .4rem; font-family: var(--font-mono); }
  .q-opt {
    display: flex; align-items: flex-start; gap: .65rem;
    padding: .6rem .85rem; border-radius: 7px; border: 1px solid var(--border);
    margin-bottom: .4rem; cursor: pointer; transition: all .15s; font-size: .84rem; line-height: 1.5;
  }
  .q-opt:hover:not(.q-opt-disabled) { border-color: var(--accent); background: rgba(79,142,247,.06); }
  .q-sel   { border-color: var(--accent) !important; background: rgba(79,142,247,.1) !important; }
  .q-wrong { border-color: var(--color-error, #ef4444) !important; background: rgba(239,68,68,.09) !important; }
  .q-opt-disabled { cursor: default; }
  .q-opt input[type="radio"] { accent-color: var(--accent); flex-shrink: 0; margin-top: .15rem; }
  .btn-eval {
    width: 100%; background: linear-gradient(135deg, #f59e0b, #f97316);
    color: #fff; border: none; border-radius: 9px; padding: .82rem;
    font-size: .95rem; font-weight: 700; cursor: pointer;
    margin-top: .7rem; transition: opacity .15s;
  }
  .btn-eval:disabled { opacity: .45; cursor: not-allowed; }
  .btn-eval:not(:disabled):hover { opacity: .9; }

  .report-card {
    background: linear-gradient(135deg, #0f172a, #1e1b4b);
    border: 1px solid #3730a3; border-radius: 14px;
    padding: 2rem 1.5rem; text-align: center; margin-top: 1.2rem;
  }
  .rep-emoji { font-size: 2.6rem; margin-bottom: .4rem; }
  .rep-title { font-size: 1.6rem; font-weight: 800; margin-bottom: .25rem; }
  .rep-sub   { color: var(--text-muted); font-size: .82rem; margin-bottom: 1.6rem; }
  .rep-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: .8rem; max-width: 400px; margin: 0 auto 1.4rem; }
  .rep-stat { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 10px; padding: .85rem; }
  .rs-lbl { font-size: .67rem; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); }
  .rs-val { font-size: 1.7rem; font-weight: 800; font-family: var(--font-mono); margin-top: .2rem; }
  .nivel-avanzado   { color: #22c55e; }
  .nivel-intermedio { color: #f59e0b; }
  .nivel-inicial    { color: #ef4444; }
  .rep-name    { font-size: .76rem; color: #a5b4fc; margin-bottom: .3rem; }
  .rep-docente { font-size: .72rem; color: var(--text-muted); margin-bottom: 1.1rem; }
  .submit-ind { font-size: .82rem; margin-bottom: .6rem; }
  .submit-ind.pending { color: var(--text-muted); }
  .submit-ind.ok      { color: #22c55e; }
  .submit-ind.err     { color: #ef4444; }
  .btn-pdf, .btn-resend {
    background: #fff; color: #1e1b4b;
    border: none; border-radius: 30px; padding: .7rem 2rem;
    font-size: .88rem; font-weight: 700; cursor: pointer; margin: .3rem .3rem 0;
    transition: transform .15s;
  }
  .btn-pdf:hover, .btn-resend:hover { transform: scale(1.03); }
  .btn-resend { background: #ef4444; color: #fff; }

  @media print {
    .lock-overlay, .btn-check, .btn-eval, .btn-pdf, .btn-resend,
    .ficha-progress, .submit-ind { display: none !important; }
    .step-item.step-locked { opacity: 1; }
    .ficha-card { border: 1px solid #cbd5e1; background: #fff; }
    .card-header { background: #f8fafc; }
    .mat-tbl td, .quiz-q { background: #f8fafc; }
  }
</style>
