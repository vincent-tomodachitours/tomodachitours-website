#!/usr/bin/env node

const { Redis } = require('@upstash/redis');
const { SecurityLogger } = require('../src/services/logging/SecurityLogger');
const { LogAnalyzer } = require('../src/services/logging/LogAnalyzer');
const fs = require('fs').promises;
const path = require('path');

async function generateWeeklyReport() {
    console.log('📊 Generating Weekly Security Report...');
    console.log('='.repeat(60));

    const startTime = Date.now();
    const weekAgo = startTime - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    try {
        // Initialize Redis connection
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });

        const logger = new SecurityLogger(redis);
        const analyzer = new LogAnalyzer(redis);

        // Generate report data
        const [
            criticalEvents,
            securityInsights,
            loginAnalysis,
            paymentAnalysis,
            rateLimitAnalysis
        ] = await Promise.all([
            logger.getCriticalEvents(1000),
            analyzer.getSecurityInsights(604800000), // 7 days
            analyzer.analyzeLoginAttempts(604800000),
            analyzer.analyzePaymentPatterns(604800000),
            analyzer.analyzeRateLimiting(604800000)
        ]);

        // Filter critical events to last week
        const weeklyCriticalEvents = criticalEvents.filter(
            event => event.timestamp >= weekAgo
        );

        // Create report
        const report = {
            generatedAt: new Date().toISOString(),
            period: {
                start: new Date(weekAgo).toISOString(),
                end: new Date(startTime).toISOString()
            },
            summary: {
                totalEvents: securityInsights.totalEvents,
                criticalEvents: weeklyCriticalEvents.length,
                suspiciousLogins: loginAnalysis.length,
                suspiciousPayments: paymentAnalysis.length,
                rateLimitViolations: rateLimitAnalysis.length
            },
            insights: securityInsights,
            criticalEvents: weeklyCriticalEvents,
            analysis: {
                logins: loginAnalysis,
                payments: paymentAnalysis,
                rateLimits: rateLimitAnalysis
            }
        };

        // Display console report
        displayConsoleReport(report);

        // Save detailed report to file
        await saveReportToFile(report);

        console.log('\n✅ Weekly security report generated successfully');
        console.log(`📁 Detailed report saved to: reports/security-weekly-${getDateString()}.json`);

    } catch (error) {
        console.error('❌ Error generating weekly report:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

function displayConsoleReport(report) {
    console.log('\n📈 WEEKLY SECURITY REPORT');
    console.log('='.repeat(50));
    console.log(`📅 Period: ${formatDate(report.period.start)} to ${formatDate(report.period.end)}`);
    console.log(`🕐 Generated: ${formatDate(report.generatedAt)}`);

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(30));
    console.log(`Total Security Events: ${report.summary.totalEvents}`);
    console.log(`Critical Events: ${report.summary.criticalEvents}`);
    console.log(`Suspicious Login Patterns: ${report.summary.suspiciousLogins}`);
    console.log(`Suspicious Payment Patterns: ${report.summary.suspiciousPayments}`);
    console.log(`Rate Limit Violations: ${report.summary.rateLimitViolations}`);

    // Severity Distribution
    if (report.insights.severityDistribution) {
        console.log('\n🎯 SEVERITY DISTRIBUTION');
        console.log('-'.repeat(30));
        Object.entries(report.insights.severityDistribution).forEach(([severity, count]) => {
            const percentage = report.summary.totalEvents > 0
                ? ((count / report.summary.totalEvents) * 100).toFixed(1)
                : '0.0';
            console.log(`${severity}: ${count} (${percentage}%)`);
        });
    }

    // Top Event Types
    if (report.insights.topEventTypes && report.insights.topEventTypes.length > 0) {
        console.log('\n🔝 TOP EVENT TYPES');
        console.log('-'.repeat(30));
        report.insights.topEventTypes.slice(0, 10).forEach((eventType, index) => {
            console.log(`${index + 1}. ${eventType.type}: ${eventType.count} events`);
        });
    }

    // Top IPs
    if (report.insights.topIPs && report.insights.topIPs.length > 0) {
        console.log('\n🌐 TOP IPs BY ACTIVITY');
        console.log('-'.repeat(30));
        report.insights.topIPs.slice(0, 10).forEach((ipData, index) => {
            console.log(`${index + 1}. ${ipData.ip}: ${ipData.count} events`);
        });
    }

    // Risk Factors
    if (report.insights.riskFactors && report.insights.riskFactors.length > 0) {
        console.log('\n⚠️  RISK FACTORS');
        console.log('-'.repeat(30));
        report.insights.riskFactors.forEach((factor, index) => {
            const riskLevel = factor.score > 50 ? '🔴 HIGH' :
                factor.score > 25 ? '🟡 MEDIUM' : '🟢 LOW';
            console.log(`${index + 1}. ${factor.factor}: ${factor.score.toFixed(1)}% ${riskLevel}`);
        });
    }

    // Critical Events Details
    if (report.criticalEvents.length > 0) {
        console.log('\n🚨 CRITICAL EVENTS DETAILS');
        console.log('-'.repeat(30));
        report.criticalEvents.slice(0, 20).forEach((event, index) => {
            const date = formatDate(event.timestamp);
            console.log(`${index + 1}. [${date}] ${event.eventType}`);
            console.log(`   Message: ${event.message}`);
            if (event.metadata.ip) {
                console.log(`   IP: ${event.metadata.ip}`);
            }
            console.log('');
        });

        if (report.criticalEvents.length > 20) {
            console.log(`... and ${report.criticalEvents.length - 20} more critical events`);
        }
    }

    // Analysis Summary
    console.log('\n🔍 ANALYSIS SUMMARY');
    console.log('-'.repeat(30));

    if (report.analysis.logins.length > 0) {
        console.log('🔐 Suspicious Login Patterns:');
        report.analysis.logins.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.description}`);
        });
    }

    if (report.analysis.payments.length > 0) {
        console.log('💳 Suspicious Payment Patterns:');
        report.analysis.payments.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.description}`);
        });
    }

    if (report.analysis.rateLimits.length > 0) {
        console.log('🚫 Rate Limit Violations:');
        report.analysis.rateLimits.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.description}`);
        });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));

    const totalIssues = report.summary.criticalEvents + report.summary.suspiciousLogins +
        report.summary.suspiciousPayments + report.summary.rateLimitViolations;

    if (totalIssues === 0) {
        console.log('✅ No significant security issues detected this week');
        console.log('✅ Continue monitoring with current settings');
    } else {
        if (report.summary.criticalEvents > 0) {
            console.log('🔴 HIGH PRIORITY: Investigate critical security events');
        }

        if (report.summary.rateLimitViolations > 5) {
            console.log('🟡 MEDIUM: Review rate limiting thresholds - high violation count');
        }

        if (report.summary.suspiciousPayments > 0) {
            console.log('🟡 MEDIUM: Review payment fraud detection rules');
        }

        if (report.summary.suspiciousLogins > 0) {
            console.log('🟡 MEDIUM: Consider updating login security measures');
        }

        if (report.insights.topIPs && report.insights.topIPs.length > 0) {
            const topIP = report.insights.topIPs[0];
            if (topIP.count > 100) {
                console.log(`🟡 MEDIUM: Monitor top IP ${topIP.ip} (${topIP.count} events)`);
            }
        }
    }

    console.log('\n📋 NEXT STEPS');
    console.log('-'.repeat(30));
    console.log('• Review and action flagged transactions');
    console.log('• Update IP blacklists based on analysis');
    console.log('• Adjust security thresholds if needed');
    console.log('• Schedule follow-up investigations for critical events');
    console.log('• Update security team on findings');
}

async function saveReportToFile(report) {
    try {
        // Ensure reports directory exists
        const reportsDir = path.join(process.cwd(), 'reports');
        try {
            await fs.access(reportsDir);
        } catch {
            await fs.mkdir(reportsDir, { recursive: true });
        }

        // Save JSON report
        const filename = `security-weekly-${getDateString()}.json`;
        const filepath = path.join(reportsDir, filename);
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));

        // Save human-readable summary
        const summaryFilename = `security-weekly-summary-${getDateString()}.txt`;
        const summaryFilepath = path.join(reportsDir, summaryFilename);
        const summaryText = generateTextSummary(report);
        await fs.writeFile(summaryFilepath, summaryText);

    } catch (error) {
        console.error('Failed to save report to file:', error);
    }
}

function generateTextSummary(report) {
    return `
