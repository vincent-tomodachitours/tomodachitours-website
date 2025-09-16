import React from 'react';
import ExpandableContent from './ExpandableContent';
import { TourMeetingPointComponentProps } from '../../types';

const TourMeetingPoint: React.FC<TourMeetingPointComponentProps> = ({ meetingPoint, isExpanded, setIsExpanded, isMobile }) => {
    return (
        <ExpandableContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} isMobile={isMobile}>
            <div className="px-4 space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-3">Meeting Point</h3>
                    <p className={`text-gray-700 mb-2 ${isMobile ? "text-base" : ""}`}>{meetingPoint?.location || 'Meeting point location'}</p>
                    {/* {meetingPoint?.additionalInfo && (
                        <p className={`text-sm text-gray-600 mb-4 ${isMobile ? "text-base" : ""}`}>{meetingPoint.additionalInfo}</p>
                    )} */}
                    <a
                        href={meetingPoint?.googleMapsUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Open in Google Maps
                    </a>
                </div>

                {meetingPoint?.instructions && (
                    <div>
                        <h4 className="font-semibold mb-2">Meeting Instructions</h4>
                        <p className={`text-gray-700 ${isMobile ? "text-base" : ""}`}>{meetingPoint.instructions}</p>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                    <ul className={`text-sm text-yellow-700 space-y-1 ${isMobile ? "text-base" : ""}`}>
                        <li>• Please arrive 10 minutes before the tour start time</li>
                        <li>• Look for your guide holding a sign with your name or tour company logo</li>
                        <li>• Contact information will be provided in your booking confirmation</li>
                    </ul>
                </div>
            </div>
        </ExpandableContent>
    );
};

export default TourMeetingPoint;