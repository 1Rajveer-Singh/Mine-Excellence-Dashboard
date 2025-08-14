import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Layers, X, Filter, BarChart3, Brain, Zap, Target, AlertTriangle, TrendingDown, CheckCircle, Activity, Lightbulb, DatabaseZap, Search, MessageSquare, Cloud, ServerCog } from 'lucide-react'; // Added Cloud and ServerCog icons

// Assuming these are external dependencies for export, loaded conditionally
// import 'jspdf'; // jspdf would be installed via npm and imported only when needed

const BlastCostAnalytics = ({ filteredData, DarkMode }) => {
  const isDark = !DarkMode;
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
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState('insights');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // New AI state variables to store results from the backend
  const [aiBackendResults, setAiBackendResults] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiModelVersion, setAiModelVersion] = useState('ML v4.2 - Distributed'); // Updated for real ML model
  const [aiConfidence, setAiConfidence] = useState(0); // This will come from backend
  const [aiLearningMode, setAiLearningMode] = useState(true); // Still a placeholder, but could indicate backend retraining
  const [aiAlerts, setAiAlerts] = useState([]); // Real-time alerts from backend

  const chartRef = useRef(null);

  // Mock data for demonstration - assuming filteredData is passed as prop
  const mockData = filteredData || [];

  // Data processing remains mostly the same for client-side chart visualization
  // However, the AI analysis part will be offloaded to a backend.
  const processedData = useMemo(() => {
    const isValidCost = (value) => {
      return value !== undefined && value !== null && value !== '' && value !== 0 && !isNaN(value);
    };

    const validData = mockData.filter(record => {
      const hasValidTotalExpCost = record.total_exp_cost !== undefined &&
                                   record.total_exp_cost !== null &&
                                   record.total_exp_cost !== '' &&
                                   record.blastdate;

      const manpowerCost = record.man_power_cost;
      const drillCost = record.drilling_cost;
      const accessoryCost = record.blast_accessoriesdelay_cost;
      const explosiveCost = record.total_exp_cost;

      const hasValidManpower = isValidCost(manpowerCost);
      const hasValidDrilling = isValidCost(drillCost);
      const hasValidAccessory = isValidCost(accessoryCost);
      const hasValidExplosive = isValidCost(explosiveCost);

      const allThreeCostsInvalid = !hasValidDrilling && !hasValidManpower && !hasValidAccessory;
      const onlyExplosiveCostValid = allThreeCostsInvalid && hasValidExplosive;

      if (onlyExplosiveCostValid) {
        return false;
      }

      const manpowerIsZero = manpowerCost === 0;
      const drillIsZero = drillCost === 0;
      const accessoryIsZero = accessoryCost === 0;
      const explosiveIsValid = hasValidExplosive;

      if ((manpowerIsZero || drillIsZero || accessoryIsZero) && explosiveIsValid) {
        return false;
      }

      const hasAtLeastOneValidCost = hasValidManpower || hasValidDrilling || hasValidAccessory || hasValidExplosive;

      return hasValidTotalExpCost && hasAtLeastOneValidCost;
    });

    if (timeMode === 'Yearly') {
      const yearGroups = validData.reduce((acc, record) => {
        const [day, month, year] = record.blastdate.split('-');
        const recordYear = parseInt(year);

        if (recordYear >= startYear && recordYear <= endYear) {
          if (!acc[recordYear]) {
            acc[recordYear] = { records: [], year: recordYear };
          }
          acc[recordYear].records.push(record);
        }
        return acc;
      }, {});

      return Object.values(yearGroups).map(group => {
        const avgDrilling = group.records.reduce((sum, r) => sum + (r.drilling_cost || 0), 0) / group.records.length;
        const avgManpower = group.records.reduce((sum, r) => sum + (r.man_power_cost || 0), 0) / group.records.length;
        const avgAccessories = group.records.reduce((sum, r) => sum + (r.blast_accessoriesdelay_cost || 0), 0) / group.records.length;
        const avgExplosive = group.records.reduce((sum, r) => sum + (r.total_exp_cost || 0), 0) / group.records.length;

        return {
          period: group.year.toString(),
          drilling_cost: Math.round(avgDrilling),
          man_power_cost: Math.round(avgManpower),
          blast_accessoriesdelay_cost: Math.round(avgAccessories),
          total_exp_cost: Math.round(avgExplosive),
          count: group.records.length
        };
      }).sort((a, b) => parseInt(a.period) - parseInt(b.period));
    } else if (timeMode === 'Monthly') {
      const monthlyData = validData
        .filter(record => {
          const [day, month, year] = record.blastdate.split('-');
          return year === selectedYear.toString() && month === selectedMonth;
        })
        .map(record => ({
          ...record,
          period: record.blastdate
        }))
        .sort((a, b) => {
          const [dayA, monthA, yearA] = a.blastdate.split('-');
          const [dayB, monthB, yearB] = b.blastdate.split('-');
          return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
        });

      return monthlyData;
    } else {
      let dailyData = validData;

      if (startDate && endDate) {
        dailyData = validData.filter(record => {
          const [day, month, year] = record.blastdate.split('-');
          const recordDate = new Date(year, month - 1, day);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return recordDate >= start && recordDate <= end;
        });
      } else {
        dailyData = validData
          .sort((a, b) => {
            const [dayA, monthA, yearA] = a.blastdate.split('-');
            const [dayB, monthB, yearB] = b.blastdate.split('-');
            return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
          })
          .slice(0, 7)
          .reverse();
      }

      return dailyData.map(record => ({
        ...record,
        period: record.blastdate
      }));
    }
  }, [mockData, timeMode, startYear, endYear, startDate, endDate, selectedYear, selectedMonth]);

  // Calculate totals for all cost categories from processed data
  const totals = useMemo(() => {
    return processedData.reduce((acc, record) => ({
      drilling: acc.drilling + (record.drilling_cost || 0),
      manpower: acc.manpower + (record.man_power_cost || 0),
      accessories: acc.accessories + (record.blast_accessoriesdelay_cost || 0),
      explosive: acc.explosive + (record.total_exp_cost || 0),
      total: acc.total + (record.drilling_cost || 0) + (record.man_power_cost || 0) + (record.blast_accessoriesdelay_cost || 0) + (record.total_exp_cost || 0)
    }), { drilling: 0, manpower: 0, accessories: 0, explosive: 0, total: 0 });
  }, [processedData]);


  // --- REAL AI INTEGRATION ---
  // New useEffect to call backend AI service
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (!showAIInsights || processedData.length < 2) {
        setAiBackendResults(null);
        setAiAlerts([]);
        setAiError('Insufficient data for AI analysis or AI panel not active.');
        setIsAIProcessing(false);
        setAiConfidence(0);
        return;
      }

      setIsAIProcessing(true);
      setAiError(null); // Clear previous errors

      try {
        // Prepare data for backend. It's crucial to send raw, clean data.
        // The backend ML model would then handle feature engineering, scaling, etc.
        const dataToSend = processedData.map(record => ({
          blastdate: record.blastdate,
          drilling_cost: record.drilling_cost || 0,
          man_power_cost: record.man_power_cost || 0,
          blast_accessoriesdelay_cost: record.blast_accessoriesdelay_cost || 0,
          total_exp_cost: record.total_exp_cost || 0,
          // Add other relevant features if your ML model uses them (e.g., blast_type, geology)
          // For simplicity, we'll just send costs and date for this example.
        }));

        const response = await fetch('https://your-real-ai-backend.com/api/blast-cost-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if necessary (e.g., 'Authorization': 'Bearer YOUR_TOKEN')
          },
          body: JSON.stringify({
            data: dataToSend,
            timeMode: timeMode, // Send current time mode for backend context
            currentTotals: totals // Send current totals for context (e.g., for 'What If' scenarios)
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch AI analysis from backend.');
        }

        const result = await response.json();
        setAiBackendResults(result); // Store the entire response from backend
        setAiAlerts(result.realTimeAlerts || []); // Update alerts
        setAiConfidence(result.modelConfidence || 0); // Update confidence from backend
        setAiModelVersion(result.modelInfo?.version || aiModelVersion); // Update model version from backend

      } catch (error) {
        console.error('AI Backend Fetch Error:', error);
        setAiError(`Error communicating with AI backend: ${error.message}. Please try again later.`);
        setAiBackendResults(null);
        setAiAlerts([]);
        setAiConfidence(0);
      } finally {
        setIsAIProcessing(false);
      }
    };

    // Trigger AI analysis when relevant dependencies change
    // Using a debounce/throttle for real-time systems might be wise for performance
    const handler = setTimeout(() => {
        fetchAIAnalysis();
    }, 500); // Debounce AI requests

    return () => clearTimeout(handler); // Cleanup on unmount or re-render

  }, [showAIInsights, processedData, timeMode, totals]); // Dependencies for fetching AI analysis


  // Format currency for display
  const formatCurrency = useCallback((value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // Toggle stack visibility for chart
  const toggleStack = (stackName) => {
    setActiveStacks(prev => ({
      ...prev,
      [stackName]: !prev[stackName]
    }));
  };

  // Custom tooltip component for Recharts
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

  // Export functionality
  const handleExport = async (format) => {
    try {
      // Dynamic import for jspdf
      let jsPDF;
      if (format === 'PDF') {
        const jspdfModule = await import('jspdf');
        jsPDF = jspdfModule.jsPDF;
      }

      const chartElement = chartRef.current;
      if (!chartElement) {
        alert('Chart not found for export. Please ensure the chart is rendered.');
        return;
      }

      const chartContainer = chartElement.querySelector('.recharts-wrapper') || chartElement;

      if (format === 'PNG' || format === 'JPEG') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const rect = chartContainer.getBoundingClientRect();
        const margin = 40;
        canvas.width = (rect.width + margin * 2) * 2;
        canvas.height = (rect.height + margin * 2) * 2;
        ctx.scale(2, 2);

        ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, rect.width + margin * 2, rect.height + margin * 2);

        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, margin, margin, rect.width, rect.height);

            const link = document.createElement('a');
            link.download = `Average_blast_cost_${format.toLowerCase()}.${format.toLowerCase()}`;
            link.href = canvas.toDataURL(`image/${format.toLowerCase()}`, 0.9);
            link.click();
          };

          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
      } else if (format === 'SVG') {
        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const rect = svgElement.getBoundingClientRect();
          const margin = 40;

          const clonedSvg = svgElement.cloneNode(true);
          clonedSvg.setAttribute('width', rect.width + margin * 2);
          clonedSvg.setAttribute('height', rect.height + margin * 2);
          clonedSvg.setAttribute('viewBox', `0 0 ${rect.width + margin * 2} ${rect.height + margin * 2}`);

          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('width', '100%');
          bgRect.setAttribute('height', '100%');
          bgRect.setAttribute('fill', isDark ? '#1f2937' : '#ffffff');
          clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

          const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          contentGroup.setAttribute('transform', `translate(${margin}, ${margin})`);

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
        const headers = ['Period', 'Drilling Cost', 'Manpower Cost', 'Accessories Cost', 'Explosive Cost', 'Total'];
        const csvContent = [
          headers.join(','),
          ...processedData.map(row => [
            row.period,
            row.drilling_cost || 0,
            row.man_power_cost || 0,
            row.blast_accessoriesdelay_cost || 0,
            row.total_exp_cost || 0,
            (row.drilling_cost || 0) + (row.man_power_cost || 0) + (row.blast_accessoriesdelay_cost || 0) + (row.total_exp_cost || 0)
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
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(20);
        doc.setTextColor(isDark ? 200 : 40, isDark ? 200 : 40, isDark ? 200 : 40);
        doc.text('Average Blasting Cost Analysis', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(isDark ? 150 : 100, isDark ? 150 : 100, isDark ? 150 : 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

        const chartContainer = chartElement.querySelector('.recharts-wrapper') || chartElement;
        const svgElement = chartContainer.querySelector('svg');

        if (svgElement) {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const rect = svgElement.getBoundingClientRect();
            const margin = 40;
            canvas.width = (rect.width + margin * 2) * 2;
            canvas.height = (rect.height + margin * 2) * 2;
            ctx.scale(2, 2);

            ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
            ctx.fillRect(0, 0, rect.width + margin * 2, rect.height + margin * 2);

            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();

            img.onload = () => {
              ctx.drawImage(img, margin, margin, rect.width, rect.height);

              const imgData = canvas.toDataURL('image/png');
              const chartWidth = pageWidth - 40;
              const chartHeight = ((rect.height + margin * 2) / (rect.width + margin * 2)) * chartWidth;

              const chartY = (pageHeight - chartHeight) / 2 + 10;
              doc.addImage(imgData, 'PNG', 20, chartY, chartWidth, chartHeight);

              doc.save('Average_blast_cost_pdf.pdf');
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
          } catch (error) {
            console.error('Error adding chart to PDF:', error);
            doc.save('Average_blast_cost_pdf.pdf');
          }
        } else {
          doc.save('Average_blast_cost_pdf.pdf');
        }
      }

      setIsExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check console for details.');
    }
  };

  const stackCategories = [
    { key: 'drilling', label: 'Drilling Cost', color: '#3b82f6', icon: '🔧' },
    { key: 'manpower', label: 'Manpower Cost', color: '#10b981', icon: '👥' },
    { key: 'accessories', label: 'Accessories Cost', color: '#f59e0b', icon: '⚡' },
    { key: 'explosive', label: 'Explosive Cost', color: '#ef4444', icon: '💥' }
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-all duration-500 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
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
                {aiLearningMode && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="AI is in learning mode" />}
                {isAIProcessing && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="AI is processing" />}
                {aiAlerts.length > 0 && !isAIProcessing && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full" title={`${aiAlerts.length} new alerts`}>
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

            {/* Mobile Controls (simplified) */}
            <div className="flex sm:hidden items-center gap-3">
              {/* AI Insights Button for Mobile */}
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  showAIInsights
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-900'
                }`}
              >
                <Brain className="w-5 h-5" />
              </button>
              {/* Export Button for Mobile */}
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

        {/* Main Content Area: Chart and AI Insights (Side-by-Side on large screens) */}
        <div className={`grid grid-cols-1 gap-6 ${showAIInsights ? 'lg:grid-cols-[1fr_minmax(320px,_400px)]' : ''}`}>
          {/* Chart Section (Left/Main Column) */}
          <div className={`rounded-2xl p-6 mb-8 lg:mb-0 backdrop-blur-xl border ${
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
                      offset: -5,
                      fill: isDark ? '#9ca3af' : '#6b7280'
                    }}
                  />
                  <YAxis
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    label={{
                      value: timeMode === 'Yearly' ? 'Average Cost (₹)' : 'Blast Cost (₹)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: isDark ? '#9ca3af' : '#6b7280'
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      color: isDark ? '#e2e8f0' : '#4a5568'
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
                      dataKey="total_exp_cost"
                      stackId="costs"
                      fill="#ef4444"
                      name="Explosive Cost"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Panel (Right Column on large screens) */}
          {showAIInsights && (
            <div className={`rounded-2xl p-6 mb-8 lg:mb-0 backdrop-blur-xl border ${
              isDark
                ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30'
                : 'bg-gradient-to-br from-purple-50/80 to-blue-50/80 border-purple-200/50'
            } lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
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
                        {!isAIProcessing && aiBackendResults && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {aiConfidence.toFixed(1)}% Confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Mode Toggle */}
                <div className={`flex rounded-xl p-1 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } flex-wrap justify-center`}>
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 m-1 ${
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
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                    </div>
                    <div className="space-y-1">
                      <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        AI Engine Processing...
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Communicating with cloud ML service <Cloud className="inline-block w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : aiError ? (
                <div className={`p-8 rounded-xl border-2 border-dashed ${
                    isDark ? 'border-red-600 bg-red-900/30' : 'bg-red-50/50 border-red-300'
                } text-center`}>
                    <ServerCog className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        AI Service Error
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {aiError}
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-700'}`}>
                        Please check your network connection or contact support.
                    </p>
                </div>
              ) : !aiBackendResults ? (
                <div className={`p-8 rounded-xl border-2 border-dashed ${
                  isDark ? 'border-gray-600 bg-gray-800/30' : 'bg-gray-300 bg-gray-50/50'
                } text-center`}>
                  <DatabaseZap className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    No AI Analysis Available
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    The AI engine requires sufficient valid data for the selected period to provide insights.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Insights Mode */}
                  {aiAnalysisMode === 'insights' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${aiBackendResults.trend.direction === 'increasing' ? 'bg-red-500' : 'bg-green-500'}`}>
                              {aiBackendResults.trend.direction === 'increasing' ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                            </div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Trend Analysis</h3>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Direction: <span className="font-semibold">{aiBackendResults.trend.direction}</span></p>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Strength: <span className="font-semibold">{aiBackendResults.trend.strength.toFixed(2)}</span></p>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${aiBackendResults.trend.strength > 0.3 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, aiBackendResults.trend.strength * 300)}%` }}></div></div>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${aiBackendResults.risk.overallRisk === 'High' ? 'bg-red-500' : aiBackendResults.risk.overallRisk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}><AlertTriangle className="w-5 h-5 text-white" /></div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Risk Level</h3>
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiBackendResults.risk.overallRisk}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs"><span>Volatility</span><span className={`font-medium ${aiBackendResults.risk.costVolatility === 'High' ? 'text-red-500' : 'text-green-500'}`}>{aiBackendResults.risk.costVolatility}</span></div>
                            <div className="flex justify-between text-xs"><span>Trend Risk</span><span className={`font-medium ${aiBackendResults.risk.trendRisk === 'High' ? 'text-red-500' : 'text-green-500'}`}>{aiBackendResults.risk.trendRisk}</span></div>
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${aiBackendResults.dataQuality === 'High' ? 'bg-green-500' : aiBackendResults.dataQuality === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}><CheckCircle className="w-5 h-5 text-white" /></div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Data Quality</h3>
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiBackendResults.dataQuality}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Model Accuracy: {(aiBackendResults.modelAccuracy * 100).toFixed(1)}%</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-purple-500"><Activity className="w-5 h-5 text-white" /></div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Patterns</h3>
                          </div>
                          <div className="space-y-2">{Object.entries(aiBackendResults.patterns).map(([key, value]) => (<div key={key} className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-400'}`}></div><span className={`text-xs capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{key}</span></div>))}</div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Statistical Analysis</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mean Cost</span><p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(aiBackendResults.statistics.mean)}</p></div>
                          <div><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Std. Deviation</span><p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(aiBackendResults.statistics.stdDev)}</p></div>
                          <div><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coeff. of Variation</span><p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(aiBackendResults.statistics.coefficientOfVariation * 100).toFixed(1)}%</p></div>
                          <div><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Entropy</span><p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiBackendResults.statistics.entropy.toFixed(2)}</p></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Predictions Mode */}
                  {aiAnalysisMode === 'predictions' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {aiBackendResults.predictions.map((prediction, index) => (
                          <div key={index} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-purple-500"><TrendingUp className="w-5 h-5 text-white" /></div><h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{prediction.period}</h3></div>
                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(prediction.predictedCost)}</p>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${prediction.confidence > 0.7 ? 'bg-green-500' : prediction.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}></div><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{(prediction.confidence * 100).toFixed(0)}% confidence</span></div>
                              <div className="text-xs space-y-1 break-words"><p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}</p><p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Model: {prediction.model}</p></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800/30' : 'bg-gray-300 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-3 mb-3"><Zap className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} /><h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Prediction Insights</h4></div>
                        <div className="grid grid-cols-1 gap-4">
                          <div><p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words`}><strong>Trend Forecast:</strong> Based on an adaptive hybrid ML model, costs are expected to {aiBackendResults.trend.direction === 'increasing' ? 'continue rising' : 'remain stable or decrease slightly'}.</p></div>
                          <div><p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words`}><strong>Risk Assessment:</strong> Prediction confidence decreases over the time horizon. Monitor key indicators for model recalibration.</p></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Mode */}
                  {aiAnalysisMode === 'recommendations' && (
                    <div className="space-y-4">
                      {aiBackendResults.recommendations.length > 0 ? aiBackendResults.recommendations.map((rec, index) => (
                        <div key={index} className={`p-4 rounded-xl border-l-4 ${rec.priority === 'critical' ? 'border-red-600 bg-red-50/50' : rec.priority === 'high' ? 'border-red-500 bg-red-50/50' : rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50/50' : 'border-blue-500 bg-blue-50/50'} ${isDark ? 'bg-opacity-10' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${rec.priority === 'critical' ? 'bg-red-600' : rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}><Target className="w-5 h-5 text-white" /></div>
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.type}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.priority === 'critical' ? 'bg-red-100 text-red-800' : rec.priority === 'high' ? 'bg-red-100 text-red-800' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{rec.priority.toUpperCase()}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.impact === 'High' ? 'bg-green-100 text-green-800' : rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{rec.impact} Impact</span>
                              </div>
                              <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words`}>{rec.message}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                                <div className="col-span-full"><p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} break-words`}><strong>Action:</strong> {rec.action}</p></div>
                                <div><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong>Savings:</strong> <span className="font-semibold text-green-600">{formatCurrency(rec.expectedSavings)}</span></p></div>
                                <div><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong>Timeframe:</strong> <span className="font-semibold">{rec.timeframe}</span></p></div>
                              </div>
                              {rec.rootCauseHint && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Search className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                  <span className={`text-xs italic ${isDark ? 'text-gray-400' : 'text-gray-500'} break-words`}>Hint: {rec.rootCauseHint}</span>
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${rec.confidence > 0.8 ? 'bg-green-500' : rec.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}></div><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{(rec.confidence * 100).toFixed(0)}% confidence</span></div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className={`p-8 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800/30' : 'bg-gray-300 bg-gray-50/50'} text-center`}>
                          <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No High-Priority Actions Needed</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>The AI has not identified any high-priority recommendations at this time. Continue monitoring for optimal performance.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real-time Monitoring Mode */}
                  {aiAnalysisMode === 'realtime' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div><h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Real-time Monitoring Active</h3></div>
                      {aiBackendResults.realTimeAlerts.length > 0 ? (
                        <div className="space-y-4">
                          {aiBackendResults.realTimeAlerts.map((alert, index) => (
                            <div key={index} className={`p-4 rounded-xl border-l-4 ${alert.severity === 'high' ? 'border-red-500 bg-red-50/50' : alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50/50' : 'border-blue-500 bg-blue-50/50'} ${isDark ? 'bg-opacity-10' : ''}`}>
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}><AlertTriangle className="w-5 h-5 text-white" /></div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.type}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'high' ? 'bg-red-100 text-red-800' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{alert.severity.toUpperCase()}</span>
                                  </div>
                                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words`}>{alert.message}</p>
                                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(alert.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`p-8 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800/30' : 'bg-gray-300 bg-gray-50/50'} text-center`}>
                          <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>All Systems Normal</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No alerts detected. Operations are running smoothly.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optimization Mode */}
                  {aiAnalysisMode === 'optimization' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cost Optimization Opportunities</h4>
                          <div className="space-y-3">
                            {Object.entries(aiBackendResults.distribution).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{key}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.toFixed(1)}%</span>
                                  <div className={`px-2 py-1 rounded text-xs ${value > 35 ? 'bg-red-100 text-red-800' : value > 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{value > 35 ? 'High' : value > 25 ? 'Medium' : 'Low'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
                          <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance Metrics</h4>
                          <div className="space-y-3">
                            {Object.entries(aiBackendResults.efficiency).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.toFixed(1)}%</span>
                                  <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}><div className={`h-2 rounded-full ${value > 80 ? 'bg-green-500' : value > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${value}%` }}></div></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {aiBackendResults.dominantCategory.key && totals[aiBackendResults.dominantCategory.key] > 0 && (
                        <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-purple-600 bg-purple-900/30' : 'border-purple-300 bg-purple-50/50'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <MessageSquare className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Optimization Scenario: "What If?"</h4>
                          </div>
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                            If you could reduce **{aiBackendResults.dominantCategory.key.charAt(0).toUpperCase() + aiBackendResults.dominantCategory.key.slice(1)} Cost** by just **10%**,
                            your estimated savings for the current period would be approximately:
                            <span className="font-bold text-lg text-green-600 ml-2">{formatCurrency(totals[aiBackendResults.dominantCategory.key] * 0.1)}</span>.
                          </p>
                          <p className={`text-xs italic ${isDark ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                            This is a simulated scenario based on current data. Actual savings may vary.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
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
                  {totals.total > 0 ? ((value / totals.total) * 100).toFixed(1) : 0}% of total
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
              {['PNG', 'JPEG', 'PDF', 'SVG', 'CSV'].map((format) => (
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