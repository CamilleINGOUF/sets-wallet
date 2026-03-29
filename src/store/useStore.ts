import { useSyncExternalStore, useCallback, useRef } from 'react';
import { MUSCLE_GROUPS } from '../data/muscles';
import { PRESET_EXERCISES } from '../data/exercises';
import { DEFAULT_RANGES } from '../data/priorities';

const PROFILES_KEY = 'sets-wallet-profiles';
const STATE_PREFIX = 'sets-wallet-state';

const DEFAULT_PROFILE: ProfileMeta = { id: 'default', name: 'Me' };

const DEFAULT_PRIORITIES: MuscleConfig[] = MUSCLE_GROUPS.map((muscle) => ({
  muscle,
  priority: 'moderate' as Priority,
}));

const createEmptyDay = (id: string, label: string): TrainingDay => ({
  id,
  label,
  exercises: [],
});

const createDefaultPlan = (): WeeklyPlan => ({
  id: crypto.randomUUID(),
  name: 'Current Week',
  createdAt: new Date().toISOString(),
  days: [
    createEmptyDay('mon', 'Monday'),
    createEmptyDay('tue', 'Tuesday'),
    createEmptyDay('wed', 'Wednesday'),
    createEmptyDay('thu', 'Thursday'),
    createEmptyDay('fri', 'Friday'),
    createEmptyDay('sat', 'Saturday'),
  ],
});

const createDefaultState = (): AppState => ({
  musclePriorities: DEFAULT_PRIORITIES,
  priorityRanges: { ...DEFAULT_RANGES },
  exercises: [...PRESET_EXERCISES],
  currentPlan: createDefaultPlan(),
  savedPlans: [],
  secondaryWeight: 0.5,
});

const mergePresets = (saved: Exercise[]): Exercise[] => {
  const savedNames = new Set(saved.map((e) => e.name));
  const savedIds = new Set(saved.map((e) => e.id));
  const missing = PRESET_EXERCISES.filter(
    (e) => !savedIds.has(e.id) && !savedNames.has(e.name)
  );
  return [...saved, ...missing];
};

const migratePlannedExercises = (plan: WeeklyPlan): WeeklyPlan => ({
  ...plan,
  days: plan.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((pe) => ({
      ...pe,
      uid: pe.uid ?? crypto.randomUUID(),
    })),
  })),
});

// --- Profile management ---

const loadProfilesIndex = (): ProfilesIndex => {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  // Migrate: if old single-profile state exists, adopt it as "default"
  const legacyState = localStorage.getItem('sets-wallet-state');
  if (legacyState) {
    localStorage.setItem(`${STATE_PREFIX}-default`, legacyState);
    localStorage.removeItem('sets-wallet-state');
  }
  return { activeId: 'default', profiles: [DEFAULT_PROFILE] };
};

const persistProfilesIndex = (index: ProfilesIndex) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(index));
};

const storageKeyFor = (profileId: string) => `${STATE_PREFIX}-${profileId}`;

const loadStateFor = (profileId: string): AppState => {
  try {
    const raw = localStorage.getItem(storageKeyFor(profileId));
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      parsed.exercises = mergePresets(parsed.exercises);
      parsed.currentPlan = migratePlannedExercises(parsed.currentPlan);
      parsed.savedPlans = parsed.savedPlans.map(migratePlannedExercises);
      if (!parsed.priorityRanges) parsed.priorityRanges = { ...DEFAULT_RANGES };
      return parsed;
    }
  } catch {
    // ignore
  }
  return createDefaultState();
};

// --- Store state ---

let profilesIndex = loadProfilesIndex();
let state = loadStateFor(profilesIndex.activeId);
let lastSavedSnapshot = JSON.stringify(state.currentPlan);
const listeners = new Set<() => void>();

const persist = () => {
  localStorage.setItem(storageKeyFor(profilesIndex.activeId), JSON.stringify(state));
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
};

const setState = (updater: (prev: AppState) => AppState) => {
  state = updater(state);
  emit();
};

const getState = () => state;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const isDirty = () => JSON.stringify(state.currentPlan) !== lastSavedSnapshot;

export const getProfilesIndex = () => profilesIndex;

export const useStore = <T>(selector: (s: AppState) => T): T => {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = useCallback(() => selectorRef.current(getState()), []);

  return useSyncExternalStore(subscribe, getSnapshot);
};

// Separate store for profile-level reactivity
const profileListeners = new Set<() => void>();
const subscribeProfiles = (listener: () => void) => {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
};

export const useProfiles = (): ProfilesIndex => {
  const getSnapshot = useCallback(() => profilesIndex, []);
  return useSyncExternalStore(subscribeProfiles, getSnapshot);
};

