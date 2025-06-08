// JUnit XML Parser for processing test results
export interface ParsedTestCase {
  name: string;
  className: string;
  duration: number; // in milliseconds
  status: 'passed' | 'failed' | 'skipped' | 'error';
  errorMessage?: string;
  stackTrace?: string;
  systemOut?: string;
  systemErr?: string;
  attachments?: string[];
}

export interface ParsedTestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  time: number; // in seconds
  timestamp?: string;
  testCases: ParsedTestCase[];
}

export interface ParsedJUnitXML {
  testSuites: ParsedTestSuite[];
  totalTests: number;
  totalFailures: number;
  totalErrors: number;
  totalSkipped: number;
  totalTime: number;
}

/**
 * Parse JUnit XML string into structured data
 */
export function parseJUnitXML(xmlContent: string): ParsedJUnitXML {
  // Create a simple XML parser using DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  const result: ParsedJUnitXML = {
    testSuites: [],
    totalTests: 0,
    totalFailures: 0,
    totalErrors: 0,
    totalSkipped: 0,
    totalTime: 0
  };

  // Handle both <testsuites> and single <testsuite> formats
  const testSuitesElement = xmlDoc.querySelector('testsuites');
  const testSuiteElements = testSuitesElement 
    ? testSuitesElement.querySelectorAll('testsuite')
    : xmlDoc.querySelectorAll('testsuite');

  testSuiteElements.forEach(suiteElement => {
    const testSuite = parseTestSuite(suiteElement);
    result.testSuites.push(testSuite);
    
    result.totalTests += testSuite.tests;
    result.totalFailures += testSuite.failures;
    result.totalErrors += testSuite.errors;
    result.totalSkipped += testSuite.skipped;
    result.totalTime += testSuite.time;
  });

  return result;
}

function parseTestSuite(suiteElement: Element): ParsedTestSuite {
  const testSuite: ParsedTestSuite = {
    name: suiteElement.getAttribute('name') || 'Unknown Suite',
    tests: parseInt(suiteElement.getAttribute('tests') || '0'),
    failures: parseInt(suiteElement.getAttribute('failures') || '0'),
    errors: parseInt(suiteElement.getAttribute('errors') || '0'),
    skipped: parseInt(suiteElement.getAttribute('skipped') || '0'),
    time: parseFloat(suiteElement.getAttribute('time') || '0'),
    timestamp: suiteElement.getAttribute('timestamp') || undefined,
    testCases: []
  };

  const testCaseElements = suiteElement.querySelectorAll('testcase');
  testCaseElements.forEach(caseElement => {
    const testCase = parseTestCase(caseElement);
    testSuite.testCases.push(testCase);
  });

  return testSuite;
}

function parseTestCase(caseElement: Element): ParsedTestCase {
  const name = caseElement.getAttribute('name') || 'Unknown Test';
  const className = caseElement.getAttribute('classname') || 'Unknown Class';
  const time = parseFloat(caseElement.getAttribute('time') || '0');
  const duration = Math.round(time * 1000); // Convert to milliseconds

  let status: ParsedTestCase['status'] = 'passed';
  let errorMessage: string | undefined;
  let stackTrace: string | undefined;

  // Check for failure
  const failureElement = caseElement.querySelector('failure');
  if (failureElement) {
    status = 'failed';
    errorMessage = failureElement.getAttribute('message') || 'Test failed';
    stackTrace = failureElement.textContent || undefined;
  }

  // Check for error
  const errorElement = caseElement.querySelector('error');
  if (errorElement) {
    status = 'error';
    errorMessage = errorElement.getAttribute('message') || 'Test error';
    stackTrace = errorElement.textContent || undefined;
  }

  // Check for skipped
  const skippedElement = caseElement.querySelector('skipped');
  if (skippedElement) {
    status = 'skipped';
    errorMessage = skippedElement.getAttribute('message') || 'Test skipped';
  }

  // Extract system output
  const systemOutElement = caseElement.querySelector('system-out');
  const systemOut = systemOutElement?.textContent || undefined;

  const systemErrElement = caseElement.querySelector('system-err');
  const systemErr = systemErrElement?.textContent || undefined;

  // Look for attachments in properties or custom elements
  const attachments: string[] = [];
  const propertiesElement = caseElement.querySelector('properties');
  if (propertiesElement) {
    const propertyElements = propertiesElement.querySelectorAll('property');
    propertyElements.forEach(prop => {
      const propName = prop.getAttribute('name');
      const propValue = prop.getAttribute('value');
      if (propName && propValue && (
        propName.includes('attachment') || 
        propName.includes('screenshot') || 
        propName.includes('file')
      )) {
        attachments.push(propValue);
      }
    });
  }

  return {
    name,
    className,
    duration,
    status,
    errorMessage,
    stackTrace,
    systemOut,
    systemErr,
    attachments: attachments.length > 0 ? attachments : undefined
  };
}

/**
 * Validate XML content before parsing
 */
export function validateJUnitXML(xmlContent: string): boolean {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return false;
    }

    // Check for required elements
    const hasTestSuites = xmlDoc.querySelector('testsuites') !== null;
    const hasTestSuite = xmlDoc.querySelector('testsuite') !== null;
    
    return hasTestSuites || hasTestSuite;
  } catch (error) {
    return false;
  }
}

/**
 * Extract test summary from parsed XML
 */
export function getTestSummary(parsedXML: ParsedJUnitXML) {
  const passedTests = parsedXML.totalTests - parsedXML.totalFailures - parsedXML.totalErrors - parsedXML.totalSkipped;
  const passRate = parsedXML.totalTests > 0 ? (passedTests / parsedXML.totalTests) * 100 : 0;

  return {
    totalTests: parsedXML.totalTests,
    passedTests,
    failedTests: parsedXML.totalFailures,
    errorTests: parsedXML.totalErrors,
    skippedTests: parsedXML.totalSkipped,
    passRate: Math.round(passRate * 100) / 100,
    totalDuration: Math.round(parsedXML.totalTime * 1000), // Convert to milliseconds
    testSuiteCount: parsedXML.testSuites.length
  };
}
