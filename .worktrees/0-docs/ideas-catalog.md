# Sets Wallet — Ideas Catalog

All proposed improvements, documented for reference. Ordered loosely by category, not priority. See `roadmap-plan.md` for what we're actually building and when.

---

## Sharing & Portability

### Import/Export Plans as JSON Files
Share training plans between users by exporting a plan as a `.json` file and importing it on another device/profile. No backend needed — just download/upload a file. On import, the plan merges into the user's saved plans. Could also support importing into the active plan directly.

**What it unlocks:** Friends can share plans without being on the same device. Backup/restore across browsers. Migrate between phone and desktop.

### Shareable Plans via URL
Encode a plan as compressed base64 in a URL hash. Recipient opens the link, plan loads into their profile. Complementary to file export — URLs are easier to share via chat, but have size limits.

### Copy Plan Between Profiles
One-click copy of the active plan (or a saved plan) to another profile. Useful when a friend wants to start from your plan and tweak it.

---

## PWA & Deployment

### Deployable Build (PWA)
Make the app installable on phones and computers as a Progressive Web App. Add a `manifest.json`, service worker for offline caching, and deploy to a static host (GitHub Pages, Netlify, or Vercel). The app already works offline (localStorage), so the gap is small.

**What it unlocks:** Use the app at the gym without a dev server. Install on home screen. Works offline. Share one URL with friends.

---

## Planning Features

### Split Templates
Pre-built starting plans for common training splits: PPL (Push/Pull/Legs), Upper/Lower, Arnold Split, Full Body 3x, Bro Split. Each template is a `WeeklyPlan` with pre-filled days, exercises, and reasonable set counts based on the user's current priorities.

**What it unlocks:** New users get a working plan in 30 seconds. Reduces the blank-canvas problem.

### Deload Week Generator
One button: generate a deload version of the current plan. Rules: ~50-60% of sets, drop isolation exercises (keep compounds), keep the same day structure. Creates a new plan in saved history.

**What it unlocks:** Deloads are part of every good program but tedious to plan manually.

### Session Tags (Day Types)
Tag days as "Push", "Pull", "Legs", "Upper", "Lower", "Full Body", or custom labels. Tags are visual and can optionally drive suggestions (only suggest push exercises on a Push day).

**What it unlocks:** Clearer visual structure. Smarter suggestions scoped to the day's intent.

### Exercise Swap Suggestions
Click an exercise in the plan, see alternatives that hit the same primary (and similar secondary) muscles. Ranked by how well they match the original's muscle profile.

**What it unlocks:** Variety across weeks. Quick substitution when equipment is unavailable.

---

## Visualization & Analysis

### Muscle Frequency & Recovery Heatmap
A grid: muscles (rows) x days (columns). Cells show how many sets hit that muscle on that day. Highlights consecutive-day hits in red (bad for recovery) and well-spaced hits in green. Frequency count per muscle shown on the side.

**What it unlocks:** Recovery-aware planning. Frequency is a key programming variable alongside volume — currently invisible.

### Plan Comparison View
Side-by-side diff of two saved plans. Shows: volume delta per muscle, exercises added/removed, total workload change, days changed.

**What it unlocks:** Iterate on programming with confidence. See exactly what changed between versions.

### Volume Trends (if mesocycle is ever built)
Chart showing volume per muscle across weeks of a mesocycle. Not relevant until mesocycle planning exists.

---

## UX & Quality of Life

### Undo/Redo
Action history stack with Ctrl+Z / Ctrl+Y support. Essential for a planning tool where experimentation is the whole point.

**What it unlocks:** Fearless experimentation. "What if I move these exercises?" becomes risk-free.

### Drag Exercises Between Days
Currently exercises can be reordered within a day. Cross-day drag would let users rebalance sessions by moving exercises across days directly.

**What it unlocks:** Faster plan iteration without remove-then-add.

### Notes Per Day
Short text field on each day card. "Start light today", "Focus on mind-muscle connection", "Superset everything for time".

**What it unlocks:** Context that doesn't fit in exercise names. Useful when reviewing the plan at the gym.

### Mobile Gym View Optimization
The Gym Card view with larger touch targets, swipe between days, and a "current day" auto-focus based on the day of the week.

**What it unlocks:** Better usability when actually at the gym on a phone screen.

---

## Long-Term / Big Scope

### Mesocycle Planning
Plan across 4-6 week blocks with progressive volume ramping and auto-generated deload weeks. Already documented in detail in `mesocycle-concept.md`. Not a current priority — the weekly planner is the core product.

### Macrocycle / Priority Rotation
Chain mesocycles with rotating muscle priorities across months. Depends on mesocycle planning existing first. Very long-term.
