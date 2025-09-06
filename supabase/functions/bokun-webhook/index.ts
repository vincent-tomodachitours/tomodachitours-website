import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BokunWebhookEvent {
    type: string;
    data: {
        bookingId?: string;
        productId?: string;
        date?: string;
        availability?: Array<{
            time: string;
            availableSpots: number;
        }>;
        booking?: {
            id: string;
            productId: string;
            date: string;
            time: string;
            participants: number;
            status: string;
        };
    };
    timestamp: string;
}

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Verify webhook signature
        const signature = req.headers.get('x-bokun-signature');
        const payload = await req.text();

        if (!verifyWebhookSignature(payload, signature)) {
            console.error('Invalid webhook signature');
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const event: BokunWebhookEvent = JSON.parse(payload);
        console.log('Received Bokun webhook:', event.type);

        // Process different event types
        switch (event.type) {
            case 'booking.created':
                await handleExternalBooking(event.data);
                break;
            case 'booking.cancelled':
                await handleExternalCancellation(event.data);
                break;
            case 'booking.modified':
                await handleExternalBookingModification(event.data);
                break;
            case 'availability.updated':
                await handleAvailabilityUpdate(event.data);
                break;
            default:
                console.log(`Unhandled webhook event type: ${event.type}`);
        }

        return new Response(
            JSON.stringify({ success: true, processed: event.type }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Bokun webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: 'Processing failed', details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

/**
 * Verify webhook signature using HMAC
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
    if (!signature) {
        console.warn('No signature provided for webhook verification');
        return false;
    }

    const webhookSecret = Deno.env.get('BOKUN_WEBHOOK_SECRET');
    if (!webhookSecret) {
        console.error('BOKUN_WEBHOOK_SECRET not configured');
        return false;
    }

    try {
        const encoder = new TextEncoder();
        const key = encoder.encode(webhookSecret);
        const data = encoder.encode(payload);

        return crypto.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        ).then(cryptoKey =>
            crypto.subtle.sign("HMAC", cryptoKey, data)
        ).then(signatureBuffer => {
            const computedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Remove 'sha256=' prefix if present
            const cleanSignature = signature.startsWith('sha256=')
                ? signature.slice(7)
                : signature;

            return computedSignature === cleanSignature;
        }).catch(error => {
            console.error('Signature verification error:', error);
            return false;
        });
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Handle external booking created in Bokun (from OTAs like Viator)
 */
async function handleExternalBooking(data: any) {
    try {
        if (!data.booking) {
            console.error('No booking data in external booking event');
            return;
        }

        const booking = data.booking;
        console.log(`Processing external booking: ${booking.id}`);

        // Find the local tour type for this Bokun product
        const { data: bokunProduct, error: productError } = await supabase
            .from('bokun_products')
            .select('local_tour_type')
            .eq('bokun_product_id', booking.productId)
            .single();

        if (productError || !bokunProduct) {
            console.error('Unknown Bokun product ID:', booking.productId);
            return;
        }

        // Create external booking record (for tracking purposes)
        const { error: bookingError } = await supabase
            .from('bookings')
            .insert({
                tour_type: bokunProduct.local_tour_type,
                booking_date: booking.date,
                booking_time: booking.time,
                total_participants: booking.participants,
                adults: booking.participants, // Assuming all adults for external bookings
                children: 0,
                infants: 0,
                customer_name: 'External Booking',
                customer_email: 'external@bokun.com',
                status: 'CONFIRMED',
                external_source: 'bokun',
                bokun_booking_id: booking.id,
                bokun_synced: true
            });

        if (bookingError) {
            console.error('Error creating external booking record:', bookingError);
            return;
        }

        // Invalidate availability cache
        await invalidateAvailabilityCache(bokunProduct.local_tour_type, booking.date);

        console.log(`External booking processed successfully: ${booking.id}`);
    } catch (error) {
        console.error('Error handling external booking:', error);
    }
}

/**
 * Handle external booking cancellation
 */
async function handleExternalCancellation(data: any) {
    try {
        if (!data.bookingId) {
            console.error('No booking ID in cancellation event');
            return;
        }

        console.log(`Processing external cancellation: ${data.bookingId}`);

        // Find and update the local booking record
        const { data: booking, error: findError } = await supabase
            .from('bookings')
            .select('*')
            .eq('bokun_booking_id', data.bookingId)
            .single();

        if (findError || !booking) {
            console.error('External booking not found for cancellation:', data.bookingId);
            return;
        }

        // Update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'CANCELLED' })
            .eq('bokun_booking_id', data.bookingId);

        if (updateError) {
            console.error('Error updating cancelled booking:', updateError);
            return;
        }

        // Invalidate availability cache
        await invalidateAvailabilityCache(booking.tour_type, booking.booking_date);

        console.log(`External cancellation processed successfully: ${data.bookingId}`);
    } catch (error) {
        console.error('Error handling external cancellation:', error);
    }
}

/**
 * Handle external booking modification
 */
async function handleExternalBookingModification(data: any) {
    try {
        console.log(`Processing external booking modification: ${data.bookingId}`);

        // For now, treat modifications as cancellation + new booking
        // In a more sophisticated implementation, you could handle specific changes
        await handleExternalCancellation(data);
        await handleExternalBooking(data);

    } catch (error) {
        console.error('Error handling external booking modification:', error);
    }
}

/**
 * Handle availability update from Bokun
 */
async function handleAvailabilityUpdate(data: any) {
    try {
        if (!data.productId || !data.date) {
            console.error('Invalid availability update data');
            return;
        }

        console.log(`Processing availability update for product: ${data.productId}, date: ${data.date}`);

        // Find the local tour type
        const { data: bokunProduct, error: productError } = await supabase
            .from('bokun_products')
            .select('local_tour_type')
            .eq('bokun_product_id', data.productId)
            .single();

        if (productError || !bokunProduct) {
            console.error('Unknown Bokun product ID in availability update:', data.productId);
            return;
        }

        // Update availability cache if availability data is provided
        if (data.availability && Array.isArray(data.availability)) {
            const cacheEntries = data.availability.map((slot: any) => ({
                bokun_product_id: data.productId,
                date: data.date,
                time_slot: slot.time,
                available_spots: slot.availableSpots || 0,
                cached_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            }));

            const { error: cacheError } = await supabase
                .from('bokun_availability_cache')
                .upsert(cacheEntries, {
                    onConflict: 'bokun_product_id,date,time_slot'
                });

            if (cacheError) {
                console.error('Error updating availability cache:', cacheError);
            } else {
                console.log(`Updated availability cache for ${data.productId} on ${data.date}`);
            }
        } else {
            // If no specific availability data, just invalidate cache to force refresh
            await invalidateAvailabilityCache(bokunProduct.local_tour_type, data.date);
        }

    } catch (error) {
        console.error('Error handling availability update:', error);
    }
}

/**
 * Invalidate availability cache for a tour type and date
 */
async function invalidateAvailabilityCache(tourType: string, date: string) {
    try {
        // Get the Bokun product ID for this tour type
        const { data: bokunProduct, error: productError } = await supabase
            .from('bokun_products')
            .select('bokun_product_id')
            .eq('local_tour_type', tourType)
            .single();

        if (productError || !bokunProduct) {
            console.error('Cannot invalidate cache - no Bokun product mapping for:', tourType);
            return;
        }

        // Delete cache entries
        const { error: deleteError } = await supabase
            .from('bokun_availability_cache')
            .delete()
            .eq('bokun_product_id', bokunProduct.bokun_product_id)
            .eq('date', date);

        if (deleteError) {
            console.error('Error invalidating availability cache:', deleteError);
        } else {
            console.log(`Availability cache invalidated for ${tourType} on ${date}`);
        }
    } catch (error) {
        console.error('Error in invalidateAvailabilityCache:', error);
    }
} 