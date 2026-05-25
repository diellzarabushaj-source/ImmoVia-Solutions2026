import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useListCompanies } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase, CalendarDays, Globe, Mail, Phone, Clock, FileText, User, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Companies() {
  const { t } = useLanguage();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceFilter = params.get("service") ?? "";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeService, setActiveService] = useState(serviceFilter);

  useEffect(() => {
    setActiveService(serviceFilter);
  }, [serviceFilter]);

  const { data: companies, isLoading, isError } = useListCompanies();

  const approvedCompanies = companies?.filter(c => c.status === "approved") || [];

  const filteredCompanies = approvedCompanies.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.companyName.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.serviceTypes.some(s => s.toLowerCase().includes(term));
    const matchesService = activeService
      ? c.serviceTypes.some(s => s === activeService)
      : true;
    return matchesSearch && matchesService;
  });

  const serviceOptions = [
    { key: "", label: t.companies.all ?? "All" },
    { key: "renovation", label: t.offers.renovation },
    { key: "construction", label: t.offers.construction },
    { key: "interior", label: t.offers.interior },
    { key: "exterior", label: t.offers.exterior },
    { key: "plumbing", label: t.offers.plumbing },
    { key: "electric", label: t.offers.electric },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">{t.companies.title}</h1>
          <p className="text-muted-foreground">{t.companies.subtitle ?? "Find trusted professionals for your project"}</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.companies.search}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Service filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {serviceOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setActiveService(opt.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeService === opt.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 bg-destructive/10 rounded-lg text-destructive">
          <p>{t.common.error}</p>
        </div>
      )}

      {!isLoading && !isError && filteredCompanies.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-border border-dashed">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">{t.companies.noResults}</h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm || activeService ? "Try adjusting your filters" : "No approved companies found"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => {
          const isIndividual = company.workerType === "individual";
          return (
            <Card key={company.id} className="overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-xl truncate">{company.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 text-sm">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {company.city}
                    </CardDescription>
                  </div>
                  <Badge variant={isIndividual ? "outline" : "secondary"} className="flex-shrink-0 flex items-center gap-1">
                    {isIndividual
                      ? <><User className="h-3 w-3" />{t.companies.individual ?? "Individual"}</>
                      : <><Building2 className="h-3 w-3" />{t.companies.company ?? "Company"}</>
                    }
                  </Badge>
                </div>

                {/* Pricing badge */}
                <div className="mt-2">
                  {isIndividual && company.hourlyRate ? (
                    <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{company.hourlyRate} €/{t.companies.hour ?? "hr"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{t.companies.contractBased ?? "Contract-based"}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-5 flex-1 flex flex-col">
                {company.description && (
                  <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
                    {company.description}
                  </p>
                )}

                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t.companies.services}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.serviceTypes.map(service => (
                      <Badge key={service} variant="secondary" className="font-normal capitalize">
                        {t.offers[service as keyof typeof t.offers] || service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {company.yearsExperience ? `${company.yearsExperience} ${t.companies.years} exp` : "New"}
                      </span>
                    </div>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <a href={`mailto:${company.email}`}>
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        {t.companies.contact ?? "Contact"}
                      </a>
                    </Button>
                    {company.phone && (
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <a href={`tel:${company.phone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          {t.companies.call ?? "Call"}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
