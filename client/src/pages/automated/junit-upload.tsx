import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseJUnitXML, validateJUnitXML, getTestSummary } from "@/lib/xml-parser";
import { useLocation } from "wouter";

export default function JUnitUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [testRunName, setTestRunName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsePreview, setParsePreview] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const uploadMutation = useMutation({
    mutationFn: async ({ xmlContent, testRunName }: { xmlContent: string; testRunName: string }) => {
      // Parse XML first
      if (!validateJUnitXML(xmlContent)) {
        throw new Error("Invalid JUnit XML format");
      }

      const parsedXML = parseJUnitXML(xmlContent);
      const summary = getTestSummary(parsedXML);

      // Create test run
      const testRunResponse = await apiRequest("POST", "/api/test-runs", {
        name: testRunName,
        type: 'automated',
        status: 'running',
        totalTests: summary.totalTests,
        passedTests: summary.passedTests,
        failedTests: summary.failedTests,
        skippedTests: summary.skippedTests,
        xmlContent
      });

      const testRun = await testRunResponse.json();

      // Process test cases in batches for large files
      const testCases = [];
      for (const suite of parsedXML.testSuites) {
        for (const testCase of suite.testCases) {
          testCases.push({
            testRunId: testRun.id,
            name: testCase.name,
            className: testCase.className,
            status: testCase.status,
            duration: testCase.duration,
            errorMessage: testCase.errorMessage,
            stackTrace: testCase.stackTrace,
            attachments: testCase.attachments || []
          });
        }
      }

      // Process in batches of 100 for performance
      const batchSize = 100;
      for (let i = 0; i < testCases.length; i += batchSize) {
        const batch = testCases.slice(i, i + batchSize);
        await apiRequest("POST", `/api/junit/process/${testRun.id}`, { testCases: batch });
        setUploadProgress(Math.min(90, (i / testCases.length) * 80 + 20));
      }

      return { testRun, summary };
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processed ${data.summary.totalTests} test cases successfully.`,
      });
      setFile(null);
      setTestRunName("");
      setParsePreview(null);
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ["/api/test-runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      
      // Navigate to test results
      setTimeout(() => {
        setLocation("/automated/test-results");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload JUnit XML file.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/xml" || selectedFile.name.endsWith(".xml")) {
        // Check file size (50MB limit)
        if (selectedFile.size > 50 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select a file smaller than 50MB.",
            variant: "destructive",
          });
          return;
        }

        setFile(selectedFile);
        setUploadProgress(0);

        // Preview the XML content
        try {
          const text = await selectedFile.text();
          if (validateJUnitXML(text)) {
            const parsedXML = parseJUnitXML(text);
            const summary = getTestSummary(parsedXML);
            setParsePreview(summary);
          } else {
            setParsePreview(null);
            toast({
              title: "Invalid XML Format",
              description: "The selected file is not a valid JUnit XML format.",
              variant: "destructive",
            });
          }
        } catch (error) {
          setParsePreview(null);
          toast({
            title: "File Read Error",
            description: "Unable to read the selected XML file.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid XML file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a JUnit XML file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(10);
      const xmlContent = await file.text();
      const runName = testRunName || file.name.replace(".xml", "");
      
      uploadMutation.mutate({ xmlContent, testRunName: runName });
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Unable to read the XML file content.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">JUnit XML Upload</h1>
          <p className="text-muted-foreground">Upload JUnit XML test results from your CI/CD pipeline</p>
        </div>

        <div className="grid gap-6">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testRunName">Test Run Name (Optional)</Label>
                <Input
                  id="testRunName"
                  placeholder="e.g., Regression Suite - Build #123"
                  value={testRunName}
                  onChange={(e) => setTestRunName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xmlFile">JUnit XML File</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="xmlFile"
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              </div>

              {file && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {parsePreview && (
                    <div className="mt-3 p-3 bg-background rounded border">
                      <h4 className="text-sm font-medium mb-2">XML Preview:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Total Tests:</span>
                          <span className="ml-1 font-medium">{parsePreview.totalTests}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Passed:</span>
                          <span className="ml-1 font-medium text-green-600">{parsePreview.passedTests}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <span className="ml-1 font-medium text-red-600">{parsePreview.failedTests}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pass Rate:</span>
                          <span className="ml-1 font-medium">{parsePreview.passRate}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadMutation.isPending ? "Uploading..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload XML File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Supported Formats</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload JUnit XML files generated by test frameworks like JUnit, TestNG, or similar tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Automatic Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Test results will be automatically parsed and organized for analysis and reporting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">File Size Limit</h4>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size is 50MB. For larger files, consider splitting them into multiple uploads.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
