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

export const collections = {
  'ccna1-tareas': ejerciciosCollection,
  'adm-soporte-tareas': admSoporteTareasCollection,
};
