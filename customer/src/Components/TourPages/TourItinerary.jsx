import React from 'react';
import { ReactComponent as Location } from '../../SVG/Location.svg';
import { ReactComponent as One } from '../../SVG/One-circle.svg';
import { ReactComponent as Two } from '../../SVG/Two-circle.svg';
import { ReactComponent as Three } from '../../SVG/Three-circle.svg';
import { ReactComponent as Four } from '../../SVG/Four-circle.svg';
import { ReactComponent as Five } from '../../SVG/Five-circle.svg';
import { ReactComponent as Six } from '../../SVG/Six-circle.svg';
import ExpandableContent from './ExpandableContent';

const TourItinerary = ({ stops, meetingPoint, isExpanded, setIsExpanded, isMobile }) => {
    const getStopIcon = (index) => {
        const icons = [Location, One, Two, Three, Four, Five, Six];
        const IconComponent = icons[index] || Six;
        return <IconComponent className='w-8 h-8' />;
    };

    // eslint-disable-next-line no-unused-vars
    const allStops = [
        { type: 'meeting', data: meetingPoint },
        ...(stops || []).map(stop => ({ type: 'stop', data: stop }))
    ];

    return (
        <ExpandableContent
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            isMobile={isMobile}
        >
            <div className='flex flex-col w-full'>
                {/* Meeting Point */}
                <div className='flex flex-row gap-4 w-full'>
                    <div className='w-10 flex flex-col items-center relative'>
                        <div className='relative z-10 bg-white flex justify-center items-center w-8 h-8'>
                            {getStopIcon(0)}
                        </div>
                        {(stops && stops.length > 0) && (
                            <div
                                className='w-px flex-1'
                                style={{
                                    minHeight: '3rem',
                                    backgroundImage: 'repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 12px)'
                                }}
                            ></div>
                        )}
                    </div>
                    <div className='flex-1 font-roboto pb-6'>
                        <h4 className='font-bold'>You'll start at</h4>
                        <p className={isMobile ? "text-base" : ""}>{meetingPoint?.location || 'Meeting point location'}</p>
                        {meetingPoint?.additionalInfo && (
                            <p className={`text-sm text-gray-600 mt-1 ${isMobile ? "text-base" : ""}`}>{meetingPoint.additionalInfo}</p>
                        )}
                        {meetingPoint?.instructions && (
                            <p className={`text-sm text-gray-600 mt-1 ${isMobile ? "text-base" : ""}`}>{meetingPoint.instructions}</p>
                        )}
                        <a
                            href={meetingPoint?.googleMapsUrl || '#'}
                            target='_blank'
                            rel="noopener noreferrer"
                            className='font-semibold underline'
                        >
                            Open Google Maps
                        </a>
                    </div>
                </div>

                {/* Tour Stops */}
                {stops && stops.map((stop, index) => (
                    <div key={index} className='flex flex-row gap-4 w-full'>
                        <div className='w-10 flex flex-col items-center relative'>
                            <div className='relative z-10 bg-white flex justify-center items-center w-8 h-8'>
                                {getStopIcon(index + 1)}
                            </div>
                            {index < stops.length - 1 && (
                                <div
                                    className='w-px flex-1'
                                    style={{
                                        minHeight: '3rem',
                                        backgroundImage: 'repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 12px)'
                                    }}
                                ></div>
                            )}
                        </div>
                        <div className='flex-1 font-roboto pb-6'>
                            <h4 className='font-bold'>{stop.name}</h4>
                            <p className={isMobile ? "text-base" : ""}>Stop: {stop.duration}</p>
                            {stop.description && (
                                <p className={`text-sm text-gray-600 mt-1 ${isMobile ? "text-base" : ""}`}>{stop.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ExpandableContent>
    );
};

export default TourItinerary;