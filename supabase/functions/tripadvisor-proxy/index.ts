import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const { locationId, apiKey } = await req.json()

        if (!locationId || !apiKey) {
            return new Response(JSON.stringify({ error: 'Missing locationId or apiKey' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Make request to TripAdvisor API
        const tripAdvisorUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`

        console.log('Fetching TripAdvisor data for location:', locationId)

        const response = await fetch(tripAdvisorUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'TomodachiTours/1.0'
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('TripAdvisor API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            })
            return new Response(JSON.stringify({
                error: `TripAdvisor API error: ${response.status}`,
                details: errorText
            }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('TripAdvisor proxy error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})