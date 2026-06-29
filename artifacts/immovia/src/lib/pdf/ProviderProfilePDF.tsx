import {
  Document, Page, View, Text, Image, StyleSheet, Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf" },
  ],
});

const PRIMARY = "#1a3a6e";
const LIGHT_BLUE = "#3b82f6";
const GRAY = "#64748b";
const LIGHT_GRAY = "#f1f5f9";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", paddingBottom: 40 },
  header: { backgroundColor: PRIMARY, padding: "24 32 20 32", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 120, height: 36, objectFit: "contain" },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 9, marginTop: 3 },
  accentBar: { height: 4, backgroundColor: LIGHT_BLUE },
  body: { padding: "24 32" },
  profileRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: `2 solid ${BORDER}` },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: LIGHT_GRAY, alignItems: "center", justifyContent: "center", border: `2 solid ${BORDER}` },
  avatarInitial: { fontSize: 28, fontWeight: "bold", color: PRIMARY },
  profileInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: 22, fontWeight: "bold", color: PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 12, color: GRAY, marginBottom: 6 },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: { backgroundColor: `${LIGHT_BLUE}18`, color: LIGHT_BLUE, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 8.5, fontWeight: "bold" },
  badgePrimary: { backgroundColor: PRIMARY, color: "#fff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 8.5 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingBottom: 4, borderBottom: `1.5 solid ${LIGHT_BLUE}` },
  twoCol: { flexDirection: "row", gap: 16 },
  infoBox: { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 6, padding: "10 12", border: `1 solid ${BORDER}` },
  infoLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
  descText: { fontSize: 10, color: "#374151", lineHeight: 1.6 },
  serviceTag: { backgroundColor: LIGHT_GRAY, color: PRIMARY, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 9, border: `1 solid ${BORDER}`, marginRight: 6, marginBottom: 6 },
  serviceRow: { flexDirection: "row", flexWrap: "wrap" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: PRIMARY, padding: "10 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 8 },
  footerBrand: { color: "#ffffff", fontSize: 9, fontWeight: "bold" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  star: { color: "#f59e0b", fontSize: 11 },
  ratingText: { fontSize: 10, color: GRAY },
});

export interface ProviderPDFData {
  companyName: string;
  contactName: string;
  city: string;
  workerType: string;
  serviceTypes: string[];
  description: string | null;
  yearsExperience: number | null;
  hourlyRate: number | null;
  licenseNumber: string | null;
  profilePhoto?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  logoBase64?: string | null;
  generatedAt?: string;
}

export function ProviderProfilePDF({ data }: { data: ProviderPDFData }) {
  const initial = (data.companyName ?? data.contactName ?? "?").charAt(0).toUpperCase();
  const date = data.generatedAt ?? new Date().toLocaleDateString("de-CH");
  const stars = data.avgRating ? Math.round(data.avgRating) : 0;

  return (
    <Document title={`${data.companyName} — ImmoVia365 Profil`} author="ImmoVia365">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.logoBase64 ? (
            <Image src={data.logoBase64} style={styles.logo} />
          ) : (
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>ImmoVia365</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Service Provider</Text>
            <Text style={styles.headerSub}>Profil · {date}</Text>
          </View>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* Profile row */}
          <View style={styles.profileRow}>
            {data.profilePhoto ? (
              <Image src={data.profilePhoto} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{data.companyName}</Text>
              {data.contactName && data.contactName !== data.companyName && (
                <Text style={styles.subtitle}>{data.contactName}</Text>
              )}
              <View style={styles.badgeRow}>
                <Text style={styles.badgePrimary}>{data.city}</Text>
                <Text style={styles.badge}>{data.workerType === "company" ? "Unternehmen" : "Einzelperson"}</Text>
                {data.yearsExperience && (
                  <Text style={styles.badge}>{data.yearsExperience} Jahre Erfahrung</Text>
                )}
              </View>
              {stars > 0 && (
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</Text>
                  <Text style={styles.ratingText}>{data.avgRating?.toFixed(1)} ({data.reviewCount} Bewertungen)</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Key info */}
          <View style={[styles.section]}>
            <Text style={styles.sectionTitle}>Übersicht</Text>
            <View style={styles.twoCol}>
              {data.hourlyRate && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Stundensatz</Text>
                  <Text style={styles.infoValue}>CHF {data.hourlyRate}/h</Text>
                </View>
              )}
              {data.yearsExperience && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Berufserfahrung</Text>
                  <Text style={styles.infoValue}>{data.yearsExperience} Jahre</Text>
                </View>
              )}
              {data.licenseNumber && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Lizenznummer</Text>
                  <Text style={styles.infoValue}>{data.licenseNumber}</Text>
                </View>
              )}
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Standort</Text>
                <Text style={styles.infoValue}>{data.city}, Schweiz</Text>
              </View>
            </View>
          </View>

          {/* Services */}
          {data.serviceTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leistungen</Text>
              <View style={styles.serviceRow}>
                {data.serviceTypes.map((s, i) => (
                  <Text key={i} style={styles.serviceTag}>{s}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {data.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Über uns</Text>
              <Text style={styles.descText}>{data.description}</Text>
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
