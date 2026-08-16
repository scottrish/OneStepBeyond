// Preset effort choices for Assignment Capture
// (docs/features/assignment-capture.md: "preset effort chips... rather
// than a free-number field").
export const EFFORT_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "45m", minutes: 45 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
  { label: "5h", minutes: 300 },
];

// "effort defaults to a preset value so it is never required to type"
export const DEFAULT_EFFORT_MINUTES = 30;

export function effortLabel(minutes: number): string {
  return EFFORT_PRESETS.find((preset) => preset.minutes === minutes)?.label
    ?? `${minutes} min`;
}
