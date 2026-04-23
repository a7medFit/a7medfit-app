import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, CheckCircle2 } from "lucide-react";

export default function CoachClients() {
  const { data: clients = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });

  return (
    <Layout role="coach">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} registered client{clients.length !== 1 ? "s" : ""}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold mb-1">No clients yet</h3>
              <p className="text-muted-foreground text-sm">Clients will appear here once they register with the client role.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {clients.map((client: any) => {
              const clientCompletions = completions.filter((c: any) => c.clientId === client.id);
              return (
                <Card key={client.id} data-testid={`client-card-${client.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {client.avatarInitials || client.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{client.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {clientCompletions.length}
                      </div>
                      <div className="text-xs text-muted-foreground">completions</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">Client</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
