import { BookingRequestAnalyticsService } from '../bookingRequestAnalyticsService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      in: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({ data: [], error: null }))
        })),
        eq: jest.fn(() => ({ data: [], error: null })),
        order: jest.fn(() => ({ data: [], error: null }))
      })),
      eq: jest.fn(() => ({
        in: jest.fn(() => ({ data: [], error: null }))
      }))
    }))
  }))
};

// Mock the supabase import
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('BookingRequestAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverviewMetrics', () => {
    it('should return default metrics when no data', async () => {
      const result = await BookingRequestAnalyticsService.getOverviewMetrics();
      
      expect(result).toEqual({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        conversionRate: 0,
        averageProcessingTime: 0,
        paymentFailureRate: 0,
        requestsExceedingTimeLimit: 0
      });
    });

    it('should calculate metrics correctly with sample data', async () => {
      const sampleData = [
        {
          status: 'CONFIRMED',
          request_submitted_at: '2025-01-01T10:00:00Z',
          admin_reviewed_at: '2025-01-01T12:00:00Z'
        },
        {
          status: 'PENDING_CONFIRMATION',
          request_submitted_at: '2025-01-01T10:00:00Z',
          admin_reviewed_at: null
        },
        {
          status: 'REJECTED',
          request_submitted_at: '2025-01-01T10:00:00Z',
          admin_reviewed_at: '2025-01-01T14:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            data: sampleData,
            error: null
          }))
        }))
      });

      const result = await BookingRequestAnalyticsService.getOverviewMetrics();
      
      expect(result.totalRequests).toBe(3);
      expect(result.pendingRequests).toBe(1);
      expect(result.approvedRequests).toBe(1);
      expect(result.rejectedRequests).toBe(1);
      expect(result.conversionRate).toBe(33.33333333333333); // 1/3 * 100
    });
  });

  describe('getTimeAlerts', () => {
    it('should return empty array when no overdue requests', async () => {
      const result = await BookingRequestAnalyticsService.getTimeAlerts();
      expect(result).toEqual([]);
    });

    it('should identify overdue requests correctly', async () => {
      const now = new Date();
      const overdueDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      const criticalDate = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50 hours ago

      const sampleData = [
        {
          id: 1,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          tour_type: 'uji-tour',
          booking_date: '2025-02-01',
          request_submitted_at: overdueDate.toISOString()
        },
        {
          id: 2,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          tour_type: 'uji-walking-tour',
          booking_date: '2025-02-02',
          request_submitted_at: criticalDate.toISOString()
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: sampleData,
              error: null
            }))
          }))
        }))
      });

      const result = await BookingRequestAnalyticsService.getTimeAlerts();
      
      expect(result).toHaveLength(2);
      expect(result[0].severity).toBe('critical'); // Most overdue first
      expect(result[1].severity).toBe('warning');
      expect(result[0].customer_name).toBe('Jane Smith');
      expect(result[1].customer_name).toBe('John Doe');
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard data', async () => {
      const result = await BookingRequestAnalyticsService.getDashboardMetrics();
      
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('conversionTrends');
      expect(result).toHaveProperty('paymentFailures');
      expect(result).toHaveProperty('rejectionAnalysis');
      expect(result).toHaveProperty('timeAnalysis');
    });
  });
});