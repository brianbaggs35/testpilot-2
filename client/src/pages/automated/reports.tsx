import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TestRun, TestCase } from "@shared/schema";
import { generateAutomatedTestReport } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

export default function AutomatedReports() {
  const [selectedTestRuns, setSelectedTestRuns] = useState<string[]>([]);
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: testRuns, isLoading: loadingRuns } = useQuery<TestRun[]>({
    queryKey: ["/api/test-runs"],
  });

  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
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
    if (!testRuns || !testCases) return null;

    const selectedRuns = testRuns.filter(run => 
      selectedTestRuns.length === 0 || selectedTestRuns.includes(run.id.toString())
    );

    const totalTests = selectedRuns.reduce((sum, run) => sum + run.totalTests, 0);
    const passedTests = selectedRuns.reduce((sum, run) => sum + run.passedTests, 0);
    const failedTests = selectedRuns.reduce((sum, run) => sum + run.failedTests, 0);
    const skippedTests = selectedRuns.reduce((sum, run) => sum + run.skippedTests, 0);
    
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0";
    const avgDuration = selectedRuns.length > 0 
      ? (selectedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / selectedRuns.length / 60000).toFixed(1)
      : "0";

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate,
      avgDuration,
      totalRuns: selectedRuns.length,
    };
  };

  const handleGenerateReport = async () => {
    if (!testRuns || !testCases) {
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

      const selectedTestCasesData = testCases.filter(tc => 
        selectedRuns.some(run => run.id === tc.testRunId)
      );

      await generateAutomatedTestReport({
        testRuns: selectedRuns,
        testCases: selectedTestCasesData,
        reportType,
        includeCharts,
        includeDetails,
        dateRange,
      });

      toast({
        title: "Report Generated",
        description: "Automated test report has been generated and downloaded successfully.",
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
          <h1 className="text-2xl font-bold text-foreground">Automated Test Reports</h1>
          <p className="text-muted-foreground">Generate comprehensive reports for automated test results</p>
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
                      <SelectItem value="summary">Executive Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="trends">Trend Analysis</SelectItem>
                      <SelectItem value="failures">Failure Report</SelectItem>
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
                      <Label htmlFor="includeCharts" className="text-sm">Include Charts and Graphs</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeDetails" 
                        checked={includeDetails}
                        onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                      />
                      <Label htmlFor="includeDetails" className="text-sm">Include Detailed Test Results</Label>
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
                            <Badge variant="outline" className="text-xs">
                              {run.totalTests} tests
                            </Badge>
                            <Badge 
                              variant={run.status === "passed" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {run.status}
                            </Badge>
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
                    <BarChart3 className="h-5 w-5" />
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
                      <div className="text-2xl font-bold text-foreground">{metrics.totalTests}</div>
                      <div className="text-xs text-muted-foreground">Total Tests</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pass Rate</span>
                      <span className="text-sm font-medium text-green-600">{metrics.passRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Failed</span>
                      <span className="text-sm font-medium text-red-600">{metrics.failedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Duration</span>
                      <span className="text-sm font-medium">{metrics.avgDuration}m</span>
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
                  <div className="font-medium">Executive Summary</div>
                  <div className="text-muted-foreground">High-level overview with key metrics</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Detailed Analysis</div>
                  <div className="text-muted-foreground">Complete test results and statistics</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Trend Analysis</div>
                  <div className="text-muted-foreground">Performance trends over time</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium">Failure Report</div>
                  <div className="text-muted-foreground">Focus on failed and flaky tests</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
