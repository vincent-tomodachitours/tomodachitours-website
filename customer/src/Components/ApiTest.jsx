import React, { useEffect, useState } from 'react';

const ApiTest = () => {
    const [result, setResult] = useState(null);

    useEffect(() => {
        const testDirectAPI = async () => {
            console.log('🧪 ApiTest: Testing direct Method 2 API call...');

            try {
                const apiKey = '712CBC2D1532411593E1994319E44739';
                const locationId = '27931661';
                const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`;

                const currentOrigin = window.location.origin;
                console.log('🌐 ApiTest: Using origin:', currentOrigin);

                const options = {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'pragma': 'no-cache',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'cross-site',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Origin': currentOrigin,
                        'Referer': currentOrigin + '/'
                    }
                };

                console.log('📡 ApiTest: Making request...');
                const response = await fetch(url, options);
                console.log('📊 ApiTest: Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`API failed: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ ApiTest: SUCCESS! Data received:', data);
                console.log('📈 ApiTest: num_reviews:', data.num_reviews);

                setResult({
                    success: true,
                    totalReviews: data.num_reviews,
                    rating: data.rating,
                    ranking: data.ranking_data?.ranking_string,
                    name: data.name
                });

            } catch (error) {
                console.error('❌ ApiTest: Failed:', error);
                setResult({
                    success: false,
                    error: error.message
                });
            }
        };

        testDirectAPI();
    }, []);

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #0066cc',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
            maxWidth: '300px',
            zIndex: 9999
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>🧪 Direct API Test</h4>
            {result ? (
                result.success ? (
                    <div style={{ color: 'green' }}>
                        <p><strong>✅ API WORKS!</strong></p>
                        <p>Reviews: {result.totalReviews}</p>
                        <p>Rating: {result.rating}</p>
                        <p>Name: {result.name}</p>
                    </div>
                ) : (
                    <div style={{ color: 'red' }}>
                        <p><strong>❌ API Failed</strong></p>
                        <p>{result.error}</p>
                    </div>
                )
            ) : (
                <p>Testing...</p>
            )}
        </div>
    );
};

export default ApiTest;
