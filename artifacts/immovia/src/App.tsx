import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { Layout } from "@/components/layout/layout";

import Home from "@/pages/home";
import SubmitProject from "@/pages/submit-project";
import RegisterCompany from "@/pages/register-company";
import Companies from "@/pages/companies";
import AdminDashboard from "@/pages/admin";
import Chat from "@/pages/chat";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/submit-project" component={SubmitProject} />
        <Route path="/register-company" component={RegisterCompany} />
        <Route path="/companies" component={Companies} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
