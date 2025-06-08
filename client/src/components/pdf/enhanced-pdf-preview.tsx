import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EnhancedPDFGenerator } from "@/lib/enhanced-pdf-generator";
import { TestRun, TestCase, ManualTestRun, ManualTestCase, ManualTestExecution } from "@shared/schema";
import { 
  Download, 
  Eye, 
  FileText, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Printer,
  Share2,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

interface EnhancedPDFPreviewProps {
  testRuns: TestRun[] | ManualTestRun[];
  testCases: TestCase[] | ManualTestCase[];
  executions?: ManualTestExecution[];
  reportType: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  dateRange?: string;
  onClose?: () => void;
  isManual?: boolean;
}

export function EnhancedPDFPreview({ 
  testRuns, 
  testCases, 
  executions = [],
  reportType, 
  includeCharts = true, 
  includeDetails = true, 
  dateRange = 'Last 30 days',
  onClose,
  isManual = false
}: EnhancedPDFPreviewProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generator, setGenerator] = useState<EnhancedPDFGenerator | null>(null);

  useEffect(() => {
    generatePDFPreview();
  }, [testRuns, testCases, executions, reportType, includeCharts, includeDetails, dateRange]);

  const generatePDFPreview = async () => {
    setIsGenerating(true);
    try {
      const pdfGenerator = new EnhancedPDFGenerator();
      
      const options = {
        testRuns,
        testCases,
        executions,
        reportType,
        includeCharts,
        includeDetails,
        dateRange,
        reportTitle: isManual ? 'Manual Test Report' : 'Automated Test Report',
        companyName: 'QA Platform'
      };

      if (isManual) {
        pdfGenerator.generateManualReport(options);
      } else {
        pdfGenerator.generateAutomatedReport(options);
      }

      const dataUrl = pdfGenerator.getPDFDataURL();
      setPdfDataUrl(dataUrl);
      setGenerator(pdfGenerator);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (generator) {
      const filename = `${isManual ? 'manual' : 'automated'}-test-report-${Date.now()}.pdf`;
      generator.downloadPDF(filename);
    }
  };

  const getReportMetrics = () => {
    if (isManual) {
      const totalExecutions = executions.length;
      const passedExecutions = executions.filter(ex => ex.status === 'passed').length;
      const failedExecutions = executions.filter(ex => ex.status === 'failed').length;
      const pendingExecutions = executions.filter(ex => ex.status === 'pending').length;
      const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(1) : '0';
      
      return {
        total: testCases.length,
        executed: totalExecutions,
        passed: passedExecutions,
        failed: failedExecutions,
        pending: pendingExecutions,
        passRate
      };
    } else {
      const totalTests = testCases.length;
      const passedTests = testCases.filter(tc => tc.status === 'passed').length;
      const failedTests = testCases.filter(tc => tc.status === 'failed').length;
      const skippedTests = testCases.filter(tc => tc.status === 'skipped').length;
      const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
      
      return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate
      };
    }
  };

  const metrics = getReportMetrics();

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {isManual ? 'Manual' : 'Automated'} Test Report Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {reportType} • {dateRange}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Fullscreen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>PDF Report Preview</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-full w-full">
                    {pdfDataUrl && (
                      <iframe
                        src={pdfDataUrl}
                        className="w-full h-[800px] border border-gray-200 rounded-lg"
                        title="PDF Preview"
                      />
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button onClick={downloadPDF} disabled={!pdfDataUrl || isGenerating}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.total}</div>
              <div className="text-sm text-blue-600/80">Total Tests</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.passed}</div>
              <div className="text-sm text-green-600/80">Passed</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
              <div className="text-sm text-red-600/80">Failed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{metrics.passRate}%</div>
              <div className="text-sm text-gray-600/80">Pass Rate</div>
            </div>
          </div>

          {/* Report Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {isGenerating ? (
                <>
                  <Clock className="h-5 w-5 text-orange-500 animate-spin" />
                  <span className="text-sm font-medium">Generating report...</span>
                </>
              ) : pdfDataUrl ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Report ready for download</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Failed to generate report</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                PDF A4
              </Badge>
              <Badge variant="outline">
                {includeDetails ? 'Detailed' : 'Summary'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              PDF Preview
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(0.6)}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Zoom
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <ScrollArea className="h-[600px] w-full">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        Generating PDF Report
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Creating professional report with charts and detailed analysis...
                      </p>
                    </div>
                  </div>
                </div>
              ) : pdfDataUrl ? (
                <div className="flex justify-center p-4">
                  <div 
                    className="shadow-2xl bg-white rounded-lg overflow-hidden"
                    style={{ 
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  >
                    <iframe
                      src={pdfDataUrl}
                      className="w-[794px] h-[1123px] border-0"
                      title="PDF Preview"
                      style={{
                        width: '794px', // A4 width in pixels at 96 DPI
                        height: '1123px', // A4 height in pixels at 96 DPI
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        Failed to Generate PDF
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Please try refreshing or contact support if the issue persists.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={generatePDFPreview}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!pdfDataUrl}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" disabled={!pdfDataUrl}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button onClick={downloadPDF} disabled={!pdfDataUrl || isGenerating}>
            <Download className="h-4 w-4 mr-1" />
            Download A4 PDF
          </Button>
        </div>
      </div>
    </div>
  );
}