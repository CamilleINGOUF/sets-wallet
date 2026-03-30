type DayMuscleHit = {
  dayId: string;
  dayLabel: string;
  sets: number;
};

export type MuscleFrequency = {
  muscle: MuscleGroup;
  hits: DayMuscleHit[];
  frequency: number;
  hasConsecutive: boolean;
};

export const computeFrequency = (
  exercises: Exercise[],
  plan: WeeklyPlan,
  secondaryWeight: number
): MuscleFrequency[] => {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const muscleSet = new Set<MuscleGroup>();

  const dayHits = new Map<MuscleGroup, DayMuscleHit[]>();

  for (const day of plan.days) {
    const muscleSets = new Map<MuscleGroup, number>();

    for (const pe of day.exercises) {
      const ex = exerciseMap.get(pe.exerciseId);
      if (!ex) continue;

      muscleSets.set(ex.primary, (muscleSets.get(ex.primary) ?? 0) + pe.sets);
      muscleSet.add(ex.primary);

      for (const sec of ex.secondary) {
        muscleSets.set(sec, (muscleSets.get(sec) ?? 0) + pe.sets * secondaryWeight);
        muscleSet.add(sec);
      }
    }

    for (const [muscle, sets] of muscleSets) {
      if (!dayHits.has(muscle)) dayHits.set(muscle, []);
      dayHits.get(muscle)!.push({ dayId: day.id, dayLabel: day.label, sets: Math.round(sets * 10) / 10 });
    }
  }

  return Array.from(muscleSet).map((muscle) => {
    const hits = dayHits.get(muscle) ?? [];
    const hitIndices = hits.map((h) => plan.days.findIndex((d) => d.id === h.dayId));
    const hasConsecutive = hitIndices.some((idx, i) => i > 0 && idx === hitIndices[i - 1] + 1);

    return {
      muscle,
      hits,
      frequency: hits.length,
      hasConsecutive,
    };
  });
};
