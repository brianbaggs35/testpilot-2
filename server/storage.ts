import { 
  TestRun, InsertTestRun,
  TestCase, InsertTestCase,
  TestSuite, InsertTestSuite,
  ManualTestCase, InsertManualTestCase,
  ManualTestRun, InsertManualTestRun,
  ManualTestExecution, InsertManualTestExecution,
  FailureAnalysis, InsertFailureAnalysis
} from "@shared/schema";

export interface IStorage {
  // Test Runs
  createTestRun(testRun: InsertTestRun): Promise<TestRun>;
  getTestRun(id: number): Promise<TestRun | undefined>;
  getAllTestRuns(): Promise<TestRun[]>;
  updateTestRun(id: number, updates: Partial<TestRun>): Promise<TestRun | undefined>;

  // Test Cases
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  getTestCase(id: number): Promise<TestCase | undefined>;
  getTestCasesByRunId(testRunId: number): Promise<TestCase[]>;
  getAllTestCases(): Promise<TestCase[]>;

  // Test Suites
  createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  getAllTestSuites(): Promise<TestSuite[]>;
  updateTestSuite(id: number, updates: Partial<TestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: number): Promise<boolean>;

  // Manual Test Cases
  createManualTestCase(testCase: InsertManualTestCase): Promise<ManualTestCase>;
  getManualTestCase(id: number): Promise<ManualTestCase | undefined>;
  getAllManualTestCases(): Promise<ManualTestCase[]>;
  getManualTestCasesByTestSuiteId(testSuiteId: number): Promise<ManualTestCase[]>;
  updateManualTestCase(id: number, updates: Partial<ManualTestCase>): Promise<ManualTestCase | undefined>;
  deleteManualTestCase(id: number): Promise<boolean>;

  // Manual Test Runs
  createManualTestRun(testRun: InsertManualTestRun): Promise<ManualTestRun>;
  getManualTestRun(id: number): Promise<ManualTestRun | undefined>;
  getAllManualTestRuns(): Promise<ManualTestRun[]>;
  updateManualTestRun(id: number, updates: Partial<ManualTestRun>): Promise<ManualTestRun | undefined>;

  // Manual Test Execution
  createManualTestExecution(execution: InsertManualTestExecution): Promise<ManualTestExecution>;
  getManualTestExecutionsByRunId(testRunId: number): Promise<ManualTestExecution[]>;
  updateManualTestExecution(id: number, updates: Partial<ManualTestExecution>): Promise<ManualTestExecution | undefined>;

  // Failure Analysis
  createFailureAnalysis(analysis: InsertFailureAnalysis): Promise<FailureAnalysis>;
  getFailureAnalysis(id: number): Promise<FailureAnalysis | undefined>;
  getAllFailureAnalysis(): Promise<FailureAnalysis[]>;
  updateFailureAnalysis(id: number, updates: Partial<FailureAnalysis>): Promise<FailureAnalysis | undefined>;
  getFailureAnalysisByTestCaseId(testCaseId: number): Promise<FailureAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private testRuns: Map<number, TestRun>;
  private testCases: Map<number, TestCase>;
  private testSuites: Map<number, TestSuite>;
  private manualTestCases: Map<number, ManualTestCase>;
  private manualTestRuns: Map<number, ManualTestRun>;
  private manualTestExecutions: Map<number, ManualTestExecution>;
  private failureAnalyses: Map<number, FailureAnalysis>;
  private currentTestRunId: number;
  private currentTestCaseId: number;
  private currentTestSuiteId: number;
  private currentManualTestCaseId: number;
  private currentManualTestRunId: number;
  private currentManualTestExecutionId: number;
  private currentFailureAnalysisId: number;

  constructor() {
    this.testRuns = new Map();
    this.testCases = new Map();
    this.testSuites = new Map();
    this.manualTestCases = new Map();
    this.manualTestRuns = new Map();
    this.manualTestExecutions = new Map();
    this.failureAnalyses = new Map();
    this.currentTestRunId = 1;
    this.currentTestCaseId = 1;
    this.currentTestSuiteId = 1;
    this.currentManualTestCaseId = 1;
    this.currentManualTestRunId = 1;
    this.currentManualTestExecutionId = 1;
    this.currentFailureAnalysisId = 1;
  }

  // Test Runs
  async createTestRun(insertTestRun: InsertTestRun): Promise<TestRun> {
    const id = this.currentTestRunId++;
    const testRun: TestRun = {
      id,
      type: insertTestRun.type,
      name: insertTestRun.name,
      status: insertTestRun.status,
      totalTests: insertTestRun.totalTests || 0,
      passedTests: insertTestRun.passedTests || 0,
      failedTests: insertTestRun.failedTests || 0,
      skippedTests: insertTestRun.skippedTests || 0,
      duration: insertTestRun.duration || null,
      xmlContent: insertTestRun.xmlContent || null,
      createdAt: new Date(),
    };
    this.testRuns.set(id, testRun);
    return testRun;
  }

  async getTestRun(id: number): Promise<TestRun | undefined> {
    return this.testRuns.get(id);
  }

