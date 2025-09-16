/**
 * Bokun Booking Sync Service
 * Handles synchronizing bookings between local database and Bokun system
 */

import { supabase } from '../../lib/supabase';
import { BokunAPI } from './secure-api-client';

export class BokunBookingService {
    constructor() {
        this.api = new BokunAPI();
        this.RETRY_DELAYS = [1000, 5000, 15000, 60000]; // 1s, 5s, 15s, 1m
    }

    /**
     * Sync a local booking to Bokun (two-step process: reservation → confirmation)
     * @param {Object} localBooking - Local booking data
     * @returns {Promise<boolean>} Success status
     */
    async syncBookingToBokun(localBooking) {
        try {
            console.log(`Starting Bokun sync for booking ${localBooking.id}`);

            // Get Bokun product mapping
            const bokunProduct = await this.getBokunProduct(localBooking.tour_type);
            if (!bokunProduct) {
                throw new Error(`No Bokun product mapping found for ${localBooking.tour_type}`);
            }

            // Step 1: Create reservation
            const reservation = await this.createReservation(localBooking, bokunProduct);
            console.log(`Reservation created: ${reservation.id}`);

            // Step 2: Confirm booking
            const confirmation = await this.confirmBooking(reservation.id, localBooking);
            console.log(`Booking confirmed: ${confirmation.confirmationCode}`);

            // Update local database with Bokun booking details
            await this.updateLocalBookingSync(
                localBooking.id,
                confirmation.id,
                confirmation.confirmationCode,
                'synced'
            );

            console.log(`Booking ${localBooking.id} successfully synced to Bokun`);
            return true;

        } catch (error) {
            console.error(`Failed to sync booking ${localBooking.id} to Bokun:`, error);

            // Update sync status with error
            await this.updateLocalBookingSync(
                localBooking.id,
                null,
                null,
                'failed',
                error.message
            );

            return false;
        }
    }

    /**
     * Create a reservation in Bokun (Step 1)
     */
    async createReservation(localBooking, bokunProduct) {
        const reservationData = {
            productId: bokunProduct.bokun_product_id,
            startTimeId: await this.getStartTimeId(bokunProduct.bokun_product_id, localBooking.booking_date, localBooking.booking_time),
            participants: [
                {
                    participantTypeId: await this.getParticipantTypeId(bokunProduct.bokun_product_id, 'ADULT'),
                    count: localBooking.adults || 0
                }
            ],
            currency: 'USD',
            source: 'tomodachi-tours-website'
        };

        // Add children if present
        if (localBooking.children > 0) {
            reservationData.participants.push({
                participantTypeId: await this.getParticipantTypeId(bokunProduct.bokun_product_id, 'CHILD'),
                count: localBooking.children
            });
        }

        return await this.api.createReservation(reservationData);
    }

    /**
     * Confirm a reservation (Step 2)
     */
    async confirmBooking(reservationId, localBooking) {
        const confirmationData = {
            customer: {
                firstName: localBooking.first_name || 'Guest',
                lastName: localBooking.last_name || 'Booking',
                email: localBooking.email,
                phone: localBooking.phone_number || '',
                nationality: 'US' // Default, could be made configurable
            },
            paymentReceived: true, // Since payment is handled on your site
            source: 'tomodachi-tours-website',
            notes: `Booking from Tomodachi Tours website. Local booking ID: ${localBooking.id}`
        };

        return await this.api.confirmBooking(reservationId, confirmationData);
    }

    /**
     * Get start time ID for a specific date and time
     */
    async getStartTimeId(productId, date, time) {
        try {
            const availability = await this.api.getActivityAvailability(productId, date);

            if (!availability || !Array.isArray(availability)) {
                throw new Error('No availability data returned');
            }

            const timeSlot = availability.find(slot => slot.startTime === time);
            if (!timeSlot) {
                throw new Error(`No availability found for time ${time} on ${date}`);
            }

            return timeSlot.startTimeId || timeSlot.id;
        } catch (error) {
            console.error('Error getting start time ID:', error);
            throw new Error(`Failed to get start time ID: ${error.message}`);
        }
    }

