<script>
  import { onMount, onDestroy } from 'svelte';
  import { totalScore, sectionScores, sectionProgress } from '../../stores/score.js';
  import { submitTarea } from '../../lib/submitTarea.js';
  import Toast from './Toast.svelte';

  let {
    totalPuntos = 0,
    exportarPdf = false,
    tituloTarea = '',
    entregaId = '',
    scriptUrl = '',
    secciones = null,
    cursoNombre = '',
    docenteNombre = '',
  } = $props();

  let score    = $state(totalScore.get());
  let sections = $state(sectionScores.get());
  let progress = $state(sectionProgress.get());
  const u1 = totalScore.subscribe(v => { score = v; });
  const u2 = sectionScores.subscribe(v => { sections = v; });
  const u3 = sectionProgress.subscribe(v => { progress = v; });
  onDestroy(() => { u1(); u2(); u3(); });

  let pct = $derived(totalPuntos > 0 ? Math.round((score / totalPuntos) * 100) : 0);
  let rating = $derived(
    pct >= 90 ? { icon: '🏆', label: 'EXCELENTE',        color: '#00ff41' } :
    pct >= 75 ? { icon: '✅', label: 'MUY BIEN',          color: '#00b4d8' } :
    pct >= 60 ? { icon: '⚠️', label: 'ACEPTABLE',         color: '#ffb800' } :
                { icon: '🔁', label: 'NECESITA REFUERZO', color: '#ff3a3a' }
  );

  let allDone = $derived(Object.values(progress).every(Boolean));

  const sectionLabels = {
    fillInBlank:    'Complete el Comando',
    matching:       'Relacione Columnas',
    ordering:       'Ordene la Secuencia',
    multipleChoice: 'Preguntas de Escenario',
  };

  // Submit state
  let submitStatus = $state('idle'); // idle | sending | sent | error
  let submitError  = $state('');
  let pdfRequired  = $state(false);
  let toast        = $state(null);

  onMount(() => {
    if (entregaId && localStorage.getItem(`enviado_v1_${entregaId}`)) {
      submitStatus = 'sent';
    }
  });

  function buildPayload() {
    const student = JSON.parse(localStorage.getItem(`estudiante_v1_${entregaId}`) ?? '{}');
    const answers = {};
    ['fillInBlank', 'matching', 'ordering', 'multipleChoice'].forEach(sec => {
      const raw = localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`);
      if (raw) answers[sec] = JSON.parse(raw);
    });
    return { entregaId, student, scores: sections, totalScore: score, answers };
  }

  async function handleSubmit() {
    if (submitStatus === 'sent' || submitStatus === 'sending') return;
    submitStatus = 'sending';
    submitError  = '';
    pdfRequired  = false;
    try {
      const payload = buildPayload();
      await submitTarea({ scriptUrl, ...payload });
      localStorage.setItem(`enviado_v1_${entregaId}`, 'true');
      submitStatus = 'sent';
      pdfRequired  = false;
      const student = JSON.parse(localStorage.getItem(`estudiante_v1_${entregaId}`) ?? '{}');
      toast = {
        tipo: 'success',
        titulo: 'TAREA ENTREGADA AL DOCENTE',
        mensaje: `Registrada el ${student.fecha ?? new Date().toLocaleDateString('es-CR')}`,
      };
    } catch (e) {
      submitStatus = 'error';
      submitError  = String(e);
      pdfRequired  = true;
      toast = {
        tipo: 'error',
        titulo: 'ERROR DE ENVÍO',
        mensaje: 'Entrega el PDF físicamente al docente.',
      };
    }
  }

  function descargarJson() {
    const blob = new Blob(
      [JSON.stringify(buildPayload(), null, 2)],
      { type: 'application/json' }
    );
    const student = JSON.parse(localStorage.getItem(`estudiante_v1_${entregaId}`) ?? '{}');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `${(student.nombre ?? 'resultado').replace(/\s+/g,'_')}_${entregaId}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPDF() {
    const student = JSON.parse(localStorage.getItem(`estudiante_v1_${entregaId}`) ?? '{}');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    const line = (text, fontSize = 11, indent = 20) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(String(text), 170);
      lines.forEach(l => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(l, indent, y);
        y += fontSize * 0.5 + 2;
      });
      y += 2;
    };

    const sep = (label = '') => {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 2;
      line(label ? `--- ${label} ---` : '---', 9);
    };

    // Header
    line(`TAREA: ${tituloTarea || 'Resultado'}`, 15);
    y += 2;
    line(`Docente: ${docenteNombre || 'N/D'}   Curso: ${cursoNombre || 'N/D'}`);
    line(`Estudiante: ${student.nombre ?? 'N/D'}   Cedula: ${student.cedula ?? 'N/D'}`);
    line(`Grupo: ${student.grupo ?? 'N/D'}   Institucion: ${student.turno ?? 'N/D'}   Fecha entrega: ${student.fecha ?? 'N/D'}`);
    line(`Generado: ${new Date().toLocaleString('es-CR')}`);
    y += 4;

    // Final score
    line(`NOTA FINAL: ${score} / ${totalPuntos} pts (${pct}%) -- ${rating.label}`, 13);
    y += 4;

    // Section summary
    sep('Resumen de Secciones');
    Object.entries(sectionLabels).forEach(([key, label]) => {
      const prog = progress[key] ? '[+]' : '[ ]';
      line(`  ${prog} ${label}: ${sections[key] ?? 0} pts`, 10, 25);
    });
    y += 4;

    // Detailed answers per section
    const answerKeys = ['fillInBlank', 'matching', 'ordering', 'multipleChoice'];
    answerKeys.forEach(sec => {
      const raw = localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`);
      if (!raw) return;
      const d = JSON.parse(raw);

      sep(sectionLabels[sec]);

      if (sec === 'fillInBlank' && d.answers) {
        d.answers.forEach((ans, i) => {
          const ok = d.results?.[i];
          const marker = ok === true ? '[+]' : ok === false ? '[--]' : '[ ?]';
          let text = `  ${marker} ${ans || '(vacio)'}`;
          if (ok === false) {
            const correcto = secciones?.fillInBlank?.items?.[i]?.respuestas_validas?.[0];
            if (correcto) text += `  (correcto: ${correcto})`;
          }
          line(text, 9, 25);
        });

      } else if (sec === 'ordering' && d.selections) {
        d.selections.forEach((sel, i) => {
          const ok = d.results?.[i];
          const marker = ok === true ? '[+]' : ok === false ? '[--]' : '[ ?]';
          const stepLabel = secciones?.ordering?.pasos?.find(p => p.orden === parseInt(sel))?.label ?? '';
          let text = `  ${marker} ${sel || '?'}. ${stepLabel}`;
          if (ok === false) {
            const correctOrden = secciones?.ordering?.pasos?.[i]?.orden ?? (i + 1);
            text += `  (correcto: posicion ${correctOrden})`;
          }
          line(text, 9, 25);
        });

      } else if (sec === 'multipleChoice' && d.selections) {
        d.selections.forEach((sel, i) => {
          const ok = d.results?.[i];
          const marker = ok === true ? '[+]' : ok === false ? '[--]' : '[ ?]';
          const pregunta = secciones?.multipleChoice?.preguntas?.[i];
          const opcionText = pregunta?.opciones?.[sel] ?? '';
          const numOp = sel !== null && sel !== undefined ? sel + 1 : '?';
          let text = `  ${marker} P${i+1}: opcion ${numOp}${opcionText ? ' - ' + opcionText : ''}`;
          if (ok === false && pregunta?.correcta !== undefined) {
            text += `  (correcta: opcion ${pregunta.correcta + 1})`;
          }
          line(text, 9, 25);
        });

      } else if (sec === 'matching') {
        if (secciones?.matching?.pares) {
          secciones.matching.pares.forEach(par => {
            const attempted = d.matched?.[par.id] !== undefined;
            const correct   = d.matched?.[par.id] === true;
            const marker = correct ? '[+]' : attempted ? '[--]' : '[ ]';
            line(`  ${marker} ${par.comando} -> ${par.definicion}`, 9, 25);
          });
        } else if (d.matched) {
          const correctCount = Object.values(d.matched).filter(Boolean).length;
          line(`  ${correctCount} pares correctos de ${Object.keys(d.matched).length} intentados`, 9, 25);
        }
      }
      y += 2;
    });

    const filename = `${(student.nombre ?? 'resultado').replace(/\s+/g,'_')}_${tituloTarea.replace(/\s+/g,'_')}.pdf`;
    doc.save(filename);
  }
</script>

<div class="result card" style={`border-color: ${rating.color}`}>
  <div class="result-rating">
    <span class="result-icon">{rating.icon}</span>
    <span class="result-label" style={`color:${rating.color}`}>{rating.label}</span>
  </div>
  <div class="result-score">{score} <span class="result-of">/ {totalPuntos} pts</span></div>
  <div class="result-bar-wrap">
    <div class="result-bar" style={`width:${pct}%; background:${rating.color}`}></div>
  </div>
  <div class="result-pct">{pct}%</div>
  <div class="result-breakdown">
    <span>Fill-in: {sections.fillInBlank}</span>
    <span>Matching: {sections.matching}</span>
    <span>Orden: {sections.ordering}</span>
    <span>Escenario: {sections.multipleChoice}</span>
  </div>

  <!-- Section checklist -->
  <div class="checklist">
    {#each Object.entries(sectionLabels) as [key, label]}
      <div class="check-item" class:done={progress[key]}>
        <span class="check-icon">{progress[key] ? '✓' : '○'}</span>
        <span class="check-label">{label}</span>
      </div>
    {/each}
  </div>

  {#if !allDone}
    <p class="checklist-note">Complete todas las secciones antes de entregar.</p>
  {/if}

  <!-- Banner PDF obligatorio cuando el envío falla -->
  {#if pdfRequired}
    <div class="pdf-required-banner">
      <span class="pdf-req-icon">⚠️</span>
      <div class="pdf-req-content">
        <strong>No se pudo entregar en línea.</strong>
        <span>Exporta el PDF y entrégalo físicamente al docente.</span>
      </div>
      {#if exportarPdf}
        <button class="btn btn-pdf-urgent" onclick={exportPDF}>🖨️ Exportar PDF ahora</button>
      {/if}
    </div>
  {/if}

  <!-- Action buttons -->
  <div class="result-actions">
    {#if exportarPdf}
      <button class="btn btn-primary" onclick={exportPDF}>⬇ Exportar PDF</button>
    {/if}

    <button class="btn" onclick={descargarJson}>⬇ Descargar JSON</button>

    {#if scriptUrl}
      {#if submitStatus === 'idle'}
        <button
          class="btn btn-submit"
          onclick={handleSubmit}
          disabled={!allDone}
          title={allDone ? 'Enviar al profesor' : 'Complete todas las secciones primero'}
        >
          ✉ Entregar Tarea
        </button>
      {:else if submitStatus === 'sending'}
        <button class="btn btn-submit" disabled>⏳ Enviando…</button>
      {:else if submitStatus === 'sent'}
        <span class="submit-ok">✓ Tarea entregada</span>
      {:else if submitStatus === 'error'}
        <button class="btn" onclick={handleSubmit}>↺ Reintentar envío</button>
      {/if}
    {/if}
  </div>
</div>

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
  .result { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
  .result-rating { display: flex; align-items: center; gap: 0.5rem; }
  .result-icon   { font-size: 1.8rem; }
  .result-label  { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
  .result-score  { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); }
  .result-of     { font-size: 1rem; color: var(--text-muted); }
  .result-bar-wrap { width: 100%; max-width: 400px; background: var(--border); border-radius: 100px; height: 8px; overflow: hidden; }
  .result-bar { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
  .result-pct  { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); }
  .result-breakdown { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }

  .checklist {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 100%;
    max-width: 320px;
    align-items: flex-start;
  }
  .check-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    transition: color 0.3s;
  }
  .check-item.done { color: var(--color-correct, #00ff41); }
  .check-icon { font-size: 0.72rem; min-width: 1em; }

  .checklist-note {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 0;
  }

  .result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .btn-submit {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
    font-weight: 600;
  }
  .btn-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .submit-ok {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-correct, #00ff41);
    padding: 0.4rem 0.8rem;
  }

  .submit-error-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }
  .submit-err {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-error, #ff3a3a);
    text-align: center;
  }

  .pdf-required-banner {
    display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
    width: 100%; max-width: 480px;
    background: rgba(248,81,73,.1);
    border: 1px solid rgba(248,81,73,.35);
    border-left: 4px solid #f85149;
    border-radius: 8px; padding: 0.85rem 1rem;
  }
  .pdf-req-icon { font-size: 1.4rem; flex-shrink: 0; }
  .pdf-req-content {
    flex: 1; display: flex; flex-direction: column; gap: 0.15rem; text-align: left;
  }
  .pdf-req-content strong { font-size: 0.82rem; color: #ff6b6b; }
  .pdf-req-content span   { font-size: 0.75rem; color: var(--text-muted); }
  .btn-pdf-urgent {
    background: #f85149; color: #fff; border: none;
    padding: 0.45rem 0.9rem; border-radius: 6px;
    font-weight: 700; font-size: 0.8rem; cursor: pointer;
    white-space: nowrap; transition: opacity 0.2s;
  }
  .btn-pdf-urgent:hover { opacity: 0.85; }
</style>
