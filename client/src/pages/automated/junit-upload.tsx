import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function JUnitUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [testRunName, setTestRunName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/junit/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "JUnit XML file has been uploaded successfully.",
      });
      setFile(null);
      setTestRunName("");
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ["/api/test-runs"] });
      
      // Process the XML
      processXML(data.testRunId);
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

  const processXMLMutation = useMutation({
    mutationFn: async ({ testRunId, testCases }: { testRunId: number; testCases: any[] }) => {
      const response = await apiRequest("POST", `/api/junit/process/${testRunId}`, { testCases });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processing Complete",
        description: "JUnit XML has been processed and test results are available.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
    },
  });

  const processXML = async (testRunId: number) => {
    if (!file) return;

    const text = await file.text();
    const testCases = parseJUnitXML(text);
    processXMLMutation.mutate({ testRunId, testCases });
  };

  const parseJUnitXML = (xmlText: string) => {
    // Simple XML parsing (in a real app, use a proper XML parser)
    const testCases = [];
    const regex = /<testcase[^>]*name="([^"]*)"[^>]*classname="([^"]*)"[^>]*time="([^"]*)"[^>]*>/g;
    let match;

    while ((match = regex.exec(xmlText)) !== null) {
      const [, name, className, time] = match;
      const status = xmlText.includes(`<failure`) ? 'failed' : 'passed';
      
      testCases.push({
        name,
        className,
        duration: Math.round(parseFloat(time) * 1000), // Convert to milliseconds
        status,
        errorMessage: status === 'failed' ? 'Test failed' : null,
        stackTrace: status === 'failed' ? 'Stack trace would be extracted from XML' : null,
      });
    }

    return testCases;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/xml" || selectedFile.name.endsWith(".xml")) {
        setFile(selectedFile);
        setUploadProgress(0);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid XML file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a JUnit XML file to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("xml", file);
    formData.append("name", testRunName || file.name.replace(".xml", ""));

    setUploadProgress(50);
    uploadMutation.mutate(formData);
  };

  const isUploading = uploadMutation.isPending || processXMLMutation.isPending;

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
