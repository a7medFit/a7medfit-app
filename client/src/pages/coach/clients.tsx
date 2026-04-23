import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Mail, CheckCircle2, Trash2 } from "lucide-react";

export default function CoachClients() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: clients = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  const { data: completions = [] } = useQuery<any[]>({ queryKey: ["/api/completions"] });

  const deleteMut = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("DELETE", `/api/clients/${clientId}`);
      if (!res.ok) throw new Error("Failed to delete client");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      toast({ title: "Client removed", description: `${deleteTarget?.name} has been deleted.` });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" });
    },
  });

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
              <p className="text-muted-foreground text-sm">Clients will appear here once they register.</p>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(client)}
                      data-testid={`button-delete-client-${client.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all their progress data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Removing..." : "Remove Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
