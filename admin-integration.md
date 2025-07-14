# Tomodachi Tours Admin Site Implementation Plan

## Project Overview

### Current State Analysis
- **Customer Site**: Fully functional React app with Supabase backend, payment processing, Bokun integration
- **Admin Site**: Basic Vite setup with minimal implementation - needs complete rebuild
- **Database**: Existing Supabase database with tours, bookings, discount codes, and Bokun integration
- **Deployment**: Customer site on Vercel, admin site needs separate Vercel deployment

### Goals
1. Rebuild admin site from scratch using React (not Vite)
2. Implement employee authentication and role management for tour guides
3. Create availability management interface for tours
4. Build booking management and tracking system
5. Develop employee scheduling system for shift management
6. Deploy as separate Vercel application using same Supabase database

---

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Customer Site │    │   Admin Site    │
│   (React)       │    │   (React)       │
│   Vercel Deploy │    │   Vercel Deploy │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
            ┌────────▼────────┐
            │  Supabase DB    │
            │  - Auth         │
            │  - Tours        │
            │  - Bookings     │
            │  - Employees    │
            │  - Shifts       │
            └─────────────────┘
```

---

## Implementation Status

### ✅ Already Completed
- Basic Vite project structure
- Supabase integration setup
- Tailwind CSS configuration
- TypeScript configuration

### 🔄 In Progress
- Converting from Vite to Create React App
- Database schema extensions
- Authentication system

### ⏳ To Do
- Employee management system
- Booking management interface
- Shift scheduling system
- Analytics dashboard

---

## Phase 1: Database Schema Extensions

### SQL to Execute in Supabase

```sql
-- Employee roles enum
CREATE TYPE employee_role AS ENUM (
    'admin',
    'manager', 
    'tour_guide',
    'support'
);

-- Employee status enum
CREATE TYPE employee_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'terminated'
);

-- Shift status enum
CREATE TYPE shift_status AS ENUM (
    'available',
    'assigned',
    'unavailable',
    'completed',
    'cancelled'
);

-- Employee/Tour Guide accounts
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role employee_role NOT NULL DEFAULT 'tour_guide',
    status employee_status NOT NULL DEFAULT 'active',
    hire_date DATE NOT NULL,
    emergency_contact JSONB,
    certifications TEXT[],
    languages VARCHAR(10)[] DEFAULT '{"en","ja"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour guide availability/shifts
CREATE TABLE employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    tour_type tour_type NOT NULL,
    shift_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status shift_status DEFAULT 'available',
    max_participants INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, tour_type, shift_date, time_slot)
);

-- Admin activity tracking
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES employees(id),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'tour', 'employee', etc.
    entity_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link bookings to assigned tour guides
ALTER TABLE bookings ADD COLUMN assigned_guide_id UUID REFERENCES employees(id);
ALTER TABLE bookings ADD COLUMN guide_notes TEXT;

-- Create indexes for better performance
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employee_shifts_employee_id ON employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_date ON employee_shifts(shift_date);
CREATE INDEX idx_employee_shifts_tour_type ON employee_shifts(tour_type);
CREATE INDEX idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX idx_bookings_assigned_guide ON bookings(assigned_guide_id);

-- Row Level Security Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Employees can read their own data
CREATE POLICY "employees_own_data" ON employees
    FOR ALL USING (user_id = auth.uid());

-- Admins and managers can see all employees
CREATE POLICY "admin_manager_all_employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );

-- Employees can manage their own shifts
CREATE POLICY "employee_own_shifts" ON employee_shifts
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

-- Admins and managers can see all shifts
CREATE POLICY "admin_manager_all_shifts" ON employee_shifts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );

-- Only admins can access activity logs
CREATE POLICY "admin_only_activity_log" ON admin_activity_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role = 'admin'
            AND e.status = 'active'
        )
    );

-- Update existing bookings RLS to allow employee access
CREATE POLICY "employees_view_assigned_bookings" ON bookings
    FOR SELECT USING (
        assigned_guide_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "admin_manager_all_bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );
```

---

## Phase 2: React App Conversion

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Create React App (replacing Vite)
- **Routing**: React Router v6
- **State Management**: React Context + useReducer
- **UI Library**: Tailwind CSS + Headless UI
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: React Query (TanStack Query)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

---

## Implementation Checklist

### Phase 1: Foundation ⏳
- [ ] Execute database schema SQL
- [ ] Convert from Vite to Create React App
- [ ] Set up project structure
- [ ] Configure environment variables
- [ ] Set up Vercel deployment

### Phase 2: Authentication 🔄
- [ ] Employee authentication context
- [ ] Login/logout functionality
- [ ] Role-based permissions
- [ ] Protected routes
- [ ] Employee registration (admin only)

### Phase 3: Core Features ⏳
- [ ] Dashboard overview
- [ ] Booking management
- [ ] Employee management
- [ ] Tour availability management
- [ ] Shift scheduling

### Phase 4: Advanced Features ⏳
- [ ] Analytics dashboard
- [ ] Communication system
- [ ] Real-time updates
- [ ] Reporting interface

---

## Next Steps
1. Execute the database schema SQL in Supabase
2. Convert admin project from Vite to Create React App
3. Set up basic authentication system
4. Build employee management interface
5. Implement booking management features 