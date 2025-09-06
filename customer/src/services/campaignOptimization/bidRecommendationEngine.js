// Bid Recommendation Engine
// Generates automated bid adjustment recommendations based on performance data

import { calculateConfidenceScore } from './utils.js';

class BidRecommendationEngine {
    constructor() {
        this.thresholds = {
            minConversions: 10,
            minImpressions: 1000,
            roasTarget: 3.0,
            conversionRateTarget: 2.0,
            costPerConversionTarget: 5000
        };
    }

    /**
     * Generate bid recommendations for a campaign
     * @param {Object} campaignData - Campaign performance data
     * @returns {Promise<Object>} Bid adjustment recommendations
     */
    async generateRecommendations(campaignData) {
        const recommendations = {
            timestamp: new Date().toISOString(),
            campaignId: campaignData.campaignId,
            currentBidStrategy: campaignData.bidStrategy || 'unknown',
            recommendations: [],
            adjustments: {},
            expectedImpact: {},
            confidenceLevel: 0
        };

        // Analyze current bid performance
        const bidAnalysis = this.analyzeBidPerformance(campaignData);

        // Generate keyword bid recommendations
        recommendations.adjustments.keywords = this.generateKeywordBidAdjustments(bidAnalysis);

        // Generate device bid recommendations
        recommendations.adjustments.devices = this.generateDeviceBidAdjustments(bidAnalysis);

        // Generate location bid recommendations
        recommendations.adjustments.locations = this.generateLocationBidAdjustments(bidAnalysis);

        // Generate audience bid recommendations
        recommendations.adjustments.audiences = this.generateAudienceBidAdjustments(bidAnalysis);

        // Generate time-based bid recommendations
        recommendations.adjustments.schedule = this.generateScheduleBidAdjustments(bidAnalysis);

        // Calculate expected impact
        recommendations.expectedImpact = this.calculateBidAdjustmentImpact(recommendations.adjustments);

        // Generate overall recommendations
        recommendations.recommendations = this.generateOverallBidRecommendations(bidAnalysis, recommendations.adjustments);

        // Calculate confidence level
        recommendations.confidenceLevel = this.calculateBidRecommendationConfidence(campaignData);

        return recommendations;
    }

    /**
     * Analyze bid performance across different dimensions
     * @param {Object} campaignData - Campaign data
     * @returns {Object} Bid performance analysis
     */
    analyzeBidPerformance(campaignData) {
        const analysis = {
            overallPerformance: {},
            keywordPerformance: [],
            devicePerformance: {},
            locationPerformance: {},
            audiencePerformance: {},
            timePerformance: {}
        };

        // Overall performance metrics
        analysis.overallPerformance = {
            roas: campaignData.conversionValue / (campaignData.cost || 1),
            conversionRate: (campaignData.conversions / (campaignData.clicks || 1)) * 100,
            costPerConversion: (campaignData.cost || 0) / (campaignData.conversions || 1),
            avgCpc: (campaignData.cost || 0) / (campaignData.clicks || 1),
            qualityScore: campaignData.avgQualityScore || 5
        };

        // Keyword performance analysis
        if (campaignData.keywords) {
            analysis.keywordPerformance = campaignData.keywords.map(keyword => ({
                ...keyword,
                roas: keyword.conversionValue / (keyword.cost || 1),
                conversionRate: (keyword.conversions / (keyword.clicks || 1)) * 100,
                costPerConversion: (keyword.cost || 0) / (keyword.conversions || 1),
                performanceScore: this.calculateKeywordPerformanceScore(keyword)
            }));
        }

        // Device performance analysis
        if (campaignData.deviceBreakdown) {
            analysis.devicePerformance = this.analyzeDevicePerformance(campaignData.deviceBreakdown);
        }

        // Location performance analysis
        if (campaignData.locationData) {
            analysis.locationPerformance = this.analyzeLocationPerformance(campaignData.locationData);
        }

        // Audience performance analysis
        if (campaignData.audienceData) {
            analysis.audiencePerformance = this.analyzeAudiencePerformanceForBids(campaignData.audienceData);
        }

        // Time-based performance analysis
        if (campaignData.timeData) {
            analysis.timePerformance = this.analyzeTimePerformance(campaignData.timeData);
        }

        return analysis;
    }

