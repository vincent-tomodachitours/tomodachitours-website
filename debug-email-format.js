#!/usr/bin/env node

/**
 * Debug script to test the exact email format being sent
 */

require('dotenv').config();

async function testEmailFormat() {
    console.log('🔍 Testing Email Format');
    console.log('='.repeat(40));

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
        console.log('❌ SENDGRID_API_KEY not found');
        return;
    }

    const companyEmails = [
        'spirivincent03@gmail.com',
        'contact@tomodachitours.com',
        'yutaka.m@tomodachitours.com',
        'hiro7956s@gmail.com'
    ];

    const testData = {
        bookingId: 'DEBUG-TEST-123',
        tourName: 'Debug Test Tour',
        customerName: 'Debug Customer',
        customerEmail: 'debug@test.com',
        tourDate: 'Today',
        tourTime: '10:00',
        adults: 1,
        children: 0,
        totalAmount: '1,000'
    };

    // Test the exact format we're using in the function
    const personalizations = companyEmails.map(email => ({
        to: [{ email: email }],
        dynamic_template_data: testData
    }));

    console.log('📧 Personalizations format:');
    console.log(JSON.stringify(personalizations, null, 2));

    const payload = {
        from: {
            email: 'contact@tomodachitours.com',
            name: 'Tomodachi Tours'
        },
        template_id: 'd-3337db456cc04cebb2009460bd23a629',
        personalizations: personalizations
    };

    console.log('\n📤 Full payload:');
    console.log(JSON.stringify(payload, null, 2));

    try {
        console.log('\n🚀 Sending test email...');

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Email sent successfully!');
            console.log('📬 Check all 4 email addresses for the test notification');
        } else {
            const error = await response.json();
            console.log('❌ SendGrid error:', JSON.stringify(error, null, 2));
        }

    } catch (error) {
        console.log('❌ Request error:', error.message);
    }
}

testEmailFormat();