import {
  Hammer,
  Building2,
  Sofa,
  TreePine,
  Wrench,
  Plug,
  Paintbrush,
  ChefHat,
  SquareStack,
  Leaf,
  HelpCircle,
  Zap,
} from "lucide-react";
import type React from "react";

export const SERVICE_ICONS: Record<string, React.ElementType> = {
  renovation: Hammer,
  painting: Paintbrush,
  electrical: Zap,
  plumbing: Wrench,
  kitchen: ChefHat,
  flooring: SquareStack,
  interior_design: Sofa,
  cleaning: Leaf,
  other: HelpCircle,
  construction: Building2,
  interior: Sofa,
  exterior: TreePine,
  electric: Plug,
};

export const SIZE_COLORS: Record<string, string> = {
  small: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  large: "bg-indigo-50 text-indigo-700",
  premium: "bg-primary/10 text-primary",
};

export function resolvePhotoSrc(src: string): string {
  return src.startsWith("http") ? src : src.startsWith("/api") ? src : `/api/storage${src}`;
}

export function getPostedLabel(
  createdAt: string,
  listings: { today: string; yesterday: string; daysAgo: string },
): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return listings.today;
  if (diffDays === 1) return listings.yesterday;
  return `${diffDays} ${listings.daysAgo}`;
}

const AVATAR_GRADIENTS = [
  "from-blue-600 to-blue-800",
  "from-indigo-600 to-indigo-800",
  "from-primary to-blue-700",
  "from-sky-600 to-sky-800",
  "from-slate-600 to-slate-800",
];

export function avatarGradient(seed: string): string {
  return AVATAR_GRADIENTS[(seed.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
