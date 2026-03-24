# FichaInteractiva — Fundamentos de Programación 10° Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `U1_RA4_Ficha_01_Matrices.html` al framework Astro como nueva tipología `ficha-interactiva`, reusable para fichas futuras del curso `prog10`, con persistencia en localStorage, restauración desde Apps Script y calificación por nivel (Avanzado / Intermedio / Inicial).

**Architecture:** Nueva colección Astro `prog10-tareas` con JSON de contenido declarativo (etapas → pasos tipo `select` o `matrix-input`, más evaluación final). Un componente Svelte 5 `FichaInteractiva.svelte` renderiza el contenido dinámicamente. El `StudentGate` existente maneja identificación y restauración desde Sheets; `FichaInteractiva` maneja estado local y envío al Apps Script al completar la evaluación.

**Tech Stack:** Astro 6, Svelte 5 (runes), nanostores (`studentStore`), localStorage, Google Apps Script (mismo endpoint que las demás entregas).

---

## Mapa de archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `astro-site/src/data/config.json` |
| Modificar | `astro-site/src/content.config.ts` |
| Modificar | `astro-site/src/components/ui/StudentGate.svelte` |
| Modificar | `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro` |
| Crear | `astro-site/src/content/prog10/tareas/u1-ra4-ficha-01-matrices.json` |
| Crear | `astro-site/src/components/ejercicios/FichaInteractiva.svelte` |

---

## Task 1: Registrar curso, grupos y entrega en config.json

**Files:**
- Modify: `astro-site/src/data/config.json`

- [ ] **Step 1: Agregar curso `prog10`** — en el objeto `cursos`, al final:

```json
"prog10": {
  "nombre": "Fundamentos de Programación 10°",
  "color_accent": "#4f8ef7"
}
```

- [ ] **Step 2: Agregar grupos `prog-10-1` y `prog-10-3`** — en el array `grupos`, al final (antes del cierre `]`):

```json
{
  "id": "prog-10-1",
  "nombre": "10-1 Programación",
  "turno": "CTP PLATANARES"
},
{
  "id": "prog-10-3",
  "nombre": "10-3 Programación",
  "turno": "CTP PLATANARES"
}
```

- [ ] **Step 3: Agregar entrega** — en el array `entregas`, al final:

```json
{
  "id": "u1-ra4-ficha-01-matrices",
  "curso": "prog10",
  "modulo": "unidad1",
  "tipo": "ficha",
  "tipo_ejercicio": "ficha-interactiva",
  "titulo": "U1-RA4 · Ficha 01 — Matrices",
  "grupos_habilitados": ["prog-10-1", "prog-10-3"],
  "activa": true,
  "fecha_apertura": "2026-03-23T00:00:00",
  "fecha_cierre": "2026-06-30T23:59:00",
  "puntos": 0,
  "google_script_url": "https://script.google.com/macros/s/AKfycbwQKRs4OiVXIY-Sjqnvu1bghl_89pySwRBgybD-FhnP3kvJHLRAu6gooU7VDwwStYBcjA/exec",
  "parametros": {
    "mostrar_respuestas": true,
    "exportar_pdf": true,
    "mostrar_progreso": false,
    "permitir_reintento": true
  }
}
```

> **Nota:** `puntos: 0` porque la calificación es nominal (Avanzado/Intermedio/Inicial), no numérica. `mostrar_progreso: false` para que TareaLayout no muestre la ProgressBar genérica de secciones (FichaInteractiva tiene su propia barra).

- [ ] **Step 4: Verificar JSON válido**

```bash
cd /mnt/c/Dev/sites-didacticos/astro-site
node -e "require('./src/data/config.json'); console.log('JSON válido')"
```

Expected: `JSON válido`

- [ ] **Step 5: Commit**

```bash
git add astro-site/src/data/config.json
git commit -m "feat(prog10): registrar curso, grupos y entrega ficha-01-matrices en config"
```

---

## Task 2: Crear contenido JSON de la ficha

**Files:**
- Create: `astro-site/src/content/prog10/tareas/u1-ra4-ficha-01-matrices.json`

- [ ] **Step 1: Crear directorio y archivo JSON**

```bash
mkdir -p /mnt/c/Dev/sites-didacticos/astro-site/src/content/prog10/tareas
```

Crear `astro-site/src/content/prog10/tareas/u1-ra4-ficha-01-matrices.json` con el siguiente contenido:

