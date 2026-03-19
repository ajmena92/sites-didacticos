# Sites Didácticos — Guía de desarrollo para Claude

**Autor:** Ing. Andrés Mena Abarca · CTP Platanares
**Licencia:** CC BY-NC-SA 4.0

---

## Regla principal

> **Todo contenido nuevo vive dentro del framework Astro (`astro-site/`). Nunca se agregan archivos HTML estáticos en la raíz del repo para que sean servidos directamente.**

El sitio se despliega en GitHub Pages **solo** desde `astro-site/dist/`. El workflow `.github/workflows/deploy.yml` no se modifica para incluir rutas externas (no rsync, no copias manuales al dist).

---

## Stack

| Tecnología | Rol |
|---|---|
| **Astro 6** (output: static) | Framework principal, genera HTML estático |
| **Svelte 5** | Componentes interactivos (islands architecture, runes mode) |
| **nanostores** | Estado compartido entre islands |
| **GitHub Pages** | Deploy vía GitHub Actions |
| `astro-site/src/data/config.json` | "Base de datos" — el docente edita este archivo para controlar todo |

---

## Cómo agregar contenido nuevo

### 1. Registrar curso (si es nuevo)

En `astro-site/src/data/config.json`, agregar al objeto `cursos`:

```json
"mi-curso": {
  "nombre": "Nombre visible del curso",
  "color_accent": "#hex"
}
```

### 2. Registrar grupos (si son nuevos)

En `config.json`, agregar al array `grupos`:

```json
{ "id": "mi-grupo-id", "nombre": "Nombre visible", "turno": "CTP PLATANARES" }
```

Los IDs de grupos deben ser únicos. Usar prefijos por curso cuando hay riesgo de colisión (ej: `adm-11-1` en lugar de `11-1`).

### 3. Registrar la entrega

En `config.json`, agregar al array `entregas`:

```json
{
  "id":                "slug-url-de-la-tarea",
  "curso":             "mi-curso",
  "modulo":            "modulo1",
  "tipo":              "tarea",
  "tipo_ejercicio":    "estatico | vlsm | caso-diagnostico",
  "titulo":            "Título visible",
  "grupos_habilitados": ["id-grupo-1", "id-grupo-2"],
  "activa":            true,
  "fecha_apertura":    "2026-03-01T07:00:00",
  "fecha_cierre":      "2026-03-28T23:59:00",
  "puntos":            40,
  "google_script_url": "https://script.google.com/macros/s/…/exec",
  "parametros": {
    "mostrar_respuestas": true,
    "exportar_pdf":       true,
    "mostrar_progreso":   true,
    "permitir_reintento": true
  }
}
```

La URL generada será: `/sites-didacticos/{curso}/{modulo}/{tipo}/{id}`

### 4. Crear el contenido del ejercicio

En `astro-site/src/content/{curso}/tareas/{id}.json`.

**Ejercicios autocorregibles** (tipo_ejercicio: `estatico`) — schema `ccna1-tareas`:
```json
{
  "id": "slug-de-la-tarea",
  "titulo": "...",
  "secciones": {
    "fillInBlank":   { "puntos": 20, "items": [...] },
    "matching":      { "puntos": 10, "pares": [...] },
    "ordering":      { "puntos": 5,  "pasos": [...] },
    "multipleChoice":{ "puntos": 5,  "preguntas": [...] }
  }
}
```

**Tareas de casos abiertos** (tipo_ejercicio: `caso-diagnostico`) — schema `adm-soporte-tareas`:
```json
{
  "id": "slug-de-la-tarea",
  "titulo": "...",
  "subtitulo": "...",
  "casos": [
    {
      "id": "C-01", "title": "...", "model": "...",
      "scenario": "...", "difficulty": "...",
      "questions": ["pregunta 1", "pregunta 2", "pregunta 3"]
    }
  ],
  "secciones_estaticas": [
    { "id": "static1", "titulo": "...", "descripcion": "..." }
  ]
}
```