export const profileActions = {
  switchProfile(profileId: string) {
    // Persist current state first
    persist();
    profilesIndex = { ...profilesIndex, activeId: profileId };
    persistProfilesIndex(profilesIndex);
    state = loadStateFor(profileId);
    lastSavedSnapshot = JSON.stringify(state.currentPlan);
    profileListeners.forEach((l) => l());
    listeners.forEach((l) => l());
  },

  createProfile(name: string) {
    const id = crypto.randomUUID();
    const meta: ProfileMeta = { id, name };
    profilesIndex = {
      ...profilesIndex,
      profiles: [...profilesIndex.profiles, meta],
    };
    persistProfilesIndex(profilesIndex);
    // Initialize with default state
    localStorage.setItem(storageKeyFor(id), JSON.stringify(createDefaultState()));
    profileListeners.forEach((l) => l());
    return id;
  },

  renameProfile(profileId: string, name: string) {
    profilesIndex = {
      ...profilesIndex,
      profiles: profilesIndex.profiles.map((p) =>
        p.id === profileId ? { ...p, name } : p
      ),
    };
    persistProfilesIndex(profilesIndex);
    profileListeners.forEach((l) => l());
  },

  deleteProfile(profileId: string) {
    if (profilesIndex.profiles.length <= 1) return;
    if (profileId === profilesIndex.activeId) return;
    profilesIndex = {
      ...profilesIndex,
      profiles: profilesIndex.profiles.filter((p) => p.id !== profileId),
    };
    persistProfilesIndex(profilesIndex);
    localStorage.removeItem(storageKeyFor(profileId));
    profileListeners.forEach((l) => l());
  },
};

export const actions = {
  setPriority(muscle: MuscleGroup, priority: Priority) {
    setState((s) => ({
      ...s,
      musclePriorities: s.musclePriorities.map((mc) =>
        mc.muscle === muscle ? { ...mc, priority } : mc
      ),
    }));
  },

  addExerciseToPlan(dayId: string, exerciseId: string, sets: number) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  { uid: crypto.randomUUID(), exerciseId, sets },
                ],
              }
            : d
        ),
      },
    }));
  },

  removeExerciseFromPlan(dayId: string, uid: string) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) =>
          d.id === dayId
            ? { ...d, exercises: d.exercises.filter((e) => e.uid !== uid) }
            : d
        ),
      },
    }));
  },

  updateSets(dayId: string, uid: string, sets: number) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: d.exercises.map((e) =>
                  e.uid === uid ? { ...e, sets } : e
                ),
              }
            : d
        ),
      },
    }));
  },

  reorderExercises(dayId: string, fromIndex: number, toIndex: number) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) => {
          if (d.id !== dayId) return d;
          const updated = [...d.exercises];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { ...d, exercises: updated };
        }),
      },
    }));
  },

  setSuperset(dayId: string, uid: string, group: SupersetGroup | undefined) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: d.exercises.map((e) =>
                  e.uid === uid ? { ...e, superset: group } : e
                ),
              }
            : d
        ),
      },
    }));
  },

  savePlan() {
    setState((s) => {
      const clone = structuredClone(s.currentPlan);
      const existingIdx = s.savedPlans.findIndex((p) => p.id === clone.id);
      const savedPlans =
        existingIdx !== -1
          ? s.savedPlans.map((p, i) => (i === existingIdx ? clone : p))
          : [...s.savedPlans, clone];
      lastSavedSnapshot = JSON.stringify(s.currentPlan);
      return { ...s, savedPlans };
    });
  },

  overwritePlan(planId: string) {
    setState((s) => {
      const clone = structuredClone(s.currentPlan);
      lastSavedSnapshot = JSON.stringify(s.currentPlan);
      return {
        ...s,
        savedPlans: s.savedPlans.map((p) =>
          p.id === planId ? { ...clone, id: planId, name: p.name, createdAt: p.createdAt } : p
        ),
      };
    });
  },

  loadPlan(planId: string) {
    setState((s) => {
      const plan = s.savedPlans.find((p) => p.id === planId);
      if (!plan) return s;
      const newCurrent = structuredClone(plan);
      lastSavedSnapshot = JSON.stringify(newCurrent);
      return { ...s, currentPlan: newCurrent };
    });
  },

  deletePlan(planId: string) {
    setState((s) => ({
      ...s,
      savedPlans: s.savedPlans.filter((p) => p.id !== planId),
    }));
  },

  addDay(label: string) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: [
          ...s.currentPlan.days,
          createEmptyDay(crypto.randomUUID(), label),
        ],
      },
    }));
  },

  removeDay(dayId: string) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.filter((d) => d.id !== dayId),
      },
    }));
  },

  renameDay(dayId: string, label: string) {
    setState((s) => ({
      ...s,
      currentPlan: {
        ...s.currentPlan,
        days: s.currentPlan.days.map((d) =>
          d.id === dayId ? { ...d, label } : d
        ),
      },
    }));
  },

  addExercise(exercise: Omit<Exercise, 'id'>) {
    setState((s) => ({
      ...s,
      exercises: [...s.exercises, { ...exercise, id: crypto.randomUUID() }],
    }));
  },

  removeExercise(exerciseId: string) {
    setState((s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.id !== exerciseId),
    }));
  },

  setSecondaryWeight(weight: number) {
    setState((s) => ({ ...s, secondaryWeight: weight }));
  },

  setPriorityRange(priority: Priority, range: SetRange) {
    setState((s) => ({
      ...s,
      priorityRanges: { ...s.priorityRanges, [priority]: range },
    }));
  },

  applyVolumePreset(ranges: PriorityRanges) {
    setState((s) => ({
      ...s,
      priorityRanges: { ...ranges },
    }));
  },

  renamePlan(name: string) {
    setState((s) => ({
      ...s,
      currentPlan: { ...s.currentPlan, name },
    }));
  },

  exportState(): string {
    return JSON.stringify(state, null, 2);
  },
};
