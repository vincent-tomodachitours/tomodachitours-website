import React from 'react'
import { ReactComponent as MinusCircle } from '../SVG/MinusCircle.svg'
import { ReactComponent as PlusCircle } from '../SVG/PlusCircle.svg'

const PeopleSelector = ({ min = 0, max = 9, title = "NAME", participants, setParticipants, value, onChange }) => {

    const decrease = () => {
        if (value > min) {
            setParticipants(participants - 1);
            onChange(value - 1);
        }
    };

    const increase = () => {
        if (value < max) {
            setParticipants(participants + 1);
            onChange(value + 1);
        }
    };

    const minusButton = () => {
        if (value === min) {
            return <button title="Subtract" className="group cursor-not-allowed outline-none mx-2">
                <MinusCircle className="stroke-blue-200 fill-none group-hover:fill-gray-500/30" />
            </button>;
        } else {
            return <button title="Subtract" className="group cursor-pointer outline-none mx-2" onClick={decrease}>
                <MinusCircle className="stroke-blue-900 fill-none group-hover:fill-gray-500/30" />
            </button>;
        }
    }

    const plusButton = () => {
        if (participants < max) {
            return <button title="Add" className="group cursor-pointer outline-none mx-2" onClick={increase}>
                <PlusCircle className="stroke-blue-900 fill-none group-hover:fill-gray-500/30" />
            </button>
        } else {
            return <button title="Add" className="group cursor-not-allowed outline-none mx-2">
                <PlusCircle className="stroke-blue-200 fill-none group-hover:fill-gray-500/30" />
            </button>
        }
    }

    return (
        <div className='w-full flex justify-between my-2 font-ubuntu'>
            <div>
                <h3 className='font-bold text-lg'>{title}</h3>
                <p className='text-sm'>Age 18 - 90</p>
            </div>

            <div className='flex align-middle justify-center'>
                {minusButton()}

                <span className='grid place-items-center mx-2 font-ubuntu font-bold text-lg'>{value}</span>

                {plusButton()}
            </div>
        </div>
    )
};

export default PeopleSelector