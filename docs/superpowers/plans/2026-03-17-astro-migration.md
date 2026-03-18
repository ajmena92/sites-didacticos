# Astro Migration — Sites Didácticos Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el proyecto Astro base y migrar `tarea_comandos_modulo2_2026.html` como módulo piloto completo.

**Architecture:** Proyecto Astro estático en `astro-site/` con Svelte islands para interactividad, nanostores para estado compartido entre islands, y `src/data/config.json` como base de datos estática controlada por el docente. Deploy a GitHub Pages via GitHub Actions.

**Tech Stack:** Astro 4, Svelte 4, nanostores, jsPDF 2.5, GitHub Pages, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-17-astro-migration-design.md`

---

## File Map

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `astro-site/astro.config.mjs` | Config | Astro config + Svelte integration + GitHub Pages base |
| `astro-site/package.json` | Config | Dependencias del proyecto |
| `astro-site/src/data/config.json` | Data | Config global: docente, grupos, cursos, entregas |
| `astro-site/src/content/config.ts` | Config | Schema de Content Collections (requerido por Astro 4) |
| `astro-site/src/content/ccna1/tareas/comandos-modulo2.json` | Data | Datos completos del ejercicio piloto |
| `astro-site/src/stores/score.js` | Store | Estado de puntaje compartido entre islands (nanostores) |
| `astro-site/src/styles/tokens.css` | Styles | Tokens CSS por curso y tipo de página |
| `astro-site/src/styles/base.css` | Styles | Reset + utilidades globales |
| `astro-site/src/layouts/BaseLayout.astro` | Layout | HTML base, meta, footer con año dinámico, tokens |
| `astro-site/src/layouts/TareaLayout.astro` | Layout | Layout para tareas: StudentPanel + CountdownClock + ScoreBadge |
| `astro-site/src/components/ui/CountdownClock.svelte` | Component | Reloj regresivo con urgencia y bloqueo por deadline |
| `astro-site/src/components/ui/StudentPanel.svelte` | Component | Nombre, grupo, fecha + auto-save localStorage |
| `astro-site/src/components/ui/ScoreBadge.svelte` | Component | Puntaje en tiempo real desde nanostore |
| `astro-site/src/components/ui/ResultPanel.svelte` | Component | Panel de resultados con 4 niveles + export PDF |
| `astro-site/src/components/ejercicios/FillInBlank.svelte` | Component | Ejercicio completar comandos |
| `astro-site/src/components/ejercicios/Matching.svelte` | Component | Ejercicio relacionar columnas |
| `astro-site/src/components/ejercicios/Ordering.svelte` | Component | Ejercicio ordenar secuencia |
| `astro-site/src/components/ejercicios/MultipleChoice.svelte` | Component | Ejercicio selección múltiple |
| `astro-site/src/pages/index.astro` | Page | Dashboard principal con cards de entregas |
| `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro` | Page | Ruta dinámica para ejercicios |
| `.github/workflows/deploy.yml` | CI/CD | GitHub Actions deploy a GitHub Pages |

---

## Chunk 1: Scaffold + Datos + Estilos

### Task 1: Inicializar proyecto Astro

**Files:**
- Create: `astro-site/astro.config.mjs`
- Create: `astro-site/package.json`

- [ ] **Step 1.1: Crear directorio e inicializar Astro**

Desde `/mnt/c/dev/sites-didacticos`:
```bash
mkdir astro-site && cd astro-site
npm create astro@4 . -- --template minimal --no-git --install --typescript strict
```
Cuando pregunte: usar TypeScript `strict`, no instalar git, sí instalar dependencias.

- [ ] **Step 1.2: Agregar integraciones**

```bash
cd astro-site
npx astro add svelte --yes
npm install nanostores @nanostores/svelte
# jsPDF se carga vía CDN desde BaseLayout — no requiere instalación npm
```

- [ ] **Step 1.3: Reemplazar `astro.config.mjs`**

```js
// astro-site/astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'static',
  site: 'https://andres-mena.github.io',
  base: '/sites-didacticos',
  integrations: [svelte()],
});
```

> **Nota:** Reemplazar `andres-mena` con el usuario real de GitHub del docente.

- [ ] **Step 1.4: Verificar que el proyecto compila**

```bash
cd astro-site && npm run build
```
Esperado: `✓ Completed in Xs` sin errores.

- [ ] **Step 1.5: Commit**

```bash
git add astro-site/
git commit -m "feat: inicializar proyecto Astro con Svelte y nanostores"
```

---

### Task 2: Crear archivos de datos

**Files:**
- Create: `astro-site/src/data/config.json`
- Create: `astro-site/src/content/ccna1/tareas/comandos-modulo2.json`

- [ ] **Step 2.1: Crear `src/data/config.json`**

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
      "google_form_id": "PENDIENTE_FASE2",
      "parametros": {
        "mostrar_respuestas": true,
        "exportar_pdf": true
      }
    }
  ]
}
```

- [ ] **Step 2.2: Crear `src/content/config.ts` (requerido por Astro 4)**

Astro 4 reserva `src/content/` para la Content Collections API y requiere un archivo de schema. Crear:

```ts
// astro-site/src/content/config.ts
import { defineCollection, z } from 'astro:content';

const ejerciciosCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    titulo: z.string(),
    subtitulo: z.string().optional(),
    contexto: z.string().optional(),
    curso: z.string(),
    tipo: z.string(),
    modos_referencia: z.array(z.object({
      prompt: z.string(),
      modo: z.string(),
      acceso: z.string(),
    })).optional(),
    secciones: z.object({
      fillInBlank: z.object({
        puntos: z.number(),
        titulo: z.string().optional(),
        items: z.array(z.object({
          id: z.number(),
          prompt: z.string(),
          desc: z.string(),
          post: z.string().optional(),
          respuestas_validas: z.array(z.string()),
        })),
      }).optional(),
      matching: z.object({
        puntos: z.number(),
        titulo: z.string().optional(),
        pares: z.array(z.object({
          id: z.string(),
          comando: z.string(),
          definicion: z.string(),
        })),
      }).optional(),
      ordering: z.object({
        puntos: z.number(),
        titulo: z.string().optional(),
        contexto: z.string().optional(),
        pasos: z.array(z.object({
          orden: z.number(),
          label: z.string(),
        })),
      }).optional(),
      multipleChoice: z.object({
        puntos: z.number(),
        titulo: z.string().optional(),
        preguntas: z.array(z.object({
          id: z.string(),
          texto: z.string(),
          opciones: z.array(z.string()),
          correcta: z.number(),
        })),
      }).optional(),
    }),
  }),
});

export const collections = {
  'ccna1/tareas': ejerciciosCollection,
};
```

- [ ] **Step 2.3: Crear directorio y `comandos-modulo2.json`**

Crear carpeta `astro-site/src/content/ccna1/tareas/` y el archivo:

