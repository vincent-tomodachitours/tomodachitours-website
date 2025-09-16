import React from 'react';

const Loading: React.FC = () => {
    return (
        <div className='fixed inset-0 h-screen bg-blue-900 bg-opacity-50 z-50 grid place-content-center'>
            <div className="flex space-x-2 justify-center items-center">
                <h1 className='text-white text-5xl'>Loading</h1>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300"></div>
            </div>
        </div>
    )
}

export default Loading