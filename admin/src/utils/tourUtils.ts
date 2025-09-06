import { MeetingPoint } from '../types';

/**
 * Safely get the meeting point location string from either string or object format
 */
export const getMeetingPointLocation = (meetingPoint: string | MeetingPoint): string => {
    if (typeof meetingPoint === 'string') {
        return meetingPoint;
    }

    if (meetingPoint && typeof meetingPoint === 'object') {
        return meetingPoint.location || 'Location not specified';
    }

    return 'Location not specified';
};

/**
 * Safely get the meeting point Google Maps URL
 */
export const getMeetingPointMapsUrl = (meetingPoint: string | MeetingPoint): string | null => {
    if (typeof meetingPoint === 'object' && meetingPoint?.google_maps_url) {
        return meetingPoint.google_maps_url;
    }
    return null;
};

/**
 * Safely get the meeting point additional info
 */
export const getMeetingPointAdditionalInfo = (meetingPoint: string | MeetingPoint): string | null => {
    if (typeof meetingPoint === 'object' && meetingPoint?.additional_info) {
        return meetingPoint.additional_info;
    }
    return null;
};

/**
 * Check if meeting point has detailed information (is an object)
 */
export const hasDetailedMeetingPoint = (meetingPoint: string | MeetingPoint): boolean => {
    return typeof meetingPoint === 'object' && meetingPoint !== null;
}; 