    /**
     * Generate keyword bid adjustments
     * @param {Object} bidAnalysis - Bid analysis data
     * @returns {Array} Keyword bid adjustments
     */
    generateKeywordBidAdjustments(bidAnalysis) {
        const adjustments = [];

        if (bidAnalysis.keywordPerformance.length === 0) {
            return adjustments;
        }

        bidAnalysis.keywordPerformance.forEach(keyword => {
            let adjustment = 0;
            let reason = '';

            // High-performing keywords
            if (keyword.roas > this.thresholds.roasTarget * 1.5 && keyword.conversions >= 3) {
                adjustment = 25; // Increase bid by 25%
                reason = `Excellent ROAS of ${keyword.roas.toFixed(2)}:1`;
            } else if (keyword.roas > this.thresholds.roasTarget && keyword.conversions >= 2) {
                adjustment = 15; // Increase bid by 15%
                reason = `Good ROAS of ${keyword.roas.toFixed(2)}:1`;
            }
            // Low-performing keywords
            else if (keyword.roas < 1 && keyword.cost > 5000) {
                adjustment = -50; // Decrease bid by 50%
                reason = `Poor ROAS of ${keyword.roas.toFixed(2)}:1`;
            } else if (keyword.roas < this.thresholds.roasTarget * 0.5) {
                adjustment = -25; // Decrease bid by 25%
                reason = `Below target ROAS of ${keyword.roas.toFixed(2)}:1`;
            }

            if (adjustment !== 0) {
                adjustments.push({
                    keyword: keyword.keyword,
                    currentBid: keyword.avgCpc || 0,
                    recommendedAdjustment: adjustment,
                    newBid: (keyword.avgCpc || 0) * (1 + adjustment / 100),
                    reason,
                    priority: Math.abs(adjustment) > 20 ? 'high' : 'medium',
                    expectedImpact: this.calculateKeywordAdjustmentImpact(keyword, adjustment)
                });
            }
        });

        return adjustments.sort((a, b) => Math.abs(b.recommendedAdjustment) - Math.abs(a.recommendedAdjustment));
    }

    /**
     * Generate device bid adjustments
     * @param {Object} bidAnalysis - Bid analysis data
     * @returns {Object} Device bid adjustments
     */
    generateDeviceBidAdjustments(bidAnalysis) {
        const adjustments = {};

        if (!bidAnalysis.devicePerformance || Object.keys(bidAnalysis.devicePerformance).length === 0) {
            return adjustments;
        }

        Object.entries(bidAnalysis.devicePerformance).forEach(([device, performance]) => {
            let adjustment = 0;
            let reason = '';

            const roas = performance.roas || 0;
            const conversionRate = performance.conversionRate || 0;

            // High-performing devices
            if (roas > this.thresholds.roasTarget * 1.3) {
                adjustment = 20;
                reason = `Strong ROAS of ${roas.toFixed(2)}:1 on ${device}`;
            } else if (roas > this.thresholds.roasTarget) {
                adjustment = 10;
                reason = `Good ROAS of ${roas.toFixed(2)}:1 on ${device}`;
            }
            // Low-performing devices
            else if (roas < this.thresholds.roasTarget * 0.7) {
                adjustment = -15;
                reason = `Below target ROAS of ${roas.toFixed(2)}:1 on ${device}`;
            }

            if (adjustment !== 0) {
                adjustments[device] = {
                    device,
                    currentAdjustment: 0, // Baseline
                    recommendedAdjustment: adjustment,
                    reason,
                    priority: Math.abs(adjustment) > 15 ? 'high' : 'medium',
                    expectedImpact: `${Math.abs(adjustment)}% change in ${device} performance`
                };
            }
        });

        return adjustments;
    }