```json
{
  "id": "u1-ra4-ficha-01-matrices",
  "titulo": "U1-RA4 · Ficha 01 — Matrices",
  "subtitulo": "Fundamentos de Programación · Décimo · 2026",
  "matrices_contexto": {
    "L": {
      "label": "Lunes — Matriz L",
      "color": "accent",
      "rows": ["Z1", "Z2", "Z3"],
      "cols": ["S1 (Temp)", "S2 (Hum)"],
      "data": [[23, 65], [31, 58], [19, 72]]
    },
    "M": {
      "label": "Martes — Matriz M",
      "color": "purple",
      "rows": ["Z1", "Z2", "Z3"],
      "cols": ["S1 (Temp)", "S2 (Hum)"],
      "data": [[25, 62], [33, 55], [21, 70]]
    }
  },
  "etapas": [
    {
      "id": "etapa1",
      "titulo": "Etapa 1 — Conceptos fundamentales de matrices",
      "subtitulo": "Construí el vocabulario técnico desde un caso real de redes",
      "icono": "📐",
      "tag": "Conceptos",
      "tag_color": "blue",
      "contexto": "El CTP Platanares instaló una red de sensores IoT en el edificio de talleres. Hay 3 zonas (Z1: Laboratorio, Z2: Taller mecánico, Z3: Bodega) y 2 tipos de sensores (S1: Temperatura °C, S2: Humedad %). El técnico de redes organiza las lecturas del lunes en la Matriz L y las del martes en la Matriz M.",
      "mostrar_matrices": true,
      "intro": "Una matriz es una tabla rectangular de números organizada en filas (m) (horizontales) y columnas (n) (verticales). Su tamaño se expresa como m × n — siempre filas primero, columnas después. Cada número interno se llama elemento y se identifica como Lij donde i es la fila y j es la columna.",
      "pasos": [
        {
          "id": "p1",
          "tipo": "select",
          "num": "1",
          "titulo": "Dimensión de la Matriz L",
          "descripcion": "Cada fila de la Matriz L representa una zona del edificio y cada columna representa un tipo de sensor. La dimensión se escribe como (número de filas × número de columnas). ¿Cuál es la dimensión de la Matriz L?",
          "placeholder": "Seleccioná...",
          "opciones": [
            { "valor": "w1", "texto": "2 × 3" },
            { "valor": "c",  "texto": "3 × 2" },
            { "valor": "w2", "texto": "6 × 1" },
            { "valor": "w3", "texto": "3 × 3" }
          ],
          "correcto": "c",
          "hint": "💡 Regla de oro: dimensión = (filas) × (columnas). Contá primero las filas horizontales, luego las columnas verticales. Siempre: filas primero."
        },
        {
          "id": "p2",
          "tipo": "select",
          "num": "2",
          "titulo": "Localización de elementos",
          "descripcion": "El técnico necesita revisar la lectura de humedad en el Taller mecánico (Z2) del lunes. En notación matricial, esa posición es el elemento L₂₂ (fila 2 = Z2, columna 2 = S2: Humedad). ¿Cuál es ese valor en la Matriz L?",
          "placeholder": "Valor de ℓ₂₂ ...",
          "opciones": [
            { "valor": "w1", "texto": "31" },
            { "valor": "w2", "texto": "65" },
            { "valor": "c",  "texto": "58" },
            { "valor": "w3", "texto": "72" }
          ],
          "correcto": "c",
          "hint": "💡 L₂₂: fila 2 → Z2 (Taller), columna 2 → S2 (Humedad). Localizá esa intersección en la tabla de la Matriz L."
        },
        {
          "id": "p3",
          "tipo": "select",
          "num": "3",
          "titulo": "Condición para sumar o restar matrices",
          "descripcion": "Antes de operar la Matriz L con la Matriz M, es obligatorio verificar que la operación sea válida. ¿Cuál es la condición que deben cumplir dos matrices para poder sumarse o restarse?",
          "placeholder": "Seleccioná la condición correcta...",
          "opciones": [
            { "valor": "w1", "texto": "Ambas deben ser matrices cuadradas (m = n)." },
            { "valor": "c",  "texto": "Deben tener exactamente la misma dimensión (m × n)." },
            { "valor": "w2", "texto": "La primera debe tener más filas que la segunda." },
            { "valor": "w3", "texto": "Sus elementos deben ser todos números positivos." }
          ],
          "correcto": "c",
          "hint": "💡 Pensá en sumar dos vectores de tamaños distintos: ¿se puede hacer elemento a elemento si uno tiene 3 posiciones y el otro 5? Con matrices aplica la misma lógica: solo hay correspondencia perfecta cuando tienen el mismo tamaño."
        }
      ]
    },
    {
      "id": "etapa2",
      "titulo": "Etapa 2 — Suma y diferencia de matrices",
      "subtitulo": "Aplicá los algoritmos elemento a elemento",
      "icono": "⚙️",
      "tag": "Operaciones",
      "tag_color": "purple",
      "contexto": "El sistema tiene las lecturas de dos días consecutivos: Lunes (L) y Martes (M). El técnico de redes quiere calcular la lectura acumulada de ambos días (suma) y la variación entre días (diferencia) para detectar anomalías en los sensores.",
      "mostrar_matrices": false,
      "intro": "",
      "pasos": [
        {
          "id": "opA",
          "tipo": "matrix-input",
          "num": "A",
          "titulo": "Suma de matrices: S = L + M",
          "descripcion": "La suma de matrices se realiza elemento a elemento: Sij = Lij + Mij. Cada celda del resultado es la suma de las celdas en la misma posición de L y M. Calculá cada uno de los 6 elementos de la Matriz S y completá la grilla.",
          "rows": ["Z1", "Z2", "Z3"],
          "cols": ["S1 (T°)", "S2 (H%)"],
          "placeholders": [["s₁₁", "s₁₂"], ["s₂₁", "s₂₂"], ["s₃₁", "s₃₂"]],
          "solucion": [[48, 127], [64, 113], [40, 142]],
          "hint": "💡 Para S₁₁: tomá la fila 1, columna 1 de L (= 23) y sumale la fila 1, columna 1 de M. Repetí ese procedimiento para las 6 posiciones. Todos los valores resultantes son positivos en esta suma."
        },
        {
          "id": "opB",
          "tipo": "matrix-input",
          "num": "B",
          "titulo": "Diferencia de matrices: D = M − L",
          "descripcion": "Para detectar variaciones, el técnico calcula la diferencia entre el martes y el lunes: Dij = Mij − Lij. La resta también es elemento a elemento. El resultado puede ser positivo (subió la lectura), negativo (bajó) o cero (sin cambio). Calculá cada uno de los 6 elementos de la Matriz D.",
          "rows": ["Z1", "Z2", "Z3"],
          "cols": ["S1 (T°)", "S2 (H%)"],
          "placeholders": [["d₁₁", "d₁₂"], ["d₂₁", "d₂₂"], ["d₃₁", "d₃₂"]],
          "solucion": [[2, -3], [2, -3], [2, -2]],
          "hint": "💡 Dij = Mij − Lij: valor del martes menos valor del lunes. Algunos resultados serán negativos si el martes la lectura fue menor. Por ejemplo D₁₂: humedad Z1 martes (62) − lunes (65) = ?"
        },
        {
          "id": "opC",
          "tipo": "select",
          "num": "C",
          "titulo": "Interpretación del resultado",
          "descripcion": "Revisá la Matriz D que calculaste. Un valor positivo en D significa que la lectura aumentó; un valor negativo significa que disminuyó. Según tu Matriz D, ¿qué ocurrió con la temperatura (columna S1) en todas las zonas del lunes al martes?",
          "placeholder": "Seleccioná la interpretación correcta...",
          "opciones": [
            { "valor": "w1", "texto": "La temperatura bajó en todas las zonas (valores negativos en col. S1)." },
            { "valor": "c",  "texto": "La temperatura subió en todas las zonas (valores positivos en col. S1)." },
            { "valor": "w2", "texto": "La temperatura no cambió en ninguna zona (valores cero)." },
            { "valor": "w3", "texto": "La temperatura subió en Z1 pero bajó en Z2 y Z3." }
          ],
          "correcto": "c",
          "hint": "💡 Mirá la columna S1 (Temperatura) de tu Matriz D. Son los resultados de Mi1 − Li1 para cada zona. ¿Esos valores son positivos, negativos o mixtos? Eso indica si la temperatura subió, bajó o varió por zona."
        }
      ]
    }
  ],
  "evaluacion": {
    "titulo": "Evaluación — Comprobación de conocimientos",
    "subtitulo": "Sin ayuda. Demostrá lo que aprendiste.",
    "preguntas": [
      {
        "id": "q1",
        "texto": "Un nuevo edificio tiene 4 zonas y 3 tipos de sensores. El técnico registra datos en la Matriz N (lunes) y la Matriz K (martes). ¿Cuál es la dimensión de N? ¿Y se puede calcular N + K directamente?",
        "opciones": [
          { "valor": "w1",     "texto": "N es 3 × 4. N + K es posible si K es cuadrada." },
          { "valor": "w2",     "texto": "N es 4 × 3. N + K no es posible porque tienen distinto número de zonas." },
          { "valor": "correct","texto": "N es 4 × 3. N + K es posible si K también tiene dimensión 4 × 3." },
          { "valor": "w3",     "texto": "N es 3 × 4. N + K es posible si K tiene dimensión 3 × 4." }
        ],
        "correcto": "correct"
      },
      {
        "id": "q2",
        "texto": "Con los datos de la práctica: Z3/S1 lunes = 19 °C, Z3/S1 martes = 21 °C. ¿Cuál es el valor del elemento D₃₁ en la Matriz D = M − L?",
        "opciones": [
          { "valor": "w1",     "texto": "−2 (la temperatura bajó en Z3)" },
          { "valor": "correct","texto": "+2 (la temperatura subió en Z3)" },
          { "valor": "w2",     "texto": "40 (suma de los dos valores)" },
          { "valor": "w3",     "texto": "0 (no hubo cambio)" }
        ],
        "correcto": "correct"
      },
      {
        "id": "q3",
        "texto": "El técnico tiene la Matriz S = L + M. ¿Qué representa el elemento S₁₂ en el contexto del sistema IoT?",
        "opciones": [
          { "valor": "w1",     "texto": "La humedad del martes en Z1 solamente." },
          { "valor": "correct","texto": "La suma acumulada de humedad en Z1 entre el lunes y el martes." },
          { "valor": "w2",     "texto": "La diferencia de temperatura entre Z1 y Z2." },
          { "valor": "w3",     "texto": "El promedio de humedad de todas las zonas." }
        ],
        "correcto": "correct"
      }
    ],
    "calificacion": {
      "umbrales": [
        { "nivel": "Avanzado",   "max_errores": 0 },
        { "nivel": "Intermedio", "max_errores": 3 },
        { "nivel": "Inicial",    "max_errores": 99 }
      ]
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add astro-site/src/content/prog10/
git commit -m "feat(prog10): contenido JSON ficha-01-matrices"
```

