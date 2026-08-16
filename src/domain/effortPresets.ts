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

// Sums of preset values routinely land outside the fixed preset set
// (45m + 1h + 45m = 150min) — this formats those the same "Xh Ym" way
// the presets themselves read, instead of a raw "150 min" (see
// docs/playwright/manual-work-breakdown-reflection/iteration-01/findings.yaml
// FINDING-WB-002).
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function effortLabel(minutes: number): string {
  return EFFORT_PRESETS.find((preset) => preset.minutes === minutes)?.label
    ?? formatMinutes(minutes);
}
