# Design Document

## Overview

The admin timesheet system will be integrated into the existing admin interface as a new page accessible to all authenticated admin users. The system will provide a simple clock in/clock out interface with timesheet management and payroll reporting capabilities. The design follows the existing admin architecture patterns using React, TypeScript, Supabase, and Tailwind CSS.

## Architecture

### Frontend Architecture
- **Framework**: React with TypeScript following existing admin app patterns
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router with protected routes using existing `ProtectedRoute` component
- **Styling**: Tailwind CSS matching existing admin interface design
- **Authentication**: Integration with existing `AdminAuthContext` and permission system

### Backend Architecture
- **Database**: Supabase PostgreSQL with new `timesheets` table
- **API**: Supabase client-side queries following existing service patterns
- **File Generation**: Client-side CSV generation for payroll reports
- **Real-time Updates**: Supabase real-time subscriptions for live timesheet status

## Components and Interfaces

### Database Schema

#### Timesheets Table
```sql
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    todo TEXT,
    clock_out TIMESTAMP WITH TIME ZONE,
    note TEXT,
    hours_worked DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN clock_out IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
            ELSE NULL
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### TypeScript Interfaces

#### Core Types
```typescript
export interface Timesheet {
    id: string;
    employee_id: string;
    clock_in: string;
    todo?: string;
    clock_out?: string;
    note?: string;
    hours_worked?: number;
    created_at: string;
    updated_at: string;
    employee?: Employee;
}

export interface TimesheetFormData {
    todo?: string;
    note?: string;
}

export interface PayrollSummary {
    employee_id: string;
    employee_name: string;
    month: string;
    year: number;
    total_hours: number;
    total_shifts: number;
    average_shift_length: number;
    shifts: TimesheetEntry[];
}

