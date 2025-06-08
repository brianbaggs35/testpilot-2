import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Eye, Edit, Trash2, Tag, FolderOpen, Plus, Grid, List } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManualTestCase } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrganizeCases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selectedTestCase, setSelectedTestCase] = useState<ManualTestCase | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testCases, isLoading } = useQuery<ManualTestCase[]>({
    queryKey: ["/api/manual-test-cases"],
  });

  const deleteTestCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/manual-test-cases/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Test Case Deleted",
        description: "Manual test case has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-test-cases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete test case.",
        variant: "destructive",
      });
    },
  });

  // Get unique values for filters
  const categories = Array.from(new Set(
    testCases?.map(tc => tc.category).filter(Boolean) || []
  ));

  const allTags = Array.from(new Set(
    testCases?.flatMap(tc => tc.tags || []) || []
  ));

  const filteredTestCases = testCases?.filter((testCase) => {
    const matchesSearch = testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (testCase.description && testCase.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = priorityFilter === "all" || testCase.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || testCase.category === categoryFilter;
    const matchesTag = tagFilter === "all" || (testCase.tags && testCase.tags.includes(tagFilter));
    
    return matchesSearch && matchesPriority && matchesCategory && matchesTag;
  }) || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const handleViewTestCase = (testCase: ManualTestCase) => {
    setSelectedTestCase(testCase);
    setIsViewModalOpen(true);
  };

  const handleDeleteTestCase = (id: number) => {
    if (confirm("Are you sure you want to delete this test case? This action cannot be undone.")) {
      deleteTestCaseMutation.mutate(id);
    }
  };

  // Group test cases by category for card view
  const groupedByCategory = filteredTestCases.reduce((groups, testCase) => {
    const category = testCase.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(testCase);
    return groups;
  }, {} as Record<string, ManualTestCase[]>);

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
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
            <h1 className="text-2xl font-bold text-foreground">Organize Test Cases</h1>
            <p className="text-muted-foreground">Manage and organize your manual test cases</p>
          </div>
          <Button asChild>
            <a href="/manual/create-test-cases">
              <Plus className="h-4 w-4 mr-2" />
              New Test Case
            </a>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{testCases?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold">
                    {testCases?.filter(tc => tc.priority === "critical").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-orange-500 rounded-full" />
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold">
                    {testCases?.filter(tc => tc.priority === "high").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="table" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Card View
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search test cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setTagFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Cases ({filteredTestCases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTestCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No test cases found matching your criteria.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTestCases.map((testCase) => (
                        <TableRow key={testCase.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{testCase.title}</div>
                              {testCase.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-md">
                                  {testCase.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {testCase.category ? (
                              <Badge variant="outline">{testCase.category}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Uncategorized</span>
                            )}
                          </TableCell>
                          <TableCell>{getPriorityBadge(testCase.priority)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {testCase.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {testCase.tags && testCase.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{testCase.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(testCase.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewTestCase(testCase)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTestCase(testCase.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            {Object.keys(groupedByCategory).length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-muted-foreground">
                    No test cases found matching your criteria.
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedByCategory).map(([category, cases]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category}</span>
                      <Badge variant="outline">{cases.length} cases</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cases.map((testCase) => (
                        <Card key={testCase.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm line-clamp-2">{testCase.title}</h4>
                                {getPriorityBadge(testCase.priority)}
                              </div>
                              
                              {testCase.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {testCase.description}
                                </p>
                              )}
                              
                              {testCase.tags && testCase.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {testCase.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {testCase.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{testCase.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(testCase.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewTestCase(testCase)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteTestCase(testCase.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* View Test Case Modal */}
        {selectedTestCase && (
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {selectedTestCase.title}
                  {getPriorityBadge(selectedTestCase.priority)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedTestCase.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedTestCase.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{selectedTestCase.category || "Uncategorized"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{new Date(selectedTestCase.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {selectedTestCase.tags && selectedTestCase.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTestCase.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Test Content</h4>
                  <div 
                    className="prose prose-sm max-w-none border border-border rounded-lg p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: selectedTestCase.content }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
