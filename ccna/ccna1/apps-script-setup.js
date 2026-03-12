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
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      data.nombre       || '',
      data.fecha        || '',
      data.tipo         || '',
      data.completados  || '',
      data.errores      ?? '',
      data.calificacion ?? '',
    ]);
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
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, rows: [] }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
  const [, ...rows] = sheet.getDataRange().getValues();
  const result = rows.map(r => ({
    timestamp:    r[0],
    nombre:       r[1],
    fecha:        r[2],
    tipo:         r[3],
    completados:  r[4],
    errores:      r[5],
    calificacion: r[6],
  }));
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, rows: result }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
