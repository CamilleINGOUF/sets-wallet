# Mesocycle Periodization for Sets Wallet

## What is a mesocycle?

A mesocycle is a training block -- typically 4 to 6 weeks -- where you follow a structured plan with a specific goal. Instead of doing the same thing every week forever, you organize your training into blocks that each have a beginning, a buildup, and a recovery phase.

Think of it like this: right now, the app helps you plan **one week** of training. A mesocycle is what happens when you zoom out and plan **several weeks** as a connected sequence, where each week builds on the previous one.

The idea is simple: your body adapts to stress, so you gradually increase the stress (more sets), then back off to let it recover and grow. Rinse and repeat.

---

## The 3 levels of periodization

Training structure works at three time scales. The app currently lives at level 1.

### 1. Microcycle = 1 week (what the app does today)

A single week of training. You pick exercises, assign sets, spread them across training days, and track whether your weekly volume hits the target range for each muscle group. This is the `WeeklyPlan` in the app -- one plan, one week, static targets.

### 2. Mesocycle = 4-6 weeks (a training block)

A sequence of microcycles that form a progression. You start at a manageable volume, add a little each week, peak, then take a deload (recovery) week. One mesocycle typically has one focus -- for example, "chest and back priority" or "bring up lagging quads."

This is the level the app is missing. Right now every week looks the same. A mesocycle would make the weeks evolve.

### 3. Macrocycle = several months (the big picture)

Multiple mesocycles chained together, each with potentially different priorities. For example:

- Mesocycle 1 (weeks 1-5): Chest & shoulders priority
- Mesocycle 2 (weeks 6-10): Back & hamstrings priority
- Mesocycle 3 (weeks 11-15): Full body moderate, deload-heavy

This is the long-term plan. You rotate priorities across mesocycles so every muscle group gets its time in the spotlight over several months.

---

## How volume changes across a mesocycle

The core mechanic of a mesocycle is **progressive overload followed by recovery**. Volume (total sets per muscle per week) starts low and climbs until you need a break.

Here is the general shape:

```
Sets
 16 |                  ****
 15 |             ****
 14 |        ****
 12 |   ****
  8 |                       ****
    +---+----+----+----+----+---
      W1   W2   W3   W4   W5
     base build build peak deload
```

**Why start low?** Week 1 is intentionally easy. You are fresh, you focus on form, and you give your body room to adapt before pushing harder.

**Why ramp up?** Each week adds 1-2 sets per muscle group. This is the progressive overload that drives adaptation. Your body sees increasing demands and responds by getting stronger.

**Why deload?** After 3-4 weeks of building, fatigue accumulates faster than fitness. The deload week (typically 50-60% of peak volume) lets fatigue dissipate while keeping the fitness you built. You come back to the next mesocycle stronger than when you started.

---

## Practical example

Using the app's intermediate preset: priority muscles target **12-16 sets/week**.

### Priority muscles (e.g., chest)

| Week | Label | Sets/week | Notes |
|------|-------|-----------|-------|
| 1 | Base | 12 | Start at the bottom of the range. Focus on technique. |
| 2 | Build | 14 | Add 2 sets. Could be an extra set on 2 exercises. |
| 3 | Build | 15 | Add 1 more set. Feeling the fatigue build. |
| 4 | Peak | 16 | Top of the range. Hardest week. |
| 5 | Deload | 8 | Drop to ~50%. Same exercises, fewer sets. Recovery. |

### Moderate muscles (e.g., back) targeting 6-12 sets/week

| Week | Label | Sets/week |
|------|-------|-----------|
| 1 | Base | 6 |
| 2 | Build | 8 |
| 3 | Build | 10 |
| 4 | Peak | 12 |
| 5 | Deload | 5 |

### Maintenance muscles (e.g., calves) targeting 4-6 sets/week

| Week | Label | Sets/week |
|------|-------|-----------|
| 1 | Base | 4 |
| 2 | Build | 5 |
| 3 | Build | 5 |
| 4 | Peak | 6 |
| 5 | Deload | 3 |

The key insight: **each priority tier follows the same ramp-up pattern, just at different absolute volumes.** The shape is the same, the numbers scale with priority.

---

## How this could integrate with the current app

The app already has the building blocks. Here is how mesocycles could layer on top of what exists.

### What exists today

- `MuscleConfig` assigns a priority to each muscle group
- `PriorityRanges` defines min/max set targets per priority tier (e.g., priority = 12-16)
- `WeeklyPlan` holds one week of exercises with set counts
- `computeVolume()` calculates effective sets vs targets and flags under/over

### What a mesocycle would add

