import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

const FUNCTION_URL = Deno.env.get('FUNCTION_URL') || 'http://localhost:54321/functions/v1/rate-limit-middleware';

// Helper function to make requests
async function makeRequest(ip: string): Promise<Response> {
    return await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip
        }
    });
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.test('Rate Limit Tests', async (t) => {
    const testIP = '192.168.1.1';

    await t.step('Test successful request', async () => {
        const response = await makeRequest(testIP);
        const data = await response.json();

        assertEquals(response.status, 200);
        assertEquals(data.success, true);
        assertEquals(response.headers.get('X-RateLimit-Remaining')?.length > 0, true);
    });

    await t.step('Test rate limit warning (80% of limit)', async () => {
        // Make multiple requests to reach warning threshold
        const requests = [];
        for (let i = 0; i < 48; i++) { // 80% of 60 requests
            requests.push(makeRequest(testIP));
        }
        await Promise.all(requests);

        const response = await makeRequest(testIP);
        assertEquals(response.status, 200);
        assertEquals(parseInt(response.headers.get('X-RateLimit-Remaining') || '0') < 12, true);
    });

    await t.step('Test rate limit exceeded', async () => {
        // Make requests until blocked
        const requests = [];
        for (let i = 0; i < 12; i++) { // Remaining requests to exceed limit
            requests.push(makeRequest(testIP));
        }
        await Promise.all(requests);

        const response = await makeRequest(testIP);
        const data = await response.json();

        assertEquals(response.status, 429);
        assertEquals(data.error, 'Too many requests');
        assertEquals(response.headers.get('X-RateLimit-Remaining'), '0');
    });

    // Wait for rate limit window to reset
    await sleep(60000);

    await t.step('Test rate limit reset after window', async () => {
        const response = await makeRequest(testIP);
        const data = await response.json();

        assertEquals(response.status, 200);
        assertEquals(data.success, true);
        assertEquals(parseInt(response.headers.get('X-RateLimit-Remaining') || '0') > 0, true);
    });
}); 