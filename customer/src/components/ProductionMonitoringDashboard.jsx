/**
 * Production Monitoring Dashboard Component
 * Displays real-time tracking performance and health status
 * Requirements: 1.2, 4.1, 7.1, 6.2
 */

import React, { useState, useEffect } from 'react';

const ProductionMonitoringDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only show dashboard in production or when explicitly enabled
        if (process.env.NODE_ENV !== 'production' &&
            process.env.REACT_APP_ENABLE_MONITORING_DASHBOARD !== 'true') {
            setError('Monitoring dashboard is only available in production');
            setLoading(false);
            return;
        }

        loadDashboardData();

        // Refresh data every 30 seconds
        const interval = setInterval(loadDashboardData, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            // Import production monitor dynamically
            const { default: productionMonitor } = await import('../services/productionMonitor.js');

            if (!productionMonitor.initialized) {
                await productionMonitor.initialize();
            }

            const data = productionMonitor.getDashboardData();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            setError(`Failed to load monitoring data: ${err.message}`);
            console.error('Dashboard data loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return 'text-blue-600 bg-blue-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="text-red-600">
                    <h3 className="text-lg font-semibold mb-2">Monitoring Dashboard Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="text-gray-600">
                    <h3 className="text-lg font-semibold mb-2">No Monitoring Data</h3>
                    <p>Monitoring data is not available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Production Tracking Monitor
                </h2>
                <p className="text-gray-600">
                    Real-time monitoring of Google Ads analytics integration
                </p>
            </div>

            {/* Health Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dashboardData.health.status)}`}>
                            {dashboardData.health.status.toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Overall Status</p>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {dashboardData.alerts.active}
                        </div>
                        <p className="text-sm text-gray-600">Active Alerts</p>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {dashboardData.performance.errorRate ?
                                `${(dashboardData.performance.errorRate * 100).toFixed(1)}%` : '0%'}
                        </div>
                        <p className="text-sm text-gray-600">Error Rate</p>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {dashboardData.performance.avgScriptLoadTime ?
                                `${Math.round(dashboardData.performance.avgScriptLoadTime)}ms` : 'N/A'}
                        </div>
                        <p className="text-sm text-gray-600">Avg Load Time</p>
                    </div>
                </div>

                {/* Last Health Check */}
                {dashboardData.health.lastCheck && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                            Last health check: {new Date(dashboardData.health.lastCheck.timestamp).toLocaleString()}
                        </p>
                        {dashboardData.health.lastCheck.issues && dashboardData.health.lastCheck.issues.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-red-600">Issues:</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                    {dashboardData.health.lastCheck.issues.map((issue, index) => (
                                        <li key={index}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Script Loading</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Average Load Time:</span>
                                <span className="text-sm font-medium">
                                    {dashboardData.performance.avgScriptLoadTime ?
                                        `${Math.round(dashboardData.performance.avgScriptLoadTime)}ms` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tracking Calls</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Average Call Time:</span>
                                <span className="text-sm font-medium">
                                    {dashboardData.performance.avgTrackingCallTime ?
                                        `${Math.round(dashboardData.performance.avgTrackingCallTime)}ms` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Error Tracking</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Errors:</span>
                                <span className="text-sm font-medium">{dashboardData.performance.totalErrors}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recent Errors:</span>
                                <span className="text-sm font-medium">{dashboardData.performance.recentErrors}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Alerts */}
            {dashboardData.health.activeAlerts && dashboardData.health.activeAlerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>

                    <div className="space-y-3">
                        {dashboardData.health.activeAlerts.map((alert) => (
                            <div key={alert.id} className="border border-gray-200 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-900 font-medium">{alert.type}</p>
                                <p className="text-sm text-gray-600">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Alerts */}
            {dashboardData.health.recentAlerts && dashboardData.health.recentAlerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>

                    <div className="space-y-2">
                        {dashboardData.health.recentAlerts.slice(0, 5).map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-sm text-gray-900">{alert.type}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(alert.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Configuration Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Google Analytics 4:</span>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${process.env.REACT_APP_GA_MEASUREMENT_ID ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                }`}>
                                {process.env.REACT_APP_GA_MEASUREMENT_ID ? 'Configured' : 'Not Configured'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Google Ads Conversion:</span>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID &&
                                    !process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID.includes('XXXXXXXXXX') ?
                                    'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                }`}>
                                {process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID &&
                                    !process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID.includes('XXXXXXXXXX') ?
                                    'Configured' : 'Not Configured'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Google Tag Manager:</span>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${process.env.REACT_APP_GTM_CONTAINER_ID &&
                                    !process.env.REACT_APP_GTM_CONTAINER_ID.includes('GTM-XXXXXXX') ?
                                    'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                                }`}>
                                {process.env.REACT_APP_GTM_CONTAINER_ID &&
                                    !process.env.REACT_APP_GTM_CONTAINER_ID.includes('GTM-XXXXXXX') ?
                                    'Configured' : 'Optional'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Privacy Compliance:</span>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${process.env.REACT_APP_COOKIE_CONSENT_ENABLED === 'true' ?
                                    'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                                }`}>
                                {process.env.REACT_APP_COOKIE_CONSENT_ENABLED === 'true' ? 'Enabled' : 'Check Required'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={loadDashboardData}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Refresh Data
                </button>
            </div>
        </div>
    );
};

export default ProductionMonitoringDashboard;