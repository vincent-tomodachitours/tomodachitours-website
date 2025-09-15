/**
 * Console Suppression Utility
 * Suppresses console logs when running on production domain
 */

// Check if we're on the production domain
const isProductionDomain = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'tomodachitours.com';
};

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    error: console.error
};

// Suppressed versions (no-op functions)
const suppressedMethods = {
    log: () => { },
    warn: () => { },
    info: () => { },
    debug: () => { },
    error: () => { } // You might want to keep errors, see below
};

/**
 * Initialize console suppression based on domain
 */
export const initializeConsoleSuppress = () => {
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
export const restoreConsole = () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
};

/**
 * Check if console is currently suppressed
 */
export const isConsoleSuppressed = () => {
    return console.log === suppressedMethods.log;
};

// Auto-initialize when module is imported
initializeConsoleSuppress();