/**
 * MuscleMap — uses react-muscle-highlighter for anatomically accurate SVG body diagrams.
 * Dark rounded card, active muscle highlighted in orange, inactive in dark grey.
 * Tap the card to open fullscreen overlay.
 */

import { useState } from "react";
import Body from "react-muscle-highlighter";
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

// Map our muscle group names → slugs, view side, zoom scale, and vertical pan (% of body height, negative = up)
// translateY is expressed as a fraction of the rendered body height — negative moves the view UP (toward head)
const MUSCLE_CONFIG: Record<string, {
  slugs: string[];
  side: "front" | "back";
  zoom: number;    // CSS scale multiplier applied to the body
  panY: number;    // vertical offset as fraction of container size (negative = shift up toward muscle)
}> = {
  //                                                          zoom   panY
  Chest:      { slugs: ["chest"],                           side: "front", zoom: 2.2, panY: -0.28 },
  Shoulders:  { slugs: ["deltoids"],                        side: "front", zoom: 2.2, panY: -0.30 },
  Biceps:     { slugs: ["biceps"],                          side: "front", zoom: 2.0, panY: -0.20 },
  Abs:        { slugs: ["abs"],                             side: "front", zoom: 2.0, panY: -0.10 },
  Quadriceps: { slugs: ["quadriceps"],                      side: "front", zoom: 2.2, panY:  0.18 },
  Back:       { slugs: ["upper-back", "lower-back", "trapezius"], side: "back",  zoom: 2.0, panY: -0.18 },
  Triceps:    { slugs: ["triceps"],                         side: "back",  zoom: 2.0, panY: -0.18 },
  Hamstrings: { slugs: ["hamstring"],                       side: "back",  zoom: 2.2, panY:  0.15 },
  Calves:     { slugs: ["calves"],                          side: "back",  zoom: 2.4, panY:  0.36 },
  Glutes:     { slugs: ["gluteal"],                         side: "back",  zoom: 2.2, panY:  0.10 },
  Other:      { slugs: [],                                  side: "front", zoom: 1.0, panY:  0    },
};

function BodyCard({
  config, labelColor, highlightColor, size, onClick,
}: {
  config: { slugs: string[]; side: "front" | "back"; zoom: number; panY: number };
  labelColor: string;
  highlightColor: string;
  size: number;
  onClick?: () => void;
}) {
  const data = config.slugs.map((slug) => ({
    slug,
    color: highlightColor,
    intensity: 2 as const,
  }));

  // Render the body at a fixed base size, then zoom+pan via CSS transform
  // Base scale keeps the full body fitting the container at zoom=1
  const baseScale = size / 62;
  const translateYpx = config.panY * size;

  return (
    <div
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      {/* Inner wrapper applies zoom + pan without padding affecting layout */}
      <div style={{
        transform: `scale(${config.zoom}) translateY(${translateYpx / config.zoom}px)`,
        transformOrigin: "center center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Body
          data={data}
          side={config.side}
          gender="male"
          scale={baseScale}
          background="transparent"
          border="#2a2f45"
          highlightedColors={[highlightColor]}
        />
      </div>
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
  const config = MUSCLE_CONFIG[muscleGroup] ?? MUSCLE_CONFIG.Other;
  const labelColor = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;
  const highlightColor = labelColor;
  const fullSize = Math.min(window.innerWidth, window.innerHeight) * 0.78;

  return (
    <>
      <div className={cn("flex items-center gap-3", className)}>
        <BodyCard
          config={config}
          labelColor={labelColor}
          highlightColor={highlightColor}
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
            background: "rgba(0,0,0,0.85)",
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
            config={config}
            labelColor={labelColor}
            highlightColor={highlightColor}
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
