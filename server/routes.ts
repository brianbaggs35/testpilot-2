import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertTestRunSchema, 
  insertTestCaseSchema,
  insertManualTestCaseSchema,
  insertManualTestRunSchema,
  insertManualTestExecutionSchema,
  insertFailureAnalysisSchema
} from "@shared/schema";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (_req, res) => {
    try {
      const testRuns = await storage.getAllTestRuns();
      const testCases = await storage.getAllTestCases();
      
      const totalTests = testCases.length;
      const passedTests = testCases.filter(tc => tc.status === 'passed').length;
      const failedTests = testCases.filter(tc => tc.status === 'failed').length;
      
      const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0";
      const avgDuration = testRuns.length > 0 
        ? (testRuns.reduce((sum, tr) => sum + (tr.duration || 0), 0) / testRuns.length / 60000).toFixed(1) + "m"
        : "0m";

      res.json({
        totalTests,
        passRate: passRate + "%",
        failedTests,
        avgDuration,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Test Runs
  app.get("/api/test-runs", async (_req, res) => {
    try {
      const testRuns = await storage.getAllTestRuns();
      res.json(testRuns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test runs" });
    }
  });

  app.get("/api/test-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testRun = await storage.getTestRun(id);
      if (!testRun) {
        return res.status(404).json({ message: "Test run not found" });
      }
      res.json(testRun);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test run" });
    }
  });

  app.post("/api/test-runs", async (req, res) => {
    try {
      const validatedData = insertTestRunSchema.parse(req.body);
      const testRun = await storage.createTestRun(validatedData);
      res.status(201).json(testRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test run data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test run" });
    }
  });

  // JUnit XML Upload
  app.post("/api/junit/upload", upload.single('xml'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No XML file provided" });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      const testRunName = req.body.name || `Test Run ${new Date().toISOString()}`;

      // Create test run
      const testRun = await storage.createTestRun({
        name: testRunName,
        type: 'automated',
        status: 'running',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        xmlContent
      });

      res.json({ message: "XML uploaded successfully", testRunId: testRun.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload XML" });
    }
  });

  // Process JUnit XML in batches
  app.post("/api/junit/process/:id", async (req, res) => {
    try {
      const testRunId = parseInt(req.params.id);
      const testRun = await storage.getTestRun(testRunId);
      
      if (!testRun) {
        return res.status(404).json({ message: "Test run not found" });
      }

      const testCases = req.body.testCases || [];
      
      // Process test cases in batch
      for (const tc of testCases) {
        const testCase = await storage.createTestCase({
          testRunId: testRun.id,
          name: tc.name,
          className: tc.className || null,
          status: tc.status,
          duration: tc.duration || null,
          errorMessage: tc.errorMessage || null,
          stackTrace: tc.stackTrace || null,
          attachments: tc.attachments || null
        });

        // Create failure analysis for failed and flaky tests
        if (tc.status === 'failed' || tc.status === 'flaky') {
          await storage.createFailureAnalysis({
            testCaseId: testCase.id,
            status: 'new_failures',
            assignedTo: null,
            resolution: null,
          });
        }
      }

      // Get updated counts
      const allTestCases = await storage.getTestCasesByRunId(testRunId);
      const totalTests = allTestCases.length;
      const passedTests = allTestCases.filter(tc => tc.status === 'passed').length;
      const failedTests = allTestCases.filter(tc => tc.status === 'failed').length;
      const skippedTests = allTestCases.filter(tc => tc.status === 'skipped').length;

      // Update test run with current results
      await storage.updateTestRun(testRunId, {
        status: testCases.length < 100 ? 'completed' : 'running', // Mark complete only if small batch
        totalTests,
        passedTests,
        failedTests,
        skippedTests
      });

      res.json({ 
        message: "Batch processed successfully",
        processed: testCases.length,
        totalProcessed: totalTests
      });
    } catch (error) {
      console.error('Error processing XML batch:', error);
      res.status(500).json({ message: "Failed to process XML batch" });
    }
  });

  // Test Cases
  app.get("/api/test-cases", async (req, res) => {
    try {
      const runId = req.query.runId;
      let testCases;
      
      if (runId) {
        testCases = await storage.getTestCasesByRunId(parseInt(runId as string));
      } else {
        testCases = await storage.getAllTestCases();
      }
      
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test cases" });
    }
  });

  // Failure Analysis
  app.get("/api/failure-analysis", async (_req, res) => {
    try {
      const analyses = await storage.getAllFailureAnalysis();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch failure analyses" });
    }
  });

  app.patch("/api/failure-analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const analysis = await storage.updateFailureAnalysis(id, updates);
      
      if (!analysis) {
        return res.status(404).json({ message: "Failure analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to update failure analysis" });
    }
  });

  // Test Suites
  app.get("/api/test-suites", async (req, res) => {
    try {
      const testSuites = await storage.getAllTestSuites();
      res.json(testSuites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suites" });
    }
  });

  app.post("/api/test-suites", async (req, res) => {
    try {
      const testSuite = await storage.createTestSuite(req.body);
      res.status(201).json(testSuite);
    } catch (error) {
      res.status(500).json({ message: "Failed to create test suite" });
    }
  });

  app.get("/api/test-suites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testSuite = await storage.getTestSuite(id);
      if (!testSuite) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.json(testSuite);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suite" });
    }
  });

  app.patch("/api/test-suites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testSuite = await storage.updateTestSuite(id, req.body);
      if (!testSuite) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.json(testSuite);
    } catch (error) {
      res.status(500).json({ message: "Failed to update test suite" });
    }
  });

  app.delete("/api/test-suites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTestSuite(id);
      if (!deleted) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.json({ message: "Test suite deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test suite" });
    }
  });

  // Manual Test Cases
  app.get("/api/manual-test-cases", async (_req, res) => {
    try {
      const testCases = await storage.getAllManualTestCases();
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manual test cases" });
    }
  });

  app.post("/api/manual-test-cases", async (req, res) => {
    try {
      const validatedData = insertManualTestCaseSchema.parse(req.body);
      const testCase = await storage.createManualTestCase(validatedData);
      res.status(201).json(testCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create manual test case" });
    }
  });

  app.put("/api/manual-test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const testCase = await storage.updateManualTestCase(id, updates);
      
      if (!testCase) {
        return res.status(404).json({ message: "Manual test case not found" });
      }
      
      res.json(testCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manual test case" });
    }
  });

  app.delete("/api/manual-test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteManualTestCase(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Manual test case not found" });
      }
      
      res.json({ message: "Manual test case deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete manual test case" });
    }
  });

  // Manual Test Executions
  app.get("/api/manual-test-executions", async (req, res) => {
    try {
      const testRunId = req.query.testRunId ? parseInt(req.query.testRunId as string) : undefined;
      let executions;
      
      if (testRunId) {
        executions = await storage.getManualTestExecutionsByRunId(testRunId);
      } else {
        // For now, return empty array if no testRunId specified
        executions = [];
      }
      
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manual test executions" });
    }
  });

  app.post("/api/manual-test-executions", async (req, res) => {
    try {
      const execution = await storage.createManualTestExecution(req.body);
      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to create manual test execution" });
    }
  });

  app.patch("/api/manual-test-executions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const execution = await storage.updateManualTestExecution(id, req.body);
      if (!execution) {
        return res.status(404).json({ message: "Manual test execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manual test execution" });
    }
  });

  // Manual Test Runs
  app.get("/api/manual-test-runs", async (_req, res) => {
    try {
      const testRuns = await storage.getAllManualTestRuns();
      res.json(testRuns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manual test runs" });
    }
  });

  app.post("/api/manual-test-runs", async (req, res) => {
    try {
      const validatedData = insertManualTestRunSchema.parse(req.body);
      const testRun = await storage.createManualTestRun(validatedData);
      res.status(201).json(testRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test run data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create manual test run" });
    }
  });

  // Manual Test Execution
  app.get("/api/manual-test-executions", async (req, res) => {
    try {
      const runId = req.query.runId;
      if (!runId) {
        return res.status(400).json({ message: "Run ID is required" });
      }
      
      const executions = await storage.getManualTestExecutionsByRunId(parseInt(runId as string));
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manual test executions" });
    }
  });

  app.post("/api/manual-test-executions", async (req, res) => {
    try {
      const validatedData = insertManualTestExecutionSchema.parse(req.body);
      const execution = await storage.createManualTestExecution(validatedData);
      res.status(201).json(execution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid execution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create manual test execution" });
    }
  });

  app.patch("/api/manual-test-executions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const execution = await storage.updateManualTestExecution(id, updates);
      
      if (!execution) {
        return res.status(404).json({ message: "Manual test execution not found" });
      }
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manual test execution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
