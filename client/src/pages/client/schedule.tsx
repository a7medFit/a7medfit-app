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
import { CheckCircle2, Circle, Play, ChevronLeft, Weight, Dumbbell, Pencil, Timer, Flame, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import MuscleMap, { inferMuscleGroup } from "@/components/MuscleMap";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string) {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      // https://youtu.be/VIDEO_ID
      videoId = u.pathname.slice(1);
    } else if (u.pathname.startsWith("/shorts/")) {
      // https://youtube.com/shorts/VIDEO_ID
      videoId = u.pathname.replace("/shorts/", "");
    } else {
      // https://youtube.com/watch?v=VIDEO_ID
      videoId = u.searchParams.get("v") || "";
    }
  } catch {}
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

interface SetRow { reps: string; weight: string; }

export default function ClientSchedule() {
  const [, params] = useRoute("/schedule/:id");
  const scheduleId = Number(params?.id);
  const { toast } = useToast();
  const [logExercise, setLogExercise] = useState<any | null>(null);
  const [editingCompletionId, setEditingCompletionId] = useState<number | null>(null);
  const [sets, setSets] = useState<SetRow[]>([{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }]);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("");
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [videoEx, setVideoEx] = useState<any | null>(null);
  const [lastSessionData, setLastSessionData] = useState<SetRow[] | null>(null);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [cardioType, setCardioType] = useState("");
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioCalories, setCardioCalories] = useState("");
  const [cardioNotes, setCardioNotes] = useState("");

  const { data: schedule } = useQuery<any>({ queryKey: [`/api/schedules/${scheduleId}`] });
  const { data: exercises = [] } = useQuery<any[]>({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });
  const { data: cardioSessions = [] } = useQuery<any[]>({ queryKey: ["/api/cardio"] });

  const openLog = async (ex: any) => {
    // Pre-fill with coach's prescribed reps
    setSets([
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
      { reps: ex.reps ? String(ex.reps) : "", weight: "" },
    ]);
    setNotes("");
    setRating("");
    setEditingCompletionId(null);
    setLastSessionData(null);
    setLogExercise(ex);
    // Fetch last session by exercise title (cross-schedule)
    try {
      const res = await apiRequest("GET", `/api/completions/last-by-title?title=${encodeURIComponent(ex.title)}`);
      const data = await res.json();
      if (data?.sets_data) {
        try { setLastSessionData(JSON.parse(data.sets_data)); } catch {}
      }
    } catch {}
  };

  const openEdit = (ex: any) => {
    const c = getCompletion(ex.id);
    if (!c) return;
    const prevSets = getLastSets(ex.id);
    setSets(
      prevSets && prevSets.length === 3
        ? prevSets
        : [{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }]
    );
    setNotes(c.notes || "");
    setRating(c.rating ? String(c.rating) : "");
    setEditingCompletionId(c.id);
    setLogExercise(ex);
  };

  const updateSet = (i: number, field: "reps" | "weight", val: string) => {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const logMut = useMutation({
    mutationFn: async (ex: any) => {
      const isEditing = editingCompletionId !== null;
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
      if (isEditing) {
        // PATCH existing completion
        const res = await apiRequest("PATCH", `/api/completions/${editingCompletionId}`, body);
        if (!res.ok) throw new Error("Failed to update completion");
        return { data: await res.json(), isEditing };
      } else {
        // POST new completion
        const res = await apiRequest("POST", "/api/completions", body);
        if (!res.ok) throw new Error("Failed to log completion");
        return { data: await res.json(), isEditing };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      setLogExercise(null);
      setEditingCompletionId(null);
      toast({
        title: result.isEditing ? "Entry updated!" : "Exercise logged!",
        description: result.isEditing ? "Your workout entry has been updated." : "Great work, keep it up!",
      });
    },
    onError: () => toast({ title: "Error", description: "Failed to save exercise entry", variant: "destructive" }),
  });

  const cardioMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cardio", {
        cardioType,
        durationMinutes: cardioDuration ? parseInt(cardioDuration) : undefined,
        distanceKm: cardioDistance ? parseFloat(cardioDistance) : undefined,
        caloriesBurned: cardioCalories ? parseInt(cardioCalories) : undefined,
        notes: cardioNotes || undefined,
        scheduleId,
        dayOfWeek: activeDay,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cardio"] });
      setCardioOpen(false);
      setCardioType(""); setCardioDuration(""); setCardioDistance(""); setCardioCalories(""); setCardioNotes("");
      toast({ title: "Cardio logged!", description: "Nice work!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to log cardio", variant: "destructive" }),
  });

  const deleteCardioMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cardio/${id}`).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cardio"] }),
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
            {daysWithExercises.map(({ day, index, count }) => {
              const dayExs = exercises.filter((e: any) => e.dayOfWeek === index);
              const dayDone = dayExs.filter((e: any) => completions.some((c: any) => c.exerciseId === e.id)).length;
              const dayPct = count > 0 ? Math.round((dayDone / count) * 100) : 0;
              const isToday = index === new Date().getDay();
              return (
                <button
                  key={index}
                  onClick={() => setActiveDay(index)}
                  data-testid={`day-tab-${index}`}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[64px]",
                    activeDay === index ? "bg-primary text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <span>{day.slice(0, 3)}{isToday ? " •" : ""}</span>
                  <span className={cn("text-xs font-bold mt-0.5", activeDay === index ? "text-white" : dayPct === 100 ? "text-green-500" : "text-primary")}>
                    {dayPct}%
                  </span>
                </button>
              );
            })}
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
                            {done ? (
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openEdit(ex)} data-testid={`button-edit-completion-${ex.id}`}>
                                <Pencil className="w-3 h-3" /> Edit
                              </Button>
                            ) : (
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

        {/* Cardio section for this day */}
        {(() => {
          const dayCardio = cardioSessions.filter((c: any) => c.dayOfWeek === activeDay && c.scheduleId === scheduleId);
          return (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Bike className="w-4 h-4" /> Cardio
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setCardioOpen(true)}>
                  + Log Cardio
                </Button>
              </div>
              {dayCardio.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-1">No cardio logged for {DAYS[activeDay]}.</p>
              ) : (
                dayCardio.map((c: any) => (
                  <Card key={c.id} className="border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-semibold text-sm">{c.cardioType}</span>
                        </div>
                        <button onClick={() => deleteCardioMut.mutate(c.id)} className="text-muted-foreground/40 hover:text-destructive text-xs">✕</button>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        {c.durationMinutes && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{c.durationMinutes} min</span>}
                        {c.distanceKm && <span>📍 {c.distanceKm} km</span>}
                        {c.caloriesBurned && <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{c.caloriesBurned} kcal</span>}
                        {c.notes && <span className="italic">{c.notes}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          );
        })()}
      </div>

      {/* Log exercise dialog */}
      <Dialog open={!!logExercise} onOpenChange={(o) => !o && setLogExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompletionId !== null ? "Edit Entry" : "Log"}: {logExercise?.title}</DialogTitle>
          </DialogHeader>
          {logExercise && (() => {
            const mg = inferMuscleGroup(logExercise.title);
            return (
              <div className="flex items-center gap-3 px-1 pb-1">
                <MuscleMap muscleGroup={mg} size={80} />
              </div>
            );
          })()}
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
                // Prefer cross-schedule last session; fall back to same-schedule completion
                const last = lastSessionData ?? (logExercise ? getLastSets(logExercise.id) : null);
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
              {logMut.isPending ? "Saving..." : editingCompletionId !== null ? "Save Changes" : "Mark as Done"}
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
          {videoEx?.videoUrl && (() => {
            const isShorts = videoEx.videoUrl.includes("/shorts/");
            return isYouTube(videoEx.videoUrl) ? (
              <div className={`w-full rounded-lg overflow-hidden bg-black flex justify-center ${isShorts ? "" : "aspect-video"}`}>
                <iframe
                  src={getYouTubeEmbedUrl(videoEx.videoUrl)}
                  className={isShorts ? "w-full" : "w-full h-full"}
                  style={isShorts ? { aspectRatio: "9/16", maxHeight: "70vh" } : undefined}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="exercise-youtube-player"
                />
              </div>
            ) : (
              <video
                src={videoEx.videoUrl.replace("__PORT_5000__", "")}
                controls
                muted
                className="w-full rounded-lg"
                style={{ maxHeight: "60vh" }}
                data-testid="exercise-video-player"
              />
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* Cardio log dialog */}
      <Dialog open={cardioOpen} onOpenChange={(o) => { if (!o) { setCardioOpen(false); setCardioType(""); setCardioDuration(""); setCardioDistance(""); setCardioCalories(""); setCardioNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bike className="w-4 h-4" /> Log Cardio — {DAYS[activeDay]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Cardio type */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Treadmill", "Cycling", "Elliptical", "Rowing", "Stairmaster", "Other"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCardioType(t)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-medium border transition-colors",
                      cardioType === t ? "bg-primary text-white border-primary" : "bg-muted border-transparent hover:bg-muted/80"
                    )}
                  >{t}</button>
                ))}
              </div>
              {/* Custom type */}
              <Input
                className="mt-2 h-8 text-sm"
                placeholder="Or type a custom activity…"
                value={["Treadmill","Cycling","Elliptical","Rowing","Stairmaster","Other"].includes(cardioType) ? "" : cardioType}
                onChange={(e) => setCardioType(e.target.value)}
              />
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                <Input className="h-8 text-sm mt-1" type="number" placeholder="30" value={cardioDuration} onChange={(e) => setCardioDuration(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Distance (km)</Label>
                <Input className="h-8 text-sm mt-1" type="number" placeholder="5.0" step="0.1" value={cardioDistance} onChange={(e) => setCardioDistance(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Calories</Label>
                <Input className="h-8 text-sm mt-1" type="number" placeholder="250" value={cardioCalories} onChange={(e) => setCardioCalories(e.target.value)} />
              </div>
            </div>
            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Textarea className="mt-1 text-sm" rows={2} placeholder="e.g. felt great, moderate pace…" value={cardioNotes} onChange={(e) => setCardioNotes(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={!cardioType || cardioMut.isPending}
              onClick={() => cardioMut.mutate()}
            >
              {cardioMut.isPending ? "Saving…" : "Save Cardio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
