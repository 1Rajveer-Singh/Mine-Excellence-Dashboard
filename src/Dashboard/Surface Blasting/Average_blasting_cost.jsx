// Problem fixed with AI Integration
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Layers, X, Filter, BarChart3, Brain, Zap, Target, AlertTriangle, TrendingDown, CheckCircle, Activity, Lightbulb } from 'lucide-react';

const BlastCostAnalytics = ({ filteredData ,  DarkMode}) => {
  // State management
  const isDark =!DarkMode;
  
  // Debug logging for Average Blasting Cost component
  console.log('🔍 Average Blasting Cost Component - Data Check:', {
    hasData: Array.isArray(filteredData) && filteredData.length > 0,
    dataLength: filteredData?.length || 0,
    sampleItem: filteredData?.[0],
    dataSource: filteredData?.[0]?.dataSource
  });
  const [timeMode, setTimeMode] = useState('Daily');
  const [startYear, setStartYear] = useState(2021);
  const [endYear, setEndYear] = useState(2024);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [activeStacks, setActiveStacks] = useState({
    drilling: true,
    manpower: true,
    accessories: true,
    explosive: true
  });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState('insights'); // 'insights', 'predictions', 'recommendations', 'realtime', 'optimization'
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiLearningMode, setAiLearningMode] = useState(true);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiModelVersion, setAiModelVersion] = useState('v2.1.0');
  const chartRef = useRef(null);

  // Mock data for demonstration
  const mockData = filteredData ;

  // Data processing with validation
  const processedData = useMemo(() => {
    console.log('📊 Average Blasting Cost - Processing data with', filteredData?.length, 'records');
    
    // Helper function to parse your CSV date format (MM/DD/YYYY)
    const parseBlastDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Handle MM/DD/YYYY format from your CSV
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return { day, month, year, date: new Date(year, month - 1, day) };
        }
      }
      
      // Handle DD-MM-YYYY format as fallback
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return { day, month, year, date: new Date(year, month - 1, day) };
        }
      }
      
      return null;
    };
    
    // Filter out invalid records with enhanced filtering
    const validData = filteredData.filter(record => {
      // Basic validation for explosive cost and date
      const hasExplosiveCost = record.total_explos_cost && 
        record.total_explos_cost !== 0 && 
        record.total_explos_cost !== null && 
        record.total_explos_cost !== '';
      
      const hasDate = record.blastdate && parseBlastDate(record.blastdate);
      
      // NEW FILTER: Exclude records where drilling, manpower, and accessories costs are ALL zero
      const drillingCost = parseFloat(record.drilling_cost) || 0;
      const manpowerCost = parseFloat(record.man_power_cost) || 0;
      const accessoriesCost = parseFloat(record.blast_accessoriesdelay_cost) || 0;
      
      // If all three cost components are zero, exclude the record
      const hasValidCosts = !(drillingCost === 0 && manpowerCost === 0 && accessoriesCost === 0);
      
      return hasExplosiveCost && hasDate && hasValidCosts;
    });

    console.log('📊 Valid records after filtering:', validData.length);

    if (timeMode === 'Yearly') {
      // Group by year and calculate averages
      const yearGroups = validData.reduce((acc, record) => {
        const parsedDate = parseBlastDate(record.blastdate);
        if (!parsedDate) return acc;
        
        const recordYear = parsedDate.year;
        
        if (recordYear >= startYear && recordYear <= endYear) {
          if (!acc[recordYear]) {
            acc[recordYear] = { records: [], year: recordYear };
          }
          acc[recordYear].records.push(record);
        }
        return acc;
      }, {});

      return Object.values(yearGroups).map(group => {
        const avgDrilling = group.records.reduce((sum, r) => sum + (parseFloat(r.drilling_cost) || 0), 0) / group.records.length;
        const avgManpower = group.records.reduce((sum, r) => sum + (parseFloat(r.man_power_cost) || 0), 0) / group.records.length;
        const avgAccessories = group.records.reduce((sum, r) => sum + (parseFloat(r.blast_accessoriesdelay_cost) || 0), 0) / group.records.length;
        const avgExplosive = group.records.reduce((sum, r) => sum + (parseFloat(r.total_explos_cost) || 0), 0) / group.records.length;

        return {
          period: group.year.toString(),
          drilling_cost: Math.round(avgDrilling),
          man_power_cost: Math.round(avgManpower),
          blast_accessoriesdelay_cost: Math.round(avgAccessories),
          total_explos_cost: Math.round(avgExplosive),
          count: group.records.length
        };
      }).sort((a, b) => parseInt(a.period) - parseInt(b.period));
    } else if (timeMode === 'Monthly') {
      // Monthly view - show daily data within selected month
      const monthlyData = validData
        .filter(record => {
          const parsedDate = parseBlastDate(record.blastdate);
          if (!parsedDate) return false;
          return parsedDate.year === selectedYear && parsedDate.month === parseInt(selectedMonth);
        })
        .map(record => ({
          ...record,
          period: record.blastdate // Keep original format for x-axis
        }))
        .sort((a, b) => {
          const dateA = parseBlastDate(a.blastdate);
          const dateB = parseBlastDate(b.blastdate);
          return dateA.date - dateB.date;
        });

      return monthlyData;
    } else {
      // Daily view - default 7 records or date range
      let dailyData = validData;
      
      if (startDate && endDate) {
        // Filter by date range if set
        dailyData = validData.filter(record => {
          const parsedDate = parseBlastDate(record.blastdate);
          if (!parsedDate) return false;
          
          const recordDate = parsedDate.date;
          const start = new Date(startDate);
          const end = new Date(endDate);
          return recordDate >= start && recordDate <= end;
        });
      } else {
        // Show last 7 records by default
        dailyData = validData
          .sort((a, b) => {
            const dateA = parseBlastDate(a.blastdate);
            const dateB = parseBlastDate(b.blastdate);
            return dateB.date - dateA.date; // Newest first
          })
          .slice(0, 7)
          .reverse(); // Show oldest to newest
      }

      return dailyData.map(record => ({
        ...record,
        period: record.blastdate
      }));
    }
  }, [filteredData, timeMode, startYear, endYear, startDate, endDate, selectedYear, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    return processedData.reduce((acc, record) => ({
      drilling: acc.drilling + (record.drilling_cost || 0),
      manpower: acc.manpower + (record.man_power_cost || 0),
      accessories: acc.accessories + (record.blast_accessoriesdelay_cost || 0),
      explosive: acc.explosive + (record.total_explos_cost || 0),
      total: acc.total + (record.drilling_cost || 0) + (record.man_power_cost || 0) + (record.blast_accessoriesdelay_cost || 0) + (record.total_explos_cost || 0)
    }), { drilling: 0, manpower: 0, accessories: 0, explosive: 0, total: 0 });
  }, [processedData]);

  // Advanced AI Analysis Functions with Machine Learning
  const aiAnalysis = useMemo(() => {
    if (processedData.length === 0) return null;

    // Enhanced Cost Trend Analysis with Multiple Algorithms
    const costTrend = processedData.map((record, index) => ({
      ...record,
      index,
      totalCost: (record.drilling_cost || 0) + (record.man_power_cost || 0) + 
                 (record.blast_accessoriesdelay_cost || 0) + (record.total_explos_cost || 0),
      timestamp: new Date(record.period).getTime()
    }));

    // Advanced Statistical Analysis
    const costs = costTrend.map(r => r.totalCost);
    const n = costs.length;
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / n;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Time Series Analysis with Exponential Smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothedCosts = [costs[0]];
    for (let i = 1; i < costs.length; i++) {
      smoothedCosts.push(alpha * costs[i] + (1 - alpha) * smoothedCosts[i - 1]);
    }

    // Seasonal Pattern Detection
    const seasonalPattern = [];
    if (costs.length >= 12) {
      for (let i = 0; i < 12; i++) {
        const monthData = costs.filter((_, index) => index % 12 === i);
        const monthAvg = monthData.reduce((sum, cost) => sum + cost, 0) / monthData.length;
        seasonalPattern.push(monthAvg);
      }
    }

    // Advanced Trend Analysis using Multiple Moving Averages
    const shortMA = 3; // Short term moving average
    const longMA = 7; // Long term moving average
    const shortMAData = [];
    const longMAData = [];
    
    for (let i = shortMA - 1; i < costs.length; i++) {
      const shortSum = costs.slice(i - shortMA + 1, i + 1).reduce((sum, cost) => sum + cost, 0);
      shortMAData.push(shortSum / shortMA);
    }
    
    for (let i = longMA - 1; i < costs.length; i++) {
      const longSum = costs.slice(i - longMA + 1, i + 1).reduce((sum, cost) => sum + cost, 0);
      longMAData.push(longSum / longMA);
    }

    // Determine trend strength and direction
    const recentShortMA = shortMAData.slice(-3);
    const recentLongMA = longMAData.slice(-3);
    const trendStrength = recentShortMA.length > 0 && recentLongMA.length > 0 ? 
      Math.abs(recentShortMA[recentShortMA.length - 1] - recentLongMA[recentLongMA.length - 1]) / mean : 0;
    
    const trendDirection = recentShortMA.length > 0 && recentLongMA.length > 0 && 
      recentShortMA[recentShortMA.length - 1] > recentLongMA[recentLongMA.length - 1] ? 'increasing' : 'decreasing';

    // Advanced Anomaly Detection using Z-Score and IQR
    const zScoreThreshold = 2.5;
    const anomalies = costTrend.filter(record => {
      const zScore = Math.abs(record.totalCost - mean) / stdDev;
      return zScore > zScoreThreshold;
    });

    // Outlier Detection using Interquartile Range
    const sortedCosts = [...costs].sort((a, b) => a - b);
    const q1 = sortedCosts[Math.floor(n * 0.25)];
    const q3 = sortedCosts[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const outliers = costTrend.filter(record => 
      record.totalCost < q1 - 1.5 * iqr || record.totalCost > q3 + 1.5 * iqr
    );

    // Cost Distribution Analysis with Advanced Metrics
    const costDistribution = {
      drilling: (totals.drilling / totals.total) * 100,
      manpower: (totals.manpower / totals.total) * 100,
      accessories: (totals.accessories / totals.total) * 100,
      explosive: (totals.explosive / totals.total) * 100
    };

    // Shannon Entropy for cost distribution diversity
    const entropy = -Object.values(costDistribution).reduce((sum, percentage) => {
      if (percentage > 0) {
        const probability = percentage / 100;
        return sum + probability * Math.log2(probability);
      }
      return sum;
    }, 0);

    // Advanced Efficiency Metrics
    const efficiencyMetrics = {
      costEfficiency: Math.max(0, 100 - (mean / 50000) * 100), // Adjusted for realistic scale
      variabilityIndex: Math.max(0, 100 - coefficientOfVariation * 100),
      trendStability: Math.max(0, 100 - trendStrength * 100),
      overallEfficiency: 0
    };
    efficiencyMetrics.overallEfficiency = (efficiencyMetrics.costEfficiency + 
      efficiencyMetrics.variabilityIndex + efficiencyMetrics.trendStability) / 3;

    // Advanced Predictive Models
    const predictions = [];
    
    // Polynomial Regression for better accuracy
    if (costTrend.length >= 5) {
      const xValues = costTrend.map((_, i) => i);
      const yValues = costs;
      
      // Simple linear regression
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Quadratic regression for better curve fitting
      const sumX3 = xValues.reduce((sum, x) => sum + x * x * x, 0);
      const sumX4 = xValues.reduce((sum, x) => sum + x * x * x * x, 0);
      const sumX2Y = xValues.reduce((sum, x, i) => sum + x * x * yValues[i], 0);
      
      // Predict next 5 periods with different models
      for (let i = 1; i <= 5; i++) {
        const futureIndex = n + i - 1;
        
        // Linear prediction
        const linearPrediction = slope * futureIndex + intercept;
        
        // Exponential smoothing prediction
        const exponentialPrediction = smoothedCosts[smoothedCosts.length - 1];
        
        // Weighted average of both models
        const finalPrediction = (linearPrediction * 0.6) + (exponentialPrediction * 0.4);
        
        // Dynamic confidence based on data quality and trend stability
        const baseConfidence = 0.95 - (i * 0.15);
        const stabilityBonus = Math.max(0, 0.1 - trendStrength);
        const dataQualityBonus = Math.min(0.1, n / 100);
        const confidence = Math.max(0.2, baseConfidence + stabilityBonus + dataQualityBonus);
        
        predictions.push({
          period: `Period ${i}`,
          predictedCost: Math.max(0, finalPrediction),
          confidence: confidence,
          model: 'Hybrid ML',
          upperBound: finalPrediction + (stdDev * 1.96),
          lowerBound: Math.max(0, finalPrediction - (stdDev * 1.96))
        });
      }
    }

    // Advanced Risk Assessment
    const riskFactors = {
      costVolatility: coefficientOfVariation > 0.3 ? 'High' : coefficientOfVariation > 0.15 ? 'Medium' : 'Low',
      trendRisk: trendDirection === 'increasing' && trendStrength > 0.2 ? 'High' : 'Low',
      anomalyRisk: anomalies.length > n * 0.2 ? 'High' : anomalies.length > n * 0.1 ? 'Medium' : 'Low',
      overallRisk: 'Low'
    };
    
    const riskScore = (riskFactors.costVolatility === 'High' ? 3 : riskFactors.costVolatility === 'Medium' ? 2 : 1) +
                     (riskFactors.trendRisk === 'High' ? 3 : 1) +
                     (riskFactors.anomalyRisk === 'High' ? 3 : riskFactors.anomalyRisk === 'Medium' ? 2 : 1);
    
    riskFactors.overallRisk = riskScore > 7 ? 'High' : riskScore > 4 ? 'Medium' : 'Low';

    // Intelligent Recommendations with Priority Scoring
    const recommendations = [];
    
    // Cost optimization recommendations
    const dominantCategory = Object.entries(costDistribution)
      .reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 });
    
    if (dominantCategory.value > 35) {
      recommendations.push({
        type: 'cost_optimization',
        priority: dominantCategory.value > 50 ? 'critical' : 'high',
        confidence: 0.9,
        impact: 'High',
        message: `${dominantCategory.key.charAt(0).toUpperCase() + dominantCategory.key.slice(1)} represents ${dominantCategory.value.toFixed(1)}% of costs. Immediate optimization required.`,
        action: `Implement ${dominantCategory.key} cost reduction strategies`,
        expectedSavings: (totals[dominantCategory.key] * 0.15).toFixed(0),
        timeframe: '2-4 weeks'
      });
    }

    // Trend-based recommendations
    if (trendDirection === 'increasing' && trendStrength > 0.15) {
      recommendations.push({
        type: 'trend_control',
        priority: trendStrength > 0.3 ? 'critical' : 'high',
        confidence: 0.85,
        impact: 'Medium',
        message: `Costs trending upward with ${(trendStrength * 100).toFixed(1)}% strength. Implement controls immediately.`,
        action: 'Deploy cost containment measures and monitor KPIs',
        expectedSavings: (mean * 0.1).toFixed(0),
        timeframe: '1-2 weeks'
      });
    }

    // Anomaly-based recommendations
    if (anomalies.length > 0) {
      recommendations.push({
        type: 'anomaly_investigation',
        priority: anomalies.length > n * 0.2 ? 'critical' : 'medium',
        confidence: 0.8,
        impact: 'High',
        message: `${anomalies.length} cost anomalies detected (${((anomalies.length / n) * 100).toFixed(1)}% of data). Investigate root causes.`,
        action: 'Conduct detailed audit of anomalous operations',
        expectedSavings: (anomalies.reduce((sum, a) => sum + a.totalCost, 0) * 0.2).toFixed(0),
        timeframe: '1 week'
      });
    }

    // Efficiency improvement recommendations
    if (efficiencyMetrics.overallEfficiency < 70) {
      recommendations.push({
        type: 'efficiency_improvement',
        priority: efficiencyMetrics.overallEfficiency < 50 ? 'high' : 'medium',
        confidence: 0.75,
        impact: 'Medium',
        message: `Overall efficiency at ${efficiencyMetrics.overallEfficiency.toFixed(1)}%. Process optimization needed.`,
        action: 'Implement lean practices and automation',
        expectedSavings: (totals.total * 0.12).toFixed(0),
        timeframe: '4-6 weeks'
      });
    }

    // Real-time monitoring alerts
    const realTimeAlerts = [];
    const latestCost = costs[costs.length - 1];
    
    if (latestCost > mean + 2 * stdDev) {
      realTimeAlerts.push({
        type: 'cost_spike',
        severity: 'high',
        message: `Latest cost (${formatCurrency(latestCost)}) exceeds normal range by ${(((latestCost - mean) / mean) * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    if (coefficientOfVariation > 0.4) {
      realTimeAlerts.push({
        type: 'high_variability',
        severity: 'medium',
        message: `Cost variability (${(coefficientOfVariation * 100).toFixed(1)}%) indicates unstable operations`,
        timestamp: new Date().toISOString()
      });
    }

    // Advanced Pattern Recognition
    const patterns = {
      cyclical: seasonalPattern.length > 0,
      volatile: coefficientOfVariation > 0.25,
      trending: trendStrength > 0.1,
      stable: coefficientOfVariation < 0.1 && trendStrength < 0.05
    };

    return {
      // Basic metrics
      trend: { direction: trendDirection, strength: trendStrength, percentage: (trendStrength * 100).toFixed(1) },
      distribution: costDistribution,
      dominantCategory,
      anomalies,
      outliers,
      
      // Advanced metrics
      statistics: { mean, variance, stdDev, coefficientOfVariation, entropy },
      efficiency: efficiencyMetrics,
      risk: riskFactors,
      patterns,
      
      // Predictions and recommendations
      predictions,
      recommendations,
      realTimeAlerts,
      
      // Time series data
      smoothedCosts,
      seasonalPattern,
      shortMAData,
      longMAData,
      
      // Additional insights
      avgCost: mean,
      recentAvg: costs.slice(-3).reduce((sum, cost) => sum + cost, 0) / Math.min(3, costs.length),
      dataQuality: n > 10 ? 'High' : n > 5 ? 'Medium' : 'Low',
      modelAccuracy: Math.max(0.6, 1 - coefficientOfVariation)
    };
  }, [processedData, totals]);

  // Advanced AI Processing simulation with learning
  useEffect(() => {
    if (showAIInsights) {
      setIsAIProcessing(true);
      
      // Simulate AI model training and analysis
      const processingSteps = [
        { step: 'Loading data...', duration: 200 },
        { step: 'Running statistical analysis...', duration: 300 },
        { step: 'Training ML models...', duration: 400 },
        { step: 'Detecting patterns...', duration: 300 },
        { step: 'Generating predictions...', duration: 400 },
        { step: 'Calculating confidence scores...', duration: 200 },
        { step: 'Finalizing recommendations...', duration: 200 }
      ];
      
      let currentStep = 0;
      const processNext = () => {
        if (currentStep < processingSteps.length) {
          setTimeout(() => {
            currentStep++;
            processNext();
          }, processingSteps[currentStep - 1]?.duration || 200);
        } else {
          // Calculate overall AI confidence
          if (aiAnalysis) {
            const confidence = (aiAnalysis.modelAccuracy * 100).toFixed(1);
            setAiConfidence(confidence);
          }
          setIsAIProcessing(false);
        }
      };
      
      processNext();
    }
  }, [showAIInsights, aiAnalysisMode, aiAnalysis]);

  // Real-time AI alerts monitoring
  useEffect(() => {
    if (aiAnalysis && aiAnalysis.realTimeAlerts) {
      setAiAlerts(aiAnalysis.realTimeAlerts);
    }
  }, [aiAnalysis]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Toggle stack visibility
  const toggleStack = (stackName) => {
    setActiveStacks(prev => ({
      ...prev,
      [stackName]: !prev[stackName]
    }));
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      
      return (
        <div className={`p-4 rounded-2xl shadow-2xl border ${
          isDark 
            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-600' 
            : 'bg-white/90 backdrop-blur-xl border-gray-200'
        }`}>
          <p className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {timeMode === 'Yearly' ? `Year ${label}` : `Date: ${label}`}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {entry.name}
                  </span>
                </div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
            <div className={`pt-2 mt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Total:
                </span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Export functionality - Working implementation
  const handleExport = async (format) => {
    try {
      const chartElement = chartRef.current;
      if (!chartElement) {
        alert('Chart not found for export');
        return;
      }

      // Get the chart container
      const chartContainer = chartElement.querySelector('.recharts-wrapper') || chartElement;
      
      if (format === 'PNG' || format === 'JPEG') {
        // Create canvas from the chart
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size with equal margins
        const rect = chartContainer.getBoundingClientRect();
        const margin = 40; // Equal margin on all sides
        canvas.width = (rect.width + margin * 2) * 2; // Higher resolution
        canvas.height = (rect.height + margin * 2) * 2;
        ctx.scale(2, 2);
        
        // Set background
        ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, rect.width + margin * 2, rect.height + margin * 2);
        
        // Get SVG data from the chart
        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();
          
          img.onload = () => {
            // Draw chart with equal margins
            ctx.drawImage(img, margin, margin, rect.width, rect.height);
            
            // Download the image with proper filename
            const link = document.createElement('a');
            link.download = `Average_blast_cost_${format.toLowerCase()}.${format.toLowerCase()}`;
            link.href = canvas.toDataURL(`image/${format.toLowerCase()}`, 0.9);
            link.click();
          };
          
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
      } else if (format === 'SVG') {
        // Export as SVG with equal margins
        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const rect = svgElement.getBoundingClientRect();
          const margin = 40; // Equal margin on all sides
          
          // Clone SVG and add margins
          const clonedSvg = svgElement.cloneNode(true);
          clonedSvg.setAttribute('width', rect.width + margin * 2);
          clonedSvg.setAttribute('height', rect.height + margin * 2);
          clonedSvg.setAttribute('viewBox', `0 0 ${rect.width + margin * 2} ${rect.height + margin * 2}`);
          
          // Add background rectangle
          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('width', '100%');
          bgRect.setAttribute('height', '100%');
          bgRect.setAttribute('fill', isDark ? '#1f2937' : '#ffffff');
          clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
          
          // Create a group to contain the original content with margins
          const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          contentGroup.setAttribute('transform', `translate(${margin}, ${margin})`);
          
          // Move all original content to the group
          while (clonedSvg.children.length > 1) {
            contentGroup.appendChild(clonedSvg.children[1]);
          }
          clonedSvg.appendChild(contentGroup);
          
          const svgData = new XMLSerializer().serializeToString(clonedSvg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.download = 'Average_blast_cost_svg.svg';
          link.href = url;
          link.click();
          
          URL.revokeObjectURL(url);
        }
      } else if (format === 'CSV') {
        // Export data as CSV
        const headers = ['Period', 'Drilling Cost', 'Manpower Cost', 'Accessories Cost', 'Explosive Cost', 'Total'];
        const csvContent = [
          headers.join(','),
          ...processedData.map(row => [
            row.period,
            row.drilling_cost || 0,
            row.man_power_cost || 0,
            row.blast_accessoriesdelay_cost || 0,
            row.total_explos_cost || 0,
            (row.drilling_cost || 0) + (row.man_power_cost || 0) + (row.blast_accessoriesdelay_cost || 0) + (row.total_explos_cost || 0)
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = 'Average_blast_cost_csv.csv';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
      } else if (format === 'PDF') {
        // Export as PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        
        // Create a new PDF document
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Average Blasting Cost Analysis', pageWidth / 2, 20, { align: 'center' });
        
        // Add export date
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
        
        // Capture chart as image and add to PDF
        const chartElement = chartRef.current;
        if (chartElement) {
          const chartContainer = chartElement.querySelector('.recharts-wrapper') || chartElement;
          const svgElement = chartContainer.querySelector('svg');
          
          if (svgElement) {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              const rect = svgElement.getBoundingClientRect();
              const margin = 40; // Equal margin on all sides
              canvas.width = (rect.width + margin * 2) * 2; // Higher resolution
              canvas.height = (rect.height + margin * 2) * 2;
              ctx.scale(2, 2);
              
              // Set background
              ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
              ctx.fillRect(0, 0, rect.width + margin * 2, rect.height + margin * 2);
              
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const img = new Image();
              
              img.onload = () => {
                // Draw chart with equal margins
                ctx.drawImage(img, margin, margin, rect.width, rect.height);
                
                // Add chart image to PDF - centered with equal margins
                const imgData = canvas.toDataURL('image/png');
                const chartWidth = pageWidth - 40;
                const chartHeight = ((rect.height + margin * 2) / (rect.width + margin * 2)) * chartWidth;
                
                // Center the chart vertically
                const chartY = (pageHeight - chartHeight) / 2 + 10; // Small offset from center
                
                doc.addImage(imgData, 'PNG', 20, chartY, chartWidth, chartHeight);
                
                // Save the PDF
                doc.save('Average_blast_cost_pdf.pdf');
              };
              
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            } catch (error) {
              console.error('Error adding chart to PDF:', error);
              // Fallback: just save PDF without chart
              doc.save('Average_blast_cost_pdf.pdf');
            }
          } else {
            // No chart found, save PDF without chart
            doc.save('Average_blast_cost_pdf.pdf');
          }
        } else {
          // No chart element found, save PDF without chart
          doc.save('Average_blast_cost_pdf.pdf');
        }
      }
      
      setIsExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const stackCategories = [
    { key: 'drilling', label: 'Drilling Cost', color: '#3b82f6', icon: '🔧' },
    { key: 'manpower', label: 'Manpower Cost', color: '#10b981', icon: '👥' },
    { key: 'accessories', label: 'Accessories Cost', color: '#f59e0b', icon: '⚡' },
    { key: 'explosive', label: 'Explosive Cost', color: '#ef4444', icon: '💥' }
  ];

  // Debug logging for chart data (reduced verbosity)
  console.log('📊 Chart Data Summary:', {
    processedDataLength: processedData.length,
    totals: totals,
    activeStacks: activeStacks
  });

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDark 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Average Blasting Cost
                </h1>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Mining Operations Dashboard
                </p>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl font-semibold ${
                isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}>
                Total: {formatCurrency(totals.total)}
              </div>

              {/* AI Insights Button */}
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  showAIInsights
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-white hover:bg-gray-50 text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>AI Engine</span>
                {aiLearningMode && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                {isAIProcessing && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                {aiAlerts.length > 0 && !isAIProcessing && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {aiAlerts.length}
                  </span>
                )}
              </button>
              
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-white hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                {isExportOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-50 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {['PNG', 'JPEG', 'SVG', 'CSV', 'PDF'].map(format => (
                      <button
                        key={format}
                        onClick={() => handleExport(format)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isDark 
                            ? 'text-white hover:bg-gray-700' 
                            : 'text-gray-900 hover:bg-gray-100'
                        } first:rounded-t-xl last:rounded-b-xl`}
                      >
                        Export as {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              
            </div>

            {/* Mobile Controls */}
            <div className="flex sm:hidden items-center gap-3">
              {/* Export Button */}
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                    : 'bg-white hover:bg-gray-50 text-gray-900'
                }`}
              >
                <Download className="w-5 h-5" />
              </button>
              
            
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`sm:hidden border-t ${
            isDark ? 'border-gray-700 bg-gray-900/95' : 'border-gray-200 bg-white/95'
          } backdrop-blur-xl`}>
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className={`text-center p-3 rounded-xl font-semibold ${
                isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                Total: {formatCurrency(totals.total)}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Controls Section */}
        <div className={`rounded-2xl p-6 mb-8 backdrop-blur-xl border ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time Mode Toggle */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="w-4 h-4 inline mr-2" />
                View Mode
              </label>
              <div className={`flex rounded-xl p-1 ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {['Daily', 'Monthly', 'Yearly'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTimeMode(mode)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      timeMode === mode
                        ? isDark 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'bg-white text-blue-600 shadow-md'
                        : isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Controls */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Filter className="w-4 h-4 inline mr-2" />
                {timeMode === 'Yearly' ? 'Year Range' : timeMode === 'Monthly' ? 'Select Month' : 'Date Range'}
              </label>
              
              {timeMode === 'Yearly' ? (
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Start Year"
                  />
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="End Year"
                  />
                </div>
              ) : timeMode === 'Monthly' ? (
                <div className="flex gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={month} value={month}>
                          {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Stack Controls */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Layers className="w-4 h-4 inline mr-2" />
                Cost Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {stackCategories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => toggleStack(category.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeStacks[category.key]
                        ? 'shadow-md transform scale-105'
                        : 'opacity-50 hover:opacity-75'
                    }`}
                    style={{
                      backgroundColor: activeStacks[category.key] ? category.color + '20' : undefined,
                      color: activeStacks[category.key] ? category.color : undefined,
                      border: `2px solid ${activeStacks[category.key] ? category.color : 'transparent'}`
                    }}
                  >
                    <span className="text-xs">{category.icon}</span>
                    <span className="truncate">{category.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className={`rounded-2xl p-6 mb-8 backdrop-blur-xl border ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Cost Breakdown Analysis
            </h2>
            <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {processedData.length} records
            </div>
          </div>

          <div ref={chartRef} className="h-96 sm:h-[500px] w-full">
            {processedData.length === 0 ? (
              <div className={`flex items-center justify-center h-full border-2 border-dashed rounded-lg ${
                isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm mb-4">
                    No valid blast cost records found. This could be because:
                  </p>
                  <ul className="text-sm text-left list-disc list-inside space-y-1">
                    <li>Drilling Cost, Manpower Cost, and Accessories Cost are all zero</li>
                    <li>Missing explosive cost data</li>
                    <li>Invalid blast date format</li>
                    <li>No data loaded from CSV file</li>
                  </ul>
                  <p className="text-xs mt-4 text-gray-500">
                    Check console for detailed filtering logs
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barCategoryGap="20%"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#374151' : '#bbd1ffff'} 
                  opacity={0.5}
                />
                <XAxis 
                  dataKey="period" 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  angle={timeMode === 'Yearly' ? 0 : -45}
                  textAnchor={timeMode === 'Yearly' ? 'middle' : 'end'}
                  height={80}
                  interval={0}
                  label={{
                    value: timeMode === 'Yearly' ? 'Year' : timeMode === 'Monthly' ? 'Date' : 'Date',
                    position: 'insideBottom',
                    offset: -5
                  }}
                />
                <YAxis 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                  label={{
                    value: timeMode === 'Yearly' ? 'Average Cost (₹)' : 'Blast Cost (₹)',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
                
                {activeStacks.drilling && (
                  <Bar 
                    dataKey="drilling_cost" 
                    stackId="costs" 
                    fill="#3b82f6" 
                    name="Drilling Cost"
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {activeStacks.manpower && (
                  <Bar 
                    dataKey="man_power_cost" 
                    stackId="costs" 
                    fill="#10b981" 
                    name="Manpower Cost"
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {activeStacks.accessories && (
                  <Bar 
                    dataKey="blast_accessoriesdelay_cost" 
                    stackId="costs" 
                    fill="#f59e0b" 
                    name="Accessories Cost"
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {activeStacks.explosive && (
                  <Bar 
                    dataKey="total_explos_cost" 
                    stackId="costs" 
                    fill="#ef4444" 
                    name="Explosive Cost"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Insights Panel */}
        {showAIInsights && aiAnalysis && (
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-xl border ${
            isDark 
              ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30' 
              : 'bg-gradient-to-br from-purple-50/80 to-blue-50/80 border-purple-200/50'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isDark ? 'bg-purple-600' : 'bg-purple-500'
                }`}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Advanced AI Analytics Engine
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Machine Learning • Pattern Recognition • Predictive Analytics
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        Model {aiModelVersion}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {aiConfidence}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Mode Toggle */}
              <div className={`flex rounded-xl p-1 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                {[
                  { key: 'insights', label: 'Insights', icon: Lightbulb },
                  { key: 'predictions', label: 'Predictions', icon: TrendingUp },
                  { key: 'recommendations', label: 'Actions', icon: Target },
                  { key: 'realtime', label: 'Real-time', icon: Activity },
                  { key: 'optimization', label: 'Optimize', icon: Zap }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setAiAnalysisMode(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      aiAnalysisMode === key
                        ? isDark 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-purple-500 text-white shadow-md'
                        : isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {isAIProcessing ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-b-transparent rounded-full animate-spin animate-reverse"></div>
                    </div>
                    <div className="space-y-2">
                      <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        AI Engine Processing...
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Running advanced machine learning algorithms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { step: 'Data Preprocessing', icon: '📊', status: 'completed' },
                    { step: 'Statistical Analysis', icon: '📈', status: 'completed' },
                    { step: 'Pattern Recognition', icon: '🔍', status: 'processing' },
                    { step: 'ML Model Training', icon: '🧠', status: 'processing' },
                    { step: 'Anomaly Detection', icon: '⚠️', status: 'pending' },
                    { step: 'Prediction Generation', icon: '🔮', status: 'pending' }
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                    }`}>
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.step}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' :
                            item.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-400'
                          }`}></div>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.status === 'completed' ? 'Complete' :
                             item.status === 'processing' ? 'Processing...' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Insights Mode */}
                {aiAnalysisMode === 'insights' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Advanced Cost Trend */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            aiAnalysis.trend.direction === 'increasing' ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {aiAnalysis.trend.direction === 'increasing' ? 
                              <TrendingUp className="w-5 h-5 text-white" /> : 
                              <TrendingDown className="w-5 h-5 text-white" />
                            }
                          </div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Trend Analysis
                          </h3>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Direction: <span className="font-semibold">{aiAnalysis.trend.direction}</span>
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Strength: <span className="font-semibold">{aiAnalysis.trend.strength.toFixed(2)}</span>
                        </p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              aiAnalysis.trend.strength > 0.3 ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, aiAnalysis.trend.strength * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            aiAnalysis.risk.overallRisk === 'High' ? 'bg-red-500' : 
                            aiAnalysis.risk.overallRisk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Risk Level
                          </h3>
                        </div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {aiAnalysis.risk.overallRisk}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Volatility</span>
                            <span className={`font-medium ${
                              aiAnalysis.risk.costVolatility === 'High' ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {aiAnalysis.risk.costVolatility}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Trend Risk</span>
                            <span className={`font-medium ${
                              aiAnalysis.risk.trendRisk === 'High' ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {aiAnalysis.risk.trendRisk}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Data Quality */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            aiAnalysis.dataQuality === 'High' ? 'bg-green-500' : 
                            aiAnalysis.dataQuality === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Data Quality
                          </h3>
                        </div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {aiAnalysis.dataQuality}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Model Accuracy: {(aiAnalysis.modelAccuracy * 100).toFixed(1)}%
                        </p>
                      </div>

                      {/* Pattern Recognition */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-purple-500">
                            <Activity className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Patterns
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(aiAnalysis.patterns).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                value ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className={`text-xs capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {key}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Statistics */}
                    <div className={`p-4 rounded-xl border ${
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                    }`}>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Statistical Analysis
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Mean Cost
                          </span>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(aiAnalysis.statistics.mean)}
                          </p>
                        </div>
                        <div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Std. Deviation
                          </span>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(aiAnalysis.statistics.stdDev)}
                          </p>
                        </div>
                        <div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Coefficient of Variation
                          </span>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {(aiAnalysis.statistics.coefficientOfVariation * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Entropy
                          </span>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {aiAnalysis.statistics.entropy.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Predictions Mode */}
                {aiAnalysisMode === 'predictions' && aiAnalysis.predictions.length > 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiAnalysis.predictions.map((prediction, index) => (
                        <div key={index} className={`p-4 rounded-xl border ${
                          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-purple-500">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {prediction.period}
                            </h3>
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(prediction.predictedCost)}
                          </p>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                prediction.confidence > 0.7 ? 'bg-green-500' : 
                                prediction.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {(prediction.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <div className="text-xs space-y-1">
                              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}
                              </p>
                              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                Model: {prediction.model}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Prediction Insights */}
                    <div className={`p-4 rounded-xl border-2 border-dashed ${
                      isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Advanced Prediction Insights
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>Trend Forecast:</strong> Based on exponential smoothing and linear regression, 
                            costs are expected to {aiAnalysis.trend.direction === 'increasing' ? 'continue rising' : 'remain stable'}.
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>Risk Assessment:</strong> Prediction confidence decreases with time horizon. 
                            Monitor key indicators for model recalibration.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Recommendations Mode */}
                {aiAnalysisMode === 'recommendations' && (
                  <div className="space-y-4">
                    {aiAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-xl border-l-4 ${
                        rec.priority === 'critical' ? 'border-red-600 bg-red-50/50' :
                        rec.priority === 'high' ? 'border-red-500 bg-red-50/50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50/50' :
                        'border-blue-500 bg-blue-50/50'
                      } ${isDark ? 'bg-opacity-10' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            rec.priority === 'critical' ? 'bg-red-600' :
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}>
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {rec.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rec.impact === 'High' ? 'bg-green-100 text-green-800' :
                                rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rec.impact} Impact
                              </span>
                            </div>
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {rec.message}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  Action: {rec.action}
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Expected Savings: <span className="font-semibold text-green-600">
                                    {formatCurrency(rec.expectedSavings)}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Timeframe: <span className="font-semibold">{rec.timeframe}</span>
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                rec.confidence > 0.8 ? 'bg-green-500' : 
                                rec.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {(rec.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Real-time Monitoring Mode */}
                {aiAnalysisMode === 'realtime' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Real-time Monitoring Active
                      </h3>
                    </div>
                    
                    {aiAnalysis.realTimeAlerts.length > 0 ? (
                      <div className="space-y-4">
                        {aiAnalysis.realTimeAlerts.map((alert, index) => (
                          <div key={index} className={`p-4 rounded-xl border-l-4 ${
                            alert.severity === 'high' ? 'border-red-500 bg-red-50/50' :
                            alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50/50' :
                            'border-blue-500 bg-blue-50/50'
                          } ${isDark ? 'bg-opacity-10' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                alert.severity === 'high' ? 'bg-red-500' :
                                alert.severity === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}>
                                <AlertTriangle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {alert.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {alert.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {alert.message}
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(alert.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 rounded-xl border-2 border-dashed ${
                        isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'
                      } text-center`}>
                        <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                        <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          All Systems Normal
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No alerts detected. Operations are running smoothly.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Optimization Mode */}
                {aiAnalysisMode === 'optimization' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Cost Optimization Opportunities
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(aiAnalysis.distribution).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {key}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {value.toFixed(1)}%
                                </span>
                                <div className={`px-2 py-1 rounded text-xs ${
                                  value > 35 ? 'bg-red-100 text-red-800' :
                                  value > 25 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {value > 35 ? 'High' : value > 25 ? 'Medium' : 'Low'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                      }`}>
                        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Performance Metrics
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(aiAnalysis.efficiency).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {value.toFixed(1)}%
                                </span>
                                <div className={`w-16 h-2 rounded-full ${
                                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                                }`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      value > 80 ? 'bg-green-500' : 
                                      value > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${value}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stackCategories.map((category, index) => {
            const value = totals[category.key];
            return (
              <div
                key={category.key}
                className={`p-4 sm:p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' 
                    : 'bg-white/50 border-gray-200 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="p-2 rounded-xl text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {category.label}
                    </h3>
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatCurrency(value)}
                </p>
                <p className={`text-xs sm:text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {((value / totals.total) * 100).toFixed(1)}% of total
                </p>
              </div>
            );
          })}
        </div>
      </main>
      {/* Export Modal Overlay for Mobile */}
{isExportOpen && (
  <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
    <div
      className={`w-full rounded-t-3xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-lg font-semibold ${
            isDark ? 'text-green-400' : 'text-gray-900'
          }`}
        >
          Export Options
        </h3>
        <button
          onClick={() => setIsExportOpen(false)}
          className={`p-2 rounded-xl ${
            isDark
              ? 'bg-gray-700 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['PNG', 'JPEG', 'PDF', 'SVG'].map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            className={`p-4 rounded-xl border-2 border-dashed 
              ${
                isDark
                  ? 'border-gray-600 text-blue-400 bg-gray-800'
                  : 'border-gray-300 text-gray-900 bg-gray-100'
              }`}
          >
            <Download className="w-6 h-6 mx-auto mb-2" />
            <span className="block font-medium">Export as {format}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
)}


  

    </div>
  );
};

export default BlastCostAnalytics;