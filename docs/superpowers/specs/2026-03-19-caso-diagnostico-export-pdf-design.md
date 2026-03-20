# Design: Exportar PDF con jsPDF — CasoDiagnostico

**Fecha:** 2026-03-19
**Archivos a modificar:**
- `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`
- `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`

**Referencia:** `astro-site/src/components/ui/ResultPanel.svelte` (función `exportPDF`)

---

## Objetivo

Reemplazar `window.print()` en `CasoDiagnostico` con una función `exportPDF()` basada en
jsPDF, produciendo un PDF formateado equivalente al de `ResultPanel`.

jsPDF ya se carga condicionalmente desde CDN en `BaseLayout.astro` cuando
`exportarPdf=true` — no se requiere ningún cambio en el layout ni en la configuración.

---

## Cambios en `CasoDiagnostico.svelte`

### 1. Nuevos props

Añadir al bloque `$props()`:

```js
let {
  casos           = [],
  seccionesEstaticas = [],
  entregaId       = '',
  scriptUrl       = '',
  exportarPdf     = false,
  tituloTarea     = '',   // ← nuevo
  cursoNombre     = '',   // ← nuevo
  docenteNombre   = '',   // ← nuevo
} = $props();
```

### 2. Reemplazar `handlePrint()` con `exportPDF()`

Eliminar la función actual:
```js
function handlePrint() {
  if (!student?.nombre) { warnMsg = 'Completa tu identificación antes de imprimir.'; return; }
  window.print();
}
```

Reemplazar por:
```js
function exportPDF() {
  if (!student?.nombre) {
    warnMsg = 'Completa tu identificación antes de exportar el PDF.';
    return;
  }
  if (!window.jspdf) {
    warnMsg = 'La librería PDF no está disponible. Recarga la página e intenta de nuevo.';
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  const addLine = (text, fontSize = 11, indent = 20) => {
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
    addLine(label ? `--- ${label} ---` : '---', 9);
  };

  // Encabezado
  addLine(`TAREA: ${tituloTarea || entregaId}`, 15);
  y += 2;
  addLine(`Docente: ${docenteNombre || 'N/D'}   Curso: ${cursoNombre || 'N/D'}`);
  addLine(`Estudiante: ${student.nombre ?? 'N/D'}   Cédula: ${student.cedula ?? 'N/D'}`);
  addLine(`Grupo: ${student.grupo ?? 'N/D'}   Institución: ${student.turno ?? 'N/D'}   Fecha: ${student.fecha ?? 'N/D'}`);
  addLine(`Generado: ${new Date().toLocaleString('es-CR')}`);
  y += 4;

  // Casos asignados
  assignedCases.forEach((caso, idx) => {
    const base = caso.id.toLowerCase().replace('-', '');
    sep(`CASO ${caso.id}: ${caso.title}`);
    addLine(`Modelo: ${caso.model}`, 10, 25);
    addLine(`Dificultad: ${caso.difficulty}`, 10, 25);
    y += 2;
    addLine(`Situación: ${caso.scenario}`, 10, 25);
    y += 2;

    // Specs del hardware (incluidas en el PDF como contexto del caso)
    if (caso.specs && Object.keys(caso.specs).length > 0) {
      sep('Especificaciones del equipo');
      Object.entries(caso.specs).forEach(([k, v]) => {
        addLine(`${k}: ${v}`, 9, 30);
      });
      y += 2;
    }

    caso.questions.forEach((q, qi) => {
      const key = `${base}-q${qi + 1}`;
      addLine(`${idx + 1}.${qi + 1} ${q}`, 10, 25);
      const resp = respuestas[key]?.trim() || '(sin respuesta)';
      addLine(`R/ ${resp}`, 9, 30);
      y += 1;
    });

    const dictKey = `${base}-dictamen`;
    sep('Dictamen técnico final');
    const dictResp = respuestas[dictKey]?.trim() || '(sin respuesta)';
    addLine(dictResp, 10, 25);
    y += 2;
  });

  // Secciones estáticas
  if (seccionesEstaticas.length > 0) {
    sep('Criterio Técnico y Ética Profesional');
    seccionesEstaticas.forEach(sec => {
      addLine(sec.titulo, 11, 20);
      addLine(sec.descripcion, 9, 25);
      const resp = respuestas[sec.id]?.trim() || '(sin respuesta)';
      addLine(`R/ ${resp}`, 9, 25);
      y += 2;
    });
  }

  const filename = `${(student.nombre ?? 'resultado').replace(/\s+/g, '_')}_${entregaId}.pdf`;
  doc.save(filename);
}
```

