import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, normalizeRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import {
  billingApi,
  type ProviderProject,
  type OfferWithProvider,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, Flame, Star } from "lucide-react";
import { format } from "date-fns";

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [offersByProject, setOffersByProject] = useState<Record<number, OfferWithProvider[]>>({});

  const role = user ? normalizeRole(user.role) : null;

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user) return;
    if (role !== "client") return;
    void (async () => {
      try {
        const pjs = await billingApi.myProjects();
        setProjects(pjs);
        const map: Record<number, OfferWithProvider[]> = {};
        for (const p of pjs) {
          try {
            const offers = await billingApi.projectOffers(p.id);
            map[p.id] = offers;
          } catch {
            map[p.id] = [];
          }
        }
        setOffersByProject(map);
      } catch {
        // ignore
      }
    })();
  }, [user, role]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "client") {
    setLocation(role === "service_provider" ? "/provider" : "/admin");
    return null;
  }

  const onAccept = async (offerId: number) => {
    try {
      await billingApi.acceptOffer(offerId);
      const pjs = await billingApi.myProjects();
      setProjects(pjs);
    } catch {
      // ignore
    }
  };

  const typeBadge = (type: string) => {
    if (type === "top") return <Badge className="bg-amber-100 text-amber-800 gap-1"><Flame className="w-3 h-3" /> {t.provider.offerTypeTop}</Badge>;
    if (type === "highlighted") return <Badge className="bg-blue-100 text-blue-800 gap-1"><Star className="w-3 h-3" /> {t.provider.offerTypeHighlighted}</Badge>;
    return <Badge variant="outline">{t.provider.offerTypeNormal}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-1">{t.dashboard.welcome}, {user.fullName.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm">{t.dashboard.homeownerSubtitle}</p>
        </div>
        <Link href="/submit-project">
          <Button data-testid="button-new-project">
            <Briefcase className="w-4 h-4 mr-2" /> {t.clientDashboard.newProject}
          </Button>
        </Link>
      </div>

      {projects.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">{t.clientDashboard.noProjects}</p>
          <Link href="/submit-project">
            <Button>{t.clientDashboard.newProject}</Button>
          </Link>
        </Card>
      )}

      <div className="space-y-6">
        {projects.map((p) => {
          const offers = offersByProject[p.id] ?? [];
          return (
            <Card key={p.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold capitalize" data-testid={`project-${p.id}`}>{p.projectType}</h3>
                  <p className="text-sm text-muted-foreground">{p.city} · {t.clientDashboard.size}: <span className="capitalize">{p.size}</span></p>
                </div>
                <Badge variant="outline">{p.status}</Badge>
              </div>
              <p className="text-sm mb-4 line-clamp-2">{p.description}</p>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">
                  {t.clientDashboard.offersReceived} ({offers.length})
                </h4>
                {offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.clientDashboard.noOffersYet}</p>
                ) : (
                  <div className="space-y-3">
                    {offers.map((o) => (
                      <div key={o.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{o.providerCompany ?? o.providerName}</span>
                            {typeBadge(o.type)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{o.providerCity}</p>
                          <p className="text-sm">{o.message}</p>
                          {o.priceEstimate && (
                            <p className="text-sm font-semibold mt-1">{t.clientDashboard.price}: {o.priceEstimate}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {o.status === "accepted" ? (
                            <Badge>{t.clientDashboard.accepted}</Badge>
                          ) : (
                            <Button size="sm" onClick={() => onAccept(o.id)} data-testid={`button-accept-${o.id}`}>
                              {t.clientDashboard.accept}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                {t.clientDashboard.posted} {format(new Date(p.createdAt), "MMM d, yyyy")}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
