import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "./pages/auth";
import CoachDashboard from "./pages/coach/dashboard";
import CoachSchedules from "./pages/coach/schedules";
import CoachClients from "./pages/coach/clients";
import CoachProgress from "./pages/coach/progress";
import ClientDashboard from "./pages/client/dashboard";
import ClientSchedule from "./pages/client/schedule";
import NotFound from "./pages/not-found";
import { useQuery } from "@tanstack/react-query";

function AppRoutes() {
  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-primary animate-pulse">
            <rect width="40" height="40" rx="10" fill="hsl(var(--primary))"/>
            <path d="M12 20h4l3-7 4 14 3-7h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-muted-foreground text-sm">Loading A7medFit...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === "coach") {
    return (
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={CoachDashboard} />
          <Route path="/schedules" component={CoachSchedules} />
          <Route path="/clients" component={CoachClients} />
          <Route path="/progress" component={CoachProgress} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={ClientDashboard} />
        <Route path="/schedule/:id" component={ClientSchedule} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster />
    </QueryClientProvider>
  );
}
