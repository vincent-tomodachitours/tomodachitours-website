import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface BookingValidationData {
    booking_id: string
    payment_status: string
    amount: number
    currency: string
    customer_email?: string
    customer_phone?: string
    tour_id: string
    booking_date: string
    gclid?: string
    wbraid?: string
    gbraid?: string
}

interface ConversionReconciliationResult {
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

class GoogleAdsConversionService {
    private developerToken: string
    private clientId: string
    private clientSecret: string
    private refreshToken: string
    private customerId: string

    constructor() {
        this.developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || ''
        this.clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID') || ''
        this.clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') || ''
        this.refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN') || ''
        this.customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID') || ''
    }

    private async getAccessToken(): Promise<string> {
        const tokenUrl = 'https://oauth2.googleapis.com/token'
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.statusText}`)
        }

        const data = await response.json()
        return data.access_token
    }

    private hashData(data: string): string {
        // Simple SHA-256 implementation for hashing customer data
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(data.toLowerCase().trim())
        return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        })
    }

    async uploadConversion(conversionData: ConversionData): Promise<boolean> {
        try {
            const accessToken = await this.getAccessToken()

            // Prepare conversion upload request
            const conversionUpload = {
                conversions: [{
                    conversion_action: `customers/${this.customerId}/conversionActions/${conversionData.conversion_action}`,
                    conversion_value: conversionData.conversion_value,
                    currency_code: conversionData.currency,
                    order_id: conversionData.order_id,
                    conversion_date_time: conversionData.conversion_date_time || new Date().toISOString(),
                    ...(conversionData.gclid && { gclid: conversionData.gclid }),
                    ...(conversionData.wbraid && { wbraid: conversionData.wbraid }),
                    ...(conversionData.gbraid && { gbraid: conversionData.gbraid }),
                    ...(conversionData.user_identifiers && { user_identifiers: [conversionData.user_identifiers] }),
                }],
                partial_failure_enabled: true,
            }

            const uploadUrl = `https://googleads.googleapis.com/v14/customers/${this.customerId}:uploadConversions`

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': this.developerToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversionUpload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Google Ads API Error:', errorText)
                throw new Error(`Failed to upload conversion: ${response.statusText}`)
            }

            const result = await response.json()

            // Check for partial failures
            if (result.partial_failure_error) {
                console.error('Partial failure in conversion upload:', result.partial_failure_error)
                return false
            }

            console.log('Conversion uploaded successfully:', result)
            return true
        } catch (error) {
            console.error('Error uploading conversion:', error)
            return false
        }
    }
}

class BookingValidator {
    private supabase: any

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey)
    }

    async validateBookingSuccess(bookingId: string): Promise<BookingValidationData | null> {
        try {
            // Query the bookings table to validate successful payment
            const { data: booking, error } = await this.supabase
                .from('bookings')
                .select(`
          id,
          status,
          total_amount,
          currency,
          customer_email,
          customer_phone,
          tour_id,
          booking_date,
          payment_intent_id,
          gclid,
          wbraid,
          gbraid,
          created_at
        `)
                .eq('id', bookingId)
                .single()

            if (error || !booking) {
                console.error('Booking not found:', error)
                return null
            }

            // Validate that the booking is in a successful state
            if (booking.status !== 'confirmed' && booking.status !== 'paid') {
                console.log('Booking not in successful state:', booking.status)
                return null
            }

            return {
                booking_id: booking.id,
                payment_status: booking.status,
                amount: booking.total_amount,
                currency: booking.currency || 'JPY',
                customer_email: booking.customer_email,
                customer_phone: booking.customer_phone,
                tour_id: booking.tour_id,
                booking_date: booking.booking_date,
                gclid: booking.gclid,
                wbraid: booking.wbraid,
                gbraid: booking.gbraid,
            }
        } catch (error) {
            console.error('Error validating booking:', error)
            return null
        }
    }

    async logConversionAttempt(bookingId: string, conversionType: 'client' | 'server', success: boolean, details?: any): Promise<void> {
        try {
            await this.supabase
                .from('conversion_tracking_log')
                .insert({
                    booking_id: bookingId,
                    conversion_type: conversionType,
                    success: success,
                    details: details,
                    created_at: new Date().toISOString(),
                })
        } catch (error) {
            console.error('Error logging conversion attempt:', error)
        }
    }
}

