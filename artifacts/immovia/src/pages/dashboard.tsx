import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  MessageSquare,
  Star,
  Image as ImageIcon,
  Briefcase,
  Loader2,
  BadgeCheck,
  Settings,
} from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isContractor = user.role === "contractor";

  const tiles = isContractor
    ? [
        { icon: User, label: t.dashboard.profile, href: "/dashboard/profile", desc: t.dashboard.profileDesc },
        { icon: ImageIcon, label: t.dashboard.portfolio, href: "/dashboard/profile", desc: t.dashboard.portfolioDesc, soon: true },
        { icon: MessageSquare, label: t.dashboard.inbox, href: "/dashboard/inbox", desc: t.dashboard.inboxDesc, soon: true },
        { icon: Star, label: t.dashboard.reviews, href: "/dashboard/reviews", desc: t.dashboard.reviewsContractorDesc, soon: true },
      ]
    : [
        { icon: User, label: t.dashboard.profile, href: "/dashboard/profile", desc: t.dashboard.profileDesc },
        { icon: Briefcase, label: t.dashboard.myProjects, href: "/submit-project", desc: t.dashboard.myProjectsDesc },
        { icon: MessageSquare, label: t.dashboard.inbox, href: "/dashboard/inbox", desc: t.dashboard.inboxDesc, soon: true },
        { icon: Star, label: t.dashboard.reviews, href: "/dashboard/reviews", desc: t.dashboard.reviewsHomeownerDesc, soon: true },
      ];

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-serif font-bold" data-testid="dashboard-greeting">
              {t.dashboard.welcome}, {user.fullName.split(" ")[0]}
            </h1>
            {isContractor && user.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" />
                {t.dashboard.verified}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {isContractor ? t.dashboard.contractorSubtitle : t.dashboard.homeownerSubtitle}
          </p>
        </div>
        <Link href="/dashboard/profile">
          <Button variant="outline" size="sm" data-testid="button-settings">
            <Settings className="w-4 h-4 mr-2" />
            {t.dashboard.editProfile}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {tiles.map((tile, i) => (
          <Link key={i} href={tile.href}>
            <Card className="p-5 h-full hover:shadow-md hover:border-primary/40 transition-all cursor-pointer relative">
              {tile.soon && (
                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase">
                  {t.dashboard.soon}
                </span>
              )}
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <tile.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{tile.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tile.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <h2 className="text-xl font-bold mb-2">{t.dashboard.completeProfile}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t.dashboard.completeProfileDesc}</p>
        <Link href="/dashboard/profile">
          <Button data-testid="button-complete-profile">{t.dashboard.editProfile}</Button>
        </Link>
      </Card>
    </div>
  );
}
