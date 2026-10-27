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

## Trip reports and detailed reviews

Each trip gets a **trip report**: the overview, how you booked, the itinerary, and short notes on anything not worth its own review. The flights and lounges that deserve a full write-up get **detailed reviews** of their own, linked to the trip.

A trip report only needs its dates. Every flight in the Logbook between `start` and `end` becomes its itinerary and route map automatically:

```markdown
---
title: 'Shanghai to New York the long way, through Hong Kong and Toronto'
description: 'One sentence shown in lists and link previews.'
published: 2026-10-30
category: trip
start: 2026-08-21
end: 2026-08-22
routeScore: 7       # optional, out of 10: how much you'd recommend this routing back to school
verdict: 'One-sentence summary for the In short box.'
cover: ./images/aug-2026-cover.jpg
coverAlt: 'Describe the photo'
---

Why this route, how I booked, notes on the shorter flights and lounges...
```

A detailed review joins its trip with `trip:` (the trip report's file name, without .md). For flights, `date:` links the review to that flight in the Logbook:

```yaml
trip: aug-2026-hkg-yyz-trip
date: 2026-08-22
```

The trip report then lists its detailed reviews, each review links back to the trip, and in the Logbook, flights with their own detailed review link to it.

## Writing a review

Create a file in `src/content/reviews/`, for example `pvg-jfk-august-2026.md`. The file name becomes the web address: `/reviews/pvg-jfk-august-2026/`.

A flight review starts like this:

```markdown
---
title: 'Fifteen hours in economy, Shanghai to New York'
description: 'One sentence shown in lists and link previews.'
published: 2026-09-02
category: flight          # trip, flight, lounge or hotel
airline: China Eastern
flight: MU587
from: PVG
to: JFK
aircraft: Boeing 777-300ER
cabin: Economy
seat: 45K
duration: 14h 35m
date: 2026-08-22          # date flown; links the review to the flight in the Logbook
trip: aug-2026-trip       # optional: the trip report this review belongs to
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

Lounge and hotel reviews use `place` and `country` instead of the flight fields:

```yaml
category: lounge
place: Hong Kong (HKG)
country: Hong Kong
```

Hotels can also have a room, a check-in date and the number of nights:

```yaml
category: hotel
place: Niseko
country: Japan
room: 'Park King, mountain view'
date: 2024-02-09      # check-in date
nights: 3
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

## Upcoming flights and the "in the air" banner

Upcoming flights are kept **encrypted** in `private/upcoming.enc.json`, so the schedule is never public. The key is the `UPCOMING_FLIGHTS_KEY` secret (Settings → Secrets and variables → Actions); without it the file can't be read.

Every 15 minutes a GitHub job checks the schedule. While a flight is in the air (from 15 minutes after scheduled departure until scheduled arrival), the home page shows "Leo is flying from *city* to *city*" with only the two cities: no flight number, times or position. When the flight lands the banner disappears, and 30 minutes later the flight is added to `src/data/flights.yaml` automatically.

To change the schedule, edit a private copy and re-encrypt it with the key:

```sh
UPCOMING_FLIGHTS_KEY=... node scripts/upcoming.mjs decrypt > private/upcoming.yaml   # private/*.yaml is never committed
UPCOMING_FLIGHTS_KEY=... node scripts/upcoming.mjs encrypt private/upcoming.yaml
```

Times in the schedule are local at each airport, as shown in the airline app.

## Editing on github.com

Open any file and click the pencil icon to edit it. Click **Commit changes** to save, and the live site updates within a couple of minutes.

## Previewing on your own computer (optional)

This needs [Node.js](https://nodejs.org) 22 or newer:

```sh
npm install
npm run dev       # preview at http://localhost:4321
```
