<script>
  import { onDestroy } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let {
    casos = [],
    seccionesEstaticas = [],
    entregaId = '',
    scriptUrl = '',
    exportarPdf = false,
  } = $props();

  const STORAGE_KEY = `caso_diag_${entregaId}`;

  let assignedCases = $state([]);
  let respuestas    = $state({});
  let progress      = $state(0);
  let progressLabel = $state('0 / 0 campos completados');
  let submitStatus  = $state('');  // 'pending' | 'ok' | 'err'
  let submitMsg     = $state('');
  let warnMsg       = $state('');

  // ── Hash determinista ────────────────────────────────────────
  function nameHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  function seededShuffle(arr, seed) {
    let s = seed;
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── localStorage ─────────────────────────────────────────────
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  function saveState() {
    if (!assignedCases.length) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        casosAsignados: assignedCases.map(c => c.id),
        respuestas,
      }));
    } catch {}
  }

  // ── Campos y progreso ────────────────────────────────────────
  function getAllFieldKeys() {
    const keys = [];
    assignedCases.forEach(c => {
      const base = c.id.toLowerCase().replace('-', '');
      c.questions.forEach((_, i) => keys.push(`${base}-q${i + 1}`));
      keys.push(`${base}-dictamen`);
    });
    seccionesEstaticas.forEach(s => keys.push(s.id));
    return keys;
  }

  function updateProgress() {
    const allFields = getAllFieldKeys();
    const filled = allFields.filter(k => respuestas[k]?.trim()).length;
    const total  = allFields.length;
    progress      = total > 0 ? Math.round((filled / total) * 100) : 0;
    progressLabel = `${filled} / ${total} campos completados`;
  }

  function setResponse(key, value) {
    respuestas = { ...respuestas, [key]: value };
    updateProgress();
    saveState();
  }

  // ── Asignar casos al cambiar el estudiante ────────────────────
  function assignForStudent(nombre, grupo) {
    if (!nombre) return;
    const seed     = nameHash(nombre + grupo);
    const newCases = seededShuffle(casos, seed).slice(0, 2);
    const newIds   = newCases.map(c => c.id);
    const curIds   = assignedCases.map(c => c.id);
    if (JSON.stringify(newIds) === JSON.stringify(curIds)) return;

    assignedCases = newCases;
    const saved = loadState();
    if (saved && JSON.stringify(saved.casosAsignados) === JSON.stringify(newIds)) {
      respuestas = saved.respuestas || {};
    } else {
      respuestas = {};
    }
    updateProgress();
  }

  let student = $state(studentStore.get());
  const unsubStudent = studentStore.subscribe(v => {
    student = v;
    if (v?.nombre) assignForStudent(v.nombre, v.grupo);
  });
  onDestroy(unsubStudent);

  // ── Envío ────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!student?.nombre) { warnMsg = 'Completa tu identificación antes de enviar.'; return; }
    warnMsg = '';

    const empty = getAllFieldKeys().filter(k => !respuestas[k]?.trim()).length;
    if (empty > 0) warnMsg = `Advertencia: ${empty} campo(s) vacío(s). Puedes enviar de todas formas.`;

    submitStatus = 'pending';
    submitMsg    = '⏳ Registrando…';

    const payload = {
      nombre:       student.nombre,
      cedula:       student.cedula,
      grupo:        student.grupo,
      fecha:        student.fecha || new Date().toLocaleDateString('es-CR'),
      tipo:         entregaId,
      calificacion: 0,
      errores:      0,
      extras:       JSON.stringify({
        casosAsignados: assignedCases.map(c => c.id),
        respuestas,
      }),
    };

    try {
      const res  = await fetch(scriptUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ ok: res.ok }));
      if (res.ok && json.ok !== false) {
        submitStatus = 'ok';
        submitMsg    = '✓ Registrado correctamente';
      } else {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      submitStatus = 'err';
      submitMsg    = `⚠ No se pudo registrar (${err.message})`;
    }
  }

  function handlePrint() {
    if (!student?.nombre) { warnMsg = 'Completa tu identificación antes de imprimir.'; return; }
    window.print();
  }
</script>

