import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { validateRequest, addSecurityHeaders, sanitizeOutput, notificationSchema } from './validation.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Validate request data
        const { data, error } = await validateRequest(req, notificationSchema)
        if (error) {
            return new Response(
                JSON.stringify({ success: false, error }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                }
            )
        }

        const { type, bookingId } = data!

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            throw new Error('Booking not found')
        }

        // Calculate total amount for confirmation emails
        let amount = 0;
        if (type === 'confirmation') {
            // Get tour price from tours table
            const { data: tour, error: tourError } = await supabase
                .from('tours')
                .select('base_price')
                .eq('type', booking.tour_type)
                .single()

            if (tourError || !tour) {
                console.error('Failed to fetch tour price:', tourError)
                throw new Error('Failed to fetch tour price')
            }

            amount = tour.base_price * (booking.adults + booking.children)
        } else {
            amount = booking.refund_amount || 0
        }

        console.log('Sending email notification:', {
            type,
            name: booking.customer_name,
            email: booking.customer_email,
            tourname: booking.tour_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            amount
        })

        // Send email notification
        const emailResponse = await fetch('https://script.google.com/macros/s/AKfycbx7ZkjQRaqafa2BdzRxCYBvX7rVwBYE12Zr6z4YQWi7y_RvInXqa4MCkm4MzWOdHNm9/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: Deno.env.get('APP_SCRIPT_EMAIL_KEY'),
                type,
                name: booking.customer_name,
                email: booking.customer_email,
                phone: booking.customer_phone,
                tour_type: booking.tour_type,
                date: booking.booking_date,
                time: booking.booking_time,
                adults: booking.adults,
                children: booking.children,
                infants: booking.infants || 0,
                amount,
                booking_id: bookingId
            })
        })

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text()
            console.error('Email service error:', errorText)
            throw new Error('Failed to send email notification')
        }

        const emailResult = await emailResponse.text()
        console.log('Email notification sent:', emailResult)

        return new Response(
            JSON.stringify({
                success: true,
                message: `${type} email sent successfully`
            }),
            {
                headers: addSecurityHeaders(new Headers({
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }))
            }
        )

    } catch (error) {
        console.error('Failed to send notification:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
}) 