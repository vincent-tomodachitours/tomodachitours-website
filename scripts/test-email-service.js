#!/usr/bin/env node

/**
 * Script to test email service functionality
 */

require('dotenv').config();

async function testSendGrid() {
    console.log('🧪 Testing SendGrid API...');

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
        console.log('❌ SENDGRID_API_KEY not found in environment variables');
        return false;
    }

    try {
        // Test API key validity
        const response = await fetch('https://api.sendgrid.com/v3/user/account', {
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const account = await response.json();
            console.log('✅ SendGrid API key is valid');
            console.log(`   Account: ${account.email || 'N/A'}`);
            return true;
        } else {
            const error = await response.json();
            console.log('❌ SendGrid API key issue:', error);

            if (error.errors?.[0]?.message?.includes('access forbidden')) {
                console.log('   → API key may be expired or have insufficient permissions');
            }

            return false;
        }
    } catch (error) {
        console.log('❌ SendGrid connection error:', error.message);
        return false;
    }
}

async function testSendGridSending() {
    console.log('\n📧 Testing SendGrid email sending...');

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: {
                    email: 'contact@tomodachitours.com',
                    name: 'Tomodachi Tours'
                },
                personalizations: [{
                    to: [{ email: 'spirivincent03@gmail.com' }],
                    dynamic_template_data: {
                        bookingId: 'TEST-123',
                        tourName: 'Test Email Service',
                        tourDate: 'Today',
                        tourTime: '10:00 AM',
                        adults: 1,
                        children: 0,
                        infants: 0,
                        totalAmount: '0',
                        meetingPoint: {
                            location: 'Test Location',
                            google_maps_url: 'https://maps.google.com',
                            additional_info: 'This is a test email'
                        }
                    }
                }],
                template_id: 'd-80e109cadad44eeab06c1b2396b504b2'
            })
        });

        if (response.ok) {
            console.log('✅ Test email sent successfully!');
            console.log('   Check spirivincent03@gmail.com for the test email');
            return true;
        } else {
            const error = await response.json();
            console.log('❌ Failed to send test email:', error);

            if (error.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
                console.log('   → SendGrid account has exceeded sending limits');
                console.log('   → Need to upgrade plan or add credits');
            }

            return false;
        }
    } catch (error) {
        console.log('❌ Email sending error:', error.message);
        return false;
    }
}

async function checkEmailFailures() {
    console.log('\n📊 Checking for recent email failures...');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
    );

    try {
        // Check if email_failures table exists and get recent failures
        const { data: failures, error } = await supabase
            .from('email_failures')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error && error.code === '42P01') {
            console.log('ℹ️  Email failures table doesn\'t exist yet (will be created on first failure)');
            return;
        }

        if (error) {
            console.log('❌ Error checking email failures:', error);
            return;
        }

        if (!failures || failures.length === 0) {
            console.log('✅ No recent email failures found');
            return;
        }

        console.log(`⚠️  Found ${failures.length} recent email failures:`);
        failures.forEach(failure => {
            console.log(`   - Booking #${failure.booking_id}: ${failure.customer_email}`);
            console.log(`     Reason: ${failure.failure_reason}`);
            console.log(`     Date: ${new Date(failure.created_at).toLocaleString()}`);
        });

    } catch (error) {
        console.log('❌ Error checking failures:', error.message);
    }
}

async function runTests() {
    console.log('🔧 Email Service Diagnostic Tool');
    console.log('='.repeat(50));

    const sendgridValid = await testSendGrid();

    if (sendgridValid) {
        await testSendGridSending();
    }

    await checkEmailFailures();

    console.log('\n💡 Recommendations:');
    if (!sendgridValid) {
        console.log('1. Check your SendGrid account at https://app.sendgrid.com');
        console.log('2. Verify API key permissions');
        console.log('3. Consider switching to alternative email service');
    } else {
        console.log('1. SendGrid is configured correctly');
        console.log('2. Monitor for credit limits');
        console.log('3. Set up email failure alerts');
    }
}

runTests();