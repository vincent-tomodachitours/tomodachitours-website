// Setup type definitions for built-in Supabase Runtime APIs
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        const url = new URL(req.url)
        const { method, pathname } = url

        console.log('Bokun proxy called:', method, pathname)

        // Get Bokun credentials from environment (server-side only)
        const BOKUN_PUBLIC_KEY = Deno.env.get('BOKUN_PUBLIC_KEY')
        const BOKUN_SECRET_KEY = Deno.env.get('BOKUN_SECRET_KEY')

        if (!BOKUN_PUBLIC_KEY || !BOKUN_SECRET_KEY) {
            throw new Error('Bokun credentials not configured on server')
        }

        // Create HMAC-SHA1 signature (Bokun format)
        async function createSignature(method: string, path: string, timestamp: string): Promise<string> {
            // Bokun signature format: date + accessKey + method + path
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

        // Proxy different Bokun endpoints
        if (pathname.includes('/availabilities')) {
            // GET /availabilities?activityId=15221&startDate=2025-06-26&endDate=2025-06-26
            const activityId = url.searchParams.get('activityId')
            let startDate = url.searchParams.get('startDate')
            let endDate = url.searchParams.get('endDate')

            if (!activityId || !startDate || !endDate) {
                return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Format dates to YYYY-MM-DD (remove timestamp if present)
            const formatDate = (date: string) => {
                if (date.includes('T')) {
                    return date.split('T')[0]
                }
                return date
            }

            startDate = formatDate(startDate)
            endDate = formatDate(endDate)

            console.log('Formatted dates for Bokun API:', { activityId, startDate, endDate })

            // Make request to Bokun API
            const bokunPath = `/activity.json/${activityId}/availabilities?start=${startDate}&end=${endDate}&currency=USD`

            // Create Bokun-compatible timestamp (YYYY-MM-DD HH:MM:SS format)
            const now = new Date()
            const year = now.getUTCFullYear()
            const month = String(now.getUTCMonth() + 1).padStart(2, '0')
            const day = String(now.getUTCDate()).padStart(2, '0')
            const hours = String(now.getUTCHours()).padStart(2, '0')
            const minutes = String(now.getUTCMinutes()).padStart(2, '0')
            const seconds = String(now.getUTCSeconds()).padStart(2, '0')
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

            console.log('Bokun timestamp format:', timestamp)

            const signature = await createSignature('GET', bokunPath, timestamp)

            const bokunBaseURL = Deno.env.get('BOKUN_API_URL') || 'https://api.bokun.io'
            const bokunResponse = await fetch(`${bokunBaseURL}${bokunPath}`, {
                method: 'GET',
                headers: {
                    'X-Bokun-Date': timestamp,
                    'X-Bokun-AccessKey': BOKUN_PUBLIC_KEY,
                    'X-Bokun-Signature': signature,
                    'Accept': 'application/json'
                }
            })

            console.log('Bokun availability API response status:', bokunResponse.status)

            if (!bokunResponse.ok) {
                const errorText = await bokunResponse.text()
                console.error('Bokun availability API error:', {
                    status: bokunResponse.status,
                    statusText: bokunResponse.statusText,
                    error: errorText,
                    url: `${bokunBaseURL}${bokunPath}`,
                    headers: {
                        'X-Bokun-Date': timestamp,
                        'X-Bokun-AccessKey': BOKUN_PUBLIC_KEY,
                        'X-Bokun-Signature': 'REDACTED'
                    }
                })
                return new Response(JSON.stringify({ error: `Bokun API error: ${bokunResponse.status} ${errorText}` }), {
                    status: bokunResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const data = await bokunResponse.json()

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Get product details
        if (pathname.includes('/product/')) {
            // GET /product/{productId}
            const pathParts = pathname.split('/')
            const productId = pathParts[pathParts.length - 1]

            if (!productId) {
                return new Response(JSON.stringify({ error: 'Missing product ID' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            console.log('Fetching Bokun product details for:', productId)

            const bokunPath = `/activity.json/${productId}`

            const now = new Date()
            const year = now.getUTCFullYear()
            const month = String(now.getUTCMonth() + 1).padStart(2, '0')
            const day = String(now.getUTCDate()).padStart(2, '0')
            const hours = String(now.getUTCHours()).padStart(2, '0')
            const minutes = String(now.getUTCMinutes()).padStart(2, '0')
            const seconds = String(now.getUTCSeconds()).padStart(2, '0')
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

            const signature = await createSignature('GET', bokunPath, timestamp)

            const bokunBaseURL = Deno.env.get('BOKUN_API_URL') || 'https://api.bokun.io'
            const bokunResponse = await fetch(`${bokunBaseURL}${bokunPath}`, {
                method: 'GET',
                headers: {
                    'X-Bokun-Date': timestamp,
                    'X-Bokun-AccessKey': BOKUN_PUBLIC_KEY,
                    'X-Bokun-Signature': signature,
                    'Accept': 'application/json'
                }
            })

            console.log('Bokun product API response status:', bokunResponse.status)

            if (!bokunResponse.ok) {
                const errorText = await bokunResponse.text()
                console.error('Bokun product API error:', {
                    status: bokunResponse.status,
                    error: errorText
                })
                return new Response(JSON.stringify({ error: `Bokun API error: ${bokunResponse.status}` }), {
                    status: bokunResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const data = await bokunResponse.json()

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Get bookings for a specific product and date range
        if (pathname.includes('/bookings')) {
            const productId = url.searchParams.get('productId')
            let startDate = url.searchParams.get('startDate')
            let endDate = url.searchParams.get('endDate')

            console.log('Bokun proxy bookings endpoint called with:', {
                pathname,
                productId,
                startDate,
                endDate,
                searchParams: url.searchParams.toString()
            })

            if (!productId || !startDate || !endDate) {
                console.log('Missing parameters detected:', {
                    productId: !!productId,
                    startDate: !!startDate,
                    endDate: !!endDate
                })
                return new Response(JSON.stringify({ error: 'Missing required parameters: productId, startDate, endDate' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Format dates to YYYY-MM-DD
            const formatDate = (date: string) => {
                if (date.includes('T')) {
                    return date.split('T')[0]
                }
                return date
            }

            startDate = formatDate(startDate)
            endDate = formatDate(endDate)

            console.log('Fetching ALL Bokun bookings for product (with pagination):', { productId, startDate, endDate })

            // Function to fetch a single page of bookings
            async function fetchBokunPage(page: number = 1): Promise<any> {
                const bokunPath = `/booking.json/product-booking-search`

                // Create request body with pagination
                const requestBody = {
                    productId: productId,
                    startDate: startDate,
                    endDate: endDate,
                    page: page,
                    size: 100 // Request larger page size to reduce number of requests
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
                    const errorText = await response.text()
                    console.error(`Bokun page ${page} API error:`, {
                        status: response.status,
                        error: errorText
                    })
                    throw new Error(`Bokun API error: ${response.status}`)
                }

                return await response.json()
            }

            try {
                // Fetch all pages of bookings
                const allBookings: any[] = []
                let page = 1
                let totalHits = 0
                let hasMorePages = true

                while (hasMorePages) {
                    console.log(`Fetching Bokun bookings page ${page} for product ${productId}`)

                    const pageData = await fetchBokunPage(page)

                    if (page === 1) {
                        totalHits = pageData.totalHits || 0
                        console.log(`Total bookings available: ${totalHits}`)
                    }

                    if (pageData.results && Array.isArray(pageData.results)) {
                        allBookings.push(...pageData.results)
                        console.log(`Page ${page}: fetched ${pageData.results.length} bookings (total so far: ${allBookings.length})`)

                        // Check if we have more pages
                        if (pageData.results.length === 0 || allBookings.length >= totalHits) {
                            hasMorePages = false
                        } else {
                            page++
                        }
                    } else {
                        console.log(`Page ${page}: No results array found, stopping pagination`)
                        hasMorePages = false
                    }

                    // Safety check to prevent infinite loops
                    if (page > 50) {
                        console.warn('Reached maximum page limit (50), stopping pagination')
                        break
                    }
                }

                console.log(`✅ Successfully fetched ${allBookings.length} total bookings from ${page} pages`)

                // Return all bookings in the same format as the original API
                const response = {
                    tookInMillis: Date.now() % 1000, // Approximate timing
                    totalHits: allBookings.length,
                    results: allBookings,
                    paginationInfo: {
                        totalPages: page,
                        totalBookingsFetched: allBookings.length,
                        originalTotalHits: totalHits
                    }
                }

                return new Response(JSON.stringify(response), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })

            } catch (error) {
                console.error('Error fetching paginated Bokun bookings:', error)

                // Fallback: try to fetch just the first page
                try {
                    const firstPageData = await fetchBokunPage(1)
                    console.log('Fallback: returning first page only')
                    return new Response(JSON.stringify(firstPageData), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError)
                    return new Response(JSON.stringify({ error: 'Failed to fetch bookings', results: [] }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                }
            }
        }

        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Bokun proxy error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}) 