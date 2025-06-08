import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, FileText, BarChart3 } from "lucide-react";
import { TestCase, TestRun } from "@shared/schema";
import { generateAutomatedTestReport } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

interface PDFPreviewProps {
  testRuns: TestRun[];
  testCases: TestCase[];
  onClose?: () => void;
}

export function PDFPreview({ testRuns, testCases, onClose }: PDFPreviewProps) {
  const [reportType, setReportType] = useState("summary");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const getPreviewData = () => {
    const totalTests = testCases.length;
    const passedTests = testCases.filter(tc => tc.status === 'passed').length;
    const failedTests = testCases.filter(tc => tc.status === 'failed').length;
    const skippedTests = testCases.filter(tc => tc.status === 'skipped').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';

    return {
      totalRuns: testRuns.length,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate
    };
  };

  const preview = getPreviewData();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generateAutomatedTestReport({
        testRuns,
        testCases,
        reportType,
        includeCharts,
        includeDetails,
        dateRange
      });
      
      toast({
        title: "PDF Generated Successfully",
        description: "Your test report has been downloaded.",
      });
      
      onClose?.();
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your report.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getEstimatedPages = () => {
    let pages = 1; // Cover page
    
    if (includeCharts) pages += 1;
    if (reportType === 'detailed' || includeDetails) {
      pages += Math.ceil(testCases.length / 25); // ~25 test cases per page
    }
    if (reportType === 'failures') {
      const failedCases = testCases.filter(tc => tc.status === 'failed');
      pages += Math.ceil(failedCases.length / 20); // ~20 failed cases per page
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Executive Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Results</SelectItem>
                  <SelectItem value="failures">Failure Analysis</SelectItem>
                  <SelectItem value="trends">Trend Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked === true)}
              />
              <label htmlFor="includeCharts" className="text-sm font-medium">
                Include Charts and Graphs
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDetails"
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(checked === true)}
              />
              <label htmlFor="includeDetails" className="text-sm font-medium">
                Include Detailed Test Case Listings
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Frame */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 min-h-[400px] shadow-inner">
            {/* Mock PDF Preview */}
            <div className="space-y-4 text-sm">
              <div className="text-center border-b pb-4">
                <h1 className="text-xl font-bold">Automated Test Report</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Generated on {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Report Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Executive Summary</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Total Test Runs:</span>
                      <Badge variant="outline">{preview.totalRuns}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Test Cases:</span>
                      <Badge variant="outline">{preview.totalTests}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed Tests:</span>
                      <Badge className="bg-green-100 text-green-800">{preview.passedTests}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Tests:</span>
                      <Badge className="bg-red-100 text-red-800">{preview.failedTests}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass Rate:</span>
                      <Badge variant="secondary">{preview.passRate}%</Badge>
                    </div>
                  </div>
                </div>

                {includeCharts && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      Charts & Visualizations
                    </h3>
                    <div className="bg-gray-100 dark:bg-gray-800 h-24 rounded flex items-center justify-center text-xs text-gray-500">
                      Test Results Chart
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 h-16 rounded flex items-center justify-center text-xs text-gray-500">
                      Pass Rate Trend
                    </div>
                  </div>
                )}
              </div>

              {(reportType === 'detailed' || includeDetails) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Detailed Test Results</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                    <div className="grid grid-cols-4 gap-2 font-medium border-b pb-1">
                      <span>Test Name</span>
                      <span>Status</span>
                      <span>Duration</span>
                      <span>Class</span>
                    </div>
                    {testCases.slice(0, 3).map((tc, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 py-1 text-xs">
                        <span className="truncate">{tc.name}</span>
                        <Badge 
                          variant={tc.status === 'passed' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {tc.status}
                        </Badge>
                        <span>{tc.duration}ms</span>
                        <span className="truncate">{tc.className}</span>
                      </div>
                    ))}
                    {testCases.length > 3 && (
                      <div className="text-center text-gray-500 py-2">
                        ... and {testCases.length - 3} more test cases
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 border-t pt-2">
                QA Platform - Automated Test Report - Page 1 of {getEstimatedPages()}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Estimated pages: {getEstimatedPages()}</p>
            <p>This is a preview of your PDF report. The actual PDF will include proper formatting, page breaks, and styling.</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}