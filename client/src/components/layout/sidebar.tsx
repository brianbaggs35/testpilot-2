import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bug, Gauge, Upload, List, AlertTriangle, FileText, History, Edit, PlayCircle, Folder, BarChart } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
];

const automatedNavigation = [
  { name: "JUnit XML Upload", href: "/automated/junit-upload", icon: Upload },
  { name: "Test Results", href: "/automated/test-results", icon: List },
  { name: "Failure Analysis", href: "/automated/failure-analysis", icon: AlertTriangle },
  { name: "Reports", href: "/automated/reports", icon: FileText },
  { name: "History", href: "/automated/history", icon: History },
];

const manualNavigation = [
  { name: "Create Test Cases", href: "/manual/create-test-cases", icon: Edit },
  { name: "Test Runs", href: "/manual/test-runs", icon: PlayCircle },
  { name: "Organize Cases", href: "/manual/organize-cases", icon: Folder },
  { name: "Manual Reports", href: "/manual/manual-reports", icon: BarChart },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-sidebar-background border-r border-sidebar-border">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Bug className="text-sidebar-primary-foreground h-4 w-4" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-sidebar-foreground">QA Platform</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-2">
            {/* Dashboard */}
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className={cn(
                      "mr-3 h-4 w-4",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                    )} />
                    {item.name}
                  </a>
                </Link>
              );
            })}
            
            {/* Automated Testing Section */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide px-2 py-2">
                Automated Testing
              </div>
              {automatedNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <item.icon className={cn(
                        "mr-3 h-4 w-4",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"
                      )} />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
            
            {/* Manual Testing Section */}
            <div className="space-y-1 pt-4">
              <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide px-2 py-2">
                Manual Testing
              </div>
              {manualNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <item.icon className={cn(
                        "mr-3 h-4 w-4",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"
                      )} />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
