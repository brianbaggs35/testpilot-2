import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TestRun, TestCase, ManualTestRun, ManualTestCase, ManualTestExecution } from '@shared/schema';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface AutomatedReportOptions {
  testRuns: TestRun[];
  testCases: TestCase[];
  reportType: string;
  includeCharts: boolean;
  includeDetails: boolean;
  dateRange: string;
}

interface ManualReportOptions {
  testRuns: ManualTestRun[];
  testCases: ManualTestCase[];
  executions: ManualTestExecution[];
  reportType: string;
  includeCharts: boolean;
  includeDetails: boolean;
  groupByCategory: boolean;
  dateRange: string;
}

/**
 * Generate PDF report for automated test results
 */
export async function generateAutomatedTestReport(options: AutomatedReportOptions): Promise<void> {
  const { testRuns, testCases, reportType, includeCharts, includeDetails, dateRange } = options;

  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Automated Test Report', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
  
  yPosition += 5;
  doc.text(`Report Type: ${reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 20, yPosition);
  
  yPosition += 5;
  doc.text(`Date Range: ${dateRange.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 20, yPosition);
  
  yPosition += 15;

  // Executive Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPosition);
  yPosition += 10;

  const totalTests = testCases.length;
  const passedTests = testCases.filter(tc => tc.status === 'passed').length;
  const failedTests = testCases.filter(tc => tc.status === 'failed').length;
  const skippedTests = testCases.filter(tc => tc.status === 'skipped').length;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Test Runs', testRuns.length.toString()],
    ['Total Test Cases', totalTests.toString()],
    ['Passed Tests', passedTests.toString()],
    ['Failed Tests', failedTests.toString()],
    ['Skipped Tests', skippedTests.toString()],
    ['Pass Rate', `${passRate}%`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 10 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Test Runs Summary
  if (testRuns.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Runs Summary', 20, yPosition);
    yPosition += 10;

    const runsData = testRuns.map(run => [
      run.name,
      run.status,
      run.totalTests.toString(),
      `${run.totalTests > 0 ? ((run.passedTests / run.totalTests) * 100).toFixed(1) : '0'}%`,
      run.duration ? `${Math.round(run.duration / 60000)}m` : 'N/A',
      new Date(run.createdAt).toLocaleDateString(),
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Test Run', 'Status', 'Total Tests', 'Pass Rate', 'Duration', 'Date']],
      body: runsData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Failed Tests Analysis (if reportType is failures or detailed)
  if ((reportType === 'failures' || reportType === 'detailed') && failedTests > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Failed Tests Analysis', 20, yPosition);
    yPosition += 10;

    const failedTestCases = testCases.filter(tc => tc.status === 'failed');
    const failedData = failedTestCases.map(tc => [
      tc.name,
      tc.className || 'N/A',
      tc.errorMessage || 'No error message',
      tc.duration ? `${tc.duration}ms` : 'N/A',
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Test Name', 'Class', 'Error Message', 'Duration']],
      body: failedData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
      columnStyles: {
        2: { cellWidth: 60 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Detailed Test Results (if includeDetails is true)
  if (includeDetails && testCases.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Test Results', 20, yPosition);
    yPosition += 10;

    const detailedData = testCases.map(tc => [
      tc.name,
      tc.className || 'N/A',
      tc.status,
      tc.duration ? `${tc.duration}ms` : 'N/A',
      testRuns.find(run => run.id === tc.testRunId)?.name || 'Unknown',
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Test Name', 'Class', 'Status', 'Duration', 'Test Run']],
      body: detailedData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `QA Platform - Automated Test Report - Page ${i} of ${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Download the PDF
  const fileName = `automated-test-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate PDF report for manual test results
 */
export async function generateManualTestReport(options: ManualReportOptions): Promise<void> {
  const { testRuns, testCases, executions, reportType, includeCharts, includeDetails, groupByCategory, dateRange } = options;

  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Manual Test Report', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
  
  yPosition += 5;
  doc.text(`Report Type: ${reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 20, yPosition);
  
  yPosition += 5;
  doc.text(`Date Range: ${dateRange.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 20, yPosition);
  
  yPosition += 15;

  // Executive Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPosition);
  yPosition += 10;

  const totalExecutions = executions.length;
  const passedExecutions = executions.filter(exec => exec.status === 'passed').length;
  const failedExecutions = executions.filter(exec => exec.status === 'failed').length;
  const blockedExecutions = executions.filter(exec => exec.status === 'blocked').length;
  const pendingExecutions = executions.filter(exec => exec.status === 'pending').length;
  const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(1) : '0';

  // Calculate coverage
  const totalTestCases = testCases.length;
  const executedTestCases = new Set(executions.map(exec => exec.testCaseId)).size;
  const coverage = totalTestCases > 0 ? ((executedTestCases / totalTestCases) * 100).toFixed(1) : '0';

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Test Runs', testRuns.length.toString()],
    ['Total Test Cases', totalTestCases.toString()],
    ['Total Executions', totalExecutions.toString()],
    ['Passed Executions', passedExecutions.toString()],
    ['Failed Executions', failedExecutions.toString()],
    ['Blocked Executions', blockedExecutions.toString()],
    ['Pending Executions', pendingExecutions.toString()],
    ['Pass Rate', `${passRate}%`],
    ['Test Coverage', `${coverage}%`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 10 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Test Runs Summary
  if (testRuns.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Runs Summary', 20, yPosition);
    yPosition += 10;

    const runsData = testRuns.map(run => {
      const runExecutions = executions.filter(exec => exec.testRunId === run.id);
      const runPassed = runExecutions.filter(exec => exec.status === 'passed').length;
      const runTotal = runExecutions.length;
      const runPassRate = runTotal > 0 ? ((runPassed / runTotal) * 100).toFixed(1) : '0';

      return [
        run.name,
        run.status.replace('_', ' '),
        runTotal.toString(),
        `${runPassRate}%`,
        run.assignedTo || 'Unassigned',
        new Date(run.createdAt).toLocaleDateString(),
      ];
    });

    doc.autoTable({
      startY: yPosition,
      head: [['Test Run', 'Status', 'Executions', 'Pass Rate', 'Assigned To', 'Date']],
      body: runsData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Test Case Coverage (if reportType is test-coverage or detailed-results)
  if (reportType === 'test-coverage' || reportType === 'detailed-results') {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Case Coverage', 20, yPosition);
    yPosition += 10;

    if (groupByCategory) {
      // Group test cases by category
      const categories = Array.from(new Set(testCases.map(tc => tc.category || 'Uncategorized')));
      
      for (const category of categories) {
        const categoryTestCases = testCases.filter(tc => (tc.category || 'Uncategorized') === category);
        const categoryExecutions = executions.filter(exec => 
          categoryTestCases.some(tc => tc.id === exec.testCaseId)
        );
        
        const categoryData = categoryTestCases.map(tc => {
          const execution = executions.find(exec => exec.testCaseId === tc.id);
          return [
            tc.title,
            tc.priority,
            execution ? execution.status : 'Not Executed',
            execution && execution.executedAt ? new Date(execution.executedAt).toLocaleDateString() : 'N/A',
          ];
        });

        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Category: ${category}`, 20, yPosition);
        yPosition += 5;

        doc.autoTable({
          startY: yPosition,
          head: [['Test Case', 'Priority', 'Status', 'Executed Date']],
          body: categoryData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
    } else {
      const coverageData = testCases.map(tc => {
        const execution = executions.find(exec => exec.testCaseId === tc.id);
        return [
          tc.title,
          tc.category || 'Uncategorized',
          tc.priority,
          execution ? execution.status : 'Not Executed',
          execution && execution.executedAt ? new Date(execution.executedAt).toLocaleDateString() : 'N/A',
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Test Case', 'Category', 'Priority', 'Status', 'Executed Date']],
        body: coverageData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
  }

  // Failed/Blocked Tests Analysis (if reportType is defect-summary)
  if (reportType === 'defect-summary') {
    const failedAndBlockedExecutions = executions.filter(exec => 
      exec.status === 'failed' || exec.status === 'blocked'
    );

    if (failedAndBlockedExecutions.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Defect Summary', 20, yPosition);
      yPosition += 10;

      const defectData = failedAndBlockedExecutions.map(exec => {
        const testCase = testCases.find(tc => tc.id === exec.testCaseId);
        const testRun = testRuns.find(run => run.id === exec.testRunId);
        return [
          testCase?.title || 'Unknown Test Case',
          testCase?.category || 'Uncategorized',
          exec.status,
          exec.notes || 'No notes',
          testRun?.name || 'Unknown Run',
          exec.executedAt ? new Date(exec.executedAt).toLocaleDateString() : 'N/A',
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Test Case', 'Category', 'Status', 'Notes', 'Test Run', 'Date']],
        body: defectData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { cellWidth: 40 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
  }

  // Detailed Execution Results (if includeDetails is true)
  if (includeDetails && executions.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Execution Results', 20, yPosition);
    yPosition += 10;

    const detailedData = executions.map(exec => {
      const testCase = testCases.find(tc => tc.id === exec.testCaseId);
      const testRun = testRuns.find(run => run.id === exec.testRunId);
      return [
        testCase?.title || 'Unknown Test Case',
        testCase?.priority || 'N/A',
        exec.status,
        exec.notes || 'No notes',
        testRun?.name || 'Unknown Run',
        exec.executedAt ? new Date(exec.executedAt).toLocaleDateString() : 'N/A',
      ];
    });

    doc.autoTable({
      startY: yPosition,
      head: [['Test Case', 'Priority', 'Status', 'Notes', 'Test Run', 'Executed Date']],
      body: detailedData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { cellWidth: 40 },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `QA Platform - Manual Test Report - Page ${i} of ${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Download the PDF
  const fileName = `manual-test-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Helper function to format duration in a readable format
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Helper function to get status color for charts
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return '#10B981'; // green
    case 'failed':
      return '#EF4444'; // red
    case 'skipped':
      return '#F59E0B'; // yellow
    case 'blocked':
      return '#F97316'; // orange
    case 'pending':
      return '#6B7280'; // gray
    default:
      return '#9CA3AF'; // default gray
  }
}
