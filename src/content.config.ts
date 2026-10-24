import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES, CABINS, TIP_TOPICS } from './consts';
import { AIRPORTS } from './data/airports';

const categoryKeys = Object.keys(CATEGORIES) as [keyof typeof CATEGORIES, ...(keyof typeof CATEGORIES)[]];
const airportCode = z
  .string()
  .transform((s) => s.toUpperCase())
  .refine((code) => code in AIRPORTS, {
    message: 'Unknown airport code. Add it to src/data/airports.ts first.',
  });

// Every review is a Markdown file in src/content/reviews/.
// The fields below are what goes between the --- lines at the top of each file.
const reviews = defineCollection({
  loader: glob({ base: './src/content/reviews', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        published: z.coerce.date(),
        updated: z.coerce.date().optional(),
        category: z.enum(categoryKeys),

        // Flights
        airline: z.string().optional(),
        flight: z.string().optional(), // flight number, e.g. "MU587"
        from: airportCode.optional(), // airport codes, e.g. PVG
        to: airportCode.optional(),
        aircraft: z.string().optional(),
        cabin: z.enum(CABINS).optional(),
        seat: z.string().optional(),
        duration: z.string().optional(), // e.g. "14h 35m"

        // Airports and lounges
        place: z.string().optional(), // e.g. "Shanghai Pudong (PVG)"
        country: z.string().optional(),

        // Trip reports: every Logbook flight from start to end (inclusive) becomes the itinerary.
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional(),

        // Detailed reviews: the trip report they belong to (its file name, without .md),
        // and for flights, the date flown, which links the review to that flight in the Logbook.
        trip: z.string().optional(),
        date: z.coerce.date().optional(),

        when: z.string().optional(), // free text, e.g. "August 2026"
        verdict: z.string().optional(), // one-sentence bottom line
        liked: z.array(z.string()).default([]),
        disliked: z.array(z.string()).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        draft: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (data.category === 'flight' && (!data.from || !data.to || !data.airline)) {
          ctx.addIssue({ code: 'custom', message: 'Flight reviews need airline, from and to.' });
        }
        if ((data.category === 'airport' || data.category === 'lounge') && (!data.place || !data.country)) {
          ctx.addIssue({ code: 'custom', message: 'Airport and lounge reviews need place and country.' });
        }
        if (data.category === 'trip' && (!data.start || !data.end)) {
          ctx.addIssue({ code: 'custom', message: 'Trip reports need start and end dates.' });
        }
        if (data.category === 'trip' && data.trip) {
          ctx.addIssue({ code: 'custom', message: 'A trip report cannot itself belong to a trip.' });
        }
      }),
});

const topicKeys = Object.keys(TIP_TOPICS) as [keyof typeof TIP_TOPICS, ...(keyof typeof TIP_TOPICS)[]];

// Guides: one Markdown file each in src/content/guides/.
const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(), // one sentence shown in lists and link previews
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    topic: z.enum(topicKeys),
    draft: z.boolean().default(false),
  }),
});

export const collections = { reviews, guides };
