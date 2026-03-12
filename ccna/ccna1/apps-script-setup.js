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
 * 7. Pegar esa URL en las dos líneas que dicen PASTE_SCRIPT_URL_HERE
 *    en subnetting-practica-final.html, subnetting-vlsm.html y dashboard.html
 *
 * ESQUEMA DE COLUMNAS:
 *
 *   Formato nuevo (v1.1, 8 columnas) — filas escritas por doPost:
 *     [0] timestamp | [1] nombre | [2] grupo | [3] fecha | [4] tipo | [5] completados | [6] errores | [7] calificacion
 *
 *   Formato legado (v1.0, 7 columnas) — filas antiguas sin campo grupo:
 *     [0] timestamp | [1] nombre | [2] fecha | [3] tipo | [4] completados | [5] errores | [6] calificacion
 *
 *   doGet detecta el largo de cada fila y mapea en consecuencia; grupo queda '' para filas legadas.
 *   Si data.grupo está presente en doPost, se enruta a la hoja con ese nombre; si no, a SHEET_NAME.
 */

const SHEET_NAME   = 'Respuestas';           // nombre de la hoja destino
const TEACHER_KEY  = 'clave-secreta-aqui';   // ← cambiar por una clave real

function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  try {
    const data = JSON.parse(e.postData.contents);

    // #5 — Validación de campos requeridos
    const required = ['nombre', 'tipo', 'calificacion'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: `Campo requerido faltante: ${field}` }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders(headers);
      }
    }

    // #13 — Soporte para grupos: enrutar a hoja por nombre de grupo
    const sheetName = (data.grupo && String(data.grupo).trim())
      ? String(data.grupo).trim()
      : SHEET_NAME;
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    sheet.appendRow([
      new Date(),
      data.nombre       || '',
      data.grupo        || '',   // columna grupo (nueva)
      data.fecha        || '',
      data.tipo         || '',
      data.completados  || '',
      data.errores      ?? '',
      data.calificacion ?? '',
    ]);

    // #14 — Alerta por email para evaluaciones finales
    if (String(data.tipo || '').startsWith('Evaluación') || String(data.tipo || '').startsWith('Evaluacion')) {
      try {
        const owner = Session.getActiveUser().getEmail();
        if (owner) {
          MailApp.sendEmail({
            to: owner,
            subject: `[CCNA1] Nueva evaluación: ${data.nombre}`,
            body: `Estudiante: ${data.nombre}\nTipo: ${data.tipo}\nCalificación: ${data.calificacion}\nFecha: ${data.fecha}\nGrupo: ${data.grupo || 'General'}`
          });
        }
      } catch(mailErr) { /* silenciar errores de email */ }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

function doGet(e) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (e.parameter.key !== TEACHER_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    // #17 — version en respuesta vacía
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, version: '1.1', rows: [] }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
  const [, ...rows] = sheet.getDataRange().getValues();
  const result = rows.map(r => {
    if (r.length >= 8) {
      // New format (with grupo): [ts, nombre, grupo, fecha, tipo, completados, errores, calif]
      return {
        timestamp:    r[0],
        nombre:       r[1],
        grupo:        r[2],
        fecha:        r[3],
        tipo:         r[4],
        completados:  r[5],
        errores:      r[6],
        calificacion: r[7],
      };
    } else {
      // Legacy format (without grupo): [ts, nombre, fecha, tipo, completados, errores, calif]
      return {
        timestamp:    r[0],
        nombre:       r[1],
        grupo:        '',
        fecha:        r[2],
        tipo:         r[3],
        completados:  r[4],
        errores:      r[5],
        calificacion: r[6],
      };
    }
  });
  // #17 — version en respuesta con datos
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, version: '1.1', rows: result }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
