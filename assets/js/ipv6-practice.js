'use strict';

(function () {
  const STORAGE_KEY = 'ccna1-ipv6-practice-v1';

  const MODULE_BANK = [
    {
      id: 'notation',
      title: 'Bloque 1: Estructura y compresion',
      description: 'Preguntas tomadas de la parte del workbook sobre 128 bits, hextetos, expansion y uso correcto de ::.',
      questions: [
        {
          id: 'notation-1',
          prompt: '¿Cuantos hextetos componen una direccion IPv6 completa?',
          answer: '8 hextetos',
          options: ['4 hextetos', '6 hextetos', '8 hextetos', '16 hextetos'],
          explanation: 'IPv6 usa 128 bits repartidos en 8 hextetos. Cada hexteto tiene 16 bits.'
        },
        {
          id: 'notation-2',
          prompt: '¿Cuantos bits representa un hexteto?',
          answer: '16 bits',
          options: ['4 bits', '8 bits', '16 bits', '32 bits'],
          explanation: 'El workbook recalca que un hexteto es un grupo hexadecimal de 16 bits.'
        },
        {
          id: 'notation-3',
          prompt: '¿Cuantas veces puede aparecer "::" en una misma direccion IPv6 valida?',
          answer: 'Una sola vez',
          options: ['Ninguna, IPv6 no la usa', 'Una sola vez', 'Dos veces', 'Tantas veces como haya grupos 0000'],
          explanation: 'La compresion con :: solo puede usarse una vez para evitar ambiguedad al reexpandir la direccion.'
        },
        {
          id: 'notation-4',
          prompt: 'Selecciona la expansion correcta de FE80::1.',
          answer: 'FE80:0000:0000:0000:0000:0000:0000:0001',
          options: [
            'FE80:0000:0000:0000:0000:0000:0000:0001',
            'FE80:0000:0000:0000:0000:0000:0001',
            'FE80:0000:0000:0000:0000:0001:0000:0001',
            'FE80:0000:0000:0000:0000:0000:0000:0000:0001'
          ],
          explanation: 'FE80::1 representa 8 hextetos completos; :: sustituye todos los grupos 0000 intermedios.'
        },
        {
          id: 'notation-5',
          prompt: '¿Cual es la abreviacion mas corta y correcta de 3210:0000:0000:0000:0000:0000:0000:0000?',
          answer: '3210::',
          options: ['3210::', '3210:0::', '3210::0', '3210:0000::'],
          explanation: 'Primero se quitan ceros a la izquierda y luego se compacta la corrida continua mas larga de grupos 0000.'
        }
      ]
    },
    {
      id: 'prefix',
      title: 'Bloque 2: Prefijo e ID de interfaz',
      description: 'Alineado con el tramo del Excel donde se recomienda /64 para LAN y se separa prefijo de red de ID de interfaz.',
      questions: [
        {
          id: 'prefix-1',
          prompt: '¿Que longitud de prefijo recomienda el material para LAN y redes con SLAAC?',
          answer: '/64',
          options: ['/48', '/56', '/64', '/96'],
          explanation: 'El workbook insiste en que /64 es la recomendacion base para LAN porque SLAAC usa 64 bits para el ID de interfaz.'
        },
        {
          id: 'prefix-2',
          prompt: 'En 2001:DB8:ACAD:A::15/64, ¿cual es el prefijo de red?',
          answer: '2001:DB8:ACAD:A::/64',
          options: [
            '2001:DB8:ACAD:A::/64',
            '2001:DB8:ACAD::/64',
            '2001:DB8:ACAD:A::15/64',
            '2001:DB8::15/64'
          ],
          explanation: 'Con /64, los primeros 64 bits forman el prefijo. El host concreto queda fuera del prefijo.'
        },
        {
          id: 'prefix-3',
          prompt: 'Con un prefijo /64, ¿cuantos bits quedan para el ID de interfaz?',
          answer: '64 bits',
          options: ['16 bits', '32 bits', '48 bits', '64 bits'],
          explanation: 'IPv6 separa 64 bits para prefijo y 64 bits para la interfaz en el escenario recomendado por el workbook.'
        },
        {
          id: 'prefix-4',
          prompt: 'En 2001:DB8:ACAD:A::15/64, ¿que fragmento corresponde al ID de interfaz completo?',
          answer: '0000:0000:0000:0015',
          options: [
            '2001:DB8:ACAD:000A',
            '0000:0000:0000:0015',
            'ACAD:000A:0000:0015',
            '2001:DB8:0000:0015'
          ],
          explanation: 'Los ultimos 64 bits pertenecen a la interfaz. El workbook separa siempre prefijo e ID de interfaz.'
        },
        {
          id: 'prefix-5',
          prompt: '¿Entre que valores puede ir la longitud de prefijo IPv6?',
          answer: 'De /0 a /128',
          options: ['De /0 a /64', 'De /0 a /128', 'De /1 a /255', 'De /16 a /128'],
          explanation: 'La longitud de prefijo puede ir de /0 a /128 porque una direccion IPv6 completa tiene 128 bits.'
        }
      ]
    },
    {
      id: 'types',
      title: 'Bloque 3: Tipos de direccion',
      description: 'Cubre GUA, LLA, ULA, loopback, direccion no especificada y la asignacion 2000::/3 que aparece en el material base.',
      questions: [
        {
          id: 'types-1',
          prompt: '¿Que tipo de direccion es 2001:DB8:ACAD::1?',
          answer: 'Unicast global (GUA)',
          options: ['Unicast global (GUA)', 'Link-local (LLA)', 'Local unica (ULA)', 'Multicast'],
          explanation: 'El workbook ubica las GUA dentro del espacio 2000::/3 y las compara con direcciones publicas IPv4.'
        },
        {
          id: 'types-2',
          prompt: '¿Que tipo de direccion es FE80::1?',
          answer: 'Link-local (LLA)',
          options: ['Unicast global (GUA)', 'Link-local (LLA)', 'Local unica (ULA)', 'Direccion no especificada'],
          explanation: 'FE80::/10 se usa para comunicacion local en el mismo enlace y no se enruta.'
        },
        {
          id: 'types-3',
          prompt: '¿Que tipo de direccion es FD00:1234::10?',
          answer: 'Local unica (ULA)',
          options: ['Anycast', 'Local unica (ULA)', 'Loopback', 'Multicast'],
          explanation: 'Las ULA parten del espacio FC00::/7 y el workbook las compara conceptualmente con las privadas RFC1918.'
        },
        {
          id: 'types-4',
          prompt: '¿Que representa ::1/128?',
          answer: 'Direccion loopback',
          options: ['Direccion loopback', 'Direccion no especificada', 'Direccion multicast de router', 'Direccion link-local'],
          explanation: '::1 es el bucle interno del host, equivalente funcional al 127.0.0.1 de IPv4.'
        },
        {
          id: 'types-5',
          prompt: '¿Que representa la direccion ::?',
          answer: 'Direccion no especificada',
          options: ['Direccion no especificada', 'Direccion anycast', 'Link-local minima', 'Prefijo ULA'],
          explanation: 'El workbook indica que se usa como origen cuando el host aun no tiene direccion asignada.'
        }
      ]
    },
    {
      id: 'multicast',
      title: 'Bloque 4: Multicast y anycast',
      description: 'Este bloque repasa FF02::1, FF02::2, multicast solicitada y el hecho de que anycast no usa prefijo exclusivo.',
      questions: [
        {
          id: 'multicast-1',
          prompt: '¿Que grupo representa FF02::1?',
          answer: 'Todos los nodos IPv6 del enlace local',
          options: [
            'Todos los nodos IPv6 del enlace local',
            'Todos los routers IPv6 del enlace local',
            'Todos los servidores DHCPv6',
            'Todas las interfaces loopback'
          ],
          explanation: 'FF02::1 es la multicast conocida para todos los dispositivos IPv6 del enlace.'
        },
        {
          id: 'multicast-2',
          prompt: '¿Que grupo representa FF02::2?',
          answer: 'Todos los routers IPv6 del enlace local',
          options: [
            'Todos los routers IPv6 del enlace local',
            'Todos los nodos IPv6 del enlace local',
            'Todos los clientes SLAAC',
            'Todos los vecinos descubiertos por NDP'
          ],
          explanation: 'FF02::2 apunta a todos los routers IPv6 del enlace local.'
        },
        {
          id: 'multicast-3',
          prompt: 'Segun el material, ¿puede una direccion multicast ser direccion de origen?',
          answer: 'No, nunca',
          options: ['Si, siempre', 'Solo en SLAAC', 'No, nunca', 'Solo si es FF02::1'],
          explanation: 'El workbook remarca de forma explicita que una direccion multicast nunca puede ser la de origen.'
        },
        {
          id: 'multicast-4',
          prompt: '¿Cual es el prefijo de la direccion solicited-node multicast?',
          answer: 'FF02:0:0:0:0:1:FF00::/104',
          options: [
            'FF02:0:0:0:0:1:FF00::/104',
            'FF02::/16',
            'FE80::/10',
            '2000::/3'
          ],
          explanation: 'La multicast solicitada se construye con ese prefijo y los ultimos 24 bits de la direccion unicast.'
        },
        {
          id: 'multicast-5',
          prompt: '¿Que afirmacion describe mejor a anycast en IPv6?',
          answer: 'Usa el mismo rango que unicast global y entrega al nodo mas cercano',
          options: [
            'Usa el mismo rango que unicast global y entrega al nodo mas cercano',
            'Es una variante de FE80::/10',
            'Siempre usa FF00::/12',
            'Tiene un prefijo reservado exclusivo llamado AC00::/8'
          ],
          explanation: 'El workbook aclara que anycast no tiene prefijo especial; reutiliza rango unicast y se enruta al nodo mas cercano.'
        }
      ]
    },
    {
      id: 'slaac',
      title: 'Bloque 5: SLAAC, RS y RA',
      description: 'Aterriza la parte dinamica del workbook: mensajes RS, anuncios RA, contenido de esos anuncios y la relacion entre /64 y autoconfiguracion.',
      questions: [
        {
          id: 'slaac-1',
          prompt: '¿Que mensaje envia primero un host para descubrir routers IPv6 en su enlace?',
          answer: 'RS (Router Solicitation)',
          options: [
            'RS (Router Solicitation)',
            'RA (Router Advertisement)',
            'ARPv6',
            'DHCPDISCOVER'
          ],
          explanation: 'El workbook indica que el host envia RS y despues el router responde con RA.'
        },
        {
          id: 'slaac-2',
          prompt: '¿Que mensaje responde el router para orientar al host sobre su red IPv6?',
          answer: 'RA (Router Advertisement)',
          options: [
            'RA (Router Advertisement)',
            'RS (Router Solicitation)',
            'NS (Neighbor Solicitation)',
            'TCP SYN'
          ],
          explanation: 'Los RA informan al host sobre el prefijo, puerta de enlace y otra informacion util para autoconfiguracion.'
        },
        {
          id: 'slaac-3',
          prompt: '¿Que informacion puede llevar un RA segun el material?',
          answer: 'Prefijo, gateway predeterminado y DNS/dominio',
          options: [
            'Solo la MAC del router',
            'Prefijo, gateway predeterminado y DNS/dominio',
            'Solo la direccion loopback del router',
            'Usuarios y contraseñas de la LAN'
          ],
          explanation: 'El workbook enumera prefijo, longitud, gateway por defecto y datos de DNS/dominio como informacion asociada al RA.'
        },
        {
          id: 'slaac-4',
          prompt: '¿Por que el material recomienda /64 para LAN?',
          answer: 'Porque SLAAC usa 64 bits para el ID de interfaz',
          options: [
            'Porque asi IPv6 se vuelve privado',
            'Porque SLAAC usa 64 bits para el ID de interfaz',
            'Porque evita usar link-local',
            'Porque lo exige NAT'
          ],
          explanation: 'La recomendacion de /64 esta ligada directamente a la autoconfiguracion sin estado.'
        },
        {
          id: 'slaac-5',
          prompt: 'El workbook menciona dos formas de obtener el ID de interfaz en direccionamiento dinamico GUA. ¿Cuales son?',
          answer: 'EUI-64 o generacion aleatoria',
          options: [
            'EUI-64 o generacion aleatoria',
            'NAT o PAT',
            'ARP o RARP',
            'STP o VTP'
          ],
          explanation: 'En la nota del material aparece “Explicar EUI-64 y generacion aleatoria”.'
        }
      ]
    },
    {
      id: 'ios',
      title: 'Bloque 6: Cisco IOS',
      description: 'Refuerza la idea operativa principal del material: si el router no enruta IPv6 o no apoya SLAAC, revisar primero la habilitacion global.',
      questions: [
        {
          id: 'ios-1',
          prompt: '¿Que comando global habilita el enrutamiento IPv6 en un router Cisco?',
          answer: 'ipv6 unicast-routing',
          options: [
            'ipv6 unicast-routing',
            'ip routing ipv6',
            'enable ipv6 router',
            'ipv6 route enable'
          ],
          explanation: 'Es el comando clave del workbook y el primero que debe revisarse cuando algo falla.'
        },
        {
          id: 'ios-2',
          prompt: 'Si los hosts tienen direccion IPv6 pero no salen de su enlace local, ¿que conviene revisar primero?',
          answer: 'Que exista ipv6 unicast-routing',
          options: [
            'Que exista ipv6 unicast-routing',
            'Que el host use NAT',
            'Que la interfaz loopback este desactivada',
            'Que el prefijo sea /96'
          ],
          explanation: 'El material lo dice de forma explicita: primero se revisa la habilitacion global del enrutamiento IPv6.'
        },
        {
          id: 'ios-3',
          prompt: '¿Que comando asigna una GUA a una interfaz Cisco en los ejemplos del curso?',
          answer: 'ipv6 address 2001:DB8:1::1/64',
          options: [
            'ipv6 address 2001:DB8:1::1/64',
            'ip address 2001:DB8:1::1/64',
            'ipv6 gateway 2001:DB8:1::1',
            'interface ipv6 2001:DB8:1::1/64'
          ],
          explanation: 'La sintaxis se aplica dentro de la interfaz y mantiene el prefijo /64 recomendado por el curso.'
        },
        {
          id: 'ios-4',
          prompt: '¿Que afirmacion coincide con la direccion link-local en el contexto Cisco/IPv6?',
          answer: 'Es obligatoria para cada dispositivo con IPv6 en el enlace',
          options: [
            'Solo existe si hay NAT',
            'Es obligatoria para cada dispositivo con IPv6 en el enlace',
            'Se usa para Internet publico',
            'Solo la usan routers anycast'
          ],
          explanation: 'Las link-local son necesarias para la comunicacion local y aparecen como requisito base en el material.'
        },
        {
          id: 'ios-5',
          prompt: '¿Que secuencia es la mas coherente para iniciar una configuracion IPv6 minima en Cisco IOS?',
          answer: 'enable → configure terminal → ipv6 unicast-routing → interface g0/0',
          options: [
            'enable → configure terminal → ipv6 unicast-routing → interface g0/0',
            'configure terminal → ipv6 address → enable → g0/0',
            'ipv6 unicast-routing → enable → copy run start → interface g0/0',
            'enable → ping ipv6 → interface g0/0 → configure terminal'
          ],
          explanation: 'El orden operativo arranca en modo privilegiado, pasa a configuracion global y habilita IPv6 antes de entrar a la interfaz.'
        }
      ]
    }
  ];

  const els = {};

  let state = loadState();

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindElements();
    bindEvents();
    renderModal();
    renderWorkspace();
  }

  function bindElements() {
    els.studentModal = document.getElementById('studentModal');
    els.studentForm = document.getElementById('studentForm');
    els.savedStudentRow = document.getElementById('savedStudentRow');
    els.savedStudentLabel = document.getElementById('savedStudentLabel');
    els.btnUseSaved = document.getElementById('btnUseSaved');
    els.inputName = document.getElementById('inputName');
    els.inputGroup = document.getElementById('inputGroup');
    els.inputDate = document.getElementById('inputDate');

    els.studentChip = document.getElementById('studentChip');
    els.groupChip = document.getElementById('groupChip');
    els.practiceStatus = document.getElementById('practiceStatus');
    els.statModules = document.getElementById('statModules');
    els.statAnswered = document.getElementById('statAnswered');
    els.statCorrect = document.getElementById('statCorrect');
    els.scoreValue = document.getElementById('scoreValue');
    els.btnChangeStudent = document.getElementById('btnChangeStudent');
    els.btnNewPractice = document.getElementById('btnNewPractice');
    els.btnExportPdf = document.getElementById('btnExportPdf');
    els.practiceMount = document.getElementById('practiceMount');
    els.reportShell = document.getElementById('reportShell');
    els.reportKpis = document.getElementById('reportKpis');
    els.reportContent = document.getElementById('reportContent');
  }

  function bindEvents() {
    els.studentForm.addEventListener('submit', handleStudentSubmit);
    els.btnUseSaved.addEventListener('click', continueSavedPractice);
    els.btnChangeStudent.addEventListener('click', openModal);
    els.btnNewPractice.addEventListener('click', createFreshPractice);
    els.btnExportPdf.addEventListener('click', exportPdf);

    els.practiceMount.addEventListener('change', function (event) {
      const input = event.target;
      if (!input.matches('input[type="radio"][data-question-id]')) return;
      state.answers[input.dataset.questionId] = input.value;
      saveState();
      renderWorkspace();
    });

    els.practiceMount.addEventListener('click', function (event) {
      const button = event.target.closest('[data-review-module]');
      if (!button) return;
      reviewModule(button.dataset.reviewModule);
    });
  }

  function handleStudentSubmit(event) {
    event.preventDefault();
    const formData = new FormData(els.studentForm);
    const student = {
      name: String(formData.get('name') || '').trim(),
      group: String(formData.get('group') || '').trim(),
      date: String(formData.get('date') || '').trim()
    };

    if (!student.name || !student.group || !student.date) return;

    state.student = student;
    state.session = buildSession();
    state.answers = {};
    state.reviewed = {};
    state.startedAt = new Date().toISOString();
    saveState();
    closeModal();
    renderWorkspace();
  }

  function continueSavedPractice() {
    if (!state.student || !state.session) return;
    closeModal();
    renderWorkspace();
  }

  function createFreshPractice() {
    if (!state.student) {
      openModal();
      return;
    }
    const ok = window.confirm('Se generara una nueva practica de IPv6 y se perderan las respuestas actuales. ¿Continuar?');
    if (!ok) return;
    state.session = buildSession();
    state.answers = {};
    state.reviewed = {};
    state.startedAt = new Date().toISOString();
    saveState();
    renderWorkspace();
    window.location.hash = '#practice';
  }

  function reviewModule(moduleId) {
    const module = findModule(moduleId);
    if (!module) return;

    const unanswered = module.questions.filter(function (question) {
      return !state.answers[question.id];
    });

    if (unanswered.length > 0) {
      window.alert('Aun faltan ' + unanswered.length + ' respuestas en este bloque.');
      return;
    }

    state.reviewed[moduleId] = new Date().toISOString();
    saveState();
    renderWorkspace();
  }

  function exportPdf() {
    if (!allModulesReviewed()) return;
    document.body.classList.add('print-report');
    window.print();
    window.setTimeout(function () {
      document.body.classList.remove('print-report');
    }, 600);
  }

  function renderModal() {
    const hasSavedProgress = Boolean(state.student && state.session);
    const defaultDate = state.student && state.student.date ? state.student.date : new Date().toISOString().split('T')[0];

    els.inputName.value = state.student && state.student.name ? state.student.name : '';
    els.inputGroup.value = state.student && state.student.group ? state.student.group : '';
    els.inputDate.value = defaultDate;

    if (hasSavedProgress) {
      els.savedStudentRow.classList.add('show');
      els.savedStudentLabel.innerHTML = 'Guardado local: <strong>' +
        escapeHtml(state.student.name) +
        '</strong> · ' +
        escapeHtml(state.student.group) +
        ' · ' +
        escapeHtml(state.student.date);
      openModal();
      return;
    }

    els.savedStudentRow.classList.remove('show');
    openModal();
  }

  function renderWorkspace() {
    const hasSession = Boolean(state.student && state.session);

    els.studentChip.textContent = hasSession ? state.student.name : '—';
    els.groupChip.textContent = hasSession ? state.student.group : '—';

    if (!hasSession) {
      els.practiceStatus.textContent = 'Pendiente de iniciar';
      els.practiceMount.innerHTML = '<div class="practice-module"><h3>Sin practica activa</h3><p>Usa el formulario inicial para crear una sesion de IPv6 basada en el material del workbook.</p></div>';
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
    const html = state.session.modules.map(function (module) {
      const metrics = getModuleMetrics(module);

      return [
        '<article class="practice-module">',
          '<div class="module-top">',
            '<div>',
              '<h3>' + escapeHtml(module.title) + '</h3>',
              '<p>' + escapeHtml(module.description) + '</p>',
            '</div>',
            '<span class="module-badge">' + metrics.correct + '/' + metrics.total + ' correctas</span>',
          '</div>',
          '<div class="question-list">',
            module.questions.map(function (question, index) {
              return renderQuestion(module, question, index + 1, metrics.reviewed);
            }).join(''),
          '</div>',
          '<div class="module-actions">',
            '<button class="btn-review" type="button" data-review-module="' + escapeHtml(module.id) + '">Revisar bloque</button>',
            '<span class="module-status">' +
              metrics.answered + '/' + metrics.total + ' respondidas' +
              (metrics.reviewed ? ' · Bloque revisado' : ' · Pendiente de revisar') +
            '</span>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');

    els.practiceMount.innerHTML = html;
  }

  function renderQuestion(module, question, number, reviewed) {
    const selected = state.answers[question.id] || '';
    const correct = reviewed && selected === question.answer;
    const wrong = reviewed && selected && selected !== question.answer;
    const className = reviewed ? (correct ? 'question-card correct' : 'question-card wrong') : 'question-card';

    const feedback = reviewed
      ? '<div class="question-feedback ' + (correct ? 'ok' : 'err') + '">' +
          '<strong>' + (correct ? 'Correcta.' : 'Revisar.') + '</strong> ' + escapeHtml(question.explanation) +
          '<span class="detail">Respuesta esperada: ' + escapeHtml(question.answer) + '</span>' +
        '</div>'
      : '';

    return [
      '<div class="' + className + '">',
        '<div class="question-head">',
          '<div class="question-num">' + number + '</div>',
          '<p>' + escapeHtml(question.prompt) + '</p>',
        '</div>',
        '<div class="choice-list">',
          question.options.map(function (option, optionIndex) {
            const inputId = module.id + '-' + question.id + '-' + optionIndex;
            const isChecked = selected === option ? ' checked' : '';
            return '<label class="choice-label" for="' + escapeHtml(inputId) + '">' +
              '<input type="radio" id="' + escapeHtml(inputId) + '" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option) + '" data-question-id="' + escapeHtml(question.id) + '"' + isChecked + ' />' +
              '<span>' + escapeHtml(option) + '</span>' +
            '</label>';
          }).join(''),
        '</div>',
        feedback,
      '</div>'
    ].join('');
  }

  function renderStats() {
    const totals = getTotals();
    els.practiceStatus.textContent = allModulesReviewed() ? 'Practica resuelta' : 'Practica en progreso';
    els.statModules.textContent = totals.reviewedModules + '/' + totals.totalModules;
    els.statAnswered.textContent = String(totals.answered);
    els.statCorrect.textContent = String(totals.correct);
    els.scoreValue.textContent = totals.totalQuestions === 0 ? '0%' : Math.round((totals.correct / totals.totalQuestions) * 100) + '%';
    els.btnExportPdf.disabled = !allModulesReviewed();
  }

  function renderReport() {
    if (!allModulesReviewed()) {
      els.reportShell.classList.remove('ready');
      els.reportKpis.innerHTML = '';
      els.reportContent.innerHTML = '';
      return;
    }

    const totals = getTotals();
    els.reportShell.classList.add('ready');
    els.reportKpis.innerHTML = [
      '<span class="report-kpi">Estudiante: ' + escapeHtml(state.student.name) + '</span>',
      '<span class="report-kpi">Grupo: ' + escapeHtml(state.student.group) + '</span>',
      '<span class="report-kpi">Fecha: ' + escapeHtml(state.student.date) + '</span>',
      '<span class="report-kpi">Puntaje: ' + Math.round((totals.correct / totals.totalQuestions) * 100) + '%</span>'
    ].join('');

    els.reportContent.innerHTML = state.session.modules.map(function (module) {
      const metrics = getModuleMetrics(module);
      return [
        '<section class="report-module">',
          '<h3>' + escapeHtml(module.title) + ' · ' + metrics.correct + '/' + metrics.total + '</h3>',
          '<div class="report-table-wrap">',
            '<table class="report-table">',
              '<thead>',
                '<tr>',
                  '<th>#</th>',
                  '<th>Pregunta</th>',
                  '<th>Respuesta del estudiante</th>',
                  '<th>Respuesta correcta</th>',
                  '<th>Resultado</th>',
                '</tr>',
              '</thead>',
              '<tbody>',
                module.questions.map(function (question, index) {
                  const userAnswer = state.answers[question.id] || 'Sin responder';
                  const correct = userAnswer === question.answer;
                  return [
                    '<tr>',
                      '<td>' + (index + 1) + '</td>',
                      '<td>' + escapeHtml(question.prompt) + '<div class="report-note">' + escapeHtml(question.explanation) + '</div></td>',
                      '<td>' + escapeHtml(userAnswer) + '</td>',
                      '<td>' + escapeHtml(question.answer) + '</td>',
                      '<td class="' + (correct ? 'result-ok' : 'result-bad') + '">' + (correct ? 'Correcta' : 'Revisar') + '</td>',
                    '</tr>'
                  ].join('');
                }).join(''),
              '</tbody>',
            '</table>',
          '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function getTotals() {
    if (!state.session) {
      return {
        totalModules: 0,
        reviewedModules: 0,
        answered: 0,
        correct: 0,
        totalQuestions: 0
      };
    }

    const totals = {
      totalModules: state.session.modules.length,
      reviewedModules: 0,
      answered: 0,
      correct: 0,
      totalQuestions: 0
    };

    state.session.modules.forEach(function (module) {
      const metrics = getModuleMetrics(module);
      totals.reviewedModules += metrics.reviewed ? 1 : 0;
      totals.answered += metrics.answered;
      totals.correct += metrics.correct;
      totals.totalQuestions += metrics.total;
    });

    return totals;
  }

  function getModuleMetrics(module) {
    const answered = module.questions.filter(function (question) {
      return Boolean(state.answers[question.id]);
    }).length;

    const correct = module.questions.filter(function (question) {
      return state.answers[question.id] === question.answer;
    }).length;

    return {
      answered: answered,
      correct: correct,
      total: module.questions.length,
      reviewed: Boolean(state.reviewed[module.id])
    };
  }

  function allModulesReviewed() {
    return Boolean(state.session) && state.session.modules.every(function (module) {
      return Boolean(state.reviewed[module.id]);
    });
  }

  function buildSession() {
    return {
      modules: MODULE_BANK.map(function (module) {
        return {
          id: module.id,
          title: module.title,
          description: module.description,
          questions: shuffle(module.questions.map(function (question) {
            return {
              id: question.id,
              prompt: question.prompt,
              answer: question.answer,
              explanation: question.explanation,
              options: shuffle(question.options.slice())
            };
          }))
        };
      })
    };
  }

  function findModule(moduleId) {
    if (!state.session) return null;
    return state.session.modules.find(function (module) {
      return module.id === moduleId;
    }) || null;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return baseState();
      const parsed = JSON.parse(raw);
      return {
        student: parsed.student || null,
        session: parsed.session || null,
        answers: parsed.answers || {},
        reviewed: parsed.reviewed || {},
        startedAt: parsed.startedAt || null
      };
    } catch (error) {
      return baseState();
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function baseState() {
    return {
      student: null,
      session: null,
      answers: {},
      reviewed: {},
      startedAt: null
    };
  }

  function openModal() {
    els.studentModal.style.display = 'flex';
  }

  function closeModal() {
    els.studentModal.style.display = 'none';
  }

  function shuffle(items) {
    const clone = items.slice();
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = clone[i];
      clone[i] = clone[j];
      clone[j] = tmp;
    }
    return clone;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
