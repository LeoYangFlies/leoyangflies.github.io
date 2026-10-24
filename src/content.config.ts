import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './consts';

const categoryKeys = Object.keys(CATEGORIES) as [keyof typeof CATEGORIES, ...(keyof typeof CATEGORIES)[]];

// Every review is a Markdown file in src/content/reviews/.
// The fields below are what goes between the --- lines at the top of each file.
const reviews = defineCollection({
  loader: glob({ base: './src/content/reviews', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      place: z.string(), // city, town or area, e.g. "Lisbon"
      country: z.string(),
      category: z.enum(categoryKeys),
      visited: z.string().optional(), // free text, e.g. "March 2026"
      rating: z.number().min(0).max(5).multipleOf(0.5).optional(),
      verdict: z.string().optional(), // one-sentence bottom line
      liked: z.array(z.string()).default([]),
      disliked: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { reviews };
