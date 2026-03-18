# Diseño: Migración a Astro — Sites Didácticos

**Fecha:** 2026-03-17
**Autor:** Ing. Andrés Mena Abarca · CTP Platanares
**Estado:** Aprobado (v2)

---

## 1. Contexto

Sites Didácticos es una plataforma educativa de HTML estático publicada en GitHub Pages. El proyecto cubre módulos de CCNA1, CCNA2, Python y Linux para estudiantes hispanohablantes del CTP Platanares. Actualmente cada módulo es un archivo `.html` autocontenido con CSS y JS inline.

**Objetivo:** Migrar la plataforma a Astro para aprovechar layouts reutilizables, routing automático, componentes Svelte interactivos, y un sistema de diseño paramétrico por curso y tipo de página. La migración inicia con `tareas_I_semestre` como prueba de concepto.

---

## 2. Stack Tecnológico

| Tecnología | Rol |
|---|---|
| **Astro** | Framework principal, generador de HTML estático |
| **Svelte** | Componentes interactivos (islands architecture) |
| **nanostores** | Estado compartido entre islands Svelte |
| **CSS custom properties** | Sistema de tokens de diseño paramétrico |
| **JSON** | Datos de ejercicios y configuración global |
| **GitHub Pages** | Deploy estático via GitHub Actions |
| **jsPDF** | Exportación de reportes PDF (cliente) |

---

## 3. Estructura del Proyecto

```
sites-didacticos/
└── astro-site/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── pages/
    │   │   ├── index.astro                          ← dashboard principal
    │   │   └── [curso]/[modulo]/[tipo]/
    │   │       └── [slug].astro                     ← ruta dinámica con getStaticPaths
    │   ├── content/
    │   │   └── ccna1/
    │   │       └── tareas/
    │   │           └── comandos-modulo2.json        ← datos del ejercicio
    │   ├── data/
    │   │   └── config.json                          ← configuración global / "base de datos"
    │   ├── layouts/
    │   │   ├── BaseLayout.astro                     ← base HTML, nav, footer
    │   │   ├── TareaLayout.astro                    ← con reloj de vencimiento
    │   │   ├── ProyectoLayout.astro                 ← con reloj de vencimiento
    │   │   ├── TeoriaLayout.astro                   ← con sidebar TOC, sin reloj
    │   │   └── PracticaLayout.astro                 ← sin reloj
    │   ├── components/
    │   │   ├── ejercicios/
    │   │   │   ├── FillInBlank.svelte
    │   │   │   ├── Matching.svelte
    │   │   │   ├── Ordering.svelte
    │   │   │   └── MultipleChoice.svelte
    │   │   └── ui/
    │   │       ├── CountdownClock.svelte            ← solo tareas y proyectos
    │   │       ├── StudentPanel.svelte
    │   │       ├── ScoreBadge.svelte
    │   │       └── ResultPanel.svelte
    │   ├── stores/
    │   │   └── score.js                             ← nanostore compartido entre islands
    │   └── styles/
    │       ├── tokens.css                           ← variables por curso y tipo
    │       └── base.css                             ← reset + utilidades globales
    ├── astro.config.mjs
    └── package.json
```

---

## 4. Configuración Global — `src/data/config.json`

Archivo único que el docente edita directamente en GitHub para controlar todo el comportamiento de la plataforma. Actúa como base de datos estática. Después de cada edición, un `git push` dispara el rebuild automático y los cambios se reflejan en minutos.

```json
{
  "docente": {
    "nombre": "Ing. Andrés Mena Abarca",
    "institucion": "CTP Platanares"
  },
  "grupos": [
    { "id": "10-1", "nombre": "10-1 Redes", "turno": "mañana" },
    { "id": "10-2", "nombre": "10-2 Redes", "turno": "tarde" },
    { "id": "11-1", "nombre": "11-1 Redes", "turno": "mañana" }
  ],
  "cursos": {
    "ccna1": {
      "nombre": "CCNA1 — ITN",
      "color_accent": "#00b4d8"
    },
    "ccna2": {
      "nombre": "CCNA2 — SRWE",
      "color_accent": "#0077b6"
    },
    "python": {
      "nombre": "Python Fundamentos",
      "color_accent": "#f7c948"
    },
    "linux": {
      "nombre": "Linux Básico",
      "color_accent": "#e85d04"
    }
  },
  "entregas": [
    {
      "id": "comandos-modulo2",
      "curso": "ccna1",
      "modulo": "modulo2",
      "tipo": "tarea",
      "titulo": "Tarea 1 — Comandos Básicos Switch",
      "grupos_habilitados": ["10-1", "10-2", "11-1"],
      "activa": true,
      "fecha_apertura": "2026-03-01T07:00:00",
      "fecha_cierre": "2026-03-28T23:59:00",
      "puntos": 40,
      "google_form_id": "1FAIpQLSe_XXXXXXXXXXXXXXXX",
      "parametros": {
        "mostrar_respuestas": true,
        "exportar_pdf": true
      }
    }
  ]
}
```

