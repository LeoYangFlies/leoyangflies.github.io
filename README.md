# Leo Flies

Leo Yang's flight review blog, built with [Astro](https://astro.build) and published free on GitHub Pages at <https://leoyangflies.github.io>. It updates automatically within a couple of minutes whenever a file here changes.

## Where things live

| What | Where |
| --- | --- |
| Blog name, tagline, author, social links | `src/consts.ts` |
| Reviews (one Markdown file each) | `src/content/reviews/` |
| Guides: tips and hacks (one Markdown file each) | `src/content/guides/` |
| Photos for reviews | `src/content/reviews/images/` |
| Flight log behind the Logbook page | `src/data/flights.yaml` |
| Airports the site knows (codes, cities, coordinates) | `src/data/airports.ts` |
| About page | `src/pages/about.astro` |
| Colors and fonts | `src/styles/global.css` (the `:root` section at the top) |

## Logging a flight

Add a block to `src/data/flights.yaml`. Every flight belongs here, whether or not you review it:

```yaml
- date: 2026-08-20
  airline: China Eastern
  flight: MU587
  from: PVG
  to: JFK
  aircraft: Boeing 777-300ER
  cabin: Economy        # Economy, Premium Economy, Business or First
  seat: 45K
  duration: 14h 35m
  review: pvg-jfk-august-2026   # optional: links to a review's file name
```

Distances, totals, the map and all the stats are worked out automatically. If the build complains about an unknown airport code, add that airport to `src/data/airports.ts`.

## Writing a review

Create a file in `src/content/reviews/`, for example `pvg-jfk-august-2026.md`. The file name becomes the web address: `/reviews/pvg-jfk-august-2026/`.

A flight review starts like this:

```markdown
---
title: 'Fifteen hours in economy, Shanghai to New York'
description: 'One sentence shown in lists and link previews.'
published: 2026-09-02
category: flight          # flight, airport, lounge or destination
airline: China Eastern
flight: MU587
from: PVG
to: JFK
aircraft: Boeing 777-300ER
cabin: Economy
seat: 45K
duration: 14h 35m
when: August 2026
verdict: 'Optional one-sentence bottom line.'
liked:
  - 'Something good'
disliked:
  - 'Something that could be better'
cover: ./images/pvg-jfk-wing.jpg
coverAlt: 'Describe the photo'
draft: false              # true hides it from the live site
---

The review goes here. Use ## for headings, **bold**, - for bullet lists,
> for a pull quote, and ![description](./images/photo.jpg) for extra photos.
```

Airport, lounge and destination reviews use `place` and `country` instead of the flight fields:

```yaml
category: lounge
place: New York JFK
country: USA
```

Photos go in `src/content/reviews/images/`. Use JPGs straight from your phone; the site resizes and converts them automatically. Blur the barcode and booking code on any boarding pass before uploading.

Files named `sample-...` in `src/content/reviews/` and `src/content/guides/` are placeholders. Delete them once real content is in.

## Writing a guide

Create a file in `src/content/guides/`, for example `beat-jet-lag.md`. It appears at `/guides/beat-jet-lag/`:

```markdown
---
title: 'How I beat jet lag flying Shanghai to New York'
description: 'One sentence shown in lists and link previews.'
published: 2026-11-10
topic: jetlag      # booking, seats, airports, onboard, jetlag, packing or points
draft: false
---

The guide goes here, in the same Markdown as reviews.
```

Topics and their labels are set in `src/consts.ts` (`TIP_TOPICS`); only topics with at least one guide show up as filters.

## Editing on github.com

Open any file and click the pencil icon to edit it. Click **Commit changes** to save, and the live site updates within a couple of minutes.

## Previewing on your own computer (optional)

This needs [Node.js](https://nodejs.org) 22 or newer:

```sh
npm install
npm run dev       # preview at http://localhost:4321
```
