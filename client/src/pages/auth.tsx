import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["client", "coach"]),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("login");

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "client" },
  });

  const loginMut = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      if (!res.ok) throw new Error((await res.json()).error || "Login failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
    onError: (e: any) => toast({ title: "Login failed", description: e.message, variant: "destructive" }),
  });

  const registerMut = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      if (!res.ok) throw new Error((await res.json()).error || "Registration failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
    onError: (e: any) => toast({ title: "Registration failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background flex overflow-auto">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(222,47%,8%)] relative overflow-hidden flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-label="A7medFit logo">
            <rect width="40" height="40" rx="10" fill="hsl(24,95%,53%)"/>
            <path d="M12 20h4l3-7 4 14 3-7h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white font-bold text-xl tracking-tight">A7medFit</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Train smarter.<br/>Track everything.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Post exercise schedules with videos, track your clients' progress, and celebrate every rep.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { label: "Schedules", val: "∞" },
              { label: "Exercises tracked", val: "100%" },
              { label: "Progress views", val: "Live" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-orange-400">{s.val}</div>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-slate-600 text-sm">© 2026 A7medFit. All rights reserved.</div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-orange-400/10" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-orange-400/10" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10 pb-20">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="hsl(24,95%,53%)"/>
              <path d="M12 20h4l3-7 4 14 3-7h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-xl tracking-tight">A7medFit</span>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full mb-6" data-testid="auth-tabs">
              <TabsTrigger value="login" className="flex-1" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to your A7medFit account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit((d) => loginMut.mutate(d))} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" placeholder="you@example.com" data-testid="input-login-email" {...loginForm.register("email")} />
                      {loginForm.formState.errors.email && <p className="text-destructive text-xs">{loginForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" placeholder="••••••••" data-testid="input-login-password" {...loginForm.register("password")} />
                      {loginForm.formState.errors.password && <p className="text-destructive text-xs">{loginForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMut.isPending} data-testid="button-login">
                      {loginMut.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      No account?{" "}
                      <button type="button" className="text-primary underline" onClick={() => setTab("register")}>
                        Register here
                      </button>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>Join A7medFit to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit((d) => registerMut.mutate(d))} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input id="reg-name" placeholder="Ahmed Al Balushi" data-testid="input-register-name" {...registerForm.register("name")} />
                      {registerForm.formState.errors.name && <p className="text-destructive text-xs">{registerForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="you@example.com" data-testid="input-register-email" {...registerForm.register("email")} />
                      {registerForm.formState.errors.email && <p className="text-destructive text-xs">{registerForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" placeholder="Min. 6 characters" data-testid="input-register-password" {...registerForm.register("password")} />
                      {registerForm.formState.errors.password && <p className="text-destructive text-xs">{registerForm.formState.errors.password.message}</p>}
                    </div>
                    <input type="hidden" value="client" {...registerForm.register("role")} />
                    <Button type="submit" className="w-full" disabled={registerMut.isPending} data-testid="button-register">
                      {registerMut.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