```json
{
  "id": "comandos-modulo2",
  "titulo": "Tarea 1 — Comandos Básicos Switch",
  "subtitulo": "ITN — MÓDULO 2 · TAREA 1",
  "contexto": "El técnico del CTP Platanares está configurando un switch nuevo. Acaba de encenderlo y necesita realizar la configuración inicial.",
  "curso": "ccna1",
  "tipo": "tarea",
  "modos_referencia": [
    { "prompt": "Switch>",          "modo": "EXEC de usuario",        "acceso": "Inicio de sesión" },
    { "prompt": "Switch#",          "modo": "EXEC privilegiado",       "acceso": "enable" },
    { "prompt": "Switch(config)#",  "modo": "Configuración global",    "acceso": "configure terminal" },
    { "prompt": "Switch(config-line)#", "modo": "Configuración de línea", "acceso": "line console 0 / line vty 0 15" },
    { "prompt": "Switch(config-if)#",   "modo": "Configuración de interfaz", "acceso": "interface [tipo] [num]" }
  ],
  "secciones": {
    "fillInBlank": {
      "puntos": 20,
      "titulo": "Complete el Comando",
      "items": [
        { "id": 1, "prompt": "Switch> ",         "desc": "Ingresa al modo EXEC privilegiado.",                                               "respuestas_validas": ["enable"] },
        { "id": 2, "prompt": "Switch# ",          "desc": "Ingresa al modo de configuración global.",                                        "respuestas_validas": ["configure terminal", "conf t", "conf terminal"] },
        { "id": 3, "prompt": "Switch(config)# ",  "desc": "Asigna un nombre de host único al dispositivo.",                                  "respuestas_validas": ["hostname"] },
        { "id": 4, "prompt": "SW-CTP(config)# ",  "desc": "Contraseña encriptada para el modo EXEC privilegiado.",  "post": " Cisco2025#",   "respuestas_validas": ["enable secret"] },
        { "id": 5, "prompt": "SW-CTP(config)# ",  "desc": "Accede al modo de configuración del puerto de consola.",                          "respuestas_validas": ["line console 0", "line con 0"] },
        { "id": 6, "prompt": "SW-CTP(config)# ",  "desc": "Encripta las contraseñas en texto plano del archivo de configuración.",           "respuestas_validas": ["service password-encryption"] },
        { "id": 7, "prompt": "SW-CTP# ",          "desc": "Guarda la configuración activa en la NVRAM (startup-config).",                    "respuestas_validas": ["copy running-config startup-config", "copy run start", "wr", "write"] },
        { "id": 8, "prompt": "SW-CTP# ",          "desc": "Borra la configuración guardada en la NVRAM.",                                    "respuestas_validas": ["erase startup-config", "erase start"] },
        { "id": 9, "prompt": "SW-CTP(config-if)# ","desc": "Habilita (activa) una interfaz administrativamente apagada.",                   "respuestas_validas": ["no shutdown", "no shut"] },
        { "id": 10,"prompt": "SW-CTP# ",          "desc": "Muestra la configuración activa en la RAM del dispositivo.",                      "respuestas_validas": ["show running-config", "show run"] }
      ]
    },
    "matching": {
      "puntos": 10,
      "titulo": "Relacione Columnas",
      "pares": [
        { "id": "m1", "comando": "end",                    "definicion": "Sale de cualquier subconfiguración y regresa directamente al modo EXEC privilegiado" },
        { "id": "m2", "comando": "banner motd #",          "definicion": "Crea un mensaje de aviso del día que aparece al conectarse al dispositivo" },
        { "id": "m3", "comando": "reload",                 "definicion": "Reinicia el dispositivo; cambios sin guardar en running-config se perderán" },
        { "id": "m4", "comando": "line vty 0 15",          "definicion": "Accede al modo de configuración de líneas virtuales para Telnet/SSH" },
        { "id": "m5", "comando": "ip address [IP] [mask]", "definicion": "Asigna una dirección IP y máscara de subred a una interfaz de red" }
      ]
    },
    "ordering": {
      "puntos": 5,
      "titulo": "Ordene la Secuencia",
      "contexto": "Secuencia correcta para configurar la interfaz SVI (VLAN 1) en un switch Cisco:",
      "pasos": [
        { "orden": 1, "label": "Switch# configure terminal" },
        { "orden": 2, "label": "Switch(config)# interface vlan 1" },
        { "orden": 3, "label": "Switch(config-if)# ip address 192.168.1.20 255.255.255.0" },
        { "orden": 4, "label": "Switch(config-if)# no shutdown" },
        { "orden": 5, "label": "Switch(config-if)# end" }
      ]
    },
    "multipleChoice": {
      "puntos": 5,
      "titulo": "Preguntas de Escenario",
      "preguntas": [
        {
          "id": "q1",
          "texto": "El técnico conecta su laptop al switch con un cable de consola y abre PuTTY. ¿En qué modo IOS se encuentra al conectarse por primera vez?",
          "opciones": [
            "EXEC privilegiado — Switch#",
            "EXEC de usuario — Switch>",
            "Configuración global — Switch(config)#",
            "Configuración de interfaz — Switch(config-if)#"
          ],
          "correcta": 1
        },
        {
          "id": "q2",
          "texto": "Ejecuta show running-config y ve la contraseña de consola en texto plano. ¿Qué comando debe usar para solucionar esto?",
          "opciones": [
            "enable secret [contraseña]",
            "password encryption enable",
            "service password-encryption",
            "encrypt all passwords"
          ],
          "correcta": 2
        },
        {
          "id": "q3",
          "texto": "Aplicó cambios erróneos. La startup-config NO fue modificada. ¿Cuál es la forma más rápida de deshacer todos los cambios?",
          "opciones": [
            "Ejecutar erase startup-config y apagar el switch",
            "Ejecutar reload para reiniciar el dispositivo",
            "Ejecutar copy startup-config running-config y luego reload",
            "Desconectar el cable de consola y reconectarse"
          ],
          "correcta": 1
        },
        {
          "id": "q4",
          "texto": "El técnico teclea Switch# interface vlan 1 y obtiene % Invalid input detected. ¿Por qué ocurrió este error?",
          "opciones": [
            "La VLAN 1 no existe en el switch",
            "El switch no soporta interfaces virtuales",
            "El comando interface debe ejecutarse desde el modo de configuración global",
            "Falta escribir VLAN en mayúsculas"
          ],
          "correcta": 2
        },
        {
          "id": "q5",
          "texto": "¿Cuál es la diferencia entre startup-config y running-config?",
          "opciones": [
            "Son idénticos; se sincronizan automáticamente en tiempo real",
            "startup-config está en RAM (volátil); running-config está en NVRAM (no volátil)",
            "running-config está en RAM (volátil); startup-config está en NVRAM y se carga al reiniciar",
            "startup-config contiene solo contraseñas; running-config contiene toda la configuración"
          ],
          "correcta": 2
        }
      ]
    }
  }
}
```

- [ ] **Step 2.4: Verificar build con los datos**

```bash
cd astro-site && npm run build
```
Esperado: sin errores.

- [ ] **Step 2.5: Commit**

```bash
git add astro-site/src/data/ astro-site/src/content/
git commit -m "feat: agregar config.json, schema de colecciones y datos del ejercicio comandos-modulo2"
```

---

### Task 3: Sistema de estilos

**Files:**
- Create: `astro-site/src/styles/tokens.css`
- Create: `astro-site/src/styles/base.css`

- [ ] **Step 3.1: Crear `tokens.css`**

