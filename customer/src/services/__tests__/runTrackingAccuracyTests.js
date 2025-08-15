/**
 * Tracking Accuracy Test Runner
 * Executes all comprehensive tracking accuracy tests
 * Requirements: Task 14 - Create comprehensive testing suite for tracking accuracy
 */

const { execSync } = require('child_process');
const path = require('path');

// Test files to run
const testFiles = [
    'endToEndTracking.test.js',
    'attributionModels.test.js',
    'privacyCompliance.test.js',
    'performanceImpact.test.js',
    'dataValidationAccuracy.test.js'
];

// Test configuration
const testConfig = {
    verbose: true,
    coverage: true,
    timeout: 30000,
    maxWorkers: 4
};

/**
 * Run individual test file
 * @param {string} testFile - Test file to run
 * @returns {Promise<Object>} Test results
 */
async function runTestFile(testFile) {
    const testPath = path.join(__dirname, testFile);

    console.log(`\n🧪 Running ${testFile}...`);

    try {
        const startTime = Date.now();

        // Build jest command
        const jestCommand = [
            'npx jest',
            `"${testPath}"`,
            '--verbose',
            '--no-cache',
            '--forceExit',
            `--testTimeout=${testConfig.timeout}`,
            `--maxWorkers=${testConfig.maxWorkers}`
        ].join(' ');

        // Execute test
        const output = execSync(jestCommand, {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: path.join(__dirname, '../../../..')
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`✅ ${testFile} completed in ${duration}ms`);

        return {
            file: testFile,
            success: true,
            duration: duration,
            output: output
        };

    } catch (error) {
        console.error(`❌ ${testFile} failed:`, error.message);

        return {
            file: testFile,
            success: false,
            error: error.message,
            output: error.stdout || error.stderr
        };
    }
}

/**
 * Run all tracking accuracy tests
 * @returns {Promise<Object>} Complete test results
 */
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Tracking Accuracy Tests');
    console.log('='.repeat(60));

    const startTime = Date.now();
    const results = [];

    // Run tests sequentially to avoid resource conflicts
    for (const testFile of testFiles) {
        const result = await runTestFile(testFile);
        results.push(result);
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Generate summary
    const summary = generateTestSummary(results, totalDuration);
    console.log(summary);

    return {
        results: results,
        summary: summary,
        totalDuration: totalDuration
    };
}

/**
 * Generate test summary report
 * @param {Array} results - Test results
 * @param {number} totalDuration - Total test duration
 * @returns {string} Summary report
 */
function generateTestSummary(results, totalDuration) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    let summary = '\n' + '='.repeat(60) + '\n';
    summary += '📊 TRACKING ACCURACY TEST SUMMARY\n';
    summary += '='.repeat(60) + '\n';

    summary += `Total Tests: ${results.length}\n`;
    summary += `✅ Passed: ${successful.length}\n`;
    summary += `❌ Failed: ${failed.length}\n`;
    summary += `⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)\n`;
    summary += `📈 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%\n\n`;

    // Individual test results
    summary += 'INDIVIDUAL TEST RESULTS:\n';
    summary += '-'.repeat(40) + '\n';

    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const duration = result.duration ? `${result.duration}ms` : 'N/A';
        summary += `${status} ${result.file.padEnd(30)} ${duration}\n`;

        if (!result.success && result.error) {
            summary += `   Error: ${result.error.substring(0, 100)}...\n`;
        }
    });

    // Test coverage areas
    summary += '\n📋 TEST COVERAGE AREAS:\n';
    summary += '-'.repeat(40) + '\n';
    summary += '• End-to-End Conversion Tracking\n';
    summary += '• Attribution Models (First-touch, Last-touch, Data-driven)\n';
    summary += '• Campaign Types (Search, Display, Video, Shopping, Social)\n';
    summary += '• Privacy Compliance (GDPR, Consent Management)\n';
    summary += '• Performance Impact (Script Loading, Memory Usage)\n';
    summary += '• Data Validation (Sanitization, XSS Prevention)\n';
    summary += '• Cross-Platform Consistency (GA4 + Google Ads)\n';
    summary += '• Error Handling and Recovery\n';
    summary += '• Real-time Monitoring and Alerting\n';

    if (failed.length > 0) {
        summary += '\n⚠️  FAILED TESTS REQUIRE ATTENTION:\n';
        summary += '-'.repeat(40) + '\n';
        failed.forEach(result => {
            summary += `• ${result.file}: ${result.error}\n`;
        });
    }

    summary += '\n' + '='.repeat(60) + '\n';

    return summary;
}

/**
 * Run tests with coverage report
 * @returns {Promise<Object>} Test results with coverage
 */
async function runTestsWithCoverage() {
    console.log('📊 Running tests with coverage report...\n');

    try {
        const coverageCommand = [
            'npx jest',
            '--coverage',
            '--coverageDirectory=coverage/tracking-accuracy',
            '--collectCoverageFrom="src/services/**/*.js"',
            '--coverageReporters=text,html,json',
            `--testPathPattern="__tests__/(${testFiles.join('|').replace(/\.js/g, '')})"`,
            '--verbose'
        ].join(' ');

        const output = execSync(coverageCommand, {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: path.join(__dirname, '../../../..')
        });

        console.log('✅ Coverage report generated');
        console.log('📁 Coverage report available at: coverage/tracking-accuracy/index.html');

        return {
            success: true,
            output: output
        };

    } catch (error) {
        console.error('❌ Coverage report failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Run all tests
        const testResults = await runAllTests();

        // Generate coverage report if all tests pass
        if (testResults.results.every(r => r.success)) {
            console.log('\n🎉 All tests passed! Generating coverage report...');
            await runTestsWithCoverage();
        }

        // Exit with appropriate code
        const hasFailures = testResults.results.some(r => !r.success);
        process.exit(hasFailures ? 1 : 0);

    } catch (error) {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    }
}

// Export functions for programmatic use
module.exports = {
    runAllTests,
    runTestFile,
    runTestsWithCoverage,
    generateTestSummary
};

// Run if called directly
if (require.main === module) {
    main();
}