    /**
     * Generate overall bid recommendations
     * @param {Object} bidAnalysis - Bid analysis data
     * @param {Object} adjustments - Specific adjustments
     * @returns {Array} Overall recommendations
     */
    generateOverallBidRecommendations(bidAnalysis, adjustments) {
        const recommendations = [];

        // Overall campaign performance recommendations
        const overallRoas = bidAnalysis.overallPerformance.roas || 0;
        const overallConversionRate = bidAnalysis.overallPerformance.conversionRate || 0;

        if (overallRoas > this.thresholds.roasTarget * 1.5) {
            recommendations.push({
                type: 'increase_budget',
                priority: 'high',
                title: 'Increase Campaign Budget',
                description: `Excellent ROAS of ${overallRoas.toFixed(2)}:1 indicates opportunity for growth`,
                action: 'Consider increasing daily budget by 30-50%',
                expectedImpact: 'Potential 25-40% increase in conversions'
            });
        }

        if (overallRoas < 1) {
            recommendations.push({
                type: 'optimize_targeting',
                priority: 'critical',
                title: 'Critical Performance Issues',
                description: `ROAS of ${overallRoas.toFixed(2)}:1 is below break-even`,
                action: 'Pause underperforming keywords and audiences immediately',
                expectedImpact: 'Stop losses and improve overall efficiency'
            });
        }

        // Keyword-specific recommendations
        if (adjustments.keywords && adjustments.keywords.length > 0) {
            const highPriorityKeywords = adjustments.keywords.filter(k => k.priority === 'high');
            if (highPriorityKeywords.length > 0) {
                recommendations.push({
                    type: 'keyword_optimization',
                    priority: 'high',
                    title: 'Critical Keyword Bid Adjustments',
                    description: `${highPriorityKeywords.length} keywords need immediate bid adjustments`,
                    action: 'Implement recommended keyword bid changes',
                    expectedImpact: 'Improve keyword-level ROAS by 15-30%'
                });
            }
        }

        // Device-specific recommendations
        if (adjustments.devices && Object.keys(adjustments.devices).length > 0) {
            const deviceCount = Object.keys(adjustments.devices).length;
            recommendations.push({
                type: 'device_optimization',
                priority: 'medium',
                title: 'Device Bid Adjustments',
                description: `${deviceCount} devices show performance variations`,
                action: 'Apply recommended device bid adjustments',
                expectedImpact: 'Optimize performance across all devices'
            });
        }

        // Quality Score recommendations
        const avgQualityScore = bidAnalysis.overallPerformance.qualityScore || 5;
        if (avgQualityScore < 6) {
            recommendations.push({
                type: 'quality_improvement',
                priority: 'medium',
                title: 'Improve Quality Score',
                description: `Average Quality Score of ${avgQualityScore} is below optimal`,
                action: 'Improve ad relevance, landing page experience, and expected CTR',
                expectedImpact: 'Reduce costs and improve ad positions'
            });
        }

        return recommendations;
    }