### 3. Actualizar referencias en el template

En el card de resultado, reemplazar todas las referencias a `handlePrint` por `exportPDF`
y actualizar los labels:

**Botón `btn-print`** (en `div.result-actions`):
```svelte
<!-- antes -->
<button class="btn btn-print" onclick={handlePrint}>🖨️ Imprimir / PDF</button>
<!-- después -->
<button class="btn btn-print" onclick={exportPDF}>⬇ Exportar PDF</button>
```

**Botón `btn-pdf-urgent`** (en `div.pdf-required-banner`):
```svelte
<!-- antes -->
<button class="btn btn-pdf-urgent" onclick={handlePrint}>
  🖨️ Imprimir PDF ahora
</button>
<!-- después -->
<button class="btn btn-pdf-urgent" onclick={exportPDF}>
  ⬇ Exportar PDF ahora
</button>
```

---

## Cambios en `[slug].astro`

En el bloque `CasoDiagnostico`, añadir los tres props nuevos:

```astro
{esCasoDiag && ej && (
  <CasoDiagnostico
    client:visible
    casos={ej.casos}
    seccionesEstaticas={ej.secciones_estaticas ?? []}
    entregaId={entrega.id}
    scriptUrl={(entrega as any).google_script_url ?? ''}
    exportarPdf={(entrega as any).parametros.exportar_pdf}
    tituloTarea={entrega.titulo}
    cursoNombre={cursoNombre}
    docenteNombre={docenteNombre}
  />
)}
```

(`cursoNombre` y `docenteNombre` ya están calculados en el frontmatter de `[slug].astro`.)

---

## Estructura del PDF generado

```
TAREA: Tarea 1 I Semestre Undécimo AYSC — Diagnóstico Técnico Profesional
Docente: Ing. Andrés Mena Abarca   Curso: Adm. y Soporte — Informática
Estudiante: Pérez López, Juan   Cédula: 207890123
Grupo: 11-2 Adm. y Soporte   Institución: CTP PLATANARES   Fecha: 19/3/2026
Generado: 19/3/2026, 10:25:00

--- CASO C-01: Laptop sin imagen ---
  Modelo: Dell Inspiron 15
  Dificultad: Intermedio
  Situación: El cliente reporta que la pantalla...

  1.1 ¿Cuál es el componente más probable...?
      R/ La tarjeta de video podría estar...
  ...
  --- Dictamen técnico final ---
  Se recomienda la sustitución del...

--- CASO C-03: ... ---
  ...

--- Criterio Técnico y Ética Profesional ---
  {sec.titulo}
  {sec.descripcion}
  R/ {respuesta del estudiante}
```

---

## Exclusiones intencionales del PDF

- **`caso.fuentes`** — fuentes de investigación marcadas `no-print` en CSS; son guías de
  trabajo para el estudiante, no parte de la entrega. Se excluyen del PDF por diseño.
- **`window.print()`** — eliminado completamente; el PDF se genera siempre con jsPDF.

---

## Lo que NO cambia

- Estilos del componente — ningún cambio
- Lógica de envío (`handleSubmit`), stores, localStorage
- Card de resultado (rating, barra, botones de envío)
- `exportarPdf` prop ya existente — controla visibilidad del botón (sin cambios)
- jsPDF se carga desde CDN cuando `exportarPdf=true` — ya funciona

---

## Verificación

1. `nvm use 22 && npm run build` — sin errores
2. Con `exportarPdf: true` en config.json (ya está en diagnostico-hardware): botón "⬇ Exportar PDF" visible en el card
3. Sin estudiante identificado: clic en botón muestra warnMsg, no genera PDF
4. Con estudiante y casos asignados: PDF descarga con nombre `{Apellido_Nombre}_diagnostico-hardware.pdf`
5. PDF contiene: encabezado completo, ambos casos con preguntas y respuestas, dictamen, sección estática
6. Campos vacíos aparecen como "(sin respuesta)" — no errores
7. Botón "🖨️ Imprimir PDF ahora" en banner de error también llama a `exportPDF`
8. `ResultPanel` (CCNA1) no cambia
