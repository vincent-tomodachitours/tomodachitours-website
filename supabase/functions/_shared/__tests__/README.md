# Backend Function Unit Tests

This directory contains comprehensive unit tests for the Uji tour booking request backend functions.

## Test Coverage

### 1. Create Booking Request Function Tests
**File:** `../create-booking-request/__tests__/create-booking-request.test.ts`

**Test Scenarios:**
- ✅ Validates Uji tour types correctly (`uji-tour`, `uji-walking-tour`)
- ✅ Handles valid booking request data
- ✅ Rejects non-Uji tours with appropriate error message
- ✅ Handles validation errors gracefully
- ✅ Handles database errors with proper error responses
- ✅ Processes CORS preflight requests
- ✅ Creates booking with correct data structure
- ✅ Handles email sending failures gracefully (continues processing)

**Requirements Covered:**
- Requirement 1.1: Booking request creation for Uji tours
- Requirement 1.5: Payment method storage without immediate charge
- Requirement 3.1: Customer confirmation emails

### 2. Manage Booking Request Function Tests
**File:** `../manage-booking-request/__tests__/manage-booking-request.test.ts`

**Test Scenarios:**
- ✅ Validates request data correctly (approval/rejection)
- ✅ Handles approval flow with payment processing
- ✅ Handles rejection flow with status updates
- ✅ Handles payment failures with retry logic
- ✅ Handles booking not found scenarios
- ✅ Validates booking status (must be PENDING_CONFIRMATION)
- ✅ Handles validation errors
- ✅ Processes CORS preflight requests
- ✅ Handles database update errors
- ✅ Processes payments with correct parameters
- ✅ Updates booking status correctly on approval/rejection

**Requirements Covered:**
- Requirement 2.2: Admin approval workflow
- Requirement 2.3: Admin rejection workflow
- Requirement 2.6: Payment processing and error handling
- Requirement 3.2: Status notification emails

### 3. Stripe Service Tests
**File:** `./stripe-service.test.ts`

**Test Scenarios:**
- ✅ Creates payment intents successfully
- ✅ Creates payments with metadata (discount codes, booking IDs)
- ✅ Confirms payments successfully
- ✅ Handles payment confirmation failures
- ✅ Processes immediate payments
- ✅ Handles immediate payment failures
- ✅ Validates positive amounts
- ✅ Creates refunds (full and partial)
- ✅ Retrieves payment intent details
- ✅ Creates payment methods
- ✅ Handles payment method creation errors
- ✅ Handles different payment statuses (requires_action for 3D Secure)
- ✅ Processes payments with discount codes
- ✅ Uses correct currency (JPY)

**Requirements Covered:**
- Requirement 1.5: Payment method creation and storage
- Requirement 2.6: Payment processing for approved requests

### 4. Email Notification Tests
**File:** `./email-notification.test.ts`

**Test Scenarios:**
- ✅ Sends booking request confirmation emails
- ✅ Sends admin notification emails
- ✅ Sends approval notification emails
- ✅ Sends rejection notification emails with reasons
- ✅ Sends payment failure notification emails
- ✅ Handles invalid action types
- ✅ Escapes special characters in template data
- ✅ Handles email sending failures
- ✅ Handles template not found errors
- ✅ Handles rate limit errors
- ✅ Formats dates correctly
- ✅ Formats amounts correctly (with commas and yen symbol)
- ✅ Handles missing optional fields
- ✅ Supports multiple admin email recipients

**Requirements Covered:**
- Requirement 1.4: Customer request confirmation emails
- Requirement 3.1: Customer confirmation emails
- Requirement 3.2: Status notification emails
- Requirement 3.3: Payment failure notifications

### 5. Error Handling Integration Tests
**File:** `./error-handling-integration.test.ts` (existing)

**Test Scenarios:**
- ✅ Logs events correctly with structured data
- ✅ Retries operations with exponential backoff
- ✅ Fails after maximum retries
- ✅ Handles non-retryable errors
- ✅ Handles payment errors with retry logic
- ✅ Handles email errors with retry logic
- ✅ Handles database errors with retry logic
- ✅ Implements circuit breaker pattern

### 6. Booking Request Integration Tests
**File:** `./booking-request-integration.test.ts`

**Test Scenarios:**
- ✅ Complete end-to-end booking request flow from submission to confirmation
- ✅ Payment failure recovery and retry mechanisms
- ✅ Admin interface interactions and API integrations
- ✅ Email delivery and failure handling scenarios
- ✅ Complete booking rejection workflow
- ✅ Concurrent booking request handling

**Requirements Covered:**
- Requirement 1.1, 1.2, 1.3, 1.4: Customer booking request workflows
- Requirement 2.1, 2.2, 2.3: Admin approval/rejection workflows
- Requirement 3.1, 3.2, 3.3, 3.4: Email notification systems

### 7. Admin API Integration Tests
**File:** `./admin-api-integration.test.ts`

**Test Scenarios:**
- ✅ Admin dashboard data fetching and filtering
- ✅ Request approval workflow with payment processing
- ✅ Request rejection workflow with notifications
- ✅ Bulk approval operations
- ✅ Payment failure handling in admin interface
- ✅ Real-time analytics and monitoring

**Requirements Covered:**
- Requirement 2.1, 2.2, 2.3: Admin request management
- Requirement 2.4, 2.5, 2.6: Admin workflow and error handling

