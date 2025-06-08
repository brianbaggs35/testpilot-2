import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard, KanbanItem } from "@/components/kanban/kanban-board";
import { StackTraceModal } from "@/components/modals/stack-trace-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Bug, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TestCase, FailureAnalysis } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FailureAnalysisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
  });

  const { data: failureAnalyses, isLoading } = useQuery<FailureAnalysis[]>({
    queryKey: ["/api/failure-analysis"],
  });

  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<FailureAnalysis> }) => {
      const response = await apiRequest("PATCH", `/api/failure-analysis/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/failure-analysis"] });
      toast({
        title: "Updated Successfully",
        description: "Failure analysis has been updated.",
      });
    },
  });

  // Get failed and flaky test cases
  const failedTestCases = testCases?.filter(tc => tc.status === 'failed' || tc.status === 'flaky') || [];

  // Create kanban items from failed test cases and failure analyses
  const createKanbanItems = (status: string): KanbanItem[] => {
    const analyses = failureAnalyses?.filter(fa => fa.status === status) || [];
    
    return analyses.map(analysis => {
      const testCase = testCases?.find(tc => tc.id === analysis.testCaseId);
      if (!testCase) return null;

      return {
        id: analysis.id.toString(),
        title: testCase.name,
        description: testCase.errorMessage || "No error message",
        status: analysis.status,
        priority: "medium" as const,
        assignedTo: analysis.assignedTo || undefined,
        onClick: () => handleViewTestCase(testCase),
      };
    }).filter(Boolean) as KanbanItem[];
  };

  const kanbanColumns = [
    {
      title: "New Failures",
      status: "new",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      items: createKanbanItems("new"),
    },
    {
      title: "Investigating",
      status: "investigating", 
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      items: createKanbanItems("investigating"),
    },
    {
      title: "Resolved",
      status: "resolved",
      bgColor: "bg-green-50 dark:bg-green-950/20", 
      items: createKanbanItems("resolved"),
    },
  ];

  const handleViewTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsModalOpen(true);
  };

  const handleMarkResolved = async (testCaseId: number) => {
    const analysis = failureAnalyses?.find(fa => fa.testCaseId === testCaseId);
    if (analysis) {
      updateAnalysisMutation.mutate({
        id: analysis.id,
        updates: { status: "resolved", resolution: "Marked as resolved by user" }
      });
    }
  };

  const filteredFailedTestCases = failedTestCases.filter(testCase => {
    const matchesSearch = testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (testCase.className && testCase.className.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Failure Analysis</h1>
          <p className="text-muted-foreground">Investigate and track failed and flaky tests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Failures</p>
                  <p className="text-2xl font-bold">{failedTestCases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">New</p>
                  <p className="text-2xl font-bold">{kanbanColumns[0].items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-yellow-500 rounded-full" />
                <div>
                  <p className="text-sm text-muted-foreground">Investigating</p>
                  <p className="text-2xl font-bold">{kanbanColumns[1].items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{kanbanColumns[2].items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search failed tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Bug className="h-4 w-4 mr-2" />
                Create Issue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Analysis Board</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-muted rounded mb-4"></div>
                    <div className="space-y-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-20 bg-muted rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <KanbanBoard columns={kanbanColumns} />
            )}
          </CardContent>
        </Card>

        {/* Failed Tests List */}
        {filteredFailedTestCases.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All Failed Tests ({filteredFailedTestCases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredFailedTestCases.map((testCase) => (
                  <div 
                    key={testCase.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewTestCase(testCase)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{testCase.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{testCase.className}</p>
                      {testCase.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{testCase.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={testCase.status === "failed" ? "destructive" : "secondary"}>
                        {testCase.status}
                      </Badge>
                      {testCase.duration && (
                        <span className="text-xs text-muted-foreground">
                          {testCase.duration < 1000 ? `${testCase.duration}ms` : `${(testCase.duration / 1000).toFixed(2)}s`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stack Trace Modal */}
        <StackTraceModal
          testCase={selectedTestCase}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMarkResolved={handleMarkResolved}
        />
      </div>
    </div>
  );
}
