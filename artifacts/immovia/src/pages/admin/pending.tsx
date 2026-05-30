import {
  useListProjects, useListCompanies, useUpdateProject, useUpdateCompany,
  getListProjectsQueryKey, getListCompaniesQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Building2, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/language-context";
import { resolveCategoryLabel, resolveTagLabel, resolveAnyLabel, type Lang } from "@/lib/categories";

export function AdminPending() {
  const qc = useQueryClient();
  const { language } = useLanguage();

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
          {pendingProjectCount} project{pendingProjectCount !== 1 ? "s" : ""} and {pendingCompanyCount} compan{pendingCompanyCount !== 1 ? "ies" : "y"} awaiting approval
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Projects */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-[#1a3a6e]" />
            <h2 className="text-sm font-semibold text-gray-700">Pending Projects</h2>
            {pendingProjectCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingProjectCount}</span>
            )}
          </div>
          <Card className="border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Client</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Type / City</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Budget</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Submitted</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-600">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
                )}
                {!projectsLoading && (projects ?? []).map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-sm">{p.fullName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">{p.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{resolveCategoryLabel(p.projectType, language as Lang)}</div>
                      {(p as {subcategory?: string | null}).subcategory && (
                        <div className="text-xs text-primary/70 flex items-center gap-1">
                          {resolveTagLabel((p as {subcategory?: string | null}).subcategory!, language as Lang)}
                          {(p as {subcategory?: string | null}).subcategory === "other" && (p as {subcategoryOtherText?: string | null}).subcategoryOtherText && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              {(p as {subcategoryOtherText?: string | null}).subcategoryOtherText}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{p.city}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{p.budget ?? "—"}</TableCell>
                    <TableCell className="text-xs text-gray-500">{format(new Date(p.createdAt), "MMM d")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 h-7 px-2.5 text-xs"
                          onClick={() => updateProject.mutate({ id: p.id, data: { status: "open" } }, { onSuccess: invalidateAll })}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> open
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                          onClick={() => updateProject.mutate({ id: p.id, data: { status: "cancelled" } }, { onSuccess: invalidateAll })}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> cancelled
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!projectsLoading && (projects ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-20 text-center text-gray-400 text-sm">
                    <div className="flex flex-col items-center gap-1.5">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                      <span>No pending projects</span>
                    </div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Pending Companies */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#1a3a6e]" />
            <h2 className="text-sm font-semibold text-gray-700">Pending Companies</h2>
            {pendingCompanyCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingCompanyCount}</span>
            )}
          </div>
          <Card className="border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Company</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Services</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Submitted</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-600">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
                )}
                {!companiesLoading && (companies ?? []).map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-sm">{c.companyName}</div>
                      <div className="text-xs text-gray-500">{c.contactName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(c.serviceTypes ?? []).slice(0, 2).map((s: string) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 capitalize">{resolveCategoryLabel(s, language as Lang)}</span>
                        ))}
                        {(c.serviceTypes ?? []).length > 2 && <span className="text-xs text-gray-400">+{(c.serviceTypes ?? []).length - 2}</span>}
                      </div>
                      {((c as {customServiceTags?: string[] | null}).customServiceTags ?? []).map((tag: string) => {
                        const pipeIdx = tag.indexOf("|");
                        const text = pipeIdx >= 0 ? tag.slice(pipeIdx + 1) : tag;
                        return (
                          <span key={tag} className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="opacity-60">Custom:</span> {text}
                          </span>
                        );
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{c.city}</TableCell>
                    <TableCell className="text-xs text-gray-500">{format(new Date(c.createdAt), "MMM d")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 h-7 px-2.5 text-xs"
                          onClick={() => updateCompany.mutate({ id: c.id, data: { status: "approved" } }, { onSuccess: invalidateAll })}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> approved
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                          onClick={() => updateCompany.mutate({ id: c.id, data: { status: "rejected" } }, { onSuccess: invalidateAll })}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> rejected
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!companiesLoading && (companies ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-20 text-center text-gray-400 text-sm">
                    <div className="flex flex-col items-center gap-1.5">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                      <span>No pending companies</span>
                    </div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
