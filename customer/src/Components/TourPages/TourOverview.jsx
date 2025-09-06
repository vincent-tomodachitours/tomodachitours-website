import React from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as ClockRewind } from '../../SVG/clock-rewind.svg';
import ExpandableContent from './ExpandableContent';

const TourOverview = ({ content, isExpanded, setIsExpanded, isMobile }) => {
    return (
        <ExpandableContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} isMobile={isMobile}>
            <div className="px-4 space-y-6">
                {content.map((paragraph, index) => (
                    <p key={index} className={isMobile ? "text-base" : ""}>{paragraph}</p>
                ))}
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-4 rounded-lg mx-4">
                <ClockRewind className="w-5 h-5 text-amber-600" />
                <div>
                    <Link to="/cancellation-policy" className="font-bold text-blue-600 hover:underline">
                        Free cancellation
                    </Link>
                    <span className={`text-gray-600 ${isMobile ? "text-base" : ""}`}> • Full refund if cancelled up to 24 hours before the experience starts (local time).</span>
                </div>
            </div>
        </ExpandableContent>
    );
};

export default TourOverview;