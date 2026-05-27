import { useState } from "react";
import {
  useListProjects, useListCompanies, useUpdateProject, useUpdateCompany,
  getListProjectsQueryKey, getListCompaniesQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

export function AdminPending() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"projects" | "companies">("projects");

  const { data: projects, isLoading: projectsLoading } = useListProjects({ status: "pending" });
  const { data: companies, isLoading: companiesLoading } = useListCompanies({ status: "pending" });

  const updateProject = useUpdateProject();
  const updateCompany = useUpdateCompany();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    qc.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const pendingProjectCount = projects?.length ?? 0;
  const pendingCompanyCount = companies?.length ?? 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          Items awaiting your approval — {pendingProjectCount} project{pendingProjectCount !== 1 ? "s" : ""}, {pendingCompanyCount} compan{pendingCompanyCount !== 1 ? "ies" : "y"}
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "projects" ? "bg-[#1a3a6e] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <Clock className="h-4 w-4" />
          Projects
          {pendingProjectCount > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${tab === "projects" ? "bg-white text-[#1a3a6e]" : "bg-[#1a3a6e] text-white"}`}>
              {pendingProjectCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("companies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "companies" ? "bg-[#1a3a6e] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <Clock className="h-4 w-4" />
          Companies
          {pendingCompanyCount > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${tab === "companies" ? "bg-white text-[#1a3a6e]" : "bg-[#1a3a6e] text-white"}`}>
              {pendingCompanyCount}
            </span>
          )}
        </button>
      </div>

      {tab === "projects" && (
        <Card className="border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">Client</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Budget</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Submitted</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Description</TableHead>
                <TableHead className="text-right text-xs font-semibold text-gray-600">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsLoading && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
              )}
              {!projectsLoading && (projects ?? []).map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium text-sm">{p.fullName}</div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{p.projectType}</TableCell>
                  <TableCell className="text-sm">{p.city}</TableCell>
                  <TableCell className="text-sm text-gray-600">{p.budget ?? "—"}</TableCell>
                  <TableCell className="text-xs text-gray-500">{format(new Date(p.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">{p.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 h-7"
                        onClick={() => updateProject.mutate({ id: p.id, data: { status: "matched" } }, { onSuccess: invalidateAll })}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7"
                        onClick={() => updateProject.mutate({ id: p.id, data: { status: "cancelled" } }, { onSuccess: invalidateAll })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!projectsLoading && (projects ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                    <span>All caught up — no pending projects</span>
                  </div>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === "companies" && (
        <Card className="border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">Company</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Contact</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Services</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Submitted</TableHead>
                <TableHead className="text-right text-xs font-semibold text-gray-600">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companiesLoading && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
              )}
              {!companiesLoading && (companies ?? []).map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-sm">{c.companyName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{c.contactName}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(c.serviceTypes ?? []).slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 capitalize">{s}</span>
                      ))}
                      {(c.serviceTypes ?? []).length > 3 && <span className="text-xs text-gray-400">+{(c.serviceTypes ?? []).length - 3}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.city}</TableCell>
                  <TableCell className="text-xs text-gray-500">{format(new Date(c.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 h-7"
                        onClick={() => updateCompany.mutate({ id: c.id, data: { status: "approved" } }, { onSuccess: invalidateAll })}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7"
                        onClick={() => updateCompany.mutate({ id: c.id, data: { status: "rejected" } }, { onSuccess: invalidateAll })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!companiesLoading && (companies ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                    <span>All caught up — no pending companies</span>
                  </div>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
