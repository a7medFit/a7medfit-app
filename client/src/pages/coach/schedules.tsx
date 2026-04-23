import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Dumbbell, Trash2, Upload, Play, ChevronDown, ChevronUp, Edit3, Users } from "lucide-react";
import { format } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CoachSchedules() {
  const { toast } = useToast();
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);
  const [newExerciseScheduleId, setNewExerciseScheduleId] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState<number | null>(null);

  const { data: schedules = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/schedules"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", weekStart: format(new Date(), "yyyy-MM-dd"), status: "active" });

  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({ title: "", description: "", dayOfWeek: "0", sets: "", reps: "", durationSeconds: "", notes: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createScheduleMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/schedules", scheduleForm);
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setNewScheduleOpen(false);
      setScheduleForm({ title: "", description: "", weekStart: format(new Date(), "yyyy-MM-dd"), status: "active" });
      toast({ title: "Schedule created" });
    },
    onError: () => toast({ title: "Error", description: "Failed to create schedule", variant: "destructive" }),
  });

  const deleteScheduleMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/schedules/${id}`);
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Schedule deleted" });
    },
  });

  const createExerciseMut = useMutation({
    mutationFn: async (scheduleId: number) => {
      const fd = new FormData();
      Object.entries(exerciseForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (videoFile) fd.append("video", videoFile);
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/exercises`, fd);
      if (!res.ok) throw new Error("Failed to create exercise");
      return res.json();
    },
    onSuccess: (_data, scheduleId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
      setNewExerciseScheduleId(null);
      setExerciseForm({ title: "", description: "", dayOfWeek: "0", sets: "", reps: "", durationSeconds: "", notes: "" });
      setVideoFile(null);
      toast({ title: "Exercise added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" }),
  });

  const deleteExerciseMut = useMutation({
    mutationFn: async ({ exerciseId, scheduleId }: { exerciseId: number; scheduleId: number }) => {
      const res = await apiRequest("DELETE", `/api/exercises/${exerciseId}`);
      if (!res.ok) throw new Error("Failed to delete");
      return { scheduleId };
    },
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
      toast({ title: "Exercise removed" });
    },
  });

  const assignMut = useMutation({
    mutationFn: async ({ scheduleId, clientId }: { scheduleId: number; clientId: number }) => {
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/clients`, { clientId });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to assign");
      }
      return res.json();
    },
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/clients`] });
      toast({ title: "Client assigned" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unassignMut = useMutation({
    mutationFn: async ({ scheduleId, clientId }: { scheduleId: number; clientId: number }) => {
      const res = await apiRequest("DELETE", `/api/schedules/${scheduleId}/clients/${clientId}`);
      if (!res.ok) throw new Error("Failed to unassign");
      return { scheduleId };
    },
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/clients`] });
      toast({ title: "Client removed" });
    },
  });

  return (
    <Layout role="coach">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Schedules</h1>
            <p className="text-muted-foreground text-sm mt-1">Create and manage workout programs</p>
          </div>
          <Dialog open={newScheduleOpen} onOpenChange={setNewScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-new-schedule">
                <Plus className="w-4 h-4" /> New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="Week 1 — Strength Foundation" value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })} data-testid="input-schedule-title" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Textarea placeholder="Brief notes about this program..." value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Week Start Date</Label>
                  <Input type="date" value={scheduleForm.weekStart} onChange={(e) => setScheduleForm({ ...scheduleForm, weekStart: e.target.value })} data-testid="input-schedule-week-start" />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={scheduleForm.status} onValueChange={(v) => setScheduleForm({ ...scheduleForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => createScheduleMut.mutate()} disabled={!scheduleForm.title || createScheduleMut.isPending} data-testid="button-save-schedule">
                  {createScheduleMut.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold mb-1">No schedules yet</h3>
              <p className="text-muted-foreground text-sm">Create your first workout schedule to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule: any) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                expanded={expandedSchedule === schedule.id}
                onToggle={() => setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id)}
                onDelete={() => deleteScheduleMut.mutate(schedule.id)}
                onAddExercise={() => setNewExerciseScheduleId(schedule.id)}
                onAssign={() => setAssignOpen(schedule.id)}
                deleteExercise={(exId) => deleteExerciseMut.mutate({ exerciseId: exId, scheduleId: schedule.id })}
              />
            ))}
          </div>
        )}

        {/* Add exercise dialog */}
        <Dialog open={newExerciseScheduleId !== null} onOpenChange={(o) => !o && setNewExerciseScheduleId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>Exercise Name *</Label>
                <Input placeholder="e.g. Barbell Squat" value={exerciseForm.title} onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })} data-testid="input-exercise-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Day of Week</Label>
                <Select value={exerciseForm.dayOfWeek} onValueChange={(v) => setExerciseForm({ ...exerciseForm, dayOfWeek: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Sets</Label>
                  <Input type="number" placeholder="3" value={exerciseForm.sets} onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })} data-testid="input-exercise-sets" />
                </div>
                <div className="space-y-1.5">
                  <Label>Reps</Label>
                  <Input type="number" placeholder="10" value={exerciseForm.reps} onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })} data-testid="input-exercise-reps" />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (s)</Label>
                  <Input type="number" placeholder="60" value={exerciseForm.durationSeconds} onChange={(e) => setExerciseForm({ ...exerciseForm, durationSeconds: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="How to perform this exercise..." value={exerciseForm.description} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="e.g. Focus on form, rest 90s between sets" value={exerciseForm.notes} onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Exercise Video (optional)</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  data-testid="video-upload-zone"
                >
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Play className="w-5 h-5" />
                      <span className="text-sm font-medium truncate max-w-xs">{videoFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Click to upload video</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, WebM · Up to 500MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </div>
              <Button
                className="w-full"
                onClick={() => newExerciseScheduleId && createExerciseMut.mutate(newExerciseScheduleId)}
                disabled={!exerciseForm.title || createExerciseMut.isPending}
                data-testid="button-save-exercise"
              >
                {createExerciseMut.isPending ? "Adding..." : "Add Exercise"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign clients dialog */}
        <Dialog open={assignOpen !== null} onOpenChange={(o) => !o && setAssignOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Clients</DialogTitle>
            </DialogHeader>
            {assignOpen !== null && <AssignClientsPanel scheduleId={assignOpen} clients={clients} onAssign={(cid) => assignMut.mutate({ scheduleId: assignOpen, clientId: cid })} onUnassign={(cid) => unassignMut.mutate({ scheduleId: assignOpen, clientId: cid })} />}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function ScheduleCard({ schedule, expanded, onToggle, onDelete, onAddExercise, onAssign, deleteExercise }: any) {
  const { data: exercises = [] } = useQuery<any[]>({
    queryKey: [`/api/schedules/${schedule.id}/exercises`],
    enabled: expanded,
  });
  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: [`/api/schedules/${schedule.id}/clients`],
    enabled: expanded,
  });

  const byDay = DAYS.map((day, i) => ({ day, exercises: exercises.filter((e: any) => e.dayOfWeek === i) })).filter((d) => d.exercises.length > 0);

  return (
    <Card data-testid={`schedule-card-${schedule.id}`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{schedule.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Week of {schedule.weekStart} · {exercises.length} exercises</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={schedule.status === "active" ? "default" : "secondary"} className="text-xs">{schedule.status}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {schedule.description && <p className="text-sm text-muted-foreground">{schedule.description}</p>}

          {/* Assigned clients */}
          {assignments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignments.map((a: any) => (
                <Badge key={a.id} variant="outline" className="gap-1 text-xs" data-testid={`assigned-client-${a.clientId}`}>
                  <Users className="w-3 h-3" />{a.user?.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Exercises by day */}
          {byDay.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No exercises yet. Add your first exercise.</p>
            </div>
          ) : (
            byDay.map(({ day, exercises: dayExs }) => (
              <div key={day}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{day}</h4>
                <div className="space-y-2">
                  {dayExs.map((ex: any) => (
                    <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 group" data-testid={`exercise-row-${ex.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {ex.videoUrl && <Play className="w-4 h-4 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{ex.title}</span>
                          {(ex.sets || ex.reps) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:text-destructive transition-all"
                        data-testid={`button-delete-exercise-${ex.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={onAddExercise} className="gap-1.5" data-testid={`button-add-exercise-${schedule.id}`}>
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </Button>
            <Button size="sm" variant="outline" onClick={onAssign} className="gap-1.5" data-testid={`button-assign-clients-${schedule.id}`}>
              <Users className="w-3.5 h-3.5" /> Assign Clients
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive ml-auto" onClick={onDelete} data-testid={`button-delete-schedule-${schedule.id}`}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AssignClientsPanel({ scheduleId, clients, onAssign, onUnassign }: any) {
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: [`/api/schedules/${scheduleId}/clients`] });
  const assignedIds = assignments.map((a: any) => a.clientId);

  return (
    <div className="space-y-3 pt-2">
      {clients.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">No clients registered yet.</p>
      ) : (
        clients.map((client: any) => {
          const isAssigned = assignedIds.includes(client.id);
          return (
            <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`assign-client-${client.id}`}>
              <div>
                <div className="font-medium text-sm">{client.name}</div>
                <div className="text-xs text-muted-foreground">{client.email}</div>
              </div>
              <Button
                size="sm"
                variant={isAssigned ? "destructive" : "default"}
                onClick={() => isAssigned ? onUnassign(client.id) : onAssign(client.id)}
              >
                {isAssigned ? "Remove" : "Assign"}
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}
