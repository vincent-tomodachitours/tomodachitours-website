#!/usr/bin/env node

import { Redis } from '@upstash/redis';
import { SecurityLogger } from '../src/services/logging/SecurityLogger';
import { LogAnalyzer } from '../src/services/logging/LogAnalyzer';

async function dailySecurityCheck(): Promise<void> {
    console.log('🔒 Starting Daily Security Check...');
    console.log('='.repeat(50));

    try {
        // Initialize Redis connection
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });

        const logger = new SecurityLogger(redis);
        const analyzer = new LogAnalyzer(redis);

        // 1. Check Critical Events
        console.log('\n📊 Critical Events (Last 24 hours):');
        const criticalEvents: any[] = await logger.getCriticalEvents(50);
        console.log(`Found ${criticalEvents.length} critical events`);

        if (criticalEvents.length > 0) {
            console.log('⚠️  CRITICAL EVENTS DETECTED:');
            criticalEvents.slice(0, 10).forEach((event, index) => {
                const date = new Date(event.timestamp).toISOString();
                console.log(`  ${index + 1}. [${date}] ${event.eventType}: ${event.message}`);
            });

            if (criticalEvents.length > 10) {
                console.log(`  ... and ${criticalEvents.length - 10} more events`);
            }
        } else {
            console.log('✅ No critical events found');
        }

        // 2. Check Rate Limit Violations
        console.log('\n🚫 Rate Limit Analysis (Last 24 hours):');
        const rateLimitResults: any[] = await analyzer.analyzeRateLimiting(86400000);
        console.log(`Found ${rateLimitResults.length} rate limit violations`);

        if (rateLimitResults.length > 0) {
            console.log('⚠️  RATE LIMIT VIOLATIONS:');
            rateLimitResults.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.description}`);
                console.log(`     IP: ${result.metadata.ip || 'Unknown'}`);
                console.log(`     Count: ${result.metadata.exceededCount || 'N/A'}`);
            });
        } else {
            console.log('✅ No rate limit violations found');
        }

        // 3. Check Suspicious Transactions
        console.log('\n💳 Payment Pattern Analysis (Last 24 hours):');
        const paymentResults: any[] = await analyzer.analyzePaymentPatterns(86400000);
        console.log(`Found ${paymentResults.length} suspicious payment patterns`);

        if (paymentResults.length > 0) {
            console.log('⚠️  SUSPICIOUS PAYMENT PATTERNS:');
            paymentResults.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.description}`);
                console.log(`     Severity: ${result.severity}`);
                console.log(`     Events: ${result.relatedEvents.length}`);
            });
        } else {
            console.log('✅ No suspicious payment patterns found');
        }

        // 4. Check Login Attempts
        console.log('\n🔐 Login Attempt Analysis (Last 24 hours):');
        const loginResults: any[] = await analyzer.analyzeLoginAttempts(86400000);
        console.log(`Found ${loginResults.length} suspicious login patterns`);

        if (loginResults.length > 0) {
            console.log('⚠️  SUSPICIOUS LOGIN PATTERNS:');
            loginResults.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.description}`);
                console.log(`     IP/User: ${result.metadata.ip || result.metadata.userId || 'Unknown'}`);
                console.log(`     Attempts: ${result.metadata.attemptCount || 'N/A'}`);
            });
        } else {
            console.log('✅ No suspicious login patterns found');
        }

        // 5. Get Security Insights
        console.log('\n📈 Security Insights (Last 24 hours):');
        const insights: any = await analyzer.getSecurityInsights(86400000);
        console.log(`Total Events: ${insights.totalEvents}`);
        console.log('Severity Distribution:', insights.severityDistribution);

        if (insights.topIPs && insights.topIPs.length > 0) {
            console.log('Top IPs by Activity:');
            insights.topIPs.slice(0, 5).forEach((ipData, index) => {
                console.log(`  ${index + 1}. ${ipData.ip}: ${ipData.count} events`);
            });
        }

        if (insights.riskFactors && insights.riskFactors.length > 0) {
            console.log('Risk Factors:');
            insights.riskFactors.forEach((factor, index) => {
                console.log(`  ${index + 1}. ${factor.factor}: ${factor.score.toFixed(1)}%`);
            });
        }

        // 6. Summary and Recommendations
        console.log('\n📋 Daily Summary:');
        console.log('='.repeat(30));

        const totalIssues: number = criticalEvents.length + rateLimitResults.length +
            paymentResults.length + loginResults.length;

        if (totalIssues === 0) {
            console.log('✅ All systems appear normal');
            console.log('✅ No immediate action required');
        } else {
            console.log(`⚠️  Found ${totalIssues} security issues requiring attention`);
            console.log('\n📝 Recommended Actions:');

            if (criticalEvents.length > 0) {
                console.log(`   • Investigate ${criticalEvents.length} critical events immediately`);
            }

            if (rateLimitResults.length > 0) {
                console.log(`   • Review and potentially block IPs with rate limit violations`);
            }

            if (paymentResults.length > 0) {
                console.log(`   • Review suspicious payment patterns for fraud`);
            }

            if (loginResults.length > 0) {
                console.log(`   • Consider blocking IPs with excessive login failures`);
            }
        }

        console.log('\n📧 Next Steps:');
        console.log('   • Review flagged transactions: npm run script:review-queue list');
        console.log('   • Manage blacklist: npm run script:blacklist list');
        console.log('   • View detailed logs in your monitoring dashboard');

        console.log('\n✅ Daily security check completed');
        console.log(`📅 Next check scheduled for tomorrow at ${new Date(Date.now() + 86400000).toLocaleTimeString()}`);

    } catch (error) {
        console.error('❌ Error during daily security check:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the daily check
if (import.meta.url === `file://${process.argv[1]}`) {
    dailySecurityCheck().catch(console.error);
}

export { dailySecurityCheck }; 