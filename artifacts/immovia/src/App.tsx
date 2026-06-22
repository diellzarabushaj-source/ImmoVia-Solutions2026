import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/layout";

import Home from "@/pages/home";
import SubmitProject from "@/pages/submit-project";
import RegisterCompany from "@/pages/register-company";
import Companies from "@/pages/companies";
import AdminDashboard from "@/pages/admin";
import Chat from "@/pages/chat";
import Contact from "@/pages/contact";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Portfolio from "@/pages/portfolio";
import PublicProfile from "@/pages/public-profile";
import CompanyProfile from "@/pages/company-profile";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Pricing from "@/pages/pricing";
import ProviderBilling from "@/pages/provider-billing";
import PaymentSuccess from "@/pages/payment-success";
import RegistrationPaymentSuccess from "@/pages/registration-payment-success";
import ProviderOnboarding from "@/pages/provider-onboarding";
import PackagePaymentSuccess from "@/pages/package-payment-success";
import SignupComplete from "@/pages/signup-complete";
import ProviderWelcome from "@/pages/provider-welcome";
import ProviderDashboard from "@/pages/provider";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Faq from "@/pages/faq";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// REQUIRED — resolves the publishable key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace; wouter's setLocation
// prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk" as const,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo-color.png`,
  },
  variables: {
    colorPrimary: "#1e3a5f",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#0f172a",
    colorNeutral: "#cbd5e1",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-[#1e3a5f] font-semibold",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-[#1e3a5f]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-slate-700",
    logoBox: "flex justify-center",
    logoImage: "h-14 w-auto object-contain",
    socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-900",
    footerAction: "bg-slate-50 border-t border-slate-100",
    dividerLine: "bg-slate-200",
    alert: "border border-red-100 bg-red-50",
    otpCodeFieldInput: "border-slate-200",
    formFieldRow: "gap-3",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/signup-complete`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

// Invalidates React Query cache when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Only scroll to top for clean path changes (not hash jumps like /#how-it-works)
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location]);
  return null;
}

function Router() {
  return (
    <Layout>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/submit-project" component={SubmitProject} />
        <Route path="/register-company" component={RegisterCompany} />
        <Route path="/companies" component={Companies} />
        <Route path="/companies/:id" component={CompanyProfile} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/registration-payment-success" component={RegistrationPaymentSuccess} />
        <Route path="/provider-onboarding" component={ProviderOnboarding} />
        <Route path="/package-payment-success" component={PackagePaymentSuccess} />
        <Route path="/signup-complete" component={SignupComplete} />
        <Route path="/chat" component={Chat} />
        <Route path="/contact" component={Contact} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/profile" component={Profile} />
        <Route path="/dashboard/portfolio" component={Portfolio} />
        <Route path="/company/:slug" component={PublicProfile} />
        <Route path="/provider-welcome" component={ProviderWelcome} />
        <Route path="/provider" component={ProviderDashboard} />
        <Route path="/provider/billing" component={ProviderBilling} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/faq" component={Faq} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <LanguageProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ClerkQueryClientCacheInvalidator />
            <TooltipProvider>
              <Switch>
                {/* REQUIRED — /*? matches both the bare URL and Clerk's OAuth sub-paths */}
                <Route path="/sign-in/*?" component={SignInPage} />
                <Route path="/sign-up/*?" component={SignUpPage} />
                {/* Admin routes bypass the public Layout intentionally */}
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/:rest*" component={AdminDashboard} />
                <Route component={Router} />
              </Switch>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
