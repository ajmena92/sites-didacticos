# Exportar PDF con jsPDF — CasoDiagnostico

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar `window.print()` en `CasoDiagnostico` con `exportPDF()` usando jsPDF, produciendo un PDF formateado igual al de `ResultPanel`.

**Architecture:** Se añaden tres props (`tituloTarea`, `cursoNombre`, `docenteNombre`) a `CasoDiagnostico.svelte`, se reemplaza `handlePrint()` con `exportPDF()` usando `window.jspdf` (ya cargado por `BaseLayout` cuando `exportarPdf=true`), y se actualizan dos botones en el template. En `[slug].astro` se pasan los tres props nuevos al componente.

**Tech Stack:** Svelte 5 (runes), jsPDF 2.5.1 (CDN via `window.jspdf`), Astro 6, Node 22

**Spec:** `docs/superpowers/specs/2026-03-19-caso-diagnostico-export-pdf-design.md`

---

## Chunk 1: CasoDiagnostico.svelte

### Task 1: Añadir props y reemplazar handlePrint con exportPDF

**Files:**
- Modify: `astro-site/src/components/ejercicios/CasoDiagnostico.svelte`

- [ ] **Paso 1: Añadir los tres props nuevos al bloque `$props()`**

Localizar el bloque actual (líneas 6-12):
```js
let {
  casos = [],
  seccionesEstaticas = [],
  entregaId = '',
  scriptUrl = '',
  exportarPdf = false,
} = $props();
```

Reemplazar por:
```js
let {
  casos           = [],
  seccionesEstaticas = [],
  entregaId       = '',
  scriptUrl       = '',
  exportarPdf     = false,
  tituloTarea     = '',
  cursoNombre     = '',
  docenteNombre   = '',
} = $props();
```

- [ ] **Paso 2: Eliminar `handlePrint()` y añadir `exportPDF()`**

Localizar y eliminar la función actual (al final del `<script>`, después de `handleSubmit`):
```js
function handlePrint() {
  if (!student?.nombre) { warnMsg = 'Completa tu identificación antes de imprimir.'; return; }
  window.print();
}
```

En su lugar, insertar:
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

    // Specs del hardware
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

- [ ] **Paso 3: Actualizar botón `btn-print` en `div.result-actions`**

Localizar:
```svelte
<button class="btn btn-print" onclick={handlePrint}>🖨️ Imprimir / PDF</button>
```

Reemplazar por:
```svelte
<button class="btn btn-print" onclick={exportPDF}>⬇ Exportar PDF</button>
```

- [ ] **Paso 4: Actualizar botón `btn-pdf-urgent` en `div.pdf-required-banner`**

Localizar:
```svelte
<button class="btn btn-pdf-urgent" onclick={handlePrint}>
  🖨️ Imprimir PDF ahora
</button>
```

Reemplazar por:
```svelte
<button class="btn btn-pdf-urgent" onclick={exportPDF}>
  ⬇ Exportar PDF ahora
</button>
```

---

## Chunk 2: [slug].astro + build + commit

### Task 2: Pasar props nuevos en [slug].astro

**Files:**
- Modify: `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`

- [ ] **Paso 1: Añadir los tres props al bloque `CasoDiagnostico`**

Localizar el bloque actual (líneas 75-84):
```astro
{esCasoDiag && ej && (
  <CasoDiagnostico
    client:visible
    casos={ej.casos}
    seccionesEstaticas={ej.secciones_estaticas ?? []}
    entregaId={entrega.id}
    scriptUrl={(entrega as any).google_script_url ?? ''}
    exportarPdf={(entrega as any).parametros.exportar_pdf}
  />
)}
```

Reemplazar por:
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

> `cursoNombre` y `docenteNombre` ya están calculados en el frontmatter (líneas 55-56 de `[slug].astro`). No hace falta añadir nada más.

### Task 3: Build y commit

**Files:** ninguno nuevo

- [ ] **Paso 1: Build**

```bash
cd astro-site && \
  export NVM_DIR="$HOME/.nvm" && \
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" && \
  nvm use 22 && \
  npm run build 2>&1 | tail -15
```

Esperado: `✓ Completed` sin errores. Si hay error de TypeScript en `[slug].astro`, verificar que `entrega.titulo` existe (es `string` en el tipo de `entrega`).

- [ ] **Paso 2: Commit**

```bash
cd /mnt/c/dev/sites-didacticos && \
  git add \
    astro-site/src/components/ejercicios/CasoDiagnostico.svelte \
    astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro && \
  git commit -m "feat: exportar PDF con jsPDF en CasoDiagnostico

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
