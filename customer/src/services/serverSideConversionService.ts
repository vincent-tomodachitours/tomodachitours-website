import { supabase } from '../lib/supabase'

interface ConversionResult {
    success: boolean
    data?: any
    error?: string
}

interface ConversionStatus {
    clientTracked: boolean
    serverTracked: boolean
}

interface ConversionData {
    conversion_action: string
    conversion_value: number
    currency: string
    order_id: string
    gclid?: string
    wbraid?: string
    gbraid?: string
    conversion_date_time?: string
    user_identifiers?: {
        hashed_email?: string
        hashed_phone_number?: string
    }
}

interface ReconciliationResult {
    date_range: string
    client_side_conversions: number
    server_side_conversions: number
    matched_conversions: number
    discrepancies: Array<{
        booking_id: string
        client_tracked: boolean
        server_tracked: boolean
        issue: string
    }>
    accuracy_percentage: number
}

/**
 * Server-side conversion service for backup conversion tracking
 * Provides integration with the Supabase function for Google Ads conversion API
 */
class ServerSideConversionService {
    private functionUrl: string

    constructor() {
        this.functionUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/google-ads-conversion`
    }

    /**
     * Validate booking success and fire server-side conversion
     * @param bookingId - The booking ID to validate and convert
     * @returns Promise with conversion result
     */
    async validateAndFireConversion(bookingId: string): Promise<ConversionResult> {
        try {
            console.log('Firing server-side conversion for booking:', bookingId)

            const { data, error } = await supabase.functions.invoke('google-ads-conversion', {
                body: { booking_id: bookingId },
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (error) {
                console.error('Server-side conversion error:', error)
                return { success: false, error: error.message }
            }

            if (data.success) {
                console.log('Server-side conversion successful:', data)
                return { success: true, data }
            } else {
                console.error('Server-side conversion failed:', data.error)
                return { success: false, error: data.error }
            }
        } catch (error: any) {
            console.error('Error calling server-side conversion:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Fire server-side conversion with manual conversion data
     * @param conversionData - Manual conversion data
     * @returns Promise with conversion result
     */
    async fireManualConversion(conversionData: ConversionData): Promise<ConversionResult> {
        try {
            console.log('Firing manual server-side conversion:', conversionData)

            const response = await fetch(`${this.functionUrl}?action=manual_conversion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
                },
                body: JSON.stringify(conversionData),
            })

            const result = await response.json()

            if (result.success) {
                console.log('Manual server-side conversion successful')
                return { success: true }
            } else {
                console.error('Manual server-side conversion failed:', result.error)
                return { success: false, error: result.error }
            }
        } catch (error: any) {
            console.error('Error firing manual conversion:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Reconcile conversions between client-side and server-side tracking
     * @param startDate - Start date for reconciliation (ISO string)
     * @param endDate - End date for reconciliation (ISO string)
     * @returns Promise with reconciliation result
     */
    async reconcileConversions(startDate: string, endDate: string): Promise<ConversionResult> {
        try {
            console.log('Reconciling conversions from', startDate, 'to', endDate)

            const response = await fetch(`${this.functionUrl}?action=reconcile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                }),
            })

            const result = await response.json()

            if (response.ok) {
                console.log('Conversion reconciliation completed:', result)
                return { success: true, data: result }
            } else {
                console.error('Conversion reconciliation failed:', result.error)
                return { success: false, error: result.error }
            }
        } catch (error: any) {
            console.error('Error reconciling conversions:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Log a client-side conversion attempt for reconciliation
     * @param bookingId - The booking ID
     * @param success - Whether the conversion was successful
     * @param details - Additional details about the conversion
     */
    async logClientConversion(bookingId: string, success: boolean, details: any = {}): Promise<void> {
        try {
            await supabase
                .from('conversion_tracking_log')
                .insert({
                    booking_id: bookingId,
                    conversion_type: 'client',
                    success: success,
                    details: details,
                })

            console.log('Client conversion logged:', { bookingId, success })
        } catch (error) {
            console.error('Error logging client conversion:', error)
        }
    }

    /**
     * Get conversion tracking logs for a specific booking
     * @param bookingId - The booking ID
     * @returns Promise with array of conversion logs
     */
    async getConversionLogs(bookingId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('conversion_tracking_log')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching conversion logs:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error getting conversion logs:', error)
            return []
        }
    }

    /**
     * Check if a booking has successful conversion tracking
     * @param bookingId - The booking ID
     * @returns Promise with conversion status
     */
    async checkConversionStatus(bookingId: string): Promise<ConversionStatus> {
        try {
            const logs = await this.getConversionLogs(bookingId)

            const clientTracked = logs.some(log =>
                log.conversion_type === 'client' && log.success
            )
            const serverTracked = logs.some(log =>
                log.conversion_type === 'server' && log.success
            )

            return { clientTracked, serverTracked }
        } catch (error) {
            console.error('Error checking conversion status:', error)
            return { clientTracked: false, serverTracked: false }
        }
    }

    /**
     * Trigger server-side conversion backup after a delay (for failed client-side tracking)
     * @param bookingId - The booking ID
     * @param delayMs - Delay in milliseconds before firing backup (default: 30 seconds)
     */
    async scheduleBackupConversion(bookingId: string, delayMs: number = 30000): Promise<void> {
        setTimeout(async () => {
            try {
                // Check if client-side conversion was successful
                const { clientTracked } = await this.checkConversionStatus(bookingId)

                if (!clientTracked) {
                    console.log('Client-side conversion not detected, firing server-side backup for:', bookingId)
                    await this.validateAndFireConversion(bookingId)
                } else {
                    console.log('Client-side conversion detected, skipping server-side backup for:', bookingId)
                }
            } catch (error) {
                console.error('Error in scheduled backup conversion:', error)
            }
        }, delayMs)
    }
}

// Export singleton instance
export const serverSideConversionService = new ServerSideConversionService()
export default serverSideConversionService