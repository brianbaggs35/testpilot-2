import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartData {
  week: string;
  passed: number;
  failed: number;
  flaky: number;
}

const mockData: ChartData[] = [
  { week: "Week 1", passed: 89, failed: 8, flaky: 3 },
  { week: "Week 2", passed: 92, failed: 6, flaky: 2 },
  { week: "Week 3", passed: 94, failed: 4, flaky: 2 },
  { week: "Week 4", passed: 96, failed: 3, flaky: 1 },
];

export function TestResultsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results Trend</CardTitle>
        <CardDescription>Last 30 days performance</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="passed" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              name="Passed"
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="hsl(0, 84%, 60%)" 
              strokeWidth={2}
              name="Failed"
            />
            <Line 
              type="monotone" 
              dataKey="flaky" 
              stroke="hsl(43, 96%, 56%)" 
              strokeWidth={2}
              name="Flaky"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
