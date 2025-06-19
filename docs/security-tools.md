# Security Tools Documentation

## Overview

This document describes the security tools available for managing suspicious transactions, blacklists, and manual review processes.

## Table of Contents
- [Suspicious Transaction Detection](#suspicious-transaction-detection)
- [Blacklist Management](#blacklist-management)
- [Review Queue Management](#review-queue-management)

## Suspicious Transaction Detection

The suspicious transaction detection system automatically evaluates transactions for potential fraud using multiple risk factors.

### Risk Factors

1. **Unusual Amount**
   - Compares against typical amounts for each tour type
   - Morning Tour: ¥5,000 - ¥15,000
   - Night Tour: ¥8,000 - ¥20,000
   - Gion Tour: ¥10,000 - ¥25,000
   - Uji Tour: ¥15,000 - ¥35,000

2. **Unusual Time**
   - Flags transactions between 1 AM and 5 AM JST
   - Helps identify automated/bot activity

3. **Unusual Location**
   - Allowed countries: JP, US, GB, CA, AU, NZ, SG
   - Other countries are flagged as unusual

4. **Suspicious Device**
   - Detects suspicious user agents
   - Flags known bot/crawler patterns

5. **Multiple Bookings**
   - Tracks bookings per email within the last hour
   - Flags if more than 3 bookings

6. **Recent Failures**
   - Monitors failed payment attempts
   - Flags if 3+ failures in 24 hours

7. **Known Bad Actor**
   - Checks email and IP against blacklist
   - Immediate high-risk flag if matched

### Risk Levels

- **Low**: Score < 30
- **Medium**: Score 30-59
- **High**: Score 60-89
- **Critical**: Score ≥ 90

Risk scores are calculated by adding:
- Unusual Amount: +20
- Unusual Time: +15
- Unusual Location: +25
- Suspicious Device: +20
- Multiple Bookings: +15
- Recent Failures: +25
- Known Bad Actor: +50

### Actions

- **Critical Risk**: Transaction blocked automatically
- **High Risk**: Added to manual review queue
- **Medium Risk**: Transaction proceeds with monitoring
- **Low Risk**: Transaction proceeds normally

## Blacklist Management

The blacklist management tool (`npm run blacklist`) helps maintain a list of known bad actors.

### Commands

1. **Add Entry**
   ```bash
   npm run blacklist add <identifier> <reason> [options]
   
   Options:
   -e, --expiration   Number of days until expiration
   -b, --addedBy      Person adding the entry (default: current user)
   
   Example:
   npm run blacklist add suspicious@example.com "Multiple chargebacks" -e 30
   ```

2. **Remove Entry**
   ```bash
   npm run blacklist remove <identifier> [options]
   
   Options:
   -b, --removedBy    Person removing the entry (default: current user)
   
   Example:
   npm run blacklist remove suspicious@example.com
   ```

3. **List Entries**
   ```bash
   npm run blacklist list
   ```

4. **View History**
   ```bash
   npm run blacklist history [options]
   
   Options:
   -l, --limit    Number of entries to show (default: 50)
   ```

5. **Cleanup**
   ```bash
   npm run blacklist cleanup
   ```

### Storage

- Entries stored in Redis with prefix `blacklist:`
- History stored in Redis list `blacklist_log`
- Optional expiration supported
- Automatic cleanup of expired entries

## Review Queue Management

The review queue management tool (`npm run review-queue`) handles manual review of high-risk transactions.

### Commands

1. **List Queue**
   ```bash
   npm run review-queue list [options]
   
   Options:
   -l, --limit    Number of entries to show (default: 10)
   ```

2. **Review Transaction**
   ```bash
   npm run review-queue review <index> <decision> [options]
   
   Options:
   -n, --notes       Additional notes about the decision
   -b, --reviewedBy  Person making the review (default: current user)
   
   Example:
   npm run review-queue review 1 approve -n "Verified with customer"
   npm run review-queue review 2 reject -n "Fraudulent patterns detected"
   ```

3. **View History**
   ```bash
   npm run review-queue history [options]
   
   Options:
   -l, --limit    Number of entries to show (default: 50)
   ```

4. **Cleanup**
   ```bash
   npm run review-queue cleanup [options]
   
   Options:
   -d, --days     Remove entries older than this many days (default: 30)
   ```

### Review Process

1. High-risk transactions automatically enter queue
2. Reviewer examines transaction details:
   - Booking information
   - Risk factors
   - Risk score
   - Customer history
3. Decision made to approve or reject
4. If rejected:
   - Email and IP automatically blacklisted
   - Notes added to blacklist entry
5. Decision logged for audit trail

### Storage

- Queue stored in Redis list `manual_review_queue`
- Review decisions stored in Redis list `review_decisions_log`
- Automatic cleanup of old entries after 30 days

## Environment Setup

Required environment variables:
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Best Practices

1. **Blacklisting**
   - Use specific reasons for blacklisting
   - Set appropriate expiration times
   - Document decisions in notes
   - Regular cleanup of expired entries

2. **Review Process**
   - Review queue at least daily
   - Document review decisions thoroughly
   - Look for patterns across transactions
   - Consider customer history

3. **Monitoring**
   - Regular review of risk factor effectiveness
   - Adjust thresholds based on patterns
   - Monitor false positive/negative rates
   - Regular cleanup of old data

## Troubleshooting

Common issues and solutions:

1. **Redis Connection**
   - Check environment variables
   - Verify Redis service status
   - Check network connectivity

2. **Queue Management**
   - Use cleanup command for stuck entries
   - Verify Redis list integrity
   - Check for duplicate entries

3. **Blacklist**
   - Regular verification of entries
   - Check for expired entries not cleaned
   - Monitor blacklist size

## Security Considerations

1. **Access Control**
   - Limit access to these tools
   - Log all actions with user identity
   - Regular audit of access logs

2. **Data Protection**
   - Sensitive data is stored securely
   - Regular data cleanup
   - Encrypted communication

3. **Monitoring**
   - Regular review of logs
   - Alert on suspicious patterns
   - Monitor system performance 