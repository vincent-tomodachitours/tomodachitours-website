/**
 * Network state management hook for handling connectivity issues
 * Implements network disconnection handling as per requirement 5.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkState {
    isOnline: boolean;
    isSlowConnection: boolean;
    connectionType: string;
    lastOnlineTime: Date | null;
    reconnectAttempts: number;
    isReconnecting: boolean;
}

export interface NetworkStateHook extends NetworkState {
    checkConnection: () => Promise<boolean>;
    forceReconnect: () => void;
    resetReconnectAttempts: () => void;
}

const PING_TIMEOUT = 5000; // 5 seconds
const SLOW_CONNECTION_THRESHOLD = 2000; // 2 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 10000; // 10 seconds

/**
 * Hook for managing network connectivity state
 */
export function useNetworkState(): NetworkStateHook {
    const [networkState, setNetworkState] = useState<NetworkState>({
        isOnline: navigator.onLine,
        isSlowConnection: false,
        connectionType: getConnectionType(),
        lastOnlineTime: navigator.onLine ? new Date() : null,
        reconnectAttempts: 0,
        isReconnecting: false
    });

    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Get connection type from navigator
     */
    function getConnectionType(): string {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            return connection?.effectiveType || connection?.type || 'unknown';
        }
        return 'unknown';
    }

    /**
     * Ping server to check actual connectivity
     */
    const checkConnection = useCallback(async (): Promise<boolean> => {
        try {
            const startTime = Date.now();

            // Try to fetch a small resource from your API
            const response = await Promise.race([
                fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    mode: 'cors'
                }),
                new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), PING_TIMEOUT);
                })
            ]);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const isOnline = response.ok;
            const isSlowConnection = responseTime > SLOW_CONNECTION_THRESHOLD;

            setNetworkState(prev => ({
                ...prev,
                isOnline,
                isSlowConnection,
                connectionType: getConnectionType(),
                lastOnlineTime: isOnline ? new Date() : prev.lastOnlineTime,
                reconnectAttempts: isOnline ? 0 : prev.reconnectAttempts,
                isReconnecting: false
            }));

            return isOnline;
        } catch (error) {
            console.warn('Connection check failed:', error);

            setNetworkState(prev => ({
                ...prev,
                isOnline: false,
                isSlowConnection: false,
                connectionType: getConnectionType(),
                isReconnecting: false
            }));

            return false;
        }
    }, []);

    /**
     * Schedule reconnection attempt
     */
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            setNetworkState(prev => {
                if (prev.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    return prev; // Stop trying after max attempts
                }

                return {
                    ...prev,
                    reconnectAttempts: prev.reconnectAttempts + 1,
                    isReconnecting: true
                };
            });

            // Check connection
            checkConnection().then(isOnline => {
                if (!isOnline) {
                    // Schedule next attempt with exponential backoff
                    const delay = Math.min(
                        RECONNECT_INTERVAL * Math.pow(2, networkState.reconnectAttempts),
                        60000 // Max 1 minute
                    );

                    setTimeout(scheduleReconnect, delay);
                }
            });
        }, RECONNECT_INTERVAL);
    }, [checkConnection, networkState.reconnectAttempts]);

    /**
     * Handle online event
     */
    const handleOnline = useCallback(() => {
        console.log('Network: Online event detected');

        // Clear any pending reconnect attempts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Verify connection with server
        checkConnection();
    }, [checkConnection]);

    /**
     * Handle offline event
     */
    const handleOffline = useCallback(() => {
        console.log('Network: Offline event detected');

        setNetworkState(prev => ({
            ...prev,
            isOnline: false,
            isSlowConnection: false,
            connectionType: getConnectionType(),
            isReconnecting: false
        }));

        // Start reconnection attempts
        scheduleReconnect();
    }, [scheduleReconnect]);

    /**
     * Force reconnection attempt
     */
    const forceReconnect = useCallback(() => {
        setNetworkState(prev => ({
            ...prev,
            isReconnecting: true,
            reconnectAttempts: 0
        }));

        checkConnection();
    }, [checkConnection]);

    /**
     * Reset reconnect attempts
     */
    const resetReconnectAttempts = useCallback(() => {
        setNetworkState(prev => ({
            ...prev,
            reconnectAttempts: 0,
            isReconnecting: false
        }));

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    /**
     * Handle visibility change (tab focus/blur)
     */
    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === 'visible' && !networkState.isOnline) {
            // Check connection when tab becomes visible
            setTimeout(checkConnection, 1000);
        }
    }, [checkConnection, networkState.isOnline]);

    // Set up event listeners
    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial connection check
        const initialCheck = setTimeout(checkConnection, 1000);

        // Periodic connection check when online
        const periodicCheck = setInterval(() => {
            if (navigator.onLine && networkState.isOnline) {
                checkConnection();
            }
        }, 30000); // Check every 30 seconds

        // Capture ref values for cleanup
        const currentReconnectTimeout = reconnectTimeoutRef.current;
        const currentPingTimeout = pingTimeoutRef.current;

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            clearTimeout(initialCheck);
            clearInterval(periodicCheck);

            if (currentReconnectTimeout) {
                clearTimeout(currentReconnectTimeout);
            }

            if (currentPingTimeout) {
                clearTimeout(currentPingTimeout);
            }
        };
    }, [handleOnline, handleOffline, handleVisibilityChange, checkConnection, networkState.isOnline]);

    return {
        ...networkState,
        checkConnection,
        forceReconnect,
        resetReconnectAttempts
    };
}

