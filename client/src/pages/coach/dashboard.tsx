import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function CoachDashboard() {
  const { data: schedules = [] } = useQuery<any[]>({ queryKey: ["/api/schedules"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });
  const { data: progress = [] } = useQuery<any[]>({ queryKey: ["/api/coach/progress"] });

  const activeSchedules = schedules.filter((s: any) => s.status === "active").length;
  const totalExercisesCompleted = completions.length;

  const stats = [
    { label: "Active Schedules", value: activeSchedules, icon: Calendar, color: "text-orange-500" },
    { label: "Total Clients", value: clients.length, icon: Users, color: "text-blue-500" },
    { label: "Exercises Completed", value: totalExercisesCompleted, icon: CheckCircle2, color: "text-green-500" },
    { label: "Schedules Created", value: schedules.length, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <Layout role="coach">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your coaching activity</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent schedules */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Schedules</CardTitle>
              <Link href="/schedules">
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No schedules yet.</p>
                  <Link href="/schedules">
                    <Button size="sm" className="mt-3" data-testid="button-create-first-schedule">Create your first schedule</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`schedule-row-${s.id}`}>
                      <div>
                        <div className="text-sm font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.weekStart}</div>
                      </div>
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-xs">
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Client Progress</CardTitle>
              <Link href="/progress">
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {progress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No client data yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progress.slice(0, 4).map((p: any) => {
                    const totalEx = p.scheduleProgress.reduce((acc: number, sp: any) => acc + sp.totalExercises, 0);
                    const doneEx = p.scheduleProgress.reduce((acc: number, sp: any) => acc + sp.completedExercises, 0);
                    const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;
                    return (
                      <div key={p.client.id} data-testid={`progress-client-${p.client.id}`}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{p.client.name}</span>
                          <span className="text-muted-foreground">{doneEx}/{totalEx} exercises</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
