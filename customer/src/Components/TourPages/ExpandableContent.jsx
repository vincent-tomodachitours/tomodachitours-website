import React from 'react';

const ExpandableContent = ({ isExpanded, setIsExpanded, children, maxHeight = 'max-h-48', isMobile = false }) => {
    // On desktop, always show full content
    const shouldShowCollapsed = isMobile && !isExpanded;
    const shouldShowExpandButton = isMobile && !isExpanded;
    const shouldShowCollapseButton = isMobile && isExpanded;

    return (
        <div className='font-ubuntu flex flex-col gap-6 mt-8'>
            <div className={`transition-all duration-300 ${shouldShowCollapsed ? `overflow-hidden ${maxHeight}` : 'overflow-visible'}`}>
                {children}
            </div>

            {shouldShowExpandButton && (
                <div className="px-4">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        <span>Show more</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            {shouldShowCollapseButton && (
                <div className="px-4">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        <span>Show less</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExpandableContent;