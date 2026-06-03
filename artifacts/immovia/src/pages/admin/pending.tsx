import {
  useListProjects, useUpdateProject,
  getListProjectsQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/language-context";
import { useCategories } from "@/hooks/useCategories";

export function AdminPending() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const { categories } = useCategories("project");

  const { data: projects, isLoading: projectsLoading } = useListProjects({ status: "pending" });

  const updateProject = useUpdateProject();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const pendingProjectCount = projects?.length ?? 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.pendTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pendingProjectCount} {t.admin.navProjectsSub}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen className="h-4 w-4 text-[#1a3a6e]" />
          <h2 className="text-sm font-semibold text-gray-700">{t.admin.pendProjects}</h2>
          {pendingProjectCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingProjectCount}</span>
          )}
        </div>
        <Card className="border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colClient}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colTypeCity}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colBudget}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colSubmitted}</TableHead>
                <TableHead className="text-right text-xs font-semibold text-gray-600">{t.admin.colDecision}</TableHead>
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
                    <div className="text-sm font-medium">{categories.find(c => c.key === p.projectType)?.label ?? p.projectType}</div>
                    {(p as {subcategory?: string | null}).subcategory && (
                      <div className="text-xs text-primary/70 flex items-center gap-1">
                        {categories.flatMap(c => c.subcategories).find(s => s.key === (p as {subcategory?: string | null}).subcategory)?.label ?? (p as {subcategory?: string | null}).subcategory}
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
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t.admin.stOpen}
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                        onClick={() => updateProject.mutate({ id: p.id, data: { status: "cancelled" } }, { onSuccess: invalidateAll })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> {t.admin.stCancelled}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!projectsLoading && (projects ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-20 text-center text-gray-400 text-sm">
                  <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                    <span>{t.admin.ovNoPendingProjects}</span>
                  </div>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
