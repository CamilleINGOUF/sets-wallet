export const computeVolume = (
  musclePriorities: MuscleConfig[],
  exercises: Exercise[],
  plan: WeeklyPlan,
  secondaryWeight: number,
  priorityRanges: PriorityRanges
): MuscleVolume[] => {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const totals = new Map<MuscleGroup, { primary: number; secondary: number }>();
  for (const mc of musclePriorities) {
    totals.set(mc.muscle, { primary: 0, secondary: 0 });
  }

  for (const day of plan.days) {
    for (const pe of day.exercises) {
      const exercise = exerciseMap.get(pe.exerciseId);
      if (!exercise) continue;

      const primaryEntry = totals.get(exercise.primary);
      if (primaryEntry) {
        primaryEntry.primary += pe.sets;
      }

      for (const sec of exercise.secondary) {
        const secEntry = totals.get(sec);
        if (secEntry) {
          secEntry.secondary += pe.sets;
        }
      }
    }
  }

  return musclePriorities.map((mc) => {
    const t = totals.get(mc.muscle) ?? { primary: 0, secondary: 0 };
    const target = priorityRanges[mc.priority];
    const effectiveSets = t.primary + t.secondary * secondaryWeight;

    let status: MuscleVolume['status'] = 'on-target';
    if (effectiveSets < target.min) status = 'under';
    else if (effectiveSets > target.max) status = 'over';

    return {
      muscle: mc.muscle,
      priority: mc.priority,
      target,
      primarySets: t.primary,
      secondarySets: t.secondary,
      effectiveSets,
      status,
    };
  });
};
