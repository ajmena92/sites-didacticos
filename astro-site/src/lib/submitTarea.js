// astro-site/src/lib/submitTarea.js

/**
 * Sends tarea results to a Google Apps Script Web App endpoint.
 * The GAS script must be published as "Anyone can access" and listen for POST.
 * Response is always opaque (mode: no-cors) — success is inferred from no throw.
 */
export async function submitTarea({ scriptUrl, entregaId, student, scores, answers }) {
  await fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entregaId,
      timestamp: new Date().toISOString(),
      ...student,
      scores,
      answers,
    }),
  });
}
