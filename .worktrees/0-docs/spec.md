# Sets Wallet — Spec

## Problem

Distribute weekly training sets across muscles based on personal priorities. Make it easy to tweak priorities, set ranges, and exercise placement without rebuilding the whole plan.

## Core Concepts

### 1. Muscle Groups (broad, no subdivisions)

| Group | Notes |
|-------|-------|
| Chest | Pecs |
| Back | Lats, traps, rhomboids — all grouped |
| Shoulders | All three heads |
| Biceps | |
| Triceps | |
| Quads | |
| Hamstrings | |
| Glutes | |
| Calves | |
| Abs / Core | |
| Forearms | Optional / low-priority for most |

### 2. Priority Levels → Set Ranges

Each muscle is assigned a priority. The priority determines a **weekly set range** (target).

| Priority | Sets/week range | Intent |
|----------|----------------|--------|
| **Priority** | 15–18 | Maximum growth stimulus |
| **Moderate** | 8–15 | Solid growth, not all-out |
| **Maintenance** | 6–8 | Keep what you have |

These ranges are configurable — the user can adjust them.

### 3. Exercise Catalog

Each exercise belongs to **one primary muscle** (and optionally secondary muscles).
Example:
- Bench Press → primary: Chest, secondary: Triceps, Shoulders
- Barbell Row → primary: Back, secondary: Biceps
- Squat → primary: Quads, secondary: Glutes, Hamstrings

The catalog is user-editable. Add/remove exercises freely.

### 4. Weekly Planner

- User picks how many training days/week (e.g., 4, 5, 6)
- Exercises are placed into days
- Each exercise has a **number of sets** assigned
- The app computes **total sets per muscle per week** (primary + secondary contributions)
- Visual feedback: are you hitting your target range? Over? Under?

## What We Know

- The data model is simple: muscles, priorities, exercises, days, sets
- This is a personal tool — no auth, no backend, no distribution
- It needs to be fast to tweak: change a priority, swap an exercise, adjust sets
- The core value is the **computation + visualization** of sets vs. targets

## Decisions Made

1. **Tech stack** — React + Vite, local storage, no backend
2. **Secondary muscle counting** — 0.5× (default, configurable)
3. **Split structure** — fully free-form, user places exercises wherever they want
4. **Rep ranges / weight tracking** — not needed, this is purely about set distribution
5. **Presets** — yes, pre-loaded exercise catalog with common exercises
6. **History** — yes, save previous weeks
7. **Exercise constraints** — no enforcement, user knows their body

## What We Truly Want

The **minimum lovable product**:

1. **Configure muscles + priorities** — assign each muscle a priority level
2. **See the budget** — the app shows how many sets/week each muscle "deserves"
3. **Build a week** — place exercises into days with set counts
4. **See the math** — live computation: sets planned vs. sets budgeted per muscle
5. **Adjust freely** — change priorities, swap exercises, tweak sets, see the impact instantly

Everything else (history, weight tracking, split suggestions) is nice-to-have for later.

## Phases (Proposed)

1. **Phase 0: Data model + types** — muscle catalog, exercise catalog, priority config, weekly plan structure
2. **Phase 1: Core computation** — given a plan, compute sets per muscle, compare to targets
3. **Phase 2: UI** — simple React app to configure priorities, manage exercises, build a week, see the dashboard
4. **Phase 3: Polish** — presets, local storage persistence, better UX
5. **Phase 4: Extras** — history, secondary muscle weighting, split suggestions