**Notas:**
- `color_accent` es el único token de color por curso en config; las superficies se definen por `tipo` en `tokens.css` (ver Sección 5).
- `google_form_id`: reservado para integración futura (Fase 2). En Fase 1 se pasa como prop pero no se activa envío.
- `intentos_maximos`: fuera de alcance en Fase 1, omitido del config para no generar confusión.
- El año del copyright se genera con `new Date().getFullYear()` en `BaseLayout.astro`; no se almacena en config.

### Estados calculados automáticamente desde las fechas

| Condición | Estado | UI |
|---|---|---|
| `activa: false` | Cerrada | 🔒 CERRADA |
| `activa: true` + `fecha_apertura` futura | Próximamente | ⏳ PRÓXIMAMENTE |
| `activa: true` + dentro del rango | Abierta | ✅ ABIERTA |
| `activa: true` + `fecha_cierre` pasada | Finalizada | 📁 FINALIZADA |

---

## 5. Sistema de Diseño — Tokens CSS

### Parametrización por curso (accent inyectado por BaseLayout)

`BaseLayout.astro` inyecta el `color_accent` del curso como variable inline en `<html>`:

```astro
---
const accentColor = config.cursos[course]?.color_accent ?? '#ffffff';
---
<html data-course={course} data-type={type} style={`--accent:${accentColor}`}>
```

Los tokens de superficie se definen en `tokens.css` por tipo de página:

```css
/* ─── SUPERFICIES POR TIPO DE PÁGINA ─── */
[data-type="tarea"]    { --surface: #0d1117; --surface-card: #161b22; }
[data-type="proyecto"] { --surface: #0d1117; --surface-card: #161b22; }
[data-type="teoria"]   { --surface: #0f1923; --surface-card: #162030; }
[data-type="practica"] { --surface: #0a1628; --surface-card: #102040; }

/* ─── ACENTO: heredado del style inline en <html> ─── */
/* --accent ya viene inyectado por BaseLayout */

/* ─── RELOJ: estados de urgencia ─── */
[data-clock="normal"]  { --clock-color: #00ff41; }
[data-clock="warning"] { --clock-color: #ffb800; }  /* < 24h */
[data-clock="danger"]  { --clock-color: #ff3a3a; }  /* < 2h  */

/* ─── GLOBALES ─── */
:root {
  --font-mono: 'Share Tech Mono', monospace;
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Exo 2', sans-serif;
  --radius: 8px;
  --transition: 150ms ease;
  --text-primary: #d0e8d0;
  --text-muted: #6b7f6b;
  --border: rgba(255,255,255,0.08);
}
```

---

## 6. Routing Dinámico — `getStaticPaths`

La página `src/pages/[curso]/[modulo]/[tipo]/[slug].astro` exporta `getStaticPaths` que lee `config.json` para generar todas las rutas en build time:

```astro
---
import config from '../../../../data/config.json';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = () => {
  return config.entregas.map((entrega) => ({
    params: {
      curso: entrega.curso,
      modulo: entrega.modulo,
      tipo: entrega.tipo,
      slug: entrega.id,
    },
    props: { entrega, grupos: config.grupos, docente: config.docente,
             curso: config.cursos[entrega.curso] },
  }));
};

const { entrega, grupos, docente, curso } = Astro.props;
---
```

Cada ruta recibe como props: los datos completos de la entrega, la lista de grupos y los datos del docente.

---

## 7. Layouts

### BaseLayout.astro
- Props: `course: string`, `type: string`, `title: string`, `accentColor: string`
- Aplica `data-course` y `data-type` en `<html>`, inyecta `--accent` como variable CSS inline
- `<meta name="author" content="Ing. Andrés Mena Abarca">`
- Footer: `© {new Date().getFullYear()} Ing. Andrés Mena Abarca · CTP Platanares`
- Carga `tokens.css` y `base.css`

### TareaLayout.astro / ProyectoLayout.astro
- Extiende `BaseLayout`
- Recibe `entrega`, `grupos`, `docente` como props
- Renderiza: `<StudentPanel client:load {grupos} entregaId={entrega.id} />`
- Renderiza: `<CountdownClock client:load fechaApertura={entrega.fecha_apertura} fechaCierre={entrega.fecha_cierre} />`
- Renderiza: `<ScoreBadge client:load totalPuntos={entrega.puntos} />`
- Slot para los componentes de ejercicios

### TeoriaLayout.astro
- Extiende `BaseLayout`
- Sidebar TOC generado desde headings del contenido
- Sin reloj de vencimiento

### PracticaLayout.astro
- Extiende `BaseLayout`
- Sin reloj de vencimiento
- Slot para ejercicios interactivos

