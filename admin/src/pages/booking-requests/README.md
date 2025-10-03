# Booking Request Analytics & Monitoring

This module provides comprehensive analytics and monitoring capabilities for Uji tour booking requests.

## Features

### 1. Analytics Dashboard (`BookingRequestAnalytics.tsx`)
- **Overview Metrics**: Total requests, conversion rates, processing times, overdue requests
- **Status Breakdown**: Visual breakdown of pending, approved, and rejected requests
- **Conversion Trends**: Weekly conversion rate trends over time
- **Payment Analysis**: Payment success rates and common failure reasons
- **Rejection Analysis**: Common rejection reasons and patterns
- **Time Analysis**: Processing time metrics and overdue request details

### 2. Real-time Monitoring (`useBookingRequestMonitoring.ts`)
- **Time Alerts**: Automatic detection of requests exceeding 24-hour limit
- **Severity Levels**: Warning (24+ hours) and Critical (48+ hours) alerts
- **Browser Notifications**: Desktop notifications for critical alerts
- **Auto-refresh**: Real-time monitoring with configurable refresh intervals

### 3. Monitoring Alerts (`BookingRequestMonitoringAlert.tsx`)
- **Visual Alerts**: Prominent alerts displayed in admin interface
- **Quick Actions**: Direct links to review requests and view analytics
- **Expandable Details**: Detailed view of overdue requests
- **Dismissible**: Ability to dismiss alerts temporarily

### 4. Analytics Service (`bookingRequestAnalyticsService.ts`)
- **Comprehensive Metrics**: All analytics calculations and data processing
- **Database Integration**: Direct queries to booking and event tables
- **Error Handling**: Graceful fallbacks for missing data
- **Performance Optimized**: Efficient queries with proper indexing

## Usage

### Accessing Analytics
1. Navigate to **Booking Requests** page
2. Click **View Analytics** button
3. Use date range filters to analyze specific periods

### Monitoring Alerts
- Alerts appear automatically at the top of admin pages
- Critical alerts (48+ hours overdue) trigger browser notifications
- Click "Review Requests" to take immediate action

### Time Limits
- **Warning**: Requests pending for 24+ hours
- **Critical**: Requests pending for 48+ hours
- **Auto-notifications**: Browser notifications for critical alerts

## Database Schema

### Required Tables
- `bookings`: Main booking data with request-specific fields
- `booking_request_events`: Event tracking for analytics
- `email_failures`: Email delivery failure tracking

### Key Fields
- `request_submitted_at`: When request was submitted
- `admin_reviewed_at`: When admin took action
- `status`: PENDING_CONFIRMATION, CONFIRMED, REJECTED
- `rejection_reason`: Reason for rejection (analytics)

## Permissions
- Requires `edit_bookings` permission to view analytics and monitoring
- Only admins and managers see monitoring alerts
- Analytics data is filtered to Uji tours only

## Performance Considerations
- Analytics queries are optimized with database indexes
- Real-time monitoring uses configurable refresh intervals
- Browser notifications require user permission
- Data is cached appropriately to reduce server load

## Future Enhancements
- Email alert notifications for overdue requests
- Automated reminder systems
- Advanced filtering and segmentation
- Export capabilities for reporting
- Integration with external analytics tools