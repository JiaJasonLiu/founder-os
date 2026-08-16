# Founder OS

A **plan → do → reflect** system for goals that take years, not weeks.

Most productivity tools are lists. This one is built around a loop:

- **Plan** — break a goal into hour-sized steps with honest time estimates.
- **Do** — say how long you've actually got; get a right-sized short list.
- **Reflect** — see what you really did, and course-correct weekly.

Its opinionated core is a commitment mechanism: **one track this month, one task this week.** A long list is what causes decision paralysis, so the app narrows the choice for you.

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). First run walks you through onboarding.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Types only, no emit |

Requires Node 18+.

---

## The model

```
Goal            the one long-horizon thing you're aiming at
 └── Phase      broad eras on the way there (display-only)
 └── Track      a lane of work feeding the goal
      └── Quest a task within a track
           └── Step   an hour-sized piece — what you actually do
 Thread         a slow-compounding rhythm; kept, never finished
 Spotlight      the monthly/weekly commitment that narrows Focus
```

Two distinctions worth internalising:

**Quests vs Steps.** A quest is a task; a step is a piece you can finish in one sitting. If a quest has steps, Focus schedules the *steps*. If it doesn't, it schedules the quest itself. So you only break something down when it's actually too big.

**Tracks vs Threads.** Tracks contain work you complete. Threads are rhythms with no completion state — only a streak. Anything whose payoff is measured in years (a language, a public writing habit) belongs in a thread, where it can't sit unfinished and feel like failure.

---

## Project layout

```
src/
  types/index.ts        All domain types. Start here.
  data/templates.ts     Seed templates offered during onboarding.
  lib/
    dates.ts            Date maths, streak counting, formatting.
    domain.ts           Selectors + pure state mutations.
    storage.ts          localStorage persistence, migration, import/export.
    useAppState.ts      The state hook; persists and fires milestone toasts.
  components/ui.tsx     Shared primitives (Check, Button, ProgressBar…).
  views/
    Onboarding.tsx      First-run wizard.
    Focus.tsx           The daily driver: commitment + session planner.
    Plan.tsx            Structure work; collapse, reorder, add steps.
    Reflect.tsx         Stats, heatmap, weekly review, milestones.
    Journal.tsx         The decision journal.
    Threads.tsx         Slow-compounding rhythms.
    Settings.tsx        Goal, phases, data export/import/reset.
  styles/
    theme.ts            Design tokens. Restyle everything from here.
    global.css          Structural CSS and responsive rules.
  App.tsx               Shell: nav, top bar, toasts.
```

**Every mutation in `lib/domain.ts` is pure** — it takes state and returns new state, and does no I/O. That's what makes the logic easy to test and reason about. Views call them via `apply(fn)` from `useAppState`, which persists automatically.

---

## Customising

**Restyle it.** Change `src/styles/theme.ts`. Every colour, font and spacing constant flows from there.

**Change what earns momentum.** `momentum()` in `lib/domain.ts`. It's currently weighted so a logged decision (25) beats a completed action (10) — the point is judgment, not task throughput. Tune or remove it.

**Add or edit milestones.** The `MILESTONES` array in `lib/domain.ts`. Each has a `test(state)` predicate, so a milestone can key off anything in state.

**Write your own template.** Copy one in `src/data/templates.ts`, give it a unique `id`, and push it into `TEMPLATES`. It'll appear in onboarding automatically. Ids inside a template only need to be unique within that template.

**Add a field to the model.** Add it to `AppState` in `types/index.ts`, then give it a default in `migrate()` in `lib/storage.ts`. Migration runs on every load, so existing saves pick it up without breaking.

---

## Data & privacy

Everything lives in your browser's `localStorage` under `founder-os:state`. Nothing is sent anywhere; there's no backend and no analytics.

The tradeoff: clearing site data wipes it. **Settings → Export JSON** gives you a portable file, and Import restores it — that's also how you'd move between machines. If you want real sync, the cleanest seam is `lib/storage.ts`; swap `loadState`/`saveState` for API calls and nothing else needs to change.

---

## A note on the gamification

Streaks, momentum and milestones are here because long-horizon goals need something to pull you back to the desk. Two deliberate design choices:

- **Streaks forgive one gap.** Two consecutive misses break them, one doesn't. For a years-long habit, resetting to zero over a single missed week is what makes people quit.
- **Milestones require real work.** None of them unlock from points — each tests actual state, like having attacked a view in the journal.

If you ever notice yourself optimising the number rather than the work, trust the work. The score is scaffolding, not the goal.

---

## License

MIT. It's yours — fork it, rename it, make it your own.
# founder-os
