/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { validateRequest, addSecurityHeaders, notificationSchema } from '../validation-middleware/index.ts'
// import { withRateLimit } from '../rate-limit-middleware/wrapper.ts' // Temporarily disabled
import sgMail from "npm:@sendgrid/mail"

console.log("Notification service loaded")

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-mode',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Validate request data
    const { data, error } = await validateRequest(req, notificationSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email using SendGrid
    try {
      // Handle both old format (single recipient) and new format (multiple personalizations)
      if (data.personalizations) {
        // New format with multiple personalizations
        await sgMail.send({
          from: {
            email: 'contact@tomodachitours.com',
            name: 'Tomodachi Tours'
          },
          template_id: data.templateId,
          personalizations: data.personalizations
        })
      } else {
        // Old format for backward compatibility
        await sgMail.send({
          to: data.to,
          from: {
            email: 'contact@tomodachitours.com',
            name: 'Tomodachi Tours'
          },
          templateId: data.templateId,
          dynamicTemplateData: data.templateData
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (emailError) {
      console.error('SendGrid error:', emailError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Export the wrapped handler
export default serve(handler) // Temporarily removed withRateLimit wrapper 