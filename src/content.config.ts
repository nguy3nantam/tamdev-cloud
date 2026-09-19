import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lang: z.enum(['vi', 'en']),
    id: z.string(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
