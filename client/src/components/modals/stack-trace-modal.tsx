import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Image, Edit, Save, X, AlertTriangle, CheckCircle, Clock, Bug } from "lucide-react";
import { TestCase } from "@shared/schema";
import { useState } from "react";

interface StackTraceModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkResolved?: (testCaseId: number) => void;
  onStatusChange?: (testCaseId: number, status: string, notes?: string) => void;
}

const statusOptions = [
  { value: 'new', label: 'New', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'investigating', label: 'Investigating', icon: Clock, color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', icon: Edit, color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'wont_fix', label: 'Won\'t Fix', icon: X, color: 'bg-gray-500' },
  { value: 'duplicate', label: 'Duplicate', icon: Bug, color: 'bg-purple-500' },
];

export function StackTraceModal({ testCase, isOpen, onClose, onMarkResolved, onStatusChange }: StackTraceModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('new');
  const [notes, setNotes] = useState('');
  
  if (!testCase) return null;

  const handleStatusUpdate = () => {
    if (onStatusChange) {
      onStatusChange(testCase.id, currentStatus, notes);
    }
    setIsEditing(false);
  };

  const handleMarkResolved = () => {
    if (onMarkResolved) {
      onMarkResolved(testCase.id);
    }
    onClose();
  };

  const getCurrentStatusInfo = () => {
    return statusOptions.find(s => s.value === currentStatus) || statusOptions[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Test Case Details - {testCase.name}
              <Badge variant={testCase.status === "failed" ? "destructive" : "secondary"}>
                {testCase.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Update Status
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed information and stack trace for the failed test case
          </DialogDescription>
        </DialogHeader>

        {/* Status Management Section */}
        {isEditing && (
          <div className="bg-muted/30 p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Update Test Case Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={currentStatus} onValueChange={setCurrentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => {
                      const IconComponent = status.icon;
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <IconComponent className="h-4 w-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add resolution notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleStatusUpdate}>
                <Save className="h-4 w-4 mr-1" />
                Update Status
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-6 pr-4">
              {/* Error Message */}
              {testCase.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Error Message
                  </h4>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-800 dark:text-red-200 font-mono leading-relaxed">
                      {testCase.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {testCase.stackTrace && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Bug className="h-4 w-4 text-orange-500" />
                    Stack Trace
                  </h4>
                  <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 border">
                    <ScrollArea className="h-[200px] w-full">
                      <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
                        {testCase.stackTrace}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              )}
              
              {/* Attachments */}
              {testCase.attachments && testCase.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Attachments
                  </h4>
                  <div className="space-y-3">
                    {testCase.attachments.map((attachment, index) => {
                      const isImage = attachment.toLowerCase().includes('screenshot') || 
                                    attachment.toLowerCase().includes('.png') || 
                                    attachment.toLowerCase().includes('.jpg');
                      
                      return (
                        <div key={index} className="flex items-center p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                          {isImage ? (
                            <Image className="h-5 w-5 text-blue-500 mr-3" />
                          ) : (
                            <FileText className="h-5 w-5 text-green-500 mr-3" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{attachment}</p>
                            <p className="text-xs text-muted-foreground">
                              {isImage ? "Screenshot" : "Log file"}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              {/* Test Case Details */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Test Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-sm text-muted-foreground">Class:</span>
                      <span className="text-sm font-mono font-medium">{testCase.className || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span className="text-sm font-medium">{testCase.duration ? `${testCase.duration}ms` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-sm text-muted-foreground">Test Run ID:</span>
                      <span className="text-sm font-medium">#{testCase.testRunId}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-sm text-muted-foreground">Test ID:</span>
                      <span className="text-sm font-medium">#{testCase.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Test Case #{testCase.id} • Run #{testCase.testRunId}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {testCase.status === "failed" && onMarkResolved && (
              <Button onClick={handleMarkResolved}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
