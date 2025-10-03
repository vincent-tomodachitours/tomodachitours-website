# Implementation Plan

- [x] 1. Set up database schema for booking requests
  - Create database migration to add new booking statuses and request-specific fields
  - Add booking_request_events table for tracking request lifecycle
  - Update existing booking status constraints to include new statuses
  - _Requirements: 1.1, 2.1, 4.3_

- [x] 2. Create booking request backend service
  - [x] 2.1 Implement create-booking-request Supabase function
    - Create new Edge Function to handle booking request creation
    - Implement request validation using existing validation middleware
    - Add Stripe Payment Method creation without immediate charge
    - Store booking with PENDING_CONFIRMATION status
    - _Requirements: 1.1, 1.5, 4.3_

  - [x] 2.2 Add email notification system for booking requests
    - Create SendGrid templates for request confirmation emails
    - Implement customer request confirmation email sending
    - Add admin notification email for new requests
    - Integrate with existing email failure logging system
    - _Requirements: 1.4, 2.1, 3.1_

- [x] 3. Implement request management backend service
  - [x] 3.1 Create manage-booking-request Supabase function
    - Implement admin approval/rejection endpoint
    - Add payment processing for approved requests using stored payment methods
    - Handle payment failures with proper error responses
    - Update booking status based on admin actions
    - _Requirements: 2.2, 2.3, 2.6_

  - [x] 3.2 Add status notification email system
    - Create SendGrid templates for approval/rejection notifications
    - Implement customer notification emails for status changes
    - Add payment failure notification emails
    - Handle email delivery failures gracefully
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 4. Modify frontend checkout flow for Uji tours
  - [ ] 4.1 Add tour type detection logic to checkout
    - Modify checkout component to detect Uji tour types
    - Implement conditional rendering for request vs instant booking flows
    - Update checkout button text and behavior for Uji tours
    - Add request confirmation messaging
    - _Requirements: 1.1, 1.2, 4.1_

  - [ ] 4.2 Create booking request form component
    - Build BookingRequestForm component for Uji tour requests
    - Implement Stripe Payment Method creation in frontend
    - Add form validation and error handling
    - Create success confirmation UI for submitted requests
    - _Requirements: 1.1, 1.3, 1.5_

  - [ ] 4.3 Update payment processing integration
    - Modify existing payment components to handle deferred payment flow
    - Update CardForm component to support payment method creation without charging
    - Add request submission handling to payment workflow
    - Ensure backward compatibility with existing instant booking flow
    - _Requirements: 1.5, 4.2, 4.3_

- [ ] 5. Build admin request management interface
  - [ ] 5.1 Create booking requests dashboard page
    - Build admin page to display pending booking requests
    - Implement request list with filtering and sorting capabilities
    - Add request details view with customer and booking information
    - Create responsive design consistent with existing admin interface
    - _Requirements: 2.1, 2.2, 4.4_

  - [ ] 5.2 Implement admin approval/rejection actions
    - Add approve/reject buttons with confirmation dialogs
    - Implement API calls to manage-booking-request function
    - Add loading states and success/error feedback
    - Handle payment processing results and display appropriate messages
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ] 5.3 Add request analytics and monitoring
    - Create metrics dashboard for booking request performance
    - Implement conversion rate tracking from requests to confirmed bookings
    - Add alerts for requests exceeding time limits
    - Display payment failure rates and common rejection reasons
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Implement automated cleanup and monitoring
  - [ ] 6.1 Create request timeout handling system
    - Implement automated reminder emails for pending requests
    - Add customer notification system for delayed processing
    - Create optional auto-rejection for requests exceeding 48 hours
    - Implement cleanup of expired Stripe payment methods
    - _Requirements: 3.5, 2.6_

  - [ ] 6.2 Add comprehensive error handling and logging
    - Implement detailed logging for all request lifecycle events
    - Add error recovery mechanisms for payment failures
    - Create admin notification system for system errors
    - Implement retry logic for failed operations
    - _Requirements: 2.6, 3.4, 4.3_

- [ ] 7. Create comprehensive test suite
  - [ ] 7.1 Write unit tests for backend functions
    - Test create-booking-request function with various input scenarios
    - Test manage-booking-request function for approval/rejection flows
    - Test payment method creation and processing logic
    - Test email notification systems and template rendering
    - _Requirements: 1.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [ ] 7.2 Write integration tests for complete workflows
    - Test end-to-end booking request flow from submission to confirmation
    - Test payment failure recovery and retry mechanisms
    - Test admin interface interactions and API integrations
    - Test email delivery and failure handling scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [ ] 7.3 Implement frontend component tests
    - Test tour type detection and conditional rendering logic
    - Test booking request form validation and submission
    - Test admin dashboard functionality and user interactions
    - Test error handling and loading states in UI components
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.4_

- [ ] 8. Deploy and validate system integration
  - [ ] 8.1 Deploy database migrations and backend functions
    - Run database migrations in staging environment
    - Deploy new Supabase Edge Functions
    - Test backend services with real Stripe integration
    - Validate email delivery with SendGrid templates
    - _Requirements: 1.1, 1.4, 2.1, 3.1, 3.2, 3.3, 4.3_

  - [ ] 8.2 Deploy frontend changes and validate user flows
    - Deploy frontend modifications to staging environment
    - Test complete user journey for Uji tour booking requests
    - Validate admin workflow for request management
    - Ensure existing non-Uji tour bookings remain unaffected
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1, 4.2_

  - [ ] 8.3 Perform production deployment and monitoring setup
    - Deploy all components to production environment
    - Set up monitoring and alerting for new request system
    - Configure analytics tracking for request conversion metrics
    - Create operational runbooks for admin team
    - _Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_