/**
 * Hook for network-aware operations
 */
export function useNetworkAwareOperation() {
    const networkState = useNetworkState();
    const [pendingOperations, setPendingOperations] = useState<Array<{
        id: string;
        operation: () => Promise<any>;
        context: any;
        timestamp: Date;
    }>>([]);

    /**
     * Execute operation with network awareness
     */
    const executeOperation = useCallback(async <T>(
        operation: () => Promise<T>,
        context?: any,
        options?: {
            requireOnline?: boolean;
            queueWhenOffline?: boolean;
            timeout?: number;
        }
    ): Promise<T> => {
        const {
            requireOnline = true,
            queueWhenOffline = true,
            timeout = 30000
        } = options || {};

        // If operation requires online connection and we're offline
        if (requireOnline && !networkState.isOnline) {
            if (queueWhenOffline) {
                // Queue operation for when we're back online
                const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                setPendingOperations(prev => [...prev, {
                    id: operationId,
                    operation,
                    context,
                    timestamp: new Date()
                }]);

                throw new Error('Operation queued - you are currently offline');
            } else {
                throw new Error('This operation requires an internet connection');
            }
        }

        // Execute operation with timeout
        try {
            const result = await Promise.race([
                operation(),
                new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timeout')), timeout);
                })
            ]);

            return result;
        } catch (error) {
            // If it's a network error and we should queue, add to pending
            if (queueWhenOffline && isNetworkError(error)) {
                const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                setPendingOperations(prev => [...prev, {
                    id: operationId,
                    operation,
                    context,
                    timestamp: new Date()
                }]);
            }

            throw error;
        }
    }, [networkState.isOnline]);

    /**
     * Process pending operations when back online
     */
    useEffect(() => {
        if (networkState.isOnline && pendingOperations.length > 0) {
            console.log(`Processing ${pendingOperations.length} pending operations`);

            // Process operations in order
            const processOperations = async () => {
                const operations = [...pendingOperations];
                setPendingOperations([]);

                for (const { operation } of operations) {
                    try {
                        await operation();
                        console.log('Processed pending operation successfully');
                    } catch (error) {
                        console.error('Failed to process pending operation:', error);
                        // Could re-queue or handle differently based on error type
                    }
                }
            };

            // Small delay to ensure connection is stable
            setTimeout(processOperations, 2000);
        }
    }, [networkState.isOnline, pendingOperations]);

    /**
     * Clear pending operations
     */
    const clearPendingOperations = useCallback(() => {
        setPendingOperations([]);
    }, []);

    /**
     * Remove specific pending operation
     */
    const removePendingOperation = useCallback((operationId: string) => {
        setPendingOperations(prev => prev.filter(op => op.id !== operationId));
    }, []);

    return {
        ...networkState,
        executeOperation,
        pendingOperations,
        clearPendingOperations,
        removePendingOperation
    };
}

/**
 * Check if error is network-related
 */
function isNetworkError(error: any): boolean {
    if (!error) return false;

    const networkIndicators = [
        'network error',
        'failed to fetch',
        'connection failed',
        'timeout',
        'net::',
        'cors error'
    ];

    const errorString = (error.message || error.toString()).toLowerCase();
    return networkIndicators.some(indicator => errorString.includes(indicator)) ||
        error.name === 'NetworkError' ||
        error.code === 'NETWORK_ERROR';
}