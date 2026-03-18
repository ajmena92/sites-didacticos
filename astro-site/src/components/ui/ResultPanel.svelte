<script>
  import { onMount, onDestroy } from 'svelte';
  import { totalScore, sectionScores, sectionProgress } from '../../stores/score.js';
  import { submitTarea } from '../../lib/submitTarea.js';

  let {
    totalPuntos = 0,
    exportarPdf = false,
    tituloTarea = '',
    entregaId = '',
    scriptUrl = '',
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
    try {
      const payload = buildPayload();
      await submitTarea({ scriptUrl, ...payload });
      localStorage.setItem(`enviado_v1_${entregaId}`, 'true');
      submitStatus = 'sent';
    } catch (e) {
      submitStatus = 'error';
      submitError  = String(e);
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
      const lines = doc.splitTextToSize(text, 170);
      lines.forEach(l => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(l, indent, y);
        y += fontSize * 0.5 + 2;
      });
      y += 2;
    };

    line(tituloTarea || 'Resultado', 16);
    y += 4;
    line(`Estudiante: ${student.nombre ?? 'N/D'}`);
    line(`Grupo: ${student.grupo ?? 'N/D'}   Fecha: ${student.fecha ?? 'N/D'}`);
    line(`Puntaje: ${score} / ${totalPuntos} pts (${pct}%) — ${rating.label}`, 12);
    y += 4;

    line('Detalle por sección:', 11);
    line(`  Fill-in-the-blank: ${sections.fillInBlank} pts`, 10, 25);
    line(`  Relacionar columnas: ${sections.matching} pts`, 10, 25);
    line(`  Ordenar secuencia: ${sections.ordering} pts`, 10, 25);
    line(`  Selección múltiple: ${sections.multipleChoice} pts`, 10, 25);
    y += 4;

    // Include student answers per section
    const answerKeys = ['fillInBlank', 'matching', 'ordering', 'multipleChoice'];
    answerKeys.forEach(sec => {
      const raw = localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`);
      if (!raw) return;
      const d = JSON.parse(raw);

      if (y > 250) { doc.addPage(); y = 20; }
      line(`— ${sectionLabels[sec]} —`, 10);

      if (sec === 'fillInBlank' && d.answers) {
        d.answers.forEach((ans, i) => {
          const ok = d.results?.[i];
          line(`  [${ok === true ? '✓' : ok === false ? '✗' : '?'}] ${ans || '(vacío)'}`, 9, 25);
        });
      } else if (sec === 'ordering' && d.selections) {
        d.selections.forEach((sel, i) => {
          const ok = d.results?.[i];
          line(`  [${ok === true ? '✓' : ok === false ? '✗' : '?'}] Paso ${sel || '?'}`, 9, 25);
        });
      } else if (sec === 'multipleChoice' && d.selections) {
        d.selections.forEach((sel, i) => {
          const ok = d.results?.[i];
          line(`  P${i+1}: opción ${sel !== null ? sel + 1 : '?'} [${ok === true ? '✓' : ok === false ? '✗' : '?'}]`, 9, 25);
        });
      } else if (sec === 'matching' && d.matched) {
        const correctCount = Object.values(d.matched).filter(Boolean).length;
        line(`  ${correctCount} pares correctos de ${Object.keys(d.matched).length} intentados`, 9, 25);
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
        <div class="submit-error-wrap">
          <span class="submit-err">✗ Error al enviar. Descargue el JSON y envíelo por correo.</span>
          <button class="btn" onclick={handleSubmit}>↺ Reintentar</button>
        </div>
      {/if}
    {/if}
  </div>
</div>

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
</style>
