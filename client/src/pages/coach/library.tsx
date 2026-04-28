import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Dumbbell, Trash2, Upload, Play, Edit3, Youtube, Search, X } from "lucide-react";

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Forearms", "Legs", "Quadriceps", "Hamstrings", "Glutes",
  "Calves", "Core", "Cardio", "Full Body", "Other",
];

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : "";
}

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function isShorts(url: string) {
  return url.includes("/shorts/");
}

function VideoPreviewDialog({ ex, onClose }: { ex: any; onClose: () => void }) {
  if (!ex) return null;
  const yt = ex.videoUrl && isYouTube(ex.videoUrl);
  const shorts = ex.videoUrl && isShorts(ex.videoUrl);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-4 h-4" /> {ex.title}
          </DialogTitle>
        </DialogHeader>
        {ex.videoUrl && (
          yt ? (
            <div className={`w-full rounded-lg overflow-hidden bg-black flex justify-center ${shorts ? "" : "aspect-video"}`}>
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(ex.videoUrl)}?autoplay=1`}
                className={shorts ? "w-full" : "w-full h-full"}
                style={shorts ? { aspectRatio: "9/16", maxHeight: "70vh" } : undefined}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full rounded-lg overflow-hidden bg-black aspect-video">
              <video src={ex.videoUrl} controls autoPlay muted className="w-full h-full" />
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExerciseForm({ initial, onSave, onClose, saving }: {
  initial?: any;
  onSave: (fd: FormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    muscleGroup: initial?.muscleGroup || "Other",
    defaultSets: initial?.defaultSets ? String(initial.defaultSets) : "",
    defaultReps: initial?.defaultReps ? String(initial.defaultReps) : "",
    durationSeconds: initial?.durationSeconds ? String(initial.durationSeconds) : "",
    notes: initial?.notes || "",
  });
  const [videoMode, setVideoMode] = useState<"keep" | "youtube" | "upload">(initial ? "keep" : "youtube");
  const [youtubeUrl, setYoutubeUrl] = useState(
    initial?.videoUrl && isYouTube(initial.videoUrl) ? initial.videoUrl : ""
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (videoMode === "youtube" && youtubeUrl.trim()) fd.append("youtubeUrl", youtubeUrl.trim());
    else if (videoMode === "upload" && videoFile) fd.append("video", videoFile);
    else if (videoMode === "keep" && initial) { /* keep as-is — don't send video fields */ }
    onSave(fd);
  };

  return (
    <div className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label>Exercise Name *</Label>
        <Input placeholder="e.g. Barbell Squat" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-lib-title" />
      </div>
      <div className="space-y-1.5">
        <Label>Muscle Group</Label>
        <Select value={form.muscleGroup} onValueChange={(v) => setForm({ ...form, muscleGroup: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Default Sets</Label>
          <Input type="number" placeholder="3" value={form.defaultSets} onChange={(e) => setForm({ ...form, defaultSets: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Default Reps</Label>
          <Input type="number" placeholder="10" value={form.defaultReps} onChange={(e) => setForm({ ...form, defaultReps: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Duration (s)</Label>
          <Input type="number" placeholder="60" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="How to perform this exercise..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Input placeholder="e.g. Focus on form, rest 90s between sets" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {/* Video */}
      <div className="space-y-2">
        <Label>Video (optional)</Label>
        <div className="flex rounded-lg border overflow-hidden">
          {initial && (
            <button type="button" onClick={() => setVideoMode("keep")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${videoMode === "keep" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              Keep Current
            </button>
          )}
          <button type="button" onClick={() => setVideoMode("youtube")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${videoMode === "youtube" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            <Youtube className="w-3.5 h-3.5" /> YouTube
          </button>
          <button type="button" onClick={() => setVideoMode("upload")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${videoMode === "upload" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>
        {videoMode === "youtube" && (
          <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
        )}
        {videoMode === "upload" && (
          <div>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
              {videoFile ? (
                <span className="text-sm text-primary font-medium">{videoFile.name}</span>
              ) : (
                <><Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">Click to upload video</p></>
              )}
            </div>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
          </div>
        )}
      </div>

      <Button className="w-full" onClick={submit} disabled={!form.title || saving}>
        {saving ? "Saving..." : initial ? "Save Changes" : "Add to Library"}
      </Button>
    </div>
  );
}

export default function CoachLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editEx, setEditEx] = useState<any | null>(null);
  const [videoEx, setVideoEx] = useState<any | null>(null);

  const { data: library = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/library"] });

  const createMut = useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await apiRequest("POST", "/api/library", fd);
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      setAddOpen(false);
      toast({ title: "Exercise added to library" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, fd }: { id: number; fd: FormData }) => {
      const res = await apiRequest("PATCH", `/api/library/${id}`, fd);
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      setEditEx(null);
      toast({ title: "Exercise updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/library/${id}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      toast({ title: "Exercise removed from library" });
    },
  });

  // Filter
  const filtered = library.filter((ex: any) => {
    const matchSearch = !search || ex.title.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "All" || ex.muscleGroup === filterGroup;
    return matchSearch && matchGroup;
  });

  // Group by muscle group
  const usedGroups = Array.from(new Set(library.map((e: any) => e.muscleGroup))).sort();
  const grouped = usedGroups
    .filter((g) => filterGroup === "All" || g === filterGroup)
    .map((group) => ({
      group,
      exercises: filtered.filter((e: any) => e.muscleGroup === group),
    }))
    .filter((g) => g.exercises.length > 0);

  return (
    <Layout role="coach">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground text-sm mt-1">{library.length} exercises · drag or click to add to a schedule</p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)} data-testid="button-add-library-exercise">
            <Plus className="w-4 h-4" /> Add Exercise
          </Button>
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-library-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Groups</SelectItem>
              {usedGroups.map((g: any) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : library.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold mb-1">No exercises yet</h3>
              <p className="text-muted-foreground text-sm">Add your first exercise to build your library.</p>
            </CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">No exercises match your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ group, exercises: exs }) => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{group}</h2>
                  <Badge variant="secondary" className="text-xs">{exs.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {exs.map((ex: any) => (
                    <div
                      key={ex.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("libraryExerciseId", String(ex.id));
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="group relative bg-card border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-md transition-all"
                      data-testid={`library-card-${ex.id}`}
                    >
                      {/* Video play button */}
                      {ex.videoUrl && (
                        <button
                          onClick={() => setVideoEx(ex)}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                          data-testid={`button-lib-play-${ex.id}`}
                        >
                          <Play className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}

                      <div className="pr-8">
                        <p className="font-medium text-sm leading-snug">{ex.title}</p>
                        {(ex.defaultSets || ex.defaultReps) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[ex.defaultSets && `${ex.defaultSets} sets`, ex.defaultReps && `${ex.defaultReps} reps`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {ex.description && (
                          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{ex.description}</p>
                        )}
                      </div>

                      {/* Edit / Delete — appear on hover */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditEx(ex)}
                          className="p-1 rounded hover:text-primary"
                          data-testid={`button-lib-edit-${ex.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(ex.id)}
                          className="p-1 rounded hover:text-destructive"
                          data-testid={`button-lib-delete-${ex.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Exercise to Library</DialogTitle></DialogHeader>
          <ExerciseForm
            onSave={(fd) => createMut.mutate(fd)}
            onClose={() => setAddOpen(false)}
            saving={createMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editEx} onOpenChange={(o) => !o && setEditEx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Exercise</DialogTitle></DialogHeader>
          {editEx && (
            <ExerciseForm
              initial={editEx}
              onSave={(fd) => updateMut.mutate({ id: editEx.id, fd })}
              onClose={() => setEditEx(null)}
              saving={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Video preview */}
      {videoEx && <VideoPreviewDialog ex={videoEx} onClose={() => setVideoEx(null)} />}
    </Layout>
  );
}