---

## 8. Estado Compartido entre Islands — nanostores

Los islands Svelte son aislados entre sí en Astro. Para compartir el puntaje entre `FillInBlank`, `Matching`, `Ordering`, `MultipleChoice` y `ScoreBadge` se usa **nanostores**:

```js
// src/stores/score.js
import { atom, computed } from 'nanostores';

export const sectionScores = atom({
  fillInBlank: 0,
  matching: 0,
  ordering: 0,
  multipleChoice: 0,
});

export const totalScore = computed(sectionScores, (scores) =>
  Object.values(scores).reduce((a, b) => a + b, 0)
);
```

Cada componente de ejercicio importa `sectionScores` y actualiza su sección al verificar. `ScoreBadge` suscribe a `totalScore` y se actualiza reactivamente.

---

## 9. Componentes Svelte

### Directivas de hidratación

| Componente | Directiva | Razón |
|---|---|---|
| `CountdownClock` | `client:load` | Debe iniciar inmediatamente |
| `StudentPanel` | `client:load` | Restaura localStorage antes de interacción |
| `ScoreBadge` | `client:load` | Visible en header, responde al estado global |
| `FillInBlank` | `client:visible` | Hidrata al entrar en viewport |
| `Matching` | `client:visible` | Hidrata al entrar en viewport |
| `Ordering` | `client:visible` | Hidrata al entrar en viewport |
| `MultipleChoice` | `client:visible` | Hidrata al entrar en viewport |
| `ResultPanel` | `client:visible` | Solo visible tras verificación |

### CountdownClock.svelte *(solo tareas y proyectos)*
- Props: `fechaApertura: string`, `fechaCierre: string`
- Cuenta regresiva en tiempo real con `setInterval` de 1 segundo
- Barra de progreso del período de entrega (porcentaje transcurrido)
- Cambia el atributo `data-clock` en `<html>` según urgencia:
  - Normal: más de 24h restantes
  - Warning (`data-clock="warning"`): menos de 24h
  - Danger (`data-clock="danger"`): menos de 2h
- Al llegar a cero: emite `window.dispatchEvent(new CustomEvent('deadline-reached'))` para bloquear todos los islands de ejercicios
- Los components de ejercicios escuchan `window.addEventListener('deadline-reached', ...)` y desactivan sus inputs

### StudentPanel.svelte
- Props: `grupos: Grupo[]`, `entregaId: string`
- Campos: Nombre (required), Grupo (select con opciones desde `grupos`), Fecha
- Clave localStorage: `estudiante_v1_${entregaId}` (formato fijo para evitar colisiones entre tareas)
- Auto-guardado en cada `input` con indicador visual "● GUARDADO"

### FillInBlank.svelte
- Props: `items: FillItem[]`, `puntos: number`, `mostrarRespuestas: boolean`
- Actualiza `sectionScores.fillInBlank` al verificar
- Acepta múltiples formas válidas por ítem (`respuestas_validas: string[]`)
- Si `mostrarRespuestas: false` → no muestra la respuesta esperada en el feedback
- Terminal styling con decoración macOS (dots rojo/amarillo/verde)

### Matching.svelte
- Props: `pares: Par[]`, `puntos: number`
- Shuffle aleatorio en cada carga
- Click-to-pair con feedback visual; actualiza `sectionScores.matching`

### Ordering.svelte
- Props: `pasos: Paso[]`, `contexto: string`, `puntos: number`
- Dropdowns numéricos 1-N; actualiza `sectionScores.ordering`

### MultipleChoice.svelte
- Props: `preguntas: Pregunta[]`, `puntos: number`, `mostrarRespuestas: boolean`
- Radio buttons; actualiza `sectionScores.multipleChoice`
- Si `mostrarRespuestas: false` → no resalta la respuesta correcta post-verificación

### ScoreBadge.svelte
- Props: `totalPuntos: number`
- Lee `totalScore` de nanostores directamente
- Muestra `{totalScore} / {totalPuntos}` en tiempo real

### ResultPanel.svelte
- Props: `totalPuntos: number`, `exportarPdf: boolean`
- Lee `totalScore` de nanostores
- Cuatro niveles de feedback:
  - 🏆 EXCELENTE (≥90%)
  - ✅ MUY BIEN (≥75%)
  - ⚠️ ACEPTABLE (≥60%)
  - 🔁 NECESITA REFUERZO (<60%)
- Botón PDF solo si `exportarPdf: true`; usa jsPDF en cliente

---

## 10. Dashboard Principal — `index.astro`

Lee `config.json` en build time y renderiza una grilla de cards por entrega:

