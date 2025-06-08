import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TestRun, TestCase, ManualTestRun, ManualTestCase, ManualTestExecution } from '@shared/schema';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Professional color palette
const colors = {
  primary: [37, 99, 235],
  secondary: [100, 116, 139],
  success: [5, 150, 105],
  warning: [217, 119, 6],
  danger: [220, 38, 38],
  gray: [107, 114, 128],
  lightGray: [248, 250, 252],
  darkGray: [55, 65, 81],
  white: [255, 255, 255],
  border: [229, 231, 235],
};

interface ReportOptions {
  testRuns: TestRun[] | ManualTestRun[];
  testCases: TestCase[] | ManualTestCase[];
  executions?: ManualTestExecution[];
  reportType: string;
  includeCharts: boolean;
  includeDetails: boolean;
  dateRange: string;
  reportTitle?: string;
  companyName?: string;
}

export class EnhancedPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margins = { top: 50, bottom: 30, left: 15, right: 15 };

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Add professional header with company branding
   */
  private addHeader(title: string, subtitle?: string): number {
    // Header background with gradient effect
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Add subtle gradient overlay
    this.doc.setFillColor(255, 255, 255, 0.1);
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Company logo placeholder
    this.doc.setFillColor(...colors.white);
    this.doc.roundedRect(15, 8, 30, 30, 3, 3, 'F');
    this.doc.setDrawColor(...colors.primary);
    this.doc.roundedRect(15, 8, 30, 30, 3, 3, 'S');
    
    // Logo text
    this.doc.setFontSize(14);
    this.doc.setTextColor(...colors.primary);
    this.doc.text('QA', 30, 27, { align: 'center' });
    
    // Main title
    this.doc.setFontSize(22);
    this.doc.setTextColor(...colors.white);
    this.doc.text(title, 55, 25);
    
    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(11);
      this.doc.setTextColor(255, 255, 255, 0.8);
      this.doc.text(subtitle, 55, 35);
    }
    
    // Reset colors
    this.doc.setTextColor(0, 0, 0);
    return this.margins.top;
  }

  /**
   * Add professional footer with page numbers and metadata
   */
  private addFooter(pageNumber: number, totalPages: number): void {
    const footerY = this.pageHeight - 20;
    
    // Footer line
    this.doc.setDrawColor(...colors.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margins.left, footerY - 5, this.pageWidth - this.margins.right, footerY - 5);
    
    // Footer content
    this.doc.setFontSize(8);
    this.doc.setTextColor(...colors.gray);
    
    const timestamp = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.doc.text(`Generated on ${timestamp}`, this.margins.left, footerY);
    this.doc.text(`Page ${pageNumber} of ${totalPages}`, this.pageWidth - 40, footerY);
    this.doc.text('QA Test Management Platform', this.pageWidth / 2, footerY, { align: 'center' });
  }

  /**
   * Add metric card with professional styling
   */
  private addMetricCard(x: number, y: number, width: number, title: string, value: string, color: number[], trend?: string): void {
    // Card shadow
    this.doc.setFillColor(0, 0, 0, 0.1);
    this.doc.roundedRect(x + 1, y + 1, width, 25, 3, 3, 'F');
    
    // Card background
    this.doc.setFillColor(...colors.white);
    this.doc.roundedRect(x, y, width, 25, 3, 3, 'F');
    
    // Card border
    this.doc.setDrawColor(...colors.border);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(x, y, width, 25, 3, 3, 'S');
    
    // Color accent bar
    this.doc.setFillColor(...color);
    this.doc.rect(x, y, 3, 25, 'F');
    
    // Value
    this.doc.setFontSize(18);
    this.doc.setTextColor(...colors.darkGray);
    this.doc.text(value, x + width/2, y + 12, { align: 'center' });
    
    // Title
    this.doc.setFontSize(9);
    this.doc.setTextColor(...colors.gray);
    this.doc.text(title, x + width/2, y + 20, { align: 'center' });
    
    // Trend indicator
    if (trend) {
      this.doc.setFontSize(7);
      this.doc.setTextColor(...color);
      this.doc.text(trend, x + width - 8, y + 8);
    }
  }

  /**
   * Add section header with professional styling
   */
  private addSectionHeader(title: string, y: number, description?: string): number {
    // Section divider line
    this.doc.setDrawColor(...colors.primary);
    this.doc.setLineWidth(2);
    this.doc.line(this.margins.left, y - 5, this.margins.left + 20, y - 5);
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(...colors.primary);
    this.doc.text(title, this.margins.left, y + 5);
    
    let nextY = y + 15;
    
    // Section description
    if (description) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...colors.gray);
      this.doc.text(description, this.margins.left, nextY);
      nextY += 10;
    }
    
    return nextY;
  }

  /**
   * Generate comprehensive automated test report
   */
  generateAutomatedReport(options: ReportOptions): Uint8Array {
    const { testRuns, testCases, reportType, includeDetails, dateRange } = options;
    
    let yPos = this.addHeader('Automated Test Report', `${reportType} • ${dateRange}`);
    yPos += 20;
    
    // Executive Summary Section
    yPos = this.addSectionHeader('Executive Summary', yPos, 'Key metrics and overall test execution results');
    yPos += 5;
    
    const totalTests = testCases.length;
    const passedTests = testCases.filter(tc => tc.status === 'passed').length;
    const failedTests = testCases.filter(tc => tc.status === 'failed').length;
    const skippedTests = testCases.filter(tc => tc.status === 'skipped').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
    
    const cardWidth = 42;
    const cardSpacing = 5;
    
    // Summary metrics cards
    this.addMetricCard(this.margins.left, yPos, cardWidth, 'Total Tests', totalTests.toString(), colors.primary);
    this.addMetricCard(this.margins.left + cardWidth + cardSpacing, yPos, cardWidth, 'Passed', passedTests.toString(), colors.success, '↗');
    this.addMetricCard(this.margins.left + (cardWidth + cardSpacing) * 2, yPos, cardWidth, 'Failed', failedTests.toString(), colors.danger, failedTests > 0 ? '↗' : '→');
    this.addMetricCard(this.margins.left + (cardWidth + cardSpacing) * 3, yPos, cardWidth, 'Pass Rate', `${passRate}%`, 
      parseFloat(passRate) >= 90 ? colors.success : parseFloat(passRate) >= 70 ? colors.warning : colors.danger);
    
    yPos += 35;
    
    // Test Run Summary
    if (testRuns.length > 0) {
      yPos = this.addSectionHeader('Test Run Summary', yPos, 'Overview of executed test runs');
      yPos += 5;
      
      testRuns.forEach((run, index) => {
        const runY = yPos + (index * 15);
        
        // Run status indicator
        const statusColor = run.status === 'completed' ? colors.success : 
                           run.status === 'running' ? colors.warning : colors.gray;
        this.doc.setFillColor(...statusColor);
        this.doc.circle(this.margins.left + 3, runY + 3, 2, 'F');
        
        // Run details
        this.doc.setFontSize(10);
        this.doc.setTextColor(...colors.darkGray);
        this.doc.text(`${run.name}`, this.margins.left + 10, runY + 5);
        
        this.doc.setFontSize(8);
        this.doc.setTextColor(...colors.gray);
        this.doc.text(`Status: ${run.status} | Tests: ${run.totalTests || 0}`, this.margins.left + 10, runY + 12);
      });
      
      yPos += testRuns.length * 15 + 20;
    }
    
    // Detailed Results Table
    if (includeDetails && testCases.length > 0) {
      yPos = this.addSectionHeader('Detailed Test Results', yPos, 'Complete breakdown of all test cases');
      yPos += 10;
      
      const tableData = testCases.map(tc => [
        tc.name.length > 60 ? tc.name.substring(0, 57) + '...' : tc.name,
        tc.status.toUpperCase(),
        tc.duration ? this.formatDuration(tc.duration) : 'N/A',
        tc.errorMessage ? (tc.errorMessage.length > 50 ? tc.errorMessage.substring(0, 47) + '...' : tc.errorMessage) : 'None'
      ]);
      
      this.doc.autoTable({
        head: [['Test Case', 'Status', 'Duration', 'Error Summary']],
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          lineColor: colors.border,
          lineWidth: 0.1,
          textColor: colors.darkGray
        },
        headStyles: { 
          fillColor: colors.primary,
          textColor: colors.white,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: colors.lightGray
        },
        columnStyles: {
          0: { cellWidth: 85 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 60 }
        },
        margin: { left: this.margins.left, right: this.margins.right }
      });
    }
    
    // Add footer
    this.addFooter(1, 1);
    
    return this.doc.output('arraybuffer');
  }

  /**
   * Generate comprehensive manual test report
   */
  generateManualReport(options: ReportOptions): Uint8Array {
    const { testRuns, testCases, executions = [], reportType, includeDetails, dateRange } = options;
    
    let yPos = this.addHeader('Manual Test Report', `${reportType} • ${dateRange}`);
    yPos += 20;
    
    // Executive Summary
    yPos = this.addSectionHeader('Executive Summary', yPos, 'Manual testing execution overview and results');
    yPos += 5;
    
    const totalTests = testCases.length;
    const totalExecutions = executions.length;
    const passedExecutions = executions.filter(ex => ex.status === 'passed').length;
    const failedExecutions = executions.filter(ex => ex.status === 'failed').length;
    const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(1) : '0';
    
    const cardWidth = 42;
    const cardSpacing = 5;
    
    this.addMetricCard(this.margins.left, yPos, cardWidth, 'Test Cases', totalTests.toString(), colors.primary);
    this.addMetricCard(this.margins.left + cardWidth + cardSpacing, yPos, cardWidth, 'Executed', totalExecutions.toString(), colors.secondary);
    this.addMetricCard(this.margins.left + (cardWidth + cardSpacing) * 2, yPos, cardWidth, 'Passed', passedExecutions.toString(), colors.success);
    this.addMetricCard(this.margins.left + (cardWidth + cardSpacing) * 3, yPos, cardWidth, 'Pass Rate', `${passRate}%`, 
      parseFloat(passRate) >= 90 ? colors.success : colors.warning);
    
    yPos += 40;
    
    // Test execution details
    if (includeDetails && executions.length > 0) {
      yPos = this.addSectionHeader('Execution Results', yPos, 'Detailed manual test execution outcomes');
      yPos += 10;
      
      const tableData = executions.map(ex => {
        const testCase = testCases.find(tc => tc.id === ex.testCaseId);
        return [
          testCase?.title || 'Unknown Test',
          ex.status.toUpperCase(),
          testCase?.priority || 'Medium',
          ex.notes ? (ex.notes.length > 40 ? ex.notes.substring(0, 37) + '...' : ex.notes) : 'No notes'
        ];
      });
      
      this.doc.autoTable({
        head: [['Test Case', 'Status', 'Priority', 'Notes']],
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          lineColor: colors.border,
          lineWidth: 0.1,
          textColor: colors.darkGray
        },
        headStyles: { 
          fillColor: colors.primary,
          textColor: colors.white,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: colors.lightGray
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 65 }
        },
        margin: { left: this.margins.left, right: this.margins.right }
      });
    }
    
    this.addFooter(1, 1);
    return this.doc.output('arraybuffer');
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    if (milliseconds < 3600000) return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
    return `${Math.floor(milliseconds / 3600000)}h ${Math.floor((milliseconds % 3600000) / 60000)}m`;
  }

  /**
   * Download PDF file
   */
  downloadPDF(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get PDF as blob for preview
   */
  getPDFBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Get PDF as data URL for preview
   */
  getPDFDataURL(): string {
    return this.doc.output('dataurlstring');
  }
}

// Convenience functions for backward compatibility
export async function generateAutomatedTestReport(options: ReportOptions): Promise<void> {
  const generator = new EnhancedPDFGenerator();
  generator.generateAutomatedReport(options);
  generator.downloadPDF(`automated-test-report-${Date.now()}.pdf`);
}

export async function generateManualTestReport(options: ReportOptions): Promise<void> {
  const generator = new EnhancedPDFGenerator();
  generator.generateManualReport(options);
  generator.downloadPDF(`manual-test-report-${Date.now()}.pdf`);
}