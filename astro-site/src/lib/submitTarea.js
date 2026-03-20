// astro-site/src/lib/submitTarea.js

/**
 * Sends tarea results to a Google Apps Script Web App endpoint.
 * Uses Content-Type: text/plain to avoid CORS preflight.
 * Throws on network error or if the script returns ok !== true.
 */
export async function submitTarea({ scriptUrl, entregaId, student, scores, totalScore, answers }) {
  const payload = {
    nombre:       student?.nombre ?? '',
    cedula:       student?.cedula ?? '',
    grupo:        student?.grupo  ?? '',
    fecha:        student?.fecha  ?? new Date().toLocaleDateString('es-CR'),
    tipo:         entregaId,
    calificacion: totalScore ?? 0,
    errores:      0,
    extras:       JSON.stringify({ scores, answers }),
  };

  const res = await fetch(scriptUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => '');
  let json = null;
  try { json = JSON.parse(rawText); } catch { /* no es JSON */ }

  if (!json || json.ok !== true) {
    const detalle = json?.error
      ?? (rawText.length < 200 ? rawText : `HTTP ${res.status}`)
      ?? `HTTP ${res.status}`;
    throw new Error(detalle);
  }
}
