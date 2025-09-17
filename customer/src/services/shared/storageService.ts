/**
 * Shared Storage Service
 * Provides safe localStorage operations with error handling
 */

export class StorageService {
    private isPageVisible: boolean = true;

    constructor() {
        this.setupVisibilityHandling();
    }

    /**
     * Set up page visibility handling to prevent storage errors when page is hidden
     */
    private setupVisibilityHandling(): void {
        if (typeof document === 'undefined') return;

        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('blur', () => {
                this.isPageVisible = false;
            });

            window.addEventListener('focus', () => {
                this.isPageVisible = true;
            });
        }
    }

    /**
     * Safely store data in localStorage
     */
    setItem(key: string, value: any): boolean {
        try {
            // Don't store when page is hidden to prevent errors
            if (typeof localStorage === 'undefined' || !this.isPageVisible || document.hidden) {
                return false;
            }

            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            // Don't log storage errors when page is hidden
            if (this.isPageVisible && !document.hidden) {
                console.warn(`Failed to store data for key ${key}:`, error);
            }
            return false;
        }
    }

    /**
     * Safely retrieve data from localStorage
     */
    getItem<T = any>(key: string, defaultValue: T | null = null): T | null {
        try {
            if (typeof localStorage === 'undefined') return defaultValue;

            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(item);
            } catch {
                return item as T;
            }
        } catch (error) {
            console.warn(`Failed to retrieve data for key ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Safely remove item from localStorage
     */
    removeItem(key: string): boolean {
        try {
            if (typeof localStorage === 'undefined') return false;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove data for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear multiple items from localStorage
     */
    removeItems(keys: string[]): void {
        keys.forEach(key => this.removeItem(key));
    }

    /**
     * Check if localStorage is available
     */
    isAvailable(): boolean {
        return typeof localStorage !== 'undefined';
    }

    /**
     * Get current page visibility status
     */
    getPageVisibility(): boolean {
        return this.isPageVisible;
    }
}

export const storageService = new StorageService();