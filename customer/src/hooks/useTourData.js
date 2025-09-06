import { useState, useEffect } from 'react';
import { getTour, clearToursCache } from '../services/toursService';
import { trackTourView } from '../services/analytics';
import attributionService from '../services/attributionService';

export const useTourData = (tourId) => {
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize attribution tracking for UTM parameters
        attributionService.initialize();

        const loadTourData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Clear cache to ensure we get fresh data
                clearToursCache();
                const data = await getTour(tourId);

                if (data) {
                    setTourData(data);
                    console.log(`✅ ${tourId} tour data loaded:`, data);

                    // Track tour page view with attribution
                    trackTourView({
                        tourId: tourId,
                        tourName: data['tour-title'],
                        price: data['tour-price']
                    });
                } else {
                    throw new Error('Tour data not found');
                }
            } catch (error) {
                console.error(`❌ Failed to load ${tourId} tour data:`, error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        loadTourData();
    }, [tourId]);

    return { tourData, loading, error };
};