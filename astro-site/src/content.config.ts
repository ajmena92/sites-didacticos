import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ejerciciosCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/ccna1/tareas' }),
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

const admSoporteTareasCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/adm-soporte/tareas' }),
  schema: z.object({
    id: z.string(),
    titulo: z.string(),
    subtitulo: z.string().optional(),
    casos: z.array(z.object({
      id: z.string(),
      title: z.string(),
      model: z.string(),
      scenario: z.string(),
      difficulty: z.string(),
      specs: z.record(z.string(), z.string()).optional(),
      fuentes: z.array(z.object({
        sitio: z.string(),
        seccion: z.string(),
        pista: z.string(),
      })).optional(),
      questions: z.array(z.string()),
      answers: z.array(z.string()).optional(),
    })),
    secciones_estaticas: z.array(z.object({
      id: z.string(),
      titulo: z.string(),
      descripcion: z.string(),
    })).optional(),
  }),
});

const prog10TareasCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/prog10/tareas' }),
  schema: z.object({
    id: z.string(),
    titulo: z.string(),
    subtitulo: z.string().optional(),
    matrices_contexto: z.record(z.string(), z.object({
      label: z.string(),
      color: z.string(),
      rows: z.array(z.string()),
      cols: z.array(z.string()),
      data: z.array(z.array(z.number())),
    })).optional(),
    etapas: z.array(z.object({
      id: z.string(),
      titulo: z.string(),
      subtitulo: z.string().optional(),
      icono: z.string().optional(),
      tag: z.string().optional(),
      tag_color: z.string().optional(),
      contexto: z.string().optional(),
      mostrar_matrices: z.boolean().optional(),
      intro: z.string().optional(),
      pasos: z.array(z.object({
        id: z.string(),
        tipo: z.enum(['select', 'matrix-input']),
        num: z.string(),
        titulo: z.string(),
        descripcion: z.string(),
        placeholder: z.string().optional(),
        opciones: z.array(z.object({
          valor: z.string(),
          texto: z.string(),
        })).optional(),
        correcto: z.string().optional(),
        rows: z.array(z.string()).optional(),
        cols: z.array(z.string()).optional(),
        placeholders: z.array(z.array(z.string())).optional(),
        solucion: z.array(z.array(z.number())).optional(),
        hint: z.string().optional(),
      })),
    })),
    evaluacion: z.object({
      titulo: z.string(),
      subtitulo: z.string().optional(),
      preguntas: z.array(z.object({
        id: z.string(),
        texto: z.string(),
        opciones: z.array(z.object({
          valor: z.string(),
          texto: z.string(),
        })),
        correcto: z.string(),
      })),
      calificacion: z.object({
        umbrales: z.array(z.object({
          nivel: z.string(),
          max_errores: z.number(),
        })),
      }),
    }),
  }),
});

export const collections = {
  'ccna1-tareas':       ejerciciosCollection,
  'adm-soporte-tareas': admSoporteTareasCollection,
  'prog10-tareas':      prog10TareasCollection,
};
