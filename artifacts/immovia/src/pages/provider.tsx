import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, normalizeRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import {
  billingApi,
  offerCostFor,
  type CreditBalance,
  type ImmoTransaction,
  type ProviderOffer,
  type ProviderProject,
  type SubscriptionPlan,
  type PaymentRow,
  type InvoiceRow,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, Loader2, ArrowUpRight, Sparkles, Flame, Star } from "lucide-react";
import { format } from "date-fns";

function formatEUR(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [providerMe, setProviderMe] = useState<{ plan: SubscriptionPlan | null } | null>(null);
  const [transactions, setTransactions] = useState<ImmoTransaction[]>([]);
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [offerProject, setOfferProject] = useState<ProviderProject | null>(null);
  const [offerType, setOfferType] = useState<"normal" | "highlighted" | "top">("normal");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const role = user ? normalizeRole(user.role) : null;

  useEffect(() => {
    if (!loading && (!user || role !== "service_provider")) {
      setLocation("/login");
    }
  }, [loading, user, role, setLocation]);

  const refreshAll = async () => {
    try {
      const [b, me, txs, pjs, ofs, ps, invs] = await Promise.all([
        billingApi.balance(),
        billingApi.providerMe(),
        billingApi.transactions(),
        billingApi.providerProjects(),
        billingApi.providerOffers(),
        billingApi.payments(),
        billingApi.invoices(),
      ]);
      setBalance(b);
      setProviderMe(me);
      setTransactions(txs);
      setProjects(pjs);
      setOffers(ofs);
      setPayments(ps);
      setInvoices(invs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user && role === "service_provider") void refreshAll();
  }, [user, role]);

  if (loading || !user || role !== "service_provider") {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cost = offerProject ? offerCostFor(offerProject.size, offerType) : 0;
  const afterBalance = balance ? balance.total - cost : 0;
  const canSend = balance ? balance.total >= cost && offerMessage.trim().length >= 5 : false;

  const openOfferModal = (project: ProviderProject) => {
    setOfferProject(project);
    setOfferType("normal");
    setOfferMessage("");
    setOfferPrice("");
    setError(null);
  };

  const submitOffer = async () => {
    if (!offerProject) return;
    setSubmitting(true);
    setError(null);
    try {
      await billingApi.sendOffer(offerProject.id, {
        type: offerType,
        message: offerMessage,
        priceEstimate: offerPrice || undefined,
      });
      setSuccess(t.provider.offerSent);
      setOfferProject(null);
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const typeBadge = (type: string) => {
    if (type === "top") {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
          <Flame className="w-3 h-3" /> {t.provider.offerTypeTop}
        </Badge>
      );
    }
    if (type === "highlighted") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
          <Star className="w-3 h-3" /> {t.provider.offerTypeHighlighted}
        </Badge>
      );
    }
    return <Badge variant="outline">{t.provider.offerTypeNormal}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-1" data-testid="provider-heading">
          {t.provider.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.provider.welcome}, {user.fullName.split(" ")[0]}
        </p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="text-xs text-muted-foreground mb-1">{t.provider.balanceTotal}</div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold" data-testid="balance-total">{balance?.total ?? 0}</span>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground mb-1">{t.provider.balanceMonthly}</div>
          <div className="text-2xl font-bold" data-testid="balance-monthly">{balance?.monthly ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground mb-1">{t.provider.balancePurchased}</div>
          <div className="text-2xl font-bold" data-testid="balance-purchased">{balance?.purchased ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground mb-1">{t.provider.usedThisMonth}</div>
          <div className="text-2xl font-bold">{balance?.usedThisMonth ?? 0}</div>
        </Card>
      </div>

      <Card className="p-5 mb-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t.provider.currentPlan}</div>
          <div className="text-lg font-bold">{providerMe?.plan?.name ?? "—"}</div>
          <div className="text-sm text-muted-foreground">
            {providerMe?.plan?.monthlyCredits ?? 0} {t.pricing.creditsPerMonth}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/pricing">
            <Button variant="outline" data-testid="button-upgrade">
              {t.provider.upgrade} <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button data-testid="button-buy-credits">
              <Coins className="w-4 h-4 mr-1" /> {t.provider.buyCredits}
            </Button>
          </Link>
        </div>
      </Card>

      <Tabs defaultValue="browse">
        <TabsList className="mb-4">
          <TabsTrigger value="browse" data-testid="tab-browse">{t.provider.browseProjects}</TabsTrigger>
          <TabsTrigger value="offers" data-testid="tab-offers">{t.provider.myOffers}</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">{t.provider.billing}</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">{t.provider.history}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.provider.colClient}</TableHead>
                  <TableHead>{t.provider.colType}</TableHead>
                  <TableHead>{t.provider.colCity}</TableHead>
                  <TableHead>{t.provider.colSize}</TableHead>
                  <TableHead>{t.provider.colCost}</TableHead>
                  <TableHead className="text-right">{t.provider.colAction}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell className="capitalize">{p.projectType}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell className="capitalize">{p.size}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Coins className="w-3 h-3" /> {offerCostFor(p.size, "normal")}+
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openOfferModal(p)} data-testid={`button-send-offer-${p.id}`}>
                        {t.provider.sendOffer}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground h-24">
                      {t.provider.noProjects}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.provider.colProject}</TableHead>
                  <TableHead>{t.provider.colType}</TableHead>
                  <TableHead>{t.provider.colCost}</TableHead>
                  <TableHead>{t.provider.colStatus}</TableHead>
                  <TableHead>{t.provider.colDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.projectFullName}</div>
                      <div className="text-xs text-muted-foreground">{o.projectCity}</div>
                    </TableCell>
                    <TableCell>{typeBadge(o.type)}</TableCell>
                    <TableCell>{o.creditsSpent}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(o.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground h-24">
                      {t.provider.noOffers}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-bold mb-3">{t.provider.paymentHistory}</h3>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium capitalize">{p.kind} · {p.refSlug}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "MMM d, yyyy")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatEUR(p.amountCents)}</div>
                      <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">{t.provider.noPayments}</p>
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-bold mb-3">{t.provider.invoices}</h3>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{inv.number}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), "MMM d, yyyy")}</div>
                    </div>
                    <Button size="sm" variant="ghost" disabled>
                      {t.provider.downloadPdf}
                    </Button>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">{t.provider.noInvoices}</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.provider.colDate}</TableHead>
                  <TableHead>{t.provider.colType}</TableHead>
                  <TableHead>{t.provider.colAmount}</TableHead>
                  <TableHead>{t.provider.colBucket}</TableHead>
                  <TableHead>{t.provider.colNote}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                    <TableCell className={tx.amount < 0 ? "text-red-600" : "text-green-700"}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{tx.bucket}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.note}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground h-24">
                      {t.provider.noTransactions}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!offerProject} onOpenChange={(o) => !o && setOfferProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.provider.offerModalTitle}</DialogTitle>
            <DialogDescription>{offerProject?.fullName} · {offerProject?.city}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">{t.provider.offerTypeLabel}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["normal", "highlighted", "top"] as const).map((type) => {
                  const c = offerCostFor(offerProject?.size, type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOfferType(type)}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        offerType === type ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      data-testid={`offer-type-${type}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {type === "top" && <Flame className="w-4 h-4 text-amber-600" />}
                        {type === "highlighted" && <Star className="w-4 h-4 text-blue-600" />}
                        {type === "normal" && <Sparkles className="w-4 h-4 text-muted-foreground" />}
                        <span className="font-semibold text-xs capitalize">{t.provider[`offerType${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof t.provider]}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {c}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="offer-message">{t.provider.offerMessage}</Label>
              <Textarea
                id="offer-message"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={4}
                placeholder={t.provider.offerMessagePlaceholder}
                data-testid="input-offer-message"
              />
            </div>

            <div>
              <Label htmlFor="offer-price">{t.provider.offerPrice}</Label>
              <Input
                id="offer-price"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="€"
                data-testid="input-offer-price"
              />
            </div>

            {balance && (
              <div className={`text-sm p-3 rounded-lg ${canSend ? "bg-primary/5" : "bg-destructive/10 text-destructive"}`} data-testid="offer-confirm-text">
                {canSend
                  ? t.provider.offerConfirm
                      .replace("{cost}", String(cost))
                      .replace("{balance}", String(balance.total))
                      .replace("{after}", String(afterBalance))
                  : t.provider.offerInsufficient}
              </div>
            )}

            {error && (
              <div className="text-sm p-3 rounded-lg bg-destructive/10 text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferProject(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            {canSend ? (
              <Button onClick={submitOffer} disabled={submitting} data-testid="button-confirm-send-offer">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t.provider.sendOfferConfirm}
              </Button>
            ) : (
              <Link href="/pricing">
                <Button data-testid="button-go-pricing">{t.provider.goToPricing}</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
