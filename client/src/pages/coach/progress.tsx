import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, CheckCircle2, Dumbbell, ChevronDown, ChevronUp, Weight } from "lucide-react";

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
            {progress.map((p: any) => {
              const totalEx = p.scheduleProgress.reduce((a: number, sp: any) => a + sp.totalExercises, 0);
              const doneEx = p.scheduleProgress.reduce((a: number, sp: any) => a + sp.completedExercises, 0);
              const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;
              const isExpanded = expanded === p.client.id;

              return (
                <Card key={p.client.id} data-testid={`progress-card-${p.client.id}`}>
                  <CardHeader
                    className="pb-3 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : p.client.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {p.client.avatarInitials || p.client.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-sm">{p.client.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{p.client.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {doneEx}/{totalEx}
                            </Badge>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {p.scheduleProgress.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No schedules assigned.</p>
                        ) : (
                          p.scheduleProgress.map((sp: any) => (
                            <div key={sp.schedule.id} className="p-4 rounded-lg bg-muted/30 space-y-3" data-testid={`sp-${p.client.id}-${sp.schedule.id}`}>
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
                            </div>
                          ))
                        )}

                        {/* Recent completions detail */}
                        <RecentCompletions clientId={p.client.id} />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function RecentCompletions({ clientId }: { clientId: number }) {
  const { data: allCompletions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });
  const clientCompletions = allCompletions.filter((c: any) => c.clientId === clientId).slice(-5).reverse();

  if (clientCompletions.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Logs</h4>
      <div className="space-y-2">
        {clientCompletions.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-background border" data-testid={`completion-row-${c.id}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="text-muted-foreground text-xs">{new Date(c.completedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {c.actualSets && <span>{c.actualSets}×{c.actualReps}</span>}
              {c.actualWeight && (
                <span className="flex items-center gap-0.5">
                  <Weight className="w-3 h-3" />{c.actualWeight}kg
                </span>
              )}
              {c.rating && <span>{"⭐".repeat(c.rating)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
