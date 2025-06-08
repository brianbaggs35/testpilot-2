import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Users, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ManualTestRun, ManualTestCase, ManualTestExecution } from "@shared/schema";
import { generateManualTestReport } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

export default function ManualReports() {
  const [selectedTestRuns, setSelectedTestRuns] = useState<string[]>([]);
  const [reportType, setReportType] = useState("execution-summary");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: testRuns, isLoading: loadingRuns } = useQuery<ManualTestRun[]>({
    queryKey: ["/api/manual-test-runs"],
  });

  const { data: testCases } = useQuery<ManualTestCase[]>({
    queryKey: ["/api/manual-test-cases"],
  });

  const { data: executions } = useQuery<ManualTestExecution[]>({
    queryKey: ["/api/manual-test-executions"],
  });

  const handleTestRunSelection = (testRunId: string, checked: boolean) => {
    if (checked) {
      setSelectedTestRuns(prev => [...prev, testRunId]);
    } else {
      setSelectedTestRuns(prev => prev.filter(id => id !== testRunId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTestRuns.length === testRuns?.length) {
      setSelectedTestRuns([]);
    } else {
      setSelectedTestRuns(testRuns?.map(run => run.id.toString()) || []);
    }
  };

  const calculateReportMetrics = () => {
    if (!testRuns || !testCases || !executions) return null;

    const selectedRuns = testRuns.filter(run => 
      selectedTestRuns.length === 0 || selectedTestRuns.includes(run.id.toString())
    );

    const selectedExecutions = executions.filter(exec => 
      selectedRuns.some(run => run.id === exec.testRunId)
    );

    const totalExecutions = selectedExecutions.length;
    const passedExecutions = selectedExecutions.filter(exec => exec.status === "passed").length;
    const failedExecutions = selectedExecutions.filter(exec => exec.status === "failed").length;
    const blockedExecutions = selectedExecutions.filter(exec => exec.status === "blocked").length;
    const pendingExecutions = selectedExecutions.filter(exec => exec.status === "pending").length;

    const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(1) : "0";

    // Calculate coverage
    const totalTestCases = testCases.length;
    const executedTestCases = new Set(selectedExecutions.map(exec => exec.testCaseId)).size;
    const coverage = totalTestCases > 0 ? ((executedTestCases / totalTestCases) * 100).toFixed(1) : "0";

    return {
      totalRuns: selectedRuns.length,
      totalExecutions,
      passedExecutions,
      failedExecutions,
      blockedExecutions,
      pendingExecutions,
      passRate,
      coverage,
      totalTestCases,
      executedTestCases,
    };
  };

  const handleGenerateReport = async () => {
    if (!testRuns || !testCases || !executions) {
      toast({
        title: "Error",
        description: "No data available for report generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedRuns = testRuns.filter(run => 
        selectedTestRuns.length === 0 || selectedTestRuns.includes(run.id.toString())
      );

      const selectedExecutions = executions.filter(exec => 
        selectedRuns.some(run => run.id === exec.testRunId)
      );

      await generateManualTestReport({
        testRuns: selectedRuns,
        testCases,
        executions: selectedExecutions,
        reportType,
        includeCharts,
        includeDetails,
        groupByCategory,
        dateRange,
      });

      toast({
        title: "Report Generated",
        description: "Manual test report has been generated and downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const metrics = calculateReportMetrics();

  if (loadingRuns) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Manual Test Reports</h1>
          <p className="text-muted-foreground">Generate comprehensive reports for manual test execution</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="execution-summary">Execution Summary</SelectItem>
                      <SelectItem value="test-coverage">Test Coverage Report</SelectItem>
                      <SelectItem value="detailed-results">Detailed Test Results</SelectItem>
                      <SelectItem value="defect-summary">Defect Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Report Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeCharts" 
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                      />
                      <Label htmlFor="includeCharts" className="text-sm">Include Charts and Visualizations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeDetails" 
                        checked={includeDetails}
                        onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                      />
                      <Label htmlFor="includeDetails" className="text-sm">Include Detailed Test Case Results</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="groupByCategory" 
                        checked={groupByCategory}
                        onCheckedChange={(checked) => setGroupByCategory(checked as boolean)}
                      />
                      <Label htmlFor="groupByCategory" className="text-sm">Group Test Cases by Category</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Run Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Test Runs</span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedTestRuns.length === testRuns?.length ? "Deselect All" : "Select All"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testRuns?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No test runs available
                    </p>
                  ) : (
                    testRuns?.map((run) => (
                      <div key={run.id} className="flex items-center space-x-2 p-2 border border-border rounded">
                        <Checkbox
                          id={`run-${run.id}`}
                          checked={selectedTestRuns.includes(run.id.toString())}
                          onCheckedChange={(checked) => handleTestRunSelection(run.id.toString(), checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`run-${run.id}`} className="text-sm font-medium cursor-pointer">
                            {run.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={
                                run.status === "completed" ? "default" :
                                run.status === "in_progress" ? "secondary" : "outline"
                              }
                              className="text-xs"
                            >
                              {run.status.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {run.assignedTo && `Assigned to ${run.assignedTo}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(run.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview & Generation */}
          <div className="space-y-6">
            {/* Metrics Preview */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{metrics.totalRuns}</div>
                      <div className="text-xs text-muted-foreground">Test Runs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{metrics.totalExecutions}</div>
                      <div className="text-xs text-muted-foreground">Executions</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Passed</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">{metrics.passedExecutions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">Failed</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">{metrics.failedExecutions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Blocked</span>
                      </div>
                      <span className="text-sm font-medium text-yellow-600">{metrics.blockedExecutions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-muted-foreground">Pending</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{metrics.pendingExecutions}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pass Rate</span>
                      <span className="text-sm font-medium text-green-600">{metrics.passRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coverage</span>
                      <span className="text-sm font-medium">{metrics.coverage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Executed Cases</span>
                      <span className="text-sm font-medium">{metrics.executedTestCases}/{metrics.totalTestCases}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedTestRuns.length === 0 
                    ? "All test runs will be included in the report"
                    : `${selectedTestRuns.length} test run(s) selected`
                  }
                </div>
                
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !testRuns?.length}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF Report
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Report will be downloaded as a PDF file
                </div>
              </CardContent>
            </Card>

            {/* Report Types Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Report Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <div className="font-medium">Execution Summary</div>
                  <div className="text-muted-foreground">High-level overview of test execution</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Test Coverage</div>
                  <div className="text-muted-foreground">Analysis of test case coverage</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Detailed Results</div>
                  <div className="text-muted-foreground">Complete test case execution details</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Defect Summary</div>
                  <div className="text-muted-foreground">Focus on failed and blocked tests</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
