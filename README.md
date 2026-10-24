# Postmarked: a travel review blog

A static travel blog built with [Astro](https://astro.build). It's published free on GitHub Pages and updates automatically whenever you change a file on GitHub.

## Where things live

| What | Where |
| --- | --- |
| Blog name, tagline, your name, social links | `src/consts.ts` |
| Reviews (one Markdown file each) | `src/content/reviews/` |
| Photos for reviews | `src/content/reviews/images/` |
| About page | `src/pages/about.md` |
| Colors and fonts | `src/styles/global.css` (the `:root` section at the top) |

## Adding a review

Create a new file in `src/content/reviews/`, for example `tokyo-capsule-hotel.md`. The file name becomes the web address: `/reviews/tokyo-capsule-hotel/`. Start it with settings between two `---` lines, then write the review below:

```markdown
---
title: 'A capsule hotel near the station'
description: 'One sentence shown in lists and link previews.'
published: 2026-11-02
place: Tokyo
country: Japan
category: stay          # trip, stay, food, sight or transport
visited: October 2026   # optional
rating: 4.5             # optional, 0 to 5 in half steps
verdict: 'Optional one-sentence bottom line.'
liked:                  # optional
  - 'Spotless'
disliked:               # optional
  - 'Thin walls'
cover: ./images/tokyo-capsule.jpg   # optional photo
coverAlt: 'Rows of capsule pods'    # describe the photo
draft: false            # true hides it from the live site
---

Your review goes here. Use ## for headings, **bold**, - for bullet lists,
> for a pull quote, and ![description](./images/photo.jpg) for extra photos.
```

Photos go in `src/content/reviews/images/`. Use JPGs straight from your phone; the site shrinks and converts them automatically.

The five files named `sample-...` are placeholders. Delete them once you've written your own.

## Editing without installing anything

On github.com, open any file and click the pencil icon to edit it. Click **Commit changes** to save, and the live site updates within a couple of minutes. To add a photo, open `src/content/reviews/images/` and choose **Add file → Upload files**.

## Previewing on your own computer (optional)

This needs [Node.js](https://nodejs.org) 22 or newer:

```sh
npm install
npm run dev       # preview at http://localhost:4321
npm run build     # build the final site into dist/
```
