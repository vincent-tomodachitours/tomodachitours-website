/**
 * Validation Service for GTM GA4
 * Handles validation of GA4 data flow and ecommerce reporting
 */

import type { ValidationResults, TestResults } from './types';
import { configurationService } from './configurationService';
import { eventTrackingService } from './eventTrackingService';
import { dataLayerService } from './dataLayerService';

export class ValidationService {
    /**
     * Validate GA4 data flow and ecommerce reporting accuracy
     */
    async validateGA4DataFlow(): Promise<ValidationResults> {
        try {
            console.log('GTM GA4 Validation: Starting data flow validation...');

            const validationResults: ValidationResults = {
                ga4ConfigurationValid: false,
                ecommerceEventsValid: false,
                customDimensionsValid: false,
                dataLayerValid: false,
                measurementIdValid: false,
                errors: []
            };

            // Check if dataLayer exists and has events
            if (dataLayerService.isDataLayerAvailable()) {
                validationResults.dataLayerValid = true;
                console.log('✅ GTM GA4 Validation: DataLayer is valid');
            } else {
                validationResults.errors.push('DataLayer is not available or invalid');
                console.error('❌ GTM GA4 Validation: DataLayer validation failed');
            }

            // Check measurement ID
            const measurementId = configurationService.getMeasurementId();
            if (measurementId && measurementId.startsWith('G-')) {
                validationResults.measurementIdValid = true;
                console.log('✅ GTM GA4 Validation: Measurement ID is valid:', measurementId);
            } else {
                validationResults.errors.push('Invalid GA4 measurement ID');
                console.error('❌ GTM GA4 Validation: Invalid measurement ID');
            }

            // Test ecommerce events
            const testResults = await this.runEcommerceEventTests();
            validationResults.ecommerceEventsValid = testResults.success;
            if (!testResults.success) {
                validationResults.errors.push(...testResults.errors);
            }

            // Check custom dimensions configuration
            const customDimensionsTest = this.validateCustomDimensions();
            validationResults.customDimensionsValid = customDimensionsTest.success;
            if (!customDimensionsTest.success) {
                validationResults.errors.push(...customDimensionsTest.errors);
            }

            // Overall validation
            const overallValid = validationResults.dataLayerValid &&
                validationResults.measurementIdValid &&
                validationResults.ecommerceEventsValid &&
                validationResults.customDimensionsValid;

            validationResults.ga4ConfigurationValid = overallValid;

            if (overallValid) {
                console.log('✅ GTM GA4 Validation: All validation checks passed');
            } else {
                console.warn('⚠️ GTM GA4 Validation: Some validation checks failed:', validationResults.errors);
            }

            return validationResults;

        } catch (error: any) {
            console.error('GTM GA4 Validation: Validation failed:', error);
            return {
                ga4ConfigurationValid: false,
                ecommerceEventsValid: false,
                customDimensionsValid: false,
                dataLayerValid: false,
                measurementIdValid: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Run ecommerce event tests
     */
    private async runEcommerceEventTests(): Promise<TestResults> {
        try {
            const testResults: TestResults = {
                success: true,
                errors: []
            };

            // Test view_item event
            const viewItemTest = eventTrackingService.trackGA4ViewItem({
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night',
                tourLocation: 'kyoto'
            });

            if (!viewItemTest) {
                testResults.success = false;
                testResults.errors.push('View item event test failed');
            }

            // Test begin_checkout event
            const beginCheckoutTest = eventTrackingService.trackGA4BeginCheckout({
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night'
            });

            if (!beginCheckoutTest) {
                testResults.success = false;
                testResults.errors.push('Begin checkout event test failed');
            }

            // Test add_payment_info event
            const addPaymentInfoTest = eventTrackingService.trackGA4AddPaymentInfo({
                value: 5000,
                paymentProvider: 'stripe'
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour'
            });

            if (!addPaymentInfoTest) {
                testResults.success = false;
                testResults.errors.push('Add payment info event test failed');
            }

            // Test purchase event
            const purchaseTest = eventTrackingService.trackGA4Purchase({
                transactionId: 'test_' + Date.now(),
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night'
            });

            if (!purchaseTest) {
                testResults.success = false;
                testResults.errors.push('Purchase event test failed');
            }

            if (testResults.success) {
                console.log('✅ GTM GA4 Validation: All ecommerce event tests passed');
            }

            return testResults;

        } catch (error: any) {
            console.error('GTM GA4 Validation: Ecommerce event tests failed:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Validate custom dimensions configuration
     */
    private validateCustomDimensions(): TestResults {
        try {
            const customDimensions = configurationService.getCustomDimensions();
            const requiredDimensions = [
                'tour_id', 'tour_name', 'tour_category', 'tour_location',
                'tour_duration', 'booking_date', 'payment_provider'
            ];

            const missingDimensions = requiredDimensions.filter(
                dimension => !customDimensions[dimension as keyof typeof customDimensions]
            );

            if (missingDimensions.length > 0) {
                return {
                    success: false,
                    errors: [`Missing custom dimensions: ${missingDimensions.join(', ')}`]
                };
            }

            console.log('✅ GTM GA4 Validation: Custom dimensions validation passed');
            return { success: true, errors: [] };

        } catch (error: any) {
            console.error('GTM GA4 Validation: Custom dimensions validation failed:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Run comprehensive validation
     */
    async runFullValidation(): Promise<ValidationResults> {
        return this.validateGA4DataFlow();
    }
}

export const validationService = new ValidationService();