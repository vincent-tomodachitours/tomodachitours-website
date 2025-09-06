import React from 'react';
import ExpandableContent from './ExpandableContent';

const TourDetails = ({
    maxSlots,
    tourDuration,
    included = [],
    notIncluded = [],
    accessibility = [],
    isExpanded,
    setIsExpanded,
    isMobile
}) => {
    return (
        <ExpandableContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} isMobile={isMobile}>
            <div className="px-4 space-y-4">
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className={isMobile ? "text-base" : ""}>Ages 0-90, max of {maxSlots} per group</span>
                </div>
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className={isMobile ? "text-base" : ""}>Duration: {tourDuration} minutes</span>
                </div>
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className={isMobile ? "text-base" : ""}>Start time: Check availability</span>
                </div>
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span className={isMobile ? "text-base" : ""}>Live guide: English</span>
                </div>
            </div>

            <div className="w-full h-px bg-gray-300 mx-4 my-6" />

            <div className="space-y-8 px-4">
                {included.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold mb-3">What's included</h3>
                        <ul className="space-y-2">
                            {included.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className={isMobile ? "text-base" : ""}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {notIncluded.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold mb-3">What's not included</h3>
                        <ul className="space-y-2">
                            {notIncluded.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-red-600 mt-1">✗</span>
                                    <span className={isMobile ? "text-base" : ""}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {accessibility.length > 0 && (
                    <>
                        <div className="w-full h-px bg-gray-300 my-6" />
                        <div>
                            <h3 className="text-lg font-bold mb-3">Accessibility</h3>
                            <ul className="space-y-2">
                                {accessibility.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-gray-600 mt-1">•</span>
                                        <span className={isMobile ? "text-base" : ""}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </ExpandableContent>
    );
};

export default TourDetails;