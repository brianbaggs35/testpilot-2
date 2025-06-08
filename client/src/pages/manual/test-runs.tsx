import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ManualTestRun, 
  ManualTestCase, 
  ManualTestExecution,
  insertManualTestRunSchema,
  insertManualTestExecutionSchema 
} from "@shared/schema";
import { 
  Play, 
  Plus, 
  Import, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  GripVertical,
  Eye,
  Edit,
  MoreVertical,
  Users,
  Calendar
} from "lucide-react";
import { z } from "zod";

const createTestRunSchema = insertManualTestRunSchema;
type CreateTestRunForm = z.infer<typeof createTestRunSchema>;

const statusColumns = [
  { id: 'pending', title: 'Pending', status: 'pending', color: 'bg-gray-500', icon: Clock },
  { id: 'passed', title: 'Passed', status: 'passed', color: 'bg-green-500', icon: CheckCircle },
  { id: 'failed', title: 'Failed', status: 'failed', color: 'bg-red-500', icon: XCircle },
  { id: 'blocked', title: 'Blocked', status: 'blocked', color: 'bg-yellow-500', icon: AlertTriangle },
];

interface KanbanItemProps {
  execution: ManualTestExecution;
  testCase: ManualTestCase;
  onClick: () => void;
}

function KanbanItem({ execution, testCase, onClick }: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${execution.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusInfo = () => {
    return statusColumns.find(s => s.status === execution.status) || statusColumns[0];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {testCase.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {testCase.category || 'No category'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        </div>
      </div>

      {testCase.description && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {testCase.description}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1 py-0">
            #{testCase.id}
          </Badge>
          <Badge variant="outline" className={`text-xs px-1 py-0`}>
            {testCase.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>View</span>
        </div>
      </div>

      {execution.notes && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
          <p className="text-gray-600 dark:text-gray-300 line-clamp-1">
            <strong>Notes:</strong> {execution.notes}
          </p>
        </div>
      )}
    </div>
  );
}

interface DroppableColumnProps {
  column: typeof statusColumns[0];
  executions: Array<{ execution: ManualTestExecution; testCase: ManualTestCase }>;
  onItemClick: (execution: ManualTestExecution, testCase: ManualTestCase) => void;
}

function DroppableColumn({ column, executions, onItemClick }: DroppableColumnProps) {
  const IconComponent = column.icon;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[600px] w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${column.color}`} />
          <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {executions.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <SortableContext items={executions.map(item => `${item.execution.id}`)} strategy={verticalListSortingStrategy}>
          {executions.map((item) => (
            <KanbanItem
              key={item.execution.id}
              execution={item.execution}
              testCase={item.testCase}
              onClick={() => onItemClick(item.execution, item.testCase)}
            />
          ))}
        </SortableContext>
        
        {executions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <IconComponent className="h-6 w-6" />
            </div>
            <p className="text-sm">No tests {column.title.toLowerCase()}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default function TestRuns() {
  const [selectedRun, setSelectedRun] = useState<ManualTestRun | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<{ execution: ManualTestExecution; testCase: ManualTestCase } | null>(null);
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [isImportTestsOpen, setIsImportTestsOpen] = useState(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: testRuns = [] } = useQuery<ManualTestRun[]>({
    queryKey: ['/api/manual-test-runs'],
  });

  const { data: testCases = [] } = useQuery<ManualTestCase[]>({
    queryKey: ['/api/manual-test-cases'],
  });

  const { data: executions = [] } = useQuery<ManualTestExecution[]>({
    queryKey: ['/api/manual-test-executions', selectedRun?.id],
    enabled: !!selectedRun,
  });

  const createTestRunMutation = useMutation({
    mutationFn: async (data: CreateTestRunForm) => {
      return apiRequest('/api/manual-test-runs', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-test-runs'] });
      setIsCreateRunOpen(false);
    },
  });

  const importTestCasesMutation = useMutation({
    mutationFn: async (data: { testRunId: number; testCaseIds: number[] }) => {
      const executions = data.testCaseIds.map(testCaseId => ({
        testRunId: data.testRunId,
        testCaseId,
        status: 'pending' as const,
      }));
      
      return Promise.all(
        executions.map(execution => 
          apiRequest('/api/manual-test-executions', 'POST', execution)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-test-executions'] });
      setIsImportTestsOpen(false);
    },
  });

  const updateExecutionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return apiRequest(`/api/manual-test-executions/${id}`, 'PATCH', { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-test-executions'] });
    },
  });

  const testRunForm = useForm<CreateTestRunForm>({
    resolver: zodResolver(createTestRunSchema),
    defaultValues: {
      name: '',
      status: 'not_started',
      assignedTo: '',
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the column that the item was dropped on
    const targetColumn = statusColumns.find(col => 
      overId === col.id || overId.startsWith(col.id)
    );

    if (targetColumn) {
      const executionId = parseInt(activeId);
      const execution = executions.find(e => e.id === executionId);
      
      if (execution && execution.status !== targetColumn.status) {
        updateExecutionMutation.mutate({
          id: execution.id,
          status: targetColumn.status,
        });
      }
    }
  };

  const onCreateTestRun = (data: CreateTestRunForm) => {
    createTestRunMutation.mutate(data);
  };

  const handleImportTests = (selectedTestCaseIds: number[]) => {
    if (selectedRun) {
      importTestCasesMutation.mutate({
        testRunId: selectedRun.id,
        testCaseIds: selectedTestCaseIds,
      });
    }
  };

  const handleItemClick = (execution: ManualTestExecution, testCase: ManualTestCase) => {
    setSelectedExecution({ execution, testCase });
    setIsExecutionModalOpen(true);
  };

  const getExecutionsForColumn = (status: string) => {
    return executions
      .filter(execution => execution.status === status)
      .map(execution => {
        const testCase = testCases.find(tc => tc.id === execution.testCaseId);
        return testCase ? { execution, testCase } : null;
      })
      .filter(Boolean) as Array<{ execution: ManualTestExecution; testCase: ManualTestCase }>;
  };

  const getActiveItem = () => {
    if (!activeId) return null;
    const executionId = parseInt(activeId);
    const execution = executions.find(e => e.id === executionId);
    const testCase = execution ? testCases.find(tc => tc.id === execution.testCaseId) : null;
    return execution && testCase ? { execution, testCase } : null;
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Runs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and execute manual test runs with kanban-style tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateRunOpen} onOpenChange={setIsCreateRunOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Test Run
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Test Run</DialogTitle>
              </DialogHeader>
              <Form {...testRunForm}>
                <form onSubmit={testRunForm.handleSubmit(onCreateTestRun)} className="space-y-4">
                  <FormField
                    control={testRunForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test run name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testRunForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignee name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateRunOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTestRunMutation.isPending}>
                      Create Run
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Test Run Selection */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Select Test Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testRuns.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-2">No test runs created yet</p>
                  <Button onClick={() => setIsCreateRunOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Test Run
                  </Button>
                </div>
              ) : (
                testRuns.map((run) => (
                  <Card 
                    key={run.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRun?.id === run.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedRun(run)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {run.name}
                        </h3>
                        <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                          {run.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {run.assignedTo && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>{run.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(run.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Execution Kanban Board */}
      {selectedRun && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedRun.name} - Test Execution
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track test case execution progress
              </p>
            </div>
            <Dialog open={isImportTestsOpen} onOpenChange={setIsImportTestsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Import className="h-4 w-4 mr-1" />
                  Import Test Cases
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Import Test Cases</DialogTitle>
                </DialogHeader>
                <ImportTestCasesModal 
                  testCases={testCases}
                  onImport={handleImportTests}
                  onClose={() => setIsImportTestsOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-6">
              {statusColumns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  executions={getExecutionsForColumn(column.status)}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg rotate-2 scale-105 opacity-90">
                  {(() => {
                    const activeItem = getActiveItem();
                    return activeItem ? (
                      <KanbanItem
                        execution={activeItem.execution}
                        testCase={activeItem.testCase}
                        onClick={() => {}}
                      />
                    ) : null;
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* Test Execution Modal */}
      {selectedExecution && (
        <TestExecutionModal
          execution={selectedExecution.execution}
          testCase={selectedExecution.testCase}
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          onUpdateStatus={(status, notes) => {
            updateExecutionMutation.mutate({
              id: selectedExecution.execution.id,
              status,
              notes,
            });
          }}
        />
      )}
    </div>
  );
}

function ImportTestCasesModal({ 
  testCases, 
  onImport, 
  onClose 
}: { 
  testCases: ManualTestCase[]; 
  onImport: (ids: number[]) => void; 
  onClose: () => void; 
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTestCases = testCases.filter(tc =>
    tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tc.description && tc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTestCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTestCases.map(tc => tc.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search test cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={handleSelectAll}>
          {selectedIds.length === filteredTestCases.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <ScrollArea className="h-[400px] border rounded">
        <div className="p-4 space-y-2">
          {filteredTestCases.map((testCase) => (
            <div key={testCase.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
              <Checkbox
                checked={selectedIds.includes(testCase.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, testCase.id]);
                  } else {
                    setSelectedIds(selectedIds.filter(id => id !== testCase.id));
                  }
                }}
              />
              <div className="flex-1">
                <p className="font-medium">{testCase.title}</p>
                {testCase.description && (
                  <p className="text-sm text-muted-foreground">{testCase.description}</p>
                )}
              </div>
              <Badge variant="outline">{testCase.priority}</Badge>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} test case(s) selected
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => onImport(selectedIds)}
            disabled={selectedIds.length === 0}
          >
            Import Selected
          </Button>
        </div>
      </div>
    </div>
  );
}

function TestExecutionModal({
  execution,
  testCase,
  isOpen,
  onClose,
  onUpdateStatus,
}: {
  execution: ManualTestExecution;
  testCase: ManualTestCase;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: string, notes?: string) => void;
}) {
  const [status, setStatus] = useState(execution.status);
  const [notes, setNotes] = useState(execution.notes || '');

  const handleSave = () => {
    onUpdateStatus(status, notes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Execute Test Case: {testCase.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <div>
              <h4 className="font-medium mb-2">Test Steps</h4>
              <div className="p-4 bg-muted/30 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{testCase.content}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusColumns.map((column) => {
                    const IconComponent = column.icon;
                    return (
                      <SelectItem key={column.status} value={column.status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${column.color}`} />
                          <IconComponent className="h-4 w-4" />
                          {column.title}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-medium mb-2">Execution Notes</h4>
              <Textarea
                placeholder="Add notes about the test execution..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}