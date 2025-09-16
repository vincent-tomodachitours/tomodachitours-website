# TypeScript Type Definitions

This directory contains all TypeScript type definitions for the customer application.

## File Structure

- **`index.ts`** - Main export file that re-exports all types from other files
- **`env.d.ts`** - Environment variable type definitions and global window extensions
- **`services.ts`** - Service layer interface definitions
- **`common.ts`** - Common data structures and utility types

## Usage

Import types from the main index file:

```typescript
import { TourData, BookingData, AnalyticsEvent } from '@/types';
```

Or import specific type categories:

```typescript
import { AnalyticsService, PaymentService } from '@/types/services';
import { ApiResponse, FormState } from '@/types/common';
```

## Type Categories

### Core Business Types
- `TourData` - Tour information and configuration
- `BookingData` - Booking details and customer information
- `PaymentInfo` - Payment processing data
- `CustomerInfo` - Customer details

### Service Interfaces
- `AnalyticsService` - Analytics tracking interface
- `PaymentService` - Payment processing interface
- `BookingService` - Booking management interface
- `TourService` - Tour data management interface

### Analytics & Tracking
- `AnalyticsEvent` - Analytics event structure
- `ConversionData` - Conversion tracking data
- `AttributionData` - Marketing attribution data
- `GoogleAdsConversionConfig` - Google Ads configuration

### Component Props
- `DatePickerProps` - DatePicker component props
- `PaymentFormProps` - Payment form component props
- `PriceDisplayProps` - Price display component props

### Utility Types
- `ApiResponse<T>` - Standard API response wrapper
- `ValidationResult<T>` - Data validation result
- `AsyncState<T>` - Async operation state
- `Result<T, E>` - Success/error result type

## Environment Variables

Environment variables are typed in `env.d.ts`. All `REACT_APP_*` variables are available with proper typing:

```typescript
// These are now type-safe
const apiUrl = process.env.REACT_APP_SUPABASE_URL; // string
const enableAnalytics = process.env.REACT_APP_ENABLE_ANALYTICS; // 'true' | 'false' | undefined
```

## Global Extensions

Window object extensions for third-party libraries:

```typescript
// These are now available with typing
window.gtag?.('event', 'conversion', data);
window.dataLayer?.push(event);
window.Stripe?.(publicKey);
```

## Migration Notes

These types are designed to support the gradual migration from JavaScript to TypeScript:

1. **Permissive Initially** - Types allow for gradual adoption
2. **Interface Compatibility** - Designed to match existing JavaScript patterns
3. **Service Abstractions** - Interfaces define contracts for service refactoring
4. **Component Props** - Typed props for React component conversion

## Best Practices

1. **Use Branded Types** for IDs to prevent mixing different ID types
2. **Prefer Interfaces** over type aliases for object shapes
3. **Use Discriminated Unions** for state management
4. **Leverage Utility Types** for common patterns
5. **Keep Types Close** to their usage when possible

## Future Enhancements

As the migration progresses, these types can be made more strict:

1. Enable `strict: true` in tsconfig.json
2. Add more specific validation rules
3. Convert `any` types to more specific types
4. Add runtime type validation where needed