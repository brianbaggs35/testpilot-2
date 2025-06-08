import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StackTraceModal } from "@/components/modals/stack-trace-modal";
import { Search, Filter, Download, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TestCase, TestRun } from "@shared/schema";

export default function TestResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTestRun, setSelectedTestRun] = useState<string>("all");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: testRuns } = useQuery<TestRun[]>({
    queryKey: ["/api/test-runs"],
  });

  const { data: testCases, isLoading } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
  });

  const filteredTestCases = testCases?.filter((testCase) => {
    const matchesSearch = testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (testCase.className && testCase.className.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || testCase.status === statusFilter;
    const matchesTestRun = selectedTestRun === "all" || testCase.testRunId?.toString() === selectedTestRun;
    
    return matchesSearch && matchesStatus && matchesTestRun;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
      case "skipped":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Skipped</Badge>;
      case "flaky":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Flaky</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsModalOpen(true);
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "N/A";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Test Results</h1>
          <p className="text-muted-foreground">View and analyze automated test results</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedTestRun} onValueChange={setSelectedTestRun}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Test Run" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Runs</SelectItem>
                  {testRuns?.map((run) => (
                    <SelectItem key={run.id} value={run.id.toString()}>
                      {run.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="flaky">Flaky</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Test Cases ({filteredTestCases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredTestCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No test cases found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Test Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestCases.map((testCase) => {
                    const testRun = testRuns?.find(run => run.id === testCase.testRunId);
                    return (
                      <TableRow key={testCase.id}>
                        <TableCell className="font-medium">{testCase.name}</TableCell>
                        <TableCell className="font-mono text-sm">{testCase.className || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(testCase.status)}</TableCell>
                        <TableCell>{formatDuration(testCase.duration)}</TableCell>
                        <TableCell>{testRun?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(testCase)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Stack Trace Modal */}
        <StackTraceModal
          testCase={selectedTestCase}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
