/**
 * MuscleMap — static pre-rendered muscle anatomy images.
 * Full body diagram with targeted muscle highlighted in accent color.
 * Tap the card to open fullscreen overlay.
 */

import { useState } from "react";
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

const MUSCLE_IMAGE: Record<string, string> = {
  Chest:      "/muscles/chest.png",
  Back:       "/muscles/back.png",
  Shoulders:  "/muscles/shoulders.png",
  Biceps:     "/muscles/biceps.png",
  Triceps:    "/muscles/triceps.png",
  Abs:        "/muscles/abs.png",
  Quadriceps: "/muscles/quadriceps.png",
  Hamstrings: "/muscles/hamstrings.png",
  Calves:     "/muscles/calves.png",
  Glutes:     "/muscles/glutes.png",
};

function BodyCard({
  muscleGroup, size, onClick,
}: {
  muscleGroup: string;
  size: number;
  onClick?: () => void;
}) {
  const color = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;
  const imgSrc = MUSCLE_IMAGE[muscleGroup];

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
        padding: Math.round(size * 0.04),
      }}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={muscleGroup}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "brightness(1.08) contrast(1.05)",
          }}
          draggable={false}
        />
      ) : (
        <div style={{ color, fontSize: size * 0.12, fontWeight: 700, opacity: 0.6 }}>
          {muscleGroup}
        </div>
      )}
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

          <BodyCard
            muscleGroup={muscleGroup}
            size={fullSize}
          />

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
