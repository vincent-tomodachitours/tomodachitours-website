import { ReactComponent as Clock } from '../../SVG/Clock.svg'
import { ReactComponent as Tripadvisor } from '../../SVG/Tripadvisor.svg'
import { ReactComponent as Circle } from '../../SVG/Circle.svg'
import { DurationReviewProps } from '../../types';

const DurationReview = ({ tourDuration, tourReviews }: DurationReviewProps) => {
    return (
        <div className='flex flex-col md:flex-row gap-2 md:gap-5 my-2'>
            <div className='flex gap-1'>
                <Clock className='w-6 h-6 text-gray-700' />
                <p className='font-ubuntu'>
                    Duration: {tourDuration}
                </p>
            </div>
            <div className='flex gap-1'>
                <Tripadvisor className='w-6 h-6 text-red-500' />
                <div className='flex items-center'>
                    {[...Array(5)].map((_, i) => (
                        <Circle key={i} className='w-4 h-4 text-green-500' />
                    ))}
                </div>
                <p className='font-ubuntu'>{tourReviews} reviews</p>
            </div>
        </div>
    )
}

export default DurationReview