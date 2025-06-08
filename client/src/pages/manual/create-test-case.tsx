import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertManualTestCaseSchema, insertTestSuiteSchema, ManualTestCase, TestSuite } from "@shared/schema";
import { 
  Plus, 
  Folder, 
  FolderOpen, 
  FileText, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Flag,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { z } from "zod";

const createTestCaseSchema = insertManualTestCaseSchema.extend({
  tags: z.array(z.string()).optional(),
});

const createTestSuiteSchema = insertTestSuiteSchema;

type CreateTestCaseForm = z.infer<typeof createTestCaseSchema>;
type CreateTestSuiteForm = z.infer<typeof createTestSuiteSchema>;

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', icon: CheckCircle },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500', icon: Clock },
  { value: 'high', label: 'High', color: 'bg-orange-500', icon: AlertCircle },
  { value: 'critical', label: 'Critical', color: 'bg-red-500', icon: Flag },
];

interface TestSuiteTreeProps {
  testSuite: TestSuite;
  testCases: ManualTestCase[];
  childSuites: TestSuite[];
  onSelectSuite: (suite: TestSuite) => void;
  onSelectTestCase: (testCase: ManualTestCase) => void;
  selectedSuiteId?: number;
  level?: number;
}

function TestSuiteTree({ 
  testSuite, 
  testCases, 
  childSuites, 
  onSelectSuite, 
  onSelectTestCase, 
  selectedSuiteId,
  level = 0 
}: TestSuiteTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const suiteTestCases = testCases.filter(tc => tc.testSuiteId === testSuite.id);
  const children = childSuites.filter(cs => cs.parentId === testSuite.id);

  return (
    <div className={`${level > 0 ? 'ml-4' : ''}`}>
      <div 
        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
          selectedSuiteId === testSuite.id ? 'bg-muted' : ''
        }`}
        onClick={() => {
          onSelectSuite(testSuite);
          setIsExpanded(!isExpanded);
        }}
      >
        {(children.length > 0 || suiteTestCases.length > 0) && (
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-500" />
        ) : (
          <Folder className="h-4 w-4 text-blue-500" />
        )}
        <span className="font-medium text-sm">{testSuite.name}</span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {suiteTestCases.length}
        </Badge>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-2 space-y-1">
          {children.map(child => (
            <TestSuiteTree
              key={child.id}
              testSuite={child}
              testCases={testCases}
              childSuites={childSuites}
              onSelectSuite={onSelectSuite}
              onSelectTestCase={onSelectTestCase}
              selectedSuiteId={selectedSuiteId}
              level={level + 1}
            />
          ))}
          {suiteTestCases.map(testCase => {
            const priority = priorityOptions.find(p => p.value === testCase.priority);
            const PriorityIcon = priority?.icon || Clock;
            
            return (
              <div
                key={testCase.id}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onSelectTestCase(testCase)}
              >
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {testCase.title}
                </span>
                <div className={`w-2 h-2 rounded-full ${priority?.color || 'bg-gray-500'}`} />
                <PriorityIcon className="h-3 w-3 text-gray-400" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateTestCase() {
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<ManualTestCase | null>(null);
  const [isCreateTestCaseOpen, setIsCreateTestCaseOpen] = useState(false);
  const [isCreateSuiteOpen, setIsCreateSuiteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: testSuites = [] } = useQuery<TestSuite[]>({
    queryKey: ['/api/test-suites'],
  });

  const { data: testCases = [] } = useQuery<ManualTestCase[]>({
    queryKey: ['/api/manual-test-cases'],
  });

  const createTestCaseMutation = useMutation({
    mutationFn: async (data: CreateTestCaseForm) => {
      return apiRequest('/api/manual-test-cases', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-test-cases'] });
      setIsCreateTestCaseOpen(false);
    },
  });

  const createTestSuiteMutation = useMutation({
    mutationFn: async (data: CreateTestSuiteForm) => {
      return apiRequest('/api/test-suites', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-suites'] });
      setIsCreateSuiteOpen(false);
    },
  });

  const testCaseForm = useForm<CreateTestCaseForm>({
    resolver: zodResolver(createTestCaseSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      priority: 'medium',
      category: '',
      tags: [],
    },
  });

  const testSuiteForm = useForm<CreateTestSuiteForm>({
    resolver: zodResolver(createTestSuiteSchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: undefined,
    },
  });

  const onCreateTestCase = (data: CreateTestCaseForm) => {
    createTestCaseMutation.mutate({
      ...data,
      testSuiteId: selectedSuite?.id || null,
    });
  };

  const onCreateTestSuite = (data: CreateTestSuiteForm) => {
    createTestSuiteMutation.mutate({
      ...data,
      parentId: selectedSuite?.id || null,
    });
  };

  const rootSuites = testSuites.filter(suite => !suite.parentId);
  const filteredTestCases = testCases.filter(tc => {
    const matchesSearch = searchTerm === "" || 
      tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tc.description && tc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === "all" || tc.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const selectedSuiteTestCases = selectedSuite 
    ? filteredTestCases.filter(tc => tc.testSuiteId === selectedSuite.id)
    : filteredTestCases.filter(tc => !tc.testSuiteId);

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Case Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize test cases into test suites and folders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateSuiteOpen} onOpenChange={setIsCreateSuiteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Folder className="h-4 w-4 mr-1" />
                New Test Suite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Test Suite</DialogTitle>
              </DialogHeader>
              <Form {...testSuiteForm}>
                <form onSubmit={testSuiteForm.handleSubmit(onCreateTestSuite)} className="space-y-4">
                  <FormField
                    control={testSuiteForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test suite name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSuiteForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the test suite" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedSuite && (
                    <div className="text-sm text-muted-foreground">
                      Parent Suite: {selectedSuite.name}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateSuiteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTestSuiteMutation.isPending}>
                      Create Suite
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTestCaseOpen} onOpenChange={setIsCreateTestCaseOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Test Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Create Test Case</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <Form {...testCaseForm}>
                  <form onSubmit={testCaseForm.handleSubmit(onCreateTestCase)} className="space-y-4 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={testCaseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter test case title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testCaseForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {priorityOptions.map((priority) => {
                                  const IconComponent = priority.icon;
                                  return (
                                    <SelectItem key={priority.value} value={priority.value}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                                        <IconComponent className="h-4 w-4" />
                                        {priority.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={testCaseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief description of the test case" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testCaseForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Steps</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="1. Step one&#10;2. Step two&#10;3. Expected result"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testCaseForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Authentication, UI, API" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedSuite && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium">Test Suite</div>
                        <div className="text-sm text-muted-foreground">{selectedSuite.name}</div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateTestCaseOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTestCaseMutation.isPending}>
                        Create Test Case
                      </Button>
                    </div>
                  </form>
                </Form>
              </ScrollArea>
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
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOptions.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Suite Tree */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-500" />
              Test Suites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {rootSuites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No test suites yet</p>
                    <p className="text-xs text-muted-foreground">Create your first test suite to organize test cases</p>
                  </div>
                ) : (
                  <>
                    <div 
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        !selectedSuite ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedSuite(null)}
                    >
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">All Test Cases</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {testCases.filter(tc => !tc.testSuiteId).length}
                      </Badge>
                    </div>
                    {rootSuites.map(suite => (
                      <TestSuiteTree
                        key={suite.id}
                        testSuite={suite}
                        testCases={testCases}
                        childSuites={testSuites}
                        onSelectSuite={setSelectedSuite}
                        onSelectTestCase={setSelectedTestCase}
                        selectedSuiteId={selectedSuite?.id}
                      />
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Cases List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                {selectedSuite ? selectedSuite.name : 'All Test Cases'}
                <Badge variant="secondary">
                  {selectedSuiteTestCases.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {selectedSuiteTestCases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No test cases found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedSuite 
                      ? `No test cases in "${selectedSuite.name}" yet`
                      : "Create your first test case to get started"
                    }
                  </p>
                  <Button onClick={() => setIsCreateTestCaseOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Test Case
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSuiteTestCases.map((testCase) => {
                    const priority = priorityOptions.find(p => p.value === testCase.priority);
                    const PriorityIcon = priority?.icon || Clock;
                    
                    return (
                      <div
                        key={testCase.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedTestCase(testCase)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {testCase.title}
                            </h3>
                            {testCase.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {testCase.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className={`w-2 h-2 rounded-full ${priority?.color || 'bg-gray-500'}`} />
                            <PriorityIcon className="h-4 w-4 text-gray-400" />
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {priority?.label || 'Medium'}
                            </Badge>
                            {testCase.category && (
                              <span>{testCase.category}</span>
                            )}
                          </div>
                          <div>
                            #{testCase.id}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}