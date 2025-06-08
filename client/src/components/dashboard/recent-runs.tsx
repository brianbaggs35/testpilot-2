import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TestRun } from "@shared/schema";

export function RecentRuns() {
  const { data: testRuns, isLoading } = useQuery<TestRun[]>({
    queryKey: ["/api/test-runs"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentRuns = testRuns?.slice(0, 4) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "w-2 h-2 bg-green-500 rounded-full";
      case "failed":
        return "w-2 h-2 bg-red-500 rounded-full";
      case "running":
        return "w-2 h-2 bg-yellow-500 rounded-full";
      default:
        return "w-2 h-2 bg-gray-500 rounded-full";
    }
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 95) return "text-green-600";
    if (passRate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Test Runs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentRuns.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No test runs available
            </div>
          ) : (
            recentRuns.map((run) => {
              const passRate = run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0;
              return (
                <div key={run.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={getStatusColor(run.status)}></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-foreground">{run.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPassRateColor(passRate)}`}>
                        {passRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">{run.totalTests} tests</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-6 py-3 bg-muted">
          <Link href="/automated/history">
            <a className="text-sm text-primary hover:text-primary/80 font-medium">
              View all runs →
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
