import { useState } from "react";
import {
  useListCompanies, useUpdateCompany, useDeleteCompany,
  getListCompaniesQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  MoreHorizontal, CheckCircle2, XCircle, Clock, Trash2, Loader2,
  Plus, Building2, Search, PauseCircle, ExternalLink, Star
} from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/lib/language-context";

function AddCompanyDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useLanguage();
  const { categories } = useCategories("service");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "", contactName: "", email: "", phone: "",
    city: "", description: "", website: "", workerType: "company",
  });
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (s: string) =>
    setServiceTypes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTypes.length) { setError(t.admin.selectOneService); return; }
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = {
        companyName: form.companyName, contactName: form.contactName, email: form.email,
        phone: form.phone, city: form.city, serviceTypes, workerType: form.workerType,
      };
      if (form.description.trim()) body.description = form.description;
      if (form.website.trim()) body.website = form.website;
      const res = await fetch("/api/companies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? t.admin.failed); return; }
      onCreated(); onClose();
      setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", description: "", website: "", workerType: "company" });
      setServiceTypes([]);
    } catch { setError(t.admin.connectionErrorShort); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {t.admin.compAdd}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fCompanyName}</Label><Input value={form.companyName} onChange={set("companyName")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>{t.admin.fContactPerson}</Label><Input value={form.contactName} onChange={set("contactName")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fEmail}</Label><Input type="email" value={form.email} onChange={set("email")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>{t.admin.fPhone}</Label><Input value={form.phone} onChange={set("phone")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fCity}</Label><Input value={form.city} onChange={set("city")} required disabled={loading} /></div>
            <div className="space-y-1.5">
              <Label>{t.admin.type}</Label>
              <Select value={form.workerType} onValueChange={(v) => setForm((f) => ({ ...f, workerType: v }))}>
                <SelectTrigger disabled={loading}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{t.admin.company}</SelectItem>
                  <SelectItem value="individual">{t.admin.individual}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.fServices}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button key={cat.key} type="button" disabled={loading} onClick={() => toggle(cat.key)}
                  className={`text-xs rounded px-2 py-1.5 border transition-colors text-left ${serviceTypes.includes(cat.key) ? "bg-[#1a3a6e] text-white border-[#1a3a6e]" : "bg-white text-gray-500 border-gray-200 hover:border-[#1a3a6e]"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label>{t.admin.fDescriptionOpt}</Label><Textarea value={form.description} onChange={set("description")} disabled={loading} rows={2} /></div>
          <div className="space-y-1.5"><Label>{t.admin.fWebsite}</Label><Input value={form.website} onChange={set("website")} disabled={loading} placeholder={t.admin.phWebsite} /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t.admin.cancel}</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.admin.saving}</> : t.admin.compAdd}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Company = {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  serviceTypes?: string[] | null;
  workerType: string;
  description?: string | null;
  website?: string | null;
  status: string;
  createdAt: string;
  featuredOnHome?: boolean | null;
};

function CompanyDrawer({ company, onClose, onAction, onToggleFeatured }: { company: Company; onClose: () => void; onAction: (id: number, status: string) => void; onToggleFeatured: (id: number, current: boolean) => void }) {
  const { t } = useLanguage();
  const { categories } = useCategories("service");
  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-[480px] max-w-full overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1a3a6e]" />
            {company.companyName}
          </SheetTitle>
          <div className="mt-1"><StatusBadge status={company.status} /></div>
        </SheetHeader>

        <div className="py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.colContact}</span><span className="font-medium">{company.contactName}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.type}</span><span>{company.workerType === "individual" ? t.admin.individual : t.admin.company}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.email}</span><span className="text-blue-700">{company.email}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.phone}</span><span>{company.phone}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.city}</span><span>{company.city}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">{t.admin.colJoined}</span><span>{format(new Date(company.createdAt), "MMM d, yyyy")}</span></div>
          </div>

          {company.website && (
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">{t.admin.website}</span>
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                {company.website} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {company.description && (
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">{t.admin.description}</span>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded p-3 border border-gray-100">{company.description}</p>
            </div>
          )}

          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1.5">{t.admin.colServices}</span>
            <div className="flex flex-wrap gap-1.5">
              {(company.serviceTypes ?? []).filter(s => categories.some(c => c.key === s)).map((s) => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">{categories.find(c => c.key === s)?.label ?? s}</span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            {/* Featured on Home toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${company.featuredOnHome ? "fill-amber-400 text-amber-400" : "text-amber-300"}`} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Featured on Home</p>
                  <p className="text-xs text-gray-500">Shfaqet në karusel të faqes kryesore</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={company.featuredOnHome ? "default" : "outline"}
                className={company.featuredOnHome ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 h-7 text-xs" : "border-amber-300 text-amber-700 hover:bg-amber-50 h-7 text-xs"}
                onClick={() => { onToggleFeatured(company.id, !!company.featuredOnHome); onClose(); }}
              >
                {company.featuredOnHome ? "Hiq nga karusel" : "Shto në karusel"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t.admin.setStatus}</p>
              {company.status === "approved" && (
                <a
                  href={`/companies/${company.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" /> {t.admin.viewPublicProfile}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => { onAction(company.id, "approved"); onClose(); }}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {t.admin.stApproved}
              </Button>
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => { onAction(company.id, "suspended"); onClose(); }}>
                <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> {t.admin.stSuspended}
              </Button>
              <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                onClick={() => { onAction(company.id, "pending"); onClose(); }}>
                <Clock className="mr-1.5 h-3.5 w-3.5" /> {t.admin.stPendingReview}
              </Button>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => { onAction(company.id, "rejected"); onClose(); }}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> {t.admin.stRejected}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminCompanies() {
  const { t } = useLanguage();
  const { categories } = useCategories("service");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: companies, isLoading } = useListCompanies();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleAction = (id: number, status: string) => {
    updateCompany.mutate({ id, data: { status } }, { onSuccess: invalidate });
  };

  const handleToggleFeatured = (id: number, current: boolean) => {
    updateCompany.mutate({ id, data: { featuredOnHome: !current } }, { onSuccess: invalidate });
  };

  const handleDelete = () => {
    if (deleteTarget === null) return;
    deleteCompany.mutate({ id: deleteTarget }, { onSuccess: invalidate });
    setDeleteTarget(null);
  };

  const filtered = (companies ?? []).filter((c) => {
    const matchSearch = !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.compTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.admin.totalRegistrations.replace("{n}", String(companies?.length ?? 0))}</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> {t.admin.compAdd}
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder={t.admin.searchCompanies} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.allStatuses}</SelectItem>
            <SelectItem value="pending">{t.admin.stPendingReview}</SelectItem>
            <SelectItem value="approved">{t.admin.stApproved}</SelectItem>
            <SelectItem value="suspended">{t.admin.stSuspended}</SelectItem>
            <SelectItem value="rejected">{t.admin.stRejected}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colCompany}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colContact}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.description}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colServices}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colLocation}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.date}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.status}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Karusel</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!isLoading && filtered.map((company) => (
              <TableRow key={company.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDrawerCompany(company as Company)}>
                <TableCell className="font-medium text-sm">{company.companyName}</TableCell>
                <TableCell>
                  <div className="text-sm">{company.contactName}</div>
                  <div className="text-xs text-gray-500">{company.email}</div>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  {company.description ? (
                    <span className="text-xs text-gray-500 truncate block">{company.description}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[120px]">
                    {(company.serviceTypes ?? []).filter(s => categories.some(c => c.key === s)).slice(0, 2).map((s: string) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">{categories.find(c => c.key === s)?.label ?? s}</span>
                    ))}
                    {(company.serviceTypes ?? []).filter(s => categories.some(c => c.key === s)).length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">+{(company.serviceTypes ?? []).filter(s => categories.some(c => c.key === s)).length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{company.city}</TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(company.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell><StatusBadge status={company.status} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button
                    title={company.featuredOnHome ? "Hiq nga karusel" : "Shto në karusel"}
                    onClick={() => handleToggleFeatured(company.id, !!company.featuredOnHome)}
                    className={`p-1.5 rounded transition-colors ${company.featuredOnHome ? "text-amber-500 hover:text-amber-600" : "text-gray-300 hover:text-amber-400"}`}
                  >
                    <Star className={`h-4 w-4 ${company.featuredOnHome ? "fill-amber-400" : ""}`} />
                  </button>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t.admin.actions}</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <a href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" /> {t.admin.viewPublicProfile}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-400 font-normal">{t.admin.setStatus}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "approved")}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {t.admin.stApproved}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "suspended")}>
                        <PauseCircle className="mr-2 h-4 w-4 text-orange-500" /> {t.admin.stSuspended}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "pending")}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> {t.admin.stPendingReview}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "rejected")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> {t.admin.stRejected}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(company.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> {t.admin.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-gray-400">{t.admin.noCompaniesFound}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddCompanyDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={invalidate} />

      {drawerCompany && (
        <CompanyDrawer
          company={drawerCompany}
          onClose={() => setDrawerCompany(null)}
          onAction={(id, status) => { handleAction(id, status); setDrawerCompany(null); }}
          onToggleFeatured={(id, current) => { handleToggleFeatured(id, current); setDrawerCompany(null); }}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title={t.admin.compDelete}
          description={t.admin.confirmDeleteCompany}
          confirmLabel={t.admin.delete}
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
