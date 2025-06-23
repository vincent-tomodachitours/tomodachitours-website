import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function to sync completed bookings to Bokun
 * This runs asynchronously after payment completion
 */

interface BookingSyncRequest {
    bookingId: number;
}

interface BokunProduct {
    local_tour_type: string;
    bokun_product_id: string;
    bokun_variant_id?: string;
    is_active: boolean;
}

interface Booking {
    id: number;
    tour_type: string;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    adults: number;
    children: number;
    infants: number;
    status: string;
}

/**
 * Create HMAC-SHA1 signature for Bokun API authentication
 */
async function createBokunSignature(date: string, method: string, path: string, accessKey: string, secretKey: string): Promise<string> {
    const message = `${date}${accessKey}${method.toUpperCase()}${path}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = new Uint8Array(signature);

    // Convert to base64
    return btoa(String.fromCharCode(...signatureArray));
}

/**
 * Make authenticated request to Bokun API
 */
async function makeBokunRequest(endpoint: string, method: string, data: any = null): Promise<any> {
    const accessKey = Deno.env.get('BOKUN_PUBLIC_KEY');
    const secretKey = Deno.env.get('BOKUN_SECRET_KEY');
    const baseURL = Deno.env.get('BOKUN_API_URL') || 'https://api.bokun.io';

    console.log('🔧 Bokun API Config:', {
        accessKey: accessKey ? `${accessKey.substring(0, 8)}...` : 'MISSING',
        secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'MISSING',
        baseURL
    });

    if (!accessKey || !secretKey) {
        throw new Error('Bokun API credentials not configured');
    }

    const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    // Use Bokun's required date format: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const signature = await createBokunSignature(date, method, path, accessKey, secretKey);

    const headers = {
        'X-Bokun-Date': date,
        'X-Bokun-AccessKey': accessKey,
        'X-Bokun-Signature': signature,
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json'
    };

    const config: RequestInit = {
        method: method.toUpperCase(),
        headers
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.body = JSON.stringify(data);
    }

    const url = `${baseURL}${path}`;
    console.log(`🌐 Making Bokun API request: ${method} ${url}`);
    console.log('📋 Request headers:', headers);

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Bokun API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Bokun API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('✅ Bokun API response:', responseText);
    return responseText ? JSON.parse(responseText) : {};
}

/**
 * Record local booking (no Bokun booking creation - availability only)
 */
async function recordLocalBooking(booking: Booking, supabase: any): Promise<boolean> {
    console.log(`📝 Recording local booking ${booking.id} (Bokun availability only)`);

    // Simply mark the booking as complete - no Bokun booking creation needed
    const { data: updateData, error: updateError } = await supabase
        .from('bookings')
        .update({
            bokun_synced: true, // Mark as complete since we only use Bokun for availability
            external_source: 'local_only'
        })
        .eq('id', booking.id);

    if (updateError) {
        console.error('❌ Error updating bookings table:', updateError);
        throw new Error(`Booking update failed: ${updateError.message}`);
    }

    console.log(`✅ Local booking ${booking.id} recorded successfully`);
    return true;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        console.log('🚀 Booking recording function started');
        console.log('🔧 Environment check:', {
            BOKUN_PUBLIC_KEY: Deno.env.get('BOKUN_PUBLIC_KEY') ? 'SET' : 'MISSING',
            BOKUN_SECRET_KEY: Deno.env.get('BOKUN_SECRET_KEY') ? 'SET' : 'MISSING',
            BOKUN_API_URL: Deno.env.get('BOKUN_API_URL') || 'DEFAULT',
            SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING'
        });

        const requestData: BookingSyncRequest = await req.json();

        if (!requestData.bookingId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing bookingId' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`📋 Processing booking ID: ${requestData.bookingId}`);

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );

        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', requestData.bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('❌ Booking not found:', bookingError);
            return new Response(
                JSON.stringify({ success: false, error: 'Booking not found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('📋 Found booking:', {
            id: booking.id,
            tour_type: booking.tour_type,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            customer_name: booking.customer_name
        });

        // Check if booking is already processed
        if (booking.bokun_synced) {
            console.log('✅ Booking already processed');
            return new Response(
                JSON.stringify({ success: true, message: 'Booking already processed' }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Record local booking (no Bokun booking creation needed)
        const success = await recordLocalBooking(booking, supabase);

        return new Response(
            JSON.stringify({
                success,
                message: success ? 'Booking recorded successfully' : 'Booking recording failed'
            }),
            {
                status: success ? 200 : 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('❌ Error in booking recording function:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
}); 