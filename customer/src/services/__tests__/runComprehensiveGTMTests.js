/**
 * Comprehensive GTM and Conversion Tracking Test Runner
 * Executes all GTM-related tests and provides detailed reporting
 * Requirements: 1.4, 2.3, 7.1, 10.2 (Task 14)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GTMTestRunner {
    constructor() {
        this.testResults = {
            gtmIntegration: null,
            conversionAccuracy: null,
            debugValidation: null,
            endToEndFlow: null,
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                coverage: null,
                duration: 0
            }
        };
        this.startTime = Date.now();
    }

    /**
     * Run all comprehensive GTM tests
     */
    async runAllTests() {
        console.log('🚀 Starting Comprehensive GTM and Conversion Tracking Tests...\n');

        try {
            // Run GTM Integration Tests
            console.log('📊 Running GTM Integration Tests...');
            this.testResults.gtmIntegration = await this.runTestSuite('gtmIntegrationComprehensive.test.js');

            // Run Conversion Accuracy Tests
            console.log('🎯 Running Conversion Accuracy Validation Tests...');
            this.testResults.conversionAccuracy = await this.runTestSuite('conversionAccuracyValidation.test.js');

            // Run Debug Validation Tests
            console.log('🔍 Running GTM Debug Mode and Validation Tests...');
            this.testResults.debugValidation = await this.runTestSuite('gtmDebugValidation.test.js');

            // Run End-to-End Flow Tests
            console.log('🛒 Running End-to-End Booking Flow Tests...');
            this.testResults.endToEndFlow = await this.runTestSuite('endToEndBookingFlow.test.js');

            // Generate summary
            this.generateSummary();

            // Display results
            this.displayResults();

            // Generate report
            await this.generateReport();

            return this.testResults;

        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            throw error;
        }
    }

    /**
     * Run individual test suite
     */
    async runTestSuite(testFile) {
        const testPath = path.join(__dirname, testFile);

        if (!fs.existsSync(testPath)) {
            throw new Error(`Test file not found: ${testFile}`);
        }

        try {
            const startTime = Date.now();

            // Run Jest for specific test file
            const command = `npx jest ${testPath} --verbose --json --coverage`;
            const output = execSync(command, {
                cwd: path.join(__dirname, '../../../'),
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Parse Jest output
            const result = this.parseJestOutput(output);
            result.duration = duration;
            result.testFile = testFile;

            console.log(`✅ ${testFile} completed in ${duration}ms`);
            return result;

        } catch (error) {
            console.error(`❌ ${testFile} failed:`, error.message);
            return {
                testFile,
                success: false,
                error: error.message,
                duration: 0,
                tests: { passed: 0, failed: 1, total: 1 }
            };
        }
    }

    /**
     * Parse Jest JSON output
     */
    parseJestOutput(output) {
        try {
            // Extract JSON from Jest output (Jest outputs JSON at the end)
            const lines = output.split('\n');
            const jsonLine = lines.find(line => line.startsWith('{') && line.includes('"success"'));

            if (jsonLine) {
                const jestResult = JSON.parse(jsonLine);

                return {
                    success: jestResult.success,
                    tests: {
                        total: jestResult.numTotalTests,
                        passed: jestResult.numPassedTests,
                        failed: jestResult.numFailedTests
                    },
                    coverage: jestResult.coverageMap ? this.parseCoverage(jestResult.coverageMap) : null,
                    testResults: jestResult.testResults
                };
            }

            // Fallback parsing if JSON not found
            return this.parseJestTextOutput(output);

        } catch (error) {
            console.warn('Failed to parse Jest JSON output, using text parsing');
            return this.parseJestTextOutput(output);
        }
    }

    /**
     * Parse Jest text output as fallback
     */
    parseJestTextOutput(output) {
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const totalMatch = output.match(/Tests:\s+(\d+) total/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

        return {
            success: failed === 0,
            tests: { total, passed, failed },
            coverage: null,
            output
        };
    }

    /**
     * Parse coverage information
     */
    parseCoverage(coverageMap) {
        if (!coverageMap) return null;

        const files = Object.keys(coverageMap);
        let totalStatements = 0;
        let coveredStatements = 0;

        files.forEach(file => {
            const fileCoverage = coverageMap[file];
            if (fileCoverage.s) {
                const statements = Object.values(fileCoverage.s);
                totalStatements += statements.length;
                coveredStatements += statements.filter(count => count > 0).length;
            }
        });

        return {
            percentage: totalStatements > 0 ? (coveredStatements / totalStatements * 100).toFixed(2) : 0,
            statements: { total: totalStatements, covered: coveredStatements },
            files: files.length
        };
    }

    /**
     * Generate test summary
     */
    generateSummary() {
        const results = [
            this.testResults.gtmIntegration,
            this.testResults.conversionAccuracy,
            this.testResults.debugValidation,
            this.testResults.endToEndFlow
        ].filter(result => result !== null);

        this.testResults.summary = {
            totalTests: results.reduce((sum, result) => sum + (result.tests?.total || 0), 0),
            passedTests: results.reduce((sum, result) => sum + (result.tests?.passed || 0), 0),
            failedTests: results.reduce((sum, result) => sum + (result.tests?.failed || 0), 0),
            duration: Date.now() - this.startTime,
            successRate: 0,
            coverage: this.calculateOverallCoverage(results)
        };

        this.testResults.summary.successRate = this.testResults.summary.totalTests > 0
            ? (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2)
            : 0;
    }

    /**
     * Calculate overall coverage
     */
    calculateOverallCoverage(results) {
        const coverageResults = results.filter(result => result.coverage);

        if (coverageResults.length === 0) return null;

        const totalStatements = coverageResults.reduce((sum, result) =>
            sum + result.coverage.statements.total, 0);
        const coveredStatements = coverageResults.reduce((sum, result) =>
            sum + result.coverage.statements.covered, 0);

        return {
            percentage: totalStatements > 0 ? (coveredStatements / totalStatements * 100).toFixed(2) : 0,
            statements: { total: totalStatements, covered: coveredStatements }
        };
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 COMPREHENSIVE GTM TEST RESULTS');
        console.log('='.repeat(80));

        // Individual test suite results
        const suites = [
            { name: 'GTM Integration Tests', result: this.testResults.gtmIntegration },
            { name: 'Conversion Accuracy Tests', result: this.testResults.conversionAccuracy },
            { name: 'Debug Validation Tests', result: this.testResults.debugValidation },
            { name: 'End-to-End Flow Tests', result: this.testResults.endToEndFlow }
        ];

        suites.forEach(suite => {
            if (suite.result) {
                const status = suite.result.success ? '✅' : '❌';
                const duration = suite.result.duration ? `${suite.result.duration}ms` : 'N/A';
                console.log(`${status} ${suite.name}: ${suite.result.tests.passed}/${suite.result.tests.total} passed (${duration})`);
            }
        });

        // Overall summary
        console.log('\n📊 OVERALL SUMMARY:');
        console.log(`   Total Tests: ${this.testResults.summary.totalTests}`);
        console.log(`   Passed: ${this.testResults.summary.passedTests}`);
        console.log(`   Failed: ${this.testResults.summary.failedTests}`);
        console.log(`   Success Rate: ${this.testResults.summary.successRate}%`);
        console.log(`   Duration: ${this.testResults.summary.duration}ms`);

        if (this.testResults.summary.coverage) {
            console.log(`   Coverage: ${this.testResults.summary.coverage.percentage}%`);
        }

        // Requirements validation
        console.log('\n🎯 REQUIREMENTS VALIDATION:');
        this.validateRequirements();

        console.log('\n' + '='.repeat(80));
    }

    /**
     * Validate requirements coverage
     */
    validateRequirements() {
        const requirements = {
            '1.4': 'Conversion tracking validation checks',
            '2.3': 'GTM debug mode and validation scenarios',
            '7.1': 'Real-time conversion validation',
            '10.2': 'GTM container and tag firing tests'
        };

        Object.entries(requirements).forEach(([req, description]) => {
            const status = this.testResults.summary.failedTests === 0 ? '✅' : '⚠️';
            console.log(`   ${status} Requirement ${req}: ${description}`);
        });
    }

    /**
     * Generate detailed test report
     */
    async generateReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.testResults.summary,
            testSuites: {
                gtmIntegration: this.testResults.gtmIntegration,
                conversionAccuracy: this.testResults.conversionAccuracy,
                debugValidation: this.testResults.debugValidation,
                endToEndFlow: this.testResults.endToEndFlow
            },
            requirements: {
                '1.4': 'Conversion tracking validation checks - ' + (this.testResults.summary.failedTests === 0 ? 'PASSED' : 'FAILED'),
                '2.3': 'GTM debug mode and validation scenarios - ' + (this.testResults.summary.failedTests === 0 ? 'PASSED' : 'FAILED'),
                '7.1': 'Real-time conversion validation - ' + (this.testResults.summary.failedTests === 0 ? 'PASSED' : 'FAILED'),
                '10.2': 'GTM container and tag firing tests - ' + (this.testResults.summary.failedTests === 0 ? 'PASSED' : 'FAILED')
            }
        };

        const reportPath = path.join(__dirname, 'gtm-test-report.json');

        try {
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            console.log(`📄 Detailed report saved to: ${reportPath}`);
        } catch (error) {
            console.warn('Failed to save test report:', error.message);
        }
    }

    /**
     * Run specific test category
     */
    async runCategory(category) {
        const testFiles = {
            integration: 'gtmIntegrationComprehensive.test.js',
            accuracy: 'conversionAccuracyValidation.test.js',
            debug: 'gtmDebugValidation.test.js',
            e2e: 'endToEndBookingFlow.test.js'
        };

        if (!testFiles[category]) {
            throw new Error(`Unknown test category: ${category}`);
        }

        console.log(`🎯 Running ${category} tests...`);
        const result = await this.runTestSuite(testFiles[category]);

        console.log('\n📊 RESULTS:');
        console.log(`   Tests: ${result.tests.passed}/${result.tests.total} passed`);
        console.log(`   Duration: ${result.duration}ms`);
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);

        return result;
    }
}

// CLI interface
if (require.main === module) {
    const runner = new GTMTestRunner();
    const args = process.argv.slice(2);

    if (args.length > 0) {
        const category = args[0];
        runner.runCategory(category)
            .then(result => {
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('Test execution failed:', error);
                process.exit(1);
            });
    } else {
        runner.runAllTests()
            .then(results => {
                const success = results.summary.failedTests === 0;
                process.exit(success ? 0 : 1);
            })
            .catch(error => {
                console.error('Test execution failed:', error);
                process.exit(1);
            });
    }
}

module.exports = GTMTestRunner;