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
        if (pathname.includes('/availabilities') || req.method === 'GET') {
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

            const bokunResponse = await fetch(`https://api.bokuntest.com${bokunPath}`, {
                method: 'GET',
                headers: {
                    'X-Bokun-Date': timestamp,
                    'X-Bokun-AccessKey': BOKUN_PUBLIC_KEY,
                    'X-Bokun-Signature': signature,
                    'Accept': 'application/json'
                }
            })

            const data = await bokunResponse.json()

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
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