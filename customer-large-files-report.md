# Customer Site - Large Files Report

**Generated:** December 17, 2024  
**Criteria:** Files with more than 500 lines of code  
**Total Files Found:** 35 files

## Files Sorted by Line Count (Descending)

| Rank | File Path | Lines | Type |
|------|-----------|-------|------|
| 1 | `customer/src/services/dynamicRemarketingService.ts` | 1,152 | Service | done
| 2 | `customer/src/services/performanceMonitor.ts` | 1,031 | Service | done
| 3 | `customer/src/services/gtmGA4Config.ts` | 897 | Config | done
| 4 | `customer/src/services/revenueAttributionReporter.ts` | 895 | Service | done
| 5 | `customer/src/services/productionMonitor.ts` | 885 | Service | done
| 6 | `customer/src/services/gtmService.ts` | 857 | Service | done
| 7 | `customer/src/services/googleAdsTracker.ts` | 847 | Service | done
| 8 | `customer/src/services/rollbackManager.ts` | 789 | Service |
| 9 | `customer/src/services/conversionValueOptimizer.ts` | 769 | Service |
| 10 | `customer/src/services/remarketingManager.ts` | 744 | Service |
| 11 | `customer/src/data/realTripAdvisorReviews.ts` | 735 | Data |
| 12 | `customer/src/services/tripAdvisorDataProcessor.ts` | 719 | Service |
| 13 | `customer/src/types/index.ts` | 717 | Types |
| 14 | `customer/src/services/__tests__/gtmIntegrationComprehensive.test.js` | 666 | Test |
| 15 | `customer/src/services/attributionService.ts` | 659 | Service |
| 16 | `customer/src/services/bookingFlowManager.ts` | 649 | Service |
| 17 | `customer/src/services/dataValidator.ts` | 628 | Service |
| 18 | `customer/src/components/MigrationDashboard.jsx` | 628 | Component |
| 19 | `customer/src/services/__tests__/endToEndBookingFlow.test.js` | 613 | Test |
| 20 | `customer/src/services/migrationMonitor.ts` | 610 | Service |
| 21 | `customer/src/services/conversionMonitor.ts` | 599 | Service |
| 22 | `customer/src/services/gtmGA4ManualTest.ts` | 584 | Test |
| 23 | `customer/src/services/__tests__/conversionAccuracyValidation.test.js` | 580 | Test |
| 24 | `customer/src/services/migrationService.ts` | 580 | Service |
| 25 | `customer/src/services/googleMerchantCenter/feedAutomationService.js` | 575 | Service |
| 26 | `customer/src/services/campaignOptimization/bidRecommendationEngine.ts` | 575 | Service |
| 27 | `customer/src/services/googleMerchantCenter/dynamicRemarketingService.js` | 566 | Service |
| 28 | `customer/src/services/__tests__/dataValidationAccuracy.test.js` | 562 | Test |
| 29 | `customer/src/services/offlineConversionService.ts` | 557 | Service |
| 30 | `customer/src/Components/Checkout/useCheckoutLogic.ts` | 544 | Hook |
| 31 | `customer/src/services/__tests__/gtmDebugValidation.test.js` | 521 | Test |
| 32 | `customer/src/data/schemaData.ts` | 520 | Data |
| 33 | `customer/src/Components/DatePicker.tsx` | 512 | Component |
| 34 | `customer/src/services/analytics/ecommerceTracking.ts` | 508 | Service |
| 35 | `customer/src/services/privacyManager.ts` | 503 | Service |

## Summary by File Type

- **Services:** 24 files (68.6%)
- **Tests:** 6 files (17.1%)
- **Components:** 2 files (5.7%)
- **Data:** 2 files (5.7%)
- **Types:** 1 file (2.9%)

## Key Observations

1. **Largest Files:** The top 3 files are all over 850 lines, with the dynamic remarketing service being the largest at 1,152 lines.

2. **Service-Heavy:** The majority of large files are service files, particularly related to:
   - Analytics and tracking (GTM, Google Ads, GA4)
   - Marketing automation (remarketing, campaign optimization)
   - Performance monitoring and migration management

3. **Test Coverage:** 6 comprehensive test files indicate good testing practices for complex functionality.

4. **Potential Refactoring Candidates:** Files over 800 lines might benefit from being split into smaller, more focused modules.

## Generated Command
```bash
find customer/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | awk '$1 > 500 {print $1, $2}' | sort -nr
```