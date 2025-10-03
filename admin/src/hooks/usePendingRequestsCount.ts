import { useQuery } from '@tanstack/react-query';
import { BookingRequestService } from '../services/bookingRequestService';

export const usePendingRequestsCount = () => {
    return useQuery({
        queryKey: ['pending-requests-count'],
        queryFn: () => BookingRequestService.getPendingRequestsCount(),
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 10000, // Consider data stale after 10 seconds
    });
};