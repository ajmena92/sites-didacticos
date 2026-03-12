// ── ccna1-submit.js ──────────────────────────────────────────────────────────
// Configuración compartida del formulario Google y funciones de envío
// Usado por: subnetting-vlsm.html  y  subnetting-practica-final.html
// ─────────────────────────────────────────────────────────────────────────────

const FORM_CONFIG = {
  scriptUrl:   'https://script.google.com/macros/s/AKfycbzzdEibQEN9nRjZKBU7CBR5fk1UbE4bdqWzFcXxZanX1DtfzBlw09dIyTljbiWRJ9hfKw/exec',
  id: '1FAIpQLSexKLoZIJHyCZHHxKz7mMvzIW4dSO2R2TamV1_-ksNpqAn0GQ',
  nombre:      'entry.335584076',
  fecha:       'entry.433021297',
  tipo:        'entry.478783910',
  completados: 'entry.85754048',
  errores:     'entry.1963425968',
  calificacion:'entry.85846131',
};

function buildFormUrl(data) {
  const base = `https://docs.google.com/forms/d/e/${FORM_CONFIG.id}/viewform?`;
  const p = (key, val) => `${FORM_CONFIG[key]}=${encodeURIComponent(val)}`;
  return base + [
    p('nombre',      data.nombre),
    p('fecha',       data.fecha),
    p('tipo',        data.tipo),
    p('completados', data.completados),
    p('errores',     data.errores),
    p('calificacion',data.calificacion),
  ].join('&') + '&usp=pp_url';
}

async function autoSubmit(data) {
  const indicator = document.getElementById('submitIndicator');
  if (indicator) { indicator.textContent = '⏳ Registrando…'; indicator.className = 'submit-ind pending'; }

  if (FORM_CONFIG.scriptUrl === 'PASTE_SCRIPT_URL_HERE') {
    if (indicator) { indicator.textContent = '⚠ Script no configurado — usa el botón de reenvío'; indicator.className = 'submit-ind err'; }
    const fb = document.getElementById('btnFallback');
    if (fb) fb.style.display = 'block';
    return;
  }

  // Apps Script no soporta preflight CORS (OPTIONS). Usar Content-Type: text/plain
  // evita el preflight (simple request) y permite leer la respuesta real del servidor.
  // Apps Script parsea e.postData.contents con JSON.parse() sin importar el Content-Type.
  try {
    const res  = await fetch(FORM_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({ ok: res.ok }));
    if (res.ok && json.ok !== false) {
      if (indicator) { indicator.textContent = '✓ Registrado automáticamente'; indicator.className = 'submit-ind ok'; }
    } else {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
  } catch(err) {
    if (indicator) { indicator.textContent = `⚠ No se pudo registrar (${err.message})`; indicator.className = 'submit-ind err'; }
    const fb = document.getElementById('btnFallback');
    if (fb) fb.style.display = 'block';
  }
}
