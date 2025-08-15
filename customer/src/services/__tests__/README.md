# Comprehensive Tracking Accuracy Test Suite

This directory contains a comprehensive testing suite for tracking accuracy as part of Task 14 of the Google Ads Analytics Integration project.

## Overview

The test suite validates the accuracy and reliability of the complete tracking system, including:

- End-to-end conversion tracking
- Attribution models and campaign types
- Privacy compliance (GDPR)
- Performance impact monitoring
- Data validation and sanitization

## Test Files

### 1. `endToEndTracking.test.js`
Tests complete user journey from ad click to purchase conversion.

**Coverage:**
- Complete user journey tracking (view → checkout → purchase)
- Cross-device conversion tracking
- Offline conversion attribution
- Data consistency across GA4 and Google Ads
- Funnel abandonment tracking
- Multiple tour selections in single session

**Requirements:** 1.1, 2.1, 4.1

### 2. `attributionModels.test.js`
Tests different attribution models and campaign types.

**Coverage:**
- First-touch attribution
- Last-touch attribution
- Data-driven attribution
- Position-based attribution
- Campaign types (Search, Display, Video, Shopping, Social)
- Multi-touch attribution scenarios
- Attribution window expiration

**Requirements:** 1.1, 1.4, 3.3

### 3. `privacyCompliance.test.js`
Tests GDPR compliance and consent management.

**Coverage:**
- Analytics consent preferences
- Marketing consent preferences
- Dynamic consent changes
- Data anonymization and hashing
- GDPR data deletion requests
- Cookie management
- Regional compliance (EU vs non-EU)
- Consent banner integration

**Requirements:** 6.1, 6.2, 6.3, 6.4

### 4. `performanceImpact.test.js`
Tests tracking script impact on page performance.

**Coverage:**
- Tracking call performance timing
- High-volume tracking efficiency
- Script loading performance monitoring
- Memory usage and leak detection
- Network failure handling
- Retry logic for failed calls
- Performance metrics collection
- Resource usage optimization

**Requirements:** 1.1, 2.2, 4.3

### 5. `dataValidationAccuracy.test.js`
Tests data validation, sanitization, and accuracy.

**Coverage:**
- Purchase data validation
- XSS prevention and sanitization
- SQL injection prevention
- Cross-platform data consistency
- Validation performance
- Error handling and recovery
- Data type validation
- Business logic validation

**Requirements:** 1.1, 2.1, 4.3

## Running Tests

### Run All Tests
```bash
npm run test:tracking-accuracy
```

### Run Individual Test Suites
```bash
npm run test:e2e-tracking      # End-to-end tracking tests
npm run test:attribution       # Attribution model tests
npm run test:privacy          # Privacy compliance tests
npm run test:performance      # Performance impact tests
npm run test:validation       # Data validation tests
```

### Watch Mode
```bash
npm run test:tracking-accuracy:watch
```

### With Coverage Report
The test runner automatically generates coverage reports when all tests pass:
```bash
npm run test:tracking-accuracy
# Coverage report: coverage/tracking-accuracy/index.html
```

## Test Configuration

### Environment Setup
Tests use mocked dependencies to ensure isolation:
- `gtag` function is mocked
- Privacy manager is mocked
- Attribution service is mocked
- Data validator is mocked
- Performance monitor is mocked

### Performance Thresholds
- Tracking calls: < 100ms total
- High-volume tracking: < 20ms average per event
- Validation: < 50ms per validation
- Memory increase: < 1MB for 20 tracking events

### Coverage Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test Structure

Each test file follows a consistent structure:

```javascript
describe('Main Test Category', () => {
    beforeEach(() => {
        // Setup mocks and reset state
    });

    describe('Sub-category', () => {
        test('should validate specific behavior', () => {
            // Test implementation
        });
    });
});
```

## Mock Strategy

### External Dependencies
- **gtag**: Mocked to capture tracking calls without external requests
- **Performance API**: Mocked to control timing measurements
- **Console methods**: Mocked to prevent test output pollution
- **DOM APIs**: Mocked for script loading tests

