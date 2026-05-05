/**
 * MuscleMap — high-quality animated muscle diagram matching reference app style.
 * Dark rounded card, zoomed upper-body torso, highlighted muscle glows white.
 */

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

// Colors per muscle
const MUSCLE_COLOR: Record<string, string> = {
  Chest: "#ffffff",
  Back: "#ffffff",
  Shoulders: "#ffffff",
  Biceps: "#ffffff",
  Triceps: "#ffffff",
  Abs: "#ffffff",
  Quadriceps: "#ffffff",
  Hamstrings: "#ffffff",
  Calves: "#ffffff",
  Glutes: "#ffffff",
  Other: "#94a3b8",
};

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

// Whether to show front or back view
const USE_BACK: Record<string, boolean> = {
  Back: true,
  Triceps: true,
  Hamstrings: true,
  Calves: true,
  Glutes: true,
};

// ─── FRONT torso SVG ────────────────────────────────────────────────────────
function FrontTorso({ highlight }: { highlight: string }) {
  const h = (id: string) => id === highlight;
  const muscFill = (id: string) => h(id) ? "#e8e8e8" : "#4a4f5a";
  const muscOpacity = (id: string) => h(id) ? "1" : "0.85";

  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        {/* Glow filter for highlighted muscle */}
        <filter id="glow-f" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Subtle shadow for depth */}
        <filter id="shadow-f" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5"/>
        </filter>
        {/* Body base gradient */}
        <radialGradient id="bodyGrad-f" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#5a6070"/>
          <stop offset="100%" stopColor="#2e3240"/>
        </radialGradient>
        {/* Highlight gradient for active muscles */}
        <radialGradient id="highlightGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#c0c8d8"/>
        </radialGradient>
      </defs>

      {/* ── NECK ── */}
      <path d="M88 8 Q100 4 112 8 L115 38 Q100 42 85 38 Z" fill="#3d4252"/>
      <path d="M90 10 Q100 6 110 10 L112 36 Q100 40 88 36 Z" fill="#454a5a"/>

      {/* ── TRAPEZIUS (upper) ── */}
      <path d="M85 38 Q100 42 115 38 L138 52 Q120 58 100 60 Q80 58 62 52 Z"
        fill={h("Shoulders") ? "#c8d0e0" : "#3e4455"}
        opacity={muscOpacity("Shoulders")}
        filter={h("Shoulders") ? "url(#glow-f)" : undefined}
      />

      {/* ── CLAVICLE LINE ── */}
      <line x1="68" y1="52" x2="100" y2="58" stroke="#262a36" strokeWidth="1.5" opacity="0.6"/>
      <line x1="132" y1="52" x2="100" y2="58" stroke="#262a36" strokeWidth="1.5" opacity="0.6"/>

      {/* ── LEFT SHOULDER (delt front) ── */}
      <path d="M62 52 Q44 54 34 70 Q30 82 36 94 Q44 88 52 80 L62 64 Z"
        fill={muscFill("Shoulders")} opacity={muscOpacity("Shoulders")}
        filter={h("Shoulders") ? "url(#glow-f)" : undefined}
      />
      <path d="M63 54 Q47 56 38 70 Q34 80 40 90 L52 80 L62 65 Z"
        fill={h("Shoulders") ? "#ffffff" : "#555e72"} opacity="0.5"
      />

      {/* ── RIGHT SHOULDER (delt front) ── */}
      <path d="M138 52 Q156 54 166 70 Q170 82 164 94 Q156 88 148 80 L138 64 Z"
        fill={muscFill("Shoulders")} opacity={muscOpacity("Shoulders")}
        filter={h("Shoulders") ? "url(#glow-f)" : undefined}
      />
      <path d="M137 54 Q153 56 162 70 Q166 80 160 90 L148 80 L138 65 Z"
        fill={h("Shoulders") ? "#ffffff" : "#555e72"} opacity="0.5"
      />

      {/* ── LEFT BICEP ── */}
      <path d="M36 96 Q28 108 28 124 Q28 136 36 142 Q44 136 48 124 Q50 112 46 98 Z"
        fill={muscFill("Biceps")} opacity={muscOpacity("Biceps")}
        filter={h("Biceps") ? "url(#glow-f)" : undefined}
      />
      <path d="M38 98 Q32 110 32 124 Q32 132 38 138 Q44 132 46 120 Q48 108 44 100 Z"
        fill={h("Biceps") ? "#ffffff" : "#545e72"} opacity="0.45"
      />

      {/* ── RIGHT BICEP ── */}
      <path d="M164 96 Q172 108 172 124 Q172 136 164 142 Q156 136 152 124 Q150 112 154 98 Z"
        fill={muscFill("Biceps")} opacity={muscOpacity("Biceps")}
        filter={h("Biceps") ? "url(#glow-f)" : undefined}
      />
      <path d="M162 98 Q168 110 168 124 Q168 132 162 138 Q156 132 154 120 Q152 108 156 100 Z"
        fill={h("Biceps") ? "#ffffff" : "#545e72"} opacity="0.45"
      />

      {/* ── LEFT TRICEP (visible from front side) ── */}
      <path d="M46 98 Q38 108 36 118 Q42 122 50 116 Q54 106 52 96 Z"
        fill={muscFill("Triceps")} opacity={h("Triceps") ? 0.9 : 0.55}
        filter={h("Triceps") ? "url(#glow-f)" : undefined}
      />
      {/* ── RIGHT TRICEP ── */}
      <path d="M154 98 Q162 108 164 118 Q158 122 150 116 Q146 106 148 96 Z"
        fill={muscFill("Triceps")} opacity={h("Triceps") ? 0.9 : 0.55}
        filter={h("Triceps") ? "url(#glow-f)" : undefined}
      />

      {/* ── CHEST LEFT PECTORAL ── */}
      <path d="M66 60 Q52 66 46 82 Q44 96 54 104 Q66 108 76 100 Q84 90 84 74 Q82 62 70 60 Z"
        fill={muscFill("Chest")} opacity={muscOpacity("Chest")}
        filter={h("Chest") ? "url(#glow-f)" : undefined}
      />
      {/* Chest highlight sheen */}
      <path d="M68 62 Q56 68 50 82 Q48 92 56 100 Q64 104 72 98 Q80 90 80 76 Q78 64 68 62 Z"
        fill={h("Chest") ? "#ffffff" : "#606878"} opacity="0.35"
      />
      {/* Chest division line */}
      <line x1="84" y1="60" x2="84" y2="106" stroke="#1e2230" strokeWidth="1.5" opacity="0.7"/>

      {/* ── CHEST RIGHT PECTORAL ── */}
      <path d="M134 60 Q148 66 154 82 Q156 96 146 104 Q134 108 124 100 Q116 90 116 74 Q118 62 130 60 Z"
        fill={muscFill("Chest")} opacity={muscOpacity("Chest")}
        filter={h("Chest") ? "url(#glow-f)" : undefined}
      />
      <path d="M132 62 Q144 68 150 82 Q152 92 144 100 Q136 104 128 98 Q120 90 120 76 Q122 64 132 62 Z"
        fill={h("Chest") ? "#ffffff" : "#606878"} opacity="0.35"
      />

      {/* ── STERNUM / CENTER LINE ── */}
      <line x1="100" y1="58" x2="100" y2="110" stroke="#1e2230" strokeWidth="2" opacity="0.6"/>

      {/* ── SERRATUS (side ribs) ── */}
      {[0,1,2].map(i => (
        <g key={i}>
          <path d={`M 64 ${108 + i * 12} Q 54 ${112 + i * 12} 52 ${118 + i * 12}`}
            stroke={h("Chest") || h("Abs") ? "#aaa" : "#404555"} strokeWidth="2.5" fill="none" opacity="0.7"/>
          <path d={`M 136 ${108 + i * 12} Q 146 ${112 + i * 12} 148 ${118 + i * 12}`}
            stroke={h("Chest") || h("Abs") ? "#aaa" : "#404555"} strokeWidth="2.5" fill="none" opacity="0.7"/>
        </g>
      ))}

      {/* ── ABS (6-pack grid) ── */}
      {/* Left column */}
      {[0,1,2].map(i => (
        <rect key={`al${i}`} x="80" y={108 + i * 22} width="18" height="17" rx="4"
          fill={muscFill("Abs")} opacity={h("Abs") ? "0.95" : "0.75"}
          filter={h("Abs") ? "url(#glow-f)" : undefined}
        />
      ))}
      {/* Right column */}
      {[0,1,2].map(i => (
        <rect key={`ar${i}`} x="102" y={108 + i * 22} width="18" height="17" rx="4"
          fill={muscFill("Abs")} opacity={h("Abs") ? "0.95" : "0.75"}
          filter={h("Abs") ? "url(#glow-f)" : undefined}
        />
      ))}
      {/* Abs highlight */}
      {h("Abs") && [0,1,2].map(i => (
        <g key={`ah${i}`}>
          <rect x="80" y={108 + i * 22} width="18" height="17" rx="4" fill="white" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.55;0.25" dur="1.6s" repeatCount="indefinite"/>
          </rect>
          <rect x="102" y={108 + i * 22} width="18" height="17" rx="4" fill="white" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.55;0.25" dur="1.6s" repeatCount="indefinite"/>
          </rect>
        </g>
      ))}

      {/* ── OBLIQUES ── */}
      <path d="M76 108 Q66 118 64 138 Q72 142 78 132 Q82 120 82 108 Z"
        fill={h("Abs") ? "#c8ccd8" : "#424858"} opacity="0.8"/>
      <path d="M124 108 Q134 118 136 138 Q128 142 122 132 Q118 120 118 108 Z"
        fill={h("Abs") ? "#c8ccd8" : "#424858"} opacity="0.8"/>

      {/* ── LOWER TORSO / HIP ── */}
      <path d="M64 152 Q100 162 136 152 L140 168 Q100 178 60 168 Z"
        fill="#363b4a" opacity="0.8"/>

      {/* ── BODY OUTLINE ── */}
      <path d="M85 8 Q100 2 115 8 L138 52 Q160 54 170 70 Q178 90 168 110
               L160 148 Q140 162 100 166 Q60 162 40 148 L32 110 Q22 90 30 70
               Q40 54 62 52 Z"
        fill="none" stroke="#1e2230" strokeWidth="2" opacity="0.5"
      />

      {/* ── PULSE ANIMATION on highlighted muscle ── */}
      {highlight !== "Other" && (
        <circle cx="100" cy="110" r="80" fill={MUSCLE_COLOR[highlight] || "#fff"} opacity="0">
          <animate attributeName="opacity" values="0;0.04;0" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="r" values="60;90;60" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}

// ─── BACK torso SVG ─────────────────────────────────────────────────────────
function BackTorso({ highlight }: { highlight: string }) {
  const h = (id: string) => id === highlight;
  const muscFill = (id: string) => h(id) ? "#e8e8e8" : "#4a4f5a";
  const muscOpacity = (id: string) => h(id) ? "1" : "0.85";

  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <filter id="glow-b" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="bodyGrad-b" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#5a6070"/>
          <stop offset="100%" stopColor="#2e3240"/>
        </radialGradient>
      </defs>

      {/* ── NECK ── */}
      <path d="M88 8 Q100 4 112 8 L115 34 Q100 40 85 34 Z" fill="#3d4252"/>
      <path d="M90 10 Q100 6 110 10 L112 32 Q100 38 88 32 Z" fill="#454a5a"/>

      {/* ── TRAPEZIUS ── */}
      <path d="M85 34 Q100 40 115 34 L140 54 Q120 62 100 64 Q80 62 60 54 Z"
        fill={h("Back") || h("Shoulders") ? "#d0d8e8" : "#3e4455"}
        opacity={h("Back") || h("Shoulders") ? "1" : "0.85"}
        filter={h("Back") || h("Shoulders") ? "url(#glow-b)" : undefined}
      />
      {/* Trap centerline */}
      <line x1="100" y1="40" x2="100" y2="64" stroke="#262a36" strokeWidth="1.5" opacity="0.5"/>

      {/* ── LEFT REAR DELT ── */}
      <path d="M60 54 Q42 56 32 72 Q28 86 36 98 Q46 92 52 82 L62 66 Z"
        fill={muscFill("Shoulders")} opacity={muscOpacity("Shoulders")}
        filter={h("Shoulders") ? "url(#glow-b)" : undefined}
      />
      <path d="M62 56 Q46 58 38 72 Q34 84 40 94 L52 82 L62 68 Z"
        fill={h("Shoulders") ? "#ffffff" : "#555e72"} opacity="0.4"
      />

      {/* ── RIGHT REAR DELT ── */}
      <path d="M140 54 Q158 56 168 72 Q172 86 164 98 Q154 92 148 82 L138 66 Z"
        fill={muscFill("Shoulders")} opacity={muscOpacity("Shoulders")}
        filter={h("Shoulders") ? "url(#glow-b)" : undefined}
      />
      <path d="M138 56 Q154 58 162 72 Q166 84 160 94 L148 82 L138 68 Z"
        fill={h("Shoulders") ? "#ffffff" : "#555e72"} opacity="0.4"
      />

      {/* ── LEFT LAT ── */}
      <path d="M62 66 Q44 78 38 102 Q36 120 44 134 Q56 138 64 128 Q70 114 70 96 L68 74 Z"
        fill={muscFill("Back")} opacity={muscOpacity("Back")}
        filter={h("Back") ? "url(#glow-b)" : undefined}
      />
      <path d="M64 68 Q48 80 42 102 Q40 118 46 130 Q54 132 62 124 Q68 110 68 94 L66 76 Z"
        fill={h("Back") ? "#ffffff" : "#606878"} opacity="0.35"
      />

      {/* ── RIGHT LAT ── */}
      <path d="M138 66 Q156 78 162 102 Q164 120 156 134 Q144 138 136 128 Q130 114 130 96 L132 74 Z"
        fill={muscFill("Back")} opacity={muscOpacity("Back")}
        filter={h("Back") ? "url(#glow-b)" : undefined}
      />
      <path d="M136 68 Q152 80 158 102 Q160 118 154 130 Q146 132 138 124 Q132 110 132 94 L134 76 Z"
        fill={h("Back") ? "#ffffff" : "#606878"} opacity="0.35"
      />

      {/* ── RHOMBOIDS / MID BACK ── */}
      <path d="M70 66 Q100 72 130 66 L130 100 Q100 108 70 100 Z"
        fill={h("Back") ? "#d8dce8" : "#404555"}
        opacity={h("Back") ? "1" : "0.8"}
        filter={h("Back") ? "url(#glow-b)" : undefined}
      />
      {/* Spine line */}
      <line x1="100" y1="64" x2="100" y2="152" stroke="#1e2230" strokeWidth="2.5" opacity="0.6"/>

      {/* ── LOWER BACK / ERECTORS ── */}
      <path d="M84 100 Q100 106 116 100 L118 140 Q100 148 82 140 Z"
        fill={h("Back") ? "#c8ccd8" : "#3d4255"}
        opacity={h("Back") ? "0.95" : "0.75"}
        filter={h("Back") ? "url(#glow-b)" : undefined}
      />
      {/* Erector highlight strips */}
      <rect x="87" y="102" width="6" height="36" rx="3"
        fill={h("Back") ? "#ffffff" : "#525a6a"} opacity={h("Back") ? "0.5" : "0.4"}/>
      <rect x="107" y="102" width="6" height="36" rx="3"
        fill={h("Back") ? "#ffffff" : "#525a6a"} opacity={h("Back") ? "0.5" : "0.4"}/>

      {/* ── LEFT TRICEP (back view) ── */}
      <path d="M36 98 Q28 110 28 126 Q30 138 40 142 Q48 136 50 122 Q52 108 46 98 Z"
        fill={muscFill("Triceps")} opacity={muscOpacity("Triceps")}
        filter={h("Triceps") ? "url(#glow-b)" : undefined}
      />
      <path d="M38 100 Q32 112 32 126 Q34 134 40 138 Q46 132 48 120 Q50 106 44 100 Z"
        fill={h("Triceps") ? "#ffffff" : "#545e72"} opacity="0.4"
      />

      {/* ── RIGHT TRICEP (back view) ── */}
      <path d="M164 98 Q172 110 172 126 Q170 138 160 142 Q152 136 150 122 Q148 108 154 98 Z"
        fill={muscFill("Triceps")} opacity={muscOpacity("Triceps")}
        filter={h("Triceps") ? "url(#glow-b)" : undefined}
      />
      <path d="M162 100 Q168 112 168 126 Q166 134 160 138 Q154 132 152 120 Q150 106 156 100 Z"
        fill={h("Triceps") ? "#ffffff" : "#545e72"} opacity="0.4"
      />

      {/* ── GLUTES ── */}
      <path d="M62 140 Q100 152 138 140 L142 160 Q120 170 100 172 Q80 170 58 160 Z"
        fill={h("Glutes") ? "#d8dce8" : "#3e4455"}
        opacity={h("Glutes") ? "1" : "0.8"}
        filter={h("Glutes") ? "url(#glow-b)" : undefined}
      />
      {/* Glute crease */}
      <line x1="100" y1="140" x2="100" y2="172" stroke="#1e2230" strokeWidth="1.5" opacity="0.5"/>

      {/* ── HAMSTRINGS ── */}
      <path d="M60 160 Q56 172 58 190 Q62 208 74 212 Q84 210 86 196 Q90 178 88 162 Q74 158 60 160 Z"
        fill={h("Hamstrings") ? "#d0d8e8" : "#404555"}
        opacity={h("Hamstrings") ? "1" : "0.8"}
        filter={h("Hamstrings") ? "url(#glow-b)" : undefined}
      />
      <path d="M112 162 Q110 178 114 196 Q116 210 126 212 Q138 208 142 190 Q144 172 140 160 Q126 158 112 162 Z"
        fill={h("Hamstrings") ? "#d0d8e8" : "#404555"}
        opacity={h("Hamstrings") ? "1" : "0.8"}
        filter={h("Hamstrings") ? "url(#glow-b)" : undefined}
      />

      {/* ── CALVES ── */}
      <path d="M62 212 Q58 220 62 228 Q72 230 78 224 Q80 214 76 212 Z"
        fill={h("Calves") ? "#d0d8e8" : "#3e4455"}
        opacity={h("Calves") ? "1" : "0.8"}
        filter={h("Calves") ? "url(#glow-b)" : undefined}
      />
      <path d="M124 212 Q122 220 124 228 Q132 230 140 224 Q142 214 138 212 Z"
        fill={h("Calves") ? "#d0d8e8" : "#3e4455"}
        opacity={h("Calves") ? "1" : "0.8"}
        filter={h("Calves") ? "url(#glow-b)" : undefined}
      />

      {/* ── BODY OUTLINE ── */}
      <path d="M85 8 Q100 2 115 8 L140 54 Q164 56 172 72 Q180 94 168 116
               L158 150 Q138 164 100 174 Q62 164 42 150 L32 116 Q20 94 28 72
               Q36 56 60 54 Z"
        fill="none" stroke="#1e2230" strokeWidth="2" opacity="0.4"
      />

      {/* Pulse */}
      {highlight !== "Other" && (
        <circle cx="100" cy="110" r="80" fill={MUSCLE_COLOR[highlight] || "#fff"} opacity="0">
          <animate attributeName="opacity" values="0;0.04;0" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="r" values="60;90;60" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function MuscleMap({ muscleGroup, className, size = 90, showLabel = true }: MuscleMapProps) {
  const useBack = USE_BACK[muscleGroup] ?? false;
  const labelColor = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Dark rounded card container — matches reference */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: "linear-gradient(145deg, #1e2132 0%, #161824 100%)",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          // Clip so the body fills the card tightly (zoom in)
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <div style={{ width: size * 1.1, height: size * 1.35, marginTop: -(size * 0.05) }}>
          {useBack
            ? <BackTorso highlight={muscleGroup} />
            : <FrontTorso highlight={muscleGroup} />
          }
        </div>
      </div>

      {showLabel && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: labelColor + "22", color: labelColor, flexShrink: 0 }}
        >
          {muscleGroup}
        </span>
      )}
    </div>
  );
}
