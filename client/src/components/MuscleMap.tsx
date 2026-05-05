/**
 * MuscleMap — uses react-body-highlighter for a clean flat-polygon body diagram.
 * Dark rounded card, active muscle highlighted in the group's accent color.
 * Tap the card to open fullscreen overlay.
 */

import { useState } from "react";
import Model from "react-body-highlighter";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
  Chest:      "#f97316",
  Back:       "#3b82f6",
  Shoulders:  "#a855f7",
  Biceps:     "#ec4899",
  Triceps:    "#14b8a6",
  Abs:        "#f59e0b",
  Quadriceps: "#22c55e",
  Hamstrings: "#84cc16",
  Calves:     "#06b6d4",
  Glutes:     "#f43f5e",
  Other:      "#94a3b8",
};

// Map our muscle group names → react-body-highlighter muscle slugs + view type
const MUSCLE_CONFIG: Record<string, {
  muscles: string[];
  type: "anterior" | "posterior";
}> = {
  Chest:      { muscles: ["chest"],                                      type: "anterior"  },
  Shoulders:  { muscles: ["front-deltoids", "back-deltoids"],            type: "anterior"  },
  Biceps:     { muscles: ["biceps"],                                     type: "anterior"  },
  Abs:        { muscles: ["abs"],                                        type: "anterior"  },
  Quadriceps: { muscles: ["quadriceps"],                                 type: "anterior"  },
  Back:       { muscles: ["upper-back", "lower-back", "trapezius"],      type: "posterior" },
  Triceps:    { muscles: ["triceps"],                                    type: "posterior" },
  Hamstrings: { muscles: ["hamstring"],                                  type: "posterior" },
  Calves:     { muscles: ["calves"],                                     type: "posterior" },
  Glutes:     { muscles: ["gluteal"],                                    type: "posterior" },
  Other:      { muscles: [],                                             type: "anterior"  },
};

function BodyCard({
  muscleGroup, size, onClick,
}: {
  muscleGroup: string;
  size: number;
  onClick?: () => void;
}) {
  const config = MUSCLE_CONFIG[muscleGroup] ?? MUSCLE_CONFIG.Other;
  const color = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;

  const data = config.muscles.length > 0
    ? [{ name: muscleGroup, muscles: config.muscles as any[] }]
    : [];

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.18),
        background: "linear-gradient(145deg, #1e2132 0%, #161824 100%)",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        padding: Math.round(size * 0.05),
      }}
    >
      <Model
        data={data}
        type={config.type}
        bodyColor="#2a2f45"
        highlightedColors={[color]}
        style={{ width: "100%", height: "100%" }}
        svgStyle={{ width: "100%", height: "100%" }}
      />
      {/* Expand hint */}
      {onClick && (
        <div style={{
          position: "absolute", bottom: 4, right: 5,
          fontSize: 9, color: "rgba(255,255,255,0.3)",
          lineHeight: 1,
        }}>⛶</div>
      )}
    </div>
  );
}

export default function MuscleMap({
  muscleGroup,
  className,
  size = 100,
  showLabel = true,
}: MuscleMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const labelColor = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;
  const fullSize = Math.min(window.innerWidth, window.innerHeight) * 0.78;

  return (
    <>
      <div className={cn("flex items-center gap-3", className)}>
        <BodyCard
          muscleGroup={muscleGroup}
          size={size}
          onClick={() => setFullscreen(true)}
        />

        {showLabel && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: labelColor + "22", color: labelColor, flexShrink: 0 }}
          >
            {muscleGroup}
          </span>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16,
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setFullscreen(false)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none", borderRadius: "50%",
              width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
            }}
          >
            <X size={20} />
          </button>

          {/* Large body card */}
          <BodyCard
            muscleGroup={muscleGroup}
            size={fullSize}
          />

          {/* Label */}
          <span
            style={{
              fontSize: 22, fontWeight: 700,
              color: labelColor,
              background: labelColor + "22",
              padding: "6px 20px",
              borderRadius: 999,
              letterSpacing: "0.02em",
            }}
          >
            {muscleGroup}
          </span>
        </div>
      )}
    </>
  );
}
