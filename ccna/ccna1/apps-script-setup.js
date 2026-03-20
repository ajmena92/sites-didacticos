/**
 * Apps Script — Sites Didácticos (CTP Platanares)
 * Recibe entregas de todas las materias y sirve datos al Dashboard Docente.
 *
 * INSTRUCCIONES DE DEPLOY:
 * 1. script.google.com → proyecto vinculado al Sheet
 * 2. Reemplazar TODO el contenido con este código
 * 3. Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar
 *    (NO crear nueva implementación; se perdería la URL)
 *
 * ENRUTAMIENTO DE HOJAS:
 *   doPost enruta por `grupo` → hoja con ese nombre (se crea si no existe).
 *   Ejemplos: "11-2", "adm-11-1", "2026C1-G08"
 *
 * ESQUEMA DE COLUMNAS (v1.2, 9 columnas):
 *   [0] timestamp | [1] nombre | [2] cedula | [3] grupo | [4] fecha
 *   [5] tipo/entregaId | [6] calificacion | [7] errores | [8] extras (JSON)
 *
 * ENDPOINTS doGet (requieren ?key=TEACHER_KEY):
 *   ?sheet=NOMBRE        → filas de esa hoja
 *   ?tipo=ENTREGA_ID     → busca en TODAS las hojas y filtra por tipo (cross-sheet)
 *   ?action=sheets       → lista nombres de todas las hojas del spreadsheet
 *
 * NOTA: .setHeaders() no existe en ContentService.TextOutput; CORS es automático
 *   en web apps desplegadas como públicas.
 */

const SHEET_NAME  = '2026_entregas';        // hoja fallback si grupo viene vacío
const TEACHER_KEY = 'T34ch3r-M3n4-2026!';  // ← cambiar por una clave real

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Normalizar campos — soporta formato legado y nuevo (Astro)
    const nombre = data.nombre || data.student?.nombre || '';
    const cedula = data.cedula || data.student?.cedula || '';
    const grupo = data.grupo || data.student?.grupo || '';
    const fecha = data.fecha || data.student?.fecha || new Date().toLocaleDateString('es-CR');
    const tipo = data.tipo || data.entregaId || '';
    // calificacion: puede venir a nivel raíz o dentro de scores
    const calificacion = data.calificacion ?? data.scores?.calificacion ?? '';
    const errores = data.errores ?? data.scores?.erroresAcumulados ?? '';

    if (!nombre) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Campo requerido faltante: nombre' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Enrutar a hoja del grupo (o fallback a SHEET_NAME)
    const sheetName = grupo ? String(grupo).trim() : SHEET_NAME;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    // Extras: usa data.extras si viene pre-serializado (tarea libre),
    // si no construye desde scores + answers (evaluaciones autocorregibles)
    const extras = data.extras
      ? data.extras
      : JSON.stringify({ scores: data.scores, answers: data.answers });

    sheet.appendRow([
      new Date(),
      nombre,
      cedula,
      grupo,
      fecha,
      tipo,
      calificacion,
      errores,
      extras,
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter.key !== TEACHER_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── ?action=sheets → lista todas las hojas disponibles ──────────────────
  if (e.parameter.action === 'sheets') {
    const names = ss.getSheets().map(s => s.getName());
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sheets: names }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── ?tipo=ENTREGA_ID → busca en TODAS las hojas y filtra por tipo ────────
  if (e.parameter.tipo) {
    const tipoFiltro = e.parameter.tipo;
    const allRows = [];
    ss.getSheets().forEach(function(sheet) {
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return;
      const [, ...data] = values;
      data.forEach(function(r) {
        const row = parseRow(r);
        if (row.tipo === tipoFiltro) allRows.push(row);
      });
    });
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, version: '1.2', tipo: tipoFiltro, rows: allRows }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── ?sheet=NOMBRE → hoja específica (o fallback) ─────────────────────────
  const requestedSheet = e.parameter.sheet || SHEET_NAME;
  const sheet = ss.getSheetByName(requestedSheet);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, version: '1.2', rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const allValues = sheet.getDataRange().getValues();
  if (allValues.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, version: '1.2', rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const [, ...rows] = allValues;
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, version: '1.2', rows: rows.map(parseRow) }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Normaliza una fila del sheet al schema v1.2 ──────────────────────────────
function parseRow(r) {
  // v1.2: [ts, nombre, cedula, grupo, fecha, tipo, calificacion, errores, extras]
  if (r.length >= 9) {
    return {
      timestamp:   r[0],
      nombre:      r[1],
      cedula:      r[2],
      grupo:       r[3],
      fecha:       r[4],
      tipo:        r[5],
      calificacion:r[6],
      errores:     r[7],
      extras:      r[8],
    };
  }
  // v1.1: [ts, nombre, grupo, fecha, tipo, completados, errores, calificacion]
  if (r.length >= 8) {
    return {
      timestamp: r[0], nombre: r[1], cedula: '',
      grupo: r[2], fecha: r[3], tipo: r[4],
      calificacion: r[7], errores: r[6], extras: '',
    };
  }
  // v1.0 legado: [ts, nombre, fecha, tipo, completados, errores, calificacion]
  return {
    timestamp: r[0], nombre: r[1], cedula: '', grupo: '',
    fecha: r[2], tipo: r[3], calificacion: r[6], errores: r[5], extras: '',
  };
}
