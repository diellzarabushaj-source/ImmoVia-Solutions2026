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
  Plus, Building2, Search, PauseCircle, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CATEGORIES, getCategoryLabel, resolveCategoryLabel } from "@/lib/categories";

function AddCompanyDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
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
    if (!serviceTypes.length) { setError("Select at least one service type."); return; }
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
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? "Failed."); return; }
      onCreated(); onClose();
      setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", description: "", website: "", workerType: "company" });
      setServiceTypes([]);
    } catch { setError("Connection error."); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Add Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Company Name *</Label><Input value={form.companyName} onChange={set("companyName")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>Contact Person *</Label><Input value={form.contactName} onChange={set("contactName")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={set("phone")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>City *</Label><Input value={form.city} onChange={set("city")} required disabled={loading} /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.workerType} onValueChange={(v) => setForm((f) => ({ ...f, workerType: v }))}>
                <SelectTrigger disabled={loading}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Services *</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} type="button" disabled={loading} onClick={() => toggle(cat.key)}
                  className={`text-xs rounded px-2 py-1.5 border transition-colors text-left ${serviceTypes.includes(cat.key) ? "bg-[#1a3a6e] text-white border-[#1a3a6e]" : "bg-white text-gray-500 border-gray-200 hover:border-[#1a3a6e]"}`}>
                  {getCategoryLabel(cat, "en")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={set("description")} disabled={loading} rows={2} /></div>
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={set("website")} disabled={loading} placeholder="https://…" /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Company"}
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
};

function CompanyDrawer({ company, onClose, onAction }: { company: Company; onClose: () => void; onAction: (id: number, status: string) => void }) {
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
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Contact</span><span className="font-medium">{company.contactName}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Type</span><span className="capitalize">{company.workerType}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Email</span><span className="text-blue-700">{company.email}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Phone</span><span>{company.phone}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">City</span><span>{company.city}</span></div>
            <div><span className="text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Registered</span><span>{format(new Date(company.createdAt), "MMM d, yyyy")}</span></div>
          </div>

          {company.website && (
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Website</span>
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                {company.website} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {company.description && (
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Description</span>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded p-3 border border-gray-100">{company.description}</p>
            </div>
          )}

          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1.5">Services</span>
            <div className="flex flex-wrap gap-1.5">
              {(company.serviceTypes ?? []).filter(s => s !== "other" && CATEGORIES.some(c => c.key === s)).map((s) => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">{resolveCategoryLabel(s, "en")}</span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Set status →</p>
              {company.status === "approved" && (
                <a
                  href={`/companies/${company.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" /> View public profile
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => { onAction(company.id, "approved"); onClose(); }}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> approved
              </Button>
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => { onAction(company.id, "suspended"); onClose(); }}>
                <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> suspended
              </Button>
              <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                onClick={() => { onAction(company.id, "pending"); onClose(); }}>
                <Clock className="mr-1.5 h-3.5 w-3.5" /> pending
              </Button>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => { onAction(company.id, "rejected"); onClose(); }}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> rejected
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminCompanies() {
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
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">{companies?.length ?? 0} total registrations</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Company
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search companies…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">Company</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Contact</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Description</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Services</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Location</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
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
                    {(company.serviceTypes ?? []).filter(s => s !== "other" && CATEGORIES.some(c => c.key === s)).slice(0, 2).map((s: string) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">{resolveCategoryLabel(s, "en")}</span>
                    ))}
                    {(company.serviceTypes ?? []).filter(s => s !== "other" && CATEGORIES.some(c => c.key === s)).length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">+{(company.serviceTypes ?? []).filter(s => s !== "other" && CATEGORIES.some(c => c.key === s)).length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{company.city}</TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(company.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell><StatusBadge status={company.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <a href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" /> View public profile
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-400 font-normal">Set status →</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "approved")}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> approved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "suspended")}>
                        <PauseCircle className="mr-2 h-4 w-4 text-orange-500" /> suspended
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "pending")}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(company.id, "rejected")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> rejected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(company.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400">No companies found.</TableCell></TableRow>
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
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title="Delete Company"
          description="Permanently delete this company registration? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
