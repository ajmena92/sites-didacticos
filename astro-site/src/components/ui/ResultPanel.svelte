<script>
  import { onDestroy } from 'svelte';
  import { totalScore, sectionScores } from '../../stores/score.js';

  let { totalPuntos = 0, exportarPdf = false, tituloTarea = '' } = $props();

  let score    = $state(totalScore.get());
  let sections = $state(sectionScores.get());
  const u1 = totalScore.subscribe(v => { score = v; });
  const u2 = sectionScores.subscribe(v => { sections = v; });
  onDestroy(() => { u1(); u2(); });

  let pct = $derived(totalPuntos > 0 ? Math.round((score / totalPuntos) * 100) : 0);
  let rating = $derived(
    pct >= 90 ? { icon: '🏆', label: 'EXCELENTE',        color: '#00ff41' } :
    pct >= 75 ? { icon: '✅', label: 'MUY BIEN',          color: '#00b4d8' } :
    pct >= 60 ? { icon: '⚠️', label: 'ACEPTABLE',         color: '#ffb800' } :
                { icon: '🔁', label: 'NECESITA REFUERZO', color: '#ff3a3a' }
  );

  function exportPDF() {
    const studentKey = Object.keys(localStorage).find(k => k.startsWith('estudiante_v1_'));
    const student = studentKey ? JSON.parse(localStorage.getItem(studentKey) ?? '{}') : {};
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(tituloTarea || 'Resultado', 20, 20);
    doc.setFontSize(11);
    doc.text(`Estudiante: ${student.nombre ?? 'N/D'}`, 20, 35);
    doc.text(`Grupo: ${student.grupo ?? 'N/D'}   Fecha: ${student.fecha ?? 'N/D'}`, 20, 43);
    doc.text(`Puntaje: ${score} / ${totalPuntos} pts (${pct}%) — ${rating.label}`, 20, 55);
    doc.setFontSize(10);
    doc.text(`Fill-in-the-blank: ${sections.fillInBlank} pts`, 20, 70);
    doc.text(`Relacionar columnas: ${sections.matching} pts`, 20, 78);
    doc.text(`Ordenar secuencia: ${sections.ordering} pts`, 20, 86);
    doc.text(`Selección múltiple: ${sections.multipleChoice} pts`, 20, 94);
    const filename = `${(student.nombre ?? 'resultado').replace(/\s+/g, '_')}_${tituloTarea.replace(/\s+/g,'_')}.pdf`;
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
  {#if exportarPdf}
    <button class="btn btn-primary" onclick={exportPDF}>⬇ Exportar PDF</button>
  {/if}
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
</style>
