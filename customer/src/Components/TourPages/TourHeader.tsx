import { ReactComponent as Share } from '../../SVG/Share.svg';
import { ReactComponent as FilledCircle } from '../../SVG/FilledCircle.svg';
import { ReactComponent as InfoCircle } from '../../SVG/info-circle.svg';
import { TourHeaderProps } from '../../types';

const TourHeader = ({
    tourTitle,
    tourReviews,
    showSharePopup,
    showInfoTooltip,
    setShowInfoTooltip,
    handleShare,
    customMessage = null
}: TourHeaderProps) => {
    return (
        <div className='mb-6 sm:mb-8'>
            <div className='flex flex-col md:flex-row justify-between items-start gap-4 md:gap-10'>
                <div className='flex-1'>
                    <h1 className='text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold break-words mb-4 text-gray-900 tracking-tight font-sans leading-tight'>
                        {tourTitle}
                    </h1>
                    <div className='flex flex-col gap-2'>
                        {customMessage ? (
                            <div className='flex items-center justify-between gap-2'>
                                <div className='flex items-center gap-2'>
                                    <div className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold'>
                                        NEW TOUR
                                    </div>
                                    <span className='text-gray-700 font-medium'>{customMessage}</span>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md text-gray-700 hover:bg-blue-100 transition-colors relative'
                                >
                                    <Share className='w-4 h-4' />
                                    <span className='font-ubuntu text-sm'>Share</span>
                                    {showSharePopup && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap">
                                            Link copied to clipboard
                                        </div>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xl font-semibold'>5.0</span>
                                        <div className='flex items-center'>
                                            {[...Array(5)].map((_, i) => (
                                                <FilledCircle key={i} className='w-4 h-4 text-green-500' />
                                            ))}
                                        </div>
                                        <span className='text-gray-600'>({tourReviews} reviews)</span>
                                        <a
                                            href="https://www.tripadvisor.com/UserReviewEdit-g298564-d28033450"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className='text-gray-600 underline hover:text-blue-600 ml-2'
                                        >
                                            Write a review
                                        </a>
                                    </div>
                                </div>
                                <div className='flex items-center justify-between gap-2'>
                                    <div className='flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md'>
                                        <span className='text-red-500'>♥</span>
                                        <span className='text-sm'>Recommended by 100% of travelers</span>
                                        <div className="relative">
                                            <InfoCircle
                                                className='w-4 h-4 text-gray-400 cursor-default ml-1'
                                                onMouseEnter={() => setShowInfoTooltip(true)}
                                                onMouseLeave={() => setShowInfoTooltip(false)}
                                            />
                                            {showInfoTooltip && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap z-10">
                                                    Based on reviews from verified customers on TripAdvisor
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleShare}
                                        className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md text-gray-700 hover:bg-blue-100 transition-colors relative ml-auto'
                                    >
                                        <Share className='w-4 h-4' />
                                        <span className='font-ubuntu text-sm'>Share</span>
                                        {showSharePopup && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap">
                                                Link copied to clipboard
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourHeader;