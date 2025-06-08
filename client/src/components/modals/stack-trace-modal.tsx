import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image } from "lucide-react";
import { TestCase } from "@shared/schema";

interface StackTraceModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkResolved?: (testCaseId: number) => void;
}

export function StackTraceModal({ testCase, isOpen, onClose, onMarkResolved }: StackTraceModalProps) {
  if (!testCase) return null;

  const handleMarkResolved = () => {
    if (onMarkResolved) {
      onMarkResolved(testCase.id);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Stack Trace - {testCase.name}
            <Badge variant={testCase.status === "failed" ? "destructive" : "secondary"}>
              {testCase.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {/* Error Message */}
              {testCase.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Error Message</h4>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                      {testCase.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {testCase.stackTrace && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Stack Trace</h4>
                  <div className="console-bg rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap text-green-400">
                      {testCase.stackTrace}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Attachments */}
              {testCase.attachments && testCase.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {testCase.attachments.map((attachment, index) => {
                      const isImage = attachment.toLowerCase().includes('screenshot') || 
                                    attachment.toLowerCase().includes('.png') || 
                                    attachment.toLowerCase().includes('.jpg');
                      
                      return (
                        <div key={index} className="flex items-center p-3 border border-border rounded-lg">
                          {isImage ? (
                            <Image className="h-4 w-4 text-muted-foreground mr-3" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground mr-3" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{attachment}</p>
                            <p className="text-xs text-muted-foreground">
                              {isImage ? "Screenshot" : "Log file"}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Test Case Details */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Test Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Class:</span>
                    <span className="ml-2 font-mono">{testCase.className || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2">{testCase.duration ? `${testCase.duration}ms` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {testCase.status === "failed" && onMarkResolved && (
            <Button onClick={handleMarkResolved}>
              Mark as Resolved
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
