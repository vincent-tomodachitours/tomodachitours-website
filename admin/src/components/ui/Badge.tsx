import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    className,
}) => {
    return (
        <span
            className={clsx(
                'inline-flex items-center font-medium rounded-full',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
        >
            {children}
        </span>
    );
};

// Utility functions for status badges
export const getStatusBadgeVariant = (status?: string): BadgeVariant => {
    if (!status) return 'default';

    switch (status.toUpperCase()) {
        case 'ACTIVE':
            return 'success';
        case 'CONFIRMED':
            return 'success';
        case 'PENDING':
        case 'PENDING_PAYMENT':
        case 'DRAFT':
            return 'warning';
        case 'CANCELLED':
        case 'REFUNDED':
        case 'INACTIVE':
            return 'danger';
        default:
            return 'default';
    }
};

export const getTourTypeBadgeVariant = (tourType?: string): BadgeVariant => {
    if (!tourType) return 'default';

    switch (tourType) {
        case 'NIGHT_TOUR':
            return 'primary';
        case 'MORNING_TOUR':
            return 'info';
        case 'UJI_TOUR':
            return 'success';
        case 'GION_TOUR':
            return 'warning';
        default:
            return 'default';
    }
};

export const formatTourType = (tourType?: string): string => {
    if (!tourType) return 'Unknown';

    switch (tourType) {
        case 'NIGHT_TOUR':
            return 'Night Tour';
        case 'MORNING_TOUR':
            return 'Morning Tour';
        case 'UJI_TOUR':
            return 'Uji Tour';
        case 'GION_TOUR':
            return 'Gion Tour';
        default:
            return tourType;
    }
}; 