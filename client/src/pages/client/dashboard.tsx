import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Dumbbell, ArrowRight, Trophy } from "lucide-react";
import { Link } from "wouter";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClientDashboard() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const { data: schedules = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/schedules"] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });

  const todayDay = new Date().getDay(); // Sun=0

  return (
    <Layout role="client">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hey, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {schedules.length > 0
                ? `You have ${schedules.length} active schedule${schedules.length !== 1 ? "s" : ""}`
                : "Waiting for your coach to assign a schedule"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-semibold">{completions.length} done</span>
          </div>
        </div>

        {/* Today's exercises */}
        {schedules.length > 0 && (
          <TodaysExercises schedules={schedules} completions={completions} todayDay={todayDay} />
        )}

        {/* All schedules */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-lg" />)}</div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold mb-1">No schedules assigned yet</h3>
              <p className="text-muted-foreground text-sm">Your coach will assign a workout schedule for you soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your Programs</h2>
            {schedules.map((s: any) => (
              <ScheduleSummaryCard key={s.id} schedule={s} completions={completions} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function TodaysExercises({ schedules, completions, todayDay }: any) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        {DAYS[todayDay]}'s Workout
      </h2>
      {schedules.map((s: any) => (
        <TodayScheduleExercises key={s.id} schedule={s} completions={completions} todayDay={todayDay} />
      ))}
    </div>
  );
}

function TodayScheduleExercises({ schedule, completions, todayDay }: any) {
  const { data: exercises = [] } = useQuery<any[]>({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
  const todayExercises = exercises.filter((e: any) => e.dayOfWeek === todayDay);
  if (todayExercises.length === 0) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-primary">{schedule.title}</CardTitle>
        <Link href={`/schedule/${schedule.id}`}>
          <Button size="sm" variant="ghost" className="text-primary gap-1 h-7 text-xs">
            Open <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {todayExercises.slice(0, 3).map((ex: any) => {
          const done = completions.some((c: any) => c.exerciseId === ex.id);
          return (
            <div key={ex.id} className="flex items-center gap-3 text-sm" data-testid={`today-exercise-${ex.id}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? "text-green-500" : "text-muted-foreground/30"}`} />
              <span className={done ? "line-through text-muted-foreground" : ""}>{ex.title}</span>
              {ex.sets && <span className="text-xs text-muted-foreground ml-auto">{ex.sets}×{ex.reps}</span>}
            </div>
          );
        })}
        {todayExercises.length > 3 && (
          <p className="text-xs text-muted-foreground">+{todayExercises.length - 3} more exercises</p>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleSummaryCard({ schedule, completions }: any) {
  const { data: exercises = [] } = useQuery<any[]>({ queryKey: [`/api/schedules/${schedule.id}/exercises`] });
  const doneCount = completions.filter((c: any) => c.scheduleId === schedule.id).length;
  const pct = exercises.length > 0 ? Math.round((doneCount / exercises.length) * 100) : 0;

  return (
    <Card data-testid={`schedule-card-${schedule.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{schedule.title}</span>
          </div>
          <Badge variant={schedule.status === "active" ? "default" : "secondary"} className="text-xs">{schedule.status}</Badge>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{doneCount}/{exercises.length}</span>
        </div>
        <Link href={`/schedule/${schedule.id}`}>
          <Button size="sm" className="w-full gap-1.5" data-testid={`button-open-schedule-${schedule.id}`}>
            <Dumbbell className="w-3.5 h-3.5" /> View Exercises
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
