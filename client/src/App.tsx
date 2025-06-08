import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Pages
import Dashboard from "@/pages/dashboard";
import JUnitUpload from "@/pages/automated/junit-upload";
import TestResults from "@/pages/automated/test-results";
import FailureAnalysis from "@/pages/automated/failure-analysis";
import AutomatedReports from "@/pages/automated/reports";
import History from "@/pages/automated/history";
import CreateTestCases from "@/pages/manual/create-test-cases";
import ManualTestRuns from "@/pages/manual/test-runs";
import OrganizeCases from "@/pages/manual/organize-cases";
import ManualReports from "@/pages/manual/manual-reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/automated/junit-upload" component={JUnitUpload} />
      <Route path="/automated/test-results" component={TestResults} />
      <Route path="/automated/failure-analysis" component={FailureAnalysis} />
      <Route path="/automated/reports" component={AutomatedReports} />
      <Route path="/automated/history" component={History} />
      <Route path="/manual/create-test-cases" component={CreateTestCases} />
      <Route path="/manual/test-runs" component={ManualTestRuns} />
      <Route path="/manual/organize-cases" component={OrganizeCases} />
      <Route path="/manual/manual-reports" component={ManualReports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col w-0 flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