### 5. Registrar la colección (solo si es un tipo nuevo)

Si el nuevo ejercicio usa un schema distinto a los existentes, agregar en `astro-site/src/content.config.ts`:

```typescript
const miCursoCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/mi-curso/tareas' }),
  schema: z.object({ ... }),
});

export const collections = {
  'ccna1-tareas':       ejerciciosCollection,
  'adm-soporte-tareas': admSoporteTareasCollection,
  'mi-curso-tareas':    miCursoCollection,   // ← nuevo
};
```

### 6. Actualizar `[slug].astro` (solo si es un tipo de ejercicio nuevo)

En `astro-site/src/pages/[curso]/[modulo]/[tipo]/[slug].astro`:

1. Importar el nuevo componente Svelte
2. En `getStaticPaths`, agregar `getCollection('mi-curso-tareas')` y el branch correspondiente
3. En el template, agregar `{esMiTipo && <MiComponente client:visible ... />}`

---

## Tipos de ejercicio implementados

| `tipo_ejercicio` | Componente | Colección |
|---|---|---|
| `estatico` | `FillInBlank`, `Matching`, `Ordering`, `MultipleChoice` + `ResultPanel` | `ccna1-tareas` |
| `vlsm` | `VlsmExercise` (generativo, sin JSON de contenido) | — |
| `caso-diagnostico` | `CasoDiagnostico` | `adm-soporte-tareas` |

---

## Componentes Svelte — convenciones

- **Svelte 5 runes**: usar `$props()`, `$state()`, `$derived()`, no la API legacy de Svelte 4
- **nanostores**: suscribir con `store.subscribe(v => { stateVar = v; })` + `onDestroy(unsub)`
- **Hidratación**: `client:load` para UI visible al instante (reloj, gate), `client:visible` para ejercicios
- **`{@const}`** solo puede ser hijo inmediato de `{#each}`, `{#if}`, `{:else}`, etc. — nunca dentro de un elemento HTML
- El `studentStore` expone `{ nombre, cedula, grupo, fecha, turno }` — ya lo gestiona `StudentGate`

---

## Envío a Apps Script

URL actual:
```
https://script.google.com/macros/s/AKfycbwQKRs4OiVXIY-Sjqnvu1bghl_89pySwRBgybD-FhnP3kvJHLRAu6gooU7VDwwStYBcjA/exec
```

Payload esperado:
```json
{
  "nombre": "...", "cedula": "...", "grupo": "...", "fecha": "...",
  "tipo": "entrega-id",
  "calificacion": 0, "errores": 0,
  "extras": "{JSON serializado con respuestas}"
}
```

Usar `Content-Type: text/plain` para evitar CORS preflight. El script guarda en hoja nombrada con el `grupo`; si no existe, la crea. El código fuente está en `ccna/ccna1/apps-script-setup.js`.

Para actualizar el script desplegado: **Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar** (nunca crear nueva implementación, se pierde la URL).

---

## Deploy

El workflow `.github/workflows/deploy.yml` corre en cada push a `main`:

1. `cd astro-site && npm ci && npm run build`
2. Sube `astro-site/dist/` a GitHub Pages

**No modificar el workflow** para incluir contenido fuera de `astro-site/`. Si un recurso debe estar en el sitio, debe ser parte del build de Astro (en `src/`, `public/` o Content Collections).

El build requiere **Node ≥ 22**. Localmente: `nvm use 22` antes de `npm run build`.

---

## Archivos de referencia histórica (no servidos en producción)

Los directorios `ccna/`, `python/`, `linux/`, `administracion_y_soporte_computadoras/` en la raíz del repo contienen HTML estático legacy. Son referencia de diseño y lógica de negocio, pero **no se despliegan**. Todo lo que necesite estar en el sitio debe migrarse al framework Astro.
