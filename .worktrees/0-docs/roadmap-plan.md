# Sets Wallet — Roadmap

What we're building next, in order. Each phase is one reviewable unit of work.

---

## Phase 1: PWA & Deployment

**Goal:** Make the app accessible on phone and computer via a URL. No more dev server needed.

### Steps
1. Add `manifest.json` with app name, icons (use existing favicon.svg to generate PNG sizes), theme color, `display: standalone`
2. Add a service worker for offline caching (Vite PWA plugin: `vite-plugin-pwa` handles this with zero config)
3. Configure build for static deployment (GitHub Pages is simplest — the repo is already on GitHub)
4. Add a deploy script (`gh-pages` package or GitHub Actions workflow)
5. Test: install on phone home screen, verify offline works, verify localStorage persists

### Deliverable
A URL like `camille.github.io/sets-wallet` that anyone can open and install.

---

## Phase 2: Import/Export Plans

**Goal:** Share plans between devices and people via JSON files.

### Steps
1. **Export:** Button in History tab — downloads the current plan as a `.json` file. File contains the `WeeklyPlan` + `MuscleConfig[]` + `PriorityRanges` so the recipient gets the full context (not just exercises, but the priority setup too)
2. **Import:** Button in History tab — file picker for `.json`. Validate the schema on import (reject malformed files with a clear error). On success, add to saved plans and optionally load it as the active plan
3. **Import via URL param:** If the app opens with `?import=base64encodedplan`, auto-trigger import flow. This enables sharing via a link that encodes a small plan. Optional — file-based is the priority
4. **Profile-aware:** Import always goes into the active profile

### File format
```json
{
  "version": 1,
  "exportedAt": "2026-03-29T...",
  "plan": { /* WeeklyPlan */ },
  "priorities": [ /* MuscleConfig[] */ ],
  "priorityRanges": { /* PriorityRanges */ },
  "exercises": [ /* Exercise[] — only custom ones, not presets */ ]
}
```

### Deliverable
"Export" and "Import" buttons in the History tab. Friends can share `.json` files.

---

## Phase 3: Split Templates

**Goal:** New users start with a working plan instead of a blank canvas.

### Steps
1. Define 4-5 template configs in `data/templates.ts`:
   - **PPL 6-day** (Push/Pull/Legs x2)
   - **Upper/Lower 4-day**
   - **Full Body 3-day**
   - **PPL 3-day** (Push/Pull/Legs x1)
   - **Bro Split 5-day** (Chest / Back / Shoulders / Arms / Legs)
2. Each template is a `WeeklyPlan` with sensible exercise selection and set counts calibrated for the "intermediate" preset
3. When the current plan is empty (or via a "Start from template" button), show a template picker
4. Loading a template replaces the current plan (warn if dirty)
5. Templates scale set counts to the user's active priority ranges (not hardcoded to intermediate)

### Deliverable
Template picker accessible from the Plan tab when starting fresh or via a button.

---

## Phase 4: Frequency Heatmap

**Goal:** Make muscle frequency and recovery spacing visible.

### Steps
1. Add a `computeFrequency()` domain function: for each muscle, return which days it's hit and with how many sets (primary + weighted secondary)
2. New component `FrequencyHeatmap`: grid with muscles as rows, days as columns
   - Cell color intensity = number of sets
   - Consecutive-day hits highlighted (orange/red)
   - Row summary: total frequency (e.g., "2x/week") and spacing quality (good/tight)
3. Place it as a new view in the Volume tab (tab within tab, or below the volume table)

### Deliverable
Visual heatmap showing muscle-day distribution with recovery warnings.

---

## Phase 5: Deload Generator

**Goal:** One-click deload week creation.

### Steps
1. Domain function `generateDeload(plan, options)`:
   - Reduce all set counts to ~50% (round up, minimum 1)
   - Optionally remove exercises that only have 1 set after reduction
   - Optionally remove pure isolation exercises (exercises with no secondary muscles)
   - Keep day structure and exercise order
2. Button in History tab or Plan tab: "Generate Deload"
3. Creates a new plan named "[Original Name] — Deload" and adds to saved plans
4. User can load it, tweak it, use it for their deload week

### Deliverable
"Generate Deload" button that creates a recovery-week version of the current plan.

---

## Phase 6: Quality of Life

Pick and choose from these based on what feels most needed after the above.

### Exercise Swap Suggestions
- Domain function: given an exercise, find exercises with the same primary muscle, ranked by secondary overlap
- UI: click an exercise in the plan → popover with top 3-5 alternatives → click to swap

### Cross-Day Drag
- Extend @dnd-kit setup to support dragging between day droppables
- Requires a shared DnD context across days (may already exist in WeekPlanner)

### Day Notes
- Add `notes?: string` to `TrainingDay` type
- Small text input on each DayCard, collapsed by default

### Session Tags
- Add `tag?: DayTag` to `TrainingDay` type
- Visual badge on DayCard, clickable to cycle through tags
- Optional: filter suggestions by tag

---

## Not planned (parked)

- **Mesocycle planning** — documented in `mesocycle-concept.md`, not a priority
- **Plan comparison view** — useful but niche, revisit after core features
- **Undo/redo** — nice but complex (action history stack), revisit if experimentation friction becomes real
- **Mobile gym view optimization** — PWA deployment (Phase 1) is the first step; further optimization after real usage feedback