### 8. Email Failure Integration Tests
**File:** `./email-failure-integration.test.ts`

**Test Scenarios:**
- ✅ Email rate limit handling and retry mechanisms
- ✅ Non-retryable email error handling
- ✅ Template error handling and validation
- ✅ Network error recovery
- ✅ Email queue management during failures
- ✅ Template data validation and sanitization
- ✅ Fallback notification systems

**Requirements Covered:**
- Requirement 1.4: Customer confirmation emails
- Requirement 3.1, 3.2, 3.3, 3.4: Email notification and error handling

## Running the Tests

### Prerequisites
- Deno runtime installed
- Supabase CLI (for Edge Functions environment)

### Environment Variables
Set these environment variables before running tests:
```bash
export SENDGRID_API_KEY=your_sendgrid_key
export STRIPE_SECRET_KEY=your_stripe_secret_key
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
export FRONTEND_URL=https://your-frontend-url.com
```

### Run Individual Test Files
```bash
# Create booking request tests
deno test --allow-net --allow-read --allow-env supabase/functions/create-booking-request/__tests__/create-booking-request.test.ts

# Manage booking request tests
deno test --allow-net --allow-read --allow-env supabase/functions/manage-booking-request/__tests__/manage-booking-request.test.ts

# Stripe service tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/stripe-service.test.ts

# Email notification tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/email-notification.test.ts

# Error handling tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/error-handling-integration.test.ts
```

### Run All Unit Tests
```bash
deno run --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/run-backend-tests.ts
```

### Run All Integration Tests
```bash
deno run --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/run-integration-tests.ts
```

### Run Individual Integration Test Files
```bash
# Booking request integration tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/booking-request-integration.test.ts

# Admin API integration tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/admin-api-integration.test.ts

# Email failure integration tests
deno test --allow-net --allow-read --allow-env supabase/functions/_shared/__tests__/email-failure-integration.test.ts
```

## Test Architecture

### Mocking Strategy
- **Supabase Client**: Mocked to simulate database operations
- **Stripe Service**: Mocked to simulate payment processing
- **SendGrid**: Mocked to simulate email sending
- **Environment Variables**: Set for testing environment

### Test Data
- Standardized mock booking data for consistency
- Various error scenarios (payment failures, email failures, etc.)
- Edge cases (missing fields, invalid data, etc.)

### Assertions
- Response status codes and structure
- Database operation parameters
- Email template data and recipients
- Error handling and retry logic
- Payment processing parameters

## Requirements Traceability

| Requirement | Unit Test Coverage | Integration Test Coverage | Status |
|-------------|-------------------|---------------------------|--------|
| 1.1 - Booking request creation | Create booking request tests | Booking request integration tests | ✅ |
| 1.2 - Request flow vs instant booking | - | Booking request integration tests | ✅ |
| 1.3 - Customer booking form | - | Booking request integration tests | ✅ |
| 1.4 - Customer confirmation emails | Email notification tests | Email failure integration tests | ✅ |
| 1.5 - Payment method storage | Stripe service tests | Booking request integration tests | ✅ |
| 2.1 - Admin notification system | Email notification tests | Admin API integration tests | ✅ |
| 2.2 - Admin approval workflow | Manage booking request tests | Admin API integration tests | ✅ |
| 2.3 - Admin rejection workflow | Manage booking request tests | Admin API integration tests | ✅ |
| 2.4 - Admin interface interactions | - | Admin API integration tests | ✅ |
| 2.5 - Admin bulk operations | - | Admin API integration tests | ✅ |
| 2.6 - Payment processing & errors | Stripe service + manage booking tests | Booking request + Admin API tests | ✅ |
| 3.1 - Customer confirmation emails | Email notification tests | Email failure integration tests | ✅ |
| 3.2 - Status notification emails | Email notification tests | Email failure integration tests | ✅ |
| 3.3 - Payment failure notifications | Email notification tests | Email failure integration tests | ✅ |
| 3.4 - Email error handling | Email notification tests | Email failure integration tests | ✅ |

## Test Metrics

### Unit Tests
- **Total Test Cases**: ~50 individual test scenarios
- **Function Coverage**: 100% of backend functions
- **Error Scenario Coverage**: Comprehensive error handling
- **Mock Coverage**: All external dependencies mocked

### Integration Tests
- **Total Integration Test Cases**: ~19 comprehensive workflow tests
- **End-to-End Coverage**: Complete user and admin workflows
- **Failure Scenario Coverage**: Payment failures, email failures, network issues
- **Concurrent Processing**: Multi-request handling and race conditions
- **Real-time Features**: Analytics, monitoring, and notifications

### Combined Coverage
- **Total Test Cases**: ~69 test scenarios (unit + integration)
- **Requirements Coverage**: All specified requirements tested
- **Workflow Coverage**: Complete booking request lifecycle
- **Error Recovery**: Comprehensive failure handling and retry mechanisms

## CI/CD Integration

These tests are designed to run in:
- Local development environment
- GitHub Actions CI/CD pipeline
- Supabase Edge Functions deployment pipeline

## Maintenance

- Update tests when adding new features
- Add new test scenarios for edge cases
- Keep mock data synchronized with actual data structures
- Review and update requirements traceability regularly