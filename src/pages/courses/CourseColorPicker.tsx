import { Check } from "lucide-react";
import { COURSE_COLORS } from "../../domain/courseColor";

type CourseColorPickerProps = {
  // Names the group for assistive tech, e.g. "Colour for Biology".
  label: string;
  value: number;
  onChange: (colorIndex: number) => void;
};

// The 8 course colours as 44px swatches (course-management-v2-proposal.md
// §1). Each is named ("Clay", "Fern", …) and marks the chosen one with
// aria-pressed, a ring and a check — never by colour alone.
export default function CourseColorPicker({ label, value, onChange }: CourseColorPickerProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {COURSE_COLORS.map((color, index) => {
        const selected = index === value;
        return (
          <button
            key={color.value}
            type="button"
            aria-label={color.label}
            aria-pressed={selected}
            onClick={() => onChange(index)}
            className={`flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring ${
              selected ? "ring-2 ring-foreground" : ""
            }`}
            style={{ backgroundColor: color.value }}
          >
            {selected ? <Check aria-hidden="true" className="size-4 text-white" /> : null}
          </button>
        );
      })}
    </div>
  );
}
