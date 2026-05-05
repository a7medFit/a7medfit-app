/**
 * MuscleMap — uses react-muscle-highlighter for anatomically accurate SVG body diagrams.
 * Dark rounded card, active muscle highlighted in orange, inactive in dark grey.
 */

import Body from "react-muscle-highlighter";
import { cn } from "@/lib/utils";

export function inferMuscleGroup(title: string): string {
  const t = title.toLowerCase();
  if (/chest|pec|bench|fly|press.*chest|incline|cable.*chest|seated.*press/.test(t)) return "Chest";
  if (/back|row|lat|pull.?down|deadlift|pull.?up|pulldown/.test(t)) return "Back";
  if (/shoulder|delt|lateral|upright|front raise|overhead/.test(t)) return "Shoulders";
  if (/bicep|curl|hammer/.test(t)) return "Biceps";
  if (/tricep|pushdown|skull|dip/.test(t)) return "Triceps";
  if (/ab|crunch|plank|leg raise|sit.?up|reverse.*leg/.test(t)) return "Abs";
  if (/quad|leg extension|squat|lunge|leg press/.test(t)) return "Quadriceps";
  if (/hamstring|leg curl/.test(t)) return "Hamstrings";
  if (/calf|calves/.test(t)) return "Calves";
  if (/glute|hip thrust|rdl/.test(t)) return "Glutes";
  return "Other";
}

interface MuscleMapProps {
  muscleGroup: string;
  className?: string;
  size?: number;
  showLabel?: boolean;
}

const MUSCLE_LABEL_COLOR: Record<string, string> = {
  Chest: "#f97316",
  Back: "#3b82f6",
  Shoulders: "#a855f7",
  Biceps: "#ec4899",
  Triceps: "#14b8a6",
  Abs: "#f59e0b",
  Quadriceps: "#22c55e",
  Hamstrings: "#84cc16",
  Calves: "#06b6d4",
  Glutes: "#f43f5e",
  Other: "#94a3b8",
};

// Map our muscle group names → react-muscle-highlighter slugs + which side to show
const MUSCLE_CONFIG: Record<string, { slugs: string[]; side: "front" | "back" }> = {
  Chest:      { slugs: ["chest"],                           side: "front" },
  Shoulders:  { slugs: ["deltoids"],                        side: "front" },
  Biceps:     { slugs: ["biceps"],                          side: "front" },
  Abs:        { slugs: ["abs"],                             side: "front" },
  Quadriceps: { slugs: ["quadriceps"],                      side: "front" },
  Back:       { slugs: ["upper-back", "lower-back", "trapezius"], side: "back" },
  Triceps:    { slugs: ["triceps"],                         side: "back" },
  Hamstrings: { slugs: ["hamstring"],                       side: "back" },
  Calves:     { slugs: ["calves"],                          side: "back" },
  Glutes:     { slugs: ["gluteal"],                         side: "back" },
  Other:      { slugs: [],                                  side: "front" },
};

export default function MuscleMap({
  muscleGroup,
  className,
  size = 100,
  showLabel = true,
}: MuscleMapProps) {
  const config = MUSCLE_CONFIG[muscleGroup] ?? MUSCLE_CONFIG.Other;
  const labelColor = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;
  const highlightColor = labelColor;

  // Build data array for the Body component
  const data = config.slugs.map((slug) => ({
    slug,
    color: highlightColor,
    intensity: 2 as const,
  }));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Dark rounded card — matches reference app style */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.2),
          background: "linear-gradient(145deg, #1e2132 0%, #161824 100%)",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
      >
        <Body
          data={data}
          side={config.side}
          gender="male"
          scale={size / 62}
          background="transparent"
          border="#2a2f45"
          highlightedColors={[highlightColor]}
        />
      </div>

      {showLabel && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: labelColor + "22", color: labelColor, flexShrink: 0 }}
        >
          {muscleGroup}
        </span>
      )}
    </div>
  );
}