---

## Task 3: Registrar colección en content.config.ts

**Files:**
- Modify: `astro-site/src/content.config.ts`

- [ ] **Step 1: Agregar colección `prog10-tareas`** — añadir después de `admSoporteTareasCollection`:

```typescript
const prog10TareasCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/prog10/tareas' }),
  schema: z.object({
    id: z.string(),
    titulo: z.string(),
    subtitulo: z.string().optional(),
    matrices_contexto: z.record(z.object({
      label: z.string(),
      color: z.string(),
      rows: z.array(z.string()),
      cols: z.array(z.string()),
      data: z.array(z.array(z.number())),
    })).optional(),
    etapas: z.array(z.object({
      id: z.string(),
      titulo: z.string(),
      subtitulo: z.string().optional(),
      icono: z.string().optional(),
      tag: z.string().optional(),
      tag_color: z.string().optional(),
      contexto: z.string().optional(),
      mostrar_matrices: z.boolean().optional(),
      intro: z.string().optional(),
      pasos: z.array(z.object({
        id: z.string(),
        tipo: z.enum(['select', 'matrix-input']),
        num: z.string(),
        titulo: z.string(),
        descripcion: z.string(),
        placeholder: z.string().optional(),
        opciones: z.array(z.object({
          valor: z.string(),
          texto: z.string(),
        })).optional(),
        correcto: z.string().optional(),
        rows: z.array(z.string()).optional(),
        cols: z.array(z.string()).optional(),
        placeholders: z.array(z.array(z.string())).optional(),
        solucion: z.array(z.array(z.number())).optional(),
        hint: z.string().optional(),
      })),
    })),
    evaluacion: z.object({
      titulo: z.string(),
      subtitulo: z.string().optional(),
      preguntas: z.array(z.object({
        id: z.string(),
        texto: z.string(),
        opciones: z.array(z.object({
          valor: z.string(),
          texto: z.string(),
        })),
        correcto: z.string(),
      })),
      calificacion: z.object({
        umbrales: z.array(z.object({
          nivel: z.string(),
          max_errores: z.number(),
        })),
      }),
    }),
  }),
});
```

