import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "pending":
    case "pending_review":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Pending Review</Badge>;
    case "approved":
    case "matched":
    case "open":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs capitalize">{status === "matched" ? "Open / Public" : status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "rejected":
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs capitalize">{status === "cancelled" ? "Rejected" : "Rejected"}</Badge>;
    case "suspended":
      return <Badge variant="outline" className="bg-red-900/10 text-red-900 border-red-300 text-xs">Suspended</Badge>;
    case "reviewing":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Reviewing</Badge>;
    case "draft":
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">Draft</Badge>;
    case "accepted":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Accepted</Badge>;
    case "open":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Open</Badge>;
    case "resolved":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Resolved</Badge>;
    case "dismissed":
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">Dismissed</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}