```css
/* astro-site/src/styles/tokens.css */

/* ─── TIPOGRAFÍA ─── */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');

:root {
  --font-mono:    'Share Tech Mono', monospace;
  --font-display: 'Orbitron', sans-serif;
  --font-body:    'Exo 2', sans-serif;

  --radius:     8px;
  --radius-sm:  4px;
  --transition: 150ms ease;

  --text-primary: #d0e8d0;
  --text-muted:   #6b7f6b;
  --border:       rgba(255, 255, 255, 0.08);

  /* Colores de estado */
  --color-correct: #00ff41;
  --color-error:   #ff3a3a;
  --color-warn:    #ffb800;
}

/* ─── SUPERFICIES POR TIPO DE PÁGINA ─── */
[data-type="tarea"]    { --surface: #0d1117; --surface-card: #161b22; }
[data-type="proyecto"] { --surface: #0d1117; --surface-card: #161b22; }
[data-type="teoria"]   { --surface: #0f1923; --surface-card: #162030; }
[data-type="practica"] { --surface: #0a1628; --surface-card: #102040; }

/* ─── RELOJ: estados de urgencia ─── */
[data-clock="normal"]  { --clock-color: #00ff41; }
[data-clock="warning"] { --clock-color: #ffb800; }
[data-clock="danger"]  { --clock-color: #ff3a3a; }
```

- [ ] **Step 3.2: Crear `base.css`**

```css
/* astro-site/src/styles/base.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  background-color: var(--surface, #0d1117);
  color: var(--text-primary, #d0e8d0);
  font-family: var(--font-body, sans-serif);
  font-size: 16px;
  line-height: 1.6;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

a { color: var(--accent, #00b4d8); text-decoration: none; }
a:hover { text-decoration: underline; }

h1, h2, h3 { font-family: var(--font-display); letter-spacing: 0.05em; }

code, pre { font-family: var(--font-mono); }

.card {
  background: var(--surface-card, #161b22);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--accent, #00b4d8);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent, #00b4d8);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.btn:hover { background: var(--accent, #00b4d8); color: #000; }
.btn-primary { background: var(--accent, #00b4d8); color: #000; }
.btn-primary:hover { opacity: 0.85; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
.badge-open    { background: #00ff4122; color: #00ff41; border: 1px solid #00ff4144; }
.badge-closed  { background: #ff3a3a22; color: #ff3a3a; border: 1px solid #ff3a3a44; }
.badge-soon    { background: #ffb80022; color: #ffb800; border: 1px solid #ffb80044; }
.badge-done    { background: #6b7f6b22; color: #6b7f6b; border: 1px solid #6b7f6b44; }

@media (max-width: 640px) {
  body { padding: 0.75rem; }
}
```

- [ ] **Step 3.3: Commit**

```bash
git add astro-site/src/styles/
git commit -m "feat: agregar sistema de tokens CSS y estilos base"
```

---

## Chunk 2: Store + Layouts

### Task 4: Score store (nanostores)

**Files:**
- Create: `astro-site/src/stores/score.js`

- [ ] **Step 4.1: Crear el store**

```js
// astro-site/src/stores/score.js
import { atom, computed } from 'nanostores';

export const sectionScores = atom({
  fillInBlank: 0,
  matching: 0,
  ordering: 0,
  multipleChoice: 0,
});

export const totalScore = computed(sectionScores, (scores) =>
  Object.values(scores).reduce((sum, v) => sum + v, 0)
);

export function updateSection(section, points) {
  sectionScores.set({ ...sectionScores.get(), [section]: points });
}
```

- [ ] **Step 4.2: Commit**

```bash
git add astro-site/src/stores/
git commit -m "feat: agregar nanostore de puntaje compartido"
```

---

### Task 5: BaseLayout

**Files:**
- Create: `astro-site/src/layouts/BaseLayout.astro`

- [ ] **Step 5.1: Crear `BaseLayout.astro`**

```astro
---
// astro-site/src/layouts/BaseLayout.astro
import config from '../data/config.json';
import '../styles/tokens.css';
import '../styles/base.css';

interface Props {
  title: string;
  course: string;
  type: string;
}

const { title, course, type } = Astro.props;
const accentColor = config.cursos[course as keyof typeof config.cursos]?.color_accent ?? '#ffffff';
const cursoNombre = config.cursos[course as keyof typeof config.cursos]?.nombre ?? course;
const year = new Date().getFullYear();
---

<!doctype html>
<html lang="es" data-course={course} data-type={type} data-clock="normal" style={`--accent:${accentColor}`}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="Ing. Andrés Mena Abarca" />
    <meta name="description" content={`${title} — ${cursoNombre} · CTP Platanares`} />
    <title>{title} — Sites Didácticos</title>
    <link rel="icon" type="image/svg+xml" href="/sites-didacticos/favicon.svg" />
  </head>
  <body>
    <slot />
    <footer>
      <p>© {year} Ing. Andrés Mena Abarca · CTP Platanares</p>
      <p>{cursoNombre} · Contenido bajo licencia <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a></p>
    </footer>
  </body>
</html>

<style>
  footer {
    margin-top: 3rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    line-height: 1.8;
  }
  footer a { color: var(--text-muted); }
  footer a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 5.2: Commit**

```bash
git add astro-site/src/layouts/BaseLayout.astro
git commit -m "feat: agregar BaseLayout con tokens, meta y footer de autoría"
```

---

### Task 6: TareaLayout

**Files:**
- Create: `astro-site/src/layouts/TareaLayout.astro`

- [ ] **Step 6.1: Crear `TareaLayout.astro`**

```astro
---
// astro-site/src/layouts/TareaLayout.astro
import BaseLayout from './BaseLayout.astro';
import CountdownClock from '../components/ui/CountdownClock.svelte';
import StudentPanel from '../components/ui/StudentPanel.svelte';
import ScoreBadge from '../components/ui/ScoreBadge.svelte';

interface Props {
  titulo: string;
  subtitulo: string;
  curso: string;
  entregaId: string;
  fechaApertura: string;
  fechaCierre: string;
  puntos: number;
  grupos: { id: string; nombre: string; turno: string }[];
  exportarPdf?: boolean;
}

const { titulo, subtitulo, curso, entregaId, fechaApertura, fechaCierre, puntos, grupos, exportarPdf = false } = Astro.props;
---

<BaseLayout title={titulo} course={curso} type="tarea" exportarPdf={exportarPdf}>
  <header class="tarea-header">
    <div class="header-brand">
      <span class="brand-path">CISCO › {curso.toUpperCase()}</span>
      <ScoreBadge client:load totalPuntos={puntos} />
    </div>
    <h1 class="header-title">{titulo}</h1>
    <p class="header-sub">{subtitulo}</p>
  </header>

  <CountdownClock client:load fechaApertura={fechaApertura} fechaCierre={fechaCierre} />
  <StudentPanel client:load grupos={grupos} entregaId={entregaId} />

  <main>
    <slot />
  </main>
</BaseLayout>

