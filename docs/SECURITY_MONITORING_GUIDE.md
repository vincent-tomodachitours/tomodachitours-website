# Security Monitoring and Maintenance Guide

This guide provides step-by-step instructions for monitoring and maintaining the Tomodachi Tours security system.

## Table of Contents
1. [Daily Monitoring Tasks](#daily-monitoring-tasks)
2. [Weekly Maintenance Tasks](#weekly-maintenance-tasks)
3. [Monthly Security Audits](#monthly-security-audits)
4. [Emergency Response Procedures](#emergency-response-procedures)
5. [Security Tools and Scripts](#security-tools-and-scripts)
6. [Alert Thresholds and Actions](#alert-thresholds-and-actions)

## Daily Monitoring Tasks

### 1. Check Security Logs (5-10 minutes)

**Purpose**: Identify any immediate security threats or anomalies.

**How to do it**:
```bash
# Navigate to project directory
cd /path/to/tomodachitours

# Check critical security events from last 24 hours
node -e "
const { Redis } = require('@upstash/redis');
const { SecurityLogger } = require('./src/services/logging/SecurityLogger');

async function checkCriticalEvents() {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const logger = new SecurityLogger(redis);
    
    const criticalEvents = await logger.getCriticalEvents(50);
    console.log('Critical Events (Last 24 hours):', criticalEvents.length);
    
    criticalEvents.forEach(event => {
        console.log(\`- \${new Date(event.timestamp).toISOString()}: \${event.eventType} - \${event.message}\`);
    });
}

checkCriticalEvents().catch(console.error);
"
```

**What to look for**:
- Critical security events (payment blocks, IP blocks)
- Unusual patterns in login failures
- Repeated rate limit violations
- Suspicious transaction alerts

**Action items**:
- Investigate any critical events immediately
- Note patterns for weekly analysis
- Block IPs if showing malicious behavior

### 2. Review Flagged Transactions (5 minutes)

**How to do it**:
```bash
# Check pending review queue
npm run script:review-queue list
```

**What to do**:
- Review each flagged transaction
- Approve legitimate transactions: `npm run script:review-queue review <index> approve`
- Reject suspicious ones: `npm run script:review-queue review <index> reject`
- Add patterns to blacklist if needed

### 3. Monitor Rate Limit Violations (3 minutes)

**How to check**:
```bash
# Check rate limit violations from last 24 hours
node -e "
const { Redis } = require('@upstash/redis');
const { LogAnalyzer } = require('./src/services/logging/LogAnalyzer');

async function checkRateLimits() {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const analyzer = new LogAnalyzer(redis);
    
    const results = await analyzer.analyzeRateLimiting(86400000); // 24 hours
    console.log('Rate Limit Violations:', results.length);
    
    results.forEach(result => {
        console.log(\`- \${result.description} (IP: \${result.metadata.ip})\`);
    });
}

checkRateLimits().catch(console.error);
"
```

**Actions**:
- Block IPs with excessive violations
- Adjust rate limits if legitimate traffic is affected

### 4. System Performance Check (2 minutes)

**Quick health check**:
```bash
# Check if Redis is responding
redis-cli ping

# Check application logs for errors
tail -n 100 /var/log/tomodachi-tours/app.log | grep ERROR

# Check memory usage
free -h

# Check disk space
df -h
```

## Weekly Maintenance Tasks

### 1. Security Alert Analysis (15-20 minutes)

**Generate weekly security report**:
```bash
node -e "
const { Redis } = require('@upstash/redis');
const { LogAnalyzer } = require('./src/services/logging/LogAnalyzer');

async function weeklyReport() {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const analyzer = new LogAnalyzer(redis);
    
    const insights = await analyzer.getSecurityInsights(604800000); // 7 days
    
    console.log('=== WEEKLY SECURITY REPORT ===');
    console.log('Total Events:', insights.totalEvents);
    console.log('Severity Distribution:', insights.severityDistribution);
    console.log('Top Event Types:', insights.topEventTypes);
    console.log('Top IPs:', insights.topIPs);
    console.log('Risk Factors:', insights.riskFactors);
    console.log('================================');
}

weeklyReport().catch(console.error);
"
```

### 2. Traffic Pattern Analysis (10 minutes)

**Analyze unusual patterns**:
```bash
# Check login attempt patterns
node -e "
const { Redis } = require('@upstash/redis');
const { LogAnalyzer } = require('./src/services/logging/LogAnalyzer');

async function analyzePatterns() {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const analyzer = new LogAnalyzer(redis);
    
    const loginResults = await analyzer.analyzeLoginAttempts(604800000);
    const paymentResults = await analyzer.analyzePaymentPatterns(604800000);
    
    console.log('Suspicious Login Patterns:', loginResults.length);
    console.log('Suspicious Payment Patterns:', paymentResults.length);
    
    loginResults.forEach(result => console.log('- Login:', result.description));
    paymentResults.forEach(result => console.log('- Payment:', result.description));
}

analyzePatterns().catch(console.error);
"
```

### 3. Update IP Blacklists (5-10 minutes)

**Review and update blacklists**:
```bash
# List current blacklist entries
npm run script:blacklist list

# Add new suspicious IPs (replace with actual IPs)
npm run script:blacklist add "192.168.1.100" "Repeated failed logins"

# Remove expired or false positive entries
npm run script:blacklist remove "192.168.1.200"

# Clean up expired entries
npm run script:blacklist cleanup
```

### 4. Check Dependency Vulnerabilities (5 minutes)

```bash
# Check for security vulnerabilities
npm audit

# Update dependencies if needed
npm audit fix

# Check for critical vulnerabilities that need immediate attention
npm audit --audit-level high
```

### 5. Backup Security Configurations (5 minutes)

```bash
# Backup current security configurations
mkdir -p backups/$(date +%Y-%m-%d)

# Backup environment variables (sanitized)
env | grep -E "(REDIS|SECURITY)" | sed 's/=.*/=***/' > backups/$(date +%Y-%m-%d)/env-config.txt

# Backup rate limit configurations
cp src/services/rate-limit.ts backups/$(date +%Y-%m-%d)/
cp src/services/velocity-check.ts backups/$(date +%Y-%m-%d)/

echo "Security configurations backed up to backups/$(date +%Y-%m-%d)/"
```

## Monthly Security Audits

### 1. Full Security Assessment (30-45 minutes)

**Run comprehensive security analysis**:
```bash
# Generate monthly security report
node scripts/monthly-security-audit.js

# Check all security components
npm test -- --grep "security"

# Review access logs for the month
# (This would typically integrate with your web server logs)
```

### 2. Update Security Policies (15 minutes)

- Review rate limit thresholds
- Update allowed countries list
- Review and update blacklist criteria
- Check suspicious transaction thresholds

### 3. Security Training Review (15 minutes)

- Review incident response procedures
- Update contact information
- Check documentation for accuracy
- Plan security awareness updates

## Emergency Response Procedures

### 1. Security Incident Detection

**Immediate Actions** (within 5 minutes):
```bash
# Check if incident is ongoing
npm run script:review-queue list

# Block suspicious IPs immediately
npm run script:blacklist add "<suspicious-ip>" "Security incident - $(date)"

# Check system status
systemctl status tomodachi-tours
```

### 2. Incident Response Steps

1. **Contain** (within 15 minutes):
   ```bash
   # Block malicious IPs
   npm run script:blacklist add "<ip>" "Malicious activity detected"
   
   # Enable enhanced monitoring
   export SECURITY_ALERT_LEVEL=HIGH
   
   # Notify team
   echo "Security incident detected at $(date)" | mail -s "SECURITY ALERT" security@tomodachitours.com
   ```

2. **Investigate** (within 30 minutes):
   ```bash
   # Analyze incident logs
   node -e "
   const { LogAnalyzer } = require('./src/services/logging/LogAnalyzer');
   // ... detailed investigation code
   "
   ```

3. **Recover** (timeline varies):
   - Remove malicious data
   - Restore from backups if needed
   - Update security measures

4. **Learn** (within 24 hours):
   - Document incident
   - Update procedures
   - Implement additional safeguards

## Security Tools and Scripts

### Available Management Scripts

1. **Blacklist Management**:
   ```bash
   npm run script:blacklist add <ip> <reason>
   npm run script:blacklist remove <ip>
   npm run script:blacklist list
   ```

2. **Review Queue Management**:
   ```bash
   npm run script:review-queue list
   npm run script:review-queue review <index> <decision>
   npm run script:review-queue history
   ```

3. **Security Analysis**:
   ```bash
   npm run security:analyze
   npm run security:report
   npm run security:health-check
   ```

### Custom Monitoring Queries

**High-value queries for Redis**:
```bash
# Check rate limit violations in last hour
redis-cli ZRANGEBYSCORE rate_limit_violations $(date -d '1 hour ago' +%s) $(date +%s)

# Count critical events today
redis-cli LLEN critical_security_events

# Check suspicious transaction queue
redis-cli LLEN suspicious_transactions
```

## Alert Thresholds and Actions

### Critical Alerts (Immediate Action Required)

| Alert | Threshold | Action |
|-------|-----------|---------|
| Failed login attempts from single IP | >10 in 5 minutes | Auto-block IP |
| Critical security events | Any occurrence | Immediate investigation |
| Payment blocks | >5 in 1 hour | Review payment system |
| System errors | >50 in 5 minutes | Check system health |

### Warning Alerts (Review Within 1 Hour)

| Alert | Threshold | Action |
|-------|-----------|---------|
| High-risk transactions | >10 in 1 hour | Review patterns |
| Rate limit violations | >100 in 1 hour | Analyze traffic |
| Unusual location access | New country | Verify legitimacy |

### Info Alerts (Review Daily)

| Alert | Threshold | Action |
|-------|-----------|---------|
| New user registrations | >50 in 1 day | Monitor for patterns |
| Payment attempts | >200 in 1 day | Business analysis |

## Automation Recommendations

### Daily Automation
Set up cron jobs for daily tasks:
```bash
# Add to crontab (crontab -e)
0 9 * * * cd /path/to/tomodachi-tours && npm run security:daily-check
0 10 * * * cd /path/to/tomodachi-tours && npm run script:review-queue cleanup
```

### Weekly Automation
```bash
# Weekly security report (Mondays at 8 AM)
0 8 * * 1 cd /path/to/tomodachi-tours && npm run security:weekly-report

# Blacklist cleanup (Sundays at 11 PM)
0 23 * * 0 cd /path/to/tomodachi-tours && npm run script:blacklist cleanup
```

### Monthly Automation
```bash
# Monthly security audit (1st of month at 6 AM)
0 6 1 * * cd /path/to/tomodachi-tours && npm run security:monthly-audit
```

## Contact Information

### Security Team
- **Primary Contact**: security@tomodachitours.com
- **Emergency Contact**: +81-XXX-XXXX-XXXX
- **Escalation**: cto@tomodachitours.com

### External Resources
- **Redis Support**: [Redis Support Portal]
- **Upstash Support**: [Upstash Support]
- **Security Incident Response**: [External Security Firm]

---

**Last Updated**: $(date)
**Version**: 1.0
**Next Review**: $(date -d '+1 month') 