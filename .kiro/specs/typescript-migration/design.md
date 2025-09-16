# Design Document

## Overview

This design outlines a phased approach to migrating the customer site from JavaScript to TypeScript. The migration will be done incrementally to maintain system stability while improving code quality, developer experience, and type safety. The approach leverages React Scripts' built-in TypeScript support and follows industry best practices for gradual migration.

## Architecture

### Migration Strategy

The migration follows a **bottom-up approach**, starting with utility functions and services, then moving to React components. This ensures that type definitions are established at the foundation level before converting components that depend on them.

### Phase Structure

1. **Phase 1: Setup & Configuration** - Configure TypeScript without breaking existing JavaScript
2. **Phase 2: Utilities & Services** - Convert core utilities and service files
3. **Phase 3: React Components** - Convert JSX components to TSX
4. **Phase 4: Integration & Cleanup** - Final integration and removal of JavaScript files

### Coexistence Strategy

During migration, JavaScript and TypeScript files will coexist using:
- **Gradual adoption**: TypeScript configuration allows both .js and .ts files
- **Incremental conversion**: Files converted one at a time with full testing
- **Type definitions**: Shared interfaces and types for cross-file compatibility

## Components and Interfaces

### TypeScript Configuration

```typescript
// tsconfig.json structure
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,           // Allow JS files during migration
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,           // Start with loose checking, tighten gradually
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
```

### Core Type Definitions

```typescript
// src/types/index.ts - Central type definitions
export interface TourData {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  images: string[];
}

export interface BookingData {
  tourId: string;
  date: string;
  participants: number;
  customerInfo: CustomerInfo;
  paymentInfo: PaymentInfo;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
}
```

### Service Layer Architecture

```typescript
// Service interfaces for type safety
export interface AnalyticsService {
  trackEvent(event: AnalyticsEvent): void;
  trackPageView(page: string): void;
  trackConversion(data: ConversionData): void;
}

export interface PaymentService {
  processPayment(data: PaymentData): Promise<PaymentResult>;
  validateCard(cardData: CardData): boolean;
}
```

## Data Models

### Migration File Structure

```
customer/src/
├── types/
│   ├── index.ts              # Central type definitions
│   ├── analytics.ts          # Analytics-specific types
│   ├── booking.ts            # Booking-related types
│   └── payment.ts            # Payment types
├── services/
│   ├── analytics.ts          # Converted from analytics.js
│   ├── googleAdsTracker.ts   # Converted from googleAdsTracker.js
│   └── remarketingManager.ts # Converted from remarketingManager.js
├── utils/
│   └── consoleSuppress.ts    # Converted from consoleSuppress.js
└── components/
    ├── PayjpPaymentForm.tsx  # Converted from PayjpPaymentForm.jsx
    └── ...other components
```

### Type Safety Levels

1. **Level 1 (Initial)**: Basic TypeScript with `any` types where needed
2. **Level 2 (Intermediate)**: Proper interface definitions for main data structures
3. **Level 3 (Strict)**: Full type coverage with strict TypeScript settings

### Environment Variables Typing

```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_GOOGLE_ADS_CONVERSION_ID: string;
    REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: string;
    REACT_APP_SUPABASE_URL: string;
    REACT_APP_SUPABASE_ANON_KEY: string;
    // ... other environment variables
  }
}
```

## Error Handling

### Migration Error Strategy

1. **Compilation Errors**: Address TypeScript compilation errors incrementally
2. **Runtime Compatibility**: Ensure converted files maintain runtime behavior
3. **Type Errors**: Start with loose typing, gradually increase strictness
4. **Build Process**: Maintain existing build pipeline throughout migration

### Error Monitoring

```typescript
// Error tracking during migration
interface MigrationError {
  file: string;
  error: string;
  phase: 'compilation' | 'runtime' | 'type-check';
  severity: 'low' | 'medium' | 'high';
}
```

## Testing Strategy

### Testing Approach

1. **Unit Tests**: Convert existing tests to TypeScript alongside source files
2. **Integration Tests**: Ensure TypeScript and JavaScript files work together
3. **Build Tests**: Verify build process works at each migration step
4. **Runtime Tests**: Confirm no behavioral changes after conversion

### Test File Migration

```typescript
// Example test conversion
// From: googleAdsTracker.test.js
// To: googleAdsTracker.test.ts

import { GoogleAdsTracker } from '../googleAdsTracker';
import { AnalyticsEvent } from '../../types';

describe('GoogleAdsTracker', () => {
  it('should track conversion events', () => {
    const event: AnalyticsEvent = {
      event: 'purchase',
      category: 'ecommerce',
      action: 'conversion'
    };
    // Test implementation
  });
});
```

### Validation Strategy

1. **Pre-migration**: Capture current behavior and outputs
2. **Post-migration**: Verify identical behavior after TypeScript conversion
3. **Type Validation**: Ensure type definitions match actual usage patterns
4. **Performance**: Monitor build times and bundle sizes

## Implementation Phases

### Phase 1: Setup & Configuration
- Install TypeScript dependencies
- Create tsconfig.json with permissive settings
- Configure build process to handle both JS and TS
- Set up type definition files

### Phase 2: Utilities & Services
- Convert utility functions (consoleSuppress.js → consoleSuppress.ts)
- Convert service files (googleAdsTracker.js → googleAdsTracker.ts)
- Create shared type definitions
- Update imports and exports

### Phase 3: React Components
- Convert JSX components to TSX
- Add prop type definitions
- Update component interfaces
- Maintain styling and functionality

### Phase 4: Integration & Cleanup
- Remove remaining JavaScript files
- Enable strict TypeScript settings
- Final type checking and cleanup
- Update documentation and build scripts

## Build Process Integration

### React Scripts Compatibility

React Scripts already supports TypeScript out of the box, so the existing build process will automatically:
- Compile TypeScript files
- Perform type checking
- Generate source maps
- Handle both JS and TS during migration

### Package.json Updates

```json
{
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/node": "^16.0.0",
    "typescript": "^4.9.0"
  }
}
```

## Risk Mitigation

### Rollback Strategy
- Maintain Git branches for each phase
- Keep original JavaScript files until full validation
- Incremental deployment with monitoring

### Compatibility Concerns
- Third-party library type definitions
- Environment variable access patterns
- Dynamic imports and require statements
- Build tool configuration changes