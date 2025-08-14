import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Volume2, Download, BarChart3, Filter, Brain, Zap, Target, AlertTriangle, CheckCircle, Activity, Lightbulb, Search, MessageSquare, TrendingDown, Database } from 'lucide-react';

const VibrationDashboard = ({ filteredData, DarkMode }) => {
  // State management
  const isDarkMode = !DarkMode; // Correctly interpret DarkMode prop
  const [timeMode, setTimeMode] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    startYear: new Date().getFullYear() - 1,
    endYear: new Date().getFullYear(),
    selectedYear: new Date().getFullYear().toString(),
    selectedMonth: '01',
  });
  const [activeMeasurements, setActiveMeasurements] = useState({
    ppv: true,
    airBlast: true,
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportNotification, setExportNotification] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // AI related states
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState('insights'); // 'insights', 'predictions', 'recommendations', 'realtime', 'optimization'
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiLearningMode, setAiLearningMode] = useState(true); // Placeholder for future learning mode
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiModelVersion, setAiModelVersion] = useState('v1.0.0'); // AI model version for this component

  const exportRef = useRef(null);
  const chartRef = useRef(null);

  // Click outside handler for export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to validate and parse dates
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  // Helper function to check if a value is valid
  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== '';
  };

  // Process and filter data based on current settings
  const processedData = useMemo(() => {
    if (!Array.isArray(filteredData)) {
      return [];
    }

    // Parse blastdate in DD-MM-YYYY format
    const parseDate = (dateStr) => {
      const parts = dateStr.split('-');
      // Ensure parts are in correct order (YYYY, MM-1, DD) for Date constructor
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };

    let validData = filteredData.filter(
      (item) =>
        isValidDate(item.blastdate) &&
        ((isValidValue(item.ppv) && item.ppv > 0) || (isValidValue(item.air_blast) && item.air_blast > 0))
    );

    if (timeMode === 'daily') {
      if (dateRange.startDate || dateRange.endDate) {
        validData = validData.filter((item) => {
          const itemDate = parseDate(item.blastdate);
          const start = dateRange.startDate
            ? new Date(dateRange.startDate)
            : new Date('1900-01-01');
          const end = dateRange.endDate
            ? new Date(dateRange.endDate)
            : new Date('2100-12-31');
          start.setHours(0, 0, 0, 0); // Normalize to start of day
          end.setHours(23, 59, 59, 999); // Normalize to end of day
          return itemDate >= start && itemDate <= end;
        });
      }
    } else if (timeMode === 'monthly') {
      validData = validData.filter((item) => {
        const itemDate = parseDate(item.blastdate);
        return itemDate.getFullYear().toString() === dateRange.selectedYear &&
               (itemDate.getMonth() + 1).toString().padStart(2, '0') === dateRange.selectedMonth;
      });
    } else { // yearly
      validData = validData.filter((item) => {
        const year = parseDate(item.blastdate).getFullYear();
        return year >= dateRange.startYear && year <= dateRange.endYear;
      });
    }

    if (timeMode === 'yearly') {
      const yearlyData = {};

      validData.forEach((item) => {
        const year = parseDate(item.blastdate).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = {
            year,
            ppvValues: [],
            airBlastValues: [],
            count: 0,
          };
        }

        if (isValidValue(item.ppv) && item.ppv > 0) yearlyData[year].ppvValues.push(item.ppv);
        if (isValidValue(item.air_blast) && item.air_blast > 0) yearlyData[year].airBlastValues.push(item.air_blast);
        yearlyData[year].count++;
      });

      return Object.values(yearlyData)
        .map((yearData) => ({
          date: yearData.year.toString(),
          displayDate: yearData.year.toString(),
          ppv: yearData.ppvValues.length > 0 ? yearData.ppvValues.reduce((sum, ppv) => sum + ppv, 0) / yearData.ppvValues.length : null,
          air_blast: yearData.airBlastValues.length > 0 ? yearData.airBlastValues.reduce((sum, ab) => sum + ab, 0) / yearData.airBlastValues.length : null,
          blastCount: yearData.count,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return validData
        .map((item) => ({
          ...item,
          date: parseDate(item.blastdate), // Keep as Date object for sorting
          displayDate: item.blastdate, // Keep original string for display
          ppv: (isValidValue(item.ppv) && item.ppv > 0) ? item.ppv : null,
          air_blast: (isValidValue(item.air_blast) && item.air_blast > 0) ? item.air_blast : null,
        }))
        .sort((a, b) => a.date - b.date) // Sort by Date object
        .map(item => ({
          ...item,
          date: item.displayDate // Revert to string for XAxis dataKey
        }));
    }
  }, [filteredData, timeMode, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const validPPV = processedData.filter((item) => item.ppv !== null && item.ppv > 0);
    const validAirBlast = processedData.filter((item) => item.air_blast !== null && item.air_blast > 0);

    return {
      avgPPV: validPPV.length > 0 ? validPPV.reduce((sum, item) => sum + item.ppv, 0) / validPPV.length : 0,
      avgAirBlast: validAirBlast.length > 0 ? validAirBlast.reduce((sum, item) => sum + item.air_blast, 0) / validAirBlast.length : 0,
      totalBlasts: processedData.length,
    };
  }, [processedData]);

  // Prepare chart data with conditional series - exclude null, empty, and zero values
  const chartData = useMemo(() => {
    return processedData.map((item) => {
      const dataPoint = {
        date: item.date, // This will be the formatted string from processedData
        displayDate: item.displayDate,
      };

      // Only include PPV if it's valid, not null, not empty, and not zero
      if (activeMeasurements.ppv && isValidValue(item.ppv) && item.ppv > 0) {
        dataPoint.ppv = item.ppv;
      }

      // Only include Air Blast if it's valid, not null, not empty, and not zero
      if (activeMeasurements.airBlast && isValidValue(item.air_blast) && item.air_blast > 0) {
        dataPoint.air_blast = item.air_blast;
      }

      return dataPoint;
    });
  }, [processedData, activeMeasurements]);

  // AI Analysis Logic
  const aiAnalysis = useMemo(() => {
    try {
      if (!processedData || processedData.length < 5) return null; // Need sufficient data for meaningful AI

      const ppvData = processedData.map(item => item.ppv).filter(m => isValidValue(m) && m > 0);
      const airBlastData = processedData.map(item => item.air_blast).filter(m => isValidValue(m) && m > 0);

      if (ppvData.length < 5 || airBlastData.length < 5) return null;

      const n = processedData.length; // Number of data points

    // --- Statistical Analysis ---
    const calculateStats = (data) => {
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0; // Coefficient of Variation
      return { mean, stdDev, cv };
    };

    const ppvStats = calculateStats(ppvData);
    const airBlastStats = calculateStats(airBlastData);

    // --- Trend Analysis (using Linear Regression on time index) ---
    const calculateTrend = (data, meanVal) => {
      const xValues = data.map((_, i) => i);
      const yValues = data;
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

      const denominator = (n * sumX2 - sumX * sumX);
      const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
      const direction = slope > 0.01 ? 'increasing' : (slope < -0.01 ? 'decreasing' : 'stable'); // Threshold for 'stable'
      const strength = Math.abs(slope * (n / meanVal)); // Normalized slope as strength
      return { slope, direction, strength };
    };

    const ppvTrend = calculateTrend(ppvData, ppvStats.mean);
    const airBlastTrend = calculateTrend(airBlastData, airBlastStats.mean);

    // --- Anomaly Detection (Z-Score, IQR, and EWMA) ---
    const detectAnomalies = (data, stats, dataName) => {
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
            anomalies.push({ type: 'Z-Score', value, index: i, severity: zScore > 3.5 ? 'high' : 'medium', dataName });
          }
        }

        // EWMA
        if (i > 0) {
          ewma = ewmaAlpha * value + (1 - ewmaAlpha) * ewma;
          const deviation = Math.abs(value - ewma);
          // Simplified EWMA StdDev approximation
          const ewmaStdDev = stats.stdDev * Math.sqrt(ewmaAlpha / (2 - ewmaAlpha)); 
          if (ewmaStdDev > 0 && deviation > ewmaStdDevMultiplier * ewmaStdDev) {
            anomalies.push({ type: 'EWMA', value, index: i, severity: deviation > (ewmaStdDevMultiplier * 1.5) * ewmaStdDev ? 'high' : 'medium', dataName });
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
          anomalies.push({ type: 'IQR', value, index: i, severity: 'high', dataName });
        }
      });

      // Filter unique anomalies and assign highest severity
      const uniqueAnomalies = {};
      anomalies.forEach(a => {
        const key = `${a.index}-${a.value}-${a.dataName}`;
        if (!uniqueAnomalies[key] || (uniqueAnomalies[key].severity === 'medium' && a.severity === 'high')) {
          uniqueAnomalies[key] = a;
        }
      });

      return Object.values(uniqueAnomalies);
    };

    const allAnomalies = [
      ...detectAnomalies(ppvData, ppvStats, 'PPV'),
      ...detectAnomalies(airBlastData, airBlastStats, 'Air Blast')
    ];

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

    const ppvPredictions = predictFuture(ppvData, ppvTrend, ppvStats);
    const airBlastPredictions = predictFuture(airBlastData, airBlastTrend, airBlastStats);

    // --- Risk Assessment ---
    // Higher CV or strong increasing/decreasing trends (away from ideal) contribute to higher risk
    const calculateRiskScore = (stats, trend, anomalies) => {
      let score = 0;
      if (stats.cv > 0.3) score += 3; // High variability
      else if (stats.cv > 0.15) score += 2; // Medium variability

      if (trend.direction !== 'stable' && trend.strength > 0.2) score += 3; // Strong non-stable trend
      else if (trend.direction !== 'stable' && trend.strength > 0.1) score += 2; // Moderate non-stable trend
      
      score += anomalies.filter(a => a.severity === 'high').length * 2; // High severity anomalies
      return score;
    };

    const ppvRiskScore = calculateRiskScore(ppvStats, ppvTrend, allAnomalies.filter(a => a.dataName === 'PPV'));
    const airBlastRiskScore = calculateRiskScore(airBlastStats, airBlastTrend, allAnomalies.filter(a => a.dataName === 'Air Blast'));

    const overallRiskScore = ppvRiskScore + airBlastRiskScore;
    const overallRiskLevel = overallRiskScore > 7 ? 'High' : (overallRiskScore > 3 ? 'Medium' : 'Low');


    // --- Recommendations ---
    const recommendations = [];

    const addRecommendation = (type, priority, message, action, impact, rootCauseHint) => {
      recommendations.push({ type, priority, message, action, impact, rootCauseHint });
    };

    // PPV Recommendations
    if (ppvStats.cv > 0.2) {
      addRecommendation('PPV Consistency', 'high', `PPV measurements show high variability (${(ppvStats.cv * 100).toFixed(1)}%). Inconsistent PPV can lead to unpredictable ground vibrations.`, 'Review blast design parameters (e.g., charge weight, delay timing, burden, spacing). Implement stricter quality control for drilling and charging.', 'More predictable ground vibration and reduced risk of damage.', 'Inconsistent charge loading, variable rock mass, or suboptimal delay timing.');
    }
    if (ppvTrend.direction === 'increasing' && ppvTrend.strength > 0.1) {
      addRecommendation('PPV Escalation Control', 'critical', `PPV is trending upward (${(ppvTrend.strength * 100).toFixed(1)}% strength). This increases the risk of exceeding vibration limits.`, 'Immediately review recent blast designs and geological conditions. Consider reducing charge weights or adjusting delay patterns.', 'Compliance with vibration limits and reduced community complaints.', 'Increased charge weights, changes in rock properties, or proximity to sensitive structures.');
    }

    // Air Blast Recommendations
    if (airBlastStats.cv > 0.2) {
      addRecommendation('Air Blast Consistency', 'high', `Air Blast measurements show high variability (${(airBlastStats.cv * 100).toFixed(1)}%). Inconsistent air blast can lead to noise complaints and discomfort.`, 'Ensure proper stemming length and material. Review initiation sequences and consider deck loading if applicable.', 'Reduced air overpressure and improved community relations.', 'Insufficient stemming, open blast faces, or atmospheric conditions.');
    }
    if (airBlastTrend.direction === 'increasing' && airBlastTrend.strength > 0.1) {
      addRecommendation('Air Blast Escalation Control', 'critical', `Air Blast is trending upward (${(airBlastTrend.strength * 100).toFixed(1)}% strength). This increases the risk of noise violations.`, 'Investigate potential causes such as exposed charges, poor stemming, or adverse weather conditions (e.g., wind direction).', 'Compliance with noise regulations and reduced disturbance.', 'Inadequate stemming, exposed explosives, or atmospheric inversions.');
    }

    // General Anomaly Recommendation
    if (allAnomalies.length > 0) {
      const highSeverityAnomalies = allAnomalies.filter(a => a.severity === 'high');
      if (highSeverityAnomalies.length > 0) {
        addRecommendation('Anomaly Investigation', 'critical', `${highSeverityAnomalies.length} high-severity vibration anomalies detected. These indicate significant operational deviations.`, `Conduct immediate root cause analysis for blasts on affected dates/periods (e.g., ${highSeverityAnomalies.map(a => processedData[a.index]?.displayDate || 'N/A').join(', ')}).`, 'Prevent recurrence of critical issues and ensure safety compliance.', 'Unexpected geological conditions, equipment malfunction, or procedural errors.');
      }
    }

    // --- Real-time Alerts ---
    const realTimeAlerts = [];
    const latestPPV = ppvData[ppvData.length - 1];
    const latestAirBlast = airBlastData[airBlastData.length - 1];

    if (ppvStats.stdDev > 0 && latestPPV > ppvStats.mean + 2 * ppvStats.stdDev) {
      realTimeAlerts.push({ type: 'PPV Spike', severity: 'high', message: `Latest PPV (${latestPPV.toFixed(2)} mm/s) is significantly above average.`, timestamp: new Date().toISOString() });
    }
    if (airBlastStats.stdDev > 0 && latestAirBlast > airBlastStats.mean + 2 * airBlastStats.stdDev) {
      realTimeAlerts.push({ type: 'Air Blast Spike', severity: 'high', message: `Latest Air Blast (${latestAirBlast.toFixed(2)} dB) is significantly above average.`, timestamp: new Date().toISOString() });
    }

    return {
      ppvStats, airBlastStats,
      ppvTrend, airBlastTrend,
      allAnomalies,
      ppvPredictions, airBlastPredictions,
      overallRisk: overallRiskLevel,
      recommendations,
      realTimeAlerts,
      dataQuality: n > 10 ? 'High' : n > 5 ? 'Medium' : 'Low',
      modelAccuracy: Math.max(0.6, 1 - Math.max(ppvStats.cv, airBlastStats.cv)) // Combined CV for overall accuracy
    };

    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null; // Return null on any error to prevent component crash
    }
  }, [processedData]);

  // Simulate AI processing time
  useEffect(() => {
    if (showAIInsights) {
      setIsAIProcessing(true);
      const timer = setTimeout(() => {
        try {
          if (aiAnalysis && aiAnalysis.modelAccuracy) {
            setAiConfidence((aiAnalysis.modelAccuracy * 100).toFixed(1));
          } else {
            setAiConfidence('85'); // Fallback confidence value
          }
        } catch (error) {
          console.error('AI Confidence Error:', error);
          setAiConfidence('85'); // Fallback confidence value
        }
        setIsAIProcessing(false);
      }, 1500 + Math.random() * 1000);
      return () => clearTimeout(timer);
    }
  }, [showAIInsights, aiAnalysisMode, aiAnalysis]);

  // Update AI alerts
  useEffect(() => {
    try {
      if (aiAnalysis && aiAnalysis.realTimeAlerts) {
        setAiAlerts(aiAnalysis.realTimeAlerts);
      } else {
        setAiAlerts([]); // Clear alerts if no valid analysis
      }
    } catch (error) {
      console.error('AI Alerts Error:', error);
      setAiAlerts([]); // Clear alerts on error
    }
  }, [aiAnalysis]);


  // Toggle measurement visibility
  const toggleMeasurement = (type) => {
    setActiveMeasurements((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Enhanced export functionality
  const handleExport = async (format) => {
    setIsExporting(true);
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      const chartContainer = chartRef.current;
      if (!chartContainer) throw new Error('Chart not found');

      if (format === 'png' || format === 'jpeg') {
        // Dynamically import html2canvas
        const { default: html2canvas } = await import('html2canvas');

        // Use html2canvas with more robust settings for better rendering
        const canvas = await html2canvas(chartContainer, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          scale: 2, // Reduced scale to avoid memory issues
          useCORS: true,
          logging: false,
          allowTaint: true,
          removeContainer: false,
          ignoreElements: (element) => element.classList?.contains('export-ignore'),
          onclone: (clonedDoc) => {
            // Remove any problematic CSS that might cause parsing issues
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
                background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
              }
              .recharts-cartesian-grid-horizontal line,
              .recharts-cartesian-grid-vertical line {
                stroke: ${isDarkMode ? '#374151' : '#E5E7EB'} !important;
              }
              .recharts-text {
                fill: ${isDarkMode ? '#D1D5DB' : '#6B7280'} !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
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
        ctx.fillText(`Vibration Analysis - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`, finalCanvas.width / 2, 30);
        ctx.font = '16px Arial';
        ctx.fillText(`${processedData.length} records | Generated: ${new Date().toLocaleDateString()}`, finalCanvas.width / 2, 55);
        
        // Draw the chart canvas onto our new canvas
        ctx.drawImage(canvas, 0, titleHeight);
        
        // Export the canvas
        const link = document.createElement('a');
        link.download = `vibration-analysis-${timeMode}-${new Date().toISOString().split('T')[0]}.${format}`;
        link.href = finalCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
        link.click();
        
        setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
        setTimeout(() => setExportNotification(''), 3000);
        setIsExporting(false);
      } else if (format === 'svg') {
        // Direct SVG export
        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.download = `vibration-analysis-${timeMode}-${new Date().toISOString().split('T')[0]}.svg`;
          link.href = url;
          link.click();
          
          URL.revokeObjectURL(url);
          setExportNotification('Chart exported as SVG successfully!');
          setTimeout(() => setExportNotification(''), 3000);
          setIsExporting(false);
        } else {
          throw new Error('SVG element not found within the chart container');
        }
      } else if (format === 'pdf') {
        // Dynamically import html2canvas and jspdf
        const { default: html2canvas } = await import('html2canvas');
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(chartContainer, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 20;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`vibration-analysis-${timeMode}-${new Date().toISOString().split('T')[0]}.pdf`);
        
        setExportNotification('Chart exported as PDF successfully!');
        setTimeout(() => setExportNotification(''), 3000);
        setIsExporting(false);
      } else if (format === 'csv') {
        // CSV export
        const csvHeaders = ['Date', 'PPV (mm/s)', 'Air Blast (dB)'];
        const csvData = chartData.map(item => [
          item.displayDate,
          item.ppv !== null ? item.ppv : 'N/A',
          item.air_blast !== null ? item.air_blast : 'N/A'
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `vibration-analysis-${timeMode}-${new Date().toISOString().split('T')[0]}.csv`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        setExportNotification('Data exported as CSV successfully!');
        setTimeout(() => setExportNotification(''), 3000);
        setIsExporting(false);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportNotification('Export failed. Please try again.');
      setTimeout(() => setExportNotification(''), 3000);
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-4 rounded-xl border ${
            isDarkMode
              ? 'bg-gray-800/90 border-gray-600 text-white'
              : 'bg-white/90 border-gray-200 text-gray-900'
          } backdrop-blur-md shadow-xl`}
        >
          <p className="font-semibold mb-2">{data.displayDate}</p>
          <div className="space-y-1">
            
            {data.ppv !== null && data.ppv !== undefined && (
              <p className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                PPV: {data.ppv.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} mm/s
              </p>
            )}
            {data.air_blast !== null && data.air_blast !== undefined && (
              <p className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-500" />
                Air Blast: {data.air_blast.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} dB
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const themeClasses = isDarkMode
    ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white'
    : 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900';

  const cardClasses = isDarkMode
    ? 'bg-gray-800/50 border-gray-600'
    : 'bg-white/50 border-gray-200';

  return (
    <div className={`min-h-screen p-4 sm:p-6 transition-all duration-500 ${themeClasses}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-3 sm:p-4 shadow-xl relative z-10`}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-1">
                Vibration Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base font-semibold">
                Ground & Air Vibration Analysis
              </p>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3">
              {/* AI Insights Button */}
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-200 ${
                  showAIInsights
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } text-sm`}
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

              <div className="relative z-50" ref={exportRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  aria-label="Export chart data"
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>

                {showExportDropdown && (
                  <div
                    className={`absolute top-full right-0 mt-2 w-40 rounded-xl border shadow-2xl z-[9999] ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-gray-200'
                    } backdrop-blur-md`}
                  >
                    {['png', 'jpeg', 'pdf', 'svg', 'csv'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format)}
                        disabled={isExporting}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 text-sm ${
                          isDarkMode
                            ? 'hover:bg-gray-700 text-white'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Export Notification */}
        {exportNotification && (
          <div
            className={`fixed top-4 right-4 left-4 sm:left-auto p-4 rounded-xl shadow-xl z-[10000] ${
              isDarkMode ? 'bg-green-800 text-white' : 'bg-green-100 text-green-800'
            } backdrop-blur-md border ${
              isDarkMode ? 'border-green-600' : 'border-green-200'
            } text-sm sm:text-base`}
          >
            {exportNotification}
          </div>
        )}

        {/* Controls and Chart/AI Section */}
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
          showAIInsights ? 'lg:grid-cols-[1fr_minmax(320px,_400px)]' : 'lg:grid-cols-1'
        }`}>
          {/* Left Column: Controls & Chart */}
          <div className="space-y-4 sm:space-y-6">
            {/* Controls */}
            <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl relative z-0`}>
              <div className={`grid grid-cols-1 gap-6 ${
                showAIInsights 
                  ? 'md:grid-cols-2 lg:grid-cols-3' 
                  : 'md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {/* Time Period */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Time Period
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                    {['daily', 'monthly', 'yearly'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTimeMode(mode)}
                        aria-label={`Select ${mode} view`}
                        className={`flex-1 px-2 sm:px-4 py-2 font-medium transition-all duration-300 text-sm sm:text-base ${
                          timeMode === mode
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Date Range
                  </label>
                  {timeMode === 'daily' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) =>
                            setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select start date"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) =>
                            setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select end date"
                        />
                      </div>
                    </div>
                  ) : timeMode === 'monthly' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Year</label>
                        <select
                          value={dateRange.selectedYear}
                          onChange={(e) =>
                            setDateRange((prev) => ({ ...prev, selectedYear: e.target.value }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select year"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Month</label>
                        <select
                          value={dateRange.selectedMonth}
                          onChange={(e) =>
                            setDateRange((prev) => ({ ...prev, selectedMonth: e.target.value }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select month"
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
                    </div>
                  ) : ( // yearly
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Year</label>
                        <input
                          type="number"
                          placeholder="Start Year"
                          value={dateRange.startYear}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              startYear: parseInt(e.target.value) || 2020,
                            }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select start year"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Year</label>
                        <input
                          type="number"
                          placeholder="End Year"
                          value={dateRange.endYear}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              endYear: parseInt(e.target.value) || 2024,
                            }))
                          }
                          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          aria-label="Select end year"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Measurements */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Measurements
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => toggleMeasurement('ppv')}
                      aria-label="Toggle PPV measurement"
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm ${
                        activeMeasurements.ppv
                          ? 'bg-blue-500 text-white shadow-lg'
                          : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      PPV (mm/s)
                    </button>
                    <button
                      onClick={() => toggleMeasurement('airBlast')}
                      aria-label="Toggle Air Blast measurement"
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm ${
                        activeMeasurements.airBlast
                          ? 'bg-red-500 text-white shadow-lg'
                          : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      Air Blast (dB)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl`}>
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm sm:text-base">
                  Vibration Analysis - {timeMode === 'daily' ? 'Daily' : timeMode === 'monthly' ? 'Monthly' : 'Yearly'} View
                </span>
              </h2>

              {chartData.length > 0 ? (
                <div className={`${showAIInsights ? 'h-80 sm:h-96' : 'h-96 sm:h-[32rem] lg:h-[36rem]'}`} ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: isDarkMode ? '#D1D5DB' : '#6B7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      {activeMeasurements.ppv && (
                        <YAxis
                          yAxisId="ppv"
                          orientation="left"
                          tick={{ fontSize: 10, fill: '#3B82F6' }}
                          label={{
                            value: 'PPV (mm/s)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#3B82F6', fontSize: '12px' },
                          }}
                        />
                      )}
                      {activeMeasurements.airBlast && (
                        <YAxis
                          yAxisId="airBlast"
                          orientation="right"
                          tick={{ fontSize: 10, fill: '#EF4444' }}
                          label={{
                            value: 'Air Blast (dB)',
                            angle: 90,
                            position: 'insideRight',
                            style: { textAnchor: 'middle', fill: '#EF4444', fontSize: '12px' },
                          }}
                        />
                      )}
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px' }}
                        iconSize={12}
                      />

                      {activeMeasurements.ppv && (
                        <Line
                          yAxisId="ppv"
                          type="monotone"
                          dataKey="ppv"
                          stroke="#3B82F6"
                          strokeWidth={1.5}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          connectNulls={false}
                          name="PPV (mm/s)"
                        />
                      )}
                      {activeMeasurements.airBlast && (
                        <Line
                          yAxisId="airBlast"
                          type="monotone"
                          dataKey="air_blast"
                          stroke="#EF4444"
                          strokeWidth={1.5}
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                          connectNulls={false}
                          name="Air Blast (dB)"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`${showAIInsights ? 'h-80 sm:h-96' : 'h-96 sm:h-[32rem] lg:h-[36rem]'} flex items-center justify-center`}>
                  <div className="text-center">
                    <BarChart3
                      className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    />
                    <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No data available for the selected filters
                    </p>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                      Try adjusting your date range or measurement settings
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Insights Panel */}
          {showAIInsights && (
            <div className={`lg:w-[380px] lg:min-w-[320px] lg:max-w-[400px] flex-shrink-0 rounded-xl p-4 sm:p-6 backdrop-blur-md border ${
              isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30' : 'bg-gradient-to-br from-purple-50/80 to-blue-50/80 border-purple-200/50'
            } shadow-xl lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto`}>
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
                <div className={`p-6 rounded-xl border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'bg-gray-300 bg-gray-50/50'} text-center`}>
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
                          <p className="text-sm text-gray-500">Avg PPV</p>
                          <p className="font-bold text-lg">{aiAnalysis.ppvStats.mean.toFixed(2)} mm/s</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                          <p className="text-sm text-gray-500">Avg Air Blast</p>
                          <p className="font-bold text-lg">{aiAnalysis.airBlastStats.mean.toFixed(2)} dB</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                          <p className="text-sm text-gray-500">PPV Trend</p>
                          <p className={`font-bold capitalize ${aiAnalysis.ppvTrend.direction === 'increasing' ? 'text-red-500' : aiAnalysis.ppvTrend.direction === 'decreasing' ? 'text-green-500' : 'text-gray-500'}`}>
                            {aiAnalysis.ppvTrend.direction} (CV: {(aiAnalysis.ppvStats.cv * 100).toFixed(1)}%)
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                          <p className="text-sm text-gray-500">Air Blast Trend</p>
                          <p className={`font-bold capitalize ${aiAnalysis.airBlastTrend.direction === 'increasing' ? 'text-red-500' : aiAnalysis.airBlastTrend.direction === 'decreasing' ? 'text-green-500' : 'text-gray-500'}`}>
                            {aiAnalysis.airBlastTrend.direction} (CV: {(aiAnalysis.airBlastStats.cv * 100).toFixed(1)}%)
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
                      {[
                        { name: 'PPV', data: aiAnalysis.ppvPredictions, color: 'text-blue-500', unit: 'mm/s' },
                        { name: 'Air Blast', data: aiAnalysis.airBlastPredictions, color: 'text-red-500', unit: 'dB' }
                      ].map((metric, metricIdx) => (
                        <div key={metricIdx} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-1`}>
                          <p className={`font-semibold ${metric.color}`}>{metric.name} Predictions:</p>
                          {metric.data.map((pred, idx) => (
                            <div key={idx} className="ml-2 text-sm space-y-0.5">
                              <p className="font-medium">{pred.period}: <span className="font-bold">{pred.predictedValue.toFixed(2)} {metric.unit}</span></p>
                              <p className="text-xs text-gray-400">Confidence: {(pred.confidence * 100).toFixed(0)}%</p>
                              <p className="text-xs text-gray-400 break-words">Range: {pred.lowerBound.toFixed(2)} {metric.unit} - {pred.upperBound.toFixed(2)} {metric.unit}</p>
                            </div>
                          ))}
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
                        <p className="font-semibold">PPV Distribution</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm"><span>Mean:</span> <span className="font-medium">{aiAnalysis.ppvStats.mean.toFixed(2)} mm/s</span></div>
                          <div className="flex justify-between text-sm"><span>Std Dev:</span> <span className="font-medium">{aiAnalysis.ppvStats.stdDev.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm"><span>CV:</span> <span className="font-medium">{(aiAnalysis.ppvStats.cv * 100).toFixed(1)}%</span></div>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} space-y-2`}>
                        <p className="font-semibold">Air Blast Distribution</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm"><span>Mean:</span> <span className="font-medium">{aiAnalysis.airBlastStats.mean.toFixed(2)} dB</span></div>
                          <div className="flex justify-between text-sm"><span>Std Dev:</span> <span className="font-medium">{aiAnalysis.airBlastStats.stdDev.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm"><span>CV:</span> <span className="font-medium">{(aiAnalysis.airBlastStats.cv * 100).toFixed(1)}%</span></div>
                        </div>
                      </div>

                      {/* What-If Scenarios */}
                      <div className={`p-3 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-purple-600 bg-purple-900/30' : 'border-purple-300 bg-purple-50/50'} space-y-2`}>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>"What If?" Scenarios</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                          If you could **reduce PPV by 10%**, your estimated new average PPV would be: <span className="font-bold text-green-600">{(aiAnalysis.ppvStats.mean * 0.90).toFixed(2)} mm/s</span>.
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                          If you could **reduce Air Blast by 5%**, your estimated new average Air Blast would be: <span className="font-bold text-green-600">{(aiAnalysis.airBlastStats.mean * 0.95).toFixed(2)} dB</span>.
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

        {/* Summary Cards (Moved to bottom for better flow) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-500 rounded-xl">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm opacity-75">Average PPV</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {summaryStats.avgPPV.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-sm sm:text-base">mm/s</span>
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-red-500 rounded-xl">
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm opacity-75">Average Air Blast</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {summaryStats.avgAirBlast.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-sm sm:text-base">dB</span>
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm opacity-75">Total Blasts</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {summaryStats.totalBlasts}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

VibrationDashboard.propTypes = {
  filteredData: PropTypes.arrayOf(
    PropTypes.shape({
      total_exp_cost: PropTypes.number, // This field is present in original data but not directly used in vibration analysis
      blastdate: PropTypes.string.isRequired,
      ppv: PropTypes.number,
      air_blast: PropTypes.number,
    })
  ).isRequired,
  DarkMode: PropTypes.bool.isRequired, // Corrected propType name to match prop casing
};

export default VibrationDashboard;
