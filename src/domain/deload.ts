export const generateDeload = (
  plan: WeeklyPlan,
  exercises: Exercise[]
): WeeklyPlan => {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const days = plan.days.map((day) => {
    const deloadExercises = day.exercises
      .filter((pe) => {
        const ex = exerciseMap.get(pe.exerciseId);
        return ex && ex.secondary.length > 0;
      })
      .map((pe) => ({
        ...pe,
        uid: crypto.randomUUID(),
        sets: Math.max(1, Math.ceil(pe.sets * 0.5)),
        superset: undefined,
      }));

    return { ...day, id: crypto.randomUUID(), exercises: deloadExercises };
  });

  return {
    id: crypto.randomUUID(),
    name: `${plan.name} — Deload`,
    createdAt: new Date().toISOString(),
    days,
  };
};
