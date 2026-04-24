import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Play, ChevronLeft, Weight, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface SetRow { reps: string; weight: string; }

export default function ClientSchedule() {
  const [, params] = useRoute("/schedule/:id");
  const scheduleId = Number(params?.id);
  const { toast } = useToast();
  const [logExercise, setLogExercise] = useState<any | null>(null);
  const [sets, setSets] = useState<SetRow[]>([{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }]);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("");
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [videoEx, setVideoEx] = useState<any | null>(null);

  const { data: schedule } = useQuery<any>({ queryKey: [`/api/schedules/${scheduleId}`] });
  const { data: exercises = [] } = useQuery<any[]>({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });

  const openLog = (ex: any) => {
    // Pre-fill with coach's prescribed reps
    setSets([
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
    ]);
    setNotes("");
    setRating("");
    setLogExercise(ex);
  };

  const updateSet = (i: number, field: "reps" | "weight", val: string) => {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const logMut = useMutation({
    mutationFn: async (ex: any) => {
      const filledSets = sets.filter((s) => s.reps || s.weight);
      const totalReps = filledSets.reduce((acc, s) => acc + (parseInt(s.reps) || 0), 0);
      const avgWeight = filledSets.length > 0
        ? filledSets.reduce((acc, s) => acc + (parseFloat(s.weight) || 0), 0) / filledSets.length
        : 0;
      const body = {
        exerciseId: ex.id,
        scheduleId,
        actualSets: filledSets.length || undefined,
        actualReps: totalReps || undefined,
        actualWeight: avgWeight || undefined,
        setsData: JSON.stringify(sets),
        notes: notes || undefined,
        rating: rating ? parseInt(rating) : undefined,
      };
      const res = await apiRequest("POST", "/api/completions", body);
      if (!res.ok) throw new Error("Failed to log completion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      setLogExercise(null);
      toast({ title: "Exercise logged!", description: "Great work, keep it up!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to log exercise", variant: "destructive" }),
  });

  const isDone = (exId: number) => completions.some((c: any) => c.exerciseId === exId);
  const getCompletion = (exId: number) => completions.find((c: any) => c.exerciseId === exId);
  const getLastSets = (exId: number): SetRow[] | null => {
    const c = getCompletion(exId);
    if (!c?.setsData) return null;
    try { return JSON.parse(c.setsData); } catch { return null; }
  };

  const dayExercises = exercises.filter((e: any) => e.dayOfWeek === activeDay);
  const daysWithExercises = DAYS.map((d, i) => ({ day: d, index: i, count: exercises.filter((e: any) => e.dayOfWeek === i).length })).filter((d) => d.count > 0);

  const totalEx = exercises.length;
  const doneEx = completions.filter((c: any) => c.scheduleId === scheduleId).length;
  const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;

  if (!schedule) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="skeleton w-48 h-6 rounded mb-2 mx-auto" />
            <div className="skeleton w-32 h-4 rounded mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 mb-3 -ml-2 text-muted-foreground" data-testid="button-back">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{schedule.title}</h1>
              {schedule.description && <p className="text-muted-foreground text-sm mt-1">{schedule.description}</p>}
            </div>
            <Badge variant={pct >= 100 ? "default" : "secondary"} className="shrink-0">{pct}% done</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} data-testid="progress-bar" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{doneEx}/{totalEx} exercises</span>
          </div>
        </div>

        {/* Day tabs */}
        {daysWithExercises.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {daysWithExercises.map(({ day, index, count }) => (
              <button
                key={index}
                onClick={() => setActiveDay(index)}
                data-testid={`day-tab-${index}`}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeDay === index ? "bg-primary text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {day.slice(0, 3)} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <div className="space-y-3">
          {dayExercises.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No exercises for {DAYS[activeDay]}. Pick another day.</p>
              </CardContent>
            </Card>
          ) : (
            dayExercises.map((ex: any) => {
              const done = isDone(ex.id);
              const myCompletion = getCompletion(ex.id);
              const lastSets = getLastSets(ex.id);
              return (
                <Card key={ex.id} data-testid={`exercise-card-${ex.id}`} className={cn(done && "border-green-500/40 bg-green-50/30 dark:bg-green-950/10")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {done ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={cn("font-semibold text-sm", done && "text-muted-foreground")}>{ex.title}</h3>
                            {(ex.sets || ex.reps || ex.durationSeconds) && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {ex.sets && <span>{ex.sets} sets</span>}
                                {ex.reps && <span>× {ex.reps} reps</span>}
                                {ex.durationSeconds && <span>{ex.durationSeconds}s</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ex.videoUrl && (
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setVideoEx(ex)} data-testid={`button-watch-video-${ex.id}`}>
                                <Play className="w-3 h-3" /> Watch
                              </Button>
                            )}
                            {!done && (
                              <Button size="sm" className="h-7 text-xs" onClick={() => openLog(ex)} data-testid={`button-log-exercise-${ex.id}`}>
                                Log
                              </Button>
                            )}
                          </div>
                        </div>

                        {ex.description && <p className="text-xs text-muted-foreground mt-2">{ex.description}</p>}
                        {ex.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic">{ex.notes}</p>}

                        {/* Logged sets breakdown */}
                        {done && lastSets && (
                          <div className="mt-3 space-y-1.5">
                            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                              <span>Set</span><span>Reps</span><span>Weight</span>
                            </div>
                            {lastSets.map((s, i) => (s.reps || s.weight) && (
                              <div key={i} className="grid grid-cols-3 gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                                <span className="font-medium text-muted-foreground">#{i + 1}</span>
                                <span>{s.reps || "—"} reps</span>
                                <span>{s.weight ? `${s.weight} kg` : "—"}</span>
                              </div>
                            ))}
                            {myCompletion?.rating && (
                              <div className="text-xs text-muted-foreground mt-1">{"⭐".repeat(myCompletion.rating)} difficulty</div>
                            )}
                            {myCompletion?.notes && (
                              <p className="text-xs text-muted-foreground italic">"{myCompletion.notes}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Log exercise dialog */}
      <Dialog open={!!logExercise} onOpenChange={(o) => !o && setLogExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log: {logExercise?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            {/* Sets table */}
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground px-1">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight (kg)</span>
              </div>

              {/* 3 rows */}
              {sets.map((s, i) => {
                const last = logExercise ? getLastSets(logExercise.id) : null;
                const lastRow = last?.[i];
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                      <span className="text-sm font-bold text-primary">#{i + 1}</span>
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={s.reps}
                        onChange={(e) => updateSet(i, "reps", e.target.value)}
                        className="h-10"
                        data-testid={`input-set-${i}-reps`}
                      />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={s.weight}
                        onChange={(e) => updateSet(i, "weight", e.target.value)}
                        className="h-10"
                        data-testid={`input-set-${i}-weight`}
                      />
                    </div>
                    {/* Last session hint */}
                    {lastRow && (lastRow.reps || lastRow.weight) && (
                      <div className="grid grid-cols-[40px_1fr_1fr] gap-2 px-0.5">
                        <span />
                        <span className="text-[11px] text-muted-foreground/60">Last: {lastRow.reps || "—"} reps</span>
                        <span className="text-[11px] text-muted-foreground/60">Last: {lastRow.weight ? `${lastRow.weight}kg` : "—"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <Label>How hard was it? (1–5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(String(r))}
                    className={cn(
                      "w-9 h-9 rounded-lg border text-sm font-medium transition-colors",
                      rating === String(r) ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
                    )}
                    data-testid={`rating-${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="How did it feel? Any adjustments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                data-testid="input-completion-notes"
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => logMut.mutate(logExercise)}
              disabled={logMut.isPending}
              data-testid="button-confirm-log"
            >
              <CheckCircle2 className="w-4 h-4" />
              {logMut.isPending ? "Saving..." : "Mark as Done"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video dialog */}
      <Dialog open={!!videoEx} onOpenChange={(o) => !o && setVideoEx(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{videoEx?.title}</DialogTitle>
          </DialogHeader>
          {videoEx?.videoUrl && (
            <video
              src={videoEx.videoUrl.replace("__PORT_5000__", "")}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: "60vh" }}
              data-testid="exercise-video-player"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
