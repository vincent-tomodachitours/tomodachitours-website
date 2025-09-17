/**
 * Session Management Service for Dynamic Remarketing
 */

import type { SessionData } from './types';

export class SessionService {
    private sessionData: SessionData;

    constructor() {
        this.sessionData = this.initializeSessionData();
    }

    /**
     * Initialize session data
     */
    private initializeSessionData(): SessionData {
        try {
            const sessionId = (typeof sessionStorage !== 'undefined' ?
                sessionStorage.getItem('analytics_session_id') : null) ||
                `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            return {
                sessionId,
                userId: (typeof localStorage !== 'undefined' ?
                    localStorage.getItem('user_id') : null) || sessionId,
                startTime: Date.now()
            };
        } catch (error) {
            console.warn('Session storage not available:', error);
            return {
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: null,
                startTime: Date.now()
            };
        }
    }

    /**
     * Get current session data
     */
    getCurrentSessionData(): SessionData {
        return this.sessionData;
    }

    /**
     * Update session data
     */
    updateSessionData(updates: Partial<SessionData>): void {
        this.sessionData = { ...this.sessionData, ...updates };
    }
}

export const sessionService = new SessionService();