import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StackTraceModal } from "@/components/modals/stack-trace-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TestCase, FailureAnalysis } from "@shared/schema";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  Bug, 
  Edit, 
  Settings, 
  Plus, 
  Search,
  Filter,
  GripVertical,
  Eye,
  MoreVertical
} from "lucide-react";

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  icon: any;
  maxItems?: number;
}

const defaultColumns: KanbanColumn[] = [
  { id: 'new_failures', title: 'New Failures', status: 'new_failures', color: 'bg-red-500', icon: AlertTriangle },
  { id: 'investigating', title: 'Investigating', status: 'investigating', color: 'bg-yellow-500', icon: Search },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-blue-500', icon: Edit },
  { id: 'resolved', title: 'Resolved', status: 'resolved', color: 'bg-green-500', icon: CheckCircle },
];

interface KanbanItemProps {
  testCase: TestCase;
  analysis: FailureAnalysis;
  onClick: () => void;
}

function KanbanItem({ testCase, analysis, onClick }: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${testCase.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (errorMessage?: string | null) => {
    if (!errorMessage) return 'bg-gray-500';
    if (errorMessage.toLowerCase().includes('critical') || errorMessage.toLowerCase().includes('fatal')) return 'bg-red-500';
    if (errorMessage.toLowerCase().includes('warning')) return 'bg-yellow-500';
    return 'bg-blue-500';
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
            {testCase.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {testCase.className || 'Unknown class'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(testCase.errorMessage)}`} />
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        </div>
      </div>

      {testCase.errorMessage && (
        <div className="mb-3">
          <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2 font-mono">
            {testCase.errorMessage}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1 py-0">
            #{testCase.id}
          </Badge>
          {testCase.duration && (
            <span>{testCase.duration}ms</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>View</span>
        </div>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  column: KanbanColumn;
  items: Array<{ testCase: TestCase; analysis: FailureAnalysis }>;
  onItemClick: (testCase: TestCase) => void;
}

function DroppableColumn({ column, items, onItemClick }: DroppableColumnProps) {
  const IconComponent = column.icon;
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[600px] w-80 border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${column.color}`} />
          <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <SortableContext items={items.map(item => `${item.testCase.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item) => (
              <KanbanItem
                key={item.testCase.id}
                testCase={item.testCase}
                analysis={item.analysis}
                onClick={() => onItemClick(item.testCase)}
              />
            ))}
          </div>
        </SortableContext>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <IconComponent className="h-6 w-6" />
            </div>
            <p className="text-sm">No items in {column.title.toLowerCase()}</p>
            <p className="text-xs mt-1">Drag tests here to update status</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default function FailureAnalysisPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: failureAnalyses = [] } = useQuery<FailureAnalysis[]>({
    queryKey: ['/api/failure-analysis'],
  });

  const { data: testCases = [] } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
  });

  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return apiRequest(`/api/failure-analysis/${id}`, 'PATCH', { 
        status, 
        resolution: notes,
        updatedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/failure-analysis'] });
      setIsModalOpen(false);
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
    const targetColumn = columns.find(col => 
      overId === col.id || overId.startsWith(col.id)
    );

    if (targetColumn) {
      const testCaseId = parseInt(activeId);
      const analysis = failureAnalyses.find(a => a.testCaseId === testCaseId);
      
      if (analysis && analysis.status !== targetColumn.status) {
        updateAnalysisMutation.mutate({
          id: analysis.id,
          status: targetColumn.status,
        });
      }
    }
  };

  const handleItemClick = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsModalOpen(true);
  };

  const handleStatusChange = (testCaseId: number, status: string, notes?: string) => {
    const analysis = failureAnalyses.find(a => a.testCaseId === testCaseId);
    if (analysis) {
      updateAnalysisMutation.mutate({
        id: analysis.id,
        status,
        notes,
      });
    }
  };

  // Group items by column status
  const getItemsForColumn = (status: string) => {
    return failureAnalyses
      .filter(analysis => analysis.status === status)
      .map(analysis => {
        const testCase = testCases.find(tc => tc.id === analysis.testCaseId);
        return testCase ? { testCase, analysis } : null;
      })
      .filter(Boolean)
      .filter(item => {
        if (!item) return false;
        const matchesSearch = searchTerm === "" || 
          item.testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.testCase.className && item.testCase.className.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterStatus === "all" || item.analysis.status === filterStatus;
        return matchesSearch && matchesFilter;
      }) as Array<{ testCase: TestCase; analysis: FailureAnalysis }>;
  };

  const getActiveItem = () => {
    if (!activeId) return null;
    const testCaseId = parseInt(activeId);
    const analysis = failureAnalyses.find(a => a.testCaseId === testCaseId);
    const testCase = testCases.find(tc => tc.id === testCaseId);
    return testCase && analysis ? { testCase, analysis } : null;
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Failure Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track test failure investigations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Customize Board
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Customize Kanban Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Drag and drop functionality is active. You can customize column names and colors here.
                </p>
                {columns.map((column, index) => (
                  <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-4 h-4 rounded-full ${column.color}`} />
                    <Input 
                      value={column.title} 
                      onChange={(e) => {
                        const newColumns = [...columns];
                        newColumns[index].title = e.target.value;
                        setColumns(newColumns);
                      }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {columns.map(column => (
                <SelectItem key={column.status} value={column.status}>
                  {column.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              items={getItemsForColumn(column.status)}
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
                    testCase={activeItem.testCase}
                    analysis={activeItem.analysis}
                    onClick={() => {}}
                  />
                ) : null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Stack Trace Modal */}
      <StackTraceModal
        testCase={selectedTestCase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}