**A mesocycle is a sequence of `WeeklyPlan` objects with a progression curve applied to the set targets.**

Conceptually:

```
Mesocycle {
  id: string
  name: string               // "Chest & Back Focus - Block 1"
  weeks: 4 | 5 | 6           // how many weeks in this block
  musclePriorities: MuscleConfig[]   // which muscles are priority/moderate/maintenance
  baseWeek: WeeklyPlan        // the Week 1 plan (user builds this like today)
  weekPlans: WeeklyPlan[]     // generated weeks 2-N based on progression
  deloadStrategy: 'half' | 'custom'
}
```

### Auto-generation flow

1. **User builds Week 1** exactly like they do today -- pick exercises, assign sets, hit the low end of their target ranges.

2. **App generates weeks 2 through N** by scaling set counts upward. The simplest approach: distribute additional sets across exercises proportionally. If week 1 has bench press at 3 sets and incline press at 3 sets, week 2 might bump one of them to 4 sets to add the extra volume.

3. **Deload week is auto-generated** by halving (or roughly halving) the sets on every exercise from the base week. Same exercises, same days, fewer sets. The user doesn't have to think about it.

4. **Weekly targets become dynamic.** Instead of a static `SetRange`, each week in the mesocycle has its own target derived from the progression curve. The volume dashboard ("you're at 14/16 sets for chest") would show the target for *this specific week*, not the static range.

### How set distribution could work

When adding sets for week 2+, the app needs to decide *which exercises* get the extra sets. Options:

- **Proportional**: add sets to exercises that already target the muscle, spreading evenly
- **Compound-first**: prefer adding sets to compound movements (bench press over cable flyes)
- **User-guided**: let the user mark which exercises should scale up vs stay fixed

The simplest first version: proportional distribution, round to nearest integer, let the user tweak manually.

### Priority rotation between mesocycles

After completing a mesocycle, the app could suggest rotating priorities:

- "You just finished 5 weeks of chest priority. Want to switch to back priority for the next block?"
- The muscle configs (`MuscleConfig[]`) simply swap: chest moves from `priority` to `moderate`, back moves from `moderate` to `priority`.
- This ensures balanced long-term development without the user having to think about it.

### What changes in `computeVolume()`

Minimal changes. The function already takes `priorityRanges` as input. For mesocycle support, the caller would pass **week-specific targets** instead of static ranges:

```
// Today: static ranges
computeVolume(muscles, exercises, plan, weight, staticRanges)

// With mesocycles: week-specific ranges derived from the progression curve
const weekRanges = deriveRangesForWeek(mesocycle, weekNumber)
computeVolume(muscles, exercises, plan, weight, weekRanges)
```

The volume computation itself stays the same. The only thing that changes is the target it compares against.

---

## Why it matters

### Without mesocycles (what most people do)

- Same volume every week, forever
- Body adapts and progress stalls (plateau)
- Fatigue accumulates with no planned recovery
- No structure for long-term progression
- Injuries from chronic overreaching without deloads

### With mesocycles

- **Progressive overload is built in.** You don't have to remember to "do more" -- the plan does it for you.
- **Deloads are scheduled, not reactive.** You recover *before* you get injured or burned out, not after.
- **Plateaus are harder to hit.** Rotating priorities between mesocycles means no muscle group stays at maintenance forever.
- **It is sustainable.** Hard weeks are followed by easy weeks. The average stress over time is manageable even when individual weeks push hard.
- **You can measure progress across blocks.** Did your Week 1 weights go up from mesocycle 1 to mesocycle 2? That is real, measurable progress.

The bottom line: a mesocycle turns "I go to the gym and do stuff" into "I follow a plan that is designed to make me stronger over time." The app already handles the weekly plan well. Adding the mesocycle layer would make it a real training program tool, not just a weekly set calculator.

---

## Terminology cheat sheet

| Term | Duration | What it is | App equivalent |
|------|----------|-----------|----------------|
| **Microcycle** | 1 week | One week of training | `WeeklyPlan` |
| **Mesocycle** | 4-6 weeks | A training block with progression + deload | Not yet implemented |
| **Macrocycle** | 3-6 months | Multiple mesocycles with rotating focuses | Not yet implemented |
| **Progressive overload** | Week to week | Gradually increasing volume (sets) | Would be auto-generated week-over-week |
| **Deload** | 1 week | Reduced volume for recovery (~50-60%) | Would be the last week of a mesocycle |
| **Volume** | Per week | Total effective sets per muscle group | `MuscleVolume.effectiveSets` |
| **Priority rotation** | Between mesocycles | Changing which muscles get the most volume | Swapping `MuscleConfig.priority` values |
