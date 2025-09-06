import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BokunBooking {
    id: string;
    product: { id: string };
    startDate: number;
    fields: {
        startTimeStr: string;
        totalParticipants: number;
        priceCategoryBookings?: Array<{
            pricingCategoryId: number;
            pricingCategory: {
                id: number;
                title: string;
                ticketCategory: 'ADULT' | 'CHILD' | 'INFANT';
                minAge?: number;
                maxAge?: number;
                fullTitle?: string;
            };
            quantity: number;
            bookedTitle: string;
        }>;
    };
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
    };
    creationDate: number;
    status: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const { method } = req

        console.log('🔄 Bokun cache sync called:', method, url.pathname)

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get Bokun credentials
        const BOKUN_PUBLIC_KEY = Deno.env.get('BOKUN_PUBLIC_KEY')
        const BOKUN_SECRET_KEY = Deno.env.get('BOKUN_SECRET_KEY')

        if (!BOKUN_PUBLIC_KEY || !BOKUN_SECRET_KEY) {
            throw new Error('Bokun credentials not configured')
        }

        // Function to create HMAC-SHA1 signature
        async function createSignature(method: string, path: string, timestamp: string): Promise<string> {
            const message = `${timestamp}${BOKUN_PUBLIC_KEY}${method.toUpperCase()}${path}`
            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(BOKUN_SECRET_KEY),
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
            )
            const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
            return btoa(String.fromCharCode(...new Uint8Array(signature)))
        }

        // Function to fetch all bookings for a product with efficient pagination
        async function fetchAllBokunBookings(productId: string, startDate: string, endDate: string): Promise<BokunBooking[]> {
            const allBookings: BokunBooking[] = []
            let page = 1
            let hasMorePages = true
            const maxPages = 20 // Safety limit

            console.log(`📥 Starting sync for product ${productId} (${startDate} to ${endDate})`)

            while (hasMorePages && page <= maxPages) {
                try {
                    const bokunPath = `/booking.json/product-booking-search`

                    const requestBody = {
                        productId: productId,
                        startDate: startDate,
                        endDate: endDate,
                        page: page,
                        size: 100,
                        status: "CONFIRMED"  // Only fetch confirmed bookings
                    }

                    const now = new Date()
                    const year = now.getUTCFullYear()
                    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
                    const day = String(now.getUTCDate()).padStart(2, '0')
                    const hours = String(now.getUTCHours()).padStart(2, '0')
                    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
                    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
                    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

                    const signature = await createSignature('POST', bokunPath, timestamp)
                    const bokunBaseURL = Deno.env.get('BOKUN_API_URL') || 'https://api.bokun.io'

                    const response = await fetch(`${bokunBaseURL}${bokunPath}`, {
                        method: 'POST',
                        headers: {
                            'X-Bokun-Date': timestamp,
                            'X-Bokun-AccessKey': BOKUN_PUBLIC_KEY,
                            'X-Bokun-Signature': signature,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    })

                    if (!response.ok) {
                        console.error(`❌ Bokun API error on page ${page}:`, response.status)
                        break
                    }

                    const data = await response.json()

                    if (data.results && Array.isArray(data.results)) {
                        allBookings.push(...data.results)
                        console.log(`📄 Page ${page}: +${data.results.length} bookings (total: ${allBookings.length})`)

                        // Check if we have more pages
                        if (data.results.length === 0 || (data.totalHits && allBookings.length >= data.totalHits)) {
                            hasMorePages = false
                        } else {
                            page++
                        }
                    } else {
                        hasMorePages = false
                    }

                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 100))

                } catch (error) {
                    console.error(`❌ Error fetching page ${page}:`, error)
                    break
                }
            }

            console.log(`✅ Fetched ${allBookings.length} total bookings for product ${productId}`)
            return allBookings
        }

        // Function to transform and batch insert bookings with correct tour type mapping
        async function cacheBookings(productId: string, localTourType: string, bookings: BokunBooking[], productMapping: Map<string, string>) {
            if (bookings.length === 0) return 0

            console.log(`💾 Caching ${bookings.length} bookings for ${localTourType}...`)

            // Transform bookings to cache format with CORRECT tour type mapping
            const cacheData = bookings.map(booking => {
                // Get the actual product ID from this specific booking
                const bokunProductId = booking.product?.id?.toString();
                const correctTourType = productMapping.get(bokunProductId) || localTourType;

                if (!bokunProductId) {
                    console.warn('No product ID in booking:', booking.id, 'using fallback tour type:', localTourType);
                } else if (correctTourType !== localTourType) {
                    console.log(`📍 Corrected tour type for booking ${booking.id}: ${bokunProductId} -> ${correctTourType} (was going to be ${localTourType})`);
                }

                // Only process confirmed bookings
                if (booking.status && booking.status.toLowerCase() !== 'confirmed') {
                    console.log(`Skipping non-confirmed booking ${booking.id} with status: ${booking.status}`);
                    return null;
                }

                // Extract participant breakdown from Bokun booking
                // Bokun stores participant data in fields.priceCategoryBookings array
                const priceCategoryBookings = booking.fields?.priceCategoryBookings || [];

                let adults = 0;
                let children = 0;
                let infants = 0;

                // Count participants by category
                priceCategoryBookings.forEach((bookingCategory: any) => {
                    const ticketCategory = bookingCategory.pricingCategory?.ticketCategory;
                    const quantity = bookingCategory.quantity || 1;

                    switch (ticketCategory) {
                        case 'ADULT':
                            adults += quantity;
                            break;
                        case 'CHILD':
                            children += quantity;
                            break;
                        case 'INFANT':
                            infants += quantity;
                            break;
                        default:
                            // If category is unknown, assume adult
                            console.warn('Unknown ticket category:', ticketCategory, 'treating as adult');
                            adults += quantity;
                    }
                });

                const totalParticipants = adults + children + infants || booking.fields?.totalParticipants || 1;

                return {
                    bokun_booking_id: booking.id,
                    product_id: bokunProductId || productId,
                    booking_date: new Date(booking.startDate).toISOString().split('T')[0],
                    booking_time: booking.fields?.startTimeStr || '18:00',
                    status: booking.status || 'CONFIRMED', // Use actual Bokun status
                    customer_name: `${booking.customer?.firstName || 'External'} ${booking.customer?.lastName || 'Booking'}`,
                    customer_email: booking.customer?.email || 'external@bokun.com',
                    customer_phone: booking.customer?.phoneNumber,
                    adults: adults,
                    children: children,
                    infants: infants,
                    total_participants: totalParticipants,
                    tour_type: correctTourType,
                    tour_name: correctTourType,
                    total_amount: 0,
                    currency: 'USD',
                    confirmation_code: `BOKUN-${booking.id}`,
                    external_source: 'bokun',
                    raw_bokun_data: booking,
                    last_synced: new Date().toISOString()
                }
            }).filter(booking => booking !== null) // Remove skipped bookings

            // Log potential duplicates for debugging
            const duplicateCheck = new Map();
            cacheData.forEach((booking, index) => {
                const key = `${booking.customer_email}-${booking.booking_date}-${booking.booking_time}`;
                if (duplicateCheck.has(key)) {
                    console.warn(`⚠️  Potential duplicate found:`, {
                        existing: duplicateCheck.get(key),
                        current: {
                            bokun_booking_id: booking.bokun_booking_id,
                            customer_email: booking.customer_email,
                            booking_date: booking.booking_date,
                            booking_time: booking.booking_time
                        }
                    });
                } else {
                    duplicateCheck.set(key, {
                        index,
                        bokun_booking_id: booking.bokun_booking_id,
                        customer_email: booking.customer_email,
                        booking_date: booking.booking_date,
                        booking_time: booking.booking_time
                    });
                }
            });

            // Additional deduplication by bokun_booking_id (in case Bokun API returns duplicates)
            const seenBookingIds = new Set();
            const deduplicatedData = cacheData.filter(booking => {
                if (seenBookingIds.has(booking.bokun_booking_id)) {
                    console.warn(`⚠️  Duplicate Bokun booking ID detected: ${booking.bokun_booking_id}`);
                    return false;
                }
                seenBookingIds.add(booking.bokun_booking_id);
                return true;
            });

            if (deduplicatedData.length !== cacheData.length) {
                console.log(`🔄 Removed ${cacheData.length - deduplicatedData.length} duplicate booking IDs`);
            }

            // Batch upsert (insert or update) bookings
            const { error } = await supabase
                .from('bokun_bookings_cache')
                .upsert(deduplicatedData, {
                    onConflict: 'bokun_booking_id',
                    ignoreDuplicates: false
                })

            if (error) {
                console.error('❌ Error caching bookings:', error)
                throw error
            }

            console.log(`✅ Successfully cached ${deduplicatedData.length} bookings`)
            return deduplicatedData.length
        }

        // Main sync logic
        if (url.pathname.includes('/sync-all')) {
            console.log('🚀 Starting full cache sync for all products')

            // Get all active products
            const { data: products, error: productsError } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('is_active', true)

            if (productsError || !products || products.length === 0) {
                return new Response(JSON.stringify({
                    error: 'No active Bokun products found',
                    success: false
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Create a mapping from Bokun product ID to local tour type
            const productMapping = new Map<string, string>();
            products.forEach(product => {
                productMapping.set(product.bokun_product_id, product.local_tour_type);
            });
            console.log('🗺️ Product mapping created:', Array.from(productMapping.entries()));

            // Get date range (default: 6 months back, 3 months forward)
            const startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 6)
            const endDate = new Date()
            endDate.setMonth(endDate.getMonth() + 3)

            const startDateStr = startDate.toISOString().split('T')[0]
            const endDateStr = endDate.toISOString().split('T')[0]

            console.log(`📅 Sync date range: ${startDateStr} to ${endDateStr}`)

            let totalCached = 0
            const results = []
            const allBokunBookings: BokunBooking[] = []

            // First, fetch all bookings from all products (without caching yet)
            const concurrencyLimit = 2 // Process 2 products at once to avoid overwhelming APIs
            for (let i = 0; i < products.length; i += concurrencyLimit) {
                const batch = products.slice(i, i + concurrencyLimit)

                const batchPromises = batch.map(async (product) => {
                    try {
                        // Update sync status
                        await supabase
                            .from('bokun_cache_metadata')
                            .upsert({
                                product_id: product.bokun_product_id,
                                sync_status: 'syncing',
                                sync_error: null
                            })

                        // Fetch all bookings for this product
                        const bookings = await fetchAllBokunBookings(
                            product.bokun_product_id,
                            startDateStr,
                            endDateStr
                        )

                        // Add to collection for batch processing (don't cache yet)
                        allBokunBookings.push(...bookings)

                        // Update sync metadata
                        await supabase
                            .from('bokun_cache_metadata')
                            .upsert({
                                product_id: product.bokun_product_id,
                                last_full_sync: new Date().toISOString(),
                                total_bookings_cached: bookings.length, // Will update with actual count later
                                sync_status: 'completed',
                                sync_error: null
                            })

                        return {
                            product_id: product.bokun_product_id,
                            tour_type: product.local_tour_type,
                            bookings_fetched: bookings.length,
                            success: true
                        }

                    } catch (error) {
                        console.error(`❌ Error syncing product ${product.bokun_product_id}:`, error)

                        // Update error status
                        await supabase
                            .from('bokun_cache_metadata')
                            .upsert({
                                product_id: product.bokun_product_id,
                                sync_status: 'error',
                                sync_error: error.message
                            })

                        return {
                            product_id: product.bokun_product_id,
                            tour_type: product.local_tour_type,
                            error: error.message,
                            success: false
                        }
                    }
                })

                const batchResults = await Promise.all(batchPromises)
                results.push(...batchResults)

                console.log(`✅ Completed fetch batch ${Math.ceil((i + concurrencyLimit) / concurrencyLimit)} of ${Math.ceil(products.length / concurrencyLimit)}`)
            }

            // Now deduplicate and cache all bookings in one operation
            console.log(`🔄 Deduplicating ${allBokunBookings.length} total bookings...`)

            // Deduplicate bookings by bokun_booking_id
            const uniqueBookingsMap = new Map<string, BokunBooking>()
            let duplicateCount = 0

            allBokunBookings.forEach(booking => {
                if (uniqueBookingsMap.has(booking.id)) {
                    duplicateCount++
                    console.log(`🚫 Skipping duplicate booking: ${booking.id} (${booking.customer?.firstName} ${booking.customer?.lastName})`)
                } else {
                    uniqueBookingsMap.set(booking.id, booking)
                }
            })

            const uniqueBookings = Array.from(uniqueBookingsMap.values())
            console.log(`✅ Removed ${duplicateCount} duplicates. Caching ${uniqueBookings.length} unique bookings.`)

            // Cache all unique bookings in one batch operation
            if (uniqueBookings.length > 0) {
                totalCached = await cacheBookings(
                    'multiple', // placeholder since we're processing multiple products
                    'MIXED', // placeholder since we have mixed tour types
                    uniqueBookings,
                    productMapping
                )
            }

            console.log(`🎉 Full sync completed! Total bookings cached: ${totalCached}`)

            return new Response(JSON.stringify({
                success: true,
                total_bookings_cached: totalCached,
                products_processed: products.length,
                date_range: { start: startDateStr, end: endDateStr },
                results: results
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Health check endpoint
        if (url.pathname.includes('/health')) {
            const { data: metadata } = await supabase
                .from('bokun_cache_metadata')
                .select('*')

            const { count } = await supabase
                .from('bokun_bookings_cache')
                .select('*', { count: 'exact', head: true })

            return new Response(JSON.stringify({
                success: true,
                cache_health: {
                    total_cached_bookings: count || 0,
                    products_metadata: metadata || []
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({
            error: 'Invalid endpoint. Use /sync-all or /health'
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('❌ Cache sync error:', error)
        return new Response(JSON.stringify({
            error: error.message,
            success: false
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}) 