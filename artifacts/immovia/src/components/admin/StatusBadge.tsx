import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-context";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  switch (status) {
    case "pending":
    case "pending_review":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">{t.admin.stPendingReview}</Badge>;
    case "open":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t.admin.stOpen}</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t.admin.stApproved}</Badge>;
    case "matched":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">{t.admin.stMatched}</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{t.admin.stRejected}</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">{t.admin.stCancelled}</Badge>;
    case "suspended":
      return <Badge variant="outline" className="bg-red-900/10 text-red-900 border-red-300 text-xs">{t.admin.stSuspended}</Badge>;
    case "reviewing":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{t.admin.stReviewing}</Badge>;
    case "draft":
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">{t.admin.stDraft}</Badge>;
    case "accepted":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t.admin.stAccepted}</Badge>;
    case "resolved":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t.admin.stResolved}</Badge>;
    case "dismissed":
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">{t.admin.stDismissed}</Badge>;
    case "verified":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t.admin.stVerified}</Badge>;
    case "unverified":
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">{t.admin.stUnverified}</Badge>;
    default:
      return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
  }
}
