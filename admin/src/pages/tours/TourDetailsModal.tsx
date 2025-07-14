import React from 'react';
import {
    XMarkIcon,
    PencilIcon,
    MapPinIcon,
    ClockIcon,
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Tour } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant, getTourTypeBadgeVariant, formatTourType } from '../../components/ui/Badge';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getMeetingPointLocation, getMeetingPointMapsUrl, getMeetingPointAdditionalInfo } from '../../utils/tourUtils';

interface TourDetailsModalProps {
    tour: Tour;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
}

const TourDetailsModal: React.FC<TourDetailsModalProps> = ({
    tour,
    isOpen,
    onClose,
    onEdit
}) => {
    const { hasPermission } = useAdminAuth();

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                                {tour.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant={getTourTypeBadgeVariant(tour.type)}>
                                {formatTourType(tour.type)}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(tour.status)}>
                                {tour.status}
                            </Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{tour.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasPermission('manage_tours') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEdit}
                                className="flex items-center"
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="flex items-center"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Duration</p>
                                <p className="text-lg font-bold text-blue-900">{tour.duration_minutes / 60}h</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <UsersIcon className="h-5 w-5 text-green-600 mr-2" />
                            <div>
                                <p className="text-sm text-green-600 font-medium">Capacity</p>
                                <p className="text-lg font-bold text-green-900">{tour.min_participants}-{tour.max_participants}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <MapPinIcon className="h-5 w-5 text-orange-600 mr-2" />
                            <div>
                                <p className="text-sm text-orange-600 font-medium">Meeting Point</p>
                                <p className="text-sm font-bold text-orange-900 truncate">{getMeetingPointLocation(tour.meeting_point)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {/* Description */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap">{tour.description}</p>
                        </div>
                    </div>

                    {/* Tour Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* What's Included */}
                        {tour.included_items.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h4>
                                <ul className="space-y-2">
                                    {tour.included_items.map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* What's Not Included */}
                        {tour.excluded_items.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">What's Not Included</h4>
                                <ul className="space-y-2">
                                    {tour.excluded_items.map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements */}
                        {tour.requirements.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements & Recommendations</h4>
                                <ul className="space-y-2">
                                    {tour.requirements.map((requirement, index) => (
                                        <li key={index} className="flex items-start">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{requirement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}


                    </div>

                    {/* Meeting Point */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Meeting Point</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start">
                                <MapPinIcon className="h-5 w-5 text-gray-600 mr-3 mt-1 flex-shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-gray-900 font-medium">{getMeetingPointLocation(tour.meeting_point)}</p>

                                    {/* Google Maps Link */}
                                    {getMeetingPointMapsUrl(tour.meeting_point) && (
                                        <a
                                            href={getMeetingPointMapsUrl(tour.meeting_point)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            Open Google Maps
                                        </a>
                                    )}

                                    {/* Additional Info */}
                                    {getMeetingPointAdditionalInfo(tour.meeting_point) && (
                                        <p className="text-sm text-gray-600">
                                            {getMeetingPointAdditionalInfo(tour.meeting_point)}
                                        </p>
                                    )}

                                    {/* Coordinates */}
                                    {tour.meeting_point_lat && tour.meeting_point_lng && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Coordinates: {tour.meeting_point_lat}, {tour.meeting_point_lng}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{tour.cancellation_policy}</p>
                        </div>
                    </div>

                    {/* SEO Information */}
                    {(tour.seo_title || tour.seo_description || tour.seo_keywords) && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">SEO Information</h4>
                            <div className="space-y-3">
                                {tour.seo_title && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">SEO Title</p>
                                        <p className="text-gray-900">{tour.seo_title}</p>
                                    </div>
                                )}
                                {tour.seo_description && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">SEO Description</p>
                                        <p className="text-gray-900">{tour.seo_description}</p>
                                    </div>
                                )}
                                {tour.seo_keywords && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">SEO Keywords</p>
                                        <p className="text-gray-900">{tour.seo_keywords}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Tour Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Created:</p>
                                <p className="text-gray-900 font-medium">{formatDate(tour.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Last Updated:</p>
                                <p className="text-gray-900 font-medium">{formatDate(tour.updated_at)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Tour ID:</p>
                                <p className="text-gray-900 font-mono text-xs">{tour.id}</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourDetailsModal; 