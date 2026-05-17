import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, CheckCircle2, Dumbbell, ChevronDown, ChevronUp, Bike, Timer, Flame } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ClientCardio({ clientId }: { clientId: number }) {
  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", clientId, "cardio"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${clientId}/cardio`);
      return res.json();
    },
  });

  if (sessions.length === 0) return (
    <div className="text-xs text-muted-foreground italic px-1">No cardio logged yet.</div>
  );

  // KPI totals
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((s: number, c: any) => s + (c.durationMinutes || 0), 0);
  const totalKm = sessions.reduce((s: number, c: any) => s + (Number(c.distanceKm) || 0), 0);
  const totalCal = sessions.reduce((s: number, c: any) => s + (c.caloriesBurned || 0), 0);
  const weeklyGoalMin = 150;
  const cardioProgress = Math.min(100, Math.round((totalMinutes / weeklyGoalMin) * 100));

  // Group by day
  const byDay: Record<number, any[]> = {};
  sessions.forEach((s: any) => {
    const d = s.dayOfWeek ?? -1;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(s);
  });

  return (
    <div className="space-y-3">
      {/* Cardio KPI summary */}
      <div className="rounded-lg border border-blue-400/30 bg-blue-50/10 dark:bg-blue-950/10 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Cardio KPIs</span>
          <span className="text-xs text-muted-foreground">{cardioProgress}% of 150 min goal</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${cardioProgress}%`, background: cardioProgress >= 100 ? "#22c55e" : "#3b82f6" }}
          />
        </div>
        <div className="grid grid-cols-4 gap-1 pt-0.5">
          <div className="text-center">
            <div className="text-sm font-bold text-blue-500">{totalSessions}</div>
            <div className="text-[10px] text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-blue-500">{totalMinutes}</div>
            <div className="text-[10px] text-muted-foreground">Min</div>
          </div>
          {totalKm > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-blue-500">{totalKm.toFixed(1)}</div>
              <div className="text-[10px] text-muted-foreground">km</div>
            </div>
          )}
          {totalCal > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-orange-500">{totalCal}</div>
              <div className="text-[10px] text-muted-foreground">kcal</div>
            </div>
          )}
        </div>
      </div>

      {/* Sessions by day */}
      {Object.entries(byDay).map(([day, daySessions]) => (
        <div key={day}>
          {Number(day) >= 0 && <div className="text-xs font-semibold text-muted-foreground mb-1">{DAYS[Number(day)]}</div>}
          {(daySessions as any[]).map((s: any) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 text-xs bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/30 rounded-lg px-3 py-2 mb-1">
              <Bike className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-medium">{s.cardioType}</span>
              {s.durationMinutes && <span className="flex items-center gap-1 text-muted-foreground"><Timer className="w-3 h-3" />{s.durationMinutes} min</span>}
              {s.distanceKm && <span className="text-muted-foreground">{s.distanceKm} km</span>}
              {s.caloriesBurned && <span className="flex items-center gap-1 text-muted-foreground"><Flame className="w-3 h-3 text-orange-400" />{s.caloriesBurned} kcal</span>}
              {s.notes && <span className="text-muted-foreground italic">{s.notes}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Each client card is its own component so hooks are called at component level
function ClientProgressCard({ p, expanded, onToggle }: { p: any; expanded: boolean; onToggle: () => void }) {
  const totalEx = p.scheduleProgress.reduce((a: number, sp: any) => a + sp.totalExercises, 0);
  const doneEx = p.scheduleProgress.reduce((a: number, sp: any) => a + sp.completedExercises, 0);
  const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;

  // Fetch cardio to show bar even when card is collapsed
  const { data: cardioSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", p.client.id, "cardio"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${p.client.id}/cardio`);
      return res.json();
    },
  });
  const cardioMinutes = (cardioSessions as any[]).reduce((s: number, c: any) => s + (c.durationMinutes || 0), 0);
  const cardioPct = Math.min(100, Math.round((cardioMinutes / 150) * 100));

  return (
    <Card data-testid={`progress-card-${p.client.id}`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {p.client.avatarInitials || p.client.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{p.client.name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.client.email}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs gap-1 whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {doneEx}/{totalEx}
                </Badge>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
            <div className="space-y-2">
              {/* Exercise progress bar (orange) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Exercises</span>
                  <span className="text-[11px] font-medium">{doneEx}/{totalEx} · {pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              {/* Cardio progress bar (blue) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Cardio</span>
                  <span className="text-[11px] font-medium text-blue-500">{cardioMinutes}m · {cardioPct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${cardioPct}%`, background: cardioPct >= 100 ? "#22c55e" : "#3b82f6" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Schedule progress */}
          {p.scheduleProgress.map((sp: any) => (
            <div key={sp.schedule.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{sp.schedule.title}</span>
                </div>
                <Badge variant={sp.percent >= 100 ? "default" : "secondary"} className="text-xs">
                  {sp.percent}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={sp.percent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {sp.completedExercises}/{sp.totalExercises} exercises
                </span>
              </div>

              {/* Day-by-day breakdown */}
              {sp.dayBreakdown && sp.dayBreakdown.length > 0 && (
                <div className="space-y-1 mt-2">
                  {sp.dayBreakdown.map((day: any) => (
                    <div key={day.dayIndex} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">{DAYS[day.dayIndex]}</span>
                        <span className="text-xs text-muted-foreground">{day.done}/{day.total}</span>
                      </div>
                      {/* Exercises for this day */}
                      {day.exercises.map((ex: any) => (
                        <div key={ex.id} className="ml-2 p-2 rounded bg-background border space-y-1.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${ex.completed ? "text-green-500" : "text-muted-foreground/30"}`} />
                            <span className="text-xs font-medium">{ex.title}</span>
                            {ex.sets && <span className="text-xs text-muted-foreground ml-auto">{ex.sets}×{ex.reps} target</span>}
                          </div>

                          {/* Sets breakdown */}
                          {ex.setsData && ex.setsData.length > 0 && (
                            <div className="ml-5 space-y-1">
                              <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-muted-foreground/70">
                                <span>Set</span><span>Reps</span><span>Weight</span>
                              </div>
                              {ex.setsData.map((s: any, i: number) => (s.reps || s.weight) && (
                                <div key={i} className="grid grid-cols-3 gap-2 text-[11px] bg-muted/40 rounded px-1.5 py-0.5">
                                  <span className="font-medium text-muted-foreground">#{i + 1}</span>
                                  <span>{s.reps || "—"} reps</span>
                                  <span>{s.weight ? `${s.weight} kg` : "—"}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rating & notes */}
                          {(ex.rating || ex.notes) && (
                            <div className="ml-5 flex gap-3 text-[11px] text-muted-foreground">
                              {ex.rating && <span>{"⭐".repeat(ex.rating)} difficulty</span>}
                              {ex.notes && <span className="italic">"{ex.notes}"</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Cardio sessions */}
          <div className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/10 border border-blue-200/20 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Bike className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Cardio Sessions</span>
            </div>
            <ClientCardio clientId={p.client.id} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function CoachProgress() {
  const { data: progress = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/coach/progress"] });
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Layout role="coach">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Client Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">Track completion rates and exercise logs</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-lg" />)}</div>
        ) : progress.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold mb-1">No progress data yet</h3>
              <p className="text-muted-foreground text-sm">Assign schedules to clients to start tracking their progress.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...progress].sort((a: any, b: any) => {
              const pctA = (() => { const t = a.scheduleProgress.reduce((x: number, s: any) => x + s.totalExercises, 0); const d = a.scheduleProgress.reduce((x: number, s: any) => x + s.completedExercises, 0); return t > 0 ? Math.round((d / t) * 100) : 0; })();
              const pctB = (() => { const t = b.scheduleProgress.reduce((x: number, s: any) => x + s.totalExercises, 0); const d = b.scheduleProgress.reduce((x: number, s: any) => x + s.completedExercises, 0); return t > 0 ? Math.round((d / t) * 100) : 0; })();
              return pctB - pctA;
            }).map((p: any) => (
              <ClientProgressCard
                key={p.client.id}
                p={p}
                expanded={expanded === p.client.id}
                onToggle={() => setExpanded(expanded === p.client.id ? null : p.client.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
