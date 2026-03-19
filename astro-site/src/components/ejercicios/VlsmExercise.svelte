<script>
  import { onMount, onDestroy } from 'svelte';
  import { studentStore, updateSection, isLocked, markVerified } from '../../stores/score.js';
  import { submitTarea } from '../../lib/submitTarea.js';

  let { entregaId = '', puntos = 40, scriptUrl = '' } = $props();

  // ═══════════════════════════════════════════════════════
  //  NET UTILS (inlined from net-utils.js)
  // ═══════════════════════════════════════════════════════
  function str(o)            { return o.join('.'); }
  function wildcard(m)       { return m.map(x => 255 - x); }
  function netAddr(ip, m)    { return ip.map((b, i) => b & m[i]); }
  function broadcast(net,wc) { return net.map((b, i) => b + wc[i]); }

  function prefixToMask(p) {
    p = Math.max(0, Math.min(32, p | 0));
    return Array.from({length: 4}, (_, i) => {
      const b = Math.min(8, Math.max(0, p - i * 8));
      return b === 8 ? 255 : b === 0 ? 0 : 256 - Math.pow(2, 8 - b);
    });
  }

  function addOne(o) {
    const n = (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0) + 1;
    if (n > 0xFFFFFFFF) return [255,255,255,255];
    return [(n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255];
  }

  function subOne(o) {
    const n = (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0) - 1;
    if (n < 0) return [0,0,0,0];
    return [(n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255];
  }

  function normIP(s) {
    if (!s) return null;
    const parts = String(s).trim().replace(/\s+/g,'.').replace(/,/g,'.').split('.');
    if (parts.length !== 4) return null;
    const n = parts.map(p => parseInt(p, 10));
    if (n.some(x => isNaN(x) || x < 0 || x > 255)) return null;
    return n.join('.');
  }

  function normPfx(s) {
    const t = String(s ?? '').trim().replace(/^\//,'');
    const n = parseInt(t, 10);
    return (isNaN(n) || n < 0 || n > 32) ? null : n;
  }

  function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

  // ═══════════════════════════════════════════════════════
  //  LEVELS CONFIG
  // ═══════════════════════════════════════════════════════
  const LEVELS = {
    intermedio: {
      label: 'Intermedio', cls: 'intermedio',
      lanRanges: [[6,14],[14,30],[30,62],[62,126],[500,1022]],
      wan: 0,
      base() { return { ip:[172,ri(16,31),ri(0,15)*16,0], prefix:20 }; },
    },
    avanzado: {
      label: 'Avanzado', cls: 'avanzado',
      lanRanges: [[2000,4000],[500,1022],[200,500],[100,200],[30,62],[6,14]],
      wan: 4,
      base() { return { ip:[10,ri(1,200),0,0], prefix:16 }; },
    },
  };

  // ═══════════════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════════════
  let selectedLevel = $state('intermedio');
  let subnets       = $state([]);
  let hostsGiven    = $state([]);
  let baseNet       = $state('');
  let activeRow     = $state(-1);   // -1 = sin ejercicio activo
  let done          = $state(false);
  let totalErrors   = $state(0);
  let rowAttempts   = $state({});
  let rowFeedback   = $state({});
  let shakingRow    = $state(null);
  let showReview    = $state(false);
  let tablasDone    = $state(0);
  let errAcum       = $state(0);
  let historial     = $state([]);
  let submitStatus  = $state('idle');  // idle | sending | sent | error
  let answers       = $state([]);      // answers[i] = {h, net, px, mk, first, last, bc}

  let student = $state(studentStore.get());
  let locked  = $state(isLocked.get());
  const unsubStudent = studentStore.subscribe(v => { student = v; });
  const unsubLock    = isLocked.subscribe(v => { locked = v; });
  onDestroy(() => { unsubStudent(); unsubLock(); });

  // ── Pool de chips (estado derivado) ─────────────────────
  let poolState = $derived((() => {
    if (subnets.length === 0) return [];
    const consumed = {};
    subnets.slice(0, Math.max(0, activeRow)).forEach(s => {
      consumed[s.hosts] = (consumed[s.hosts] || 0) + 1;
    });
    const usedLeft = { ...consumed };
    const nextHosts = done ? null : subnets[activeRow]?.hosts;
    let nextMarked  = false;
    return hostsGiven.map((h, i) => {
      let state = 'available';
      if (usedLeft[h] > 0)                    { state = 'used'; usedLeft[h]--; }
      else if (!nextMarked && h === nextHosts) { state = 'next'; nextMarked = true; }
      return { h, i, state };
    });
  })());

  let calAcum = $derived(
    tablasDone > 0 ? Math.max(0, Math.round(100 - errAcum * 10 / tablasDone)) : null
  );
  let progPct = $derived(
    subnets.length > 0 ? Math.round(Math.max(0, activeRow) / subnets.length * 100) : 0
  );

  // ═══════════════════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════════════════
  onMount(() => {
    try {
      const sess = JSON.parse(sessionStorage.getItem(`vlsm_${entregaId}`) ?? 'null');
      if (sess) {
        tablasDone = sess.tablasDone ?? 0;
        errAcum    = sess.errAcum    ?? 0;
      }
      const hist = JSON.parse(localStorage.getItem(`vlsm_hist_${entregaId}`) ?? 'null');
      if (hist) historial = hist;
    } catch(e) {}

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });

  // Ctrl+Shift+Enter — rellenar todo automáticamente (debug/demo)
  function handleKeydown(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && subnets.length > 0 && !done) {
      e.preventDefault();
      autoFillAll();
    }
  }

  // ═══════════════════════════════════════════════════════
  //  GENERAR EJERCICIO
  // ═══════════════════════════════════════════════════════
  function generateExercise() {
    if (locked) return;
    const cfg = LEVELS[selectedLevel];
    const lanHosts = cfg.lanRanges.map(([lo,hi]) => ri(lo,hi));
    const wanHosts = Array(cfg.wan).fill(2);
    lanHosts.sort((a,b) => b-a);
    const allSorted = [...lanHosts, ...wanHosts];

    const base = cfg.base();
    let cur = [...base.ip];
    baseNet = str(base.ip) + '/' + base.prefix;

    subnets = allSorted.map((h, idx) => {
      const bits = Math.ceil(Math.log2(h + 2));
      const p    = 32 - bits;
      const m    = prefixToMask(p);
      const wc   = wildcard(m);
      const net  = netAddr(cur, m);
      const bc   = broadcast(net, wc);
      cur = addOne(bc);
      return {
        hosts: h, prefix: p, mask: [...m],
        net: [...net], first: addOne(net),
        last: subOne(bc), bc: [...bc],
        wan: idx >= lanHosts.length,
      };
    });

    hostsGiven  = [...allSorted].sort(() => Math.random() - .5);
    activeRow   = 0;
    done        = false;
    totalErrors = 0;
    rowAttempts = {};
    rowFeedback = {};
    shakingRow  = null;
    showReview  = false;
    answers     = subnets.map(() => ({ h:'', net:'', px:'', mk:'', first:'', last:'', bc:'' }));
  }

  // ═══════════════════════════════════════════════════════
  //  VERIFICAR FILA
  // ═══════════════════════════════════════════════════════
  function verify(i) {
    if (locked || i !== activeRow || done) return;
    const s = subnets[i];
    const a = answers[i];

    const inH   = parseInt(String(a.h  ?? '').trim(), 10);
    const inNet = normIP(a.net);
    const inPx  = normPfx(a.px);
    const inMk  = normIP(a.mk);
    const inF   = normIP(a.first);
    const inL   = normIP(a.last);
    const inBc  = normIP(a.bc);

    const usableH = Math.pow(2, 32 - s.prefix) - 2;
    const errors  = [];

    if (inH !== s.hosts)
      errors.push(`Hosts: debes asignar el mayor pendiente (${s.hosts})`);
    if (inNet !== str(s.net)) {
      const hint = i === 0
        ? `${str(s.net)} (red base del ejercicio)`
        : `${str(s.net)} (Broadcast anterior + 1)`;
      errors.push(`Dir. de Red: debe ser ${hint}`);
    }
    if (inPx !== s.prefix)
      errors.push(`Prefijo: para ${s.hosts} hosts el mínimo es /${s.prefix}  →  2^${32-s.prefix}−2 = ${usableH} hosts útiles`);
    if (inMk !== str(s.mask))
      errors.push(`Máscara: /${s.prefix} corresponde a ${str(s.mask)}`);
    if (inF !== str(s.first))
      errors.push(`Primer host: ${str(s.first)}  (Dir. de Red + 1)`);
    if (inL !== str(s.last))
      errors.push(`Último host: ${str(s.last)}  (Broadcast − 1)`);
    if (inBc !== str(s.bc))
      errors.push(`Broadcast: ${str(s.bc)}  (Dir. de Red + ${Math.pow(2, 32-s.prefix)} − 1)`);

    if (errors.length === 0) {
      // ── Fila correcta ──────────────────────────────────
      activeRow++;
      const { [i]: _removed, ...restFb } = rowFeedback;
      rowFeedback = restFb;

      if (activeRow >= subnets.length) {
        // ── Ejercicio completo ──────────────────────────
        done = true;
        tablasDone++;
        errAcum += totalErrors;

        const cal        = Math.max(0, Math.round(100 - errAcum * 10 / tablasDone));
        const finalScore = Math.round(cal / 100 * puntos);

        try {
          sessionStorage.setItem(`vlsm_${entregaId}`, JSON.stringify({
            tablasDone, errAcum,
          }));
        } catch(e) {}

        const entry = {
          label:   LEVELS[selectedLevel].label,
          errores: totalErrors,
          total:   subnets.length,
          fecha:   new Date().toLocaleDateString('es-CR'),
        };
        historial = [entry, ...historial].slice(0, 3);
        try { localStorage.setItem(`vlsm_hist_${entregaId}`, JSON.stringify(historial)); } catch(e) {}

        updateSection('fillInBlank', finalScore);
        markVerified('fillInBlank');

        if (tablasDone >= 2 && scriptUrl) {
          doSubmit(cal, entry);
        }
      }
    } else {
      // ── Fila incorrecta ─────────────────────────────────
      const attempt = (rowAttempts[i] ?? 0) + 1;
      rowAttempts   = { ...rowAttempts, [i]: attempt };
      totalErrors++;

      let fbMsg;
      if (attempt === 1) {
        fbMsg = `⚠ Verifica: ${errors.map(e => e.split(':')[0]).join(' · ')}`;
      } else if (attempt === 2) {
        fbMsg = errors.map(e => `⚠ ${e.split(' → ')[0]}`).join('\n');
      } else {
        fbMsg = errors.map(e => `⚠ ${e}`).join('\n');
      }
      rowFeedback = { ...rowFeedback, [i]: fbMsg };

      shakingRow = i;
      setTimeout(() => { shakingRow = null; }, 380);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  AUTO-FILL (debug: Ctrl+Shift+Enter)
  // ═══════════════════════════════════════════════════════
  function autoFillAll() {
    for (let i = activeRow; i < subnets.length; i++) {
      activeRow = i;
      const s = subnets[i];
      answers[i] = {
        h:     String(s.hosts),
        net:   str(s.net),
        px:    '/' + s.prefix,
        mk:    str(s.mask),
        first: str(s.first),
        last:  str(s.last),
        bc:    str(s.bc),
      };
      verify(i);
      if (done) break;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  ENVÍO AL PROFESOR
  // ═══════════════════════════════════════════════════════
  async function doSubmit(calificacion, entry) {
    if (submitStatus === 'sending' || submitStatus === 'sent') return;
    submitStatus = 'sending';
    try {
      await submitTarea({
        scriptUrl,
        entregaId,
        student: {
          nombre:  student.nombre,
          cedula:  student.cedula ?? '',
          grupo:   student.grupo,
          fecha:   entry.fecha,
        },
        scores:  { calificacion, tablasDone, erroresAcumulados: errAcum, nivel: entry.label },
        answers: historial,
      });
      submitStatus = 'sent';
    } catch(e) {
      submitStatus = 'error';
    }
  }

  async function resubmit() {
    const entry = historial[0] ?? { label: '', fecha: new Date().toLocaleDateString('es-CR') };
    await doSubmit(calAcum ?? 0, entry);
  }
</script>

<section class="vlsm-wrap card" id="sec-vlsm">
  <!-- ── Header ──────────────────────────────────────────── -->
  <header class="ej-header">
    <div class="ej-title-row">
      <h2 class="ej-title">Esquema VLSM — Subnetting Variable</h2>
      {#if student.nombre}
        <div class="student-badge">
          <span class="student-icon">👤</span>
          <span class="student-name">{student.nombre}</span>
          {#if student.cedula}<span class="student-cedula">· {student.cedula}</span>{/if}
        </div>
      {/if}
    </div>
    <div class="vlsm-controls">
      <select
        class="lvl-select"
        bind:value={selectedLevel}
        disabled={activeRow >= 0 && !done}
      >
        <option value="intermedio">Intermedio</option>
        <option value="avanzado">Avanzado</option>
      </select>
      <span class="level-badge {LEVELS[selectedLevel].cls}">
        {LEVELS[selectedLevel].label}
      </span>
      <button
        class="btn btn-primary"
        onclick={generateExercise}
        disabled={locked}
      >
        {activeRow < 0 ? '▶ Iniciar Ejercicio' : '↺ Nuevo Ejercicio'}
      </button>
    </div>
  </header>

  {#if activeRow >= 0}

    <!-- ── Info panel ─────────────────────────────────────── -->
    <div class="info-panel">
      <div class="base-row">
        <span class="info-label">Red Base</span>
        <span class="info-value">{baseNet}</span>
      </div>
      <div class="pool-row">
        <div class="pool-label">Pool de hosts (de mayor a menor)</div>
        <div class="pool-chips">
          {#each poolState as chip}
            <span
              class="chip"
              class:chip-used={chip.state === 'used'}
              class:chip-next={chip.state === 'next'}
            >{chip.h}</span>
          {/each}
        </div>
      </div>
    </div>

    <!-- ── Barra de progreso ──────────────────────────────── -->
    {#if !done}
      <div class="row-prog">
        <div class="rp-fill" style="width:{progPct}%"></div>
        <span class="rp-label">Fila {activeRow} de {subnets.length}</span>
      </div>
    {/if}

    <!-- ── Tabla ──────────────────────────────────────────── -->
    <div class="table-wrap">
      <table class="vlsm-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Hosts Req.</th>
            <th>Dir. de Red</th>
            <th>Prefijo</th>
            <th>Máscara</th>
            <th>Primer Host</th>
            <th>Último Host</th>
            <th>Broadcast</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each subnets as s, i}
            {@const isRowDone   = i < activeRow}
            {@const isRowActive = i === activeRow && !done}

            <tr
              class="vlsm-row"
              class:row-done={isRowDone}
              class:row-active={isRowActive}
              class:row-locked={!isRowDone && !isRowActive}
              class:row-wan={s.wan}
              class:shake={shakingRow === i}
            >
              <td class="rnum">
                {i+1}
                {#if s.wan}<span class="wan-label">WAN</span>{/if}
              </td>

              {#if isRowDone}
                <td><input class="ti ti-h  ok" value={s.hosts}       readonly /></td>
                <td><input class="ti ti-ip ok" value={str(s.net)}     readonly /></td>
                <td><input class="ti ti-px ok" value={'/' + s.prefix} readonly /></td>
                <td><input class="ti ti-mk ok" value={str(s.mask)}    readonly /></td>
                <td><input class="ti ti-ip ok" value={str(s.first)}   readonly /></td>
                <td><input class="ti ti-ip ok" value={str(s.last)}    readonly /></td>
                <td><input class="ti ti-ip ok" value={str(s.bc)}      readonly /></td>
                <td><span class="tag-ok">✓</span></td>

              {:else if isRowActive}
                <td><input class="ti ti-h"  bind:value={answers[i].h}     placeholder="n"       /></td>
                <td><input class="ti ti-ip" bind:value={answers[i].net}   placeholder="x.x.x.x" /></td>
                <td><input class="ti ti-px" bind:value={answers[i].px}    placeholder="/n"       /></td>
                <td><input class="ti ti-mk" bind:value={answers[i].mk}    placeholder="x.x.x.x" /></td>
                <td><input class="ti ti-ip" bind:value={answers[i].first} placeholder="x.x.x.x" /></td>
                <td><input class="ti ti-ip" bind:value={answers[i].last}  placeholder="x.x.x.x" /></td>
                <td>
                  <input
                    class="ti ti-ip"
                    bind:value={answers[i].bc}
                    placeholder="x.x.x.x"
                    onkeydown={e => { if (e.key === 'Enter') verify(i); }}
                  />
                </td>
                <td>
                  <button class="btn-verify" onclick={() => verify(i)}>Verificar</button>
                </td>

              {:else}
                <td><input class="ti ti-h"  placeholder="n"       disabled /></td>
                <td><input class="ti ti-ip" placeholder="x.x.x.x" disabled /></td>
                <td><input class="ti ti-px" placeholder="/n"       disabled /></td>
                <td><input class="ti ti-mk" placeholder="x.x.x.x" disabled /></td>
                <td><input class="ti ti-ip" placeholder="x.x.x.x" disabled /></td>
                <td><input class="ti ti-ip" placeholder="x.x.x.x" disabled /></td>
                <td><input class="ti ti-ip" placeholder="x.x.x.x" disabled /></td>
                <td></td>
              {/if}
            </tr>

            <!-- Feedback de error -->
            {#if rowFeedback[i]}
              <tr class="fb-row">
                <td colspan="9">
                  <div class="fb-msg">{@html rowFeedback[i].replace(/\n/g,'<br>')}</div>
                </td>
              </tr>
            {/if}

            <!-- Revisión de solución -->
            {#if showReview && i >= activeRow}
              <tr class="review-row">
                <td><span class="rv-label">Correcto</span>{s.hosts}</td>
                <td></td>
                <td>{str(s.net)}</td>
                <td>/{s.prefix}</td>
                <td>{str(s.mask)}</td>
                <td>{str(s.first)}</td>
                <td>{str(s.last)}</td>
                <td>{str(s.bc)}</td>
                <td></td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    <!-- ── Botón revisar (durante ejercicio) ─────────────── -->
    {#if !done}
      <div class="ej-actions">
        <button class="btn" onclick={() => showReview = !showReview}>
          {showReview ? '✕ Ocultar solución' : '🔍 Revisar solución'}
        </button>
      </div>
    {/if}

    <!-- ── Banner de completado ───────────────────────────── -->
    {#if done}
      <div class="done-banner">
        <h3 class="done-title">🎉 ¡Esquema completo!</h3>
        <p class="done-stats">
          Nivel: {LEVELS[selectedLevel].label} ·
          Filas: {subnets.length}/{subnets.length} ·
          Errores esta tabla: {totalErrors}
        </p>

        <!-- Historial -->
        {#if historial.length > 0}
          <div class="historial">
            <div class="hist-title">Ejercicios completados esta sesión ({tablasDone})</div>
            {#each historial as entry, idx}
              <div class="hist-item">
                <span class="hi-lbl">#{idx+1} {entry.label}</span>
                <span class="hi-err">{entry.errores} error{entry.errores !== 1 ? 'es' : ''}</span>
                <span class="hi-date">{entry.fecha}</span>
              </div>
            {/each}

            {#if tablasDone < 2}
              <div class="cum-pending">
                ⏳ Tabla {tablasDone}/2 completada —
                haz <strong>1 más</strong> para registrar tu nota.
              </div>
            {:else}
              <div class="cum-ok">
                ✓ Nota acumulada: <strong>{calAcum}/100</strong>
                &nbsp;·&nbsp; {tablasDone} tablas
                &nbsp;·&nbsp; {errAcum} errores totales
                {#if totalErrors > 0}
                  <br><span class="cum-hint">Haz otra tabla para reducir la penalización.</span>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Estado de envío -->
        {#if scriptUrl}
          {#if submitStatus === 'sending'}
            <span class="submit-ind pending">⏳ Registrando…</span>
          {:else if submitStatus === 'sent'}
            <span class="submit-ind ok">✓ Registrado automáticamente</span>
          {:else if submitStatus === 'error'}
            <span class="submit-ind err">⚠ No se pudo registrar automáticamente</span>
            <button class="btn btn-primary" onclick={resubmit}>📤 Reenviar al profesor</button>
          {/if}
        {/if}

        <div class="done-actions">
          <button class="btn btn-primary" onclick={generateExercise} disabled={locked}>
            ↺ Nuevo Ejercicio
          </button>
          <button class="btn" onclick={() => showReview = !showReview}>
            {showReview ? '✕ Ocultar solución' : '🔍 Revisar solución'}
          </button>
        </div>
      </div>
    {/if}

  {:else}
    <!-- ── Estado inicial ─────────────────────────────────── -->
    <div class="vlsm-hint">
      <p>Seleccione un nivel de dificultad y haga clic en <strong>▶ Iniciar Ejercicio</strong>.</p>
      <div class="hint-levels">
        <div class="hint-level basico">
          <strong>Básico</strong> — 3 subredes, red /24 (192.168.x.0)
        </div>
        <div class="hint-level intermedio">
          <strong>Intermedio</strong> — 5 subredes, red /20 (172.x.x.0)
        </div>
        <div class="hint-level avanzado">
          <strong>Avanzado</strong> — 10 subredes + 4 WAN, red /16 (10.x.0.0)
        </div>
      </div>
      <p class="hint-note">
        Se necesitan <strong>2 tablas completadas</strong> para registrar la nota acumulada.
      </p>
    </div>
  {/if}
</section>

<style>
  /* ── Header ──────────────────────────────────────────── */
  .ej-header {
    display: flex; flex-wrap: wrap;
    justify-content: space-between; align-items: center;
    gap: 0.75rem; margin-bottom: 1rem;
  }
  .ej-title-row { display: flex; flex-direction: column; gap: 0.3rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); margin: 0; }

  .student-badge {
    display: flex; align-items: center; gap: 0.4rem;
    font-family: var(--font-mono); font-size: 0.75rem;
  }
  .student-icon  { font-size: 0.8rem; }
  .student-name  { color: var(--text-primary); font-weight: 600; }
  .student-cedula { color: var(--text-muted); }
  .ej-actions { margin-top: 1rem; display: flex; gap: 0.5rem; }

  .vlsm-controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .lvl-select {
    background: var(--surface, #0d1117); border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); color: var(--text-primary);
    font-family: var(--font-mono); font-size: 0.8rem; padding: 0.35rem 0.5rem;
  }
  .lvl-select:disabled { opacity: 0.5; cursor: not-allowed; }

  .level-badge {
    font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 20px;
    font-family: var(--font-mono); font-weight: 700; letter-spacing: 0.04em;
  }
  .level-badge.basico     { background: rgba(0,255,65,.12);  color: #00ff41; border: 1px solid rgba(0,255,65,.3); }
  .level-badge.intermedio { background: rgba(0,180,216,.12); color: var(--accent); border: 1px solid rgba(0,180,216,.3); }
  .level-badge.avanzado   { background: rgba(255,58,58,.12); color: #ff3a3a; border: 1px solid rgba(255,58,58,.3); }

  /* ── Info panel ──────────────────────────────────────── */
  .info-panel {
    background: var(--surface, #161b22); border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px); margin-bottom: 1rem; overflow: hidden;
  }
  .base-row {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.6rem 1rem; border-bottom: 1px solid var(--border);
    background: linear-gradient(90deg, rgba(0,180,216,.07), transparent);
  }
  .pool-row { padding: 0.6rem 1rem; }
  .info-label {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--text-muted); white-space: nowrap; font-family: var(--font-mono);
  }
  .info-value {
    font-family: var(--font-mono); font-size: 1rem; color: var(--accent); font-weight: 700;
  }
  .pool-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 0.4rem; }
  .pool-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .chip {
    font-family: var(--font-mono); font-size: 0.78rem;
    padding: 0.2rem 0.55rem; border-radius: 4px;
    border: 1px solid var(--border); background: var(--surface, #0d1117);
    color: var(--text-primary);
  }
  .chip-used { background: #00ff4110; border-color: var(--color-correct, #00ff41); color: var(--color-correct, #00ff41); opacity: 0.5; }
  .chip-next { background: rgba(0,180,216,.15); border-color: var(--accent); color: var(--accent); font-weight: 700; }

  /* ── Progress bar ─────────────────────────────────────── */
  .row-prog {
    background: var(--border); border-radius: 100px; height: 6px;
    overflow: hidden; margin-bottom: 1rem; position: relative;
  }
  .rp-fill {
    height: 100%; background: var(--accent);
    border-radius: 100px; transition: width 0.4s ease;
  }
  .rp-label {
    position: absolute; right: 0; top: -18px;
    font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);
  }

  /* ── Table ────────────────────────────────────────────── */
  .table-wrap { overflow-x: auto; margin-bottom: 1rem; }
  .vlsm-table {
    width: 100%; border-collapse: collapse;
    font-family: var(--font-mono); font-size: 0.78rem;
    min-width: 680px;
  }
  .vlsm-table th {
    background: var(--surface, #161b22); color: var(--text-muted);
    padding: 0.5rem 0.6rem; border-bottom: 2px solid var(--border);
    text-align: left; font-size: 0.65rem; text-transform: uppercase;
    letter-spacing: 0.06em; white-space: nowrap;
  }
  .vlsm-row td { padding: 0.35rem 0.4rem; border-bottom: 1px solid var(--border); }
  .row-done   { background: rgba(0,255,65,.04); }
  .row-active { background: rgba(0,180,216,.06); }
  .row-locked { opacity: 0.45; }
  .row-wan    { background: rgba(248,81,73,.05); }
  .rnum {
    font-family: var(--font-mono); font-size: 0.72rem;
    color: var(--text-muted); white-space: nowrap; padding-right: 0.5rem !important;
  }
  .wan-label {
    font-size: 0.6rem; background: rgba(248,81,73,.15); color: #ff3a3a;
    border: 1px solid rgba(248,81,73,.3); border-radius: 3px;
    padding: 0.1rem 0.3rem; margin-left: 0.3rem; vertical-align: middle;
  }

  /* ── Inputs ───────────────────────────────────────────── */
  .ti {
    font-family: var(--font-mono); font-size: 0.78rem;
    background: transparent; border: 1px solid var(--border);
    border-radius: 3px; color: var(--text-primary);
    padding: 0.2rem 0.35rem; width: 100%;
    transition: border-color 0.15s;
  }
  .ti:focus  { outline: none; border-color: var(--accent); }
  .ti:disabled { opacity: 0.4; cursor: not-allowed; }
  .ti.ok     { border-color: var(--color-correct, #00ff41); color: var(--color-correct, #00ff41); }
  .ti-h  { width: 3.5rem; }
  .ti-px { width: 3rem; }
  .ti-ip { width: 8rem; }
  .ti-mk { width: 8rem; }
  .tag-ok {
    color: var(--color-correct, #00ff41);
    font-size: 0.9rem; font-weight: 700;
  }

  /* ── Verify button ────────────────────────────────────── */
  .btn-verify {
    background: var(--accent); color: #000; border: none;
    padding: 0.3rem 0.75rem; border-radius: 4px;
    font-size: 0.75rem; font-weight: 700; cursor: pointer;
    white-space: nowrap; font-family: var(--font-mono);
    transition: opacity 0.15s;
  }
  .btn-verify:hover { opacity: 0.85; }

  /* ── Feedback ─────────────────────────────────────────── */
  .fb-row td { padding: 0.3rem 0.5rem; background: rgba(255,58,58,.05); }
  .fb-msg {
    font-family: var(--font-mono); font-size: 0.75rem;
    color: var(--color-error, #ff3a3a); line-height: 1.6;
  }

  /* ── Review rows ──────────────────────────────────────── */
  .review-row {
    font-family: var(--font-mono); font-size: 0.75rem;
    color: var(--color-correct, #00ff41);
    background: rgba(0,255,65,.04);
  }
  .review-row td { padding: 0.2rem 0.4rem; border-bottom: 1px dashed var(--border); }
  .rv-label {
    font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.04em; display: block;
  }

  /* ── Shake ────────────────────────────────────────────── */
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    30%     { transform: translateX(-4px); }
    70%     { transform: translateX(4px); }
  }
  .shake { animation: shake 0.32s ease; }

  /* ── Done banner ──────────────────────────────────────── */
  .done-banner {
    margin-top: 1rem; padding: 1.25rem;
    background: var(--surface, #161b22); border: 1px solid var(--color-correct, #00ff41);
    border-radius: var(--radius, 8px);
    display: flex; flex-direction: column; align-items: center;
    gap: 0.75rem; text-align: center;
  }
  .done-title { font-size: 1.1rem; color: var(--color-correct, #00ff41); margin: 0; }
  .done-stats { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); margin: 0; }
  .done-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }

  /* ── Historial ────────────────────────────────────────── */
  .historial { width: 100%; max-width: 420px; text-align: left; }
  .hist-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 0.4rem; }
  .hist-item  { display: flex; gap: 0.75rem; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0; }
  .hi-lbl     { color: var(--text-primary); flex: 1; }
  .hi-err     { color: var(--color-error, #ff3a3a); white-space: nowrap; }
  .hi-date    { color: var(--text-muted); white-space: nowrap; }
  .cum-pending { margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); }
  .cum-ok      { margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.82rem; color: var(--color-correct, #00ff41); }
  .cum-hint    { font-size: 0.75rem; color: var(--text-muted); }

  /* ── Submit indicators ────────────────────────────────── */
  .submit-ind        { font-family: var(--font-mono); font-size: 0.8rem; }
  .submit-ind.pending { color: var(--text-muted); }
  .submit-ind.ok      { color: var(--color-correct, #00ff41); }
  .submit-ind.err     { color: var(--color-error, #ff3a3a); }

  /* ── Hint inicial ─────────────────────────────────────── */
  .vlsm-hint { padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem; }
  .hint-levels { display: flex; flex-direction: column; gap: 0.4rem; margin: 1rem 0; text-align: left; max-width: 380px; margin-left: auto; margin-right: auto; }
  .hint-level  { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm, 4px); border: 1px solid var(--border); }
  .hint-level.basico     { border-left: 3px solid #00ff41; }
  .hint-level.intermedio { border-left: 3px solid var(--accent); }
  .hint-level.avanzado   { border-left: 3px solid #ff3a3a; }
  .hint-note { font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.5rem; }
</style>
