/**
 * MuscleMap — animated front/back body SVG highlighting the target muscle group.
 * Muscle groups: Chest, Back, Shoulders, Biceps, Triceps, Abs, Quadriceps, Hamstrings, Calves, Glutes, Other
 */

import { cn } from "@/lib/utils";

// Map exercise title keywords → muscle group
export function inferMuscleGroup(title: string): string {
  const t = title.toLowerCase();
  if (/chest|pec|bench|fly|press.*chest|incline|cable.*chest/.test(t)) return "Chest";
  if (/back|row|lat|pull.?down|deadlift|pull.?up|pulldown/.test(t)) return "Back";
  if (/shoulder|delt|lateral|upright|front raise|overhead/.test(t)) return "Shoulders";
  if (/bicep|curl|hammer/.test(t)) return "Biceps";
  if (/tricep|pushdown|skull|dip/.test(t)) return "Triceps";
  if (/ab|crunch|plank|leg raise|sit.?up/.test(t)) return "Abs";
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
}

// Which view (front/back) to show and which path IDs to highlight per muscle group
const MUSCLE_CONFIG: Record<string, { view: "front" | "back" | "both"; color: string }> = {
  Chest:       { view: "front", color: "#f97316" },
  Abs:         { view: "front", color: "#f97316" },
  Biceps:      { view: "front", color: "#f97316" },
  Quadriceps:  { view: "front", color: "#f97316" },
  Shoulders:   { view: "both",  color: "#f97316" },
  Triceps:     { view: "back",  color: "#f97316" },
  Back:        { view: "back",  color: "#f97316" },
  Hamstrings:  { view: "back",  color: "#f97316" },
  Calves:      { view: "back",  color: "#f97316" },
  Glutes:      { view: "back",  color: "#f97316" },
  Other:       { view: "front", color: "#94a3b8" },
};

// Each muscle region is drawn as an SVG path/ellipse on a 100x220 canvas body outline
// Front view muscles
function FrontBody({ highlight, color }: { highlight: string; color: string }) {
  const active = (id: string) => highlight === id;
  const fill = (id: string) => active(id)
    ? color
    : "currentColor";
  const opacity = (id: string) => active(id) ? "1" : "0.13";

  return (
    <svg viewBox="0 0 100 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body outline */}
      {/* Head */}
      <ellipse cx="50" cy="18" rx="13" ry="15" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
      {/* Neck */}
      <rect x="45" y="31" width="10" height="8" rx="3" fill="currentColor" opacity="0.1"/>
      {/* Torso outline */}
      <path d="M28 39 Q20 50 20 80 Q20 95 28 100 L72 100 Q80 95 80 80 Q80 50 72 39 Z" fill="currentColor" opacity="0.07" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>

      {/* CHEST */}
      <g style={{ transition: "opacity 0.5s, fill 0.5s" }} opacity={opacity("Chest")}>
        <ellipse cx="41" cy="54" rx="10" ry="8" fill={fill("Chest")} />
        <ellipse cx="59" cy="54" rx="10" ry="8" fill={fill("Chest")} />
        {active("Chest") && <ellipse cx="41" cy="54" rx="10" ry="8" fill={color} opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>}
        {active("Chest") && <ellipse cx="59" cy="54" rx="10" ry="8" fill={color} opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>}
      </g>

      {/* ABS */}
      <g style={{ transition: "opacity 0.5s" }} opacity={opacity("Abs")}>
        {[0,1,2].map(row => [0,1].map(col => (
          <rect key={`${row}${col}`} x={col === 0 ? 38 : 50} y={66 + row*10} width="9" height="7" rx="3" fill={fill("Abs")} />
        )))}
        {active("Abs") && [0,1,2].map(row => [0,1].map(col => (
          <rect key={`a${row}${col}`} x={col === 0 ? 38 : 50} y={66 + row*10} width="9" height="7" rx="3" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.4s" repeatCount="indefinite"/>
          </rect>
        )))}
      </g>

      {/* SHOULDERS (front delts) */}
      <g opacity={opacity("Shoulders")}>
        <ellipse cx="24" cy="47" rx="8" ry="9" fill={fill("Shoulders")} />
        <ellipse cx="76" cy="47" rx="8" ry="9" fill={fill("Shoulders")} />
        {active("Shoulders") && <>
          <ellipse cx="24" cy="47" rx="8" ry="9" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="76" cy="47" rx="8" ry="9" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* BICEPS */}
      <g opacity={opacity("Biceps")}>
        <ellipse cx="17" cy="68" rx="6" ry="12" fill={fill("Biceps")} />
        <ellipse cx="83" cy="68" rx="6" ry="12" fill={fill("Biceps")} />
        {active("Biceps") && <>
          <ellipse cx="17" cy="68" rx="6" ry="12" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="83" cy="68" rx="6" ry="12" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* Forearms */}
      <ellipse cx="13" cy="91" rx="4.5" ry="10" fill="currentColor" opacity="0.08"/>
      <ellipse cx="87" cy="91" rx="4.5" ry="10" fill="currentColor" opacity="0.08"/>

      {/* QUADS */}
      <g opacity={opacity("Quadriceps")}>
        <ellipse cx="38" cy="140" rx="11" ry="22" fill={fill("Quadriceps")} />
        <ellipse cx="62" cy="140" rx="11" ry="22" fill={fill("Quadriceps")} />
        {active("Quadriceps") && <>
          <ellipse cx="38" cy="140" rx="11" ry="22" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.4s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="62" cy="140" rx="11" ry="22" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.4s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* Knees */}
      <ellipse cx="38" cy="164" rx="9" ry="6" fill="currentColor" opacity="0.08"/>
      <ellipse cx="62" cy="164" rx="9" ry="6" fill="currentColor" opacity="0.08"/>

      {/* Lower legs (front) */}
      <ellipse cx="38" cy="185" rx="7" ry="14" fill="currentColor" opacity="0.07"/>
      <ellipse cx="62" cy="185" rx="7" ry="14" fill="currentColor" opacity="0.07"/>

      {/* Hips/groin */}
      <path d="M28 100 Q38 110 50 112 Q62 110 72 100" stroke="currentColor" strokeWidth="0.5" opacity="0.2" fill="none"/>

      {/* Legs outline */}
      <path d="M28 100 Q25 125 26 170 Q27 195 34 205 Q42 210 44 205 Q46 170 50 155 Q54 170 56 205 Q58 210 66 205 Q73 195 74 170 Q75 125 72 100" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="0.6" opacity="0.18"/>

      {/* Label */}
      <text x="50" y="216" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="system-ui">Front</text>
    </svg>
  );
}