```
┌─────────────────────────────────────┐
│  Sites Didácticos                   │
│  Ing. Andrés Mena Abarca            │
│  CTP Platanares · CCNA1 2026        │
├─────────────────────────────────────┤
│  [Card] Tarea 1 — Comandos Switch   │
│  ccna1 · modulo2 · 40 pts           │
│  ✅ ABIERTA  |  Cierra: 28 Mar      │
│  [→ Ir a la tarea]                  │
└─────────────────────────────────────┘
```

- Estado calculado en build time desde `fecha_apertura`, `fecha_cierre` y `activa`
- Cards coloreadas con el `--accent` del curso correspondiente
- Tarjetas de cursos sin entregas activas aparecen como "Próximamente"
- **Limitación conocida:** el estado del dashboard se calcula al momento del build. Si una tarea vence sin que el profesor haga `git push`, la card seguirá mostrando "ABIERTA" hasta el siguiente deploy. Para cierres por fecha, se recomienda que el profesor ajuste `activa: false` en `config.json` y haga push al vencer el plazo. El bloqueo real del ejercicio sí ocurre en tiempo real vía `CountdownClock` en la página de la tarea.

---

## 11. Estructura de Datos del Ejercicio

Archivo: `src/content/ccna1/tareas/comandos-modulo2.json`

```json
{
  "id": "comandos-modulo2",
  "titulo": "Tarea 1 — Comandos Básicos Switch",
  "curso": "ccna1",
  "tipo": "tarea",
  "secciones": {
    "fillInBlank": {
      "puntos": 20,
      "items": [
        {
          "id": 1,
          "descripcion": "Entrar al modo privilegiado",
          "prompt": "Switch> ",
          "respuestas_validas": ["enable", "en"]
        }
      ]
    },
    "matching": {
      "puntos": 10,
      "pares": [
        { "comando": "enable", "definicion": "Accede al modo EXEC privilegiado" }
      ]
    },
    "ordering": {
      "puntos": 5,
      "contexto": "Secuencia para configurar SVI en Switch",
      "pasos": [
        { "orden": 1, "comando": "interface vlan 1" },
        { "orden": 2, "comando": "ip address 192.168.1.1 255.255.255.0" },
        { "orden": 3, "comando": "no shutdown" },
        { "orden": 4, "comando": "end" },
        { "orden": 5, "comando": "copy running-config startup-config" }
      ]
    },
    "multipleChoice": {
      "puntos": 5,
      "preguntas": [
        {
          "id": 1,
          "texto": "¿Qué comando guarda la configuración permanentemente?",
          "opciones": [
            "write memory",
            "copy running-config startup-config",
            "save config",
            "commit"
          ],
          "correcta": 1
        }
      ]
    }
  }
}
```

---

## 12. Flujo Completo de Datos

```
src/data/config.json
    │
    ├── Astro build time (getStaticPaths)
    │       ├── genera rutas: /ccna1/modulo2/tarea/comandos-modulo2
    │       ├── pasa props: entrega, grupos, docente, curso
    │       ├── inyecta data-course, data-type, --accent en <html>
    │       └── index.astro renderiza cards del dashboard
    │
    └── Svelte run time (cliente)
            ├── CountdownClock (client:load)
            │     └── window.dispatchEvent('deadline-reached') al vencer
            ├── StudentPanel   (client:load)  ← localStorage key: estudiante_v1_{id}
            ├── FillInBlank    (client:visible) ─┐
            ├── Matching       (client:visible)  ├─ actualizan nanostores/score.js
            ├── Ordering       (client:visible)  │
            ├── MultipleChoice (client:visible) ─┘
            ├── ScoreBadge     (client:load)   ← suscrito a totalScore nanostore
            └── ResultPanel    (client:visible) ← lee totalScore + exporta PDF
```

---

## 13. Configuración de Astro y GitHub Pages

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'static',
  site: 'https://<usuario>.github.io',
  base: '/sites-didacticos',
  integrations: [svelte()],
});
```

No se requiere adapter para salida estática en GitHub Pages.

### `.github/workflows/deploy.yml`

```yaml
name: Deploy Astro to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd astro-site && npm ci && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: astro-site/dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 14. Atribución y Licencia

Presente en cada página generada:

```html
<meta name="author" content="Ing. Andrés Mena Abarca">
```

```
Footer: © {new Date().getFullYear()} Ing. Andrés Mena Abarca · CTP Platanares
        CCNA1 — ITN · Contenido bajo licencia CC BY-NC-SA 4.0
```

---

## 15. Fases de Migración

| Fase | Alcance |
|---|---|
| **Fase 1 (actual)** | Crear proyecto Astro, implementar todos los layouts y componentes, migrar `comandos-modulo2` con datos reales, configurar GitHub Actions |
| **Fase 2** | Migrar resto de `tareas_I_semestre`; activar integración Google Forms |
| **Fase 3** | Migrar subnetting, IPv6, VLSM y demás módulos de teoría y práctica |
