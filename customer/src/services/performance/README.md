# Performance Monitor Service - Refactored

This directory contains the refactored Performance Monitor Service, broken down into smaller, more manageable modules for better maintainability and testing.

## Structure

### Core Files

- **`index.ts`** - Main service that orchestrates all components
- **`types.ts`** - All TypeScript interfaces and type definitions
- **`constants.ts`** - Configuration constants and static data

### Service Modules

- **`errorHandlingService.ts`** - Handles error tracking, retry logic, and global error handling
- **`metricsService.ts`** - Manages performance metrics collection and script monitoring
- **`reportingService.ts`** - Handles error reporting and batch processing
- **`lifecycleService.ts`** - Manages page lifecycle, visibility, and periodic tasks

### Shared Components (Reused)

- **`../shared/storageService.ts`** - Shared localStorage operations with error handling
- **`../dynamicRemarketing/sessionService.ts`** - Reused session management from dynamic remarketing

## Benefits of Refactoring

1. **Separation of Concerns** - Each service has a single responsibility
2. **Code Reuse** - Leverages existing session and storage services
3. **Easier Testing** - Individual components can be unit tested in isolation
4. **Better Maintainability** - Changes to one area don't affect others
5. **Improved Readability** - Smaller files are easier to understand

## Reused Components

This refactoring demonstrates good code reuse practices:

- **Session Management**: Reuses `sessionService` from dynamic remarketing instead of duplicating session logic
- **Storage Operations**: Creates a shared `storageService` that can be used across multiple services
- **Type Definitions**: Separates types that could potentially be shared with other services

## Usage

The main service maintains the same public API as before:

```typescript
import performanceMonitor from './performance';

// Same methods as before
performanceMonitor.initialize();
performanceMonitor.handleError(errorType, errorData);
performanceMonitor.recordMetric(metricType, metricData);
// etc.
```

## Migration

The original `performanceMonitor.ts` file now acts as a compatibility layer that re-exports the new modular service. This ensures existing code continues to work without changes.

## Individual Service Usage

You can also import and use individual services if needed:

```typescript
import { errorHandlingService } from './performance/errorHandlingService';
import { metricsService } from './performance/metricsService';

// Use specific services
errorHandlingService.handleError(errorType, errorData);
metricsService.recordMetric(metricType, metricData);
```

## Shared Services

The refactoring also introduces shared services that can be reused across the application:

```typescript
import { storageService } from '../shared/storageService';

// Safe localStorage operations
storageService.setItem('key', data);
const data = storageService.getItem('key');
```