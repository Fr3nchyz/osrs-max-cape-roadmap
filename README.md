# OSRS Max Cape Roadmap

A personal Old School RuneScape "Road to Max" dashboard for the account **fr3nchy**. It pulls live levels and
XP from the official Jagex HiScores, lets you pick efficient (often AFK-friendly) training methods per skill,
and projects the total hours, GP gained/lost, and an estimated **max date** to hit 99 in everything.

**Live:** https://osrs.amaurymarque.com

## Features

- **Live HiScores sync** — fetched server-side from Jagex's `index_lite.json` (no CORS proxy), including the new
  **Sailing** skill.
- **Time-to-Max dashboard** — total hours remaining, projected net GP at max, skills remaining, and a maxing-date
  estimate driven by a **playtime-density** slider (hours/day).
- **Per-skill training methods** — choose from curated meta methods (e.g. Ironwoods, Gemstone mining, Quetzal
  Rumours, Addy plates, the Gwenith Glide). Each shows its XP/h and GP/h, with hours-to-99 and projected return.
- **Time Density Visualizer** — a stacked, skill-themed bar showing which grinds dominate the remaining journey.
- **Two orderings** — *Efficient* (a hand-tuned skilling sequence, default) or *XP Remaining* (combat pushed to the
  bottom).
- **Hide maxed skills** and **persistent selections** — your method/order/playtime choices are saved in
  `localStorage`.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) icons
- Deployed on [Vercel](https://vercel.com/) — auto-ships on push to `main`

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build:

```bash
npm run build
```

## How it works

- `app/api/hiscores/route.ts` — server route that proxies the Jagex HiScores JSON for `fr3nchy` (avoids browser CORS).
- `app/page.tsx` — the client dashboard: parsing, time/GP math, sorting, and all the UI. Training-method data
  lives in the `TRAINING_METHODS` table at the top of the file — edit rates/GP there to tune the model.
