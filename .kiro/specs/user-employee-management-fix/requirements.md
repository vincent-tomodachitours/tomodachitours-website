# Requirements Document

## Introduction

The current admin employee management system has a critical Row-Level Security (RLS) policy issue that prevents proper user visibility and management. Based on database analysis, the root cause has been identified:

**Primary Issue**: The `employees` table had overly restrictive RLS policies that only allowed users to see their own employee record (`employees_select_own` policy). There was no policy allowing admins or managers to view all employee records, which caused the admin interface to show no employees.

**Root Cause**: The original RLS policies created infinite recursion when trying to check admin permissions by querying the same employees table they were protecting.

**Solution Implemented**: Created email-based admin access policies that avoid circular dependencies by checking JWT tokens directly instead of querying the employees table.

**Remaining Opportunities**:
1. **Enhanced Role-Based Access**: Move from hardcoded email-based admin access to proper role-based permissions
2. **User Registration Integration**: Bridge the gap between auth.users and employees table for new registrations
3. **Comprehensive User Management**: Create a unified interface showing both authenticated users and employee records

## Requirements

### Requirement 1

**User Story:** As a developer, I want to fix the RLS policy restrictions on the employees table, so that admins and managers can view and manage all employee records.

#### Acceptance Criteria

1. WHEN I examine the current RLS policies THEN I SHALL identify that `employees_select_own` only allows users to see their own records
2. WHEN I create new RLS policies THEN I SHALL add policies allowing admins and managers to SELECT all employee records
3. WHEN I create admin management policies THEN I SHALL add policies allowing admins to INSERT, UPDATE, and DELETE employee records
4. WHEN I create manager policies THEN I SHALL add policies allowing managers to SELECT and UPDATE employee records
5. WHEN the policies are applied THEN the admin interface SHALL successfully load all employee records

### Requirement 2

**User Story:** As an admin, I want to see all existing employee records in the management interface, so that I can manage the users that are already in the system.

#### Acceptance Criteria

1. WHEN I navigate to the employee management page THEN the system SHALL display all valid employee records from the employees table
2. WHEN there are employees with missing required fields THEN the system SHALL handle them gracefully with default values
3. WHEN I view the employee list THEN the system SHALL show accurate data for name, email, role, status, and hire date
4. WHEN there are data loading errors THEN the system SHALL display helpful error messages with recovery options

### Requirement 3

**User Story:** As an admin, I want to see all registered users (both with and without employee records), so that I can have complete visibility of everyone who has access to the system.

#### Acceptance Criteria

1. WHEN I view the user management interface THEN the system SHALL display users from both the `auth.users` table and the `employees` table
2. WHEN a user is registered through authentication but not in the employees table THEN the system SHALL show them with a "Pending" or "Unassigned" status
3. WHEN I view the combined user list THEN the system SHALL clearly distinguish between users with employee records and those without
4. WHEN I search or filter users THEN the system SHALL search across both auth users and employee records

### Requirement 4

**User Story:** As an admin, I want to assign roles and employee details to registered users, so that I can properly manage their access and responsibilities.

#### Acceptance Criteria

1. WHEN I select a registered user without an employee record THEN the system SHALL allow me to create an employee profile for them
2. WHEN I create an employee profile for a registered user THEN the system SHALL link the auth user to the employee record via user_id
3. WHEN I assign a role to a user THEN the system SHALL update their permissions accordingly
4. IF a user already has an employee record THEN the system SHALL prevent duplicate employee creation

### Requirement 5

**User Story:** As an admin, I want to manage user access and status, so that I can control who can access the system and their level of permissions.

#### Acceptance Criteria

1. WHEN I view a user's details THEN the system SHALL show both their authentication status and employee status
2. WHEN I deactivate a user THEN the system SHALL update both their employee status and optionally disable their authentication
3. WHEN I reactivate a user THEN the system SHALL restore their access and employee status
4. WHEN I delete a user THEN the system SHALL provide options to handle both the auth record and employee record

### Requirement 6

**User Story:** As an admin, I want to see comprehensive user information, so that I can make informed decisions about user management.

#### Acceptance Criteria

1. WHEN I view the user list THEN the system SHALL display email, registration date, last login, role, and status for each user
2. WHEN I view user details THEN the system SHALL show authentication metadata, employee details (if any), and activity history
3. WHEN I search for users THEN the system SHALL search across both auth users and employee records
4. WHEN I filter users THEN the system SHALL include filters for auth status, employee status, and role

### Requirement 7

**User Story:** As an admin, I want to invite new users and automatically create their employee records, so that I can streamline the onboarding process.

#### Acceptance Criteria

1. WHEN I invite a new user THEN the system SHALL send them an authentication invitation
2. WHEN a user accepts an invitation THEN the system SHALL automatically create their employee record with the assigned role
3. WHEN I create an employee record THEN the system SHALL optionally send an invitation if no auth user exists
4. WHEN the invitation process fails THEN the system SHALL provide clear error messages and recovery options