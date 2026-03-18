'use strict';

(function () {
  const STATE_KEY = 'ccna1-ipv6-practice-v2';
  const PREF_KEY = 'ccna1-ipv6-prefs-v1';

  const els = {};
  let state = loadState();
  let prefs = loadPrefs();
  let currentAudio = null;

  const qSingle = (id, prompt, answer, options, hint, explanation) => ({
    id, type: 'single', prompt, answer, options, hint, explanation
  });

  const qMulti = (id, prompt, answers, options, hint, explanation) => ({
    id, type: 'multi', answers, prompt, options, hint, explanation
  });

  const qText = (id, prompt, acceptable, hint, explanation, placeholder) => ({
    id, type: 'text', acceptable, prompt, hint, explanation, placeholder
  });

  const qOrder = (id, prompt, answer, options, hint, explanation) => ({
    id, type: 'order', answer, prompt, options, hint, explanation
  });

  const MODULE_TEMPLATES = [
    {
      id: 'notation',
      title: 'Bloque 1: Estructura base',
      description: '128 bits, 8 hextetos, 32 simbolos hexadecimales y lectura basica de la direccion.',
      questions: [
        qSingle(
          'notation-1',
          '¿Cuantos hextetos componen una direccion IPv6 completa?',
          '8 hextetos',
          ['4 hextetos', '6 hextetos', '8 hextetos', '16 hextetos'],
          'Piensa en 128 bits divididos entre grupos de 16 bits.',
          'IPv6 reparte sus 128 bits en 8 hextetos. Cada uno representa 16 bits.'
        ),
        qSingle(
          'notation-2',
          '¿Cuantos bits representa un hexteto?',
          '16 bits',
          ['4 bits', '8 bits', '16 bits', '32 bits'],
          'Un hexteto es un grupo hexadecimal completo.',
          'Cada hexteto contiene 16 bits; por eso 8 hextetos completan 128 bits.'
        ),
        qSingle(
          'notation-3',
          '¿Cuantos simbolos hexadecimales tiene una direccion IPv6 completa sin abreviar?',
          '32 simbolos hexadecimales',
          ['8 simbolos hexadecimales', '16 simbolos hexadecimales', '24 simbolos hexadecimales', '32 simbolos hexadecimales'],
          'Cada hexteto tiene 4 simbolos hexadecimales.',
          'Ocho hextetos por cuatro simbolos cada uno producen 32 simbolos hexadecimales.'
        ),
        qSingle(
          'notation-4',
          '¿Que caracter separa los hextetos en IPv6?',
          'Dos puntos (:) ',
          ['Punto (.)', 'Guion (-)', 'Dos puntos (:) ', 'Barra diagonal (/)'],
          'Recuerda la escritura del ejemplo 2001:DB8:....',
          'Los grupos IPv6 se separan con dos puntos. La barra se usa para el prefijo, no para separar hextetos.'
        ),
        qText(
          'notation-5',
          'Escribe la expansion completa de FE80::1.',
          ['fe80:0000:0000:0000:0000:0000:0000:0001'],
          'Debes terminar con 8 hextetos completos.',
          'FE80::1 completa los grupos omitidos con ceros hasta llegar a 8 hextetos.',
          'fe80:0000:0000:0000:0000:0000:0000:0001'
        ),
        qSingle(
          'notation-6',
          '¿Entre que valores puede ir la longitud de prefijo IPv6?',
          'De /0 a /128',
          ['De /0 a /64', 'De /0 a /128', 'De /1 a /255', 'De /16 a /128'],
          'La longitud maxima no puede superar el total de bits de la direccion.',
          'IPv6 tiene 128 bits; por eso el prefijo puede ir desde /0 hasta /128.'
        )
      ]
    },
    {
      id: 'compression',
      title: 'Bloque 2: Compresion y abreviacion',
      description: 'Quitar ceros a la izquierda, usar :: una sola vez y detectar escrituras invalidas.',
      questions: [
        qSingle(
          'compression-1',
          '¿Cuantas veces puede aparecer :: en una direccion IPv6 valida?',
          'Una sola vez',
          ['Ninguna vez', 'Una sola vez', 'Dos veces', 'Todas las necesarias'],
          'El problema es la ambiguedad al reexpandir la direccion.',
          ':: solo puede utilizarse una vez. Si aparece dos veces ya no es posible saber cuantos grupos faltan en cada lugar.'
        ),
        qText(
          'compression-2',
          'Abrevia correctamente 3210:0000:0000:0000:0000:0000:0000:0000.',
          ['3210::', '3210::'],
          'Primero quita ceros a la izquierda y luego comprime la corrida continua mas larga.',
          'La direccion queda 3210:: porque todos los grupos restantes son 0000 y se pueden comprimir con :: una sola vez.',
          '3210::'
        ),
        qText(
          'compression-3',
          'Abrevia correctamente 2001:0000:0001:0001:0000:0000:000B:1001.',
          ['2001:0:1:1::b:1001'],
          'El workbook usa exactamente este ejemplo.',
          'Quitamos ceros a la izquierda y comprimimos la corrida 0000:0000. El resultado es 2001:0:1:1::B:1001.',
          '2001:0:1:1::b:1001'
        ),
        qSingle(
          'compression-4',
          '¿Cual direccion es invalida por usar mal la compresion?',
          '2001::DB8::1',
          ['2001:DB8::1', '2001::DB8::1', 'FE80::1', '3210::'],
          'Busca la opcion con dos ocurrencias de ::.',
          '2001::DB8::1 es invalida porque :: solo puede aparecer una vez en la misma direccion.'
        ),
        qText(
          'compression-5',
          'Abrevia correctamente 34BA:000B:000B:0000:0000:0000:0000:0020.',
          ['34ba:b:b::20'],
          'Hay que quitar ceros a la izquierda y luego compactar la corrida continua de 0000.',
          '34BA:000B:000B:0000:0000:0000:0000:0020 se convierte en 34BA:B:B::20.',
          '34ba:b:b::20'
        ),
        qSingle(
          'compression-6',
          '¿Que afirmacion es correcta sobre la abreviacion IPv6?',
          'Primero se quitan ceros a la izquierda y luego se usa :: si conviene',
          [
            'Primero se quitan ceros a la izquierda y luego se usa :: si conviene',
            'Primero se reemplaza cualquier 0 por ::',
            'Nunca se deben quitar ceros a la izquierda',
            'Solo las link-local se pueden abreviar'
          ],
          'Piensa en las dos reglas principales del workbook.',
          'La secuencia correcta es quitar ceros a la izquierda y luego usar :: solo si existe una corrida de grupos 0000.'
        )
      ]
    },
    {
      id: 'prefix',
      title: 'Bloque 3: Prefijo e ID de interfaz',
      description: 'Division /64, separacion de prefijo e interfaz y razon operativa de esa recomendacion.',
      questions: [
        qSingle(
          'prefix-1',
          '¿Que longitud de prefijo recomienda el material para LAN y SLAAC?',
          '/64',
          ['/48', '/56', '/64', '/96'],
          'SLAAC necesita una division muy concreta.',
          'El material insiste en /64 porque separa 64 bits de prefijo y 64 bits de ID de interfaz, justo lo que usa SLAAC.'
        ),
        qSingle(
          'prefix-2',
          'En 2001:DB8:ACAD:A::15/64, ¿cual es el prefijo de red?',
          '2001:DB8:ACAD:A::/64',
          [
            '2001:DB8:ACAD:A::/64',
            '2001:DB8:ACAD::/64',
            '2001:DB8:ACAD:A::15/64',
            '2001:DB8::15/64'
          ],
          'Con /64 se toman los primeros cuatro hextetos completos.',
          'Con /64, el prefijo abarca los primeros 64 bits: 2001:DB8:ACAD:A::/64.'
        ),
        qSingle(
          'prefix-3',
          'Con un prefijo /64, ¿cuantos bits quedan para el ID de interfaz?',
          '64 bits',
          ['16 bits', '32 bits', '48 bits', '64 bits'],
          'IPv6 queda partido justo a la mitad en este caso.',
          'Si 64 bits pertenecen al prefijo, los otros 64 bits quedan para el ID de interfaz.'
        ),
        qText(
          'prefix-4',
          'En 2001:DB8:ACAD:A::15/64, escribe el ID de interfaz completo en formato expandido.',
          ['0000:0000:0000:0015'],
          'Se trata de los ultimos 64 bits, no del prefijo.',
          'Los ultimos cuatro hextetos corresponden al ID de interfaz: 0000:0000:0000:0015.',
          '0000:0000:0000:0015'
        ),
        qSingle(
          'prefix-5',
          'En una red /64, ¿que parte suele anunciar el router en los RA?',
          'El prefijo de red',
          ['El prefijo de red', 'La direccion MAC del host', 'Solo el ultimo hexteto', 'La direccion loopback'],
          'Relaciona RA con SLAAC.',
          'El router anuncia el prefijo de red. El host completa o genera el ID de interfaz.'
        ),
        qSingle(
          'prefix-6',
          '¿Por que /64 se considera la division recomendada para la mayoria de LAN IPv6?',
          'Porque SLAAC usa 64 bits para el ID de interfaz',
          [
            'Porque SLAAC usa 64 bits para el ID de interfaz',
            'Porque convierte la direccion en privada',
            'Porque evita multicast',
            'Porque reemplaza a la link-local'
          ],
          'La respuesta esta ligada al mecanismo de autoconfiguracion.',
          'El motivo central es que SLAAC usa 64 bits para el ID de interfaz y simplifica el diseño de subredes.'
        )
      ]
    },
    {
      id: 'unicast',
      title: 'Bloque 4: Unicast y direcciones especiales',
      description: 'GUA, link-local, unique local, loopback, no especificada e IPv4 integrado.',
      questions: [
        qSingle(
          'unicast-1',
          '¿Que tipo de direccion es 2001:DB8:ACAD::1?',
          'Unicast global (GUA)',
          ['Unicast global (GUA)', 'Link-local (LLA)', 'Unique local (ULA)', 'Multicast'],
          'Observa el rango 2000::/3.',
          'Las GUA viven en 2000::/3 y son direcciones globalmente enrutables.'
        ),
        qSingle(
          'unicast-2',
          '¿Que tipo de direccion es FE80::1?',
          'Link-local (LLA)',
          ['Unicast global (GUA)', 'Link-local (LLA)', 'Unique local (ULA)', 'Loopback'],
          'Las link-local arrancan con FE80.',
          'FE80::/10 corresponde a link-local, necesaria en el enlace local y no enrutable globalmente.'
        ),
        qSingle(
          'unicast-3',
          '¿Que tipo de direccion es FD00:1234::10?',
          'Unique local (ULA)',
          ['Unique local (ULA)', 'Multicast permanente', 'Link-local (LLA)', 'Anycast'],
          'Relaciona FC00::/7 con direccionamiento local.',
          'Las ULA utilizan FC00::/7 y sirven para direccionamiento local limitado, sin enrutamiento global.'
        ),
        qSingle(
          'unicast-4',
          '¿Que representa ::1/128?',
          'Loopback',
          ['Loopback', 'No especificada', 'All-nodes multicast', 'Anycast'],
          'Es el equivalente funcional al 127.0.0.1.',
          '::1/128 es la direccion de loopback usada para que el host se pruebe a si mismo.'
        ),
        qSingle(
          'unicast-5',
          '¿Que representa la direccion ::?',
          'Direccion no especificada',
          ['Direccion no especificada', 'Loopback', 'Link-local minima', 'Unique local'],
          'Piensa en ausencia total de direccion.',
          ':: indica ausencia de direccion IPv6 y solo se usa como origen antes de tener una direccion asignada.'
        ),
        qSingle(
          'unicast-6',
          '¿Como describe el workbook una direccion IPv4 integrada?',
          'Una IPv6 que lleva una IPv4 en los 32 bits inferiores',
          [
            'Una IPv6 que lleva una IPv4 en los 32 bits inferiores',
            'Una IPv4 traducida con NAT64 automaticamente',
            'Una direccion multicast temporal',
            'Una variante de loopback'
          ],
          'Busca la idea de 32 bits de orden inferior.',
          'El material la define como una direccion IPv6 que transporta una direccion IPv4 en los 32 bits de orden inferior.'
        )
      ]
    },
    {
      id: 'multicast',
      title: 'Bloque 5: Multicast y grupos conocidos',
      description: 'Prefijo FF00::/12, grupos conocidos, multicast permanente/transitoria y restriccion de origen.',
      questions: [
        qMulti(
          'multicast-1',
          'Selecciona todas las direcciones que son multicast conocidas del enlace local.',
          ['FF02::1', 'FF02::2', 'FF02::A'],
          ['FF02::1', 'FF02::2', 'FF02::A', 'FE80::1', '::1'],
          'Todas las respuestas correctas empiezan por FF02.',
          'FF02::1, FF02::2 y FF02::A son grupos multicast conocidos del enlace local. FE80::1 y ::1 no son multicast.'
        ),
        qSingle(
          'multicast-2',
          '¿Cual es el prefijo general de multicast en IPv6?',
          'FF00::/12',
          ['FF00::/12', 'FE80::/10', '2000::/3', 'FC00::/7'],
          'Busca el rango que comienza por FF.',
          'Todas las direcciones multicast IPv6 parten del espacio FF00::/12.'
        ),
        qSingle(
          'multicast-3',
          '¿Que grupo representa FF02::1?',
          'Todos los nodos IPv6 del enlace local',
          [
            'Todos los nodos IPv6 del enlace local',
            'Todos los routers IPv6 del enlace local',
            'Todos los servidores DHCPv6',
            'Todos los hosts con ULA'
          ],
          'Es el grupo mas amplio del enlace local.',
          'FF02::1 agrupa a todos los nodos IPv6 del enlace local.'
        ),
        qSingle(
          'multicast-4',
          '¿Que grupo representa FF02::2?',
          'Todos los routers IPv6 del enlace local',
          [
            'Todos los nodos IPv6 del enlace local',
            'Todos los routers IPv6 del enlace local',
            'Todos los vecinos descubiertos',
            'Todos los servidores AAAA'
          ],
          'Compáralo con FF02::1.',
          'FF02::2 se reserva para todos los routers IPv6 del enlace local.'
        ),
        qSingle(
          'multicast-5',
          '¿Que grupo es FF02::5?',
          'Todos los routers OSPFv3',
          ['Todos los routers OSPFv3', 'Todos los routers EIGRP para IPv6', 'Todos los nodos IPv6', 'Todos los routers BGP'],
          'El workbook cita FF02::5 de forma textual.',
          'FF02::5 corresponde al grupo de todos los routers OSPFv3.'
        ),
        qSingle(
          'multicast-6',
          '¿Que grupo es FF02::A?',
          'Todos los routers EIGRP para IPv6',
          ['Todos los routers EIGRP para IPv6', 'Todos los routers OSPFv3', 'Todos los nodos IPv6', 'Todos los routers RIPng'],
          'Es otro grupo conocido citado por el material.',
          'FF02::A es el grupo multicast para todos los routers EIGRP en IPv6.'
        ),
        qSingle(
          'multicast-7',
          '¿Que significa el caso de ff10::/12 en el material?',
          'Multicast no permanente o transitoria',
          [
            'Multicast no permanente o transitoria',
            'Unique local',
            'Link-local obligatoria',
            'Anycast para routers'
          ],
          'Revisa la bandera 1 frente a la permanente 0.',
          'El workbook diferencia multicast permanente (0) y no permanente/transitoria (1); ff10::/12 cae en la segunda categoria.'
        )
      ]
    },
    {
      id: 'ecosystem',
      title: 'Bloque 6: Anycast, IANA, RIR y DNS',
      description: 'Asignacion global, DNS AAAA y rol de anycast dentro del ecosistema IPv6.',
      questions: [
        qSingle(
          'ecosystem-1',
          '¿Que afirmacion describe mejor a anycast en IPv6?',
          'Usa el mismo rango que unicast global y entrega al nodo mas cercano',
          [
            'Usa el mismo rango que unicast global y entrega al nodo mas cercano',
            'Siempre usa FF00::/12',
            'Tiene un prefijo exclusivo AC00::/8',
            'Solo existe dentro de FE80::/10'
          ],
          'Anycast no tiene prefijo propio en el workbook.',
          'Anycast reutiliza direcciones del rango unicast y el trafico llega al nodo mas cercano segun la tabla de enrutamiento.'
        ),
        qSingle(
          'ecosystem-2',
          '¿Quien aparece como responsable superior de la asignacion de espacio IPv6 en el material?',
          'IANA',
          ['IANA', 'RIR', 'ISP local', 'Servidor DHCPv6'],
          'Es el nivel mas alto de asignacion.',
          'La IANA administra la asignacion global del espacio IPv6 antes de delegarlo a los RIR.'
        ),
        qSingle(
          'ecosystem-3',
          '¿Que hacen los RIR segun el flujo mostrado?',
          'Distribuyen bloques regionales a operadores y organizaciones',
          [
            'Distribuyen bloques regionales a operadores y organizaciones',
            'Solo generan direcciones link-local',
            'Sustituyen a la IANA en todo el mundo',
            'Funcionan como servidores de nombres'
          ],
          'RIR significa registro regional de Internet.',
          'Los RIR reciben bloques de IANA y los asignan regionalmente a operadores y organizaciones.'
        ),
        qSingle(
          'ecosystem-4',
          '¿Que fraccion del espacio IPv6 menciona el workbook para 2000::/3?',
          'Una octava parte',
          ['La mitad del espacio IPv6', 'Una cuarta parte', 'Una octava parte', 'Todo el espacio publico'],
          'Piensa en el prefijo /3.',
          'El material describe 2000::/3 como una octava parte del espacio total de direcciones IPv6.'
        ),
        qSingle(
          'ecosystem-5',
          '¿Que tipo de registro DNS buscas para comprobar un dominio con IPv6?',
          'AAAA',
          ['A', 'AAAA', 'MX', 'PTR'],
          'El laboratorio guiado del workbook apunta a probar dominios publicos con IPv6.',
          'Las direcciones IPv6 publicas se publican en registros AAAA.'
        ),
        qSingle(
          'ecosystem-6',
          '¿Que herramienta cita el material para practicar con dominios publicos IPv6 como Cisco.com o Netflix.com?',
          'nslookup',
          ['ping', 'nslookup', 'arp -a', 'show vlan'],
          'Busca la referencia directa a Cisco.com y Netflix.com.',
          'El workbook sugiere usar nslookup para consultar dominios publicos y ver si tienen resolucion IPv6.'
        )
      ]
    },
    {
      id: 'slaac',
      title: 'Bloque 7: SLAAC, RS, RA y NDP',
      description: 'Intercambio basico host-router, contenido de los RA, solicited-node multicast y relacion con ARP.',
      questions: [
        qSingle(
          'slaac-1',
          '¿Que mensaje envia primero el host para descubrir routers IPv6?',
          'RS (Router Solicitation)',
          ['RS (Router Solicitation)', 'RA (Router Advertisement)', 'ARPv6', 'DHCPDISCOVER'],
          'Piensa en quien toma la iniciativa cuando el host entra a la red.',
          'El host envia RS para descubrir routers; despues el router responde con RA.'
        ),
        qSingle(
          'slaac-2',
          '¿Que mensaje responde el router para orientar al host sobre la red?',
          'RA (Router Advertisement)',
          ['RA (Router Advertisement)', 'RS (Router Solicitation)', 'NS (Neighbor Solicitation)', 'SYN'],
          'Es el mensaje que anuncia prefijo y otros datos.',
          'El router usa RA para anunciar prefijo, gateway predeterminado y otros parametros utiles.'
        ),
        qMulti(
          'slaac-3',
          'Selecciona toda la informacion que el material indica que puede llevar un RA.',
          ['Prefijo de red y longitud', 'Gateway predeterminado', 'Direcciones DNS y nombre de dominio'],
          [
            'Prefijo de red y longitud',
            'Gateway predeterminado',
            'Direcciones DNS y nombre de dominio',
            'Contraseña WiFi'
          ],
          'Son tres piezas de informacion de red, no credenciales.',
          'El workbook lista prefijo/longitud, gateway predeterminado y datos DNS/dominio como informacion util entregada por RA.'
        ),
        qSingle(
          'slaac-4',
          '¿Cual es el prefijo de la direccion solicited-node multicast?',
          'FF02:0:0:0:0:1:FF00::/104',
          [
            'FF02:0:0:0:0:1:FF00::/104',
            'FF02::/16',
            'FE80::/10',
            '2000::/3'
          ],
          'El ultimo tramo FF00 es clave.',
          'La direccion solicited-node usa el prefijo FF02:0:0:0:0:1:FF00::/104 y agrega los ultimos 24 bits de la unicast.'
        ),
        qSingle(
          'slaac-5',
          '¿Para que sirve la solicited-node multicast segun el workbook?',
          'Para resolucion de capa 3 a capa 2, de forma similar a ARP',
          [
            'Para resolucion de capa 3 a capa 2, de forma similar a ARP',
            'Para reemplazar a la loopback',
            'Para crear una GUA publica',
            'Para configurar STP'
          ],
          'Relaciona este mecanismo con la idea de broadcast/ARP en IPv4.',
          'El material la presenta como una aproximacion mas eficiente al broadcast de IPv4 para la resolucion de capa 3 a capa 2.'
        ),
        qSingle(
          'slaac-6',
          '¿Que dos formas cita el workbook para construir el ID de interfaz en GUA dinamica?',
          'EUI-64 o generacion aleatoria',
          [
            'EUI-64 o generacion aleatoria',
            'NAT o PAT',
            'ARP o RARP',
            'VLSM o CIDR'
          ],
          'La nota del material los menciona juntos.',
          'La nota remarca EUI-64 y generacion aleatoria como dos maneras de formar el ID de interfaz.'
        ),
        qSingle(
          'slaac-7',
          '¿Que afirmacion hace el material sobre las direcciones link-local?',
          'Son obligatorias para cada dispositivo con IPv6',
          [
            'Son obligatorias para cada dispositivo con IPv6',
            'Solo las usan routers',
            'Sustituyen a las GUA en Internet',
            'Solo existen si el prefijo es /128'
          ],
          'La palabra clave es "requerida".',
          'Las link-local se requieren en cada dispositivo con IPv6 y permiten la comunicacion dentro del enlace local.'
        )
      ]
    },
    {
      id: 'ios',
      title: 'Bloque 8: Cisco IOS minimo',
      description: 'Secuencia de configuracion, comando global obligatorio y diagnostico rapido del router.',
      questions: [
        qSingle(
          'ios-1',
          '¿Que comando global habilita el enrutamiento IPv6 en un router Cisco?',
          'ipv6 unicast-routing',
          ['ipv6 unicast-routing', 'ip routing ipv6', 'enable ipv6 router', 'ipv6 route enable'],
          'Es el comando estrella del workbook.',
          'Sin ipv6 unicast-routing el router no enruta IPv6 globalmente ni apoya correctamente el flujo de RA.'
        ),
        qSingle(
          'ios-2',
          'Si un host tiene direccion IPv6 pero no sale de su enlace local, ¿que revisas primero?',
          'Que exista ipv6 unicast-routing',
          [
            'Que exista ipv6 unicast-routing',
            'Que la VLAN sea privada',
            'Que se haya usado NAT',
            'Que la interfaz loopback este apagada'
          ],
          'El workbook lo dice de forma literal.',
          'La primera revision sugerida es confirmar que ipv6 unicast-routing este activo en el router.'
        ),
        qSingle(
          'ios-3',
          '¿Que comando asigna una GUA a una interfaz Cisco dentro del ejemplo base?',
          'ipv6 address 2001:DB8:1::1/64',
          [
            'ipv6 address 2001:DB8:1::1/64',
            'ip address 2001:DB8:1::1/64',
            'ipv6 gateway 2001:DB8:1::1',
            'interface ipv6 2001:DB8:1::1/64'
          ],
          'Se aplica dentro del modo de interfaz.',
          'La sintaxis correcta es ipv6 address 2001:DB8:1::1/64 dentro de la interfaz.'
        ),
        qOrder(
          'ios-4',
          'Ordena la secuencia minima coherente para iniciar una configuracion IPv6 en un router Cisco.',
          [
            'enable',
            'configure terminal',
            'ipv6 unicast-routing',
            'interface g0/0',
            'ipv6 address 2001:DB8:1::1/64',
            'no shutdown'
          ],
          [
            'enable',
            'configure terminal',
            'ipv6 unicast-routing',
            'interface g0/0',
            'ipv6 address 2001:DB8:1::1/64',
            'no shutdown'
          ],
          'Piensa en el paso de privilegios, luego configuracion global y al final interfaz.',
          'La secuencia comienza con enable, entra a configure terminal, activa ipv6 unicast-routing, entra a la interfaz, asigna direccion y finalmente levanta la interfaz.'
        ),
        qSingle(
          'ios-5',
          '¿Que comando usarias para entrar a la interfaz del ejemplo?',
          'interface g0/0',
          ['interface g0/0', 'router g0/0', 'line g0/0', 'ip interface g0/0'],
          'Se trata del contexto de interfaz.',
          'interface g0/0 es el paso correcto para entrar al modo de configuracion de la interfaz.'
        ),
        qMulti(
          'ios-6',
          'Selecciona todos los comandos que forman parte del bloque minimo mostrado para IPv6.',
          [
            'enable',
            'configure terminal',
            'ipv6 unicast-routing',
            'interface g0/0',
            'ipv6 address 2001:DB8:1::1/64',
            'no shutdown'
          ],
          [
            'enable',
            'configure terminal',
            'ipv6 unicast-routing',
            'interface g0/0',
            'ipv6 address 2001:DB8:1::1/64',
            'no shutdown',
            'ip nat inside'
          ],
          'Hay un distractor de IPv4/NAT en la lista.',
          'El bloque minimo incluye enable, configure terminal, ipv6 unicast-routing, interface g0/0, ipv6 address ... y no shutdown. ip nat inside no forma parte de este flujo.'
        )
      ]
    },
    {
      id: 'scenarios',
      title: 'Bloque 9: Escenarios de examen',
      description: 'Aplicacion combinada de tipos de direccion, validez de escritura y comportamiento de red.',
      questions: [
        qSingle(
          'scenarios-1',
          '¿Que tipo de direccion es FF02::1:FFAB:34CD?',
          'Solicited-node multicast',
          ['Solicited-node multicast', 'Link-local', 'Unique local', 'Anycast'],
          'Busca el patron FF02::1:FFxx:xxxx.',
          'FF02::1:FFAB:34CD coincide con el formato de solicited-node multicast.'
        ),
        qMulti(
          'scenarios-2',
          'Selecciona todas las direcciones que no son globalmente enrutables.',
          ['FE80::1', 'FD00::1', '::1'],
          ['FE80::1', 'FD00::1', '2001:DB8::1', '::1'],
          'Piensa en enlace local, ambito local limitado y loopback.',
          'FE80::1 es link-local, FD00::1 es unique local y ::1 es loopback. Ninguna de ellas es globalmente enrutable.'
        ),
        qSingle(
          'scenarios-3',
          '¿Cual direccion es invalida por su escritura?',
          '2001:DB8::A::1',
          ['2001:DB8::A:1', '2001:DB8::A::1', 'FE80::1', '3210::'],
          'La pista es la misma de compresion: solo una vez.',
          '2001:DB8::A::1 es invalida porque usa :: dos veces.'
        ),
        qSingle(
          'scenarios-4',
          'En una LAN IPv6, ¿que tipo de direccion usa con frecuencia el host para identificar al router como gateway del enlace?',
          'La link-local del router',
          ['La link-local del router', 'La loopback del router', 'Una multicast FF02::2', 'La direccion no especificada'],
          'Relaciona el gateway local con el ambito del enlace.',
          'En IPv6 es comun que el gateway del enlace se identifique por la direccion link-local del router.'
        ),
        qText(
          'scenarios-5',
          'Abrevia correctamente 2001:0DB8:000A:0000:0000:0000:0000:0001.',
          ['2001:db8:a::1'],
          'Quita ceros a la izquierda y luego comprime la corrida de 0000.',
          'La forma corta es 2001:DB8:A::1.',
          '2001:db8:a::1'
        ),
        qSingle(
          'scenarios-6',
          'Tres servidores anuncian la misma /128 con OSPFv3 y el trafico llega al mas cercano. ¿Que concepto se esta usando?',
          'Anycast',
          ['Anycast', 'Loopback', 'Unique local', 'Solicited-node multicast'],
          'No hay prefijo especial, pero si un comportamiento de proximidad.',
          'Ese comportamiento corresponde a anycast: varios nodos comparten direccion y el trafico llega al mas cercano.'
        )
      ]
    }
  ];

  const FLASHCARD_BANK = [
    ['8 hextetos', 'Una direccion IPv6 completa usa 8 hextetos de 16 bits.'],
    ['32 simbolos hexadecimales', 'Ocho hextetos por cuatro simbolos cada uno.'],
    ['/64', 'Prefijo recomendado para LAN y base de SLAAC en el material.'],
    ['2000::/3', 'Espacio de unicast global (GUA).'],
    ['FE80::/10', 'Rango de link-local (LLA).'],
    ['FC00::/7', 'Rango de unique local (ULA).'],
    ['::1/128', 'Loopback de IPv6.'],
    ['::', 'Direccion no especificada.'],
    ['FF00::/12', 'Prefijo general de multicast.'],
    ['FF02::1', 'Todos los nodos IPv6 del enlace local.'],
    ['FF02::2', 'Todos los routers IPv6 del enlace local.'],
    ['FF02::5', 'Todos los routers OSPFv3.'],
    ['FF02::A', 'Todos los routers EIGRP para IPv6.'],
    ['FF02:0:0:0:0:1:FF00::/104', 'Prefijo de solicited-node multicast.'],
    ['RS', 'Router Solicitation: lo envia el host para descubrir routers.'],
    ['RA', 'Router Advertisement: lo envia el router con prefijo y mas datos.'],
    ['ipv6 unicast-routing', 'Comando global clave para habilitar IPv6 en Cisco IOS.'],
    ['AAAA', 'Registro DNS para direcciones IPv6.']
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
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
    els.themeProgressMount = document.getElementById('themeProgressMount');
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
      prefs.fontScale = Math.min(1.22, Number((prefs.fontScale + 0.06).toFixed(2)));
      savePrefs();
      renderAll();
    });

    els.btnStopAudio.addEventListener('click', stopSpeaking);
    els.btnShuffleCards.addEventListener('click', shuffleFlashcards);

    els.practiceMount.addEventListener('change', handlePracticeChange);
    els.practiceMount.addEventListener('input', handlePracticeInput);

    document.addEventListener('click', handleGlobalClick);
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

    state = {
      version: 2,
      student: student,
      session: buildSession(),
      answers: {},
      reviewed: {},
      hints: {},
      cardReveal: {},
      startedAt: new Date().toISOString()
    };

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
    const ok = window.confirm('Se generara una practica IPv6 nueva y se perderan las respuestas actuales. ¿Continuar?');
    if (!ok) return;

    state.session = buildSession();
    state.answers = {};
    state.reviewed = {};
    state.hints = {};
    state.cardReveal = {};
    state.startedAt = new Date().toISOString();
    saveState();
    renderAll();
    window.location.hash = '#practice';
  }

  function handlePracticeInput(event) {
    const input = event.target;
    if (!input.matches('input[type="text"][data-question-id]')) return;

    const questionId = input.dataset.questionId;
    const moduleId = input.dataset.moduleId;
    state.answers[questionId] = input.value;
    delete state.reviewed[moduleId];
    saveState();
    renderStats();
  }

  function handlePracticeChange(event) {
    const target = event.target;
    const card = target.closest('.question-card');
    if (!card) return;

    const questionId = card.dataset.questionId;
    const moduleId = card.dataset.moduleId;
    const question = findQuestionById(questionId);
    if (!question) return;

    if (question.type === 'single') {
      state.answers[questionId] = target.value;
    } else if (question.type === 'multi') {
      const checked = Array.from(card.querySelectorAll('input[type="checkbox"]:checked')).map(function (node) {
        return node.value;
      });
      state.answers[questionId] = checked;
    } else if (question.type === 'order') {
      const ordered = Array.from(card.querySelectorAll('select[data-order-index]'))
        .sort(function (a, b) { return Number(a.dataset.orderIndex) - Number(b.dataset.orderIndex); })
        .map(function (node) { return node.value; });
      state.answers[questionId] = ordered;
    } else if (question.type === 'text') {
      state.answers[questionId] = target.value;
    }

    delete state.reviewed[moduleId];
    saveState();
    renderAll();
  }

  function handleGlobalClick(event) {
    const reviewBtn = event.target.closest('[data-review-module]');
    if (reviewBtn) {
      reviewModule(reviewBtn.dataset.reviewModule);
      return;
    }

    const resetBtn = event.target.closest('[data-reset-module]');
    if (resetBtn) {
      resetModule(resetBtn.dataset.resetModule);
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

  function reviewModule(moduleId) {
    const module = findModule(moduleId);
    if (!module) return;

    const unanswered = module.questions.filter(function (question) {
      return !isQuestionComplete(question);
    });

    if (unanswered.length > 0) {
      window.alert('Aun faltan ' + unanswered.length + ' respuesta(s) por completar en este bloque.');
      return;
    }

    state.reviewed[moduleId] = new Date().toISOString();
    saveState();
    renderAll();
  }

  function resetModule(moduleId) {
    const module = findModule(moduleId);
    if (!module) return;

    const ok = window.confirm('Se vaciaran las respuestas de este bloque. ¿Continuar?');
    if (!ok) return;

    module.questions.forEach(function (question) {
      delete state.answers[question.id];
      delete state.hints[question.id];
    });
    delete state.reviewed[moduleId];
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
    if (!allModulesReviewed()) return;
    document.body.classList.add('print-report');
    window.print();
    window.setTimeout(function () {
      document.body.classList.remove('print-report');
    }, 800);
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
      openModal();
      return;
    }

    els.savedStudentRow.classList.remove('show');
    openModal();
  }

  function renderAll() {
    applyPrefs();
    renderToolState();
    renderThemeProgress();
    renderQuickReview();
    renderWorkspace();
  }

  function renderToolState() {
    setPressed(els.btnContrast, prefs.contrast);
    setPressed(els.btnEasyMode, prefs.easyMode);
    setPressed(els.btnPracticeMode, prefs.practiceOnly);

    els.contrastChip.textContent = prefs.contrast ? 'Contraste alto activo' : 'Contraste normal';
    els.easyChip.textContent = prefs.easyMode ? 'Modo facil activo' : 'Modo facil oculto';
    els.modeChip.textContent = prefs.practiceOnly ? 'Solo practica' : 'Vista completa';
    els.fontChip.textContent = 'Escala ' + Math.round(prefs.fontScale * 100) + '%';
    if (!currentAudio) {
      els.audioChip.textContent = 'Audio detenido';
    }
  }

  function renderQuickReview() {
    if (!state.session) {
      els.quickReviewMount.innerHTML = '<div class="flash-card"><h3>Sin repaso activo</h3><p>Crea o continua una practica para generar tarjetas de repaso rapido.</p></div>';
      return;
    }

    els.quickReviewMount.innerHTML = state.session.flashcards.map(function (card) {
      const shown = Boolean(state.cardReveal[card.id]);
      return [
        '<article class="flash-card">',
          '<div class="flash-top">',
            '<strong>' + escapeHtml(card.front) + '</strong>',
            '<button class="btn-tool secondary btn-mini" type="button" data-toggle-card="' + escapeHtml(card.id) + '">',
              shown ? 'Ocultar' : 'Mostrar',
            '</button>',
          '</div>',
          '<p>' + escapeHtml(card.question) + '</p>',
          '<div class="flash-answer' + (shown ? ' show' : '') + '">' + escapeHtml(card.back) + '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderThemeProgress() {
    if (!els.themeProgressMount) return;

    if (!state.session) {
      els.themeProgressMount.innerHTML = '<article class="roadmap-chip"><strong>Progreso por tema</strong><span>Inicia una practica para ver avance, aciertos y bloques cerrados.</span></article>';
      return;
    }

    els.themeProgressMount.innerHTML = state.session.modules.map(function (module) {
      const metrics = getModuleMetrics(module);
      return [
        '<article class="roadmap-chip' + (metrics.reviewed ? ' done' : '') + '">',
          '<strong>' + escapeHtml(module.title) + '</strong>',
          '<span>' + metrics.answered + '/' + metrics.total + ' respondidas · ' + metrics.correct + ' correctas · ' + (metrics.reviewed ? 'cerrado' : 'abierto') + '</span>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderWorkspace() {
    const hasSession = Boolean(state.student && state.session);

    els.studentChip.textContent = hasSession ? state.student.name : '—';
    els.groupChip.textContent = hasSession ? state.student.group : '—';

    if (!hasSession) {
      els.practiceStatus.textContent = 'Pendiente de iniciar';
      els.practiceMount.innerHTML = '<div class="practice-module"><h3>Sin practica activa</h3><p>Usa el formulario inicial para crear una sesion privada de IPv6.</p></div>';
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
    els.practiceMount.innerHTML = state.session.modules.map(function (module) {
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
            '<div class="module-action-row">',
              '<button class="btn-review" type="button" data-review-module="' + escapeHtml(module.id) + '">Revisar bloque</button>',
              '<button class="btn-tool secondary" type="button" data-reset-module="' + escapeHtml(module.id) + '">Vaciar bloque</button>',
            '</div>',
            '<span class="module-status">' + metrics.answered + '/' + metrics.total + ' respondidas · ' +
              (metrics.reviewed ? 'bloque revisado' : 'bloque pendiente') +
            '</span>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderQuestion(module, question, number, reviewed) {
    const selected = state.answers[question.id];
    const correct = reviewed && isQuestionCorrect(question);
    const wrong = reviewed && !correct;
    const hintShown = Boolean(state.hints[question.id]);

    return [
      '<div class="question-card' + (reviewed ? (correct ? ' correct' : ' wrong') : '') + '" data-question-id="' + escapeHtml(question.id) + '" data-module-id="' + escapeHtml(module.id) + '">',
        '<div class="question-head">',
          '<div class="question-num">' + number + '</div>',
          '<div class="question-main">',
            '<p>' + escapeHtml(question.prompt) + '</p>',
            '<div class="question-tools">',
              '<button class="btn-inline" type="button" data-toggle-hint="' + escapeHtml(question.id) + '">' + (hintShown ? 'Ocultar pista' : 'Ver pista') + '</button>',
              '<button class="btn-inline secondary" type="button" data-speak-question="' + escapeHtml(question.id) + '">Escuchar</button>',
            '</div>',
          '</div>',
        '</div>',
        renderQuestionInput(module, question, selected),
        hintShown ? '<div class="hint-box">' + escapeHtml(question.hint) + '</div>' : '',
        reviewed ? renderFeedback(question, correct) : '',
      '</div>'
    ].join('');
  }

  function renderQuestionInput(module, question, selected) {
    if (question.type === 'single') {
      return '<div class="choice-list">' + question.options.map(function (option, index) {
        const inputId = question.id + '-single-' + index;
        return '<label class="choice-label" for="' + escapeHtml(inputId) + '">' +
          '<input type="radio" id="' + escapeHtml(inputId) + '" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option) + '" data-question-id="' + escapeHtml(question.id) + '" data-module-id="' + escapeHtml(module.id) + '"' + (selected === option ? ' checked' : '') + ' />' +
          '<span>' + escapeHtml(option) + '</span>' +
        '</label>';
      }).join('') + '</div>';
    }

    if (question.type === 'multi') {
      const selectedSet = Array.isArray(selected) ? selected : [];
      return '<div class="choice-list">' + question.options.map(function (option, index) {
        const inputId = question.id + '-multi-' + index;
        return '<label class="choice-label" for="' + escapeHtml(inputId) + '">' +
          '<input type="checkbox" id="' + escapeHtml(inputId) + '" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option) + '" data-question-id="' + escapeHtml(question.id) + '" data-module-id="' + escapeHtml(module.id) + '"' + (selectedSet.includes(option) ? ' checked' : '') + ' />' +
          '<span>' + escapeHtml(option) + '</span>' +
        '</label>';
      }).join('') + '</div>';
    }

    if (question.type === 'order') {
      const picked = Array.isArray(selected) ? selected : [];
      return '<div class="order-grid">' + question.answer.map(function (_step, index) {
        return '<label class="order-label">Paso ' + (index + 1) +
          '<select data-question-id="' + escapeHtml(question.id) + '" data-module-id="' + escapeHtml(module.id) + '" data-order-index="' + index + '">' +
            '<option value="">Selecciona…</option>' +
            question.options.map(function (option) {
              return '<option value="' + escapeHtml(option) + '"' + (picked[index] === option ? ' selected' : '') + '>' + escapeHtml(option) + '</option>';
            }).join('') +
          '</select>' +
        '</label>';
      }).join('') + '</div>';
    }

    return '<div class="text-answer">' +
      '<input type="text" class="text-input" value="' + escapeHtml(typeof selected === 'string' ? selected : '') + '" placeholder="' + escapeHtml(question.placeholder || 'Escribe tu respuesta') + '" data-question-id="' + escapeHtml(question.id) + '" data-module-id="' + escapeHtml(module.id) + '" />' +
    '</div>';
  }

  function renderFeedback(question, correct) {
    return '<div class="question-feedback ' + (correct ? 'ok' : 'err') + '">' +
      '<strong>' + (correct ? 'Correcta.' : 'Revisar.') + '</strong> ' + escapeHtml(question.explanation) +
      '<span class="detail">Respuesta esperada: ' + escapeHtml(formatExpectedAnswer(question)) + '</span>' +
    '</div>';
  }

  function renderStats() {
    const totals = getTotals();
    els.practiceStatus.textContent = allModulesReviewed() ? 'Practica resuelta' : 'Practica en progreso';
    els.statModules.textContent = totals.reviewedModules + '/' + totals.totalModules;
    els.statAnswered.textContent = String(totals.answered);
    els.statCorrect.textContent = String(totals.correct);
    els.scoreValue.textContent = totals.totalQuestions
      ? Math.round((totals.correct / totals.totalQuestions) * 100) + '%'
      : '0%';
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
      '<span class="report-kpi">Puntaje: ' + Math.round((totals.correct / totals.totalQuestions) * 100) + '%</span>',
      '<span class="report-kpi">Preguntas: ' + totals.totalQuestions + '</span>'
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
                  return renderReportRow(question, index + 1);
                }).join(''),
              '</tbody>',
            '</table>',
          '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function renderReportRow(question, number) {
    return [
      '<tr>',
        '<td>' + number + '</td>',
        '<td>' + escapeHtml(question.prompt) + '<div class="report-note">' + escapeHtml(question.explanation) + '</div></td>',
        '<td>' + escapeHtml(formatUserAnswer(question)) + '</td>',
        '<td>' + escapeHtml(formatExpectedAnswer(question)) + '</td>',
        '<td class="' + (isQuestionCorrect(question) ? 'result-ok' : 'result-bad') + '">' + (isQuestionCorrect(question) ? 'Correcta' : 'Revisar') + '</td>',
      '</tr>'
    ].join('');
  }

  function getTotals() {
    if (!state.session) {
      return { totalModules: 0, reviewedModules: 0, answered: 0, correct: 0, totalQuestions: 0 };
    }

    return state.session.modules.reduce(function (acc, module) {
      const metrics = getModuleMetrics(module);
      acc.totalModules += 1;
      acc.reviewedModules += metrics.reviewed ? 1 : 0;
      acc.answered += metrics.answered;
      acc.correct += metrics.correct;
      acc.totalQuestions += metrics.total;
      return acc;
    }, { totalModules: 0, reviewedModules: 0, answered: 0, correct: 0, totalQuestions: 0 });
  }

  function getModuleMetrics(module) {
    const answered = module.questions.filter(isQuestionComplete).length;
    const correct = module.questions.filter(isQuestionCorrect).length;
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

  function isQuestionComplete(question) {
    const answer = state.answers[question.id];
    if (question.type === 'single') return typeof answer === 'string' && answer.trim().length > 0;
    if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0;
    if (question.type === 'text') return typeof answer === 'string' && answer.trim().length > 0;
    if (question.type === 'order') {
      return Array.isArray(answer) && answer.length === question.answer.length && answer.every(function (step) {
        return Boolean(step);
      });
    }
    return false;
  }

  function isQuestionCorrect(question) {
    const answer = state.answers[question.id];
    if (!isQuestionComplete(question)) return false;

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
        return normalizeText(step) === normalizeText(answer[index] || '');
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

  function buildSession() {
    return {
      modules: MODULE_TEMPLATES.map(function (module) {
        return {
          id: module.id,
          title: module.title,
          description: module.description,
          questions: shuffle(module.questions.map(cloneQuestion))
        };
      }),
      flashcards: buildFlashcards()
    };
  }

  function cloneQuestion(question) {
    const clone = JSON.parse(JSON.stringify(question));
    if (Array.isArray(clone.options)) {
      clone.options = shuffle(clone.options.slice());
    }
    return clone;
  }

  function buildFlashcards() {
    return shuffle(FLASHCARD_BANK.slice()).slice(0, 12).map(function (item, index) {
      return {
        id: 'flash-' + index + '-' + normalizeText(item[0]).replace(/[^a-z0-9]+/g, '-'),
        front: item[0],
        question: 'Repasa este concepto clave.',
        back: item[1]
      };
    });
  }

  function findModule(moduleId) {
    return state.session
      ? state.session.modules.find(function (module) { return module.id === moduleId; }) || null
      : null;
  }

  function findQuestionById(questionId) {
    if (!state.session) return null;
    for (const module of state.session.modules) {
      for (const question of module.questions) {
        if (question.id === questionId) return question;
      }
    }
    return null;
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
    if (Array.isArray(question.options) && question.options.length > 0) {
      parts.push('Opciones: ' + question.options.join('. '));
    }
    if (question.type === 'text' && question.placeholder) {
      parts.push('Formato esperado: ' + question.placeholder);
    }
    if (question.hint) {
      parts.push('Pista: ' + question.hint);
    }

    speakText(parts.join(' '));
  }

  function speakText(text) {
    if (!text) return;

    stopSpeaking();

    if (!('speechSynthesis' in window)) {
      els.audioChip.textContent = 'Audio no disponible';
      return;
    }

    currentAudio = new SpeechSynthesisUtterance(text);
    currentAudio.lang = 'es-ES';
    currentAudio.rate = 0.95;
    currentAudio.onend = function () {
      currentAudio = null;
      els.audioChip.textContent = 'Audio detenido';
    };
    currentAudio.onerror = function () {
      currentAudio = null;
      els.audioChip.textContent = 'Audio con error';
    };

    els.audioChip.textContent = 'Leyendo seccion';
    window.speechSynthesis.speak(currentAudio);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentAudio = null;
    els.audioChip.textContent = 'Audio detenido';
  }

  function applyPrefs() {
    document.documentElement.style.setProperty('--ipv6-scale', String(prefs.fontScale));
    els.body.classList.toggle('dua-contrast', prefs.contrast);
    els.body.classList.toggle('easy-mode', prefs.easyMode);
    els.body.classList.toggle('practice-only', prefs.practiceOnly);
  }

  function setPressed(button, active) {
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle('is-active', active);
  }

  function openModal() {
    els.studentModal.style.display = 'flex';
  }

  function closeModal() {
    els.studentModal.style.display = 'none';
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (!raw) return baseState();
      const parsed = JSON.parse(raw);
      if (parsed.version !== 2) return baseState();
      if (!parsed.session || !Array.isArray(parsed.session.modules)) return baseState();
      return parsed;
    } catch (error) {
      return baseState();
    }
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (!raw) return basePrefs();
      const parsed = JSON.parse(raw);
      return {
        contrast: Boolean(parsed.contrast),
        easyMode: Boolean(parsed.easyMode),
        practiceOnly: Boolean(parsed.practiceOnly),
        fontScale: typeof parsed.fontScale === 'number' ? parsed.fontScale : 1
      };
    } catch (error) {
      return basePrefs();
    }
  }

  function saveState() {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function savePrefs() {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }

  function baseState() {
    return {
      version: 2,
      student: null,
      session: null,
      answers: {},
      reviewed: {},
      hints: {},
      cardReveal: {},
      startedAt: null
    };
  }

  function basePrefs() {
    return {
      contrast: false,
      easyMode: false,
      practiceOnly: false,
      fontScale: 1
    };
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sameSet(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    const a = left.map(normalizeText).sort();
    const b = right.map(normalizeText).sort();
    return a.every(function (item, index) { return item === b[index]; });
  }

  function shuffle(items) {
    const clone = items.slice();
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = clone[i];
      clone[i] = clone[j];
      clone[j] = temp;
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