### Service Dependencies
- **Privacy Manager**: Mocked to control consent states
- **Attribution Service**: Mocked to provide test attribution data
- **Data Validator**: Mocked to control validation outcomes
- **Performance Monitor**: Mocked to capture performance metrics

## Assertions and Expectations

### Common Assertions
- `expect(mockGtag).toHaveBeenCalled()` - Verify tracking calls
- `expect(mockGtag).toHaveBeenCalledWith(...)` - Verify tracking data
- `expect(mockGtag).toHaveBeenCalledTimes(n)` - Verify call count
- `expect(performanceTime).toBeLessThan(threshold)` - Performance checks
- `expect(validationResult.isValid).toBe(true)` - Validation checks

### Data Consistency Checks
```javascript
const ga4Call = mockGtag.mock.calls.find(call => call[1] === 'purchase');
const adsCall = mockGtag.mock.calls.find(call => call[1] === 'conversion');

expect(ga4Call[2].transaction_id).toBe(adsCall[2].transaction_id);
expect(ga4Call[2].value).toBe(adsCall[2].value);
```

## Error Scenarios

Tests cover various error scenarios:
- Network failures
- Script loading failures
- Validation errors
- Privacy consent revocation
- Service unavailability
- Data corruption
- Performance degradation

## Continuous Integration

### Pre-commit Hooks
Consider adding pre-commit hooks to run tracking accuracy tests:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:tracking-accuracy"
    }
  }
}
```

### CI/CD Pipeline
Include in your CI/CD pipeline:
```yaml
- name: Run Tracking Accuracy Tests
  run: npm run test:tracking-accuracy
  
- name: Upload Coverage Reports
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/tracking-accuracy/lcov.info
```

## Debugging Tests

### Debug Individual Tests
```bash
# Run with verbose output
jest src/services/__tests__/endToEndTracking.test.js --verbose

# Run specific test
jest -t "should track complete user journey"

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues
1. **Mock not reset**: Ensure `jest.clearAllMocks()` in `beforeEach`
2. **Async timing**: Use `await` for async operations
3. **Performance timing**: Mock `performance.now()` for consistent results
4. **Memory leaks**: Clear references in `afterEach`

## Extending Tests

### Adding New Test Cases
1. Identify the appropriate test file
2. Add test case in relevant `describe` block
3. Follow existing mock patterns
4. Include performance and error scenarios
5. Update this README if adding new categories

### Adding New Test Files
1. Create new test file following naming convention
2. Add to `testFiles` array in `runTrackingAccuracyTests.js`
3. Add npm script in `package.json`
4. Update this README

## Metrics and Reporting

### Test Metrics
- Total test count: ~50+ tests across 5 files
- Coverage areas: 9 major tracking components
- Performance benchmarks: 4 timing thresholds
- Error scenarios: 15+ failure modes

### Success Criteria
- All tests pass (100% success rate)
- Coverage thresholds met (70%+ in all areas)
- Performance benchmarks met
- No memory leaks detected
- Error handling validated

## Maintenance

### Regular Updates
- Update test data when business rules change
- Adjust performance thresholds based on infrastructure
- Add new test cases for new features
- Review and update mocks for service changes

### Monitoring
- Track test execution time trends
- Monitor coverage percentage changes
- Review failed test patterns
- Update documentation for new team members

## Support

For questions or issues with the tracking accuracy tests:
1. Check existing test patterns in similar files
2. Review mock setup in `beforeEach` blocks
3. Consult service documentation for expected behavior
4. Run individual tests with verbose output for debugging

---

**Last Updated:** Task 14 Implementation
**Test Coverage:** End-to-end conversion tracking, attribution models, privacy compliance, performance impact, data validation
**Requirements Covered:** 1.1, 1.4, 2.1, 2.2, 3.3, 4.1, 4.3, 6.1, 6.2, 6.3, 6.4