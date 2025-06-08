import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard, KanbanItem } from "@/components/kanban/kanban-board";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Users, Calendar, Eye, Edit, Check, X, Clock } from "lucide-react";
import { insertManualTestRunSchema, type InsertManualTestRun, type ManualTestRun, type ManualTestCase, type ManualTestExecution } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertManualTestRunSchema;
type FormData = z.infer<typeof formSchema>;

export default function ManualTestRuns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ManualTestRun | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "not_started",
      assignedTo: "",
    },
  });

  const { data: testRuns, isLoading: loadingRuns } = useQuery<ManualTestRun[]>({
    queryKey: ["/api/manual-test-runs"],
  });

  const { data: testCases } = useQuery<ManualTestCase[]>({
    queryKey: ["/api/manual-test-cases"],
  });

  const { data: executions } = useQuery<ManualTestExecution[]>({
    queryKey: ["/api/manual-test-executions"],
    enabled: !!selectedRun,
  });

  const createTestRunMutation = useMutation({
    mutationFn: async (data: InsertManualTestRun) => {
      const response = await apiRequest("POST", "/api/manual-test-runs", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Run Created",
        description: "Manual test run has been created successfully.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/manual-test-runs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create test run.",
        variant: "destructive",
      });
    },
  });

  const updateExecutionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ManualTestExecution> }) => {
      const response = await apiRequest("PATCH", `/api/manual-test-executions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-test-executions"] });
      toast({
        title: "Status Updated",
        description: "Test execution status has been updated.",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createTestRunMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary">Not Started</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "passed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
      case "blocked":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Create kanban data for test run management
  const createKanbanItems = (status: string): KanbanItem[] => {
    if (!testRuns) return [];
    
    return testRuns
      .filter(run => run.status === status)
      .map(run => ({
        id: run.id.toString(),
        title: run.name,
        description: `Assigned to: ${run.assignedTo || "Unassigned"}`,
        status: run.status,
        assignedTo: run.assignedTo || undefined,
        onClick: () => setSelectedRun(run),
      }));
  };

  const kanbanColumns = [
    {
      title: "Not Started",
      status: "not_started",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      items: createKanbanItems("not_started"),
    },
    {
      title: "In Progress",
      status: "in_progress",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      items: createKanbanItems("in_progress"),
    },
    {
      title: "Completed",
      status: "completed",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      items: createKanbanItems("completed"),
    },
  ];

  const calculateRunProgress = (run: ManualTestRun) => {
    const runExecutions = executions?.filter(exec => exec.testRunId === run.id) || [];
    const totalTests = runExecutions.length;
    const completedTests = runExecutions.filter(exec => 
      exec.status === "passed" || exec.status === "failed" || exec.status === "blocked"
    ).length;
    
    return totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
  };

  if (loadingRuns) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manual Test Runs</h1>
            <p className="text-muted-foreground">Manage and track manual test execution</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Test Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Test Run</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Run Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sprint 24 - User Registration Flow" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignee name or email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTestRunMutation.isPending}>
                      {createTestRunMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Test Run"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Runs</p>
                      <p className="text-2xl font-bold">{testRuns?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{kanbanColumns[1].items.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{kanbanColumns[2].items.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Test Cases</p>
                      <p className="text-2xl font-bold">{testCases?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kanban Board */}
            <Card>
              <CardHeader>
                <CardTitle>Test Run Board</CardTitle>
              </CardHeader>
              <CardContent>
                <KanbanBoard columns={kanbanColumns} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Test Runs</CardTitle>
              </CardHeader>
              <CardContent>
                {!testRuns || testRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No test runs found. Create your first test run to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testRuns.map((run) => {
                        const progress = calculateRunProgress(run);
                        return (
                          <TableRow key={run.id}>
                            <TableCell className="font-medium">{run.name}</TableCell>
                            <TableCell>{getStatusBadge(run.status)}</TableCell>
                            <TableCell>{run.assignedTo || "Unassigned"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-muted-foreground">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(run.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedRun(run)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Run Detail Modal */}
        {selectedRun && (
          <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {selectedRun.name}
                  {getStatusBadge(selectedRun.status)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="ml-2">{selectedRun.assignedTo || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{new Date(selectedRun.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Execution List */}
                <div>
                  <h4 className="font-medium mb-2">Test Executions</h4>
                  {!executions || executions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No test executions found for this run.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {executions
                        .filter(exec => exec.testRunId === selectedRun.id)
                        .map((execution) => {
                          const testCase = testCases?.find(tc => tc.id === execution.testCaseId);
                          return (
                            <div key={execution.id} className="flex items-center justify-between p-2 border border-border rounded">
                              <div>
                                <p className="font-medium text-sm">{testCase?.title || "Unknown Test Case"}</p>
                                {execution.notes && (
                                  <p className="text-xs text-muted-foreground">{execution.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getExecutionStatusBadge(execution.status)}
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                    onClick={() => updateExecutionMutation.mutate({
                                      id: execution.id,
                                      updates: { status: "passed", executedAt: new Date() }
                                    })}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => updateExecutionMutation.mutate({
                                      id: execution.id,
                                      updates: { status: "failed", executedAt: new Date() }
                                    })}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