- [ ] **Step 2: Registrar en `export const collections`**

```typescript
export const collections = {
  'ccna1-tareas':       ejerciciosCollection,
  'adm-soporte-tareas': admSoporteTareasCollection,
  'prog10-tareas':      prog10TareasCollection,   // ← nuevo
};
```

- [ ] **Step 3: Build para verificar que el schema acepta el JSON**

```bash
cd /mnt/c/Dev/sites-didacticos/astro-site && npm run build 2>&1 | tail -20
```

Expected: build sin errores de validación de schema.

- [ ] **Step 4: Commit**

```bash
git add astro-site/src/content.config.ts
git commit -m "feat(prog10): schema Zod para coleccion prog10-tareas"
```

---

## Task 4: Actualizar StudentGate para restaurar estado de ficha

**Files:**
- Modify: `astro-site/src/components/ui/StudentGate.svelte`

El objetivo es dos cambios mínimos en `restoreFromSheet`:

1. Que `hasAnswers` también considere `ficha_${entregaId}` — evita restauración redundante.
2. Que al parsear `extras`, si existe `fichaState`, lo escriba en localStorage bajo esa key.

- [ ] **Step 1: Ampliar la guarda `hasAnswers`**

Localizar el bloque:
```javascript
const hasAnswers =
  ['fillInBlank', 'matching', 'ordering', 'multipleChoice'].some(
    sec => localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`) !== null
  ) || localStorage.getItem(`caso_diag_${entregaId}`) !== null;
