import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const testRuns = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'automated' | 'manual'
  status: text("status").notNull(), // 'passed' | 'failed' | 'running' | 'pending'
  totalTests: integer("total_tests").notNull().default(0),
  passedTests: integer("passed_tests").notNull().default(0),
  failedTests: integer("failed_tests").notNull().default(0),
  skippedTests: integer("skipped_tests").notNull().default(0),
  duration: integer("duration"), // in milliseconds
  xmlContent: text("xml_content"), // JUnit XML content for automated tests
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  testRunId: integer("test_run_id").references(() => testRuns.id),
  name: text("name").notNull(),
  className: text("class_name"),
  status: text("status").notNull(), // 'passed' | 'failed' | 'skipped' | 'flaky'
  duration: integer("duration"), // in milliseconds
  errorMessage: text("error_message"),
  stackTrace: text("stack_trace"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
});

export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const manualTestCases = pgTable("manual_test_cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(), // Rich text content
  priority: text("priority").notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  testSuiteId: integer("test_suite_id").references(() => testSuites.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const manualTestRuns = pgTable("manual_test_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // 'not_started' | 'in_progress' | 'completed'
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const manualTestExecution = pgTable("manual_test_execution", {
  id: serial("id").primaryKey(),
  testRunId: integer("test_run_id").references(() => manualTestRuns.id),
  testCaseId: integer("test_case_id").references(() => manualTestCases.id),
  status: text("status").notNull().default('pending'), // 'pending' | 'passed' | 'failed' | 'blocked'
  notes: text("notes"),
  executedAt: timestamp("executed_at"),
});

export const failureAnalysis = pgTable("failure_analysis", {
  id: serial("id").primaryKey(),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  status: text("status").notNull().default('new'), // 'new' | 'investigating' | 'resolved' | 'ignored'
  assignedTo: text("assigned_to"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertTestRunSchema = createInsertSchema(testRuns).omit({
  id: true,
  createdAt: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).omit({
  id: true,
  createdAt: true,
});

export const insertManualTestCaseSchema = createInsertSchema(manualTestCases).omit({
  id: true,
  createdAt: true,
});

export const insertManualTestRunSchema = createInsertSchema(manualTestRuns).omit({
  id: true,
  createdAt: true,
});

export const insertManualTestExecutionSchema = createInsertSchema(manualTestExecution).omit({
  id: true,
});

export const insertFailureAnalysisSchema = createInsertSchema(failureAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type ManualTestCase = typeof manualTestCases.$inferSelect;
export type InsertManualTestCase = z.infer<typeof insertManualTestCaseSchema>;

export type ManualTestRun = typeof manualTestRuns.$inferSelect;
export type InsertManualTestRun = z.infer<typeof insertManualTestRunSchema>;

export type ManualTestExecution = typeof manualTestExecution.$inferSelect;
export type InsertManualTestExecution = z.infer<typeof insertManualTestExecutionSchema>;

export type FailureAnalysis = typeof failureAnalysis.$inferSelect;
export type InsertFailureAnalysis = z.infer<typeof insertFailureAnalysisSchema>;
