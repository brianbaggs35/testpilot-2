import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Eye, Download, Calendar, BarChart3, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TestRun, TestCase } from "@shared/schema";
import { Link } from "wouter";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: testRuns, isLoading: loadingRuns } = useQuery<TestRun[]>({
    queryKey: ["/api/test-runs"],
  });

  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
  });

  const filteredTestRuns = testRuns?.filter((run) => {
    const matchesSearch = run.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    const matchesType = typeFilter === "all" || run.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const runDate = new Date(run.createdAt);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today":
          matchesDate = daysAgo === 0;
          break;
        case "week":
          matchesDate = daysAgo <= 7;
          break;
        case "month":
          matchesDate = daysAgo <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Running</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        {type === "automated" ? "Automated" : "Manual"}
      </Badge>
    );
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "N/A";
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const calculatePassRate = (run: TestRun) => {
    if (run.totalTests === 0) return 0;
    return Math.round((run.passedTests / run.totalTests) * 100);
  };

  // Calculate summary statistics
  const summaryStats = testRuns ? {
    totalRuns: testRuns.length,
    successfulRuns: testRuns.filter(run => run.status === "passed").length,
    failedRuns: testRuns.filter(run => run.status === "failed").length,
    totalTests: testRuns.reduce((sum, run) => sum + run.totalTests, 0),
    avgPassRate: testRuns.length > 0 
      ? Math.round(testRuns.reduce((sum, run) => sum + calculatePassRate(run), 0) / testRuns.length)
      : 0,
  } : null;

  if (loadingRuns) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Test History</h1>
          <p className="text-muted-foreground">View and analyze historical test run data</p>
        </div>

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Runs</p>
                    <p className="text-2xl font-bold">{summaryStats.totalRuns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {summaryStats.totalRuns > 0 
                        ? Math.round((summaryStats.successfulRuns / summaryStats.totalRuns) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{summaryStats.totalTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                    <p className="text-2xl font-bold">{summaryStats.avgPassRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
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
                      placeholder="Search test runs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="automated">Automated</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Runs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Test Runs ({filteredTestRuns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTestRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No test runs found matching your criteria.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tests</TableHead>
                        <TableHead>Pass Rate</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTestRuns.map((run) => {
                        const passRate = calculatePassRate(run);
                        return (
                          <TableRow key={run.id}>
                            <TableCell className="font-medium">{run.name}</TableCell>
                            <TableCell>{getTypeBadge(run.type)}</TableCell>
                            <TableCell>{getStatusBadge(run.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{run.totalTests}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({run.passedTests}P/{run.failedTests}F/{run.skippedTests}S)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  passRate >= 90 ? "text-green-600" : 
                                  passRate >= 70 ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {passRate}%
                                </span>
                                <div className="w-12 bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      passRate >= 90 ? "bg-green-500" : 
                                      passRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${passRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDuration(run.duration)}</TableCell>
                            <TableCell>{new Date(run.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Link href={`/automated/test-results?runId=${run.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
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

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline View</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTestRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No test runs found matching your criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTestRuns.map((run, index) => {
                      const passRate = calculatePassRate(run);
                      return (
                        <div key={run.id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              run.status === "passed" ? "bg-green-500" :
                              run.status === "failed" ? "bg-red-500" :
                              run.status === "running" ? "bg-blue-500" : "bg-yellow-500"
                            }`}></div>
                            {index < filteredTestRuns.length - 1 && (
                              <div className="w-px h-8 bg-border mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{run.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(run.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTypeBadge(run.type)}
                                {getStatusBadge(run.status)}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Tests:</span>
                                <span className="ml-1 font-medium">{run.totalTests}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pass Rate:</span>
                                <span className={`ml-1 font-medium ${
                                  passRate >= 90 ? "text-green-600" : 
                                  passRate >= 70 ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {passRate}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="ml-1 font-medium">{formatDuration(run.duration)}</span>
                              </div>
                              <div>
                                <Link href={`/automated/test-results?runId=${run.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
