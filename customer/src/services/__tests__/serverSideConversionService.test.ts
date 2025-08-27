import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase before importing the service
vi.mock('../../lib/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
            })),
        })),
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'mock-token' } }
            }),
        },
    },
}))

import { serverSideConversionService } from '../serverSideConversionService'
import { supabase } from '../../lib/supabase'

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
    process.env = {
        ...originalEnv,
        REACT_APP_SUPABASE_URL: 'https://test.supabase.co',
        REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
    }
})

afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
})

describe('ServerSideConversionService', () => {
    describe('validateAndFireConversion', () => {
        it('should successfully validate and fire conversion', async () => {
            const mockResponse = {
                success: true,
                booking_data: {
                    booking_id: 'test-booking-123',
                    payment_status: 'confirmed',
                    amount: 5000,
                    currency: 'JPY',
                },
                conversion_data: {
                    conversion_action: 'test-action',
                    conversion_value: 5000,
                    currency: 'JPY',
                    order_id: 'test-booking-123',
                },
            }

                ; (supabase.functions.invoke as any).mockResolvedValue({
                    data: mockResponse,
                    error: null,
                })

            const result = await serverSideConversionService.validateAndFireConversion('test-booking-123')

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockResponse)
            expect(supabase.functions.invoke).toHaveBeenCalledWith('google-ads-conversion', {
                body: { booking_id: 'test-booking-123' },
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        })

        it('should handle conversion failure', async () => {
            const mockResponse = {
                success: false,
                error: 'Booking validation failed',
            }

                ; (supabase.functions.invoke as any).mockResolvedValue({
                    data: mockResponse,
                    error: null,
                })

            const result = await serverSideConversionService.validateAndFireConversion('invalid-booking')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Booking validation failed')
        })

        it('should handle supabase function errors', async () => {
            ; (supabase.functions.invoke as any).mockResolvedValue({
                data: null,
                error: { message: 'Function execution failed' },
            })

            const result = await serverSideConversionService.validateAndFireConversion('test-booking-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Function execution failed')
        })
    })

    describe('logClientConversion', () => {
        it('should successfully log client conversion', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
                ; (supabase.from as any).mockReturnValue({ insert: mockInsert })

            await serverSideConversionService.logClientConversion('booking-123', true, {
                conversion_id: 'conv-123',
                value: 5000,
            })

            expect(supabase.from).toHaveBeenCalledWith('conversion_tracking_log')
            expect(mockInsert).toHaveBeenCalledWith({
                booking_id: 'booking-123',
                conversion_type: 'client',
                success: true,
                details: {
                    conversion_id: 'conv-123',
                    value: 5000,
                },
            })
        })

        it('should handle logging errors gracefully', async () => {
            const mockInsert = vi.fn().mockRejectedValue(new Error('Database error'))
                ; (supabase.from as any).mockReturnValue({ insert: mockInsert })

            // Should not throw error
            await expect(
                serverSideConversionService.logClientConversion('booking-123', false)
            ).resolves.toBeUndefined()
        })
    })

    describe('getConversionLogs', () => {
        it('should successfully fetch conversion logs', async () => {
            const mockLogs = [
                {
                    id: 'log-1',
                    booking_id: 'booking-123',
                    conversion_type: 'client',
                    success: true,
                    created_at: '2024-01-01T10:00:00Z',
                },
                {
                    id: 'log-2',
                    booking_id: 'booking-123',
                    conversion_type: 'server',
                    success: true,
                    created_at: '2024-01-01T10:00:30Z',
                },
            ]

            const mockOrder = vi.fn().mockResolvedValue({ data: mockLogs, error: null })
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
                ; (supabase.from as any).mockReturnValue({ select: mockSelect })

            const result = await serverSideConversionService.getConversionLogs('booking-123')

            expect(result).toEqual(mockLogs)
            expect(supabase.from).toHaveBeenCalledWith('conversion_tracking_log')
            expect(mockSelect).toHaveBeenCalledWith('*')
            expect(mockEq).toHaveBeenCalledWith('booking_id', 'booking-123')
            expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
        })

        it('should return empty array on error', async () => {
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
                ; (supabase.from as any).mockReturnValue({ select: mockSelect })

            const result = await serverSideConversionService.getConversionLogs('booking-123')

            expect(result).toEqual([])
        })
    })

    describe('checkConversionStatus', () => {
        it('should correctly identify conversion status', async () => {
            const mockLogs = [
                {
                    conversion_type: 'client',
                    success: true,
                },
                {
                    conversion_type: 'server',
                    success: false,
                },
                {
                    conversion_type: 'client',
                    success: false,
                },
            ]

            vi.spyOn(serverSideConversionService, 'getConversionLogs').mockResolvedValue(mockLogs)

            const result = await serverSideConversionService.checkConversionStatus('booking-123')

            expect(result.clientTracked).toBe(true)
            expect(result.serverTracked).toBe(false)
        })

        it('should handle errors gracefully', async () => {
            vi.spyOn(serverSideConversionService, 'getConversionLogs').mockRejectedValue(new Error('Database error'))

            const result = await serverSideConversionService.checkConversionStatus('booking-123')

            expect(result.clientTracked).toBe(false)
            expect(result.serverTracked).toBe(false)
        })
    })
})