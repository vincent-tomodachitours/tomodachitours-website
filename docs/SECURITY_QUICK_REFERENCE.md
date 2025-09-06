# Security Quick Reference Card

## 🚨 Emergency Commands

```bash
# Block an IP immediately
npm run script:blacklist add "SUSPICIOUS_IP" "Emergency block - $(date)"

# Check critical events now
npm run security:daily-check

# Check system status
systemctl status tomodachi-tours && redis-cli ping
```

## 📅 Daily Tasks (5-15 minutes)

### Morning Security Check
```bash
# Run automated daily check
npm run security:daily-check

# Review flagged transactions
npm run script:review-queue list

# Quick system health check
free -h && df -h
```

### Action Items Based on Results
- **Critical Events**: Investigate immediately
- **Rate Limit Violations**: Review and block repeat offenders
- **Suspicious Transactions**: Review and approve/reject
- **Failed Logins**: Consider blocking IPs with >10 failures

## 📊 Weekly Tasks (30-45 minutes)

### Monday Morning Report
```bash
# Generate weekly security report
npm run security:weekly-report

# Update blacklists
npm run script:blacklist cleanup
npm run script:blacklist list

# Check dependency vulnerabilities
npm audit
```

## 🔧 Common Commands

### Blacklist Management
```bash
npm run script:blacklist add "IP_ADDRESS" "REASON"
npm run script:blacklist remove "IP_ADDRESS"
npm run script:blacklist list
npm run script:blacklist cleanup
```

### Review Queue Management
```bash
npm run script:review-queue list
npm run script:review-queue review INDEX approve
npm run script:review-queue review INDEX reject
npm run script:review-queue history
```

### Security Analysis
```bash
npm run security:analyze      # Same as daily check
npm run security:report       # Same as weekly report
npm run security:health-check # Basic health check
```

## ⚠️ Alert Thresholds

| Severity | Threshold | Action Time |
|----------|-----------|-------------|
| 🔴 Critical | Any critical event | Immediate |
| 🟡 High | >10 failed logins from IP | 15 minutes |
| 🟡 High | >5 payment blocks/hour | 30 minutes |
| 🟢 Medium | >100 rate limit violations | 1 hour |

## 📞 Escalation Contacts

- **Security Team**: security@tomodachitours.com
- **Emergency**: +81-XXX-XXXX-XXXX
- **CTO**: cto@tomodachitours.com

## 🔍 Investigation Steps

1. **Identify** the threat using daily check
2. **Contain** by blocking IPs/users
3. **Investigate** using security logs
4. **Recover** by removing malicious data
5. **Learn** by updating procedures

## 📁 File Locations

- **Logs**: Use Redis queries or security dashboard
- **Reports**: `./reports/security-weekly-YYYY-MM-DD.json`
- **Configs**: `./src/services/` (rate-limit.ts, velocity-check.ts, etc.)
- **Scripts**: `./scripts/` (manage-blacklist.ts, etc.)

## 🤖 Automation Status

### Current Automations
- ✅ Rate limiting
- ✅ IP protection
- ✅ Suspicious transaction detection
- ✅ Security logging

### Recommended Cron Jobs
```bash
# Daily security check (9 AM)
0 9 * * * cd /path/to/tomodachi-tours && npm run security:daily-check

# Weekly report (Monday 8 AM)  
0 8 * * 1 cd /path/to/tomodachi-tours && npm run security:weekly-report

# Cleanup (Sunday 11 PM)
0 23 * * 0 cd /path/to/tomodachi-tours && npm run script:blacklist cleanup
```

---
**Last Updated**: $(date)
**Version**: 1.0 