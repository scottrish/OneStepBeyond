// Light or dark mode (docs/features/appearance-light-dark-v0.1.md).

export type AppearanceChoice = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

export const APPEARANCE_CHOICES: { value: AppearanceChoice; label: string; hint?: string }[] = [
  { value: "system", label: "Match my device", hint: "Light or dark, following your phone or computer." },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// The installed app's status-bar colour for each scheme: the resolved
// --background token in src/index.css. index.html's inline script uses the
// same values (a test keeps them in step).
export const THEME_COLORS: Record<ColorScheme, string> = {
  light: "#fbf9f3",
  dark: "#020618",
};

export function isAppearanceChoice(value: unknown): value is AppearanceChoice {
  return value === "system" || value === "light" || value === "dark";
}

/** The scheme to show: the student's choice, or the device's for "Match my device". */
export function resolveScheme(choice: AppearanceChoice, deviceIsDark: boolean): ColorScheme {
  if (choice === "system") return deviceIsDark ? "dark" : "light";
  return choice;
}

export function appearanceLabel(choice: AppearanceChoice): string {
  return APPEARANCE_CHOICES.find((option) => option.value === choice)!.label;
}