class ConversionReconciliation {
    private supabase: any

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey)
    }

    async reconcileConversions(startDate: string, endDate: string): Promise<ConversionReconciliationResult> {
        try {
            // Get all bookings in the date range
            const { data: bookings, error: bookingsError } = await this.supabase
                .from('bookings')
                .select('id, status, created_at')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .in('status', ['confirmed', 'paid'])

            if (bookingsError) {
                throw new Error(`Error fetching bookings: ${bookingsError.message}`)
            }

            // Get conversion tracking logs for the same period
            const { data: conversionLogs, error: logsError } = await this.supabase
                .from('conversion_tracking_log')
                .select('booking_id, conversion_type, success')
                .gte('created_at', startDate)
                .lte('created_at', endDate)

            if (logsError) {
                throw new Error(`Error fetching conversion logs: ${logsError.message}`)
            }

            // Analyze discrepancies
            const discrepancies: Array<{
                booking_id: string
                client_tracked: boolean
                server_tracked: boolean
                issue: string
            }> = []

            let clientSideConversions = 0
            let serverSideConversions = 0
            let matchedConversions = 0

            for (const booking of bookings || []) {
                const clientLog = conversionLogs?.find(log =>
                    log.booking_id === booking.id &&
                    log.conversion_type === 'client' &&
                    log.success
                )
                const serverLog = conversionLogs?.find(log =>
                    log.booking_id === booking.id &&
                    log.conversion_type === 'server' &&
                    log.success
                )

                const clientTracked = !!clientLog
                const serverTracked = !!serverLog

                if (clientTracked) clientSideConversions++
                if (serverTracked) serverSideConversions++
                if (clientTracked && serverTracked) matchedConversions++

                // Identify discrepancies
                if (!clientTracked && !serverTracked) {
                    discrepancies.push({
                        booking_id: booking.id,
                        client_tracked: false,
                        server_tracked: false,
                        issue: 'No conversion tracking found for successful booking'
                    })
                } else if (clientTracked && !serverTracked) {
                    discrepancies.push({
                        booking_id: booking.id,
                        client_tracked: true,
                        server_tracked: false,
                        issue: 'Client-side tracked but server-side backup missing'
                    })
                } else if (!clientTracked && serverTracked) {
                    discrepancies.push({
                        booking_id: booking.id,
                        client_tracked: false,
                        server_tracked: true,
                        issue: 'Server-side backup fired but client-side tracking failed'
                    })
                }
            }

            const totalBookings = bookings?.length || 0
            const accuracyPercentage = totalBookings > 0
                ? Math.max(clientSideConversions, serverSideConversions) / totalBookings * 100
                : 0

            return {
                date_range: `${startDate} to ${endDate}`,
                client_side_conversions: clientSideConversions,
                server_side_conversions: serverSideConversions,
                matched_conversions: matchedConversions,
                discrepancies,
                accuracy_percentage: Math.round(accuracyPercentage * 100) / 100
            }
        } catch (error) {
            console.error('Error in conversion reconciliation:', error)
            throw error
        }
    }
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

        const url = new URL(req.url)
        const action = url.searchParams.get('action')

        const googleAdsService = new GoogleAdsConversionService()
        const bookingValidator = new BookingValidator(supabaseUrl, supabaseKey)
        const reconciliation = new ConversionReconciliation(supabaseUrl, supabaseKey)

        switch (action) {
            case 'validate_and_convert': {
                const { booking_id } = await req.json()

                // Validate booking success
                const bookingData = await bookingValidator.validateBookingSuccess(booking_id)
                if (!bookingData) {
                    return new Response(
                        JSON.stringify({ success: false, error: 'Booking validation failed' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                // Prepare conversion data
                const conversionData: ConversionData = {
                    conversion_action: Deno.env.get('GOOGLE_ADS_PURCHASE_CONVERSION_ACTION') || '',
                    conversion_value: bookingData.amount,
                    currency: bookingData.currency,
                    order_id: bookingData.booking_id,
                    gclid: bookingData.gclid,
                    wbraid: bookingData.wbraid,
                    gbraid: bookingData.gbraid,
                    conversion_date_time: new Date().toISOString(),
                }

                // Add enhanced conversion data if available
                if (bookingData.customer_email || bookingData.customer_phone) {
                    conversionData.user_identifiers = {}
                    if (bookingData.customer_email) {
                        conversionData.user_identifiers.hashed_email = await googleAdsService.hashData(bookingData.customer_email)
                    }
                    if (bookingData.customer_phone) {
                        conversionData.user_identifiers.hashed_phone_number = await googleAdsService.hashData(bookingData.customer_phone)
                    }
                }

                // Upload conversion
                const success = await googleAdsService.uploadConversion(conversionData)

                // Log the attempt
                await bookingValidator.logConversionAttempt(booking_id, 'server', success, conversionData)

                return new Response(
                    JSON.stringify({
                        success,
                        booking_data: bookingData,
                        conversion_data: conversionData
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'reconcile': {
                const { start_date, end_date } = await req.json()

                const result = await reconciliation.reconcileConversions(start_date, end_date)

                return new Response(
                    JSON.stringify(result),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'manual_conversion': {
                const conversionData = await req.json()

                const success = await googleAdsService.uploadConversion(conversionData)

                return new Response(
                    JSON.stringify({ success }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action parameter' }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                )
        }
    } catch (error) {
        console.error('Error in google-ads-conversion function:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})