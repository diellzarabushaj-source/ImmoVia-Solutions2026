import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";

const PRIMARY = "#1a3a6e";
const LIGHT_BLUE = "#3b82f6";
const GRAY = "#64748b";
const LIGHT_GRAY = "#f1f5f9";
const BORDER = "#e2e8f0";
const AMBER = "#f59e0b";

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontSize: 10, color: "#1e293b", paddingBottom: 40 },
  header: { backgroundColor: PRIMARY, padding: "24 32 20 32", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 120, height: 36, objectFit: "contain" },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 9, marginTop: 3 },
  accentBar: { height: 4, backgroundColor: LIGHT_BLUE },
  body: { padding: "24 32" },
  projectTitle: { fontSize: 22, fontWeight: "bold", color: PRIMARY, marginBottom: 6 },
  typeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  typeBadge: { backgroundColor: `${LIGHT_BLUE}18`, color: LIGHT_BLUE, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 8.5, fontWeight: "bold" },
  cityBadge: { backgroundColor: PRIMARY, color: "#fff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 8.5 },
  statusBadge: { backgroundColor: "#dcfce7", color: "#16a34a", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 8.5 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingBottom: 4, borderBottom: `1.5 solid ${LIGHT_BLUE}` },
  grid2: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  grid3: { flexDirection: "row", gap: 10 },
  infoBox: { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 6, padding: "10 12", border: `1 solid ${BORDER}` },
  infoLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
  descText: { fontSize: 10, color: "#374151", lineHeight: 1.6 },
  photoGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  photo: { width: 140, height: 96, borderRadius: 6, objectFit: "cover", border: `1 solid ${BORDER}` },
  highlightBox: { backgroundColor: `${LIGHT_BLUE}0d`, border: `1 solid ${LIGHT_BLUE}30`, borderRadius: 6, padding: "12 16", marginBottom: 16 },
  highlightText: { fontSize: 10, color: PRIMARY, lineHeight: 1.5 },
  budgetAmount: { fontSize: 20, fontWeight: "bold", color: AMBER, marginBottom: 2 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: PRIMARY, padding: "10 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 8 },
  footerBrand: { color: "#ffffff", fontSize: 9, fontWeight: "bold" },
  tagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { backgroundColor: LIGHT_GRAY, color: PRIMARY, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 9, border: `1 solid ${BORDER}` },
});

const BUDGET_LABELS: Record<string, string> = {
  "under-10k": "< CHF 10,000",
  "10k-50k": "CHF 10,000 – 50,000",
  "50k-100k": "CHF 50,000 – 100,000",
  "100k-500k": "CHF 100,000 – 500,000",
  "over-500k": "> CHF 500,000",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "So bald wie möglich",
  "1-3-months": "1–3 Monate",
  "3-6-months": "3–6 Monate",
  flexible: "Flexibel",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Klein",
  medium: "Mittel",
  large: "Gross",
  premium: "Premium",
};

export interface ProjectBriefData {
  title?: string | null;
  projectType: string;
  description: string;
  city: string;
  budget?: string | null;
  timeline?: string | null;
  size?: string | null;
  status?: string;
  photos?: string[];
  categoryLabels?: string[];
  logoBase64?: string | null;
  generatedAt?: string;
}

export function ProjectBriefPDF({ data }: { data: ProjectBriefData }) {
  const date = data.generatedAt ?? new Date().toLocaleDateString("de-CH");
  const types = data.categoryLabels?.length
    ? data.categoryLabels
    : data.projectType.split(",").map(k => k.trim());
  const displayTitle = data.title ?? types.join(", ");
  const photos = (data.photos ?? []).slice(0, 6);

  return (
    <Document title={`${displayTitle} — ImmoVia365 Projektmappe`} author="ImmoVia365">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.logoBase64 ? (
            <Image src={data.logoBase64} style={styles.logo} />
          ) : (
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>ImmoVia365</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Projektmappe</Text>
            <Text style={styles.headerSub}>Project Brief · {date}</Text>
          </View>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* Project title + tags */}
          <Text style={styles.projectTitle}>{displayTitle}</Text>
          <View style={styles.typeRow}>
            <Text style={styles.cityBadge}>{data.city}, Schweiz</Text>
            {types.map((t, i) => <Text key={i} style={styles.typeBadge}>{t}</Text>)}
            {data.status === "open" && <Text style={styles.statusBadge}>Aktiv</Text>}
          </View>

          <View style={styles.divider} />

          {/* Key specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projektdetails</Text>
            <View style={styles.grid3}>
              {data.size && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Projektgrösse</Text>
                  <Text style={styles.infoValue}>{SIZE_LABELS[data.size] ?? data.size}</Text>
                </View>
              )}
              {data.budget && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Budget</Text>
                  <Text style={styles.infoValue}>{BUDGET_LABELS[data.budget] ?? data.budget}</Text>
                </View>
              )}
              {data.timeline && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Zeitplan</Text>
                  <Text style={styles.infoValue}>{TIMELINE_LABELS[data.timeline] ?? data.timeline}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projektbeschreibung</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>{data.description}</Text>
            </View>
          </View>

          {/* Photos */}
          {photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projektfotos</Text>
              <View style={styles.photoGrid}>
                {photos.map((ph, i) => (
                  <Image key={i} src={ph} style={styles.photo} />
                ))}
              </View>
            </View>
          )}

          {/* Services */}
          {types.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gesuchte Leistungen</Text>
              <View style={styles.tagRow}>
                {types.map((t, i) => <Text key={i} style={styles.tag}>{t}</Text>)}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Erstellt über ImmoVia365 · www.immovia365.ch</Text>
          <Text style={styles.footerBrand}>ImmoVia365</Text>
        </View>
      </Page>
    </Document>
  );
}
