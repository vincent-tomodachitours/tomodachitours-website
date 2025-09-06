import { Redis } from '@upstash/redis';
import { LogSeverity } from './SecurityLogger';

export interface LogEntry {
    id: string;
    timestamp: string;
    severity: LogSeverity;
    event: string;
    details: Record<string, unknown>;
    source: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    correlationId?: string;
    tags?: string[];
}

export interface LoggerConfig {
    redis: any;
    environment: 'development' | 'staging' | 'production';
    retentionDays?: number;
    maxLogsPerType?: number;
}

export interface LogOptions {
    correlationId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    tags?: string[];
} 