TOMODACHI TOURS - WEEKLY SECURITY REPORT
Generated: ${formatDate(report.generatedAt)}
Period: ${formatDate(report.period.start)} to ${formatDate(report.period.end)}

SUMMARY
=======
Total Security Events: ${report.summary.totalEvents}
Critical Events: ${report.summary.criticalEvents}
Suspicious Login Patterns: ${report.summary.suspiciousLogins}
Suspicious Payment Patterns: ${report.summary.suspiciousPayments}
Rate Limit Violations: ${report.summary.rateLimitViolations}

RISK ASSESSMENT
===============
${report.insights.riskFactors ? report.insights.riskFactors.map(factor =>
        `${factor.factor}: ${factor.score.toFixed(1)}%`
    ).join('\n') : 'No risk factors calculated'}

CRITICAL EVENTS
===============
${report.criticalEvents.length > 0 ?
            report.criticalEvents.slice(0, 10).map(event =>
                `[${formatDate(event.timestamp)}] ${event.eventType}: ${event.message}`
            ).join('\n') : 'No critical events this week'}

RECOMMENDATIONS
===============
${generateRecommendations(report)}

Report generated by Tomodachi Tours Security System
Next report: ${formatDate(Date.now() + (7 * 24 * 60 * 60 * 1000))}
`;
}

function generateRecommendations(report) {
    const recommendations = [];

    if (report.summary.criticalEvents > 0) {
        recommendations.push('• URGENT: Investigate all critical security events');
    }

    if (report.summary.rateLimitViolations > 10) {
        recommendations.push('• Review and potentially update rate limiting thresholds');
    }

    if (report.summary.suspiciousPayments > 0) {
        recommendations.push('• Enhance payment fraud detection rules');
    }

    if (report.summary.suspiciousLogins > 0) {
        recommendations.push('• Consider implementing additional login security measures');
    }

    if (recommendations.length === 0) {
        recommendations.push('• Continue current security monitoring practices');
        recommendations.push('• No immediate action required');
    }

    return recommendations.join('\n');
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function getDateString() {
    return new Date().toISOString().split('T')[0];
}

// Run the weekly report
if (require.main === module) {
    generateWeeklyReport().catch(console.error);
}

module.exports = { generateWeeklyReport }; 