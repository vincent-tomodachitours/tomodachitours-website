import React from 'react';

interface AttributionProps {
    businessInfo?: any;
    showAttribution: boolean;
}

const Attribution: React.FC<AttributionProps> = ({ businessInfo, showAttribution }) => {
    if (!showAttribution) return null;

    // TripAdvisor brand colors
    const tripAdvisorGreen = '#00AA6C';

    return (
        <div className="text-center mt-8 pt-6 border-t border-gray-200" data-testid="tripadvisor-attribution">
            {/* Main Attribution */}
            <div className="flex items-center justify-center space-x-3 mb-4">
                <span className="text-sm text-gray-600 font-medium">Powered by</span>

                {/* Official TripAdvisor Logo */}
                <div className="flex items-center">
                    <svg
                        className="w-6 h-6 mr-2"
                        viewBox="0 0 200 200"
                        fill={tripAdvisorGreen}
                        aria-label="TripAdvisor Logo"
                    >
                        {/* Owl body */}
                        <path d="M100 20C60.2 20 28 52.2 28 92c0 39.8 32.2 72 72 72s72-32.2 72-72c0-39.8-32.2-72-72-72zm0 130c-32 0-58-26-58-58s26-58 58-58 58 26 58 58-26 58-58 58z" />
                        {/* Left eye */}
                        <circle cx="75" cy="85" r="12" />
                        {/* Right eye */}
                        <circle cx="125" cy="85" r="12" />
                        {/* Beak/mouth */}
                        <path d="M100 115c-12 0-22-8-25-19h50c-3 11-13 19-25 19z" />
                    </svg>

                    <span
                        className="text-lg font-bold tracking-tight"
                        style={{ color: tripAdvisorGreen }}
                    >
                        TripAdvisor
                    </span>
                </div>
            </div>

            {/* Business Link */}
            {businessInfo?.tripAdvisorUrl && (
                <div className="mb-3">
                    <a
                        href={businessInfo.tripAdvisorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border"
                        style={{
                            color: tripAdvisorGreen,
                            borderColor: tripAdvisorGreen,
                            backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.backgroundColor = tripAdvisorGreen;
                            target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.backgroundColor = 'transparent';
                            target.style.color = tripAdvisorGreen;
                        }}
                        data-testid="tripadvisor-business-link"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View all reviews on TripAdvisor
                    </a>
                </div>
            )}

            {/* Compliance Notice */}
            <div className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Reviews are provided by TripAdvisor and reflect the opinions of individual travelers.
                TripAdvisor and the TripAdvisor logo are trademarks of TripAdvisor LLC.
            </div>

            {/* Additional Compliance Info */}
            <div className="mt-2 text-xs text-gray-400">
                Reviews displayed with permission from TripAdvisor
            </div>
        </div>
    );
};



export default Attribution;
