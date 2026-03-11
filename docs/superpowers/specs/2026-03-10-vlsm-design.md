# Design: subnetting-vlsm.html — Ejercicio VLSM interactivo

**Fecha:** 2026-03-10
**Proyecto:** Sites Didácticos — CCNA 1 Subnetting

---

## Objetivo

Nueva página de práctica VLSM donde el estudiante completa un esquema de direccionamiento completo fila por fila, partiendo solo de una lista desordenada de requerimientos de hosts. El sistema genera ejercicios aleatorios con tres niveles de complejidad.

---

## Arquitectura

- **Un solo archivo HTML** self-contained (sin JS externo, sin frameworks)
- Consistente con `subnetting-practica.html` y `subnetting-practica-final.html`
- Dark theme con variables CSS del sitio (--bg, --surface, --border, --ccna, --green, --red)
- Full-width layout, nav aislado del curso

---

## Navegación (actualización global)

Todas las páginas del tema actualizan su nav:

```
Teoría | ANDing | VLSM | Evaluación Final
```

- "Práctica" renombrado a "ANDing" en `subnetting-practica.html`
- Nueva entrada "VLSM" apunta a `subnetting-vlsm.html` en todas las páginas
- `ccna/ccna1/index.html` agrega nuevo topic-item para VLSM

---

## Niveles de complejidad

| Nivel | Subredes LAN | WAN /30 | Total filas | Máscaras usadas |
|---|---|---|---|---|
| Básico | 3 | 0 | 3 | /24–/27 |
| Intermedio | 5 | 0 | 5 | /22–/28 |
| Avanzado | 6 | 4 | 10 | /19–/30 |

---

## UI — Layout A (elegido)

```
[selector nivel ▾]  [Nuevo ejercicio]

Pool de hosts:
[1500] [512] [350] [126] [50] [25] [10] [2] [2] [2] [2]
(chips en el orden dado — desordenados; se tachan al completar la fila)

Tabla:
# | Hosts | Dir. de Red | Prefijo | Máscara | Primer host | Último host | Broadcast | Acción
─────────────────────────────────────────────────────────────────────────────────────────────
1 | [   ] | [         ] | [  ]    | [     ] | [         ] | [         ] | [       ] | [Verificar]  ← activa
2 | ░░░░░ | ░░░░░░░░░░░ | ░░░░    | ░░░░░░░ | ░░░░░░░░░░░ | ░░░░░░░░░░░ | ░░░░░░░░░ |              ← bloqueada
...
```

---

## Columnas de la tabla

| Col | Tipo de input | Ancho | Validación |
|---|---|---|---|
| # | solo lectura | auto | — |
| Hosts | número | 55px | debe ser el mayor pendiente del pool |
| Dir. de Red | IP texto | 105px | AND correcto (o BC_anterior + 1) |
| Prefijo | `/n` texto | 40px | mínimo para los hosts indicados |
| Máscara | IP texto | 110px | consistente con prefijo |
| Primer host | IP texto | 105px | Dir. Red + 1 |
| Último host | IP texto | 105px | Broadcast − 1 |
| Broadcast | IP texto | 105px | Dir. Red + bloque − 1 |
| Acción | botón | — | "Verificar" en fila activa |

---

## Mecánica de verificación

1. Estudiante llena todos los campos de la fila activa y pulsa **Verificar**
2. Sistema valida campo a campo (en orden: Hosts → Dir. Red → Prefijo → Máscara → Primer → Último → Broadcast)
3. Resultado:
   - **Todo correcto**: fila se pinta verde, chip del pool se tacha, siguiente fila se desbloquea
   - **Error(es)**: se muestra fila de feedback bajo la fila activa con mensajes específicos por campo
     - Ej: "Hosts: asigna el mayor pendiente (512)"
     - Ej: "Prefijo: para 512 hosts el mínimo es /23"
     - Ej: "Dir. de Red: debe ser 172.30.8.0 (BC anterior + 1)"
4. El estudiante corrige y puede reintentar sin límite (errores no se penalizan en esta página)

---

## Generación del ejercicio

```javascript
// Estado global
const V = {
  level: 'intermedio',
  baseNet: [172, 20, 0, 0],
  prefix: 16,
  subnets: [],      // [{hosts, net, prefix, mask, first, last, bc}] ordenadas mayor→menor
  hostsGiven: [],   // misma lista pero en orden aleatorio (para mostrar en chips)
  activeRow: 0,
  done: false
}
```

- **Red base**: elegida aleatoriamente según nivel
  - Básico: `192.168.x.0/24` (x aleatorio 1–254)
  - Intermedio: `172.16–31.x.0/16`
  - Avanzado: `10.x.0.0/16`
- **Hosts LAN**: generados aleatoriamente dentro del rango del nivel, sin repetir prefijos
- **Hosts WAN**: 4 entradas de valor `2` (para /30) en nivel Avanzado
- **Presentación del pool**: orden aleatorio (shuffle) de todos los hosts
- **Cálculo interno**: VLSM ordenando hosts mayor→menor, asignando secuencialmente desde red base

---

## Feedback por campo

```javascript
const FIELD_HINTS = {
  hosts:  (expected) => `Hosts: asigna el mayor pendiente (${expected})`,
  net:    (expected) => `Dir. de Red: debe ser ${expected}`,
  prefix: (expected) => `Prefijo: para estos hosts el mínimo es /${expected}`,
  mask:   (expected) => `Máscara: corresponde a /${expected}`,
  first:  (expected) => `Primer host: ${expected} (Dir. Red + 1)`,
  last:   (expected) => `Último host: ${expected} (Broadcast − 1)`,
  bc:     (expected) => `Broadcast: ${expected} (Dir. Red + bloque − 1)`
}
```

---

## Funciones JS a reusar (de practica.html)

- `prefixToMask(n)` → string de máscara
- `maskToPrefix(mask)` → número prefijo
- `wildcard(mask)` → string wildcard
- `netAddr(ip, mask)` → string IP de red
- `broadcast(ip, mask)` → string broadcast
- `addOne(ip)` / `subOne(ip)` → IP siguiente/anterior
- `normIP(str)` → normaliza input del estudiante
- `ipToInt(ip)` / `intToIp(n)` → conversión

---

## Archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `ccna/ccna1/subnetting-vlsm.html` | CREAR |
| `ccna/ccna1/subnetting.html` | Nav: agregar enlace VLSM |
| `ccna/ccna1/subnetting-practica.html` | Nav: renombrar a "ANDing", agregar VLSM |
| `ccna/ccna1/subnetting-practica-final.html` | Nav: agregar VLSM |
| `ccna/ccna1/index.html` | Agregar topic-item VLSM |