    /**
     * Get participant type ID for adults/children
     */
    async getParticipantTypeId(productId, type) {
        // For now, return default IDs - these would need to be configured per product
        // In a real implementation, you'd fetch these from Bokun product details
        const defaultTypes = {
            'ADULT': 'adult-participant-type-id',
            'CHILD': 'child-participant-type-id'
        };

        return defaultTypes[type] || defaultTypes['ADULT'];
    }

    /**
     * Cancel a booking in Bokun
     */
    async cancelBookingInBokun(localBookingId) {
        try {
            // Get Bokun booking ID from local database
            const { data: bokunBooking, error } = await supabase
                .from('bokun_bookings')
                .select('bokun_booking_id')
                .eq('local_booking_id', localBookingId)
                .single();

            if (error || !bokunBooking) {
                console.warn(`No Bokun booking found for local booking ${localBookingId}`);
                return false;
            }

            // Cancel in Bokun
            await this.api.cancelBooking(bokunBooking.bokun_booking_id, {
                reason: 'Customer cancellation',
                source: 'tomodachi-tours-website'
            });

            // Update sync status
            await this.updateLocalBookingSync(localBookingId, null, null, 'cancelled');

            console.log(`Booking ${localBookingId} cancelled in Bokun`);
            return true;

        } catch (error) {
            console.error(`Failed to cancel booking ${localBookingId} in Bokun:`, error);
            return false;
        }
    }

    /**
     * Retry failed booking syncs
     */
    async retryFailedSyncs() {
        try {
            const { data: failedBookings, error } = await supabase
                .from('bokun_bookings')
                .select(`
                    local_booking_id,
                    last_sync_attempt,
                    bookings (*)
                `)
                .eq('sync_status', 'failed')
                .order('last_sync_attempt', { ascending: true })
                .limit(10);

            if (error || !failedBookings) {
                console.log('No failed bookings to retry');
                return;
            }

            console.log(`Retrying ${failedBookings.length} failed booking syncs`);

            for (const failedBooking of failedBookings) {
                if (failedBooking.bookings) {
                    await this.syncBookingToBokun(failedBooking.bookings);
                    // Add delay between retries to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

        } catch (error) {
            console.error('Error retrying failed syncs:', error);
        }
    }

    /**
     * Get Bokun product mapping from database
     */
    async getBokunProduct(tourType) {
        try {
            const { data, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('local_tour_type', tourType)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching Bokun product mapping:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getBokunProduct:', error);
            return null;
        }
    }

    /**
     * Update local booking sync status
     */
    async updateLocalBookingSync(localBookingId, bokunBookingId, confirmationCode, status, errorMessage = null) {
        try {
            const updateData = {
                sync_status: status,
                last_sync_attempt: new Date().toISOString(),
                error_message: errorMessage
            };

            if (bokunBookingId) {
                updateData.bokun_booking_id = bokunBookingId;
            }

            if (confirmationCode) {
                updateData.bokun_confirmation_code = confirmationCode;
            }

            // Update or insert bokun_bookings record
            const { error: upsertError } = await supabase
                .from('bokun_bookings')
                .upsert(
                    {
                        local_booking_id: localBookingId,
                        ...updateData
                    },
                    { onConflict: 'local_booking_id' }
                );

            if (upsertError) {
                console.error('Error updating bokun_bookings:', upsertError);
            }

            // Update main bookings table
            const bookingUpdate = {
                bokun_synced: status === 'synced',
                bokun_booking_id: bokunBookingId || null
            };

            const { error: bookingError } = await supabase
                .from('bookings')
                .update(bookingUpdate)
                .eq('id', localBookingId);

            if (bookingError) {
                console.error('Error updating bookings table:', bookingError);
            }

        } catch (error) {
            console.error('Error updating local booking sync:', error);
        }
    }
}

// Create singleton instance
export const bokunBookingService = new BokunBookingService(); 