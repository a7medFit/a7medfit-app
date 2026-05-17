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
import { Plus, Dumbbell, Trash2, Upload, Play, ChevronDown, ChevronUp, Edit3, Users, Link2, Youtube, BookOpen, Search, GripVertical, Unlink, Library } from "lucide-react";
import { format } from "date-fns";
import { inferMuscleGroup } from "@/components/MuscleMap";

// Tiny muscle badge shown on each exercise row
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#f97316", Back: "#3b82f6", Shoulders: "#a855f7", Biceps: "#ec4899",
  Triceps: "#14b8a6", Abs: "#f59e0b", Quadriceps: "#22c55e", Hamstrings: "#84cc16",
  Calves: "#06b6d4", Glutes: "#f43f5e", Other: "#94a3b8",
};
function MuscleMapBadge({ title }: { title: string }) {
  const mg = inferMuscleGroup(title);
  const color = MUSCLE_COLORS[mg] ?? MUSCLE_COLORS.Other;
  return (
    <span
      className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline-flex items-center"
      style={{ backgroundColor: color + "22", color }}
    >{mg}</span>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : "";
}

export default function CoachSchedules() {
  const { toast } = useToast();
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);
  const [newExerciseScheduleId, setNewExerciseScheduleId] = useState<number | null>(null);
  const [editExercise, setEditExercise] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState<number | null>(null);
  const [videoEx, setVideoEx] = useState<any | null>(null);

  const { data: schedules = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/schedules"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", weekStart: format(new Date(), "yyyy-MM-dd"), status: "active" });

  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({ title: "", description: "", dayOfWeek: "0", sets: "", reps: "", durationSeconds: "", notes: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoMode, setVideoMode] = useState<"upload" | "youtube">("youtube");
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

  const saveToLibraryMut = useMutation({
    mutationFn: async (exerciseId: number) => {
      const res = await apiRequest("POST", `/api/exercises/${exerciseId}/save-to-library`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      toast({ title: data.alreadyExists ? "Already in library" : "Saved to library", description: data.title });
    },
    onError: () => toast({ title: "Error", description: "Failed to save to library", variant: "destructive" }),
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/schedules/${id}`, { status });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/schedules"] }),
    onError: () => toast({ title: "Error", description: "Failed to update schedule status", variant: "destructive" }),
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
      if (videoMode === "upload" && videoFile) {
        fd.append("video", videoFile);
      } else if (videoMode === "youtube" && youtubeUrl.trim()) {
        fd.append("youtubeUrl", youtubeUrl.trim());
      }
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/exercises`, fd);
      if (!res.ok) throw new Error("Failed to create exercise");
      return res.json();
    },
    onSuccess: (_data, scheduleId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
      setNewExerciseScheduleId(null);
      setExerciseForm({ title: "", description: "", dayOfWeek: "0", sets: "", reps: "", durationSeconds: "", notes: "" });
      setVideoFile(null);
      setYoutubeUrl("");
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

  const [editExForm, setEditExForm] = useState({ title: "", description: "", dayOfWeek: "0", sets: "", reps: "", durationSeconds: "", notes: "" });
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [editVideoMode, setEditVideoMode] = useState<"upload" | "youtube" | "keep">("keep");
  const editFileRef = useRef<HTMLInputElement>(null);

  const openEditExercise = (ex: any) => {
    setEditExercise(ex);
    setEditExForm({
      title: ex.title || "",
      description: ex.description || "",
      dayOfWeek: String(ex.dayOfWeek ?? 0),
      sets: ex.sets ? String(ex.sets) : "",
      reps: ex.reps ? String(ex.reps) : "",
      durationSeconds: ex.durationSeconds ? String(ex.durationSeconds) : "",
      notes: ex.notes || "",
    });
    setEditYoutubeUrl(ex.videoUrl && (ex.videoUrl.includes("youtube") || ex.videoUrl.includes("youtu.be")) ? ex.videoUrl : "");
    setEditVideoMode("keep");
    setEditVideoFile(null);
  };

  const updateExerciseMut = useMutation({
    mutationFn: async ({ exId, scheduleId }: { exId: number; scheduleId: number }) => {
      const fd = new FormData();
      Object.entries(editExForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (editVideoMode === "upload" && editVideoFile) {
        fd.append("video", editVideoFile);
      } else if (editVideoMode === "youtube" && editYoutubeUrl.trim()) {
        fd.append("youtubeUrl", editYoutubeUrl.trim());
      }
      const res = await apiRequest("PATCH", `/api/exercises/${exId}`, fd);
      if (!res.ok) throw new Error("Failed to update exercise");
      return { scheduleId };
    },
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
      setEditExercise(null);
      toast({ title: "Exercise updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update exercise", variant: "destructive" }),
  });

  const assignMut = useMutation({
    mutationFn: async ({ scheduleId, clientId, startDate }: { scheduleId: number; clientId: number; startDate?: string }) => {
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/clients`, { clientId, startDate });
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
                editExercise={(ex) => openEditExercise(ex)}
                playVideo={(ex) => setVideoEx(ex)}
                saveToLibrary={(exId) => saveToLibraryMut.mutate(exId)}
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
            <AddExerciseDialog
              scheduleId={newExerciseScheduleId}
              exerciseForm={exerciseForm}
              setExerciseForm={setExerciseForm}
              videoMode={videoMode}
              setVideoMode={setVideoMode}
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              videoFile={videoFile}
              setVideoFile={setVideoFile}
              fileRef={fileRef}
              createExerciseMut={createExerciseMut}
            />
          </DialogContent>
        </Dialog>

        {/* Edit exercise dialog */}
        <Dialog open={!!editExercise} onOpenChange={(o) => !o && setEditExercise(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>Exercise Name *</Label>
                <Input value={editExForm.title} onChange={(e) => setEditExForm({ ...editExForm, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Day of Week</Label>
                <Select value={editExForm.dayOfWeek} onValueChange={(v) => setEditExForm({ ...editExForm, dayOfWeek: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Sets</Label>
                  <Input type="number" value={editExForm.sets} onChange={(e) => setEditExForm({ ...editExForm, sets: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reps</Label>
                  <Input type="number" value={editExForm.reps} onChange={(e) => setEditExForm({ ...editExForm, reps: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (s)</Label>
                  <Input type="number" value={editExForm.durationSeconds} onChange={(e) => setEditExForm({ ...editExForm, durationSeconds: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={editExForm.description} onChange={(e) => setEditExForm({ ...editExForm, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={editExForm.notes} onChange={(e) => setEditExForm({ ...editExForm, notes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Video</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button type="button" onClick={() => setEditVideoMode("keep")}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${editVideoMode === "keep" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    Keep Current
                  </button>
                  <button type="button" onClick={() => setEditVideoMode("youtube")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${editVideoMode === "youtube" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </button>
                  <button type="button" onClick={() => setEditVideoMode("upload")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${editVideoMode === "upload" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                </div>
                {editVideoMode === "youtube" && (
                  <Input placeholder="https://youtube.com/watch?v=..." value={editYoutubeUrl} onChange={(e) => setEditYoutubeUrl(e.target.value)} />
                )}
                {editVideoMode === "upload" && (
                  <div>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50" onClick={() => editFileRef.current?.click()}>
                      {editVideoFile ? (
                        <span className="text-sm text-primary">{editVideoFile.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Click to upload video</span>
                      )}
                    </div>
                    <input ref={editFileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setEditVideoFile(e.target.files?.[0] || null)} />
                  </div>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => editExercise && updateExerciseMut.mutate({ exId: editExercise.id, scheduleId: editExercise.scheduleId })}
                disabled={!editExForm.title || updateExerciseMut.isPending}
              >
                {updateExerciseMut.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Video preview dialog */}
        <Dialog open={!!videoEx} onOpenChange={(o) => !o && setVideoEx(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {videoEx?.title}
              </DialogTitle>
            </DialogHeader>
            {videoEx?.videoUrl && (() => {
              const isYT = videoEx.videoUrl.includes("youtube") || videoEx.videoUrl.includes("youtu.be");
              const isShorts = videoEx.videoUrl.includes("/shorts/");
              const ytId = extractYoutubeId(videoEx.videoUrl);
              return isYT ? (
                <div className={`w-full rounded-lg overflow-hidden bg-black flex justify-center ${isShorts ? "" : "aspect-video"}` }>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    className={isShorts ? "w-full" : "w-full h-full"}
                    style={isShorts ? { aspectRatio: "9/16", maxHeight: "70vh" } : undefined}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full rounded-lg overflow-hidden bg-black aspect-video">
                  <video src={videoEx.videoUrl} controls autoPlay muted className="w-full h-full" />
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Assign clients dialog */}
        <Dialog open={assignOpen !== null} onOpenChange={(o) => !o && setAssignOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Clients</DialogTitle>
            </DialogHeader>
            {assignOpen !== null && <AssignClientsPanel scheduleId={assignOpen} clients={clients} onAssign={(cid: number, startDate: string) => assignMut.mutate({ scheduleId: assignOpen, clientId: cid, startDate })} onUnassign={(cid: number) => unassignMut.mutate({ scheduleId: assignOpen, clientId: cid })} />}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function AddExerciseDialog({ scheduleId, exerciseForm, setExerciseForm, videoMode, setVideoMode, youtubeUrl, setYoutubeUrl, videoFile, setVideoFile, fileRef, createExerciseMut }: any) {
  const [tab, setTab] = useState<"library" | "custom">("library");
  const [libSearch, setLibSearch] = useState("");
  const [selectedLibEx, setSelectedLibEx] = useState<any | null>(null);
  const [libDay, setLibDay] = useState("0");
  const { data: library = [] } = useQuery<any[]>({ queryKey: ["/api/library"] });
  const { toast } = useToast();

  const addFromLibMut = useMutation({
    mutationFn: async ({ libId, day }: { libId: number; day: string }) => {
      const res = await apiRequest("POST", `/api/library/${libId}/add-to-schedule`, {
        scheduleId,
        dayOfWeek: day,
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/exercises`] });
      setSelectedLibEx(null);
      toast({ title: "Exercise added to schedule" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" }),
  });

  const filteredLib = library.filter((ex: any) =>
    !libSearch || ex.title.toLowerCase().includes(libSearch.toLowerCase())
  );

  // Group library by muscle group
  const libGroups = Array.from(new Set(filteredLib.map((e: any) => e.muscleGroup))).sort() as string[];

  return (
    <div className="pt-2">
      {/* Tab switcher */}
      <div className="flex rounded-lg border overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setTab("library")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            tab === "library" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <BookOpen className="w-4 h-4" /> From Library
        </button>
        <button
          type="button"
          onClick={() => setTab("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            tab === "custom" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Plus className="w-4 h-4" /> Custom Exercise
        </button>
      </div>

      {tab === "library" ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search library..."
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected exercise → day picker */}
          {selectedLibEx ? (
            <div className="border rounded-xl p-4 space-y-3 bg-primary/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{selectedLibEx.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedLibEx.muscleGroup}</p>
                </div>
                <button onClick={() => setSelectedLibEx(null)} className="text-muted-foreground hover:text-foreground text-xs underline shrink-0">Change</button>
              </div>
              <div className="space-y-1.5">
                <Label>Add to day</Label>
                <Select value={libDay} onValueChange={setLibDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => addFromLibMut.mutate({ libId: selectedLibEx.id, day: libDay })}
                disabled={addFromLibMut.isPending}
              >
                {addFromLibMut.isPending ? "Adding..." : "Add to Schedule"}
              </Button>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
              {library.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Your library is empty.</p>
                  <p className="text-xs mt-1">Add exercises in the Library page first.</p>
                </div>
              ) : filteredLib.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No exercises match your search.</p>
              ) : (
                libGroups.map((group) => {
                  const exs = filteredLib.filter((e: any) => e.muscleGroup === group);
                  if (!exs.length) return null;
                  return (
                    <div key={group}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group}</p>
                      <div className="space-y-1.5">
                        {exs.map((ex: any) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => setSelectedLibEx(ex)}
                            className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                            data-testid={`lib-pick-${ex.id}`}
                          >
                            <div>
                              <p className="text-sm font-medium">{ex.title}</p>
                              {(ex.defaultSets || ex.defaultReps) && (
                                <p className="text-xs text-muted-foreground">
                                  {[ex.defaultSets && `${ex.defaultSets} sets`, ex.defaultReps && `${ex.defaultReps} reps`].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        /* Custom exercise form */
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Exercise Name *</Label>
            <Input placeholder="e.g. Barbell Squat" value={exerciseForm.title} onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })} data-testid="input-exercise-title" />
          </div>
          <div className="space-y-1.5">
            <Label>Day of Week</Label>
            <Select value={exerciseForm.dayOfWeek} onValueChange={(v) => setExerciseForm({ ...exerciseForm, dayOfWeek: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Sets</Label><Input type="number" placeholder="3" value={exerciseForm.sets} onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })} data-testid="input-exercise-sets" /></div>
            <div className="space-y-1.5"><Label>Reps</Label><Input type="number" placeholder="10" value={exerciseForm.reps} onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })} data-testid="input-exercise-reps" /></div>
            <div className="space-y-1.5"><Label>Duration (s)</Label><Input type="number" placeholder="60" value={exerciseForm.durationSeconds} onChange={(e) => setExerciseForm({ ...exerciseForm, durationSeconds: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="How to perform this exercise..." value={exerciseForm.description} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input placeholder="e.g. Focus on form, rest 90s between sets" value={exerciseForm.notes} onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Exercise Video (optional)</Label>
            <div className="flex rounded-lg border overflow-hidden">
              <button type="button" onClick={() => setVideoMode("youtube")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${videoMode === "youtube" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} data-testid="video-mode-youtube">
                <Youtube className="w-4 h-4" /> YouTube Link
              </button>
              <button type="button" onClick={() => setVideoMode("upload")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${videoMode === "upload" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} data-testid="video-mode-upload">
                <Upload className="w-4 h-4" /> Upload File
              </button>
            </div>
            {videoMode === "youtube" ? (
              <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} data-testid="input-youtube-url" />
            ) : (
              <div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()} data-testid="video-upload-zone">
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary"><Play className="w-5 h-5" /><span className="text-sm font-medium truncate max-w-xs">{videoFile.name}</span></div>
                  ) : (
                    <><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">Click to upload video</p><p className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, WebM · Up to 500MB</p></>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </div>
            )}
          </div>
          <Button className="w-full" onClick={() => scheduleId && createExerciseMut.mutate(scheduleId)} disabled={!exerciseForm.title || createExerciseMut.isPending} data-testid="button-save-exercise">
            {createExerciseMut.isPending ? "Adding..." : "Add Exercise"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ schedule, expanded, onToggle, onDelete, onAddExercise, onAssign, deleteExercise, editExercise, playVideo, saveToLibrary }: any) {
  const { data: exercises = [] } = useQuery<any[]>({
    queryKey: [`/api/schedules/${schedule.id}/exercises`],
    enabled: expanded,
  });
  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: [`/api/schedules/${schedule.id}/clients`],
    enabled: expanded,
  });
  const { data: libraryItems = [] } = useQuery<any[]>({
    queryKey: ["/api/library"],
    enabled: expanded,
  });
  const libraryTitles = new Set((libraryItems as any[]).map((l: any) => l.title.toLowerCase()));
  const { toast } = useToast();
  // null = nothing being dragged over; -1 = empty schedule drop zone
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  // id of exercise being dragged (from this schedule)
  const [draggingExId, setDraggingExId] = useState<number | null>(null);
  // drop indicator: { dayIndex, beforeExId } — null beforeExId = end of list
  const [dropTarget, setDropTarget] = useState<{ dayIndex: number; beforeExId: number | null } | null>(null);
  // superset linking: id of the first exercise selected for pairing
  const [supersetSource, setSupersetSource] = useState<number | null>(null);

  // ── Library-card drop (from Library page) ────────────────────────────────
  const handleLibraryDrop = async (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const libId = e.dataTransfer.getData("libraryExerciseId");
    if (!libId) return;
    try {
      const res = await apiRequest("POST", `/api/library/${libId}/add-to-schedule`, {
        scheduleId: schedule.id,
        dayOfWeek: dayIndex,
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
      toast({ title: "Exercise added", description: `Added to ${DAYS[dayIndex]}` });
    } catch {
      toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" });
    }
  };

  // ── Exercise row drop (reorder / move day) ───────────────────────────────
  const handleExerciseDrop = async (e: React.DragEvent, targetDayIndex: number, beforeExId: number | null) => {
    e.preventDefault();
    setDropTarget(null);
    setDraggingExId(null);
    const exId = Number(e.dataTransfer.getData("scheduleExerciseId"));
    if (!exId) return;

    const draggedEx = exercises.find((x: any) => x.id === exId);
    if (!draggedEx) return;

    // Build new ordered list for the target day
    const dayExercises = exercises
      .filter((x: any) => x.dayOfWeek === targetDayIndex && x.id !== exId)
      .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    // Insert dragged item at position
    const insertIdx = beforeExId === null
      ? dayExercises.length
      : dayExercises.findIndex((x: any) => x.id === beforeExId);
    const newOrder = [
      ...dayExercises.slice(0, insertIdx < 0 ? dayExercises.length : insertIdx),
      { ...draggedEx, dayOfWeek: targetDayIndex },
      ...dayExercises.slice(insertIdx < 0 ? dayExercises.length : insertIdx),
    ];

    // Persist all affected exercises
    try {
      await Promise.all(
        newOrder.map((ex: any, idx: number) =>
          apiRequest("PATCH", `/api/exercises/${ex.id}`, {
            dayOfWeek: targetDayIndex,
            orderIndex: idx,
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
    } catch {
      toast({ title: "Error", description: "Failed to reorder exercises", variant: "destructive" });
    }
  };

  // ── Superset linking ────────────────────────────────────────────────────────
  const handleSupersetClick = async (ex: any) => {
    if (supersetSource === null) {
      // First click: select this exercise as the source
      setSupersetSource(ex.id);
      return;
    }
    if (supersetSource === ex.id) {
      // Clicked same exercise: cancel
      setSupersetSource(null);
      return;
    }
    // Second click: link the two exercises into a superset
    const src = exercises.find((e: any) => e.id === supersetSource);
    const tgt = ex;
    // Generate a group id: reuse existing one or create new
    const groupId = src?.supersetGroup || tgt?.supersetGroup || `ss_${Date.now()}`;
    try {
      await apiRequest("PATCH", `/api/exercises/${supersetSource}`, { supersetGroup: groupId });
      await apiRequest("PATCH", `/api/exercises/${tgt.id}`, { supersetGroup: groupId });
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
      toast({ title: "Superset created", description: `${src?.title} + ${tgt.title}` });
    } catch {
      toast({ title: "Error", description: "Failed to create superset", variant: "destructive" });
    }
    setSupersetSource(null);
  };

  const handleRemoveSuperset = async (ex: any) => {
    try {
      // Remove all exercises from this superset group
      const groupMembers = exercises.filter((e: any) => e.supersetGroup && e.supersetGroup === ex.supersetGroup);
      await Promise.all(groupMembers.map((e: any) => apiRequest("PATCH", `/api/exercises/${e.id}`, { supersetGroup: null })));
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
      toast({ title: "Superset removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove superset", variant: "destructive" });
    }
  };

  // Combined drop handler for a day zone
  const handleDayDrop = (e: React.DragEvent, dayIndex: number, beforeExId: number | null = null) => {
    const isLib = e.dataTransfer.getData("libraryExerciseId");
    const isEx  = e.dataTransfer.getData("scheduleExerciseId");
    if (isLib) handleLibraryDrop(e, dayIndex);
    else if (isEx) handleExerciseDrop(e, dayIndex, beforeExId);
  };

  const byDay = DAYS.map((day, i) => ({
    day, dayIndex: i,
    exercises: exercises
      .filter((e: any) => e.dayOfWeek === i)
      .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
  })).filter((d) => d.exercises.length > 0 || dragOverDay === d.dayIndex);

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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={schedule.status}
              onChange={(e) => toggleStatusMut.mutate({ id: schedule.id, status: e.target.value })}
              className={`text-[11px] font-semibold px-2 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                schedule.status === "active"
                  ? "bg-green-500/15 text-green-600 border-green-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <option value="active">● Active</option>
              <option value="inactive">○ Inactive</option>
            </select>
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

          {/* Superset linking mode banner */}
          {supersetSource !== null && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm">
              <span className="text-primary font-medium">
                <Link2 className="w-3.5 h-3.5 inline mr-1.5" />
                Superset mode — tap a second exercise to link it
              </span>
              <button onClick={() => setSupersetSource(null)} className="text-xs text-muted-foreground hover:text-foreground underline">Cancel</button>
            </div>
          )}

          {/* Exercises by day */}
          {byDay.length === 0 ? (
            <div
              className={`text-center py-8 rounded-xl border-2 border-dashed transition-colors ${
                dragOverDay === -1 ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverDay(-1); }}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={(e) => { e.preventDefault(); setDragOverDay(null); handleDayDrop(e, 0); }}
            >
              <p className="text-sm text-muted-foreground">{dragOverDay === -1 ? "Drop here to add" : "No exercises yet — drag from Library or use Add Exercise"}</p>
            </div>
          ) : (
            byDay.map(({ day, dayIndex, exercises: dayExs }) => (
              <div
                key={day}
                className="rounded-xl transition-all"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{day}</h4>
                <div
                  className={`space-y-1 rounded-lg p-1 transition-colors ${
                    dropTarget?.dayIndex === dayIndex ? "bg-primary/5" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    // Only update if not hovering a row (rows handle their own)
                    if ((e.target as HTMLElement).closest("[data-ex-row]")) return;
                    setDropTarget({ dayIndex, beforeExId: null });
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                  }}
                  onDrop={(e) => { handleDayDrop(e, dayIndex, null); }}
                >
                  {dayExs.map((ex: any) => (
                    <div key={ex.id}>
                      {/* Drop indicator above this row */}
                      {dropTarget?.dayIndex === dayIndex && dropTarget?.beforeExId === ex.id && (
                        <div className="h-0.5 bg-primary rounded-full mx-2 my-0.5" />
                      )}

                      <div
                        data-ex-row
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("scheduleExerciseId", String(ex.id));
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingExId(ex.id);
                        }}
                        onDragEnd={() => { setDraggingExId(null); setDropTarget(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const isUpperHalf = e.clientY < rect.top + rect.height / 2;
                          setDropTarget({ dayIndex, beforeExId: isUpperHalf ? ex.id : null });
                          // if lower half, look for next sibling
                          if (!isUpperHalf) {
                            const idx = dayExs.findIndex((x: any) => x.id === ex.id);
                            const nextEx = dayExs[idx + 1];
                            setDropTarget({ dayIndex, beforeExId: nextEx ? nextEx.id : null });
                          }
                        }}
                        onDrop={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const isUpperHalf = e.clientY < rect.top + rect.height / 2;
                          const idx = dayExs.findIndex((x: any) => x.id === ex.id);
                          const beforeId = isUpperHalf ? ex.id : (dayExs[idx + 1]?.id ?? null);
                          handleDayDrop(e, dayIndex, beforeId);
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg group cursor-grab active:cursor-grabbing transition-all ${
                          draggingExId === ex.id ? "opacity-40" : "opacity-100"
                        } ${
                          supersetSource === ex.id ? "ring-2 ring-primary bg-primary/10" : ex.supersetGroup ? "bg-orange-500/8 border border-orange-400/30" : "bg-muted/40"
                        } ${
                          supersetSource !== null && supersetSource !== ex.id && !ex.supersetGroup ? "cursor-pointer hover:ring-2 hover:ring-primary/60" : ""
                        }`}
                        data-testid={`exercise-row-${ex.id}`}
                        onClick={() => { if (supersetSource !== null && supersetSource !== ex.id) handleSupersetClick(ex); }}
                      >
                        {/* Drag handle */}
                        <div className="shrink-0 mr-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {ex.videoUrl ? (
                            <button
                              onClick={() => playVideo({ ...ex, scheduleId: schedule.id })}
                              className="shrink-0 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                              title="Watch video"
                              data-testid={`button-play-video-${ex.id}`}
                            >
                              <Play className="w-3.5 h-3.5 text-primary" />
                            </button>
                          ) : (
                            <div className="shrink-0 w-7 h-7" />
                          )}
                          <div className="min-w-0 flex items-center gap-2 flex-1">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{ex.title}</span>
                              {(ex.sets || ex.reps) && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                            <MuscleMapBadge title={ex.title} />
                            {ex.supersetGroup && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-500 hidden sm:inline-flex items-center gap-0.5">
                                <Link2 className="w-2.5 h-2.5" /> SS
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {/* Superset: unlink if already in group, else link button */}
                          {ex.supersetGroup ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveSuperset(ex); }}
                              className="p-1.5 rounded hover:text-orange-500"
                              title="Remove superset"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSupersetClick(ex); }}
                              className={`p-1.5 rounded hover:text-primary ${supersetSource === ex.id ? "text-primary" : ""}`}
                              title={supersetSource === null ? "Link as superset" : "Pair with this exercise"}
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Save to Library button — shows bookmark icon, greyed out if already in library */}
                          <button
                            onClick={(e) => { e.stopPropagation(); saveToLibrary(ex.id); }}
                            className={`p-1.5 rounded transition-colors ${
                              libraryTitles.has(ex.title.toLowerCase())
                                ? "text-primary/40 cursor-default"
                                : "hover:text-primary"
                            }`}
                            title={libraryTitles.has(ex.title.toLowerCase()) ? "Already in library" : "Save to library"}
                          >
                            <Library className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => editExercise({ ...ex, scheduleId: schedule.id })}
                            className="p-1.5 rounded hover:text-primary"
                            data-testid={`button-edit-exercise-${ex.id}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExercise(ex.id)}
                            className="p-1.5 rounded hover:text-destructive"
                            data-testid={`button-delete-exercise-${ex.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Drop indicator at end of list */}
                  {dropTarget?.dayIndex === dayIndex && dropTarget?.beforeExId === null && (
                    <div className="h-0.5 bg-primary rounded-full mx-2 my-0.5" />
                  )}

                  {/* Drop zone for other-day drags — shown when dragging over day header area */}
                  {dragOverDay === dayIndex && !dropTarget && (
                    <div className="h-8 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Day drop zones for moving to a day with no exercises (only visible while dragging an exercise row) */}
          {draggingExId !== null && (
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day, i) => {
                const alreadyShown = byDay.some((d) => d.dayIndex === i);
                if (alreadyShown) return null;
                return (
                  <div
                    key={i}
                    onDragOver={(e) => { e.preventDefault(); setDropTarget({ dayIndex: i, beforeExId: null }); }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={(e) => handleDayDrop(e, i, null)}
                    className={`text-center py-2 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors cursor-copy ${
                      dropTarget?.dayIndex === i ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
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
  // Per-client start date state
  const [startDates, setStartDates] = useState<Record<number, string>>({});
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1">
      {clients.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">No clients registered yet.</p>
      ) : (
        clients.map((client: any) => {
          const isAssigned = assignedIds.includes(client.id);
          const assignment = assignments.find((a: any) => a.clientId === client.id);
          return (
            <div key={client.id} className="p-3 rounded-lg border space-y-2" data-testid={`assign-client-${client.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.email}</div>
                  {isAssigned && assignment?.startDate && (
                    <div className="text-xs text-primary mt-0.5">Started: {assignment.startDate}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isAssigned ? "destructive" : "default"}
                  onClick={() => isAssigned ? onUnassign(client.id) : onAssign(client.id, startDates[client.id] || today)}
                >
                  {isAssigned ? "Remove" : "Assign"}
                </Button>
              </div>
              {/* Start date picker — only show for unassigned clients */}
              {!isAssigned && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Start date:</label>
                  <Input
                    type="date"
                    className="h-7 text-xs flex-1"
                    value={startDates[client.id] || today}
                    onChange={(e) => setStartDates({ ...startDates, [client.id]: e.target.value })}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