    /**
     * Calculate bid adjustment impact
     * @param {Object} adjustments - Bid adjustments
     * @returns {Object} Expected impact
     */
    calculateBidAdjustmentImpact(adjustments) {
        const impact = {
            estimatedCostChange: 0,
            estimatedConversionChange: 0,
            estimatedRevenueChange: 0,
            riskLevel: 'low'
        };

        // Calculate keyword impact
        if (adjustments.keywords && adjustments.keywords.length > 0) {
            const totalKeywordImpact = adjustments.keywords.reduce((sum, keyword) => {
                return sum + Math.abs(keyword.recommendedAdjustment);
            }, 0);

            impact.estimatedCostChange += totalKeywordImpact / adjustments.keywords.length;
        }

        // Calculate device impact
        if (adjustments.devices && Object.keys(adjustments.devices).length > 0) {
            const deviceAdjustments = Object.values(adjustments.devices);
            const avgDeviceImpact = deviceAdjustments.reduce((sum, device) => {
                return sum + Math.abs(device.recommendedAdjustment);
            }, 0) / deviceAdjustments.length;

            impact.estimatedCostChange += avgDeviceImpact * 0.3; // Device adjustments have less direct impact
        }

        // Estimate conversion and revenue changes
        impact.estimatedConversionChange = impact.estimatedCostChange * 0.8; // Assume 80% efficiency
        impact.estimatedRevenueChange = impact.estimatedConversionChange * 1.2; // Assume positive ROAS

        // Determine risk level
        if (impact.estimatedCostChange > 30) {
            impact.riskLevel = 'high';
        } else if (impact.estimatedCostChange > 15) {
            impact.riskLevel = 'medium';
        }

        return impact;
    }

    /**
     * Calculate bid recommendation confidence
     * @param {Object} campaignData - Campaign data
     * @returns {number} Confidence level (0-1)
     */
    calculateBidRecommendationConfidence(campaignData) {
        return calculateConfidenceScore(campaignData);
    }

    /**
     * Calculate keyword performance score
     * @param {Object} keyword - Keyword data
     * @returns {number} Performance score
     */
    calculateKeywordPerformanceScore(keyword) {
        const roas = keyword.conversionValue / (keyword.cost || 1);
        const conversionRate = (keyword.conversions / (keyword.clicks || 1)) * 100;
        const volume = keyword.impressions || 0;

        // Weighted score: ROAS (50%), Conversion Rate (30%), Volume (20%)
        const roasScore = Math.min(roas / this.thresholds.roasTarget * 50, 50);
        const conversionScore = Math.min(conversionRate / this.thresholds.conversionRateTarget * 30, 30);
        const volumeScore = Math.min(volume / 1000 * 20, 20);

        return roasScore + conversionScore + volumeScore;
    }

    /**
     * Calculate keyword adjustment impact
     * @param {Object} keyword - Keyword data
     * @param {number} adjustment - Bid adjustment percentage
     * @returns {string} Expected impact description
     */
    calculateKeywordAdjustmentImpact(keyword, adjustment) {
        const direction = adjustment > 0 ? 'increase' : 'decrease';
        const magnitude = Math.abs(adjustment);

        if (magnitude > 20) {
            return `Significant ${direction} in impressions and clicks expected`;
        } else if (magnitude > 10) {
            return `Moderate ${direction} in performance expected`;
        } else {
            return `Minor ${direction} in metrics expected`;
        }
    }

    // Placeholder methods for complex analysis functions
    analyzeDevicePerformance(deviceBreakdown) {
        const performance = {};

        Object.entries(deviceBreakdown).forEach(([device, data]) => {
            performance[device] = {
                roas: data.conversionValue / (data.cost || 1),
                conversionRate: (data.conversions / (data.clicks || 1)) * 100,
                costPerConversion: (data.cost || 0) / (data.conversions || 1)
            };
        });

        return performance;
    }

    analyzeLocationPerformance(locationData) {
        // Simplified location analysis
        return {
            topLocations: ['Tokyo', 'Osaka', 'Kyoto'],
            underperformingLocations: []
        };
    }

    analyzeAudiencePerformanceForBids(audienceData) {
        // Simplified audience analysis for bidding
        return {
            topAudiences: audienceData.slice(0, 3),
            adjustmentRecommendations: []
        };
    }

    analyzeTimePerformance(timeData) {
        // Simplified time-based analysis
        return {
            bestHours: [9, 10, 11, 19, 20, 21],
            worstHours: [1, 2, 3, 4, 5]
        };
    }

    generateLocationBidAdjustments() { return {}; }
    generateAudienceBidAdjustments() { return {}; }
    generateScheduleBidAdjustments() { return {}; }
}

export default BidRecommendationEngine;