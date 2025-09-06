import { supabase } from '../lib/supabase';
import { Employee, EmployeeFormData, EmployeeRole, EmployeeStatus } from '../types';

export class EmployeeService {
    /**
     * Fetch all employees with optional filters
     */
    static async getEmployees(filters?: {
        status?: EmployeeStatus[];
        role?: EmployeeRole[];
        searchQuery?: string;
    }): Promise<Employee[]> {
        try {
            let query = supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters) {
                if (filters.status && filters.status.length > 0) {
                    query = query.in('status', filters.status);
                }

                if (filters.role && filters.role.length > 0) {
                    query = query.in('role', filters.role);
                }

                if (filters.searchQuery) {
                    const searchTerm = `%${filters.searchQuery}%`;
                    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},employee_code.ilike.${searchTerm}`);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching employees:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('EmployeeService.getEmployees error:', error);
            throw error;
        }
    }

    /**
     * Get employee by ID
     */
    static async getEmployeeById(id: string): Promise<Employee | null> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Employee not found
                }
                console.error('Error fetching employee:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmployeeService.getEmployeeById error:', error);
            throw error;
        }
    }

    /**
     * Create a new employee
     */
    static async createEmployee(employeeData: EmployeeFormData): Promise<Employee> {
        try {
            // Generate unique employee code if not provided
            let employeeCode = employeeData.employee_code;
            if (!employeeCode) {
                employeeCode = await this.generateEmployeeCode(employeeData.role);
            }

            const { data, error } = await supabase
                .from('employees')
                .insert({
                    ...employeeData,
                    employee_code: employeeCode,
                    status: 'active' as EmployeeStatus
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating employee:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmployeeService.createEmployee error:', error);
            throw error;
        }
    }

    /**
     * Update employee information
     */
    static async updateEmployee(id: string, updates: Partial<EmployeeFormData>): Promise<Employee> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating employee:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmployeeService.updateEmployee error:', error);
            throw error;
        }
    }

    /**
     * Update employee status
     */
    static async updateEmployeeStatus(id: string, status: EmployeeStatus): Promise<Employee> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating employee status:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmployeeService.updateEmployeeStatus error:', error);
            throw error;
        }
    }

    /**
     * Delete employee (soft delete by setting status to terminated)
     */
    static async deleteEmployee(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('employees')
                .update({
                    status: 'terminated' as EmployeeStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('Error deleting employee:', error);
                throw error;
            }
        } catch (error) {
            console.error('EmployeeService.deleteEmployee error:', error);
            throw error;
        }
    }

    /**
     * Send invitation email to new employee
     */
    static async inviteEmployee(email: string, role: EmployeeRole, firstName: string): Promise<void> {
        try {
            // This would typically integrate with your email service
            // For now, we'll just create a basic invitation
            console.log(`Sending invitation to ${email} for role ${role}`);

            // In a real implementation, you might:
            // 1. Generate a secure invitation token
            // 2. Send email via SendGrid/similar service
            // 3. Create a pending invitation record

            // For now, we'll just log the invitation
            console.log(`Invitation sent to ${firstName} (${email}) for ${role} role`);
        } catch (error) {
            console.error('EmployeeService.inviteEmployee error:', error);
            throw error;
        }
    }

    /**
     * Get employee statistics
     */
    static async getEmployeeStats(): Promise<{
        total: number;
        active: number;
        guides: number;
        admins: number;
        managers: number;
        newThisMonth: number;
    }> {
        try {
            const { data: employees, error } = await supabase
                .from('employees')
                .select('role, status, created_at');

            if (error) {
                console.error('Error fetching employee stats:', error);
                throw error;
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: employees.length,
                active: employees.filter(e => e.status === 'active').length,
                guides: employees.filter(e => e.role === 'tour_guide' && e.status === 'active').length,
                admins: employees.filter(e => e.role === 'admin' && e.status === 'active').length,
                managers: employees.filter(e => e.role === 'manager' && e.status === 'active').length,
                newThisMonth: employees.filter(e =>
                    new Date(e.created_at) >= startOfMonth && e.status === 'active'
                ).length
            };

            return stats;
        } catch (error) {
            console.error('EmployeeService.getEmployeeStats error:', error);
            throw error;
        }
    }

    /**
     * Generate unique employee code
     */
    private static async generateEmployeeCode(role: EmployeeRole): Promise<string> {
        try {
            const prefix = {
                'admin': 'ADM',
                'manager': 'MGR',
                'tour_guide': 'TG',
                'support': 'SUP'
            }[role];

            // Get the highest existing employee code for this role
            const { data: employees, error } = await supabase
                .from('employees')
                .select('employee_code')
                .like('employee_code', `${prefix}%`)
                .order('employee_code', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error generating employee code:', error);
                throw error;
            }

            let nextNumber = 1;
            if (employees && employees.length > 0) {
                const lastCode = employees[0].employee_code;
                const lastNumber = parseInt(lastCode.replace(prefix, ''));
                nextNumber = lastNumber + 1;
            }

            return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating employee code:', error);
            return `${Date.now()}`; // Fallback to timestamp
        }
    }

    /**
     * Link employee to auth user
     */
    static async linkEmployeeToUser(employeeId: string, userId: string): Promise<Employee> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .update({
                    user_id: userId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', employeeId)
                .select()
                .single();

            if (error) {
                console.error('Error linking employee to user:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmployeeService.linkEmployeeToUser error:', error);
            throw error;
        }
    }

    /**
     * Get employees available for tour guide assignments
     */
    static async getAvailableGuides(): Promise<Employee[]> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('role', 'tour_guide')
                .eq('status', 'active')
                .order('first_name');

            if (error) {
                console.error('Error fetching available guides:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('EmployeeService.getAvailableGuides error:', error);
            throw error;
        }
    }
} 