export interface TimesheetEntry {
    date: string;
    clock_in: string;
    clock_out?: string;
    hours_worked?: number;
    todo?: string;
    note?: string;
}
```

### React Components

#### TimesheetDashboard (Main Page)
- **Purpose**: Main timesheet interface showing current status and recent entries
- **Features**: Clock in/out buttons, current status display, recent timesheet entries
- **Permissions**: Available to all authenticated admin users
- **Location**: `/admin/src/pages/timesheet/TimesheetDashboard.tsx`

#### TimesheetTable (Management View)
- **Purpose**: Administrative view of all timesheet entries
- **Features**: Filterable table, employee selection, date range filtering
- **Permissions**: Requires `manage_employees` permission
- **Location**: `/admin/src/pages/timesheet/TimesheetTable.tsx`

#### ClockInOutWidget
- **Purpose**: Reusable clock in/out interface component
- **Features**: Status display, clock in/out buttons, todo/note forms
- **Location**: `/admin/src/components/timesheet/ClockInOutWidget.tsx`

#### PayrollReports
- **Purpose**: Generate and download monthly payroll summaries
- **Features**: Employee selection, month/year picker, CSV download
- **Permissions**: Requires `manage_employees` permission
- **Location**: `/admin/src/components/timesheet/PayrollReports.tsx`

### Services

#### TimesheetService
- **Purpose**: Handle all timesheet-related API operations
- **Methods**:
  - `getCurrentTimesheet(employeeId)`: Get active timesheet for employee
  - `clockIn(employeeId, todo?)`: Create new timesheet entry
  - `clockOut(timesheetId, note?)`: Complete timesheet entry
  - `getTimesheets(filters)`: Get filtered timesheet entries
  - `getPayrollSummary(employeeId, month, year)`: Generate payroll data
- **Location**: `/admin/src/services/timesheetService.ts`

## Data Models

### Timesheet Lifecycle
1. **Clock In**: Create new timesheet record with `clock_in` timestamp and optional `todo`
2. **Active State**: Timesheet exists with `clock_in` but no `clock_out`
3. **Clock Out**: Update record with `clock_out` timestamp and optional `note`
4. **Completed State**: Both `clock_in` and `clock_out` populated, `hours_worked` calculated

### Business Rules
- Only one active timesheet per employee at a time
- Clock in requires authentication and active employee status
- Clock out requires existing active timesheet
- Hours worked calculated automatically using database computed column
- Payroll summaries include all completed timesheets for specified period

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Toast notifications with retry options
- **Validation Errors**: Form field validation with inline error messages
- **Permission Errors**: Redirect to appropriate page with error message
- **State Conflicts**: Automatic state refresh and user notification

### Database Constraints
- **Foreign Key Constraints**: Ensure employee exists and is active
- **Unique Constraints**: Prevent multiple active timesheets per employee
- **Check Constraints**: Ensure clock_out is after clock_in when both exist
- **RLS Policies**: Employees can only access their own timesheets unless they have management permissions

### Edge Cases
- **Browser Refresh**: Persist timesheet state and recover gracefully
- **Network Disconnection**: Queue operations and sync when reconnected
- **Concurrent Access**: Handle multiple admin users managing same employee
- **Time Zone Issues**: Store all timestamps in UTC, display in local time

## Testing Strategy

### Unit Tests
- **Service Layer**: Test all TimesheetService methods with mocked Supabase client
- **Components**: Test clock in/out logic, form validation, and state management
- **Utilities**: Test payroll calculation functions and CSV generation
- **Location**: `/admin/src/services/__tests__/timesheetService.test.ts`

### Integration Tests
- **Database Operations**: Test timesheet CRUD operations with test database
- **Authentication Flow**: Test permission-based access to timesheet features
- **Real-time Updates**: Test Supabase subscriptions and live updates
- **File Generation**: Test CSV export functionality with sample data

### User Acceptance Tests
- **Clock In/Out Flow**: Test complete employee timesheet workflow
- **Management Interface**: Test admin timesheet management and reporting
- **Payroll Generation**: Test monthly summary generation and download
- **Permission Boundaries**: Test access control for different user roles

## Security Considerations

### Row Level Security (RLS)
```sql
-- Employees can view/edit their own timesheets
CREATE POLICY "employees_own_timesheets" ON timesheets
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Managers and admins can view all timesheets
CREATE POLICY "managers_all_timesheets" ON timesheets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
```

### Data Protection
- **PII Handling**: Employee names and details handled according to existing patterns
- **Audit Trail**: All timesheet operations logged with timestamps and user context
- **Access Control**: Permission-based access to management features
- **Data Retention**: Configurable retention policy for historical timesheet data

## Performance Optimization

### Database Optimization
- **Indexes**: Create indexes on employee_id, clock_in, and clock_out columns
- **Computed Columns**: Use database-generated hours_worked for consistency
- **Query Optimization**: Efficient queries for payroll summaries and reporting
- **Connection Pooling**: Leverage existing Supabase connection management

### Frontend Optimization
- **Lazy Loading**: Load timesheet components only when needed
- **Caching**: Cache employee data and recent timesheet entries
- **Real-time Updates**: Selective subscriptions to minimize bandwidth
- **Bundle Optimization**: Code splitting for timesheet-related components

## Integration Points

### Existing Admin System
- **Navigation**: Add timesheet link to existing admin navigation menu
- **Permissions**: Integrate with existing role-based permission system
- **Styling**: Use existing Tailwind CSS classes and component patterns
- **Error Handling**: Follow existing error handling and notification patterns

### Employee Management
- **Employee Data**: Leverage existing employee records and authentication
- **Role Integration**: Respect existing employee roles and permissions
- **Status Checking**: Ensure only active employees can use timesheet system
- **Profile Integration**: Link timesheet data to employee profiles

### Future Enhancements
- **Mobile App**: API design supports future mobile timesheet app
- **Reporting Dashboard**: Foundation for advanced analytics and reporting
- **Integration APIs**: Extensible design for payroll system integration
- **Automated Notifications**: Framework for shift reminders and alerts