<!-- ── Barra de progreso ─────────────────────────────────────── -->
{#if assignedCases.length > 0}
  <div class="prog-wrap no-print">
    <div class="prog-track">
      <div class="prog-fill" style="width:{progress}%"></div>
    </div>
    <span class="prog-label">{progressLabel}</span>
  </div>
{:else}
  <div class="waiting-msg">
    <span class="wait-icon">⌛</span>
    Completa tu identificación para recibir los casos asignados.
  </div>
{/if}

<!-- ── Casos asignados ─────────────────────────────────────────  -->
{#each assignedCases as caso, idx}
  {@const base = caso.id.toLowerCase().replace('-', '')}
  {@const dictKey = `${base}-dictamen`}
  <div class="case-card">
    <div class="case-header">
      <span class="case-badge">{caso.id}</span>
      <div>
        <div class="case-title">{caso.title}</div>
        <span class="diff-badge">{caso.difficulty}</span>
      </div>
    </div>

    <div class="case-model">
      Modelo de investigación: <strong>{caso.model}</strong>
    </div>

    <div class="case-scenario">"{caso.scenario}"</div>

    {#each caso.questions as q, qi}
      {@const fieldKey = `${base}-q${qi + 1}`}
      <div class="q-block">
        <label class="q-label" for="{fieldKey}">
          <span class="q-num">{idx + 1}.{qi + 1}</span> {q}
        </label>
        <textarea
          id="{fieldKey}"
          class="resp-area"
          class:filled={respuestas[fieldKey]?.trim().length > 0}
          rows="4"
          placeholder="Ingresa los datos técnicos encontrados e indica tu fuente (URL o manual)…"
          value={respuestas[fieldKey] ?? ''}
          oninput={e => setResponse(fieldKey, e.currentTarget.value)}
        ></textarea>
      </div>
    {/each}

    <div class="dictamen-block">
      <div class="dictamen-label">💡 Dictamen técnico final del analista</div>
      <textarea
        id="{dictKey}"
        class="resp-area dictamen-area"
        class:filled={respuestas[dictKey]?.trim().length > 0}
        rows="5"
        placeholder="Redacta tu recomendación profesional. ¿Es viable la intervención? Justifica con base en arquitectura física, costos y rendimiento esperado…"
        value={respuestas[dictKey] ?? ''}
        oninput={e => setResponse(dictKey, e.currentTarget.value)}
      ></textarea>
    </div>
  </div>
{/each}

<!-- ── Secciones estáticas ─────────────────────────────────────  -->
{#if assignedCases.length > 0 && seccionesEstaticas.length > 0}
  <div class="section-estatica">
    <h2 class="sec-title">⚖️ Criterio Técnico y Ética Profesional</h2>

    {#each seccionesEstaticas as sec}
      <div class="q-block">
        <label class="q-label" for="{sec.id}">
          <span class="q-num accent">{sec.titulo}</span>
        </label>
        <p class="sec-desc">{sec.descripcion}</p>
        <textarea
          id="{sec.id}"
          class="resp-area"
          class:filled={respuestas[sec.id]?.trim().length > 0}
          rows="4"
          placeholder="Desarrolla tu respuesta aquí…"
          value={respuestas[sec.id] ?? ''}
          oninput={e => setResponse(sec.id, e.currentTarget.value)}
        ></textarea>
      </div>
    {/each}
  </div>
{/if}

<!-- ── Barra de acciones ───────────────────────────────────────  -->
{#if assignedCases.length > 0}
  {#if warnMsg}
    <div class="warn-banner">{warnMsg}</div>
  {/if}

  <div class="action-bar no-print">
    <button class="btn btn-submit" onclick={handleSubmit} disabled={submitStatus === 'pending'}>
      📤 Enviar al profesor
    </button>

    {#if exportarPdf}
      <button class="btn btn-print" onclick={handlePrint}>
        🖨️ Imprimir / PDF
      </button>
    {/if}

    {#if submitMsg}
      <span class="submit-ind" class:ok={submitStatus === 'ok'} class:err={submitStatus === 'err'}>
        {submitMsg}
      </span>
    {/if}
  </div>
{/if}

<style>
  /* ── Progreso ─────────────────────────────────────────────── */
  .prog-wrap {
    display: flex; align-items: center; gap: 1rem;
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border); border-radius: var(--radius, 8px);
    padding: 0.75rem 1rem; margin-bottom: 0.5rem;
  }
  .prog-track {
    flex: 1; height: 5px; background: var(--surface, #0d1117);
    border-radius: 3px; overflow: hidden;
  }
  .prog-fill {
    height: 100%; background: #3fb950; border-radius: 3px;
    transition: width 0.3s ease;
  }
  .prog-label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }

  .waiting-msg {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1.5rem; border: 1px solid var(--border);
    border-radius: var(--radius, 8px); color: var(--text-muted);
    font-family: var(--font-mono); font-size: 0.85rem;
  }
  .wait-icon { font-size: 1.4rem; }

  /* ── Tarjeta de caso ──────────────────────────────────────── */
  .case-card {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius, 8px);
    padding: 1.5rem;
  }
  .case-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  .case-badge {
    background: var(--accent); color: #fff; font-weight: 800;
    font-family: var(--font-mono); font-size: 0.85rem;
    padding: 0.25rem 0.7rem; border-radius: 6px; white-space: nowrap; flex-shrink: 0;
  }
  .case-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
  .diff-badge {
    display: inline-block; margin-top: 0.2rem;
    font-family: var(--font-mono); font-size: 0.68rem;
    padding: 0.12rem 0.5rem; border-radius: 20px;
    border: 1px solid var(--border); color: var(--text-muted);
  }
  .case-model {
    font-family: var(--font-mono); font-size: 0.72rem;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-muted); margin-bottom: 0.5rem;
  }
  .case-model strong { color: var(--accent); font-size: 0.88rem; }
  .case-scenario {
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    border-radius: 6px; padding: 0.75rem 1rem;
    font-size: 0.85rem; color: var(--text-muted); font-style: italic;
    margin-bottom: 1.25rem;
  }

  /* ── Preguntas ────────────────────────────────────────────── */
  .q-block { margin-bottom: 1.1rem; }
  .q-label { display: block; font-size: 0.87rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-primary); }
  .q-num { color: var(--accent); margin-right: 0.35rem; }
  .q-num.accent { display: block; font-size: 0.82rem; font-weight: 700; color: var(--accent); margin-bottom: 0.2rem; }
  .sec-desc { font-size: 0.82rem; color: var(--text-muted); margin: 0 0 0.5rem; }

  .resp-area {
    width: 100%; box-sizing: border-box;
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    color: var(--text-primary); padding: 0.6rem 0.85rem;
    border-radius: 6px; font-family: var(--font-body); font-size: 0.87rem;
    outline: none; resize: vertical;
    transition: border-color 0.2s;
  }
  .resp-area:focus { border-color: var(--accent); }
  .resp-area.filled { border-color: rgba(63, 185, 80, 0.5); }

  /* ── Dictamen ─────────────────────────────────────────────── */
  .dictamen-block {
    margin-top: 1.1rem; padding-top: 1.1rem;
    border-top: 1px solid var(--border);
  }
  .dictamen-label {
    font-family: var(--font-mono); font-size: 0.75rem;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--accent); margin-bottom: 0.5rem;
  }
  .dictamen-area { min-height: 100px; }

  /* ── Secciones estáticas ──────────────────────────────────── */
  .section-estatica {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border);
    border-radius: var(--radius, 8px);
    padding: 1.5rem;
  }
  .sec-title {
    font-size: 0.95rem; font-weight: 700;
    color: var(--text-primary); margin-bottom: 1.25rem;
    display: flex; align-items: center; gap: 0.5rem;
  }

  /* ── Acciones ─────────────────────────────────────────────── */
  .warn-banner {
    background: rgba(248,81,73,.1); border: 1px solid rgba(248,81,73,.3);
    border-radius: 6px; padding: 0.6rem 1rem;
    font-family: var(--font-mono); font-size: 0.8rem; color: #ff6b6b;
  }
  .action-bar {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    padding-top: 0.5rem;
  }
  .btn-submit { background: #3fb950; color: #fff; }
  .btn-print  { background: none; border: 1px solid var(--border); color: var(--text-primary); }
  .btn-print:hover { border-color: var(--text-muted); }

  .submit-ind {
    font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted);
  }
  .submit-ind.ok  { color: #3fb950; }
  .submit-ind.err { color: #ff6b6b; }

  /* ── Print ────────────────────────────────────────────────── */
  @media print {
    .no-print { display: none !important; }
    .case-card, .section-estatica {
      border: 1px solid #ccc !important; background: #fff !important; break-inside: avoid;
    }
    .resp-area { border: 1px solid #888 !important; background: #fff !important; color: #000 !important; }
  }
</style>
