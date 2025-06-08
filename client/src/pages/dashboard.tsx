import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { TestResultsChart } from "@/components/dashboard/test-results-chart";
import { RecentRuns } from "@/components/dashboard/recent-runs";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Download, Plus, TestTubeDiagonal, CheckCircle, XCircle, Clock, Upload, FileText, Bug, FileX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DashboardMetrics {
  totalTests: number;
  passRate: string;
  failedTests: number;
  avgDuration: string;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const failureKanbanData = {
    columns: [
      {
        title: "New Failures",
        status: "new",
        bgColor: "bg-red-50 dark:bg-red-950/20",
        items: [],
      },
      {
        title: "In Progress", 
        status: "investigating",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        items: [],
      },
      {
        title: "Resolved",
        status: "resolved", 
        bgColor: "bg-green-50 dark:bg-green-950/20",
        items: [],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Testing Dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your automated and manual testing activities
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Test Run
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Tests"
            value={metrics?.totalTests || 0}
            change="+12%"
            changeType="positive"
            icon={TestTubeDiagonal}
            iconBgColor="bg-blue-100 dark:bg-blue-950"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <MetricsCard
            title="Pass Rate"
            value={metrics?.passRate || "0%"}
            change="+2.1%"
            changeType="positive"
            icon={CheckCircle}
            iconBgColor="bg-green-100 dark:bg-green-950"
            iconColor="text-green-600 dark:text-green-400"
          />
          <MetricsCard
            title="Failed Tests"
            value={metrics?.failedTests || 0}
            change="-8%"
            changeType="positive"
            icon={XCircle}
            iconBgColor="bg-red-100 dark:bg-red-950"
            iconColor="text-red-600 dark:text-red-400"
          />
          <MetricsCard
            title="Avg Duration"
            value={metrics?.avgDuration || "0m"}
            change="-5%"
            changeType="positive"
            icon={Clock}
            iconBgColor="bg-yellow-100 dark:bg-yellow-950"
            iconColor="text-yellow-600 dark:text-yellow-400"
          />
        </div>

        {/* Charts and Content */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Test Results Chart */}
          <div className="lg:col-span-2">
            <TestResultsChart />
          </div>

          {/* Recent Test Runs */}
          <div className="lg:col-span-1">
            <RecentRuns />
          </div>
        </div>

        {/* Additional Content Sections */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Failure Analysis Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Critical Failures</CardTitle>
              </div>
              <Link href="/automated/failure-analysis">
                <a className="text-sm text-primary hover:text-primary/80 font-medium">
                  View analysis →
                </a>
              </Link>
            </CardHeader>
            <CardContent>
              <KanbanBoard columns={failureKanbanData.columns} />
            </CardContent>
          </Card>

          {/* Manual Testing Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manual Testing</CardTitle>
              </div>
              <Link href="/manual/organize-cases">
                <a className="text-sm text-primary hover:text-primary/80 font-medium">
                  View all cases →
                </a>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Total Test Cases</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Active Test Runs</div>
                </div>
              </div>
              
              {/* Manual Test Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Passed</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-muted rounded-full h-2 mr-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: "0%"}}></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-muted rounded-full h-2 mr-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: "0%"}}></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-muted rounded-full h-2 mr-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: "0%"}}></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">0%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/automated/junit-upload">
                  <a className="relative group bg-muted p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary rounded-lg hover:bg-muted/80 block">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400">
                        <Upload className="w-6 h-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-foreground">Upload JUnit XML</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Upload test results from your CI/CD pipeline</p>
                    </div>
                  </a>
                </Link>

                <Link href="/manual/create-test-cases">
                  <a className="relative group bg-muted p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary rounded-lg hover:bg-muted/80 block">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-950 dark:text-green-400">
                        <Plus className="w-6 h-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-foreground">Create Test Case</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Design new manual test cases with rich editor</p>
                    </div>
                  </a>
                </Link>

                <Link href="/automated/failure-analysis">
                  <a className="relative group bg-muted p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary rounded-lg hover:bg-muted/80 block">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400">
                        <Bug className="w-6 h-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-foreground">Analyze Failures</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Investigate failed and flaky tests</p>
                    </div>
                  </a>
                </Link>

                <Link href="/automated/reports">
                  <a className="relative group bg-muted p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary rounded-lg hover:bg-muted/80 block">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-100 text-purple-600 group-hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-400">
                        <FileX className="w-6 h-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-foreground">Generate Report</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Create comprehensive test reports</p>
                    </div>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
