<script>
  import { onDestroy } from 'svelte';
  import { studentStore } from '../../stores/score.js';
  import Toast from '../ui/Toast.svelte';

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
  let submitStatus  = $state('');   // '' | 'pending' | 'ok' | 'err'
  let submitMsg     = $state('');
  let warnMsg       = $state('');
  let pdfRequired   = $state(false);
  let toast         = $state(null);

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

  // ── Ctrl+Shift+Enter → rellena respuesta de referencia ───────
  function handleKeydown(e, key, answer) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && answer) {
      e.preventDefault();
      setResponse(key, answer);
    }
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
    if (submitStatus === 'ok' || submitStatus === 'pending') return;
    if (!student?.nombre) { warnMsg = 'Completa tu identificación antes de enviar.'; return; }
    warnMsg = '';
    pdfRequired = false;

    const empty = getAllFieldKeys().filter(k => !respuestas[k]?.trim()).length;
    if (empty > 0) {
      const ok = window.confirm(
        `⚠ Hay ${empty} campo(s) sin completar.\n\n¿Confirmas que deseas entregar la tarea en este estado?\n\nSe registrará con los campos que llenaste hasta ahora.`
      );
      if (!ok) return;
      warnMsg = `Entregada con ${empty} campo(s) vacío(s).`;
    }

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
      const res = await fetch(scriptUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
      });

      // Leer respuesta como texto primero para poder diagnosticar
      const rawText = await res.text().catch(() => '');
      let json = null;
      try { json = JSON.parse(rawText); } catch { /* no es JSON */ }

      // Solo éxito si el script devolvió JSON con ok:true explícito
      if (json && json.ok === true) {
        submitStatus = 'ok';
        submitMsg    = '✓ Tarea entregada al docente correctamente';
        pdfRequired  = false;
        toast = {
          tipo:    'success',
          titulo:  'TAREA ENTREGADA AL DOCENTE',
          mensaje: `Registrada el ${student.fecha || new Date().toLocaleDateString('es-CR')}`,
        };
      } else {
        // Construir mensaje de error útil
        const detalle = json?.error
          ?? (rawText.length < 200 ? rawText : `HTTP ${res.status} — respuesta no reconocida`)
          ?? `HTTP ${res.status}`;
        throw new Error(detalle);
      }
    } catch (err) {
      submitStatus = 'err';
      submitMsg    = `Error: ${err.message}`;
      pdfRequired  = true;
      toast = {
        tipo:    'error',
        titulo:  'ERROR DE ENVÍO',
        mensaje: 'Entrega el PDF físicamente al docente.',
      };
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

<!-- ── Casos asignados ──────────────────────────────────────────  -->
{#each assignedCases as caso, idx}
  {@const base = caso.id.toLowerCase().replace('-', '')}
  {@const dictKey = `${base}-dictamen`}

  <div class="case-card">

    <!-- Cabecera del caso -->
    <div class="case-header">
      <div class="case-header-top">
        <span class="case-badge">{caso.id}</span>
        <div class="case-title-block">
          <div class="case-title">{caso.title}</div>
          <span class="diff-badge">{caso.difficulty}</span>
        </div>
        <span class="case-num-badge">Caso {idx + 1} de 2</span>
      </div>
      <div class="case-model-line">
        <span class="model-label">Modelo de investigación:</span>
        <strong class="model-name">{caso.model}</strong>
      </div>
    </div>

    <!-- Specs del hardware -->
    {#if caso.specs && Object.keys(caso.specs).length > 0}
      <div class="specs-grid">
        {#each Object.entries(caso.specs) as [k, v]}
          <div class="spec-item">
            <span class="spec-key">{k}</span>
            <span class="spec-val">{v}</span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Situación -->
    <div class="scenario-block">
      <div class="scenario-label">📋 SITUACIÓN DEL CLIENTE</div>
      <div class="scenario-text">{caso.scenario}</div>
    </div>

    <!-- Fuentes de investigación -->
    {#if caso.fuentes && caso.fuentes.length > 0}
      <div class="fuentes-panel no-print">
        <div class="fuentes-title">🔍 Dónde investigar</div>
        <div class="fuentes-list">
          {#each caso.fuentes as f}
            <div class="fuente-item">
              <span class="fuente-sitio">{f.sitio}</span>
              <span class="fuente-seccion">{f.seccion}</span>
              <span class="fuente-pista">→ {f.pista}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Preguntas -->
    <div class="questions-block">
      {#each caso.questions as q, qi}
        {@const fieldKey = `${base}-q${qi + 1}`}
        {@const hasAnswer = (caso.answers?.[qi] ?? '').length > 0}
        <div class="q-block">
          <label class="q-label" for="{fieldKey}">
            <span class="q-num">{idx + 1}.{qi + 1}</span> {q}
          </label>
          <textarea
            id="{fieldKey}"
            class="resp-area"
            class:filled={respuestas[fieldKey]?.trim().length > 0}
            rows="4"
            placeholder="Indica los datos técnicos encontrados y la fuente consultada (sitio web o manual)…"
            value={respuestas[fieldKey] ?? ''}
            oninput={e => setResponse(fieldKey, e.currentTarget.value)}
            onkeydown={e => handleKeydown(e, fieldKey, caso.answers?.[qi] ?? '')}
          ></textarea>
          {#if hasAnswer}
            <div class="key-hint no-print">Ctrl+Shift+Enter → referencia docente</div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Dictamen técnico final -->
    <div class="dictamen-block">
      <div class="dictamen-label">💡 Dictamen técnico final del analista</div>
      <div class="dictamen-desc">Redacta tu recomendación profesional. ¿Es viable la intervención? Justifica con base en arquitectura, costos y rendimiento esperado.</div>
      <textarea
        id="{dictKey}"
        class="resp-area dictamen-area"
        class:filled={respuestas[dictKey]?.trim().length > 0}
        rows="5"
        placeholder="Redacta tu recomendación técnica y económica…"
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
          <span class="q-num-static">{sec.titulo}</span>
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

  <!-- Banner de error con PDF obligatorio -->
  {#if pdfRequired}
    <div class="pdf-required-banner no-print">
      <div class="pdf-req-icon">⚠️</div>
      <div class="pdf-req-content">
        <strong>No se pudo entregar en línea.</strong>
        <span>Debes imprimir el PDF y entregarlo físicamente al docente. El registro en línea falló.</span>
      </div>
      <button class="btn btn-pdf-urgent" onclick={handlePrint}>
        🖨️ Imprimir PDF ahora
      </button>
    </div>
  {/if}

  <div class="action-bar no-print">
    {#if submitStatus === ''}
      <button class="btn btn-submit" onclick={handleSubmit}>📤 Enviar al docente</button>
    {:else if submitStatus === 'pending'}
      <button class="btn btn-submit" disabled>⏳ Enviando…</button>
    {:else if submitStatus === 'ok'}
      <span class="submit-ok">✓ Tarea entregada</span>
    {:else if submitStatus === 'err'}
      <button class="btn btn-retry" onclick={handleSubmit}>↺ Reintentar envío</button>
    {/if}

    {#if exportarPdf}
      <button class="btn btn-print" onclick={handlePrint}>
        🖨️ Imprimir / PDF
      </button>
    {/if}
  </div>
{/if}

{#if toast}
  <Toast
    tipo={toast.tipo}
    titulo={toast.titulo}
    mensaje={toast.mensaje}
    onReintentar={toast.tipo === 'error' ? handleSubmit : null}
    onClose={() => { toast = null; }}
  />
{/if}

<style>
  /* ── Progreso ─────────────────────────────────────────────── */
  .prog-wrap {
    display: flex; align-items: center; gap: 1rem;
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border); border-radius: var(--radius, 8px);
    padding: 0.75rem 1rem; margin-bottom: 1.5rem;
  }
  .prog-track {
    flex: 1; height: 6px; background: var(--surface, #0d1117);
    border-radius: 3px; overflow: hidden;
  }
  .prog-fill {
    height: 100%; background: #3fb950; border-radius: 3px;
    transition: width 0.3s ease;
  }
  .prog-label {
    font-family: var(--font-mono); font-size: 0.75rem;
    color: var(--text-muted); white-space: nowrap;
  }

  .waiting-msg {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 2rem; border: 1px dashed var(--border);
    border-radius: var(--radius, 8px); color: var(--text-muted);
    font-family: var(--font-mono); font-size: 0.85rem;
    text-align: center; justify-content: center;
  }
  .wait-icon { font-size: 1.6rem; }

  /* ── Tarjeta de caso ──────────────────────────────────────── */
  .case-card {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border);
    border-radius: var(--radius, 8px);
    overflow: hidden;
    margin-bottom: 2rem;
  }

  /* Cabecera con fondo resaltado */
  .case-header {
    background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%);
    border-bottom: 1px solid rgba(139,92,246,0.3);
    padding: 1.25rem 1.5rem 1rem;
  }
  .case-header-top {
    display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }
  .case-badge {
    background: var(--accent); color: #fff; font-weight: 800;
    font-family: var(--font-mono); font-size: 0.9rem;
    padding: 0.3rem 0.8rem; border-radius: 6px;
    white-space: nowrap; flex-shrink: 0; letter-spacing: 0.03em;
  }
  .case-title-block { flex: 1; min-width: 0; }
  .case-title {
    font-size: 1.1rem; font-weight: 700; color: var(--text-primary);
    line-height: 1.3; margin-bottom: 0.25rem;
  }
  .diff-badge {
    display: inline-block;
    font-family: var(--font-mono); font-size: 0.68rem;
    padding: 0.15rem 0.6rem; border-radius: 20px;
    border: 1px solid rgba(139,92,246,0.4);
    color: rgba(139,92,246,0.9);
    background: rgba(139,92,246,0.08);
  }
  .case-num-badge {
    font-family: var(--font-mono); font-size: 0.72rem;
    color: var(--text-muted); white-space: nowrap;
    border: 1px solid var(--border); padding: 0.2rem 0.6rem;
    border-radius: 20px; align-self: flex-start; margin-top: 0.1rem;
  }

  .case-model-line {
    display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;
  }
  .model-label {
    font-family: var(--font-mono); font-size: 0.7rem;
    text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted);
  }
  .model-name {
    font-size: 0.95rem; font-weight: 700; color: var(--accent);
    font-family: var(--font-mono);
  }

  /* Specs del hardware */
  .specs-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.5rem; padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface, #0d1117);
  }
  .spec-item {
    display: flex; flex-direction: column; gap: 0.2rem;
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 0.5rem 0.75rem;
  }
  .spec-key {
    font-family: var(--font-mono); font-size: 0.65rem;
    text-transform: uppercase; letter-spacing: 0.07em; color: var(--accent);
    font-weight: 700;
  }
  .spec-val {
    font-size: 0.8rem; color: var(--text-primary); line-height: 1.35;
  }

  /* Situación */
  .scenario-block {
    padding: 1rem 1.5rem;
    background: rgba(88,166,255,0.04);
    border-bottom: 1px solid var(--border);
  }
  .scenario-label {
    font-family: var(--font-mono); font-size: 0.65rem;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: rgba(88,166,255,0.7); font-weight: 700; margin-bottom: 0.5rem;
  }
  .scenario-text {
    font-size: 0.9rem; color: var(--text-primary);
    line-height: 1.6; font-style: italic;
    border-left: 3px solid rgba(88,166,255,0.3);
    padding-left: 0.85rem;
  }

  /* Fuentes de investigación */
  .fuentes-panel {
    padding: 1rem 1.5rem;
    background: rgba(63,185,80,0.04);
    border-bottom: 1px solid var(--border);
  }
  .fuentes-title {
    font-family: var(--font-mono); font-size: 0.68rem;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: #3fb950; font-weight: 700; margin-bottom: 0.65rem;
  }
  .fuentes-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .fuente-item {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem 0.6rem;
    padding: 0.55rem 0.75rem;
    background: var(--surface-card, #161b22);
    border: 1px solid rgba(63,185,80,0.2);
    border-left: 3px solid rgba(63,185,80,0.5);
    border-radius: 6px;
  }
  .fuente-sitio {
    font-family: var(--font-mono); font-size: 0.75rem;
    font-weight: 700; color: #3fb950; white-space: nowrap;
  }
  .fuente-seccion {
    font-family: var(--font-mono); font-size: 0.72rem;
    color: var(--text-primary); flex: 1;
  }
  .fuente-pista {
    font-size: 0.75rem; color: var(--text-muted);
    font-style: italic; width: 100%; padding-left: 0.2rem;
  }

  /* Preguntas */
  .questions-block { padding: 1.25rem 1.5rem 0; }
  .q-block { margin-bottom: 1.25rem; }
  .q-label {
    display: block; font-size: 0.87rem; font-weight: 600;
    margin-bottom: 0.4rem; color: var(--text-primary); line-height: 1.4;
  }
  .q-num {
    color: var(--accent); font-family: var(--font-mono);
    font-weight: 800; margin-right: 0.35rem;
  }

  .key-hint {
    margin-top: 0.25rem;
    font-family: var(--font-mono); font-size: 0.62rem;
    color: rgba(139,92,246,0.5); text-align: right;
    letter-spacing: 0.03em;
  }

  .resp-area {
    width: 100%; box-sizing: border-box;
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    color: var(--text-primary); padding: 0.65rem 0.9rem;
    border-radius: 6px; font-family: var(--font-body); font-size: 0.87rem;
    outline: none; resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .resp-area:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(139,92,246,0.15);
  }
  .resp-area.filled { border-color: rgba(63, 185, 80, 0.5); }

  /* Dictamen */
  .dictamen-block {
    margin: 0 1.5rem 1.5rem;
    padding-top: 1.1rem;
    border-top: 1px solid var(--border);
  }
  .dictamen-label {
    font-family: var(--font-mono); font-size: 0.72rem;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--accent); margin-bottom: 0.3rem;
  }
  .dictamen-desc {
    font-size: 0.78rem; color: var(--text-muted);
    margin-bottom: 0.5rem; font-style: italic;
  }
  .dictamen-area { min-height: 110px; }

  /* Secciones estáticas */
  .section-estatica {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--border);
    border-radius: var(--radius, 8px);
    padding: 1.5rem; margin-bottom: 2rem;
  }
  .sec-title {
    font-size: 0.95rem; font-weight: 700;
    color: var(--text-primary); margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 0.5rem;
    padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);
  }
  .q-num-static {
    display: block; font-size: 0.8rem; font-weight: 700;
    color: var(--accent); margin-bottom: 0.2rem;
    font-family: var(--font-mono);
  }
  .sec-desc {
    font-size: 0.83rem; color: var(--text-muted);
    margin: 0 0 0.6rem; line-height: 1.55;
  }

  /* Advertencias */
  .warn-banner {
    background: rgba(248,81,73,.08); border: 1px solid rgba(248,81,73,.25);
    border-radius: 6px; padding: 0.65rem 1rem;
    font-family: var(--font-mono); font-size: 0.8rem; color: #ff6b6b;
    margin-bottom: 1rem;
  }

  /* Banner de PDF obligatorio */
  .pdf-required-banner {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    background: rgba(248,81,73,.12);
    border: 1px solid rgba(248,81,73,.4);
    border-left: 4px solid #f85149;
    border-radius: 8px; padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }
  .pdf-req-icon { font-size: 1.75rem; flex-shrink: 0; }
  .pdf-req-content {
    flex: 1; display: flex; flex-direction: column; gap: 0.2rem;
  }
  .pdf-req-content strong {
    font-size: 0.9rem; color: #ff6b6b; font-weight: 700;
  }
  .pdf-req-content span {
    font-size: 0.82rem; color: var(--text-muted);
  }
  .btn-pdf-urgent {
    background: #f85149; color: #fff; border: none;
    padding: 0.6rem 1.2rem; border-radius: var(--radius, 8px);
    font-weight: 700; font-size: 0.88rem; cursor: pointer;
    white-space: nowrap; transition: opacity 0.2s;
  }
  .btn-pdf-urgent:hover { opacity: 0.88; }

  /* Barra de acciones */
  .action-bar {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    padding-top: 0.5rem; margin-bottom: 0.5rem;
  }
  .btn-submit { background: #3fb950; color: #fff; }
  .btn-print  { background: none; border: 1px solid var(--border); color: var(--text-primary); }
  .btn-print:hover { border-color: var(--text-muted); }

  .btn-retry { background: none; border: 1px solid var(--color-warn, #ffb800); color: var(--color-warn, #ffb800); }
  .btn-retry:hover { background: var(--color-warn, #ffb800); color: #000; }

  .submit-ok {
    font-family: var(--font-mono); font-size: 0.85rem;
    color: var(--color-correct, #00ff41);
    padding: 0.4rem 0.8rem;
  }

  /* Print */
  @media print {
    .no-print { display: none !important; }
    .case-card {
      border: 1px solid #ccc !important; background: #fff !important;
      break-inside: avoid; margin-bottom: 1.5rem;
    }
    .case-header { background: #f5f5f5 !important; border-color: #ccc !important; }
    .case-badge { background: #555 !important; }
    .specs-grid { background: #fafafa !important; }
    .spec-item { border-color: #ddd !important; background: #fff !important; }
    .spec-key { color: #555 !important; }
    .spec-val { color: #000 !important; }
    .scenario-block { background: #fafafa !important; }
    .scenario-text { color: #222 !important; }
    .resp-area {
      border: 1px solid #888 !important; background: #fff !important;
      color: #000 !important;
    }
    .section-estatica {
      border: 1px solid #ccc !important; background: #fff !important; break-inside: avoid;
    }
    .model-name, .case-title { color: #000 !important; }
  }

  @media (max-width: 600px) {
    .specs-grid { grid-template-columns: 1fr 1fr; }
    .fuente-item { flex-direction: column; }
    .pdf-required-banner { flex-direction: column; align-items: flex-start; }
  }
</style>
