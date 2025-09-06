import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { PaymentProviderService } from "../_shared/payment-provider-service.ts"

const handler = async (req: Request): Promise<Response> => {
    try {
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        // Initialize Supabase client and payment provider service
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        )

        const paymentService = new PaymentProviderService(supabase)
        const primaryProvider = paymentService.getPrimaryProvider()

        return new Response(
            JSON.stringify({
                primary: primaryProvider,
                backup: null,
                backup_enabled: false,
                auto_fallback_enabled: false
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )

    } catch (error) {
        console.error('Get payment provider error:', error)
        return new Response(
            JSON.stringify({
                primary: 'payjp', // Safe fallback
                backup: null,
                backup_enabled: false,
                auto_fallback_enabled: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )
    }
}

export default serve(handler)

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/get-payment-provider' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json'

*/ 