function BackBody({ highlight, color }: { highlight: string; color: string }) {
  const active = (id: string) => highlight === id;
  const fill = (id: string) => active(id) ? color : "currentColor";
  const opacity = (id: string) => active(id) ? "1" : "0.13";

  return (
    <svg viewBox="0 0 100 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Head */}
      <ellipse cx="50" cy="18" rx="13" ry="15" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
      <rect x="45" y="31" width="10" height="8" rx="3" fill="currentColor" opacity="0.1"/>
      {/* Torso */}
      <path d="M28 39 Q20 50 20 80 Q20 95 28 100 L72 100 Q80 95 80 80 Q80 50 72 39 Z" fill="currentColor" opacity="0.07" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>

      {/* SHOULDERS (rear delts) */}
      <g opacity={opacity("Shoulders")}>
        <ellipse cx="24" cy="47" rx="8" ry="9" fill={fill("Shoulders")} />
        <ellipse cx="76" cy="47" rx="8" ry="9" fill={fill("Shoulders")} />
        {active("Shoulders") && <>
          <ellipse cx="24" cy="47" rx="8" ry="9" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="76" cy="47" rx="8" ry="9" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* BACK (traps + lats) */}
      <g opacity={opacity("Back")}>
        {/* Traps */}
        <path d="M37 39 Q50 44 63 39 Q55 48 50 49 Q45 48 37 39Z" fill={fill("Back")} />
        {/* Lats */}
        <path d="M22 55 Q28 48 37 50 L36 85 Q28 90 22 82 Z" fill={fill("Back")} />
        <path d="M78 55 Q72 48 63 50 L64 85 Q72 90 78 82 Z" fill={fill("Back")} />
        {/* Mid back */}
        <rect x="37" y="52" width="26" height="30" rx="4" fill={fill("Back")} opacity={active("Back") ? "0.9" : "1"}/>
        {active("Back") && <>
          <rect x="37" y="52" width="26" height="30" rx="4" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.5s" repeatCount="indefinite"/>
          </rect>
          <path d="M22 55 Q28 48 37 50 L36 85 Q28 90 22 82 Z" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.5s" repeatCount="indefinite"/>
          </path>
          <path d="M78 55 Q72 48 63 50 L64 85 Q72 90 78 82 Z" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.5s" repeatCount="indefinite"/>
          </path>
        </>}
      </g>

      {/* TRICEPS */}
      <g opacity={opacity("Triceps")}>
        <ellipse cx="17" cy="68" rx="6" ry="12" fill={fill("Triceps")} />
        <ellipse cx="83" cy="68" rx="6" ry="12" fill={fill("Triceps")} />
        {active("Triceps") && <>
          <ellipse cx="17" cy="68" rx="6" ry="12" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="83" cy="68" rx="6" ry="12" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* Forearms */}
      <ellipse cx="13" cy="91" rx="4.5" ry="10" fill="currentColor" opacity="0.08"/>
      <ellipse cx="87" cy="91" rx="4.5" ry="10" fill="currentColor" opacity="0.08"/>

      {/* GLUTES */}
      <g opacity={opacity("Glutes")}>
        <ellipse cx="38" cy="108" rx="13" ry="11" fill={fill("Glutes")} />
        <ellipse cx="62" cy="108" rx="13" ry="11" fill={fill("Glutes")} />
        {active("Glutes") && <>
          <ellipse cx="38" cy="108" rx="13" ry="11" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="62" cy="108" rx="13" ry="11" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* HAMSTRINGS */}
      <g opacity={opacity("Hamstrings")}>
        <ellipse cx="38" cy="145" rx="11" ry="22" fill={fill("Hamstrings")} />
        <ellipse cx="62" cy="145" rx="11" ry="22" fill={fill("Hamstrings")} />
        {active("Hamstrings") && <>
          <ellipse cx="38" cy="145" rx="11" ry="22" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.4s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="62" cy="145" rx="11" ry="22" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.4s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* Knees */}
      <ellipse cx="38" cy="169" rx="9" ry="6" fill="currentColor" opacity="0.08"/>
      <ellipse cx="62" cy="169" rx="9" ry="6" fill="currentColor" opacity="0.08"/>

      {/* CALVES */}
      <g opacity={opacity("Calves")}>
        <ellipse cx="38" cy="188" rx="7.5" ry="13" fill={fill("Calves")} />
        <ellipse cx="62" cy="188" rx="7.5" ry="13" fill={fill("Calves")} />
        {active("Calves") && <>
          <ellipse cx="38" cy="188" rx="7.5" ry="13" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="62" cy="188" rx="7.5" ry="13" fill={color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.85;0.4" dur="1.3s" repeatCount="indefinite"/>
          </ellipse>
        </>}
      </g>

      {/* Legs outline */}
      <path d="M28 100 Q25 125 26 170 Q27 195 34 205 Q42 210 44 205 Q46 170 50 155 Q54 170 56 205 Q58 210 66 205 Q73 195 74 170 Q75 125 72 100" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="0.6" opacity="0.18"/>

      {/* Label */}
      <text x="50" y="216" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="system-ui">Back</text>
    </svg>
  );
}

export default function MuscleMap({ muscleGroup, className, size = 120 }: MuscleMapProps) {
  const config = MUSCLE_CONFIG[muscleGroup] ?? MUSCLE_CONFIG["Other"];
  const showFront = config.view === "front" || config.view === "both";
  const showBack = config.view === "back" || config.view === "both";

  return (
    <div className={cn("flex items-start justify-center gap-2", className)}>
      {showFront && (
        <div style={{ width: size, height: size * 2.2 }} className="text-foreground">
          <FrontBody highlight={muscleGroup} color={config.color} />
        </div>
      )}
      {showBack && (
        <div style={{ width: size, height: size * 2.2 }} className="text-foreground">
          <BackBody highlight={muscleGroup} color={config.color} />
        </div>
      )}
      <div className="flex flex-col justify-center pl-1">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: config.color + "22", color: config.color }}
        >
          {muscleGroup}
        </span>
      </div>
    </div>
  );
}
