/**
 * Console Suppression Utility
 * Suppresses console logs when running on production domain
 */

// Type definitions for console methods
type ConsoleMethod = (...args: any[]) => void;

interface ConsoleMethodsMap {
    log: ConsoleMethod;
    warn: ConsoleMethod;
    info: ConsoleMethod;
    debug: ConsoleMethod;
    error: ConsoleMethod;
}

// Check if we're on the production domain
const isProductionDomain = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'tomodachitours.com';
};

// Store original console methods
const originalConsole: ConsoleMethodsMap = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    error: console.error
};

// Suppressed versions (no-op functions)
const suppressedMethods: ConsoleMethodsMap = {
    log: (): void => { },
    warn: (): void => { },
    info: (): void => { },
    debug: (): void => { },
    error: (): void => { } // You might want to keep errors, see below
};

/**
 * Initialize console suppression based on domain
 */
export const initializeConsoleSuppress = (): void => {
    if (isProductionDomain()) {
        // Override console methods with suppressed versions
        console.log = suppressedMethods.log;
        console.warn = suppressedMethods.warn;
        console.info = suppressedMethods.info;
        console.debug = suppressedMethods.debug;

        // Optionally keep console.error for critical debugging
        // Comment out the next line if you want to keep error logs
        console.error = suppressedMethods.error;
    }
};

/**
 * Restore original console methods (useful for testing)
 */
export const restoreConsole = (): void => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
};

/**
 * Check if console is currently suppressed
 */
export const isConsoleSuppressed = (): boolean => {
    return console.log === suppressedMethods.log;
};

// Auto-initialize when module is imported
initializeConsoleSuppress();