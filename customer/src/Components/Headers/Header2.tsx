import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../IMG/Logo/white-logo-final-no-bg.webp';

const Header2: React.FC = () => {

    return (
        <div className='absolute inset-0 z-50 w-full h-20 flex bg-transparent'>
            <div className=''>
                <Link to="/"><img src={logo} alt="Tomodachi Tours logo" className='h-16' /></Link>
            </div>
            <div className='absolute right-0 flex gap-6 text-white text-md border-2 border-red-500'>
                <Link to="/" className='underline cursor-pointer'>Home</Link>
                <Link to="/about" className='underline cursor-pointer'>About</Link>
                <Link to="/recommendations" className='underline cursor-pointer'>Recommendations</Link>
            </div>
        </div >
    )
}

export default Header2