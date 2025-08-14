import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sun, Moon, Download, TrendingUp, TrendingDown, FileText, BarChart3, Calendar, Database, Brain, Zap, Target, AlertTriangle, CheckCircle, Activity, Lightbulb, Search, MessageSquare } from 'lucide-react';
// Removed direct import for html2canvas as it causes resolution issues in some environments.
// import html2canvas from 'html2canvas'; // This line is removed.
import jsPDF from 'jspdf';


const BlastCostDashboard = ({ filteredData, DarkMode }) => {
  // Sample data - in real implementation, this would come from API/CSV
  const sampleData = filteredData || []; // Ensure sampleData is always an array

  // Chart reference for export functionality
  const chartRef = React.useRef(null);

  // State management
  const isDarkMode = (!DarkMode);
  const [timeMode, setTimeMode] = useState('daily');
  const [powderFactorType, setPowderFactorType] = useState('actual');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [startYear, setStartYear] = useState('2022');
  const [endYear, setEndYear] = useState('2024');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // AI related states
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState('insights'); // 'insights', 'predictions', 'recommendations', 'realtime', 'optimization'
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiLearningMode, setAiLearningMode] = useState(true); // Placeholder for future learning mode
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiModelVersion, setAiModelVersion] = useState('v3.1.0'); // Updated model version


  // Data processing
  const processedData = useMemo(() => {
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-');
      return new Date(year, month - 1, day);
    };

    // First filter out invalid records
    const validRecords = sampleData.filter(item => {
      const hasValidCost = item.total_exp_cost !== undefined &&
                           item.total_exp_cost !== null &&
                           item.total_exp_cost !== 0 &&
                           item.avg_col_weight !== undefined &&
                           item.avg_col_weight !== null &&
                           item.avg_col_weight !== 0;

      const hasValidPF = (powderFactorType === 'actual' && item.actual_pf_ton_kg !== undefined && item.actual_pf_ton_kg !== null && item.actual_pf_ton_kg !== 0) ||
                         (powderFactorType === 'theoretical' && item.theoretical_pf_ton_kg !== undefined && item.theoretical_pf_ton_kg !== null && item.theoretical_pf_ton_kg !== 0);

      return hasValidCost && hasValidPF && item.blastdate;
    });

    const filteredData = validRecords.filter(item => {
      const date = parseDate(item.blastdate);

      if (timeMode === 'daily') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set time to 00:00:00 for accurate date comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      } else if (timeMode === 'monthly') {
        return date.getFullYear().toString() === selectedYear &&
               (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
      } else if (timeMode === 'yearly') {
        const year = date.getFullYear();
        return year >= parseInt(startYear) && year <= parseInt(endYear);
      }
      return true;
    });

    if (timeMode === 'yearly') {
      // Group by year and combine data
      const yearlyData = {};
      filteredData.forEach(item => {
        const date = parseDate(item.blastdate);
        const year = date.getFullYear();

        if (!yearlyData[year]) {
          yearlyData[year] = {
            date: new Date(year, 0, 1),
            total_cost: 0,
            total_weight: 0,
            total_pf: 0,
            count: 0
          };
        }

        yearlyData[year].total_cost += item.total_exp_cost;
        yearlyData[year].total_weight += item.avg_col_weight;
        yearlyData[year].total_pf += powderFactorType === 'actual'
          ? item.actual_pf_ton_kg
          : item.theoretical_pf_ton_kg;
        yearlyData[year].count++;
      });

      // Convert to array and calculate averages
      return Object.entries(yearlyData)
        .map(([year, data]) => ({
          date: year, // Keep year as string for XAxis
          cost_per_ton: data.total_cost / data.total_weight,
          powder_factor: data.total_pf / data.count
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    }

    // For daily and monthly views, sort by date
    return filteredData.map(item => ({
      ...item,
      date: parseDate(item.blastdate),
      cost_per_ton: item.total_exp_cost / item.avg_col_weight,
      powder_factor: powderFactorType === 'actual'
        ? item.actual_pf_ton_kg
        : item.theoretical_pf_ton_kg
    })).sort((a, b) => a.date - b.date);
  }, [sampleData, timeMode, startDate, endDate, selectedYear, selectedMonth, startYear, endYear, powderFactorType]);

  // Statistics calculations
  const statistics = useMemo(() => {
    if (processedData.length === 0) return { minCost: 0, maxCost: 0, avgCost: 0, avgPowderFactor: 0, totalRecords: 0 };

    const costs = processedData.map(item => item.cost_per_ton).filter(c => !isNaN(c));
    const powderFactors = processedData.map(item => item.powder_factor).filter(pf => !isNaN(pf));

    return {
      minCost: costs.length > 0 ? Math.min(...costs) : 0,
      maxCost: costs.length > 0 ? Math.max(...costs) : 0,
      avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      avgPowderFactor: powderFactors.length > 0 ? powderFactors.reduce((a, b) => a + b, 0) / powderFactors.length : 0,
      totalRecords: processedData.length
    };
  }, [processedData]);

  // Chart data preparation
  const chartData = useMemo(() => {
    // For yearly view, 'date' is already the year string
    if (timeMode === 'yearly') {
      return processedData.map(item => ({
        date: item.date, // This is already the year string
        cost_per_ton: parseFloat(item.cost_per_ton.toFixed(2)),
        powder_factor: parseFloat(item.powder_factor.toFixed(3))
      }));
    }

    // For daily and monthly views, format the date for X-axis display
    return processedData.map(item => ({
      date: item.date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: timeMode === 'daily' ? 'numeric' : undefined // Show year only for daily
      }),
      cost_per_ton: parseFloat(item.cost_per_ton.toFixed(2)),
      powder_factor: parseFloat(item.powder_factor.toFixed(3)),
      total_cost: item.total_exp_cost, // Keep original values for CSV export
      weight: item.avg_col_weight // Keep original values for CSV export
    }));
  }, [processedData, timeMode]);

  // AI Analysis Logic
  const aiAnalysis = useMemo(() => {
    if (processedData.length < 5) return null; // Need sufficient data for meaningful AI

    const costs = processedData.map(item => item.cost_per_ton).filter(c => !isNaN(c) && c > 0);
    const powderFactors = processedData.map(item => item.powder_factor).filter(pf => !isNaN(pf) && pf > 0);

    if (costs.length < 5 || powderFactors.length < 5) return null;

    const n = costs.length;

    // --- Statistical Analysis ---
    const calculateStats = (data) => {
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;
      return { mean, stdDev, cv };
    };

    const costStats = calculateStats(costs);
    const pfStats = calculateStats(powderFactors);

    // --- Trend Analysis (using Linear Regression on time index) ---
    const calculateTrend = (data) => {
      const dataLength = data.length;
      const xValues = data.map((_, i) => i);
      const yValues = data;
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
      const dataMean = sumY / dataLength;

      const denominator = (dataLength * sumX2 - sumX * sumX);
      const slope = denominator !== 0 ? (dataLength * sumXY - sumX * sumY) / denominator : 0;
      const direction = slope > 0.001 ? 'increasing' : (slope < -0.001 ? 'decreasing' : 'stable');
      const strength = Math.abs(slope * (dataLength / (dataMean || 1))); // Normalized slope as strength
      return { slope, direction, strength };
    };

    const costTrend = calculateTrend(costs);
    const pfTrend = calculateTrend(powderFactors);

    // --- Anomaly Detection (Z-Score, IQR, and EWMA) ---
    const detectAnomalies = (data, stats) => {
      const anomalies = [];
      const zScoreThreshold = 2.5;
      const ewmaAlpha = 0.2;
      const ewmaStdDevMultiplier = 2.5;

      let ewma = data[0];
      for (let i = 0; i < data.length; i++) {
        const value = data[i];

        // Z-score
        if (stats.stdDev > 0) {
          const zScore = Math.abs(value - stats.mean) / stats.stdDev;
          if (zScore > zScoreThreshold) {
            anomalies.push({ type: 'Z-Score', value, index: i, severity: zScore > 3.5 ? 'high' : 'medium' });
          }
        }

        // EWMA
        if (i > 0) {
          ewma = ewmaAlpha * value + (1 - ewmaAlpha) * ewma;
          const deviation = Math.abs(value - ewma);
          const ewmaStdDev = stats.stdDev * (1 - Math.pow(1 - ewmaAlpha, 2 * i)) / (1 - Math.pow(1 - ewmaAlpha, 2)); // Simplified approx
          if (ewmaStdDev > 0 && deviation > ewmaStdDevMultiplier * ewmaStdDev) {
            anomalies.push({ type: 'EWMA', value, index: i, severity: deviation > (ewmaStdDevMultiplier * 1.5) * ewmaStdDev ? 'high' : 'medium' });
          }
        }
      }

      // IQR
      const sortedData = [...data].sort((a, b) => a - b);
      const q1 = sortedData[Math.floor(data.length * 0.25)];
      const q3 = sortedData[Math.floor(data.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      data.forEach((value, i) => {
        if (value < lowerBound || value > upperBound) {
          anomalies.push({ type: 'IQR', value, index: i, severity: 'high' });
        }
      });

      // Filter unique anomalies and assign highest severity
      const uniqueAnomalies = {};
      anomalies.forEach(a => {
        const key = `${a.index}-${a.value}`;
        if (!uniqueAnomalies[key] || (uniqueAnomalies[key].severity === 'medium' && a.severity === 'high')) {
          uniqueAnomalies[key] = a;
        }
      });

      return Object.values(uniqueAnomalies);
    };

    const costAnomalies = detectAnomalies(costs, costStats);
    const pfAnomalies = detectAnomalies(powderFactors, pfStats);


    // --- Predictive Analytics (Adaptive Hybrid Model) ---
    const predictFuture = (data, trendStats, currentStats, numPeriods = 3) => {
      const predictions = [];
      const xValues = data.map((_, i) => i);
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = data.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

      const denominator = (n * sumX2 - sumX * sumX);
      const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
      const intercept = (sumY - slope * sumX) / n;

      // Adaptive weighting: more linear if strong trend, more exponential if stable
      const linearWeight = Math.min(0.8, 0.5 + (trendStats.strength * 2));
      const expSmoothWeight = 1 - linearWeight;

      for (let i = 1; i <= numPeriods; i++) {
        const futureIndex = n + i - 1;
        const linearPrediction = slope * futureIndex + intercept;
        const exponentialPrediction = data[data.length - 1]; // Simple last value for exponential smoothing for prediction

        const finalPrediction = (linearPrediction * linearWeight) + (exponentialPrediction * expSmoothWeight);

        // Confidence based on data length, variability, and prediction horizon
        const baseConfidence = 0.95 - (i * 0.15);
        const stabilityBonus = Math.max(0, 0.1 - currentStats.cv);
        const dataQualityBonus = Math.min(0.1, n / 100);
        const confidence = Math.max(0.2, baseConfidence + stabilityBonus + dataQualityBonus);

        const upperBound = finalPrediction + (currentStats.stdDev * 1.96);
        const lowerBound = Math.max(0, finalPrediction - (currentStats.stdDev * 1.96));

        predictions.push({
          period: `Next Period ${i}`,
          predictedValue: Math.max(0, finalPrediction),
          confidence: confidence,
          upperBound,
          lowerBound
        });
      }
      return predictions;
    };

    const costPredictions = predictFuture(costs, costTrend, costStats);
    const pfPredictions = predictFuture(powderFactors, pfTrend, pfStats);

    // --- Risk Assessment ---
    const overallRisk = (costStats.cv > 0.3 ? 3 : costStats.cv > 0.15 ? 2 : 1) +
                        (costTrend.direction === 'increasing' && costTrend.strength > 0.2 ? 3 : 1) +
                        (costAnomalies.length / n > 0.2 ? 3 : costAnomalies.length / n > 0.1 ? 2 : 1);
    const riskLevel = overallRisk > 7 ? 'High' : overallRisk > 4 ? 'Medium' : 'Low';

    // --- Recommendations ---
    const recommendations = [];

    if (costStats.cv > 0.25) {
      recommendations.push({
        type: 'Cost Volatility Control',
        priority: costStats.cv > 0.4 ? 'critical' : 'high',
        message: `Cost per ton volatility is high (${(costStats.cv * 100).toFixed(1)}%). This indicates unpredictable expenses.`,
        action: 'Standardize operational procedures, review equipment maintenance schedules, and stabilize material sourcing.',
        expectedImpact: 'Reduce cost fluctuations by 10-15%.',
        rootCauseHint: 'Inconsistent operational practices, variable material quality, or equipment downtime.'
      });
    }

    if (costTrend.direction === 'increasing' && costTrend.strength > 0.1) {
      recommendations.push({
        type: 'Cost Escalation Management',
        priority: costTrend.strength > 0.2 ? 'critical' : 'high',
        message: `Cost per ton is trending upwards (${(costTrend.strength * 100).toFixed(1)}% strength). This can impact profitability.`,
        action: 'Conduct a detailed cost-benefit analysis for each cost component (explosives, drilling, manpower). Negotiate better supplier rates.',
        expectedImpact: 'Stabilize or reduce average cost per ton.',
        rootCauseHint: 'Rising raw material costs, increased labor expenses, or inefficient resource allocation.'
      });
    }

    if (pfTrend.direction === 'decreasing' && pfTrend.strength > 0.1) {
      recommendations.push({
        type: 'Powder Factor Optimization',
        priority: pfTrend.strength > 0.2 ? 'critical' : 'high',
        message: `Powder Factor is decreasing (${(pfTrend.strength * 100).toFixed(1)}% strength). This implies less efficient blasting.`,
        action: 'Review blast design parameters (burden, spacing, sub-drilling), explosive type, and initiation sequence. Conduct field trials.',
        expectedImpact: 'Improve fragmentation and overall blasting efficiency.',
        rootCauseHint: 'Suboptimal blast design, incorrect explosive selection, or geological variations.'
      });
    }

    if (costAnomalies.length > 0) {
      const highSeverityCostAnomalies = costAnomalies.filter(a => a.severity === 'high');
      if (highSeverityCostAnomalies.length > 0) {
        recommendations.push({
          type: 'Cost Anomaly Investigation',
          priority: 'critical',
          message: `${highSeverityCostAnomalies.length} high-severity cost anomalies detected. These are significant deviations from normal operations.`,
          action: `Immediately investigate specific blasts on dates: ${highSeverityCostAnomalies.map(a => processedData[a.index]?.date || 'N/A').join(', ')}.`,
          expectedImpact: 'Identify and mitigate root causes of extreme cost events.',
          rootCauseHint: 'Equipment malfunction, unexpected geological conditions, or supply chain disruptions.'
        });
      }
    }

    if (pfAnomalies.length > 0) {
      const highSeverityPfAnomalies = pfAnomalies.filter(a => a.severity === 'high');
      if (highSeverityPfAnomalies.length > 0) {
        recommendations.push({
          type: 'Powder Factor Anomaly Investigation',
          priority: 'high',
          message: `${highSeverityPfAnomalies.length} high-severity powder factor anomalies detected. These indicate unusual blasting performance.`,
          action: `Review blast logs and field conditions for blasts on dates: ${highSeverityPfAnomalies.map(a => processedData[a.index]?.date || 'N/A').join(', ')}.`,
          expectedImpact: 'Understand and correct deviations in blasting efficiency.',
          rootCauseHint: 'Changes in rock mass characteristics, inconsistent drilling, or charging errors.'
        });
      }
    }

    // --- Real-time Alerts ---
    const realTimeAlerts = [];
    const latestCost = costs[costs.length - 1];
    const latestPF = powderFactors[powderFactors.length - 1];

    if (costStats.stdDev > 0 && latestCost > costStats.mean + 2 * costStats.stdDev) {
      realTimeAlerts.push({
        type: 'Cost Spike',
        severity: 'high',
        message: `Latest cost per ton (${latestCost.toFixed(2)}) is significantly above average.`,
        timestamp: new Date().toISOString()
      });
    }
    if (pfStats.stdDev > 0 && latestPF < pfStats.mean - 1.5 * pfStats.stdDev) { // Low PF is usually bad
      realTimeAlerts.push({
        type: 'Low Powder Factor',
        severity: 'high',
        message: `Latest powder factor (${latestPF.toFixed(3)}) is significantly below average, indicating potential inefficiency.`,
        timestamp: new Date().toISOString()
      });
    }


    return {
      costStats,
      pfStats,
      costTrend,
      pfTrend,
      costAnomalies,
      pfAnomalies,
      costPredictions,
      pfPredictions,
      overallRisk: riskLevel,
      recommendations,
      realTimeAlerts,
      dataQuality: n > 10 ? 'High' : n > 5 ? 'Medium' : 'Low',
      modelAccuracy: Math.max(0.6, 1 - Math.max(costStats.cv, pfStats.cv)) // Combined CV for overall accuracy
    };

  }, [processedData, powderFactorType]);

  // Simulate AI processing time
  useEffect(() => {
    if (showAIInsights) {
      setIsAIProcessing(true);
      const timer = setTimeout(() => {
        if (aiAnalysis) {
          setAiConfidence((aiAnalysis.modelAccuracy * 100).toFixed(1));
        }
        setIsAIProcessing(false);
      }, 1500 + Math.random() * 1000);
      return () => clearTimeout(timer);
    }
  }, [showAIInsights, aiAnalysisMode, aiAnalysis]);

  // Update AI alerts
  useEffect(() => {
    if (aiAnalysis && aiAnalysis.realTimeAlerts) {
      setAiAlerts(aiAnalysis.realTimeAlerts);
    }
  }, [aiAnalysis]);


  // Export functions
  const exportAsImage = useCallback(async (format) => {
    setIsExporting(true);
    try {
      // FIX: Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');

      // Wait for a short moment to ensure any recent state changes are rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use the chartRef to target the specific chart container
      const chartContainer = chartRef.current;
      if (!chartContainer) {
        throw new Error('Chart container reference is null');
      }

      // Find the chart wrapper inside our container
      const chartElement = chartContainer.querySelector('.recharts-wrapper');
      if (!chartElement) {
        throw new Error('Chart element not found within the container');
      }

      // Use html2canvas for better rendering
      const canvas = await html2canvas(chartElement, {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        allowTaint: true
      });

      // Create a new, larger canvas that includes space for title and metadata
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');

      // Add padding for title area
      const titleHeight = 70;
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + titleHeight;

      // Fill background
      ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Add title and metadata
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Blast Cost Analytics - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`, finalCanvas.width / 2, 30);
      ctx.font = '16px Arial';
      ctx.fillText(`${statistics.totalRecords} records | Generated: ${new Date().toLocaleDateString()}`, finalCanvas.width / 2, 55);

      // Draw the chart canvas onto our new canvas
      ctx.drawImage(canvas, 0, titleHeight);

      // Export the canvas
      const dataUrl = finalCanvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, format === 'jpeg' ? 0.95 : 1.0);

      // Create download link
      const link = document.createElement('a');
      link.download = `blast-cost-analytics-${timeMode}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = dataUrl;
      link.click();

      setIsExporting(false);
      setExportMenuOpen(false);
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      alert(`Export failed: ${error.message}. Please try CSV or text export.`);
      setIsExporting(false);
      setExportMenuOpen(false);
    }
  }, [isDarkMode, timeMode, statistics]);

  // Simplified export functions that use the common exportAsImage function
  const exportAsPNG = useCallback(() => exportAsImage('png'), [exportAsImage]);
  const exportAsJPEG = useCallback(() => exportAsImage('jpeg'), [exportAsImage]);

  // Direct SVG export (more reliable)
  const exportAsSVG = useCallback(() => {
    setIsExporting(true);
    try {
      if (!chartRef.current) {
        throw new Error('Chart container reference is null');
      }

      // Find the SVG element within our chart container
      const svgElement = chartRef.current.querySelector('.recharts-surface');
      if (!svgElement) {
        throw new Error('SVG element not found within the chart container');
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);

      // Set explicit size if not already present
      if (!svgClone.hasAttribute('width') || !svgClone.hasAttribute('height')) {
        const rect = svgElement.getBoundingClientRect();
        svgClone.setAttribute('width', rect.width);
        svgClone.setAttribute('height', rect.height);
      }

      // Create SVG with proper XML declaration and namespace
      const svgContent = svgClone.outerHTML;
      const fullSvgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${svgClone.getAttribute('width')}" height="${svgClone.getAttribute('height')}" style="background-color: ${isDarkMode ? '#1f2937' : '#ffffff'}">
  <title>Blast Cost Analytics - ${timeMode}</title>
  <desc>Generated on: ${new Date().toLocaleString()}</desc>
  ${svgContent.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
</svg>`;

      // Create download link
      const blob = new Blob([fullSvgContent], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `blast-cost-chart-${timeMode}-${new Date().toISOString().split('T')[0]}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('SVG export failed:', error);
      alert('SVG export failed. Please try CSV or text export.');
    }
    setIsExporting(false);
    setExportMenuOpen(false);
  }, [timeMode, isDarkMode]);

  // PDF export with only chart
  const exportAsPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      // FIX: Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');

      if (!chartRef.current) {
        throw new Error('Chart container reference is null');
      }

      // Find the chart wrapper inside our container
      const chartElement = chartRef.current.querySelector('.recharts-wrapper');
      if (!chartElement) {
        throw new Error('Chart element not found within the container');
      }

      // Create canvas representation of chart with better quality
      const canvas = await html2canvas(chartElement, {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        scale: 2.5, // Higher scale for better resolution
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Create PDF with appropriate size and orientation
      // jsPDF is already imported at the top, so no dynamic import needed here.

      // Use landscape orientation for better chart display
      const doc = new jsPDF('l', 'mm', 'a4');

      // A4 landscape dimensions
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 15;

      // Add title and metadata
      doc.setFontSize(18);
      doc.text('Blast Cost Analytics Dashboard', margin, margin + 5);

      doc.setFontSize(12);
      doc.text(`${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View - Powder Factor: ${powderFactorType}`, margin, margin + 12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 19);

      // Add date range info
      let dateRangeText = '';
      if (timeMode === 'daily') {
        dateRangeText = `Date Range: ${startDate} to ${endDate}`;
      } else if (timeMode === 'monthly') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        dateRangeText = `Month: ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
      } else {
        dateRangeText = `Year Range: ${startYear} to ${endYear}`;
      }
      doc.text(dateRangeText, margin, margin + 26);

      // Add basic statistics
      doc.setFontSize(10);
      doc.text(`Records: ${statistics.totalRecords} | Avg Cost: ₹${statistics.avgCost.toFixed(2)} | Avg PF: ${statistics.avgPowderFactor.toFixed(3)}`, margin, margin + 33);

      // Calculate dimensions to fit chart optimally
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - margin - 40; // Top margin + text height

      // Calculate scaling to fit the chart
      const chartAspectRatio = canvas.width / canvas.height;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth / chartAspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * chartAspectRatio;
      }

      // Center the chart horizontally
      const xPos = (pageWidth - imgWidth) / 2;

      // Add the chart image
      doc.addImage(imgData, 'PNG', xPos, margin + 40, imgWidth, imgHeight);

      // Save PDF
      doc.save(`Blast_cost_per_ton_${timeMode}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
    setIsExporting(false);
    setExportMenuOpen(false);
  }, [timeMode, isDarkMode, statistics, powderFactorType, startDate, endDate, selectedMonth, selectedYear, startYear, endYear]);

  // Enhanced CSV export with current view data
  const exportAsCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const headers = [
        'Date',
        'Cost per Ton (₹)',
        'Powder Factor (kg/ton)',
        ...(timeMode !== 'yearly' ? ['Total Cost (₹)', 'Weight (tons)'] : [])
      ];

      const csvData = chartData.map(item => [
        `"${item.date}"`,
        item.cost_per_ton,
        item.powder_factor,
        ...(timeMode !== 'yearly' ? [item.total_cost || '', item.weight || ''] : [])
      ]);

      const csvContent = [
        `# Blast Cost Analytics - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Powder Factor Type: ${powderFactorType}`,
        '',
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blast-cost-data-${timeMode}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV export failed. Please try again.');
    }
    setIsExporting(false);
    setExportMenuOpen(false);
  }, [chartData, timeMode, powderFactorType]);

  // SVG fallback for image exports - This function is not directly called by buttons, but used as a fallback if other image exports fail.
  const exportChartAsSVGFallback = useCallback(async (format) => {
    try {
      // FIX: Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');

      const svgElement = document.querySelector('#dashboard-container .recharts-surface');
      if (!svgElement) {
        throw new Error('Chart not found');
      }

      // Create a canvas and draw the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1200;
      canvas.height = 800;

      // Set background
      ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw title
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Blast Cost Analytics', canvas.width / 2, 40);
      ctx.font = '16px Arial';
      ctx.fillText(`${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`, canvas.width / 2, 70);

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 100, 100, 1000, 600);

          const link = document.createElement('a');
          link.download = `blast-cost-chart-${timeMode}-${new Date().toISOString().split('T')[0]}.${format}`;
          link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
          link.click();
          resolve();
        };

        img.onerror = () => {
          // Final fallback - just export the data as text
          exportAsPDF(); // Calls the PDF export which includes data
          resolve();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
    } catch (error) {
      console.error('SVG fallback failed:', error);
      exportAsPDF(); // Final fallback to PDF report
    }
  }, [isDarkMode, timeMode, exportAsPDF]);


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name === 'Cost per Ton (₹)' ? `Cost per Ton: ₹${entry.value}` : `Powder Factor: ${entry.value} kg/ton`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dashboard-container" className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Blast Cost Analytics</h1>
              <p className="text-sm text-gray-500">Mining Operations Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* AI Insights Button */}
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                showAIInsights
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Engine</span>
              {aiLearningMode && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="AI is in learning mode" />}
              {isAIProcessing && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="AI is processing" />}
              {aiAlerts.length > 0 && !isAIProcessing && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full" title={`${aiAlerts.length} new alerts`}>
                  {aiAlerts.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>

              {exportMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } z-10`}>
                  <button
                    onClick={exportAsPNG}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isDarkMode ? 'hover:bg-gray-700' : ''
                    } rounded-t-lg flex items-center gap-2`}
                    disabled={isExporting}
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={exportAsJPEG}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isDarkMode ? 'hover:bg-gray-700' : ''
                    } flex items-center gap-2`}
                    disabled={isExporting}
                  >
                    Export as JPEG
                  </button>
                  <button
                    onClick={exportAsPDF}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isDarkMode ? 'hover:bg-gray-700' : ''
                    } flex items-center gap-2`}
                    disabled={isExporting}
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={exportAsSVG}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isDarkMode ? 'hover:bg-gray-700' : ''
                    } flex items-center gap-2`}
                    disabled={isExporting}
                  >
                    Export as SVG
                  </button>
                  <button
                    onClick={exportAsCSV}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isDarkMode ? 'hover:bg-gray-700' : ''
                    } rounded-b-lg flex items-center gap-2`}
                    disabled={isExporting}
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter Panel */}
      <div className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Time Mode Selector */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-2">Time Mode</label>
            <div className="flex space-x-4">
              {['daily', 'monthly', 'yearly'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setTimeMode(mode)}
                  className={`px-5 py-3 rounded text-sm font-medium transition-colors ${
                    timeMode === mode
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Powder Factor Toggle */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-2">Powder Factor Type</label>
            <div className="flex space-x-4">
              {['actual', 'theoretical'].map(type => (
                <button
                  key={type}
                  onClick={() => setPowderFactorType(type)}
                  className={`px-5 py-3 rounded text-sm font-medium transition-colors ${
                    powderFactorType === type
                      ? 'bg-green-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Controls - Dynamic based on time mode */}
          {timeMode === 'daily' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </>
          )}

          {timeMode === 'monthly' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
            </>
          )}

          {timeMode === 'yearly' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Start Year</label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="2020">2020</option>
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Year</label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area: Chart and AI Insights (Side-by-Side on large screens) */}
      <div className={`flex flex-col lg:flex-row gap-6 px-6 py-6`}>
        {/* Chart Section (Left/Main Column) */}
        <div className={`flex-1 rounded-lg p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md`}>
          <h3 className="text-lg font-semibold mb-4">Cost and Powder Factor Trends</h3>
          <div className="h-96" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  label={{
                    value: timeMode === 'yearly' ? 'Year' : timeMode === 'monthly' ? 'Day of Month' : 'Date',
                    position: 'insideBottom',
                    offset: -5,
                    style: { textAnchor: 'middle', fill: isDarkMode ? '#9ca3af' : '#6b7280' }
                  }}
                />
                <YAxis
                  yAxisId="cost"
                  orientation="left"
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  domain={['auto', 'auto']}
                  label={{
                    value: timeMode === 'yearly' ? 'Average Cost per Ton (₹)' : 'Cost per Ton (₹)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: isDarkMode ? '#9ca3af' : '#6b7280' }
                  }}
                />
                <YAxis
                  yAxisId="powder"
                  orientation="right"
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                  label={{
                    value: 'Powder Factor (kg/ton)',
                    angle: 90,
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fill: isDarkMode ? '#9ca3af' : '#6b7280' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="line"
                  wrapperStyle={{
                    paddingBottom: '20px',
                    fontSize: '14px',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568'
                  }}
                />
                <Line
                  yAxisId="cost"
                  type="monotone"
                  dataKey="cost_per_ton"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Cost per Ton (₹)"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
                <Line
                  yAxisId="powder"
                  type="monotone"
                  dataKey="powder_factor"
                  stroke="#10b981"
                  strokeWidth={2} // Reduced width for better distinction with dots
                  name="Powder Factor (kg/ton)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Panel (Right Column on large screens) */}
        {showAIInsights && (
          <div className={`lg:w-[380px] lg:min-w-[320px] lg:max-w-[400px] flex-shrink-0 rounded-lg p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-md lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto`}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'}`}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Engine
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      Model {aiModelVersion}
                    </span>
                    {!isAIProcessing && aiAnalysis && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {aiConfidence}% Confidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Mode Toggle */}
            <div className={`flex rounded-xl p-1 mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex-wrap justify-center`}>
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
                  className={`flex items-center justify-center flex-1 min-w-[80px] px-2 py-2 rounded-lg font-medium text-sm transition-all duration-200 m-0.5 ${
                    aiAnalysisMode === key
                      ? isDarkMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-500 text-white shadow-md'
                      : isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </button>
              ))}
            </div>

            {isAIProcessing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                </div>
                <span className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Engine Processing...
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Running advanced algorithms
                  </span>
                </div>
              </div>
            ) : !aiAnalysis ? (
              <div className={`p-6 rounded-xl border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'} text-center`}>
                <Database className={`w-10 h-10 mx-auto mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Insufficient Data
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  The AI engine requires at least 5 data points for meaningful analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Insights Mode */}
                {aiAnalysisMode === 'insights' && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Key Insights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* Adjusted grid for responsiveness */}
                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                        <p className="text-sm text-gray-500">Avg Cost/Ton</p>
                        <p className="font-bold text-lg">₹{aiAnalysis.costStats.mean.toFixed(2)}</p>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                        <p className="text-sm text-gray-500">Avg Powder Factor</p>
                        <p className="font-bold text-lg">{aiAnalysis.pfStats.mean.toFixed(3)} kg/ton</p>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                        <p className="text-sm text-gray-500">Cost Trend</p>
                        <p className={`font-bold capitalize ${aiAnalysis.costTrend.direction === 'increasing' ? 'text-red-500' : 'text-green-500'}`}>
                          {aiAnalysis.costTrend.direction} ({aiAnalysis.costTrend.strength.toFixed(2)})
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                        <p className="text-sm text-gray-500">PF Trend</p>
                        <p className={`font-bold capitalize ${aiAnalysis.pfTrend.direction === 'decreasing' ? 'text-red-500' : 'text-green-500'}`}>
                          {aiAnalysis.pfTrend.direction} ({aiAnalysis.pfTrend.strength.toFixed(2)})
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                        <p className="text-sm text-gray-500">Overall Risk Level</p>
                        <p className={`font-bold text-lg capitalize ${aiAnalysis.overallRisk === 'High' ? 'text-red-500' : aiAnalysis.overallRisk === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {aiAnalysis.overallRisk}
                        </p>
                    </div>
                  </div>
                )}

                {/* Predictions Mode */}
                {aiAnalysisMode === 'predictions' && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Future Predictions</h3>
                    {aiAnalysis.costPredictions.map((pred, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-1`}>
                        <p className="font-semibold">{pred.period}</p>
                        <p className="text-sm text-gray-500">Predicted Cost/Ton: <span className="font-bold text-blue-500">₹{pred.predictedValue.toFixed(2)}</span></p>
                        <p className="text-xs text-gray-400">Confidence: {(pred.confidence * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-400 break-words">Range: ₹{pred.lowerBound.toFixed(2)} - ₹{pred.upperBound.toFixed(2)}</p>
                      </div>
                    ))}
                     {aiAnalysis.pfPredictions.map((pred, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-1`}>
                        <p className="font-semibold">{pred.period}</p>
                        <p className="text-sm text-gray-500">Predicted Powder Factor: <span className="font-bold text-green-500">{pred.predictedValue.toFixed(3)} kg/ton</span></p>
                        <p className="text-xs text-gray-400">Confidence: {(pred.confidence * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-400 break-words">Range: {pred.lowerBound.toFixed(3)} - {pred.upperBound.toFixed(3)} kg/ton</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations Mode */}
                {aiAnalysisMode === 'recommendations' && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actionable Recommendations</h3>
                    {aiAnalysis.recommendations.length > 0 ? (
                      aiAnalysis.recommendations.map((rec, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          rec.priority === 'critical' ? 'border-red-500' : rec.priority === 'high' ? 'border-yellow-500' : 'border-blue-500'
                        } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} space-y-1`}>
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} break-words`}>{rec.type} <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            rec.priority === 'critical' ? 'bg-red-100 text-red-800' : rec.priority === 'high' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>{rec.priority}</span></p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>{rec.message}</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} break-words`}>Action: {rec.action}</p>
                          <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-words`}>Impact: {rec.expectedImpact}</p>
                          {rec.rootCauseHint && <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-words`}>Hint: {rec.rootCauseHint}</p>}
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No high-priority recommendations at this time.</p>
                    )}
                  </div>
                )}

                {/* Real-time Monitoring Mode */}
                {aiAnalysisMode === 'realtime' && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Real-time Alerts</h3>
                    {aiAnalysis.realTimeAlerts.length > 0 ? (
                      aiAnalysis.realTimeAlerts.map((alert, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          alert.severity === 'high' ? 'border-red-500' : 'border-yellow-500'
                        } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} space-y-1`}>
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} break-words`}>{alert.type} <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{alert.severity}</span></p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>{alert.message}</p>
                          <p className={`text-xs text-gray-400`}>{new Date(alert.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No active alerts. All systems normal.</p>
                    )}
                  </div>
                )}

                {/* Optimization Mode */}
                {aiAnalysisMode === 'optimization' && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Optimization Opportunities</h3>
                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-2`}>
                      <p className="font-semibold">Cost per Ton Distribution</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm"><span>Mean:</span> <span className="font-medium">₹{aiAnalysis.costStats.mean.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span>Std Dev:</span> <span className="font-medium">₹{aiAnalysis.costStats.stdDev.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span>CV:</span> <span className="font-medium">{(aiAnalysis.costStats.cv * 100).toFixed(1)}%</span></div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-2`}>
                      <p className="font-semibold">Powder Factor Distribution</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm"><span>Mean:</span> <span className="font-medium">{aiAnalysis.pfStats.mean.toFixed(3)} kg/ton</span></div>
                        <div className="flex justify-between text-sm"><span>Std Dev:</span> <span className="font-medium">{aiAnalysis.pfStats.stdDev.toFixed(3)}</span></div>
                        <div className="flex justify-between text-sm"><span>CV:</span> <span className="font-medium">{(aiAnalysis.pfStats.cv * 100).toFixed(1)}%</span></div>
                      </div>
                    </div>

                    {/* What-If Scenarios */}
                    <div className={`p-3 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-purple-600 bg-purple-900/30' : 'border-purple-300 bg-purple-50/50'} space-y-2`}>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>"What If?" Scenarios</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                        If you could reduce **Cost per Ton** by **5%**,
                        your estimated savings per ton would be: <span className="font-bold text-green-600">₹{(aiAnalysis.costStats.mean * 0.05).toFixed(2)}</span>.
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                        If you could improve **Powder Factor** by **5%**,
                        your estimated new PF would be: <span className="font-bold text-green-600">{(aiAnalysis.pfStats.mean * 1.05).toFixed(3)} kg/ton</span>.
                      </p>
                      <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                        These are simulated scenarios based on current data. Actual results may vary.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics Cards (moved below main chart/AI section) */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cost Analysis Card */}
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-md`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cost per Ton Analysis</h3>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Minimum</span>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="font-medium">₹{statistics.minCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Maximum</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="font-medium">₹{statistics.maxCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average</span>
                <span className="font-medium text-blue-500">₹{statistics.avgCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Powder Factor Card */}
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-md`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Powder Factor Analysis</h3>
              <Database className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Type</span>
                <span className="font-medium capitalize">{powderFactorType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average</span>
                <span className="font-medium text-green-500">{statistics.avgPowderFactor.toFixed(3)} kg/ton</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Mode</span>
                <span className="font-medium capitalize">{timeMode}</span>
              </div>
            </div>
          </div>

          {/* Data Summary Card */}
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-md`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Data Summary</h3>
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Records</span>
                <span className="font-medium">{statistics.totalRecords}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Date Range</span>
                <span className="font-medium text-sm">
                  {timeMode === 'daily' ? `${startDate} to ${endDate}` :
                    timeMode === 'monthly' ? `${selectedMonth}/${selectedYear}` :
                    `${startYear} to ${endYear}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Data Points in Chart</span>
                <span className="font-medium text-purple-500">{chartData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlastCostDashboard;
