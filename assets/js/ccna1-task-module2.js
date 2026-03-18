'use strict';

(function () {
  const STATE_KEY = 'ccna1-task-ccna1-v2';
  const PREF_KEY = 'ccna1-task-module2-prefs-v1';

  const els = {};
  let state = loadState();
  let prefs = loadPrefs();
  let currentAudio = null;
  let initialized = false;

  const DEVICE_POOL = ['SW-LAB-07', 'SW-CTP-21', 'SW-AULA-15', 'SW-BK-09', 'SW-RED-18'];
  const CONSOLE_PASSWORDS = ['Consola2026', 'AccesoLAB07', 'CTPConsole26', 'ClaseSwitch25'];
  const ENABLE_SECRETS = ['Clase2026!', 'CiscoLab#26', 'PrivadoM2$7', 'SwitchCore_26'];
  const BANNER_TEXTS = ['Acceso solo autorizado', 'Uso académico únicamente', 'Laboratorio de redes', 'CTP Platanares'];
  const VLAN_IDS = [1, 10, 20, 30, 99];
  const IP_HOSTS = [20, 25, 31, 44, 52];
  const IP_NETWORKS = [10, 12, 15, 18, 22];
  const ACCESS_PORTS = ['Fa0/1', 'Fa0/2', 'Fa0/7', 'Fa0/9', 'Gi0/1'];
  const DOWN_PORTS = ['Fa0/11', 'Fa0/18', 'Gi0/2', 'Fa0/20'];
  const DECIMAL_OCTETS = [26, 44, 58, 96, 192];

  const LEVEL_DESCRIPTORS = {
    Inicial: 'Reconoce algunos elementos, pero todavía necesita apoyo para leer salidas, ubicar modos y sostener secuencias correctas.',
    Intermedio: 'Resuelve la mayor parte del trabajo con criterio funcional, aunque aún presenta errores menores de lectura o de orden.',
    Avanzado: 'Demuestra dominio sólido de conceptos, comandos, salidas y secuencias de configuración con criterio técnico.'
  };

  const FLASHCARD_BANK = [
    ['Red de datos', '¿Qué propósito cumple una red en una institución?', 'Permite comunicar dispositivos, compartir recursos y acceder a servicios de forma organizada.'],
    ['Dispositivo final', '¿Qué ejemplo sí es un dispositivo final?', 'Una PC, laptop, impresora de red o teléfono IP.'],
    ['Dispositivo intermedio', '¿Qué hace un switch?', 'Conecta equipos dentro de la LAN y reenvía tramas según la dirección MAC.'],
    ['Medio de red', '¿Qué medio resiste mejor interferencia electromagnética?', 'La fibra óptica.'],
    ['Sistema numérico', '¿Cuántos bits tiene un octeto?', 'Un octeto tiene 8 bits.'],
    ['Prompt', '¿Qué indica el prompt Switch>?', 'Modo EXEC de usuario.'],
    ['Prompt', '¿Qué indica el prompt Switch(config-if)#?', 'Modo de configuración de interfaz.'],
    ['Comando', '¿Para qué sirve configure terminal?', 'Para entrar desde EXEC privilegiado al modo de configuración global.'],
    ['Seguridad', '¿Qué hace enable secret?', 'Define la contraseña segura del modo EXEC privilegiado.'],
    ['Seguridad', '¿Qué hace service password-encryption?', 'Cifra contraseñas que de otro modo quedarían visibles en texto plano.'],
    ['Memoria', '¿Dónde vive running-config?', 'En RAM; es la configuración activa.'],
    ['Memoria', '¿Dónde vive startup-config?', 'En NVRAM; es la configuración que se carga al reiniciar.'],
    ['Verificación', '¿Qué muestra show ip interface brief?', 'Direcciones IP, estado y protocolo de las interfaces de forma resumida.'],
    ['Switching', '¿Qué muestra show vlan brief?', 'Las VLAN existentes y los puertos asociados a cada una.'],
    ['Switching', 'Si el switch no conoce la MAC destino dentro de la VLAN, ¿qué hace?', 'Inunda la trama dentro de esa VLAN.'],
    ['Diagnóstico', 'Si aparece % Invalid input detected, ¿qué sospechamos primero?', 'Modo incorrecto, comando mal escrito o contexto equivocado.']
  ];

  const questionFactories = {
    single: qSingle,
    multi: qMulti,
    text: qText,
    order: qOrder
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    bindElements();
    bindEvents();
    applyPrefs();
    prepareModal();
    renderAll();
  }

  function bindElements() {
    els.body = document.body;

    els.studentModal = document.getElementById('studentModal');
    els.studentForm = document.getElementById('studentForm');
    els.savedStudentRow = document.getElementById('savedStudentRow');
    els.savedStudentLabel = document.getElementById('savedStudentLabel');
    els.btnUseSaved = document.getElementById('btnUseSaved');
    els.inputName = document.getElementById('inputName');
    els.inputGroup = document.getElementById('inputGroup');
    els.inputDate = document.getElementById('inputDate');

    els.btnContrast = document.getElementById('btnContrast');
    els.btnEasyMode = document.getElementById('btnEasyMode');
    els.btnPracticeMode = document.getElementById('btnPracticeMode');
    els.btnFontDown = document.getElementById('btnFontDown');
    els.btnFontUp = document.getElementById('btnFontUp');
    els.btnStopAudio = document.getElementById('btnStopAudio');
    els.btnShuffleCards = document.getElementById('btnShuffleCards');

    els.contrastChip = document.getElementById('contrastChip');
    els.easyChip = document.getElementById('easyChip');
    els.modeChip = document.getElementById('modeChip');
    els.fontChip = document.getElementById('fontChip');
    els.audioChip = document.getElementById('audioChip');

    els.quickReviewMount = document.getElementById('quickReviewMount');
    els.practiceMount = document.getElementById('practiceMount');
    els.reportShell = document.getElementById('reportShell');
    els.reportKpis = document.getElementById('reportKpis');
    els.reportContent = document.getElementById('reportContent');

    els.studentChip = document.getElementById('studentChip');
    els.groupChip = document.getElementById('groupChip');
    els.dateChip = document.getElementById('dateChip');
    els.practiceStatus = document.getElementById('practiceStatus');
    els.statModules = document.getElementById('statModules');
    els.statAnswered = document.getElementById('statAnswered');
    els.statCorrect = document.getElementById('statCorrect');
    els.scoreValue = document.getElementById('scoreValue');
    els.btnChangeStudent = document.getElementById('btnChangeStudent');
    els.btnNewPractice = document.getElementById('btnNewPractice');
    els.btnExportPdf = document.getElementById('btnExportPdf');

    els.imageLightbox = document.getElementById('imageLightbox');
    els.lightboxVisual = document.getElementById('lightboxVisual');
    els.lightboxTitle = document.getElementById('lightboxTitle');
    els.lightboxCaption = document.getElementById('lightboxCaption');
    els.lightboxClose = document.querySelector('[data-close-lightbox]');

    els.zoomableHtmlCards = Array.from(document.querySelectorAll('[data-zoomable-html]'));
    els.zoomableSvgs = Array.from(document.querySelectorAll('.svg-wrap'));
  }

  function bindEvents() {
    els.studentForm.addEventListener('submit', handleStudentSubmit);
    els.btnUseSaved.addEventListener('click', continueSavedPractice);
    els.btnChangeStudent.addEventListener('click', openModal);
    els.btnNewPractice.addEventListener('click', createFreshPractice);
    els.btnExportPdf.addEventListener('click', exportPdf);

    els.btnContrast.addEventListener('click', function () {
      prefs.contrast = !prefs.contrast;
      savePrefs();
      renderAll();
    });

    els.btnEasyMode.addEventListener('click', function () {
      prefs.easyMode = !prefs.easyMode;
      savePrefs();
      renderAll();
    });

    els.btnPracticeMode.addEventListener('click', function () {
      prefs.practiceOnly = !prefs.practiceOnly;
      savePrefs();
      renderAll();
      if (prefs.practiceOnly) {
        const practice = document.getElementById('practice');
        if (practice) practice.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    els.btnFontDown.addEventListener('click', function () {
      prefs.fontScale = Math.max(0.92, Number((prefs.fontScale - 0.06).toFixed(2)));
      savePrefs();
      renderAll();
    });

    els.btnFontUp.addEventListener('click', function () {
      prefs.fontScale = Math.min(1.24, Number((prefs.fontScale + 0.06).toFixed(2)));
      savePrefs();
      renderAll();
    });

    els.btnStopAudio.addEventListener('click', stopSpeaking);
    els.btnShuffleCards.addEventListener('click', shuffleFlashcards);

    els.practiceMount.addEventListener('change', handlePracticeChange);
    els.practiceMount.addEventListener('input', handlePracticeInput);

    prepareZoomables();

    if (els.lightboxClose) {
      els.lightboxClose.addEventListener('click', closeImageLightbox);
    }

    if (els.imageLightbox) {
      els.imageLightbox.addEventListener('click', function (event) {
        if (event.target === els.imageLightbox) closeImageLightbox();
      });
    }

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleStudentSubmit(event) {
    event.preventDefault();
    const data = new FormData(els.studentForm);
    const student = {
      name: String(data.get('name') || '').trim(),
      group: String(data.get('group') || '').trim(),
      date: String(data.get('date') || '').trim()
    };

    if (!student.name || !student.group || !student.date) return;

    state = createNewState(student);
    saveState();
    closeModal();
    renderAll();
  }

  function continueSavedPractice() {
    closeModal();
    renderAll();
  }

  function createFreshPractice() {
    if (!state.student) {
      openModal();
      return;
    }

    const ok = window.confirm('Se generará una tarea nueva y se perderá el progreso actual. ¿Continuar?');
    if (!ok) return;

    state = createNewState(state.student);
    saveState();
    renderAll();
    window.location.hash = '#practice';
  }

  function createNewState(student) {
    return {
      version: 2,
      student: student,
      session: buildSession(),
      answers: {},
      attempts: {},
      status: {},
      hints: {},
      cardReveal: {},
      startedAt: new Date().toISOString()
    };
  }

  function handlePracticeInput(event) {
    const input = event.target;
    const questionCard = input.closest('.question-card');
    if (!questionCard) return;

    const questionId = questionCard.dataset.questionId;
    const question = findQuestionById(questionId);
    if (!question || isQuestionLocked(questionId)) return;

    if (question.type === 'text') {
      state.answers[questionId] = input.value;
      saveState();
      renderStats();
    }
  }

  function handlePracticeChange(event) {
    const target = event.target;
    const questionCard = target.closest('.question-card');
    if (!questionCard) return;

    const questionId = questionCard.dataset.questionId;
    const question = findQuestionById(questionId);
    if (!question || isQuestionLocked(questionId)) return;

    if (question.type === 'single') {
      state.answers[questionId] = target.value;
    } else if (question.type === 'multi') {
      state.answers[questionId] = Array.from(questionCard.querySelectorAll('input[type="checkbox"]:checked')).map(function (node) {
        return node.value;
      });
    } else if (question.type === 'order') {
      state.answers[questionId] = Array.from(questionCard.querySelectorAll('select[data-order-index]'))
        .sort(function (a, b) { return Number(a.dataset.orderIndex) - Number(b.dataset.orderIndex); })
        .map(function (node) { return node.value; });
    } else if (question.type === 'text') {
      state.answers[questionId] = target.value;
    }

    saveState();
    renderStats();
  }

  function handleGlobalClick(event) {
    const svgWrap = event.target.closest('.svg-wrap');
    if (svgWrap && !event.target.closest('[data-filter-type]')) {
      event.preventDefault();
      event.stopPropagation();
      openSvgLightbox(svgWrap);
      return;
    }

    const zoomableCard = event.target.closest('[data-zoomable-html]');
    if (zoomableCard) {
      event.preventDefault();
      openHtmlLightbox(zoomableCard);
      return;
    }

    const verifyBtn = event.target.closest('[data-verify-question]');
    if (verifyBtn) {
      verifyQuestion(verifyBtn.dataset.verifyQuestion);
      return;
    }

    const resetBtn = event.target.closest('[data-reset-question]');
    if (resetBtn) {
      resetQuestion(resetBtn.dataset.resetQuestion);
      return;
    }

    const hintBtn = event.target.closest('[data-toggle-hint]');
    if (hintBtn) {
      toggleHint(hintBtn.dataset.toggleHint);
      return;
    }

    const quickBtn = event.target.closest('[data-toggle-card]');
    if (quickBtn) {
      toggleFlashcard(quickBtn.dataset.toggleCard);
      return;
    }

    const speakQuestionBtn = event.target.closest('[data-speak-question]');
    if (speakQuestionBtn) {
      speakQuestion(speakQuestionBtn.dataset.speakQuestion);
      return;
    }

    const speakBtn = event.target.closest('[data-speak-target]');
    if (speakBtn) {
      speakFromTarget(speakBtn.dataset.speakTarget);
    }
  }

  function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && els.imageLightbox && els.imageLightbox.classList.contains('is-open')) {
      closeImageLightbox();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement) {
      const activeSvg = document.activeElement.closest('.svg-wrap');
      if (activeSvg) {
        event.preventDefault();
        openSvgLightbox(activeSvg);
        return;
      }

      const activeCard = document.activeElement.closest('[data-zoomable-html]');
      if (activeCard) {
        event.preventDefault();
        openHtmlLightbox(activeCard);
      }
    }
  }

  function prepareZoomables() {
    els.zoomableHtmlCards.forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-haspopup', 'dialog');
    });

    els.zoomableSvgs.forEach(function (wrap) {
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-haspopup', 'dialog');
    });
  }

  function renderAll() {
    applyPrefs();
    renderToolState();
    renderQuickReview();
    renderWorkspace();
  }

  function renderToolState() {
    setPressed(els.btnContrast, prefs.contrast);
    setPressed(els.btnEasyMode, prefs.easyMode);
    setPressed(els.btnPracticeMode, prefs.practiceOnly);

    if (els.contrastChip) {
      els.contrastChip.textContent = prefs.contrast ? 'Contraste alto activo' : 'Contraste normal';
    }
    if (els.easyChip) {
      els.easyChip.textContent = prefs.easyMode ? 'Modo fácil activo' : 'Modo fácil oculto';
    }
    if (els.modeChip) {
      els.modeChip.textContent = prefs.practiceOnly ? 'Solo práctica' : 'Vista completa';
    }
    if (els.fontChip) {
      els.fontChip.textContent = 'Escala ' + Math.round(prefs.fontScale * 100) + '%';
    }
    if (els.audioChip && !currentAudio) {
      els.audioChip.textContent = 'Audio detenido';
    }
  }

  function renderQuickReview() {
    if (!els.quickReviewMount) return;

    if (!state.session) {
      els.quickReviewMount.innerHTML = '<div class="flash-card"><h3>Repaso pendiente</h3><p>La activación previa aparecerá cuando registremos nombre, sección y fecha en el modal inicial.</p></div>';
      return;
    }

    els.quickReviewMount.innerHTML = state.session.flashcards.map(function (card) {
      const shown = Boolean(state.cardReveal[card.id]);
      return [
        '<article class="flash-card">',
          '<div class="flash-top">',
            '<div>',
              '<h3>' + escapeHtml(card.front) + '</h3>',
              '<p>' + escapeHtml(card.question) + '</p>',
            '</div>',
            '<button class="btn-inline secondary" type="button" data-toggle-card="' + escapeHtml(card.id) + '">' + (shown ? 'Ocultar' : 'Mostrar') + '</button>',
          '</div>',
          '<div class="flash-answer' + (shown ? ' show' : '') + '">' + escapeHtml(card.back) + '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderWorkspace() {
    const hasSession = Boolean(state.student && state.session);

    els.studentChip.textContent = hasSession ? state.student.name : '—';
    els.groupChip.textContent = hasSession ? state.student.group : '—';
    els.dateChip.textContent = hasSession ? state.student.date : '—';

    if (!hasSession) {
      els.practiceStatus.textContent = 'Pendiente de iniciar';
      els.practiceMount.innerHTML = '<div class="practice-module"><h3>Sin evaluación activa</h3><p>Registra nombre, sección y fecha antes de comenzar el repaso acumulativo y la evaluación práctica aplicada.</p></div>';
      els.statModules.textContent = '0/0';
      els.statAnswered.textContent = '0';
      els.statCorrect.textContent = '0';
      els.scoreValue.textContent = '0%';
      els.btnExportPdf.disabled = true;
      els.reportShell.classList.remove('ready');
      els.reportKpis.innerHTML = '';
      els.reportContent.innerHTML = '';
      return;
    }

    renderPractice();
    renderStats();
    renderReport();
  }

  function renderPractice() {
    els.practiceMount.innerHTML = state.session.indicators.map(function (indicator) {
      const metrics = getIndicatorMetrics(indicator);
      return [
        '<article class="practice-module">',
          '<div class="module-top">',
            '<div>',
              '<h3>' + escapeHtml(indicator.title) + '</h3>',
              '<p>' + escapeHtml(indicator.description) + '</p>',
            '</div>',
            '<div class="module-kpis">',
              '<span class="module-badge">' + metrics.correct + '/' + metrics.total + ' correctas</span>',
              '<span class="module-badge">' + metrics.settled + '/' + metrics.total + ' cerradas</span>',
              '<span class="module-badge level-' + escapeHtml(metrics.level.toLowerCase()) + '">' + escapeHtml(metrics.level) + '</span>',
            '</div>',
          '</div>',
          '<div class="question-list">',
            indicator.questions.map(function (question, index) {
              return renderQuestion(question, index + 1);
            }).join(''),
          '</div>',
          '<div class="module-actions">',
            '<span class="module-status">' + escapeHtml(getIndicatorFooter(metrics)) + '</span>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderQuestion(question, number) {
    const selected = state.answers[question.id];
    const lock = isQuestionLocked(question.id);
    const status = getQuestionStatus(question.id);
    const hintShown = Boolean(state.hints[question.id]);
    const lead = question.leadHtml ? '<div class="question-lead">' + question.leadHtml + '</div>' : '';

    return [
      '<div class="question-card ' + escapeHtml(status.cardClass) + '" data-question-id="' + escapeHtml(question.id) + '">',
        '<div class="question-head">',
          '<div class="question-num">' + number + '</div>',
          '<div class="question-main">',
            '<div class="question-status-row">',
              '<p>' + escapeHtml(question.prompt) + '</p>',
              '<span class="question-state ' + escapeHtml(status.badgeClass) + '">' + escapeHtml(status.label) + '</span>',
            '</div>',
            '<div class="question-tools">',
              '<button class="btn-inline" type="button" data-toggle-hint="' + escapeHtml(question.id) + '">' + (hintShown ? 'Ocultar pista' : 'Ver pista') + '</button>',
              '<button class="btn-inline secondary" type="button" data-speak-question="' + escapeHtml(question.id) + '">Escuchar</button>',
            '</div>',
          '</div>',
        '</div>',
        lead,
        renderQuestionInput(question, selected, lock),
        '<div class="question-actions">',
          '<span class="question-attempt">Intentos: ' + status.attemptText + '</span>',
          '<div class="module-action-row">',
            '<button class="btn-review" type="button" data-verify-question="' + escapeHtml(question.id) + '"' + (lock ? ' disabled' : '') + '>' + escapeHtml(status.actionLabel) + '</button>',
            '<button class="btn-tool secondary" type="button" data-reset-question="' + escapeHtml(question.id) + '"' + (lock ? ' disabled' : '') + '>Limpiar</button>',
          '</div>',
        '</div>',
        hintShown ? '<div class="hint-box">' + escapeHtml(question.hint) + '</div>' : '',
        renderFeedback(question, status.key),
      '</div>'
    ].join('');
  }

  function renderQuestionInput(question, selected, lock) {
    if (question.type === 'single') {
      return [
        '<div class="choice-list">',
          question.options.map(function (option) {
            const checked = normalizeText(selected) === normalizeText(option);
            return [
              '<label class="choice-label">',
                '<input type="radio" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option) + '"' + (checked ? ' checked' : '') + (lock ? ' disabled' : '') + ' />',
                '<span>' + escapeHtml(option) + '</span>',
              '</label>'
            ].join('');
          }).join(''),
        '</div>'
      ].join('');
    }

    if (question.type === 'multi') {
      return [
        '<div class="choice-list">',
          question.options.map(function (option) {
            const checked = Array.isArray(selected) && selected.some(function (item) {
              return normalizeText(item) === normalizeText(option);
            });
            return [
              '<label class="choice-label">',
                '<input type="checkbox" value="' + escapeHtml(option) + '"' + (checked ? ' checked' : '') + (lock ? ' disabled' : '') + ' />',
                '<span>' + escapeHtml(option) + '</span>',
              '</label>'
            ].join('');
          }).join(''),
        '</div>'
      ].join('');
    }

    if (question.type === 'text') {
      return [
        '<div class="text-answer">',
          '<input class="text-input" type="text" data-question-id="' + escapeHtml(question.id) + '" placeholder="' + escapeHtml(question.placeholder || 'Escribe tu respuesta') + '" value="' + escapeHtml(selected || '') + '"' + (lock ? ' disabled' : '') + ' />',
        '</div>'
      ].join('');
    }

    if (question.type === 'order') {
      return [
        '<div class="order-grid">',
          question.answer.map(function (_, index) {
            const chosen = Array.isArray(selected) ? selected[index] : '';
            return [
              '<label class="order-label">',
                'Paso ' + (index + 1),
                '<select data-order-index="' + index + '"' + (lock ? ' disabled' : '') + '>',
                  '<option value="">— seleccionar —</option>',
                  question.options.map(function (step) {
                    return '<option value="' + escapeHtml(step) + '"' + (normalizeText(chosen) === normalizeText(step) ? ' selected' : '') + '>' + escapeHtml(step) + '</option>';
                  }).join(''),
                '</select>',
              '</label>'
            ].join('');
          }).join(''),
        '</div>'
      ].join('');
    }

    return '';
  }

  function renderFeedback(question, statusKey) {
    if (statusKey === 'pending') return '';

    if (statusKey === 'retry') {
      return [
        '<div class="question-feedback warn">',
          '<strong>Primera respuesta incorrecta.</strong>',
          '<span class="detail">' + escapeHtml(question.remediation) + '</span>',
          '<span class="detail">Tienes una única oportunidad de corrección. Revisa el modo, la salida o la secuencia antes de volver a verificar.</span>',
        '</div>'
      ].join('');
    }

    if (statusKey === 'correct') {
      return [
        '<div class="question-feedback ok">',
          '<strong>' + escapeHtml(getAttemptCount(question.id) > 0 ? 'Respuesta corregida correctamente.' : 'Respuesta correcta.') + '</strong>',
          '<span class="detail">' + escapeHtml(question.explanation) + '</span>',
        '</div>'
      ].join('');
    }

    return [
      '<div class="question-feedback err">',
        '<strong>Respuesta incorrecta definitiva.</strong>',
        '<span class="detail">' + escapeHtml(question.explanation) + '</span>',
        '<span class="detail">Respuesta esperada: ' + escapeHtml(formatExpectedAnswer(question)) + '</span>',
      '</div>'
    ].join('');
  }

  function renderStats() {
    const totals = getTotals();
    els.statModules.textContent = totals.closedIndicators + '/' + totals.totalIndicators;
    els.statAnswered.textContent = String(totals.settled);
    els.statCorrect.textContent = String(totals.correct);
    els.scoreValue.textContent = totals.totalQuestions ? Math.round((totals.correct / totals.totalQuestions) * 100) + '%' : '0%';
    els.practiceStatus.textContent = allQuestionsSettled() ? 'Evaluación completada' : 'Evaluación en curso';
    els.btnExportPdf.disabled = !allQuestionsSettled();
  }

  function renderReport() {
    if (!state.session) return;

    const totals = getTotals();
    const percent = totals.totalQuestions ? Math.round((totals.correct / totals.totalQuestions) * 100) : 0;
    const observation = getGeneralObservation();
    els.reportShell.classList.toggle('ready', allQuestionsSettled());

    if (!allQuestionsSettled()) {
      els.reportKpis.innerHTML = '';
      els.reportContent.innerHTML = '';
      return;
    }

    els.reportKpis.innerHTML = [
      '<span class="report-kpi">Estudiante: <strong>' + escapeHtml(state.student.name) + '</strong></span>',
      '<span class="report-kpi">Sección: <strong>' + escapeHtml(state.student.group) + '</strong></span>',
      '<span class="report-kpi">Fecha: <strong>' + escapeHtml(state.student.date) + '</strong></span>',
      '<span class="report-kpi">Puntaje: <strong>' + percent + '%</strong></span>'
    ].join('');

    const indicatorCards = state.session.indicators.map(function (indicator) {
      const metrics = getIndicatorMetrics(indicator);
      return [
        '<article class="concept-card">',
          '<h3>' + escapeHtml(indicator.title) + '</h3>',
          '<p><strong>Resultado:</strong> ' + metrics.correct + '/' + metrics.total + ' correctas (' + metrics.percent + '%).</p>',
          '<p><strong>Nivel alcanzado:</strong> ' + escapeHtml(metrics.level) + '.</p>',
          '<p>' + escapeHtml(LEVEL_DESCRIPTORS[metrics.level]) + '</p>',
        '</article>'
      ].join('');
    }).join('');

    const indicatorTables = state.session.indicators.map(function (indicator) {
      return [
        '<section class="report-module">',
          '<h3>' + escapeHtml(indicator.title) + '</h3>',
          '<p class="report-note">' + escapeHtml(indicator.description) + '</p>',
          '<div class="report-table-wrap">',
            '<table class="report-table">',
              '<thead><tr><th>#</th><th>Pregunta</th><th>Respuesta del estudiante</th><th>Respuesta esperada</th><th>Resultado</th><th>Retroalimentación final</th></tr></thead>',
              '<tbody>',
                indicator.questions.map(function (question, index) {
                  return [
                    '<tr>',
                      '<td>' + (index + 1) + '</td>',
                      '<td>' + escapeHtml(question.prompt) + '</td>',
                      '<td>' + escapeHtml(formatUserAnswer(question)) + '</td>',
                      '<td>' + escapeHtml(formatExpectedAnswer(question)) + '</td>',
                      '<td class="' + (isQuestionCorrect(question.id) ? 'result-ok' : 'result-bad') + '">' + (isQuestionCorrect(question.id) ? 'Correcta' : 'Incorrecta') + '</td>',
                      '<td>' + escapeHtml(question.explanation) + '</td>',
                    '</tr>'
                  ].join('');
                }).join(''),
              '</tbody>',
            '</table>',
          '</div>',
        '</section>'
      ].join('');
    }).join('');

    els.reportContent.innerHTML = [
      '<section class="report-module">',
        '<h3>Resumen general</h3>',
        '<div class="stats-grid">',
          '<article class="stat-card"><strong>' + totals.correct + '/' + totals.totalQuestions + '</strong><span>Aciertos globales</span></article>',
          '<article class="stat-card"><strong>' + percent + '%</strong><span>Puntaje total</span></article>',
          '<article class="stat-card"><strong>' + totals.closedIndicators + '/' + totals.totalIndicators + '</strong><span>Indicadores cerrados</span></article>',
          '<article class="stat-card"><strong>' + escapeHtml(getLevel(percent)) + '</strong><span>Nivel global estimado</span></article>',
        '</div>',
        '<div class="concept-grid" style="margin-top:1rem">',
          '<article class="concept-card">',
            '<h3>Datos del estudiante</h3>',
            '<p><strong>Nombre:</strong> ' + escapeHtml(state.student.name) + '</p>',
            '<p><strong>Sección:</strong> ' + escapeHtml(state.student.group) + '</p>',
            '<p><strong>Fecha:</strong> ' + escapeHtml(state.student.date) + '</p>',
          '</article>',
          '<article class="concept-card">',
            '<h3>Lectura del resultado</h3>',
            '<p>El puntaje resume reconocimiento de conceptos, interpretación de salidas y aplicación de secuencias básicas de configuración y diagnóstico.</p>',
          '</article>',
          '<article class="report-highlight">',
            '<strong>Observación final general</strong>',
            '<span>' + escapeHtml(observation) + '</span>',
          '</article>',
        '</div>',
      '</section>',
      '<section class="report-module">',
        '<h3>Resultado por indicador</h3>',
        '<div class="concept-grid">' + indicatorCards + '</div>',
      '</section>',
      indicatorTables
    ].join('');
  }

  function verifyQuestion(questionId) {
    const question = findQuestionById(questionId);
    if (!question || isQuestionLocked(questionId)) return;

    if (!isQuestionComplete(question)) {
      window.alert('Completa la respuesta antes de verificarla.');
      return;
    }

    const correct = evaluateQuestion(question, state.answers[questionId]);
    if (correct) {
      state.status[questionId] = 'correct';
    } else {
      const nextAttempt = getAttemptCount(questionId) + 1;
      state.attempts[questionId] = nextAttempt;
      state.status[questionId] = nextAttempt >= 2 ? 'locked-wrong' : 'retry';
    }

    saveState();
    renderAll();
  }

  function resetQuestion(questionId) {
    if (isQuestionLocked(questionId)) return;
    delete state.answers[questionId];
    saveState();
    renderAll();
  }

  function toggleHint(questionId) {
    state.hints[questionId] = !state.hints[questionId];
    saveState();
    renderAll();
  }

  function toggleFlashcard(cardId) {
    state.cardReveal[cardId] = !state.cardReveal[cardId];
    saveState();
    renderQuickReview();
  }

  function shuffleFlashcards() {
    if (!state.session) return;
    state.session.flashcards = buildFlashcards();
    state.cardReveal = {};
    saveState();
    renderQuickReview();
  }

  function exportPdf() {
    if (!allQuestionsSettled()) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.alert('No fue posible cargar el generador de PDF.');
      return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;
    const width = 210 - margin * 2;
    let y = 14;

    const totals = getTotals();
    const percent = totals.totalQuestions ? Math.round((totals.correct / totals.totalQuestions) * 100) : 0;
    const observation = getGeneralObservation();

    function ensureSpace(required) {
      if (y + required > 278) {
        footer();
        doc.addPage();
        y = 14;
      }
    }

    function writeWrapped(text, x, maxWidth, lineHeight) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      y += lines.length * lineHeight;
    }

    function footer() {
      doc.setFillColor(8, 18, 28);
      doc.rect(0, 287, 210, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('CCNA 1 · Repaso acumulativo y evaluación práctica aplicada', margin, 293);
      doc.text(new Date().toLocaleString('es-CR'), 210 - margin, 293, { align: 'right' });
    }

    doc.setFillColor(6, 17, 27);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(84, 215, 255);
    doc.rect(0, 38, 210, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Tarea evaluativa interactiva de CCNA 1', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Repaso fuerte acumulativo de capítulos 1 al 7', margin, 26);
    doc.text('Prof. Andrés Mena Abarca · CTP Platanares', margin, 32);
    y = 48;

    doc.setDrawColor(84, 215, 255);
    doc.setFillColor(237, 248, 255);
    doc.roundedRect(margin, y, width, 34, 2, 2, 'FD');
    doc.setTextColor(18, 18, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATOS DEL ESTUDIANTE', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('Nombre: ' + state.student.name, margin + 4, y + 14);
    doc.text('Sección: ' + state.student.group, margin + 4, y + 21);
    doc.text('Fecha: ' + state.student.date, margin + 4, y + 28);
    doc.text('Variante: ' + state.session.variant.label, margin + 100, y + 14);
    doc.text('Aciertos: ' + totals.correct + '/' + totals.totalQuestions, margin + 100, y + 21);
    doc.text('Puntaje: ' + percent + '%', margin + 100, y + 28);
    y += 42;

    ensureSpace(30);
    doc.setFillColor(242, 247, 250);
    doc.roundedRect(margin, y, width, 26, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Observación final general', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.7);
    y += 13;
    writeWrapped(observation, margin + 4, width - 8, 4.2);
    y += 4;

    state.session.indicators.forEach(function (indicator) {
      const metrics = getIndicatorMetrics(indicator);
      ensureSpace(24);
      doc.setFillColor(9, 17, 28);
      doc.rect(margin, y, width, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(indicator.title, margin + 4, y + 6);
      doc.text(metrics.level + ' · ' + metrics.correct + '/' + metrics.total, margin + width - 4, y + 6, { align: 'right' });
      y += 14;

      doc.setTextColor(18, 18, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      ensureSpace(10);
      writeWrapped('Descripción: ' + indicator.description, margin, width, 4.2);
      writeWrapped('Nivel alcanzado: ' + LEVEL_DESCRIPTORS[metrics.level], margin, width, 4.2);
      y += 1.5;

      indicator.questions.forEach(function (question, index) {
        ensureSpace(26);
        const ok = isQuestionCorrect(question.id);
        doc.setDrawColor(220, 226, 232);
        doc.setFillColor(ok ? 238 : 255, ok ? 250 : 245, ok ? 242 : 240);
        doc.rect(margin, y, width, 24, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(18, 18, 18);
        doc.setFontSize(8.2);
        const titleLines = doc.splitTextToSize((index + 1) + '. ' + question.prompt, width - 8);
        doc.text(titleLines.slice(0, 2), margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.text('Estudiante: ' + formatUserAnswer(question), margin + 4, y + 11.4);
        doc.text('Esperada: ' + formatExpectedAnswer(question), margin + 4, y + 15.1);
        const finalLines = doc.splitTextToSize('Retroalimentación: ' + question.explanation, width - 8);
        doc.text(finalLines.slice(0, 2), margin + 4, y + 18.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(ok ? 22 : 165, ok ? 102 : 34, ok ? 62 : 34);
        doc.text(ok ? 'Correcta' : 'Incorrecta', margin + width - 4, y + 11.4, { align: 'right' });
        y += 27;
      });

      y += 2;
    });

    footer();

    const safeName = state.student.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');

    doc.save(safeName + '_ccna1_cap1-7.pdf');
  }

  function prepareModal() {
    const hasSaved = Boolean(state.student && state.session);
    const defaultDate = state.student && state.student.date
      ? state.student.date
      : new Date().toISOString().split('T')[0];

    els.inputName.value = state.student && state.student.name ? state.student.name : '';
    els.inputGroup.value = state.student && state.student.group ? state.student.group : '';
    els.inputDate.value = defaultDate;

    if (hasSaved) {
      els.savedStudentRow.classList.add('show');
      els.savedStudentLabel.innerHTML =
        'Guardado local: <strong>' + escapeHtml(state.student.name) + '</strong> · ' +
        escapeHtml(state.student.group) + ' · ' +
        escapeHtml(state.student.date);
    } else {
      els.savedStudentRow.classList.remove('show');
      els.savedStudentLabel.innerHTML = '';
    }

    openModal();
  }

  function openHtmlLightbox(card) {
    if (!els.imageLightbox || !els.lightboxVisual) return;
    const clone = card.cloneNode(true);
    clone.removeAttribute('tabindex');
    clone.removeAttribute('role');
    clone.removeAttribute('aria-haspopup');
    clone.removeAttribute('data-zoomable-html');

    els.lightboxVisual.innerHTML = '';
    els.lightboxVisual.appendChild(clone);

    if (els.lightboxTitle) {
      els.lightboxTitle.textContent = card.dataset.htmlTitle || 'Ficha ampliada';
    }
    if (els.lightboxCaption) {
      els.lightboxCaption.textContent = card.dataset.htmlCaption || 'Vista ampliada del apoyo visual.';
    }

    openLightbox();
  }

  function openSvgLightbox(wrap) {
    if (!els.imageLightbox || !els.lightboxVisual) return;
    const source = wrap.querySelector('svg');
    if (!source) return;

    const clone = source.cloneNode(true);
    els.lightboxVisual.innerHTML = '';
    els.lightboxVisual.appendChild(clone);

    const card = wrap.closest('.visual-card');
    const title = card && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Diagrama ampliado';
    const caption = card && card.querySelector('p') ? card.querySelector('p').textContent.trim() : 'Vista ampliada del apoyo visual.';

    if (els.lightboxTitle) els.lightboxTitle.textContent = title;
    if (els.lightboxCaption) els.lightboxCaption.textContent = caption;
    openLightbox();
  }

  function openLightbox() {
    els.imageLightbox.classList.add('is-open');
    els.imageLightbox.setAttribute('aria-hidden', 'false');
    els.imageLightbox.style.display = 'flex';
    els.imageLightbox.style.visibility = 'visible';
    els.imageLightbox.style.opacity = '1';
    els.imageLightbox.style.pointerEvents = 'auto';
    els.imageLightbox.style.position = 'fixed';
    els.imageLightbox.style.inset = '0';
    els.imageLightbox.style.zIndex = '1300';
    els.body.classList.add('image-presentation-open');
    syncBodyScrollState();
  }

  function closeImageLightbox() {
    els.imageLightbox.classList.remove('is-open');
    els.imageLightbox.setAttribute('aria-hidden', 'true');
    els.imageLightbox.style.display = 'none';
    els.imageLightbox.style.visibility = 'hidden';
    els.imageLightbox.style.opacity = '0';
    els.imageLightbox.style.pointerEvents = 'none';
    els.lightboxVisual.innerHTML = '';
    els.body.classList.remove('image-presentation-open');
    syncBodyScrollState();
  }

  function speakFromTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    speakText(text);
  }

  function speakQuestion(questionId) {
    const question = findQuestionById(questionId);
    if (!question) return;

    const parts = [question.prompt];
    if (Array.isArray(question.options) && question.options.length) {
      parts.push('Opciones: ' + question.options.join('. '));
    }
    if (question.type === 'text' && question.placeholder) {
      parts.push('Formato esperado: ' + question.placeholder);
    }
    parts.push('Pista: ' + question.hint);
    speakText(parts.join(' '));
  }

  function speakText(text) {
    if (!text) return;
    stopSpeaking();

    if (!('speechSynthesis' in window)) {
      if (els.audioChip) els.audioChip.textContent = 'Audio no disponible';
      return;
    }

    currentAudio = new SpeechSynthesisUtterance(text);
    currentAudio.lang = 'es-ES';
    currentAudio.rate = 0.95;
    currentAudio.onend = function () {
      currentAudio = null;
      if (els.audioChip) els.audioChip.textContent = 'Audio detenido';
    };
    currentAudio.onerror = function () {
      currentAudio = null;
      if (els.audioChip) els.audioChip.textContent = 'Audio con error';
    };

    if (els.audioChip) els.audioChip.textContent = 'Leyendo sección';
    window.speechSynthesis.speak(currentAudio);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentAudio = null;
    if (els.audioChip) els.audioChip.textContent = 'Audio detenido';
  }

  function applyPrefs() {
    document.documentElement.style.fontSize = Math.round(prefs.fontScale * 100) + '%';
    els.body.classList.toggle('dua-contrast', prefs.contrast);
    els.body.classList.toggle('easy-mode', prefs.easyMode);
    els.body.classList.toggle('practice-only', prefs.practiceOnly);
  }

  function setPressed(button, active) {
    if (!button) return;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle('is-active', active);
  }

  function openModal() {
    els.body.classList.add('modal-open');
    els.studentModal.classList.add('show');
    els.studentModal.style.display = 'flex';
    els.studentModal.style.visibility = 'visible';
    els.studentModal.style.opacity = '1';
    els.studentModal.style.pointerEvents = 'auto';
    els.studentModal.style.position = 'fixed';
    els.studentModal.style.inset = '0';
    els.studentModal.style.zIndex = '1400';
    syncBodyScrollState();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.setTimeout(function () {
      if (els.savedStudentRow && els.savedStudentRow.classList.contains('show') && els.btnUseSaved) {
        try {
          els.btnUseSaved.focus({ preventScroll: true });
        } catch (error) {
          els.btnUseSaved.focus();
        }
        return;
      }
      if (els.inputName) {
        try {
          els.inputName.focus({ preventScroll: true });
        } catch (error) {
          els.inputName.focus();
        }
      }
    }, 0);
  }

  function closeModal() {
    els.body.classList.remove('modal-open');
    els.studentModal.classList.remove('show');
    els.studentModal.style.display = 'none';
    els.studentModal.style.visibility = 'hidden';
    els.studentModal.style.opacity = '0';
    els.studentModal.style.pointerEvents = 'none';
    syncBodyScrollState();
  }

  function syncBodyScrollState() {
    const lightboxOpen = Boolean(els.imageLightbox && els.imageLightbox.classList.contains('is-open'));
    const modalOpen = Boolean(
      els.studentModal &&
      els.studentModal.classList.contains('show') &&
      els.studentModal.style.display !== 'none'
    );
    els.body.classList.toggle('scroll-lock', lightboxOpen || modalOpen);
  }

  function getTotals() {
    if (!state.session) {
      return { totalIndicators: 0, closedIndicators: 0, settled: 0, correct: 0, totalQuestions: 0 };
    }

    return state.session.indicators.reduce(function (acc, indicator) {
      const metrics = getIndicatorMetrics(indicator);
      acc.totalIndicators += 1;
      acc.closedIndicators += metrics.closed ? 1 : 0;
      acc.settled += metrics.settled;
      acc.correct += metrics.correct;
      acc.totalQuestions += metrics.total;
      return acc;
    }, { totalIndicators: 0, closedIndicators: 0, settled: 0, correct: 0, totalQuestions: 0 });
  }

  function getIndicatorMetrics(indicator) {
    const total = indicator.questions.length;
    const settled = indicator.questions.filter(function (question) {
      return isQuestionSettled(question.id);
    }).length;
    const correct = indicator.questions.filter(function (question) {
      return isQuestionCorrect(question.id);
    }).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    return {
      total: total,
      settled: settled,
      correct: correct,
      percent: percent,
      closed: settled === total,
      level: getLevel(percent)
    };
  }

  function getIndicatorFooter(metrics) {
    if (metrics.closed) {
      return 'Indicador cerrado con nivel ' + metrics.level + ' y ' + metrics.correct + ' respuesta(s) correcta(s).';
    }
    if (metrics.settled === 0) {
      return 'Indicador pendiente. Resuelve cada pregunta y verifica una por una.';
    }
    return 'Llevas ' + metrics.settled + ' pregunta(s) cerrada(s) de ' + metrics.total + '.';
  }

  function getQuestionStatus(questionId) {
    const status = state.status[questionId];
    const attempts = getAttemptCount(questionId);

    if (status === 'correct') {
      return {
        key: 'correct',
        label: 'Cerrada correcta',
        badgeClass: 'is-correct',
        cardClass: 'correct',
        attemptText: (attempts > 0 ? attempts + 1 : 1) + ' de 2',
        actionLabel: 'Pregunta cerrada'
      };
    }

    if (status === 'locked-wrong') {
      return {
        key: 'locked-wrong',
        label: 'Cerrada incorrecta',
        badgeClass: 'is-wrong',
        cardClass: 'wrong',
        attemptText: '2 de 2',
        actionLabel: 'Pregunta cerrada'
      };
    }

    if (status === 'retry') {
      return {
        key: 'retry',
        label: 'Última corrección',
        badgeClass: 'is-retry',
        cardClass: 'retry',
        attemptText: '1 de 2',
        actionLabel: 'Corregir respuesta'
      };
    }

    return {
      key: 'pending',
      label: 'Pendiente',
      badgeClass: 'is-pending',
      cardClass: '',
      attemptText: '0 de 2',
      actionLabel: 'Verificar respuesta'
    };
  }

  function getAttemptCount(questionId) {
    return Number(state.attempts[questionId] || 0);
  }

  function isQuestionLocked(questionId) {
    return state.status[questionId] === 'correct' || state.status[questionId] === 'locked-wrong';
  }

  function isQuestionSettled(questionId) {
    return isQuestionLocked(questionId);
  }

  function isQuestionCorrect(questionId) {
    return state.status[questionId] === 'correct';
  }

  function allQuestionsSettled() {
    return Boolean(state.session) && state.session.indicators.every(function (indicator) {
      return indicator.questions.every(function (question) {
        return isQuestionSettled(question.id);
      });
    });
  }

  function isQuestionComplete(question) {
    const answer = state.answers[question.id];
    if (question.type === 'single') return typeof answer === 'string' && answer.trim().length > 0;
    if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0;
    if (question.type === 'text') return typeof answer === 'string' && answer.trim().length > 0;
    if (question.type === 'order') {
      return Array.isArray(answer) && answer.length === question.answer.length && answer.every(Boolean);
    }
    return false;
  }

  function evaluateQuestion(question, answer) {
    if (question.type === 'single') {
      return normalizeText(answer) === normalizeText(question.answer);
    }

    if (question.type === 'multi') {
      return sameSet(answer, question.answers);
    }

    if (question.type === 'text') {
      return question.acceptable.some(function (valid) {
        return normalizeText(valid) === normalizeText(answer);
      });
    }

    if (question.type === 'order') {
      return question.answer.every(function (step, index) {
        return normalizeText(step) === normalizeText((answer[index] || ''));
      });
    }

    return false;
  }

  function formatExpectedAnswer(question) {
    if (question.type === 'multi') return question.answers.join(', ');
    if (question.type === 'text') return question.acceptable[0];
    if (question.type === 'order') return question.answer.join(' -> ');
    return question.answer;
  }

  function formatUserAnswer(question) {
    const answer = state.answers[question.id];
    if (!isQuestionComplete(question)) return 'Sin responder';
    if (question.type === 'multi') return answer.join(', ');
    if (question.type === 'order') return answer.join(' -> ');
    return String(answer);
  }

  function findQuestionById(questionId) {
    if (!state.session) return null;
    for (const indicator of state.session.indicators) {
      for (const question of indicator.questions) {
        if (question.id === questionId) return question;
      }
    }
    return null;
  }

  function buildSession() {
    const ctx = buildContext();
    return {
      variant: ctx.variant,
      context: ctx.meta,
      indicators: [
        buildIndicatorOne(ctx),
        buildIndicatorTwo(ctx),
        buildIndicatorThree(ctx)
      ].map(function (indicator) {
        return {
          id: indicator.id,
          title: indicator.title,
          description: indicator.description,
          questions: indicator.questions.map(cloneQuestion)
        };
      }),
      flashcards: buildFlashcards()
    };
  }

  function buildContext() {
    const device = pick(DEVICE_POOL);
    const consolePassword = pick(CONSOLE_PASSWORDS);
    const enableSecret = pick(ENABLE_SECRETS);
    const bannerText = pick(BANNER_TEXTS);
    const mgmtVlan = pick(VLAN_IDS);
    const subnet = pick(IP_NETWORKS);
    const host = pick(IP_HOSTS);
    const mgmtIp = '192.168.' + subnet + '.' + host;
    const gateway = '192.168.' + subnet + '.1';
    const userPort = pick(ACCESS_PORTS);
    const secondPort = pick(ACCESS_PORTS.filter(function (port) { return port !== userPort; }));
    const downPort = pick(DOWN_PORTS);
    const learnedMacPort = pick(['Fa0/3', 'Fa0/5', 'Fa0/7', 'Gi0/1']);
    const learnedMac = '00D0.BC' + pick(['12', '34', '56', '78']) + '.' + pick(['A1B2', 'C3D4', 'E5F6', '1122']);
    const decimalOctet = pick(DECIMAL_OCTETS);
    const binaryOctet = decimalToBinary8(decimalOctet);
    const vlanName = mgmtVlan === 1 ? 'DEFAULT' : 'ADMIN-' + mgmtVlan;

    return {
      device: device,
      consolePassword: consolePassword,
      enableSecret: enableSecret,
      bannerText: bannerText,
      mgmtVlan: mgmtVlan,
      mgmtIp: mgmtIp,
      gateway: gateway,
      mask: '255.255.255.0',
      userPort: userPort,
      secondPort: secondPort,
      downPort: downPort,
      learnedMac: learnedMac,
      learnedMacPort: learnedMacPort,
      decimalOctet: decimalOctet,
      binaryOctet: binaryOctet,
      vlanName: vlanName,
      variant: {
        label: device + ' · VLAN ' + mgmtVlan + ' · ' + mgmtIp
      },
      meta: {
        device: device,
        mgmtVlan: mgmtVlan,
        mgmtIp: mgmtIp,
        gateway: gateway
      }
    };
  }

  function buildIndicatorOne(ctx) {
    return {
      id: 'indicator-1',
      title: 'Indicador 1: Reconoce conceptos y comandos fundamentales de CCNA 1',
      description: 'Comprueba reconocimiento de conceptos básicos de red, dispositivos, medios, sistemas numéricos, comandos IOS y modos de operación.',
      questions: [
        qSingle(
          'i1-q1',
          '¿Cuál opción resume mejor el propósito principal de una red de datos en un centro educativo?',
          'Compartir recursos, servicios y comunicación entre dispositivos.',
          [
            'Compartir recursos, servicios y comunicación entre dispositivos.',
            'Sustituir por completo el trabajo del técnico.',
            'Eliminar la necesidad de configurar equipos.',
            'Servir únicamente para navegar en Internet.'
          ],
          'Piensa en comunicación, recursos y servicios, no en una sola aplicación.',
          'Una red permite comunicar dispositivos y compartir recursos y servicios de forma organizada.'
        ),
        qSingle(
          'i1-q2',
          '¿Cuál de los siguientes es un dispositivo final?',
          'Una PC del laboratorio.',
          [
            'Un switch de acceso.',
            'Un router de borde.',
            'Una PC del laboratorio.',
            'Un panel de parcheo.'
          ],
          'El dispositivo final es el que usa directamente la persona o el servicio.',
          'La PC es un dispositivo final; switch y router son dispositivos intermedios.'
        ),
        qSingle(
          'i1-q3',
          '¿Qué medio de red es el más resistente a la interferencia electromagnética?',
          'Fibra óptica.',
          [
            'Fibra óptica.',
            'Cable UTP.',
            'Cable coaxial.',
            'Par telefónico.'
          ],
          'Busca el medio que transporta luz y no señal eléctrica.',
          'La fibra óptica resiste mejor la interferencia electromagnética porque transmite mediante luz.'
        ),
        qSingle(
          'i1-q4',
          'Si el octeto decimal es ' + ctx.decimalOctet + ', ¿cuál representación binaria es correcta?',
          ctx.binaryOctet,
          shuffle([
            ctx.binaryOctet,
            decimalToBinary8((ctx.decimalOctet + 1) % 256),
            decimalToBinary8(Math.max(0, ctx.decimalOctet - 2)),
            decimalToBinary8((ctx.decimalOctet + 8) % 256)
          ]),
          'Recuerda que un octeto tiene 8 bits.',
          'La representación binaria correcta del octeto decimal ' + ctx.decimalOctet + ' es ' + ctx.binaryOctet + '.'
        ),
        qSingle(
          'i1-q5',
          'Si la consola muestra ' + ctx.device + '>, ¿en qué modo estás?',
          'EXEC de usuario.',
          [
            'EXEC privilegiado.',
            'Configuración global.',
            'EXEC de usuario.',
            'Configuración de interfaz.'
          ],
          'El símbolo > es la pista principal.',
          'El prompt con > corresponde al modo EXEC de usuario.'
        ),
        qText(
          'i1-q6',
          'Escribe el comando que te lleva de ' + ctx.device + '# a ' + ctx.device + '(config)#.',
          ['configure terminal', 'conf t'],
          'Se pide entrar al modo de configuración global.',
          'Desde EXEC privilegiado se usa configure terminal para entrar a configuración global.'
          ,
          'configure terminal'
        ),
        qText(
          'i1-q7',
          'Escribe el comando para entrar a la configuración de consola desde ' + ctx.device + '(config)#.',
          ['line console 0', 'line con 0'],
          'Se trata del submodo de línea local.',
          'La consola se configura con line console 0.',
          'line console 0'
        ),
        qText(
          'i1-q8',
          'Escribe el comando que cifra contraseñas almacenadas en texto plano dentro de la configuración.',
          ['service password-encryption'],
          'No confundas este comando con la contraseña segura del modo privilegiado.',
          'service password-encryption cifra contraseñas almacenadas en texto plano dentro de la configuración.',
          'service password-encryption'
        ),
        qSingle(
          'i1-q9',
          '¿En qué modo debe estar el prompt para aplicar el comando ip address ' + ctx.mgmtIp + ' ' + ctx.mask + '?',
          ctx.device + '(config-if)#',
          [
            ctx.device + '>',
            ctx.device + '#',
            ctx.device + '(config)#',
            ctx.device + '(config-if)#'
          ],
          'Ese comando se aplica dentro de una interfaz, no en configuración global.',
          'El comando ip address se ejecuta en modo de configuración de interfaz: (config-if)#.'
        ),
        qSingle(
          'i1-q10',
          'En un switch, ¿dónde configuramos normalmente la dirección IPv4 de administración?',
          'En la SVI, por ejemplo interface vlan ' + ctx.mgmtVlan + '.',
          [
            'En cualquier puerto físico FastEthernet.',
            'En la SVI, por ejemplo interface vlan ' + ctx.mgmtVlan + '.',
            'En line console 0.',
            'En show ip interface brief.'
          ],
          'Se trata de una interfaz lógica del switch.',
          'La dirección IPv4 de administración se configura en una SVI, como interface vlan ' + ctx.mgmtVlan + '.'
        )
      ]
    };
  }

  function buildIndicatorTwo(ctx) {
    const runningLead = codeLead(
      ctx.device + '# show running-config\n' +
      'hostname ' + ctx.device + '\n' +
      'enable secret 5 $1$8e...\n' +
      'service password-encryption\n' +
      'banner motd #' + ctx.bannerText + '#\n' +
      'line con 0\n' +
      ' password ' + ctx.consolePassword + '\n' +
      ' login'
    );

    const briefLead = codeLead(
      ctx.device + '# show ip interface brief\n' +
      'Interface              IP-Address      OK? Method Status                Protocol\n' +
      'Vlan' + ctx.mgmtVlan + '                ' + ctx.mgmtIp + '   YES manual administratively down down\n' +
      expandPortName(ctx.userPort) + '        unassigned      YES unset  up                    up\n' +
      expandPortName(ctx.downPort) + '       unassigned      YES unset  down                  down'
    );

    const statusLead = codeLead(
      ctx.device + '# show interfaces status\n' +
      'Port      Name               Status       Vlan  Duplex Speed Type\n' +
      ctx.userPort + '   PC-LAB             connected    ' + ctx.mgmtVlan + '     a-full a-100 10/100BaseTX\n' +
      ctx.downPort + '   --                 notconnect   1     auto   auto  10/100BaseTX'
    );

    const vlanLead = codeLead(
      ctx.device + '# show vlan brief\n' +
      'VLAN Name                             Status    Ports\n' +
      '1    default                          active    ' + ctx.secondPort + '\n' +
      ctx.mgmtVlan + '   ' + ctx.vlanName + '                         active    ' + ctx.userPort + '\n' +
      '20   ESTUDIANTES                      active    ' + ctx.downPort
    );

    const macLead = codeLead(
      ctx.device + '# show mac address-table dynamic\n' +
      '          Mac Address Table\n' +
      '-------------------------------------------\n' +
      'Vlan    Mac Address       Type        Ports\n' +
      ctx.mgmtVlan + '     ' + ctx.learnedMac + '    DYNAMIC     ' + ctx.learnedMacPort
    );

    const invalidLead = codeLead(
      ctx.device + '> configure terminal\n' +
      '         ^\n' +
      '% Invalid input detected at \'^\' marker.'
    );

    return {
      id: 'indicator-2',
      title: 'Indicador 2: Interpreta salidas y verifica configuraciones básicas',
      description: 'Evalúa lectura de salidas show, diferencia entre configuraciones activa y guardada, interpretación de interfaces y detección de estados anómalos.',
      questions: [
        qText(
          'i2-q1',
          'Escribe el comando que produjo la salida mostrada.',
          ['show running-config', 'sh running-config', 'show run', 'sh run'],
          'Observa si ves líneas completas de configuración o solo un resumen de interfaces.',
          'La salida corresponde a show running-config porque lista directamente líneas de configuración activas.',
          'show running-config',
          runningLead
        ),
        qSingle(
          'i2-q2',
          '¿Cuál afirmación describe correctamente la diferencia entre running-config y startup-config?',
          'running-config es la configuración activa y startup-config es la guardada para el reinicio.',
          [
            'running-config es la configuración activa y startup-config es la guardada para el reinicio.',
            'running-config se guarda en ROM y startup-config en RAM.',
            'No hay diferencia real entre ambas.',
            'startup-config muestra el estado de puertos y running-config la VLAN.'
          ],
          'Una vive activa en RAM; la otra debe sobrevivir al reinicio.',
          'running-config es la configuración activa; startup-config es la configuración guardada que cargará tras reiniciar.'
        ),
        qSingle(
          'i2-q3',
          'Según la salida, ¿qué problema presenta la SVI de administración?',
          'Tiene IP configurada, pero sigue administrativamente apagada.',
          [
            'No tiene dirección IP.',
            'Tiene IP configurada, pero sigue administrativamente apagada.',
            'Está conectada correctamente y lista para operar.',
            'El problema es la contraseña de consola.'
          ],
          'Fíjate en las columnas Status y Protocol.',
          'La SVI ya tiene IP, pero aparece administratively down / down; todavía falta activarla o revisar su estado.',
          briefLead
        ),
        qText(
          'i2-q4',
          'Escribe el comando exacto que generó la salida anterior.',
          ['show ip interface brief', 'sh ip int brief'],
          'Se pide el comando show resumido de interfaces con IP.',
          'La salida corresponde a show ip interface brief.',
          'show ip interface brief',
          briefLead
        ),
        qSingle(
          'i2-q5',
          'Según la salida, ¿qué puerto está conectado?',
          ctx.userPort,
          [
            ctx.userPort,
            ctx.downPort,
            'Vlan' + ctx.mgmtVlan,
            'Ninguno'
          ],
          'Busca el valor connected en la columna Status.',
          'El puerto ' + ctx.userPort + ' aparece como connected en la salida de show interfaces status.',
          statusLead
        ),
        qSingle(
          'i2-q6',
          'Según la tabla, ¿en cuál VLAN está asociado el puerto ' + ctx.userPort + '?',
          'VLAN ' + ctx.mgmtVlan,
          [
            'VLAN 1',
            'VLAN ' + ctx.mgmtVlan,
            'VLAN 20',
            'No aparece asignado'
          ],
          'Debes cruzar el puerto con la línea donde aparece listado.',
          'En show vlan brief el puerto ' + ctx.userPort + ' aparece dentro de la VLAN ' + ctx.mgmtVlan + '.',
          vlanLead
        ),
        qSingle(
          'i2-q7',
          '¿Qué explica mejor el error que aparece en pantalla?',
          'Se intentó ejecutar configure terminal desde el modo EXEC de usuario.',
          [
            'Se intentó ejecutar configure terminal desde el modo EXEC de usuario.',
            'La dirección IP está mal escrita.',
            'La VLAN está inactiva.',
            'La contraseña enable secret no existe.'
          ],
          'Observa primero el prompt y luego el comando.',
          'El comando configure terminal requiere EXEC privilegiado; desde ' + ctx.device + '> primero se debe usar enable.',
          invalidLead
        ),
        qText(
          'i2-q8',
          'Si al reiniciar el switch desaparece la configuración recién aplicada, escribe el comando que probablemente faltó ejecutar.',
          ['copy running-config startup-config', 'copy run start', 'write memory', 'wr'],
          'Piensa en el paso que lleva la configuración activa a la guardada.',
          'Si los cambios se pierden tras reiniciar, normalmente faltó copy running-config startup-config.',
          'copy running-config startup-config'
        ),
        qSingle(
          'i2-q9',
          'Según la salida, ¿en qué puerto aprendió el switch la MAC mostrada?',
          ctx.learnedMacPort,
          [
            ctx.learnedMacPort,
            ctx.userPort,
            ctx.downPort,
            'Vlan' + ctx.mgmtVlan
          ],
          'Busca la columna Ports en la tabla de MAC.',
          'La MAC ' + ctx.learnedMac + ' fue aprendida por el puerto ' + ctx.learnedMacPort + '.',
          macLead
        ),
        qSingle(
          'i2-q10',
          'Si una interfaz aparece con Status up y Protocol down, ¿qué lectura inicial es la más prudente?',
          'La interfaz necesita más revisión; no está completamente operativa aunque tenga parte del estado levantado.',
          [
            'La interfaz necesita más revisión; no está completamente operativa aunque tenga parte del estado levantado.',
            'Todo funciona perfectamente.',
            'La configuración ya quedó guardada en startup-config.',
            'Eso confirma que el banner motd está activo.'
          ],
          'Status y Protocol no significan exactamente lo mismo.',
          'Cuando una interfaz no muestra ambos estados operativos, todavía hay un problema de conectividad o configuración por revisar.'
        )
      ]
    };
  }

  function buildIndicatorThree(ctx) {
    const badSequenceLead = codeLead(
      ctx.device + '# configure terminal\n' +
      ctx.device + '(config)# ip address ' + ctx.mgmtIp + ' ' + ctx.mask + '\n' +
      '                 ^\n' +
      '% Invalid input detected at \'^\' marker.'
    );

    const consoleLead = codeLead(
      ctx.device + '# show running-config\n' +
      'line con 0\n' +
      ' password ' + ctx.consolePassword + '\n' +
      '!\n'
    );

    return {
      id: 'indicator-3',
      title: 'Indicador 3: Aplica secuencias lógicas de configuración y diagnóstico',
      description: 'Valora secuencias correctas de configuración, escritura de comandos, verificación, diagnóstico elemental y corrección de errores frecuentes.',
      questions: [
        qOrder(
          'i3-q1',
          'Ordena una secuencia mínima y correcta para dejar configurado el acceso por consola y la seguridad básica del equipo.',
          [
            ctx.device + '> enable',
            ctx.device + '# configure terminal',
            ctx.device + '(config)# hostname ' + ctx.device,
            ctx.device + '(config)# enable secret ' + ctx.enableSecret,
            ctx.device + '(config)# line console 0',
            ctx.device + '(config-line)# password ' + ctx.consolePassword,
            ctx.device + '(config-line)# login'
          ],
          shuffle([
            ctx.device + '(config)# hostname ' + ctx.device,
            ctx.device + '(config-line)# password ' + ctx.consolePassword,
            ctx.device + '# configure terminal',
            ctx.device + '> enable',
            ctx.device + '(config-line)# login',
            ctx.device + '(config)# enable secret ' + ctx.enableSecret,
            ctx.device + '(config)# line console 0'
          ]),
          'Sigue el orden lógico de modos: usuario, privilegiado, configuración global y línea.',
          'La secuencia correcta respeta el prompt, el modo y la lógica de configuración antes de pedir acceso por consola.'
        ),
        qText(
          'i3-q2',
          'Escribe el comando para activar una interfaz que aparece administratively down.',
          ['no shutdown', 'no shut'],
          'Es el comando clásico para habilitar la interfaz desde (config-if)#.',
          'El comando esperado es no shutdown.',
          'no shutdown'
        ),
        qSingle(
          'i3-q3',
          '¿Qué corrección hace falta en la secuencia mostrada?',
          'Entrar primero a interface vlan ' + ctx.mgmtVlan + ' antes de aplicar ip address.',
          [
            'Entrar primero a interface vlan ' + ctx.mgmtVlan + ' antes de aplicar ip address.',
            'Usar show ip interface brief antes de todo.',
            'Salir al modo EXEC de usuario.',
            'Eliminar enable secret.'
          ],
          'El error no es la IP; es el contexto desde donde se intenta aplicar.',
          'ip address debe configurarse dentro de una interfaz, por ejemplo interface vlan ' + ctx.mgmtVlan + ', no desde configuración global.',
          badSequenceLead
        ),
        qOrder(
          'i3-q4',
          'Ordena una secuencia razonable para corregir una SVI que ya tiene IP, pero aparece administratively down.',
          [
            ctx.device + '# configure terminal',
            ctx.device + '(config)# interface vlan ' + ctx.mgmtVlan,
            ctx.device + '(config-if)# no shutdown',
            ctx.device + '(config-if)# end',
            ctx.device + '# show ip interface brief'
          ],
          shuffle([
            ctx.device + '(config-if)# no shutdown',
            ctx.device + '# configure terminal',
            ctx.device + '(config)# interface vlan ' + ctx.mgmtVlan,
            ctx.device + '# show ip interface brief',
            ctx.device + '(config-if)# end'
          ]),
          'Primero corriges la interfaz y luego verificas el resultado.',
          'La secuencia correcta entra a la SVI, aplica no shutdown, sale y verifica con show ip interface brief.'
        ),
        qMulti(
          'i3-q5',
          'Selecciona los dos comandos más útiles para comprobar que la configuración quedó activa y además guardada para un reinicio.',
          ['show running-config', 'show startup-config'],
          [
            'show running-config',
            'show startup-config',
            'show interfaces status',
            'line console 0'
          ],
          'Uno comprueba lo activo y el otro lo guardado.',
          'show running-config verifica la configuración activa y show startup-config confirma si ya quedó guardada para el reinicio.'
        ),
        qText(
          'i3-q6',
          'Un estudiante configuró la IP de administración y quiere comprobar rápido si la SVI quedó bien. Escribe el comando que debe ejecutar primero.',
          ['show ip interface brief', 'sh ip int brief'],
          'Se pide un comando de verificación inmediata del estado y la IP de las interfaces.',
          'show ip interface brief permite verificar rápidamente la IP y el estado de la SVI.',
          'show ip interface brief'
        ),
        qText(
          'i3-q7',
          'Escribe un comando válido para guardar la configuración activa en NVRAM.',
          ['copy running-config startup-config', 'copy run start', 'write memory', 'wr'],
          'Debe trasladar la configuración activa a la guardada.',
          'Un comando válido es copy running-config startup-config.',
          'copy running-config startup-config'
        ),
        qSingle(
          'i3-q8',
          'Si el switch no conoce la MAC destino de una trama dentro de la misma VLAN, ¿qué comportamiento básico esperamos?',
          'Inundará la trama dentro de esa VLAN hasta encontrar el destino.',
          [
            'Inundará la trama dentro de esa VLAN hasta encontrar el destino.',
            'La enviará directamente al router siempre.',
            'Apagará el puerto de origen.',
            'Borrará automáticamente la VLAN.'
          ],
          'Piensa en el comportamiento inicial del switch cuando aún no sabe por qué puerto reenviar.',
          'Cuando la MAC destino es desconocida, el switch inunda la trama dentro de la VLAN correspondiente.'
        ),
        qText(
          'i3-q9',
          'Escribe el comando que consultarías para verificar a qué VLAN pertenece un puerto específico del switch.',
          ['show vlan brief', 'sh vlan brief'],
          'Se pide una verificación de pertenencia de puertos a VLAN.',
          'show vlan brief permite ver VLAN y puertos asociados.',
          'show vlan brief'
        ),
        qSingle(
          'i3-q10',
          'Según la salida, ¿qué comando falta para que la contraseña de consola realmente se exija al conectarse?',
          'login',
          [
            'login',
            'enable',
            'reload',
            'show running-config'
          ],
          'La contraseña puede estar escrita, pero hace falta indicar que la línea la utilice.',
          'En line con 0, si existe password pero falta login, la contraseña no se aplicará como se espera.',
          consoleLead
        )
      ]
    };
  }

  function buildFlashcards() {
    return shuffle(FLASHCARD_BANK.slice())
      .slice(0, 12)
      .map(function (item, index) {
        return {
          id: 'card-' + index + '-' + slugify(item[0]),
          front: item[0],
          question: item[1],
          back: item[2]
        };
      });
  }

  function getLevel(percent) {
    if (percent >= 85) return 'Avanzado';
    if (percent >= 60) return 'Intermedio';
    return 'Inicial';
  }

  function getGeneralObservation() {
    const totals = getTotals();
    const percent = totals.totalQuestions ? Math.round((totals.correct / totals.totalQuestions) * 100) : 0;
    const weakest = state.session.indicators
      .map(function (indicator) {
        const metrics = getIndicatorMetrics(indicator);
        return { title: indicator.title, percent: metrics.percent, level: metrics.level };
      })
      .sort(function (a, b) { return a.percent - b.percent; })[0];

    if (percent >= 85) {
      return 'Desempeño global avanzado. El estudiante resuelve con seguridad comandos, salidas show y secuencias básicas de configuración. Aun así, conviene mantener repaso activo en ' + weakest.title.toLowerCase() + ' para sostener consistencia.';
    }

    if (percent >= 60) {
      return 'Desempeño intermedio. El estudiante reconoce la mayoría de los conceptos y logra interpretar salidas simples, pero todavía necesita consolidar precisión y criterio en ' + weakest.title.toLowerCase() + '.';
    }

    return 'Desempeño inicial. El estudiante requiere reforzar lectura de prompts, relación entre comando y modo, interpretación de salidas y secuencias básicas, especialmente en ' + weakest.title.toLowerCase() + '.';
  }

  function qSingle(id, prompt, answer, options, remediation, explanation, leadHtml) {
    return { id: id, type: 'single', prompt: prompt, answer: answer, options: options, hint: remediation, remediation: remediation, explanation: explanation, leadHtml: leadHtml || '' };
  }

  function qMulti(id, prompt, answers, options, remediation, explanation, leadHtml) {
    return { id: id, type: 'multi', prompt: prompt, answers: answers, options: options, hint: remediation, remediation: remediation, explanation: explanation, leadHtml: leadHtml || '' };
  }

  function qText(id, prompt, acceptable, remediation, explanation, placeholder, leadHtml) {
    return { id: id, type: 'text', prompt: prompt, acceptable: acceptable, hint: remediation, remediation: remediation, explanation: explanation, placeholder: placeholder, leadHtml: leadHtml || '' };
  }

  function qOrder(id, prompt, answer, options, remediation, explanation, leadHtml) {
    return { id: id, type: 'order', prompt: prompt, answer: answer, options: options, hint: remediation, remediation: remediation, explanation: explanation, leadHtml: leadHtml || '' };
  }

  function codeLead(content) {
    return '<pre class="output-box">' + escapeHtml(content) + '</pre>';
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return parsed && parsed.version === 2 ? parsed : defaultState();
    } catch (error) {
      return defaultState();
    }
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (!raw) return defaultPrefs();
      return Object.assign(defaultPrefs(), JSON.parse(raw));
    } catch (error) {
      return defaultPrefs();
    }
  }

  function saveState() {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function savePrefs() {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }

  function defaultState() {
    return {
      version: 2,
      student: null,
      session: null,
      answers: {},
      attempts: {},
      status: {},
      hints: {},
      cardReveal: {},
      startedAt: null
    };
  }

  function defaultPrefs() {
    return {
      contrast: false,
      easyMode: false,
      practiceOnly: false,
      fontScale: 1
    };
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sameSet(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const left = a.map(normalizeText).sort();
    const right = b.map(normalizeText).sort();
    return left.every(function (item, index) {
      return item === right[index];
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function cloneQuestion(question) {
    return questionFactories[question.type]
      ? JSON.parse(JSON.stringify(question))
      : question;
  }

  function decimalToBinary8(number) {
    return Number(number).toString(2).padStart(8, '0');
  }

  function expandPortName(port) {
    return port
      .replace(/^Fa/i, 'FastEthernet')
      .replace(/^Gi/i, 'GigabitEthernet');
  }
})();
