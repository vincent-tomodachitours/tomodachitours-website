import React from 'react';

const TourTabs = ({ activeContent, setActiveContent, tourId, tourTitle, trackTourTabClick }) => {
    const tabs = [
        { id: 1, label: 'Overview' },
        { id: 2, label: 'Details' },
        { id: 3, label: 'Itinerary' },
        { id: 4, label: 'Meeting Point' }
    ];

    return (
        <div className='flex font-roboto font-semibold border-b border-gray-300'>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`px-4 py-2 ${activeContent === tab.id
                            ? 'border-b-2 border-gray-900 text-gray-900'
                            : 'text-gray-500'
                        }`}
                    onClick={() => {
                        setActiveContent(tab.id);
                        trackTourTabClick(tourId, tourTitle, tab.label, tab.id);
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TourTabs;