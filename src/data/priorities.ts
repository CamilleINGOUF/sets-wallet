export const PRIORITY_LABELS: Record<Priority, string> = {
  priority: 'Priority',
  moderate: 'Moderate',
  maintenance: 'Maintenance',
};

export const PRIORITY_ORDER: Priority[] = ['priority', 'moderate', 'maintenance'];

export const VOLUME_PRESETS = {
  beginner: {
    label: 'Beginner',
    description: 'Just started, building habits',
    ranges: {
      priority: { min: 8, max: 12 },
      moderate: { min: 4, max: 8 },
      maintenance: { min: 3, max: 5 },
    },
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Consistent training, progressive overload',
    ranges: {
      priority: { min: 12, max: 16 },
      moderate: { min: 6, max: 12 },
      maintenance: { min: 4, max: 6 },
    },
  },
  advanced: {
    label: 'Advanced',
    description: 'Years of training, high work capacity',
    ranges: {
      priority: { min: 15, max: 18 },
      moderate: { min: 6, max: 14 },
      maintenance: { min: 6, max: 8 },
    },
  },
} as const satisfies Record<string, { label: string; description: string; ranges: PriorityRanges }>;

export type VolumePresetKey = keyof typeof VOLUME_PRESETS;

export const DEFAULT_RANGES: PriorityRanges = VOLUME_PRESETS.advanced.ranges;
