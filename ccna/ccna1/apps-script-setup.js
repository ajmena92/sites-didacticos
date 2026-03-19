/**
 * Apps Script para recibir y servir datos del Dashboard Docente CCNA 1
 *
 * INSTRUCCIONES:
 * 1. Abrir script.google.com y seleccionar el proyecto vinculado al Google Sheet
 * 2. Reemplazar TODO el contenido del editor con este código
 * 3. Cambiar TEACHER_KEY por una clave segura de tu elección
 * 4. Cambiar SHEET_NAME si el nombre de tu hoja es diferente
 * 5. Menú: Implementar → Nueva implementación
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Acceso: Cualquier persona
 * 6. Copiar la URL del web app
 *
 * ESQUEMA DE COLUMNAS (v1.2, 9 columnas):
 *   [0] timestamp | [1] nombre | [2] cedula | [3] grupo | [4] fecha
 *   [5] tipo/entregaId | [6] calificacion | [7] errores | [8] extras (JSON)
 *
 * NOTA: .setHeaders() NO existe en ContentService.TextOutput — los headers CORS
 *   son añadidos automáticamente por Apps Script cuando se despliega como pública.
 */

const SHEET_NAME = '2026_tarea_VLSM';           // hoja por defecto (fallback)
const TEACHER_KEY = 'T34ch3r-M3n4-2026!';   // ← cambiar por una clave real

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

  // Leer hoja principal o la hoja especificada por ?sheet=NombreGrupo
  const requestedSheet = e.parameter.sheet || SHEET_NAME;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
  const result = rows.map(r => {
    // v1.2: [ts, nombre, cedula, grupo, fecha, tipo, calificacion, errores, extras]
    if (r.length >= 9) {
      return {
        timestamp: r[0],
        nombre: r[1],
        cedula: r[2],
        grupo: r[3],
        fecha: r[4],
        tipo: r[5],
        calificacion: r[6],
        errores: r[7],
        extras: r[8],
      };
    }
    // v1.1: [ts, nombre, grupo, fecha, tipo, completados, errores, calificacion]
    if (r.length >= 8) {
      return {
        timestamp: r[0],
        nombre: r[1],
        cedula: '',
        grupo: r[2],
        fecha: r[3],
        tipo: r[4],
        calificacion: r[7],
        errores: r[6],
        extras: '',
      };
    }
    // v1.0 (legado sin grupo): [ts, nombre, fecha, tipo, completados, errores, calificacion]
    return {
      timestamp: r[0],
      nombre: r[1],
      cedula: '',
      grupo: '',
      fecha: r[2],
      tipo: r[3],
      calificacion: r[6],
      errores: r[5],
      extras: '',
    };
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, version: '1.2', rows: result }))
    .setMimeType(ContentService.MimeType.JSON);
}
