/**
 * MuscleMap — flat-vector anatomy style matching reference images.
 * Dark card, zoomed torso, clean segment outlines, active muscle = bright white.
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

const USE_BACK: Record<string, boolean> = {
  Back: true,
  Triceps: true,
  Hamstrings: true,
  Calves: true,
  Glutes: true,
};

// Colour palette matching the reference
const C = {
  bg:        "#1a1d2e",   // dark navy card background
  body:      "#3a3f52",   // base torso fill
  muscle:    "#4e5468",   // inactive muscle segment
  muscleHi:  "#6a7088",   // inactive muscle lighter face
  muscleSep: "#2a2e3e",   // separator / outline between segments
  active:    "#dce4f0",   // active muscle bright fill
  activeHi:  "#ffffff",   // active muscle highlight peak
  shadow:    "#252838",   // deep shadow areas
  skin:      "#3d4255",   // head / neck
  skinHi:    "#4a5068",   // head lighter side
};

// ─────────────────────────────────────────────────────────────────────────────
// FRONT VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FrontBody({ highlight }: { highlight: string }) {
  const a = (id: string) => id === highlight;

  const mFill  = (id: string) => a(id) ? C.active   : C.muscle;
  const mFill2 = (id: string) => a(id) ? C.activeHi : C.muscleHi;

  return (
    <svg viewBox="18 0 164 230" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <filter id="gF" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── HEAD ── */}
      <ellipse cx="100" cy="19" rx="16" ry="18" fill={C.skin}/>
      <ellipse cx="94"  cy="16" rx="8"  ry="10" fill={C.skinHi} opacity="0.5"/>

      {/* ── NECK ── */}
      <path d="M91 34 L109 34 L111 48 L89 48 Z" fill={C.skin}/>
      <path d="M93 34 L100 34 L100 48 L91 48 Z" fill={C.skinHi} opacity="0.4"/>

      {/* ── TORSO BASE ── */}
      <path d="M55 48 Q38 56 30 80 Q26 104 32 136 Q38 154 60 164
               L80 170 L100 172 L120 170 L140 164
               Q162 154 168 136 Q174 104 170 80 Q162 56 145 48 Z"
        fill={C.body}/>

      {/* ── TRAPEZIUS ── */}
      <path d="M89 48 L111 48 L138 58 Q118 66 100 68 Q82 66 62 58 Z"
        fill={a("Shoulders") || a("Back") ? C.active : C.muscle}
        stroke={C.muscleSep} strokeWidth="1"/>
      {/* trap highlight */}
      <path d="M91 48 L109 48 L130 56 Q112 62 100 64 Q88 62 70 56 Z"
        fill={a("Shoulders") || a("Back") ? C.activeHi : C.muscleHi} opacity="0.45"/>

      {/* ── LEFT SHOULDER (front delt) ── */}
      <path d="M62 58 Q42 60 32 76 Q28 92 36 106 Q46 100 54 88 L64 70 Z"
        fill={mFill("Shoulders")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Shoulders") ? "url(#gF)" : undefined}/>
      <path d="M64 60 Q46 62 36 76 Q33 88 40 100 L54 88 L64 72 Z"
        fill={mFill2("Shoulders")} opacity="0.45"/>
      {a("Shoulders") && (
        <path d="M62 58 Q42 60 32 76 Q28 92 36 106 Q46 100 54 88 L64 70 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT SHOULDER (front delt) ── */}
      <path d="M138 58 Q158 60 168 76 Q172 92 164 106 Q154 100 146 88 L136 70 Z"
        fill={mFill("Shoulders")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Shoulders") ? "url(#gF)" : undefined}/>
      <path d="M136 60 Q154 62 164 76 Q167 88 160 100 L146 88 L136 72 Z"
        fill={mFill2("Shoulders")} opacity="0.45"/>
      {a("Shoulders") && (
        <path d="M138 58 Q158 60 168 76 Q172 92 164 106 Q154 100 146 88 L136 70 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── LEFT BICEP ── */}
      <path d="M32 108 Q24 120 24 136 Q24 150 34 156 Q44 150 48 136 Q50 120 42 108 Z"
        fill={mFill("Biceps")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Biceps") ? "url(#gF)" : undefined}/>
      <path d="M34 110 Q28 122 28 136 Q28 146 36 150 Q42 144 46 132 Q48 118 40 110 Z"
        fill={mFill2("Biceps")} opacity="0.4"/>
      {a("Biceps") && (
        <path d="M32 108 Q24 120 24 136 Q24 150 34 156 Q44 150 48 136 Q50 120 42 108 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT BICEP ── */}
      <path d="M168 108 Q176 120 176 136 Q176 150 166 156 Q156 150 152 136 Q150 120 158 108 Z"
        fill={mFill("Biceps")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Biceps") ? "url(#gF)" : undefined}/>
      <path d="M166 110 Q172 122 172 136 Q172 146 164 150 Q158 144 154 132 Q152 118 160 110 Z"
        fill={mFill2("Biceps")} opacity="0.4"/>
      {a("Biceps") && (
        <path d="M168 108 Q176 120 176 136 Q176 150 166 156 Q156 150 152 136 Q150 120 158 108 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── LEFT TRICEP (side, front view) ── */}
      <path d="M42 108 Q34 120 34 134 L44 132 Q50 118 48 106 Z"
        fill={mFill("Triceps")} stroke={C.muscleSep} strokeWidth="1"
        filter={a("Triceps") ? "url(#gF)" : undefined} opacity="0.9"/>

      {/* ── RIGHT TRICEP (side, front view) ── */}
      <path d="M158 108 Q166 120 166 134 L156 132 Q150 118 152 106 Z"
        fill={mFill("Triceps")} stroke={C.muscleSep} strokeWidth="1"
        filter={a("Triceps") ? "url(#gF)" : undefined} opacity="0.9"/>

      {/* ── LEFT PECTORAL ── */}
      <path d="M64 68 Q48 74 42 90 Q40 106 52 114 Q66 118 78 110 Q88 100 86 82 Q84 68 70 66 Z"
        fill={mFill("Chest")} stroke={C.muscleSep} strokeWidth="1.5"
        filter={a("Chest") ? "url(#gF)" : undefined}/>
      {/* pec highlight — upper-inner bright area */}
      <path d="M72 68 Q58 74 54 88 Q52 100 60 108 Q70 110 76 104 Q84 96 82 82 Q80 70 72 68 Z"
        fill={mFill2("Chest")} opacity="0.5"/>
      {a("Chest") && (
        <path d="M64 68 Q48 74 42 90 Q40 106 52 114 Q66 118 78 110 Q88 100 86 82 Q84 68 70 66 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT PECTORAL ── */}
      <path d="M136 68 Q152 74 158 90 Q160 106 148 114 Q134 118 122 110 Q112 100 114 82 Q116 68 130 66 Z"
        fill={mFill("Chest")} stroke={C.muscleSep} strokeWidth="1.5"
        filter={a("Chest") ? "url(#gF)" : undefined}/>
      <path d="M128 68 Q142 74 146 88 Q148 100 140 108 Q130 110 124 104 Q116 96 118 82 Q120 70 128 68 Z"
        fill={mFill2("Chest")} opacity="0.5"/>
      {a("Chest") && (
        <path d="M136 68 Q152 74 158 90 Q160 106 148 114 Q134 118 122 110 Q112 100 114 82 Q116 68 130 66 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* Sternum / chest center divider */}
      <line x1="100" y1="66" x2="100" y2="116" stroke={C.muscleSep} strokeWidth="2"/>

      {/* ── SERRATUS (side ribs) ── */}
      {[0,1,2].map(i => (
        <g key={i}>
          <path d={`M 62 ${116 + i*14} Q 50 ${120 + i*14} 48 ${126 + i*14}`}
            stroke={a("Chest") || a("Abs") ? "#9aa0b8" : "#3a3f52"} strokeWidth="3"
            strokeLinecap="round" fill="none"/>
          <path d={`M 138 ${116 + i*14} Q 150 ${120 + i*14} 152 ${126 + i*14}`}
            stroke={a("Chest") || a("Abs") ? "#9aa0b8" : "#3a3f52"} strokeWidth="3"
            strokeLinecap="round" fill="none"/>
        </g>
      ))}

      {/* ── ABS — 6 blocks ── */}
      {[0,1,2].map(row => (
        <g key={row}>
          {/* left block */}
          <rect x="80" y={116 + row*20} width="18" height="16" rx="4"
            fill={mFill("Abs")} stroke={C.muscleSep} strokeWidth="1.2"
            filter={a("Abs") ? "url(#gF)" : undefined}/>
          <rect x="82" y={117 + row*20} width="10" height="7" rx="2"
            fill={mFill2("Abs")} opacity="0.5"/>
          {/* right block */}
          <rect x="102" y={116 + row*20} width="18" height="16" rx="4"
            fill={mFill("Abs")} stroke={C.muscleSep} strokeWidth="1.2"
            filter={a("Abs") ? "url(#gF)" : undefined}/>
          <rect x="104" y={117 + row*20} width="10" height="7" rx="2"
            fill={mFill2("Abs")} opacity="0.5"/>
          {a("Abs") && (
            <>
              <rect x="80" y={116 + row*20} width="18" height="16" rx="4"
                fill={C.activeHi} opacity="0">
                <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
              </rect>
              <rect x="102" y={116 + row*20} width="18" height="16" rx="4"
                fill={C.activeHi} opacity="0">
                <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
              </rect>
            </>
          )}
        </g>
      ))}

      {/* Linea alba (abs center) */}
      <line x1="100" y1="116" x2="100" y2="176" stroke={C.muscleSep} strokeWidth="1.5"/>

      {/* ── OBLIQUES ── */}
      <path d="M78 116 Q66 130 64 152 Q72 158 78 146 Q84 130 82 116 Z"
        fill={a("Abs") ? C.active : C.shadow} stroke={C.muscleSep} strokeWidth="1" opacity="0.9"/>
      <path d="M122 116 Q134 130 136 152 Q128 158 122 146 Q116 130 118 116 Z"
        fill={a("Abs") ? C.active : C.shadow} stroke={C.muscleSep} strokeWidth="1" opacity="0.9"/>

      {/* ── HIP / LOWER TORSO ── */}
      <path d="M64 158 Q100 170 136 158 L138 172 Q100 182 62 172 Z" fill={C.shadow}/>

      {/* ── FOREARMS (lower arm) ── */}
      <path d="M24 156 Q20 168 22 178 Q28 180 34 176 Q36 166 34 156 Z"
        fill={C.muscle} stroke={C.muscleSep} strokeWidth="1"/>
      <path d="M176 156 Q180 168 178 178 Q172 180 166 176 Q164 166 166 156 Z"
        fill={C.muscle} stroke={C.muscleSep} strokeWidth="1"/>

      {/* Outline */}
      <path d="M89 34 L111 34 L145 48 Q166 56 172 80 Q178 106 170 138
               Q164 158 140 166 L100 172 L60 166 Q36 158 30 138
               Q22 106 28 80 Q34 56 55 48 Z"
        fill="none" stroke={C.muscleSep} strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BACK VIEW
// ─────────────────────────────────────────────────────────────────────────────
function BackBody({ highlight }: { highlight: string }) {
  const a = (id: string) => id === highlight;
  const mFill  = (id: string) => a(id) ? C.active   : C.muscle;
  const mFill2 = (id: string) => a(id) ? C.activeHi : C.muscleHi;

  return (
    <svg viewBox="18 0 164 230" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <filter id="gB" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── HEAD (back) ── */}
      <ellipse cx="100" cy="19" rx="16" ry="18" fill={C.shadow}/>
      <ellipse cx="106"  cy="16" rx="8" ry="10" fill={C.skin} opacity="0.45"/>

      {/* ── NECK ── */}
      <path d="M91 34 L109 34 L111 48 L89 48 Z" fill={C.shadow}/>

      {/* ── TORSO BASE ── */}
      <path d="M55 48 Q38 56 30 80 Q26 104 32 136 Q38 154 60 164
               L80 170 L100 172 L120 170 L140 164
               Q162 154 168 136 Q174 104 170 80 Q162 56 145 48 Z"
        fill={C.body}/>

      {/* ── TRAPEZIUS ── */}
      <path d="M89 48 L111 48 L140 58 Q118 66 100 68 Q82 66 60 58 Z"
        fill={a("Back") || a("Shoulders") ? C.active : C.muscle}
        stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Back") || a("Shoulders") ? "url(#gB)" : undefined}/>
      <path d="M92 48 L108 48 L132 56 Q112 62 100 64 Q88 62 68 56 Z"
        fill={a("Back") || a("Shoulders") ? C.activeHi : C.muscleHi} opacity="0.45"/>
      {/* Trap diamond center */}
      <path d="M100 50 L116 56 L100 64 L84 56 Z"
        fill={a("Back") ? C.activeHi : C.muscleSep} opacity="0.5"/>

      {/* ── LEFT REAR DELT ── */}
      <path d="M60 58 Q40 60 30 76 Q26 92 36 106 Q48 100 54 88 L64 70 Z"
        fill={mFill("Shoulders")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Shoulders") ? "url(#gB)" : undefined}/>
      <path d="M62 60 Q44 62 36 76 Q32 88 40 100 L54 88 L64 72 Z"
        fill={mFill2("Shoulders")} opacity="0.45"/>
      {a("Shoulders") && (
        <path d="M60 58 Q40 60 30 76 Q26 92 36 106 Q48 100 54 88 L64 70 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT REAR DELT ── */}
      <path d="M140 58 Q160 60 170 76 Q174 92 164 106 Q152 100 146 88 L136 70 Z"
        fill={mFill("Shoulders")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Shoulders") ? "url(#gB)" : undefined}/>
      <path d="M138 60 Q156 62 164 76 Q168 88 160 100 L146 88 L136 72 Z"
        fill={mFill2("Shoulders")} opacity="0.45"/>
      {a("Shoulders") && (
        <path d="M140 58 Q160 60 170 76 Q174 92 164 106 Q152 100 146 88 L136 70 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── LEFT LAT ── */}
      <path d="M62 70 Q42 80 36 106 Q34 124 44 138 Q56 142 64 132 Q70 116 70 96 L68 76 Z"
        fill={mFill("Back")} stroke={C.muscleSep} strokeWidth="1.5"
        filter={a("Back") ? "url(#gB)" : undefined}/>
      <path d="M64 72 Q46 82 40 106 Q38 120 46 132 Q54 134 62 126 Q68 112 68 94 L66 78 Z"
        fill={mFill2("Back")} opacity="0.4"/>
      {a("Back") && (
        <path d="M62 70 Q42 80 36 106 Q34 124 44 138 Q56 142 64 132 Q70 116 70 96 L68 76 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT LAT ── */}
      <path d="M138 70 Q158 80 164 106 Q166 124 156 138 Q144 142 136 132 Q130 116 130 96 L132 76 Z"
        fill={mFill("Back")} stroke={C.muscleSep} strokeWidth="1.5"
        filter={a("Back") ? "url(#gB)" : undefined}/>
      <path d="M136 72 Q154 82 160 106 Q162 120 154 132 Q146 134 138 126 Q132 112 132 94 L134 78 Z"
        fill={mFill2("Back")} opacity="0.4"/>
      {a("Back") && (
        <path d="M138 70 Q158 80 164 106 Q166 124 156 138 Q144 142 136 132 Q130 116 130 96 L132 76 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RHOMBOIDS / MID BACK ── */}
      <path d="M70 68 L130 68 L132 104 Q100 112 68 104 Z"
        fill={a("Back") ? C.active : C.shadow} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Back") ? "url(#gB)" : undefined} opacity="0.9"/>
      <path d="M74 70 L126 70 L128 100 Q100 108 72 100 Z"
        fill={a("Back") ? C.activeHi : C.muscle} opacity="0.4"/>

      {/* ── SPINE LINE ── */}
      <line x1="100" y1="64" x2="100" y2="160" stroke={C.muscleSep} strokeWidth="2.5"/>
      {/* Vertebrae dots */}
      {[78, 92, 106, 120, 134, 148].map(y => (
        <circle key={y} cx="100" cy={y} r="2.5" fill={C.muscleSep}/>
      ))}

      {/* ── ERECTOR SPINAE strips ── */}
      <rect x="88" y="106" width="8" height="44" rx="4"
        fill={a("Back") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1"
        filter={a("Back") ? "url(#gB)" : undefined}/>
      <rect x="90" y="108" width="4" height="20" rx="2"
        fill={a("Back") ? C.activeHi : C.muscleHi} opacity="0.5"/>
      <rect x="104" y="106" width="8" height="44" rx="4"
        fill={a("Back") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1"
        filter={a("Back") ? "url(#gB)" : undefined}/>
      <rect x="106" y="108" width="4" height="20" rx="2"
        fill={a("Back") ? C.activeHi : C.muscleHi} opacity="0.5"/>

      {/* ── LEFT TRICEP (back view) ── */}
      <path d="M32 108 Q24 122 24 138 Q24 152 36 156 Q46 150 50 136 Q52 120 44 108 Z"
        fill={mFill("Triceps")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Triceps") ? "url(#gB)" : undefined}/>
      <path d="M34 110 Q28 124 28 138 Q28 148 36 152 Q44 146 48 132 Q50 116 42 110 Z"
        fill={mFill2("Triceps")} opacity="0.4"/>
      {a("Triceps") && (
        <path d="M32 108 Q24 122 24 138 Q24 152 36 156 Q46 150 50 136 Q52 120 44 108 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── RIGHT TRICEP (back view) ── */}
      <path d="M168 108 Q176 122 176 138 Q176 152 164 156 Q154 150 150 136 Q148 120 156 108 Z"
        fill={mFill("Triceps")} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Triceps") ? "url(#gB)" : undefined}/>
      <path d="M166 110 Q172 124 172 138 Q172 148 164 152 Q156 146 152 132 Q150 116 158 110 Z"
        fill={mFill2("Triceps")} opacity="0.4"/>
      {a("Triceps") && (
        <path d="M168 108 Q176 122 176 138 Q176 152 164 156 Q154 150 150 136 Q148 120 156 108 Z"
          fill={C.activeHi} opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── GLUTES ── */}
      <path d="M60 150 Q100 162 140 150 L142 170 Q120 180 100 182 Q80 180 58 170 Z"
        fill={a("Glutes") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Glutes") ? "url(#gB)" : undefined}/>
      <path d="M62 152 Q100 162 138 152 L139 166 Q118 174 100 176 Q82 174 61 166 Z"
        fill={a("Glutes") ? C.activeHi : C.muscleHi} opacity="0.4"/>

      {/* ── HAMSTRINGS ── */}
      <path d="M60 168 Q56 184 58 202 Q62 216 76 218 Q86 214 88 200 Q90 182 86 168 Q72 164 60 168 Z"
        fill={a("Hamstrings") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Hamstrings") ? "url(#gB)" : undefined}/>
      <path d="M114 168 Q110 182 114 200 Q116 214 128 218 Q140 214 144 200 Q146 184 142 168 Q128 164 114 168 Z"
        fill={a("Hamstrings") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Hamstrings") ? "url(#gB)" : undefined}/>
      {/* Hamstring inner highlight */}
      <path d="M64 170 Q60 184 62 200 Q66 210 74 212 Q82 208 84 196 Q86 180 82 170 Z"
        fill={a("Hamstrings") ? C.activeHi : C.muscleHi} opacity="0.4"/>
      <path d="M118 170 Q116 184 118 200 Q122 210 128 212 Q136 208 138 196 Q140 180 136 170 Z"
        fill={a("Hamstrings") ? C.activeHi : C.muscleHi} opacity="0.4"/>

      {/* ── CALVES ── */}
      <path d="M60 220 Q56 226 60 232 Q70 236 78 228 Q80 220 76 218 Z"
        fill={a("Calves") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Calves") ? "url(#gB)" : undefined}/>
      <path d="M122 220 Q120 226 122 232 Q130 236 140 228 Q142 220 138 218 Z"
        fill={a("Calves") ? C.active : C.muscle} stroke={C.muscleSep} strokeWidth="1.2"
        filter={a("Calves") ? "url(#gB)" : undefined}/>

      {/* ── FOREARMS ── */}
      <path d="M24 156 Q20 168 22 178 Q28 180 34 176 Q36 166 34 156 Z"
        fill={C.muscle} stroke={C.muscleSep} strokeWidth="1"/>
      <path d="M176 156 Q180 168 178 178 Q172 180 166 176 Q164 166 166 156 Z"
        fill={C.muscle} stroke={C.muscleSep} strokeWidth="1"/>

      {/* Outline */}
      <path d="M89 34 L111 34 L145 48 Q166 56 172 80 Q178 106 170 138
               Q164 158 140 166 L100 172 L60 166 Q36 158 30 138
               Q22 106 28 80 Q34 56 55 48 Z"
        fill="none" stroke={C.muscleSep} strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MuscleMap({
  muscleGroup,
  className,
  size = 100,
  showLabel = true,
}: MuscleMapProps) {
  const useBack  = USE_BACK[muscleGroup] ?? false;
  const labelClr = MUSCLE_LABEL_COLOR[muscleGroup] ?? MUSCLE_LABEL_COLOR.Other;

  // Card is square; body SVG is rendered slightly larger + clipped so it fills the card
  const cardSize = size;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        style={{
          width:  cardSize,
          height: cardSize,
          borderRadius: Math.round(cardSize * 0.2),
          background: C.bg,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
        }}
      >
        {/* Render body scaled up so torso fills card (crop legs) */}
        <div style={{
          position: "absolute",
          top: -(cardSize * 0.04),
          left: -(cardSize * 0.04),
          width:  cardSize * 1.08,
          height: cardSize * 1.75,
        }}>
          {useBack
            ? <BackBody  highlight={muscleGroup} />
            : <FrontBody highlight={muscleGroup} />
          }
        </div>
      </div>

      {showLabel && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: labelClr + "22", color: labelClr, flexShrink: 0 }}
        >
          {muscleGroup}
        </span>
      )}
    </div>
  );
}