<style>
  .tarea-header {
    padding: 2rem 0 1.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }
  .header-brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .brand-path {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--accent);
    letter-spacing: 0.1em;
  }
  .header-title {
    font-size: 1.4rem;
    color: var(--accent);
    margin-bottom: 0.25rem;
  }
  .header-sub {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  main { display: flex; flex-direction: column; gap: 2rem; }
</style>
```

- [ ] **Step 6.2: Commit**

```bash
git add astro-site/src/layouts/TareaLayout.astro
git commit -m "feat: agregar TareaLayout con header, reloj y panel de estudiante"
```

---

## Chunk 3: Componentes UI

### Task 7: CountdownClock

**Files:**
- Create: `astro-site/src/components/ui/CountdownClock.svelte`

- [ ] **Step 7.1: Crear `CountdownClock.svelte`**

```svelte
<!-- astro-site/src/components/ui/CountdownClock.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';

  export let fechaApertura;
  export let fechaCierre;

  let timeLeft = '';
  let progress = 0;
  let urgency = 'normal';
  let statusLabel = '';
  let interval;

  function calcState() {
    const now = Date.now();
    const open = new Date(fechaApertura).getTime();
    const close = new Date(fechaCierre).getTime();

    if (now < open) {
      statusLabel = '⏳ PRÓXIMAMENTE';
      timeLeft = '';
      progress = 0;
      urgency = 'normal';
      return;
    }

    if (now > close) {
      statusLabel = '📁 TAREA CERRADA';
      timeLeft = '00d : 00h : 00m : 00s';
      progress = 100;
      urgency = 'danger';
      document.documentElement.setAttribute('data-clock', 'danger');
      window.dispatchEvent(new CustomEvent('deadline-reached'));
      clearInterval(interval);
      return;
    }

    const remaining = close - now;
    const total = close - open;
    progress = Math.round(((now - open) / total) * 100);

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    timeLeft = `${String(days).padStart(2,'0')}d : ${String(hours).padStart(2,'0')}h : ${String(mins).padStart(2,'0')}m : ${String(secs).padStart(2,'0')}s`;

    if (remaining < 7200000) urgency = 'danger';
    else if (remaining < 86400000) urgency = 'warning';
    else urgency = 'normal';

    statusLabel = '✅ ENTREGA ABIERTA';
    document.documentElement.setAttribute('data-clock', urgency);
  }

  onMount(() => {
    calcState();
    interval = setInterval(calcState, 1000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<div class="clock" data-urgency={urgency}>
  <div class="clock-label">⏰ {statusLabel}</div>
  {#if timeLeft}
    <div class="clock-time">{timeLeft}</div>
    <div class="clock-bar-wrap">
      <div class="clock-bar" style="width:{progress}%"></div>
    </div>
    <div class="clock-dates">
      Abierta: {new Date(fechaApertura).toLocaleDateString('es-CR', {day:'2-digit',month:'short'})} ·
      Cierra: {new Date(fechaCierre).toLocaleDateString('es-CR', {day:'2-digit',month:'short'})}
    </div>
  {/if}
</div>

<style>
  .clock {
    background: var(--surface-card, #161b22);
    border: 1px solid var(--clock-color, var(--accent));
    border-radius: var(--radius);
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .clock-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .clock-time {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--clock-color, var(--accent));
    letter-spacing: 0.05em;
  }
  .clock-bar-wrap {
    background: var(--border);
    border-radius: 100px;
    height: 6px;
    overflow: hidden;
  }
  .clock-bar {
    height: 100%;
    background: var(--clock-color, var(--accent));
    border-radius: 100px;
    transition: width 1s linear;
  }
  .clock-dates {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
  }
</style>
```

- [ ] **Step 7.2: Commit**

```bash
git add astro-site/src/components/ui/CountdownClock.svelte
git commit -m "feat: agregar componente CountdownClock con urgencia y deadline-reached"
```

---

### Task 8: StudentPanel

**Files:**
- Create: `astro-site/src/components/ui/StudentPanel.svelte`

- [ ] **Step 8.1: Crear `StudentPanel.svelte`**

```svelte
<!-- astro-site/src/components/ui/StudentPanel.svelte -->
<script>
  import { onMount } from 'svelte';

  export let grupos = [];
  export let entregaId = '';

  const SK = `estudiante_v1_${entregaId}`;

  let nombre = '';
  let grupo = '';
  let fecha = new Date().toISOString().split('T')[0];
  let saved = false;
  let saveTimer;

  function save() {
    localStorage.setItem(SK, JSON.stringify({ nombre, grupo, fecha }));
    saved = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => (saved = false), 2000);
  }

  onMount(() => {
    const stored = localStorage.getItem(SK);
    if (stored) {
      const data = JSON.parse(stored);
      nombre = data.nombre ?? '';
      grupo  = data.grupo  ?? '';
      fecha  = data.fecha  ?? fecha;
    }
  });
</script>

<div class="panel card">
  <div class="panel-grid">
    <label class="field">
      <span class="field-label">Nombre completo *</span>
      <input
        type="text"
        bind:value={nombre}
        on:input={save}
        placeholder="Apellido Apellido, Nombre"
        required
      />
    </label>

    <label class="field">
      <span class="field-label">Grupo</span>
      <select bind:value={grupo} on:change={save}>
        <option value="">— Seleccione —</option>
        {#each grupos as g}
          <option value={g.id}>{g.nombre}</option>
        {/each}
      </select>
    </label>

    <label class="field">
      <span class="field-label">Fecha</span>
      <input type="date" bind:value={fecha} on:change={save} />
    </label>
  </div>

  <div class="save-ind" class:show={saved}>● GUARDADO</div>
</div>

<style>
  .panel { margin-bottom: 1.5rem; }
  .panel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  input, select {
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
    transition: border-color var(--transition);
  }
  input:focus, select:focus {
    outline: none;
    border-color: var(--accent);
  }
  .save-ind {
    margin-top: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-correct);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .save-ind.show { opacity: 1; }
</style>
```

- [ ] **Step 8.2: Commit**

```bash
git add astro-site/src/components/ui/StudentPanel.svelte
git commit -m "feat: agregar StudentPanel con grupos dinámicos y auto-save"
```

---

### Task 9: ScoreBadge y ResultPanel

**Files:**
- Create: `astro-site/src/components/ui/ScoreBadge.svelte`
- Create: `astro-site/src/components/ui/ResultPanel.svelte`

- [ ] **Step 9.1: Crear `ScoreBadge.svelte`**

```svelte
<!-- astro-site/src/components/ui/ScoreBadge.svelte -->
<script>
  import { useStore } from '@nanostores/svelte';
  import { totalScore } from '../../stores/score.js';

  export let totalPuntos;

  const score = useStore(totalScore);
</script>

<div class="badge-score">
  <span class="score-val">{$score}</span>
  <span class="score-sep">/</span>
  <span class="score-total">{totalPuntos}</span>
  <span class="score-label">pts</span>
</div>

<style>
  .badge-score {
    display: inline-flex;
    align-items: baseline;
    gap: 0.15rem;
    font-family: var(--font-display);
    background: var(--surface-card, #161b22);
    border: 1px solid var(--accent);
    border-radius: 100px;
    padding: 0.2rem 0.8rem;
  }
  .score-val   { font-size: 1.1rem; color: var(--accent); font-weight: 700; }
  .score-sep   { font-size: 0.85rem; color: var(--text-muted); }
  .score-total { font-size: 0.85rem; color: var(--text-muted); }
  .score-label { font-size: 0.65rem; color: var(--text-muted); margin-left: 0.1rem; }
</style>
```

- [ ] **Step 9.2: Crear `ResultPanel.svelte`**

```svelte
<!-- astro-site/src/components/ui/ResultPanel.svelte -->
<script>
  import { useStore } from '@nanostores/svelte';
  import { totalScore, sectionScores } from '../../stores/score.js';

  export let totalPuntos;
  export let exportarPdf = false;
  export let tituloTarea = '';

  const score = useStore(totalScore);
  const sections = useStore(sectionScores);

  $: pct = totalPuntos > 0 ? Math.round(($score / totalPuntos) * 100) : 0;

  $: rating =
    pct >= 90 ? { icon: '🏆', label: 'EXCELENTE',        color: '#00ff41' } :
    pct >= 75 ? { icon: '✅', label: 'MUY BIEN',          color: '#00b4d8' } :
    pct >= 60 ? { icon: '⚠️', label: 'ACEPTABLE',         color: '#ffb800' } :
                { icon: '🔁', label: 'NECESITA REFUERZO', color: '#ff3a3a' };

  function exportPDF() {
    const studentKey = Object.keys(localStorage)
      .find(k => k.startsWith('estudiante_v1_'));
    const student = studentKey ? JSON.parse(localStorage.getItem(studentKey) ?? '{}') : {};

    // jsPDF cargado como CDN en el layout
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(tituloTarea || 'Resultado', 20, 20);
    doc.setFontSize(11);
    doc.text(`Estudiante: ${student.nombre ?? 'N/D'}`, 20, 35);
    doc.text(`Grupo: ${student.grupo ?? 'N/D'}   Fecha: ${student.fecha ?? 'N/D'}`, 20, 43);
    doc.text(`Puntaje: ${$score} / ${totalPuntos} pts (${pct}%) — ${rating.label}`, 20, 55);

    doc.setFontSize(10);
    doc.text(`Fill-in-the-blank: ${$sections.fillInBlank} pts`, 20, 70);
    doc.text(`Relacionar columnas: ${$sections.matching} pts`, 20, 78);
    doc.text(`Ordenar secuencia: ${$sections.ordering} pts`, 20, 86);
    doc.text(`Selección múltiple: ${$sections.multipleChoice} pts`, 20, 94);

    const filename = `${(student.nombre ?? 'resultado').replace(/\s+/g, '_')}_${tituloTarea.replace(/\s+/g,'_')}.pdf`;
    doc.save(filename);
  }
</script>

<div class="result card" style={`border-color: ${rating.color}`}>
  <div class="result-rating">
    <span class="result-icon">{rating.icon}</span>
    <span class="result-label" style={`color:${rating.color}`}>{rating.label}</span>
  </div>

  <div class="result-score">{$score} <span class="result-of">/ {totalPuntos} pts</span></div>

  <div class="result-bar-wrap">
    <div class="result-bar" style={`width:${pct}%; background:${rating.color}`}></div>
  </div>
  <div class="result-pct">{pct}%</div>

  <div class="result-breakdown">
    <span>Fill-in: {$sections.fillInBlank}</span>
    <span>Matching: {$sections.matching}</span>
    <span>Orden: {$sections.ordering}</span>
    <span>Escenario: {$sections.multipleChoice}</span>
  </div>

  {#if exportarPdf}
    <button class="btn btn-primary" on:click={exportPDF}>⬇ Exportar PDF</button>
  {/if}
</div>

<style>
  .result { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
  .result-rating { display: flex; align-items: center; gap: 0.5rem; }
  .result-icon   { font-size: 1.8rem; }
  .result-label  { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
  .result-score  { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); }
  .result-of     { font-size: 1rem; color: var(--text-muted); }
  .result-bar-wrap {
    width: 100%; max-width: 400px;
    background: var(--border);
    border-radius: 100px;
    height: 8px;
    overflow: hidden;
  }
  .result-bar { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
  .result-pct  { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); }
  .result-breakdown {
    display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
    font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);
  }
</style>
```

> **Nota:** jsPDF se cargará vía CDN en `BaseLayout.astro`. Agregar antes de `</body>`:
> ```html
> <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
> ```
> Agregar este script tag condicional en `BaseLayout.astro` solo cuando `exportarPdf` sea true.

- [ ] **Step 9.3: Actualizar BaseLayout para cargar jsPDF condicionalmente**

Agregar prop `exportarPdf?: boolean` a `BaseLayout.astro` y antes de `</body>`:

```astro
---
// Agregar a las Props existentes:
interface Props {
  title: string;
  course: string;
  type: string;
  exportarPdf?: boolean;
}
const { title, course, type, exportarPdf = false } = Astro.props;
---
<!-- Antes de </body>: -->
{exportarPdf && (
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
)}
```

- [ ] **Step 9.4: Commit**

```bash
git add astro-site/src/components/ui/
git commit -m "feat: agregar ScoreBadge, ResultPanel con export PDF y jsPDF condicional"
```

---

## Chunk 4: Componentes de Ejercicios

### Task 10: FillInBlank

**Files:**
- Create: `astro-site/src/components/ejercicios/FillInBlank.svelte`

- [ ] **Step 10.1: Crear `FillInBlank.svelte`**

```svelte
<!-- astro-site/src/components/ejercicios/FillInBlank.svelte -->
<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  export let items = [];
  export let puntos = 20;
  export let mostrarRespuestas = true;

  let answers = Array(items.length).fill('');
  let results = Array(items.length).fill(null); // null | true | false
  let verified = false;
  let locked = false;

  onMount(() => {
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function check() {
    if (locked) return;
    let correct = 0;
    results = items.map((item, i) => {
      const val = answers[i].trim().toLowerCase();
      const ok = item.respuestas_validas.map(r => r.toLowerCase()).includes(val);
      if (ok) correct++;
      return ok;
    });
    const pts = Math.round((correct / items.length) * puntos);
    updateSection('fillInBlank', pts);
    verified = true;
  }

  function reset() {
    answers = Array(items.length).fill('');
    results = Array(items.length).fill(null);
    verified = false;
    updateSection('fillInBlank', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 01 — Complete el Comando</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  <div class="terminal">
    <div class="term-bar">
      <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
      <span class="term-title">Cisco IOS — Switch</span>
    </div>
    <div class="term-body">
      {#each items as item, i}
        <div class="term-line" class:correct={results[i] === true} class:wrong={results[i] === false}>
          <span class="term-prompt">{item.prompt}</span>
          <input
            class="term-input"
            type="text"
            bind:value={answers[i]}
            disabled={verified || locked}
            placeholder={item.post ? `___ ${item.post}` : '___'}
          />
          {#if item.post}<span class="term-post">{item.post}</span>{/if}
          <div class="term-desc">{item.desc}</div>
          {#if verified && results[i] === false && mostrarRespuestas}
            <div class="term-hint">✓ {item.respuestas_validas[0]}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="ej-actions">
    {#if !verified}
      <button class="btn btn-primary" on:click={check} disabled={locked}>▶ Verificar</button>
    {:else}
      <button class="btn" on:click={reset}>↺ Reiniciar</button>
    {/if}
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-actions { margin-top: 1rem; display: flex; gap: 0.5rem; }

  .terminal {
    background: #0a0e0a;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .term-bar {
    background: #1a1e1a;
    padding: 0.4rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .red    { background: #ff5f57; }
  .yellow { background: #febc2e; }
  .green  { background: #28c840; }
  .term-title { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); margin-left: auto; }
  .term-body  { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

  .term-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.5rem;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: border-color var(--transition);
  }
  .term-line.correct { border-color: var(--color-correct); }
  .term-line.wrong   { border-color: var(--color-error); }

  .term-prompt { font-family: var(--font-mono); font-size: 0.82rem; color: #00ff41; white-space: nowrap; }
  .term-post   { font-family: var(--font-mono); font-size: 0.82rem; color: #00ff41; }
  .term-input {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--text-muted);
    color: #00e5ff;
    padding: 0 0.2rem;
    min-width: 80px;
    flex: 1;
  }
  .term-input:focus { outline: none; border-bottom-color: var(--accent); }
  .term-input:disabled { color: var(--text-muted); cursor: not-allowed; }
  .term-desc { width: 100%; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-body); }
  .term-hint { width: 100%; font-size: 0.72rem; color: var(--color-correct); font-family: var(--font-mono); }
</style>
```

- [ ] **Step 10.2: Commit**

```bash
git add astro-site/src/components/ejercicios/FillInBlank.svelte
git commit -m "feat: agregar componente FillInBlank con terminal styling"
```

---

### Task 11: Matching

**Files:**
- Create: `astro-site/src/components/ejercicios/Matching.svelte`

- [ ] **Step 11.1: Crear `Matching.svelte`**

```svelte
<!-- astro-site/src/components/ejercicios/Matching.svelte -->
<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  export let pares = [];
  export let puntos = 10;

  let shuffledCmds = [];
  let shuffledDefs = [];
  let selCmd = null;
  let selDef = null;
  let matched = {}; // id -> true/false
  let done = false;
  let locked = false;

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  onMount(() => {
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function selectCmd(par) {
    if (done || locked || matched[par.id] !== undefined) return;
    selCmd = par;
    tryMatch();
  }

  function selectDef(par) {
    if (done || locked || matched[par.id] !== undefined) return;
    selDef = par;
    tryMatch();
  }

  function tryMatch() {
    if (!selCmd || !selDef) return;
    const correct = selCmd.id === selDef.id;
    const wrongCmdId = selCmd.id;
    matched = { ...matched, [wrongCmdId]: correct };
    selCmd = null;
    selDef = null;
    if (!correct) {
      setTimeout(() => {
        const { [wrongCmdId]: _, ...rest } = matched;
        matched = rest;
      }, 800);
    }

    if (Object.values(matched).filter(Boolean).length === pares.length) {
      done = true;
      const pts = puntos; // all correct if completed
      updateSection('matching', pts);
    }
  }

  function reset() {
    shuffledCmds = shuffle(pares);
    shuffledDefs = shuffle(pares);
    matched = {};
    selCmd = null;
    selDef = null;
    done = false;
    updateSection('matching', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 02 — Relacione Columnas</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  <div class="match-grid">
    <div class="match-col">
      {#each shuffledCmds as par}
        <button
          class="match-btn cmd"
          class:selected={selCmd?.id === par.id}
          class:correct={matched[par.id] === true}
          class:wrong={matched[par.id] === false}
          disabled={done || locked || matched[par.id] === true}
          on:click={() => selectCmd(par)}
        >
          {par.comando}
        </button>
      {/each}
    </div>
    <div class="match-col">
      {#each shuffledDefs as par}
        <button
          class="match-btn def"
          class:selected={selDef?.id === par.id}
          class:correct={matched[par.id] === true}
          class:wrong={matched[par.id] === false}
          disabled={done || locked || matched[par.id] === true}
          on:click={() => selectDef(par)}
        >
          {par.definicion}
        </button>
      {/each}
    </div>
  </div>

  {#if done}
    <p class="match-done">¡Todas las coincidencias correctas! +{puntos} pts</p>
  {/if}

  <div class="ej-actions">
    <button class="btn" on:click={reset} disabled={locked}>↺ Reiniciar</button>
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-actions { margin-top: 1rem; }

  .match-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .match-col { display: flex; flex-direction: column; gap: 0.5rem; }

  .match-btn {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface, #0d1117);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    text-align: left;
    cursor: pointer;
    transition: border-color var(--transition), background var(--transition);
  }
  .match-btn:hover:not(:disabled)    { border-color: var(--accent); }
  .match-btn.selected                { border-color: var(--accent); background: var(--accent); color: #000; }
  .match-btn.correct                 { border-color: var(--color-correct); background: #00ff4122; color: var(--color-correct); cursor: default; }
  .match-btn.wrong                   { border-color: var(--color-error);   background: #ff3a3a22; }
  .match-btn:disabled:not(.correct)  { opacity: 0.5; cursor: not-allowed; }

  .match-done {
    margin-top: 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: var(--color-correct);
    text-align: center;
  }

  @media (max-width: 640px) {
    .match-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 11.2: Commit**

```bash
git add astro-site/src/components/ejercicios/Matching.svelte
git commit -m "feat: agregar componente Matching con shuffle y feedback visual"
```

---

### Task 12: Ordering

**Files:**
- Create: `astro-site/src/components/ejercicios/Ordering.svelte`

- [ ] **Step 12.1: Crear `Ordering.svelte`**

```svelte
<!-- astro-site/src/components/ejercicios/Ordering.svelte -->
<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  export let pasos = [];
  export let contexto = '';
  export let puntos = 5;

  let selections = Array(pasos.length).fill('');
  let results = null;
  let verified = false;
  let locked = false;
  const opts = pasos.map((_, i) => i + 1);

  onMount(() => {
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function check() {
    if (locked) return;
    results = pasos.map((paso, i) => parseInt(selections[i]) === paso.orden);
    const correct = results.filter(Boolean).length;
    updateSection('ordering', correct === pasos.length ? puntos : 0);
    verified = true;
  }

  function reset() {
    selections = Array(pasos.length).fill('');
    results = null;
    verified = false;
    updateSection('ordering', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 03 — Ordene la Secuencia</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  {#if contexto}
    <p class="ej-ctx">{contexto}</p>
  {/if}

  <div class="order-list">
    {#each pasos as paso, i}
      <div class="order-item" class:correct={results?.[i] === true} class:wrong={results?.[i] === false}>
        <select bind:value={selections[i]} disabled={verified || locked}>
          <option value="">—</option>
          {#each opts as o}
            <option value={o}>{o}</option>
          {/each}
        </select>
        <span class="order-cmd">{paso.label}</span>
      </div>
    {/each}
  </div>

  <div class="ej-actions">
    {#if !verified}
      <button class="btn btn-primary" on:click={check} disabled={locked}>▶ Verificar</button>
    {:else}
      <button class="btn" on:click={reset}>↺ Reiniciar</button>
    {/if}
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-ctx    { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; }
  .ej-actions { margin-top: 1rem; }

  .order-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .order-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    transition: border-color var(--transition);
  }
  .order-item.correct { border-color: var(--color-correct); background: #00ff4110; }
  .order-item.wrong   { border-color: var(--color-error);   background: #ff3a3a10; }

  select {
    background: var(--surface, #0d1117);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.82rem;
    padding: 0.3rem 0.4rem;
    width: 3rem;
  }
  select:disabled { opacity: 0.6; cursor: not-allowed; }

  .order-cmd {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: #00e5ff;
  }
</style>
```

- [ ] **Step 12.2: Commit**

```bash
git add astro-site/src/components/ejercicios/Ordering.svelte
git commit -m "feat: agregar componente Ordering con dropdowns de secuencia"
```

---

### Task 13: MultipleChoice

**Files:**
- Create: `astro-site/src/components/ejercicios/MultipleChoice.svelte`

- [ ] **Step 13.1: Crear `MultipleChoice.svelte`**

```svelte
<!-- astro-site/src/components/ejercicios/MultipleChoice.svelte -->
<script>
  import { onMount } from 'svelte';
  import { updateSection } from '../../stores/score.js';

  export let preguntas = [];
  export let puntos = 5;
  export let mostrarRespuestas = true;

  let selections = Array(preguntas.length).fill(null);
  let results = null;
  let verified = false;
  let locked = false;

  onMount(() => {
    window.addEventListener('deadline-reached', () => { locked = true; });
  });

  function check() {
    if (locked) return;
    results = preguntas.map((p, i) => selections[i] === p.correcta);
    const correct = results.filter(Boolean).length;
    updateSection('multipleChoice', Math.round((correct / preguntas.length) * puntos));
    verified = true;
  }

  function reset() {
    selections = Array(preguntas.length).fill(null);
    results = null;
    verified = false;
    updateSection('multipleChoice', 0);
  }
</script>

<section class="ejercicio card">
  <header class="ej-header">
    <h2 class="ej-title">Sección 04 — Preguntas de Escenario</h2>
    <span class="ej-pts">{puntos} pts</span>
  </header>

  {#each preguntas as pregunta, qi}
    <div class="question" class:correct={results?.[qi] === true} class:wrong={results?.[qi] === false}>
      <p class="q-text"><span class="q-num">{qi + 1}.</span> {pregunta.texto}</p>
      <div class="q-opts">
        {#each pregunta.opciones as opcion, oi}
          <label
            class="q-opt"
            class:selected={selections[qi] === oi}
            class:correct={verified && mostrarRespuestas && oi === pregunta.correcta}
            class:wrong={verified && selections[qi] === oi && oi !== pregunta.correcta}
          >
            <input
              type="radio"
              name={`q${qi}`}
              value={oi}
              bind:group={selections[qi]}
              disabled={verified || locked}
            />
            {opcion}
          </label>
        {/each}
      </div>
    </div>
  {/each}

  <div class="ej-actions">
    {#if !verified}
      <button class="btn btn-primary" on:click={check} disabled={locked}>▶ Verificar</button>
    {:else}
      <button class="btn" on:click={reset}>↺ Reiniciar</button>
    {/if}
  </div>
</section>

<style>
  .ej-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ej-title  { font-size: 0.95rem; color: var(--accent); }
  .ej-pts    { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); }
  .ej-actions { margin-top: 1rem; }

  .question {
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.75rem;
    transition: border-color var(--transition);
  }
  .question.correct { border-color: var(--color-correct); }
  .question.wrong   { border-color: var(--color-error); }

  .q-text { font-size: 0.88rem; margin-bottom: 0.75rem; }
  .q-num  { font-family: var(--font-mono); color: var(--accent); margin-right: 0.25rem; }

  .q-opts { display: flex; flex-direction: column; gap: 0.4rem; }

  .q-opt {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color var(--transition), background var(--transition);
  }
  .q-opt:hover:not(.correct):not(.wrong) { border-color: var(--accent); }
  .q-opt.selected { border-color: var(--accent); background: var(--accent); color: #000; }
  .q-opt.correct  { border-color: var(--color-correct); background: #00ff4122; color: var(--color-correct); }
  .q-opt.wrong    { border-color: var(--color-error); background: #ff3a3a22; }

  input[type="radio"] { margin-top: 0.15rem; accent-color: var(--accent); }
</style>
```

- [ ] **Step 13.2: Commit**

```bash
git add astro-site/src/components/ejercicios/MultipleChoice.svelte
git commit -m "feat: agregar componente MultipleChoice con feedback por respuesta"
```

---

## Chunk 5: Páginas y Deploy

### Task 14: Dashboard — `index.astro`

**Files:**
- Create: `astro-site/src/pages/index.astro`

- [ ] **Step 14.1: Crear `index.astro`**

```astro
---
// astro-site/src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import config from '../data/config.json';

const now = new Date();

function getStatus(entrega: typeof config.entregas[0]) {
  if (!entrega.activa) return 'closed';
  const open  = new Date(entrega.fecha_apertura);
  const close = new Date(entrega.fecha_cierre);
  if (now < open)  return 'soon';
  if (now > close) return 'done';
  return 'open';
}

const statusLabel = { open: '✅ ABIERTA', soon: '⏳ PRÓXIMAMENTE', done: '📁 FINALIZADA', closed: '🔒 CERRADA' };
const statusClass = { open: 'badge-open', soon: 'badge-soon', done: 'badge-done', closed: 'badge-closed' };
---

<BaseLayout title="Inicio" course="ccna1" type="tarea">
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Sites Didácticos</h1>
      <p class="dash-sub">{config.docente.nombre} · {config.docente.institucion}</p>
    </header>

    <section class="entregas-grid">
      {config.entregas.map((entrega) => {
        const status = getStatus(entrega);
        const curso  = config.cursos[entrega.curso as keyof typeof config.cursos];
        const url    = `${import.meta.env.BASE_URL}${entrega.curso}/${entrega.modulo}/${entrega.tipo}/${entrega.id}`;
        return (
          <a
            href={status === 'open' ? url : undefined}
            class={`entrega-card card ${status !== 'open' ? 'inactive' : ''}`}
            style={`--card-accent:${curso?.color_accent ?? '#ffffff'}`}
          >
            <div class="card-header">
              <span class="card-course">{curso?.nombre ?? entrega.curso}</span>
              <span class={`badge ${statusClass[status]}`}>{statusLabel[status]}</span>
            </div>
            <h3 class="card-title">{entrega.titulo}</h3>
            <div class="card-meta">
              <span>{entrega.puntos} pts</span>
              {status === 'open' || status === 'done' ? (
                <span>Cierra: {new Date(entrega.fecha_cierre).toLocaleDateString('es-CR', {day:'2-digit', month:'short', year:'numeric'})}</span>
              ) : status === 'soon' ? (
                <span>Abre: {new Date(entrega.fecha_apertura).toLocaleDateString('es-CR', {day:'2-digit', month:'short', year:'numeric'})}</span>
              ) : null}
            </div>
          </a>
        );
      })}
    </section>

    <p class="dash-note">
      El estado de las tarjetas se actualiza con cada publicación del sitio.
      Si una tarea venció, el ejercicio queda bloqueado automáticamente en tiempo real.
    </p>
  </div>
</BaseLayout>

<style>
  .dash-header { padding: 2rem 0 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
  .dash-title  { font-size: 1.8rem; color: var(--accent); }
  .dash-sub    { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }

  .entregas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .entrega-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-color: color-mix(in srgb, var(--card-accent) 30%, var(--border));
    text-decoration: none;
    color: var(--text-primary);
    transition: border-color var(--transition), transform var(--transition);
  }
  .entrega-card:hover:not(.inactive) {
    border-color: var(--card-accent);
    transform: translateY(-2px);
  }
  .entrega-card.inactive { cursor: default; opacity: 0.65; }

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .card-course { font-family: var(--font-mono); font-size: 0.7rem; color: var(--card-accent); }
  .card-title  { font-size: 0.95rem; }
  .card-meta   {
    display: flex; justify-content: space-between;
    font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);
  }

  .dash-note {
    margin-top: 2rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    text-align: center;
  }
</style>
```

- [ ] **Step 14.2: Verificar build**

```bash
cd astro-site && npm run build
```
Esperado: sin errores.

- [ ] **Step 14.3: Commit**

```bash
git add astro-site/src/pages/index.astro
git commit -m "feat: agregar dashboard principal con cards de entregas"
```

---

### Task 15: Ruta dinámica — `[slug].astro`

**Files:**
- Create: `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`

- [ ] **Step 15.1: Crear estructura de directorios y el archivo**

```bash
mkdir -p astro-site/src/pages/ccna1/modulo2/tarea
```

Crear `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`:

```astro
---
// astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro
import { getCollection } from 'astro:content';
import config from '../../../../data/config.json';
import TareaLayout from '../../../../layouts/TareaLayout.astro';
import FillInBlank from '../../../../components/ejercicios/FillInBlank.svelte';
import Matching from '../../../../components/ejercicios/Matching.svelte';
import Ordering from '../../../../components/ejercicios/Ordering.svelte';
import MultipleChoice from '../../../../components/ejercicios/MultipleChoice.svelte';
import ResultPanel from '../../../../components/ui/ResultPanel.svelte';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  // getCollection usa el schema definido en src/content/config.ts para validar en build time
  const tareas = await getCollection('ccna1/tareas');

  return config.entregas.map((entrega) => {
    const ejercicio = tareas.find((t) => t.id === entrega.id);

    return {
      params: {
        curso:  entrega.curso,
        modulo: entrega.modulo,
        tipo:   entrega.tipo,
        slug:   entrega.id,
      },
      props: {
        entrega,
        ejercicio: ejercicio?.data ?? null,
        grupos: config.grupos,
      },
    };
  });
};

const { entrega, ejercicio, grupos } = Astro.props;
const ej = ejercicio as any;
---

<TareaLayout
  titulo={entrega.titulo}
  subtitulo={ej?.subtitulo ?? ''}
  curso={entrega.curso}
  entregaId={entrega.id}
  fechaApertura={entrega.fecha_apertura}
  fechaCierre={entrega.fecha_cierre}
  puntos={entrega.puntos}
  grupos={grupos}
  exportarPdf={entrega.parametros.exportar_pdf}
>
  {ej?.contexto && (
    <div class="card contexto">
      <p>{ej.contexto}</p>
    </div>
  )}

  {ej?.modos_referencia && (
    <details class="card referencia">
      <summary>📋 Referencia de modos IOS</summary>
      <table>
        <thead><tr><th>Prompt</th><th>Modo</th><th>Acceso</th></tr></thead>
        <tbody>
          {ej.modos_referencia.map((m: any) => (
            <tr>
              <td><code>{m.prompt}</code></td>
              <td>{m.modo}</td>
              <td><code>{m.acceso}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )}

  {ej?.secciones?.fillInBlank && (
    <FillInBlank
      client:visible
      items={ej.secciones.fillInBlank.items}
      puntos={ej.secciones.fillInBlank.puntos}
      mostrarRespuestas={entrega.parametros.mostrar_respuestas}
    />
  )}

  {ej?.secciones?.matching && (
    <Matching
      client:visible
      pares={ej.secciones.matching.pares}
      puntos={ej.secciones.matching.puntos}
    />
  )}

  {ej?.secciones?.ordering && (
    <Ordering
      client:visible
      pasos={ej.secciones.ordering.pasos}
      contexto={ej.secciones.ordering.contexto}
      puntos={ej.secciones.ordering.puntos}
    />
  )}

  {ej?.secciones?.multipleChoice && (
    <MultipleChoice
      client:visible
      preguntas={ej.secciones.multipleChoice.preguntas}
      puntos={ej.secciones.multipleChoice.puntos}
      mostrarRespuestas={entrega.parametros.mostrar_respuestas}
    />
  )}

  <ResultPanel
    client:visible
    totalPuntos={entrega.puntos}
    exportarPdf={entrega.parametros.exportar_pdf}
    tituloTarea={entrega.titulo}
  />
</TareaLayout>

<style>
  .contexto { font-size: 0.88rem; color: var(--text-muted); border-left: 3px solid var(--accent); }

  .referencia summary {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    cursor: pointer;
    color: var(--accent);
    padding: 0.2rem 0;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.8rem; }
  th, td { padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--border); text-align: left; }
  th { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); }
  code { font-family: var(--font-mono); color: #00ff41; }
</style>
```

- [ ] **Step 15.2: Build y verificar la ruta generada**

```bash
cd astro-site && npm run build
```
Esperado: `dist/ccna1/modulo2/tarea/comandos-modulo2/index.html` generado.

```bash
ls astro-site/dist/ccna1/modulo2/tarea/comandos-modulo2/
```
Esperado: `index.html`

- [ ] **Step 15.3: Prueba en servidor local**

```bash
cd astro-site && npm run preview
```
Abrir en navegador: `http://localhost:4321/sites-didacticos/ccna1/modulo2/tarea/comandos-modulo2`

Verificar manualmente:
- [ ] Countdown clock visible con tiempo restante
- [ ] Panel de estudiante con dropdown de grupos
- [ ] Las 4 secciones de ejercicios cargadas
- [ ] Botón Verificar funciona en Fill-in-the-blank
- [ ] Matching completa al relacionar todos correctamente
- [ ] Ordering muestra correcto/incorrecto
- [ ] MultipleChoice muestra feedback
- [ ] ScoreBadge se actualiza en tiempo real
- [ ] ResultPanel visible y botón PDF funciona
- [ ] Footer con año actual y nombre del docente

- [ ] **Step 15.4: Commit**

```bash
git add astro-site/src/pages/
git commit -m "feat: agregar ruta dinámica con getStaticPaths y módulo comandos-modulo2 completo"
```

---

### Task 16: GitHub Actions — Deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 16.1: Crear workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy Astro to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

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
          cache: npm
          cache-dependency-path: astro-site/package-lock.json

      - name: Install dependencies
        run: cd astro-site && npm ci

      - name: Build Astro
        run: cd astro-site && npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: astro-site/dist

      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 16.2: Habilitar GitHub Pages en el repositorio**

En GitHub: `Settings → Pages → Source → GitHub Actions`

- [ ] **Step 16.3: Commit y verificar deploy**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: agregar GitHub Actions workflow para deploy a GitHub Pages"
git push origin main
```

Verificar en `Actions` tab que el workflow pase correctamente.

URL final: `https://<usuario>.github.io/sites-didacticos/`

---

## Resumen de Commits

| Task | Commit message |
|---|---|
| 1 | feat: inicializar proyecto Astro con Svelte y nanostores |
| 2 | feat: agregar config.json y datos del ejercicio comandos-modulo2 |
| 3 | feat: agregar sistema de tokens CSS y estilos base |
| 4 | feat: agregar nanostore de puntaje compartido |
| 5 | feat: agregar BaseLayout con tokens, meta y footer de autoría |
| 6 | feat: agregar TareaLayout con header, reloj y panel de estudiante |
| 7 | feat: agregar componente CountdownClock con urgencia y deadline-reached |
| 8 | feat: agregar StudentPanel con grupos dinámicos y auto-save |
| 9 | feat: agregar ScoreBadge, ResultPanel con export PDF y jsPDF condicional |
| 10 | feat: agregar componente FillInBlank con terminal styling |
| 11 | feat: agregar componente Matching con shuffle y feedback visual |
| 12 | feat: agregar componente Ordering con dropdowns de secuencia |
| 13 | feat: agregar componente MultipleChoice con feedback por respuesta |
| 14 | feat: agregar dashboard principal con cards de entregas |
| 15 | feat: agregar ruta dinámica con getStaticPaths y módulo comandos-modulo2 completo |
| 16 | feat: agregar GitHub Actions workflow para deploy a GitHub Pages |
