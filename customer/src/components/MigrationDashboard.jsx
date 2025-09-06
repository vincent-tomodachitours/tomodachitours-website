/**
 * Migration Dashboard Component
 * Provides monitoring and control interface for GTM migration
 */

import React, { useState, useEffect } from 'react';
import migrationService from '../services/migrationService';

const MigrationDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        loadDashboardData();

        let interval;
        if (autoRefresh) {
            interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const loadDashboardData = async () => {
        try {
            const data = migrationService.getMigrationDashboard();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleForceHealthCheck = async () => {
        setLoading(true);
        try {
            await migrationService.forceHealthCheck();
            await loadDashboardData();
        } catch (error) {
            console.error('Health check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestMigration = async () => {
        setLoading(true);
        try {
            const results = await migrationService.testMigrationSystem();
            alert(`Migration test ${results.overallSuccess ? 'passed' : 'failed'}. Check console for details.`);
            console.log('Migration test results:', results);
        } catch (error) {
            console.error('Migration test failed:', error);
            alert('Migration test failed. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all migration data?')) {
            migrationService.clearMigrationData();
            loadDashboardData();
        }
    };

    const handleExportData = () => {
        const data = migrationService.exportMigrationData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migration-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && !dashboardData) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading migration dashboard...</div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Failed to load migration dashboard</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>GTM Migration Dashboard</h2>
                <div style={styles.controls}>
                    <label style={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh
                    </label>
                    <button onClick={loadDashboardData} style={styles.button}>
                        Refresh
                    </button>
                    <button onClick={handleForceHealthCheck} style={styles.button}>
                        Health Check
                    </button>
                    <button onClick={handleTestMigration} style={styles.button}>
                        Test System
                    </button>
                    <button onClick={handleExportData} style={styles.button}>
                        Export Data
                    </button>
                    <button onClick={handleClearData} style={styles.dangerButton}>
                        Clear Data
                    </button>
                </div>
            </div>

            <div style={styles.tabs}>
                {['overview', 'monitoring', 'validation', 'rollback'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab ? styles.activeTab : {})
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div style={styles.content}>
                {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
                {activeTab === 'monitoring' && <MonitoringTab data={dashboardData.monitoringDashboard} />}
                {activeTab === 'validation' && <ValidationTab data={dashboardData.validationReport} />}
                {activeTab === 'rollback' && <RollbackTab data={dashboardData.rollbackStatus} />}
            </div>
        </div>
    );
};

const OverviewTab = ({ data }) => (
    <div style={styles.tabContent}>
        <div style={styles.section}>
            <h3>Migration Status</h3>
            <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                    <strong>Phase:</strong> {data.migrationStatus.phase}
                </div>
                <div style={styles.statusItem}>
                    <strong>Rollout:</strong> {data.migrationStatus.rolloutPercentage}%
                </div>
                <div style={styles.statusItem}>
                    <strong>GTM Enabled:</strong> {data.migrationStatus.shouldUseGTM ? 'Yes' : 'No'}
                </div>
                <div style={styles.statusItem}>
                    <strong>Parallel Tracking:</strong> {data.migrationStatus.shouldUseParallelTracking ? 'Yes' : 'No'}
                </div>
            </div>
        </div>

        <div style={styles.section}>
            <h3>System Health</h3>
            <div style={styles.healthIndicator}>
                <span style={{
                    ...styles.healthStatus,
                    backgroundColor: getHealthColor(data.monitoringDashboard.currentHealth)
                }}>
                    {data.monitoringDashboard.currentHealth.toUpperCase()}
                </span>
                <span style={styles.healthDetails}>
                    Last check: {data.monitoringDashboard.lastHealthCheck ?
                        new Date(data.monitoringDashboard.lastHealthCheck).toLocaleTimeString() : 'Never'}
                </span>
            </div>
        </div>

        <div style={styles.section}>
            <h3>Tracking Methods</h3>
            <div style={styles.trackingMethods}>
                <div style={styles.trackingMethod}>
                    <strong>Legacy:</strong> {data.trackingMethods.legacy ? '✅ Available' : '❌ Not Available'}
                </div>
                <div style={styles.trackingMethod}>
                    <strong>GTM:</strong> {data.trackingMethods.gtm ? '✅ Available' : '❌ Not Available'}
                </div>
            </div>
        </div>

        <div style={styles.section}>
            <h3>Recent Alerts</h3>
            <div style={styles.alertCount}>
                <span>Critical: {data.monitoringDashboard.criticalAlerts}</span>
                <span>Total: {data.monitoringDashboard.recentAlerts}</span>
            </div>
        </div>
    </div>
);

const MonitoringTab = ({ data }) => (
    <div style={styles.tabContent}>
        <div style={styles.section}>
            <h3>Health History</h3>
            <div style={styles.healthHistory}>
                {data.healthHistory?.slice(-6).map((check, index) => (
                    <div key={index} style={styles.healthHistoryItem}>
                        <div style={{
                            ...styles.healthDot,
                            backgroundColor: getHealthColor(check.overallHealth)
                        }}></div>
                        <span>{new Date(check.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
        </div>

        <div style={styles.section}>
            <h3>Recent Alerts</h3>
            <div style={styles.alertList}>
                {data.alertHistory?.slice(-5).map((alert, index) => (
                    <div key={index} style={styles.alertItem}>
                        <span style={{
                            ...styles.alertSeverity,
                            backgroundColor: alert.severity === 'critical' ? '#f44336' : '#ff9800'
                        }}>
                            {alert.severity}
                        </span>
                        <span style={styles.alertMessage}>{alert.message}</span>
                        <span style={styles.alertTime}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ValidationTab = ({ data }) => (
    <div style={styles.tabContent}>
        <div style={styles.section}>
            <h3>Validation Summary</h3>
            <div style={styles.validationGrid}>
                <div style={styles.validationItem}>
                    <strong>Total Comparisons:</strong> {data.summary?.totalComparisons || 0}
                </div>
                <div style={styles.validationItem}>
                    <strong>Discrepancy Rate:</strong> {data.summary?.discrepancyRate || 0}%
                </div>
                <div style={styles.validationItem}>
                    <strong>High Severity:</strong> {data.summary?.severityBreakdown?.high || 0}
                </div>
                <div style={styles.validationItem}>
                    <strong>Medium Severity:</strong> {data.summary?.severityBreakdown?.medium || 0}
                </div>
            </div>
        </div>

        <div style={styles.section}>
            <h3>Recent Comparisons</h3>
            <div style={styles.comparisonList}>
                {data.recentComparisons?.slice(-5).map((comparison, index) => (
                    <div key={index} style={styles.comparisonItem}>
                        <div style={styles.comparisonHeader}>
                            <span>ID: {comparison.trackingId}</span>
                            <span style={{
                                ...styles.comparisonSeverity,
                                backgroundColor: getSeverityColor(comparison.severity)
                            }}>
                                {comparison.severity || 'none'}
                            </span>
                        </div>
                        <div style={styles.comparisonDetails}>
                            <span>Legacy: {comparison.legacy?.success ? '✅' : '❌'}</span>
                            <span>GTM: {comparison.gtm?.success ? '✅' : '❌'}</span>
                            <span>Discrepancies: {comparison.discrepancies?.length || 0}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const RollbackTab = ({ data }) => (
    <div style={styles.tabContent}>
        <div style={styles.section}>
            <h3>Rollback Status</h3>
            <div style={styles.rollbackStatus}>
                <div style={styles.rollbackItem}>
                    <strong>Active:</strong> {data.isActive ? '🔴 Yes' : '🟢 No'}
                </div>
                <div style={styles.rollbackItem}>
                    <strong>In Progress:</strong> {data.inProgress ? '🔄 Yes' : '⏸️ No'}
                </div>
                <div style={styles.rollbackItem}>
                    <strong>Legacy Backup:</strong> {data.legacyBackupAvailable ? '✅ Available' : '❌ Not Available'}
                </div>
            </div>
        </div>

        {data.lastRollback && (
            <div style={styles.section}>
                <h3>Last Rollback</h3>
                <div style={styles.rollbackDetails}>
                    <div><strong>ID:</strong> {data.lastRollback.id}</div>
                    <div><strong>Reason:</strong> {data.lastRollback.reason}</div>
                    <div><strong>Success:</strong> {data.lastRollback.success ? '✅' : '❌'}</div>
                    <div><strong>Duration:</strong> {data.lastRollback.duration}ms</div>
                    <div><strong>Time:</strong> {new Date(data.lastRollback.timestamp).toLocaleString()}</div>
                </div>
            </div>
        )}

        <div style={styles.section}>
            <h3>Rollback History</h3>
            <div style={styles.rollbackHistory}>
                {data.history?.map((rollback, index) => (
                    <div key={index} style={styles.rollbackHistoryItem}>
                        <span style={{
                            ...styles.rollbackSuccess,
                            backgroundColor: rollback.success ? '#4caf50' : '#f44336'
                        }}>
                            {rollback.success ? '✅' : '❌'}
                        </span>
                        <span>{rollback.reason}</span>
                        <span>{new Date(rollback.timestamp).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Helper functions
const getHealthColor = (health) => {
    switch (health) {
        case 'healthy': return '#4caf50';
        case 'warning': return '#ff9800';
        case 'critical': return '#f44336';
        default: return '#9e9e9e';
    }
};

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'high': return '#f44336';
        case 'medium': return '#ff9800';
        case 'low': return '#ffeb3b';
        default: return '#4caf50';
    }
};

// Styles
const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    controls: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    button: {
        padding: '8px 16px',
        backgroundColor: '#2196f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    dangerButton: {
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    tabs: {
        display: 'flex',
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    tab: {
        flex: 1,
        padding: '15px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        borderBottom: '3px solid transparent'
    },
    activeTab: {
        borderBottomColor: '#2196f3',
        backgroundColor: '#f0f8ff'
    },
    content: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    tabContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    section: {
        borderBottom: '1px solid #eee',
        paddingBottom: '15px'
    },
    statusGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginTop: '10px'
    },
    statusItem: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    healthIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginTop: '10px'
    },
    healthStatus: {
        padding: '5px 15px',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    healthDetails: {
        color: '#666'
    },
    trackingMethods: {
        display: 'flex',
        gap: '20px',
        marginTop: '10px'
    },
    trackingMethod: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    alertCount: {
        display: 'flex',
        gap: '20px',
        marginTop: '10px'
    },
    healthHistory: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    healthHistoryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    healthDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%'
    },
    alertList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    },
    alertItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    alertSeverity: {
        padding: '2px 8px',
        color: 'white',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold'
    },
    alertMessage: {
        flex: 1
    },
    alertTime: {
        color: '#666',
        fontSize: '12px'
    },
    validationGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginTop: '10px'
    },
    validationItem: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    comparisonList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    },
    comparisonItem: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    comparisonHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px'
    },
    comparisonSeverity: {
        padding: '2px 8px',
        color: 'white',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold'
    },
    comparisonDetails: {
        display: 'flex',
        gap: '15px',
        fontSize: '12px',
        color: '#666'
    },
    rollbackStatus: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    },
    rollbackItem: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    rollbackDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    rollbackHistory: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    },
    rollbackHistoryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
    },
    rollbackSuccess: {
        padding: '2px 8px',
        color: 'white',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold'
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#666'
    },
    error: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#f44336'
    }
};

export default MigrationDashboard;