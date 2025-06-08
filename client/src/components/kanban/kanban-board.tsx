import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  onClick?: () => void;
}

interface KanbanColumnProps {
  title: string;
  items: KanbanItem[];
  bgColor: string;
  count: number;
}

function KanbanColumn({ title, items, bgColor, count }: KanbanColumnProps) {
  return (
    <div className={`${bgColor} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-current"
            onClick={item.onClick}
          >
            <CardContent className="p-3">
              <p className="text-xs font-medium text-foreground mb-1">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
              {item.priority && (
                <Badge 
                  variant={item.priority === "critical" ? "destructive" : "outline"} 
                  className="text-xs mt-2"
                >
                  {item.priority}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  columns: {
    title: string;
    status: string;
    bgColor: string;
    items: KanbanItem[];
  }[];
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          items={column.items}
          bgColor={column.bgColor}
          count={column.items.length}
        />
      ))}
    </div>
  );
}