  async getAllTestRuns(): Promise<TestRun[]> {
    return Array.from(this.testRuns.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateTestRun(id: number, updates: Partial<TestRun>): Promise<TestRun | undefined> {
    const testRun = this.testRuns.get(id);
    if (!testRun) return undefined;
    const updatedTestRun = { ...testRun, ...updates };
    this.testRuns.set(id, updatedTestRun);
    return updatedTestRun;
  }

  // Test Cases
  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const id = this.currentTestCaseId++;
    const testCase: TestCase = {
      id,
      name: insertTestCase.name,
      className: insertTestCase.className || null,
      status: insertTestCase.status,
      duration: insertTestCase.duration || null,
      testRunId: insertTestCase.testRunId || null,
      errorMessage: insertTestCase.errorMessage || null,
      stackTrace: insertTestCase.stackTrace || null,
      attachments: insertTestCase.attachments || null,
    };
    this.testCases.set(id, testCase);
    return testCase;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async getTestCasesByRunId(testRunId: number): Promise<TestCase[]> {
    return Array.from(this.testCases.values()).filter(tc => tc.testRunId === testRunId);
  }

  async getAllTestCases(): Promise<TestCase[]> {
    return Array.from(this.testCases.values());
  }

  // Test Suites
  async createTestSuite(insertTestSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.currentTestSuiteId++;
    const testSuite: TestSuite = {
      id,
      ...insertTestSuite,
      createdAt: new Date(),
    };
    this.testSuites.set(id, testSuite);
    return testSuite;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }

  async getAllTestSuites(): Promise<TestSuite[]> {
    return Array.from(this.testSuites.values());
  }

  async updateTestSuite(id: number, updates: Partial<TestSuite>): Promise<TestSuite | undefined> {
    const testSuite = this.testSuites.get(id);
    if (testSuite) {
      const updated = { ...testSuite, ...updates };
      this.testSuites.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteTestSuite(id: number): Promise<boolean> {
    return this.testSuites.delete(id);
  }

  // Manual Test Cases
  async createManualTestCase(insertManualTestCase: InsertManualTestCase): Promise<ManualTestCase> {
    const id = this.currentManualTestCaseId++;
    const manualTestCase: ManualTestCase = {
      ...insertManualTestCase,
      id,
      createdAt: new Date(),
    };
    this.manualTestCases.set(id, manualTestCase);
    return manualTestCase;
  }

  async getManualTestCase(id: number): Promise<ManualTestCase | undefined> {
    return this.manualTestCases.get(id);
  }

  async getAllManualTestCases(): Promise<ManualTestCase[]> {
    return Array.from(this.manualTestCases.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateManualTestCase(id: number, updates: Partial<ManualTestCase>): Promise<ManualTestCase | undefined> {
    const testCase = this.manualTestCases.get(id);
    if (!testCase) return undefined;
    const updatedTestCase = { ...testCase, ...updates };
    this.manualTestCases.set(id, updatedTestCase);
    return updatedTestCase;
  }

  async deleteManualTestCase(id: number): Promise<boolean> {
    return this.manualTestCases.delete(id);
  }

  // Manual Test Runs
  async createManualTestRun(insertManualTestRun: InsertManualTestRun): Promise<ManualTestRun> {
    const id = this.currentManualTestRunId++;
    const manualTestRun: ManualTestRun = {
      ...insertManualTestRun,
      id,
      createdAt: new Date(),
    };
    this.manualTestRuns.set(id, manualTestRun);
    return manualTestRun;
  }

  async getManualTestRun(id: number): Promise<ManualTestRun | undefined> {
    return this.manualTestRuns.get(id);
  }

  async getAllManualTestRuns(): Promise<ManualTestRun[]> {
    return Array.from(this.manualTestRuns.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateManualTestRun(id: number, updates: Partial<ManualTestRun>): Promise<ManualTestRun | undefined> {
    const testRun = this.manualTestRuns.get(id);
    if (!testRun) return undefined;
    const updatedTestRun = { ...testRun, ...updates };
    this.manualTestRuns.set(id, updatedTestRun);
    return updatedTestRun;
  }

  // Manual Test Execution
  async createManualTestExecution(insertManualTestExecution: InsertManualTestExecution): Promise<ManualTestExecution> {
    const id = this.currentManualTestExecutionId++;
    const manualTestExecution: ManualTestExecution = {
      ...insertManualTestExecution,
      id,
    };
    this.manualTestExecutions.set(id, manualTestExecution);
    return manualTestExecution;
  }

  async getManualTestExecutionsByRunId(testRunId: number): Promise<ManualTestExecution[]> {
    return Array.from(this.manualTestExecutions.values()).filter(mte => mte.testRunId === testRunId);
  }

  async updateManualTestExecution(id: number, updates: Partial<ManualTestExecution>): Promise<ManualTestExecution | undefined> {
    const execution = this.manualTestExecutions.get(id);
    if (!execution) return undefined;
    const updatedExecution = { ...execution, ...updates };
    this.manualTestExecutions.set(id, updatedExecution);
    return updatedExecution;
  }

  // Failure Analysis
  async createFailureAnalysis(insertFailureAnalysis: InsertFailureAnalysis): Promise<FailureAnalysis> {
    const id = this.currentFailureAnalysisId++;
    const failureAnalysis: FailureAnalysis = {
      ...insertFailureAnalysis,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.failureAnalyses.set(id, failureAnalysis);
    return failureAnalysis;
  }

  async getFailureAnalysis(id: number): Promise<FailureAnalysis | undefined> {
    return this.failureAnalyses.get(id);
  }

  async getAllFailureAnalysis(): Promise<FailureAnalysis[]> {
    return Array.from(this.failureAnalyses.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async updateFailureAnalysis(id: number, updates: Partial<FailureAnalysis>): Promise<FailureAnalysis | undefined> {
    const analysis = this.failureAnalyses.get(id);
    if (!analysis) return undefined;
    const updatedAnalysis = { ...analysis, ...updates, updatedAt: new Date() };
    this.failureAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async getFailureAnalysisByTestCaseId(testCaseId: number): Promise<FailureAnalysis | undefined> {
    return Array.from(this.failureAnalyses.values()).find(fa => fa.testCaseId === testCaseId);
  }
}

export const storage = new MemStorage();
