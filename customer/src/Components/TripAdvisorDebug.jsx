import React, { useState, useEffect } from 'react';
import { getRealBusinessInfoWithAPI } from '../data/realTripAdvisorReviews';

const TripAdvisorDebug = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const testAPI = async () => {
            try {
                console.log('🧪 Testing TripAdvisor API from React component...');
                console.log('🔑 API Key available:', !!process.env.REACT_APP_TRIPADVISOR_API_KEY);
                console.log('📍 Location ID:', process.env.REACT_APP_TRIPADVISOR_LOCATION_ID);

                // Test our working Method 2 implementation
                console.log('🧪 Testing our Method 2 implementation...');
                const businessInfo = await getRealBusinessInfoWithAPI();
                setDebugInfo({
                    ...businessInfo,
                    apiKeyPresent: !!process.env.REACT_APP_TRIPADVISOR_API_KEY,
                    method: 'Method 2 (Browser-like headers)'
                });
                console.log('Debug info received:', businessInfo);
            } catch (error) {
                console.error('Debug test failed:', error);
                setDebugInfo({ error: error.message });
            } finally {
                setLoading(false);
            }
        };

        testAPI();
    }, []);

    if (process.env.NODE_ENV !== 'development') {
        return null; // Only show in development
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
            maxWidth: '400px',
            zIndex: 9999
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🧪 TripAdvisor API Debug</h3>
            {loading ? (
                <p>Loading...</p>
            ) : debugInfo ? (
                <div>
                    <p><strong>Environment:</strong> {window.location.hostname === 'localhost' ? 'Localhost (attempting CORS bypass)' : 'Production'}</p>
                    <p><strong>API Key Available:</strong> {process.env.REACT_APP_TRIPADVISOR_API_KEY ? 'Yes' : 'No'}</p>
                    <p><strong>Location ID:</strong> {process.env.REACT_APP_TRIPADVISOR_LOCATION_ID || '27931661'}</p>
                    {debugInfo.error ? (
                        <p style={{ color: 'red' }}><strong>Error:</strong> {debugInfo.error}</p>
                    ) : (
                        <>
                            <p><strong>Name:</strong> {debugInfo.name}</p>
                            <p><strong>Total Reviews:</strong> {debugInfo.totalReviews}</p>
                            <p><strong>Rating:</strong> {debugInfo.overallRating}</p>
                            <p><strong>Ranking:</strong> {debugInfo.ranking}</p>
                        </>
                    )}
                </div>
            ) : (
                <p>No data received</p>
            )}
        </div>
    );
};

export default TripAdvisorDebug;