```

Reemplazar con:
```javascript
const hasAnswers =
  ['fillInBlank', 'matching', 'ordering', 'multipleChoice'].some(
    sec => localStorage.getItem(`respuestas_v1_${entregaId}_${sec}`) !== null
  ) ||
  localStorage.getItem(`caso_diag_${entregaId}`) !== null ||
  localStorage.getItem(`ficha_${entregaId}`) !== null;
```

- [ ] **Step 2: Agregar rama de restauración para `fichaState`**

Dentro del bloque `if (row.extras) { try { ... } }`, después de la rama `extras.casosAsignados`:

```javascript
// FichaInteractiva: { fichaState: { pasosCompletados, respuestasSelect, ... } }
if (extras.fichaState) {
  localStorage.setItem(`ficha_${entregaId}`, JSON.stringify(extras.fichaState));
  hayRespuestas = true;
}
```

- [ ] **Step 3: Commit**

```bash
git add astro-site/src/components/ui/StudentGate.svelte
git commit -m "feat(prog10): StudentGate restaura fichaState desde Sheets"
```

---

## Task 5: Crear FichaInteractiva.svelte

**Files:**
- Create: `astro-site/src/components/ejercicios/FichaInteractiva.svelte`

Este es el componente principal. Reutiliza el patrón de `CasoDiagnostico`:
- Lee `studentStore` (nanostore)
- Guarda/restaura en `localStorage` con key `ficha_${entregaId}`
- Envía al Apps Script al completar evaluación
- Botón PDF via `window.print()`

- [ ] **Step 1: Crear el archivo completo**

```svelte
<script>
  import { onDestroy, onMount } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let {
    etapas          = [],
    evaluacion      = {},
    matrices_contexto = {},
    entregaId       = '',
    scriptUrl       = '',
    exportarPdf     = false,
    tituloTarea     = '',
    cursoNombre     = '',
    docenteNombre   = '',
  } = $props();

  const STORAGE_KEY = `ficha_${entregaId}`;

  // ── Estado ────────────────────────────────────────────────────
  let pasosCompletados  = $state({});   // { p1: true, p2: true, ... }
  let respuestasSelect  = $state({});   // { p1: 'c', opC: 'c', ... }
  let respuestasMatrix  = $state({});   // { opA: [[48,127],...], ... }
  let quizRespuestas    = $state({});   // { q1: 'correct', ... }
  let errores           = $state(0);
  let completada        = $state(false);
  let submitStatus      = $state('');   // '' | 'pending' | 'ok' | 'err'
  let calificacion      = $state('');
  let hintVisible       = $state({});      // { p1: true, ... }
  let quizIncorrectas   = $state([]);      // IDs de preguntas con respuesta incorrecta en el último intento
  let student           = $state({ nombre: '', cedula: '', grupo: '', fecha: '' });

  // ── Suscripción al studentStore ───────────────────────────────
  const unsub = studentStore.subscribe(v => { student = v; });
  onDestroy(unsub);

  // ── Derivados ────────────────────────────────────────────────
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

  // ── Verificación tipo select ──────────────────────────────────
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

  // ── Verificación tipo matrix-input ────────────────────────────
  function checkMatrix(pasoId, solucion) {
    const vals = respuestasMatrix[pasoId] ?? [];
    let ok = true;
    for (let i = 0; i < solucion.length; i++) {
      for (let j = 0; j < solucion[i].length; j++) {
        if ((vals[i]?.[j] ?? '') === '' || parseInt(vals[i][j]) !== solucion[i][j]) {
          ok = false;
        }
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

  function setMatrixVal(pasoId, rows, cols, i, j, val) {
    const current = respuestasMatrix[pasoId] ?? Array.from({ length: rows }, () => Array(cols).fill(''));
    const next = current.map(r => [...r]);
    next[i][j] = val;
    respuestasMatrix = { ...respuestasMatrix, [pasoId]: next };
  }

  // ── Evaluación final ──────────────────────────────────────────
  function evalQuiz() {
    const preguntas = evaluacion.preguntas ?? [];
    const sinResponder = preguntas.filter(q => !quizRespuestas[q.id]);
    if (sinResponder.length) return; // botón deshabilitado si no están todas

    const incorrectas = preguntas.filter(q => quizRespuestas[q.id] !== q.correcto);
    if (incorrectas.length) {
      // Penalizar y marcar visualmente — el estudiante puede corregir y reintentar
      errores += incorrectas.length;
      quizIncorrectas = incorrectas.map(q => q.id);
      saveState();
      return; // no completa: el estudiante debe corregir y volver a enviar
    }

    // Todas correctas
    quizIncorrectas = [];
    const nivel = calcNivel(errores);
    calificacion  = nivel;
    completada    = true;
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

  // ── Envío al Apps Script ──────────────────────────────────────
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

  // ── onMount: restaurar estado ─────────────────────────────────
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
    // Suscribir studentStore (puede llegar después del mount)
    const s = studentStore.get();
    if (s?.nombre) student = s;
  });
</script>

<!-- ── Barra de progreso de la ficha ─────────────────────────── -->
<div class="ficha-progress">
  <div class="fp-label">
    <span>Progreso etapas</span>
    <span class="fp-pct">{progreso} %</span>
  </div>
  <div class="fp-bar"><div class="fp-fill" style="width:{progreso}%"></div></div>
</div>

<!-- ── Etapas ────────────────────────────────────────────────── -->
{#each etapas as etapa, ei}
  {@const desbloqueada = etapaDesbloqueada(ei)}
  <div class="ficha-card" class:locked={!desbloqueada}>

    {#if !desbloqueada}
      <div class="lock-overlay">
        <span class="lock-ico">🔐</span>
        <span class="lock-txt">Completá la etapa anterior para continuar</span>
      </div>
    {/if}

    <!-- Cabecera de etapa -->
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

      <!-- Caja de contexto -->
      {#if etapa.contexto}
        <div class="ctx-box">
          <span class="ctx-ico">📡</span>
          <p>{etapa.contexto}</p>
        </div>
      {/if}

      <!-- Matrices de referencia (solo etapa1) -->
      {#if etapa.mostrar_matrices}
        {#if etapa.intro}
          <p class="intro-text">{etapa.intro}</p>
        {/if}
        <div class="matrices-row">
          {#each Object.entries(matrices_contexto) as [key, mat]}
            <div class="mat-wrap">
              <div class="mat-label mat-{mat.color}">{mat.label}</div>
              <table class="mat-tbl">
                <tr class="hdr">
                  <td></td>
                  {#each mat.cols as col}<td>{col}</td>{/each}
                </tr>
                {#each mat.data as row, ri}
                  <tr class="rh">
                    <td>{mat.rows[ri]}</td>
                    {#each row as cell}<td>{cell}</td>{/each}
                  </tr>
                {/each}
              </table>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Pasos de la etapa -->
      <div class="step-list">
        {#each etapa.pasos as paso, pi}
          {@const unlocked = pasoDesbloqueado(ei, pi)}
          {@const done = !!pasosCompletados[paso.id]}
          <div class="step-item" class:step-done={done} class:step-locked={!unlocked}>

            <div class="step-num" class:num-done={done}>{done ? '✓' : paso.num}</div>

            <div class="step-content">
              <div class="step-title">{paso.titulo}</div>
              <p class="step-desc">{paso.descripcion}</p>

              <!-- SELECT -->
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

              <!-- MATRIX-INPUT -->
              {:else if paso.tipo === 'matrix-input'}
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
                          class:inp-bad={hintVisible[paso.id] && !done && val !== '' && parseInt(val) !== sol}
                          disabled={done || !unlocked}
                          placeholder={paso.placeholders?.[ri]?.[ci] ?? ''}
                          value={val}
                          oninput={(e) => setMatrixVal(paso.id, paso.rows.length, paso.cols.length, ri, ci, e.target.value)}
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
                  <span class="res-ico" style="margin-top:.4rem;display:block">✅</span>
                {/if}
              {/if}

              <!-- HINT -->
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

<!-- ── Evaluación final ───────────────────────────────────────── -->
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

<!-- ── Reporte final ──────────────────────────────────────────── -->
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

    <!-- Estado de envío -->
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
  /* ── Layout cards ─────────────────────────── */
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

  /* ── Progreso ────────────────────────────── */
  .ficha-progress {
    margin-bottom: 1.2rem;
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: .7rem 1rem;
  }
  .fp-label { display: flex; justify-content: space-between; font-size: .75rem; color: var(--text-muted); margin-bottom: .4rem; }
  .fp-pct   { color: var(--accent); font-weight: 700; }
  .fp-bar   { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .fp-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), #22c55e); border-radius: 3px; transition: width .5s ease; }

  /* ── Contexto ────────────────────────────── */
  .ctx-box {
    display: flex; gap: .8rem; align-items: flex-start;
    background: rgba(79,142,247,.07);
    border: 1px solid rgba(79,142,247,.22);
    border-radius: 10px; padding: 1rem 1.1rem; margin-bottom: 1.2rem;
  }
  .ctx-ico { font-size: 1.5rem; flex-shrink: 0; }
  .ctx-box p { font-size: .85rem; line-height: 1.7; color: var(--text-muted); }

  .intro-text { font-size: .84rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem; }

  /* ── Matrices de referencia ──────────────── */
  .matrices-row { display: flex; flex-wrap: wrap; gap: 1.2rem; margin-bottom: 1.4rem; }
  .mat-wrap { background: var(--surface2, #161b22); border: 1px solid var(--border); border-radius: 9px; padding: .9rem 1.1rem; }
  .mat-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; margin-bottom: .4rem; }
  .mat-accent { color: var(--accent); }
  .mat-purple { color: #c4b5fd; }
  .mat-tbl { border-collapse: separate; border-spacing: 3px; font-family: var(--font-mono); font-size: .82rem; }
  .mat-tbl .hdr td { background: rgba(79,142,247,.15); color: var(--accent); font-size: .7rem; padding: .25rem .6rem; border-radius: 4px; text-align: center; }
  .mat-tbl .rh td  { background: var(--surface, #0d1117); padding: .32rem .6rem; border-radius: 4px; text-align: center; min-width: 36px; }
  .mat-tbl .rh td:first-child { background: rgba(124,58,237,.18); color: #c4b5fd; font-weight: 700; }

  /* ── Steps ──────────────────────────────── */
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

  /* ── Controls ───────────────────────────── */
  .ctrl-row { display: flex; align-items: center; flex-wrap: wrap; gap: .6rem; }
  .ans-sel {
    background: var(--surface2, #161b22);
    border: 2px solid var(--border);
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

  /* ── Matrix input ───────────────────────── */
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

  /* ── Hint ───────────────────────────────── */
  .hint-box {
    background: rgba(124,58,237,.1); border: 1px solid rgba(124,58,237,.28);
    border-radius: 7px; padding: .6rem .85rem;
    font-size: .79rem; color: #c4b5fd; line-height: 1.6; margin-top: .5rem;
  }

  /* ── Quiz ───────────────────────────────── */
  .quiz-q { background: var(--surface2, #161b22); border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: .9rem; }
  .q-txt  { font-size: .88rem; font-weight: 600; line-height: 1.55; margin-bottom: .8rem; }
  .q-opt  {
    display: flex; align-items: flex-start; gap: .65rem;
    padding: .6rem .85rem; border-radius: 7px; border: 1px solid var(--border);
    margin-bottom: .4rem; cursor: pointer; transition: all .15s; font-size: .84rem; line-height: 1.5;
  }
  .q-opt:hover:not(.q-opt-disabled) { border-color: var(--accent); background: rgba(79,142,247,.06); }
  .q-sel   { border-color: var(--accent) !important; background: rgba(79,142,247,.1) !important; }
  .q-wrong { border-color: var(--color-error, #ef4444) !important; background: rgba(239,68,68,.09) !important; }
  .q-opt-disabled { cursor: default; }
  .q-wrong-hint { font-size: .78rem; color: var(--color-error, #ef4444); margin-bottom: .4rem; font-family: var(--font-mono); }
  .q-opt input[type="radio"] { accent-color: var(--accent); flex-shrink: 0; margin-top: .15rem; }

  .btn-eval {
    width: 100%; background: linear-gradient(135deg, #f59e0b, #f97316);
    color: #fff; border: none; border-radius: 9px; padding: .82rem;
    font-size: .95rem; font-weight: 700; cursor: pointer;
    margin-top: .7rem; transition: opacity .15s;
  }
  .btn-eval:disabled { opacity: .45; cursor: not-allowed; }
  .btn-eval:not(:disabled):hover { opacity: .9; }

  /* ── Reporte ─────────────────────────────── */
  .report-card {
    background: linear-gradient(135deg, #0f172a, #1e1b4b);
    border: 1px solid #3730a3; border-radius: 14px;
    padding: 2rem 1.5rem; text-align: center;
    margin-top: 1.2rem;
  }
  .rep-emoji { font-size: 2.6rem; margin-bottom: .4rem; }
  .rep-title { font-size: 1.6rem; font-weight: 800; margin-bottom: .25rem; }
  .rep-sub   { color: var(--text-muted); font-size: .82rem; margin-bottom: 1.6rem; }
  .rep-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: .8rem; max-width: 400px; margin: 0 auto 1.4rem;
  }
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

  /* ── Print ──────────────────────────────── */
  @media print {
    .lock-overlay, .btn-check, .btn-eval, .btn-pdf, .btn-resend,
    .ficha-progress, .submit-ind { display: none !important; }
    .step-item.step-locked { opacity: 1; }
    .ficha-card { border: 1px solid #cbd5e1; background: #fff; }
    .card-header { background: #f8fafc; }
    .mat-tbl td, .quiz-q { background: #f8fafc; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add astro-site/src/components/ejercicios/FichaInteractiva.svelte
git commit -m "feat(prog10): componente FichaInteractiva.svelte"
```

---

## Task 6: Integrar en [slug].astro

**Files:**
- Modify: `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`

- [ ] **Step 1: Agregar import** — después de la línea `import CasoDiagnostico ...`:

```typescript
import FichaInteractiva from '../../../../components/ejercicios/FichaInteractiva.svelte';
```

- [ ] **Step 2: Agregar colección en `getStaticPaths`** — al inicio de `getStaticPaths`:

```typescript
const tareas      = await getCollection('ccna1-tareas');
const tareasAdm   = await getCollection('adm-soporte-tareas');
const tareasProg10 = await getCollection('prog10-tareas');  // ← nuevo
```

- [ ] **Step 3: Agregar branch de lookup** — en la función `getStaticPaths`, dentro del bloque `if/else if`:

```typescript
if (entrega.tipo_ejercicio === 'caso-diagnostico') {
  ejercicio = tareasAdm.find(t => t.id.includes(entrega.id)) ?? null;
} else if (entrega.tipo_ejercicio === 'ficha-interactiva') {  // ← nuevo
  ejercicio = tareasProg10.find(t => t.id.includes(entrega.id)) ?? null;
} else if (entrega.tipo_ejercicio !== 'vlsm') {
  ejercicio = tareas.find(t => t.id.includes(entrega.id)) ?? null;
}
```

- [ ] **Step 4: Agregar flag en template section** — después de `const esCasoDiag = ...`:

```typescript
const esFichaInteractiva = tipoEj === 'ficha-interactiva';
```

- [ ] **Step 4b: Proteger `ResultPanel` contra `ficha-interactiva`** — localizar la línea:

```astro
{!esVlsm && !esCasoDiag && (
  <ResultPanel ... />
)}
```

Actualizar a:

```astro
{!esVlsm && !esCasoDiag && !esFichaInteractiva && (
  <ResultPanel ... />
)}
```

> **Por qué:** `ResultPanel` escucha el `sectionScores` store para tabular puntaje. Las fichas no usan ese store — renderizarlo en páginas `ficha-interactiva` causaría un panel vacío con puntaje 0.

- [ ] **Step 5: Agregar bloque de renderizado** — en el template, después del bloque `{esCasoDiag && ...}`:

```astro
{/* ── Ficha Interactiva (prog10, futuras materias) ── */}
{esFichaInteractiva && ej && (
  <FichaInteractiva
    client:visible
    etapas={ej.etapas}
    evaluacion={ej.evaluacion}
    matrices_contexto={ej.matrices_contexto ?? {}}
    entregaId={entrega.id}
    scriptUrl={(entrega as any).google_script_url ?? ''}
    exportarPdf={(entrega as any).parametros.exportar_pdf}
    tituloTarea={entrega.titulo}
    cursoNombre={cursoNombre}
    docenteNombre={docenteNombre}
  />
)}
```

- [ ] **Step 6: Commit**

```bash
git add astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro
git commit -m "feat(prog10): integrar FichaInteractiva en slug.astro"
```

---

## Task 7: Build final y verificación

- [ ] **Step 1: Build completo**

```bash
cd /mnt/c/Dev/sites-didacticos/astro-site && npm run build 2>&1 | tail -30
```

Expected: `✓ Built in ...` sin errores. La ruta `/sites-didacticos/prog10/unidad1/ficha/u1-ra4-ficha-01-matrices` debe aparecer en la lista de páginas generadas.

- [ ] **Step 2: Preview local**

```bash
npm run preview &
```

Navegar a: `http://localhost:4321/sites-didacticos/prog10/unidad1/ficha/u1-ra4-ficha-01-matrices`

Verificar:
- [ ] StudentGate aparece al cargar (modal de identificación)
- [ ] Etapa 1 visible, Etapa 2 bloqueada con overlay
- [ ] Paso 1 select funciona: respuesta incorrecta → hint visible + ❌; correcta → ✅ + Paso 2 visible
- [ ] Pasos de Etapa 1 completos → Etapa 2 se desbloquea
- [ ] Grillas numéricas: celdas incorrectas → borde rojo; todas correctas → ✅ + paso siguiente
- [ ] Evaluación bloqueada hasta completar ambas etapas
- [ ] Evaluación: sin responder todas → botón deshabilitado; incorrectas → errores se acumulan; todas correctas → reporte aparece
- [ ] Reporte muestra nivel correcto (Avanzado/Intermedio/Inicial) según errores
- [ ] Estado persiste al recargar (localStorage)
- [ ] PDF: `window.print()` oculta botones y controles

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat(prog10): ficha-interactiva completa — U1-RA4 Matrices migrada a Astro"
```
