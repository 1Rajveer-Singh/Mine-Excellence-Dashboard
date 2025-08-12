import React, { useState, useMemo, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, Moon, Sun, Menu, X, BarChart3, TrendingUp, Calculator } from 'lucide-react';

const BlastAnalyticsDashboard = ({ filteredData, DarkMode = false }) => {
  const isDark = (!DarkMode);
  const [timeMode, setTimeMode] = useState('Daily');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [startYear, setStartYear] = useState(2023);
  const [endYear, setEndYear] = useState(2023);
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [pfOption, setPfOption] = useState('Actual_PF');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chartRef = useRef(null);

  // Use filteredData directly and add data validation
  const rawData = Array.isArray(filteredData) && filteredData.length > 0 ? filteredData : [];
  
  // Debug logging
  console.log('🔍 Total Explosive Component - Raw Data:', {
    hasData: rawData.length > 0,
    dataLength: rawData.length,
    sampleItem: rawData[0],
    dataSource: rawData[0]?.dataSource
  });

  // Helper function to parse MM/DD/YYYY date format from CSV
  const parseBlastDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle MM/DD/YYYY format from CSV
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    // Handle other formats
    return new Date(dateStr);
  };

  // Calculate derived metrics
  const processedData = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.log('⚠️ No data available for processing');
      return [];
    }
    
    return rawData.map(item => {
      // Debug logging for data structure
      if (rawData.indexOf(item) === 0) {
        console.log('📊 Sample data item:', item);
        console.log('📊 Available fields:', Object.keys(item));
      }
      
      // Use actual field names from your data structure
      const total_explosive = parseFloat(item.total_explosive_kg) || 0;
      const total_drill = parseFloat(item.total_drill_mtr || item.total_drill) || 0;
      
      const explosive_consumption = total_explosive > 0 && total_drill > 0 
        ? total_explosive / total_drill 
        : 0;
      
      // Use the actual powder factor fields from your data
      const actual_pf = parseFloat(item.actual_pf_ton_kg) || 0;
      const theoretical_pf = parseFloat(item.theoretical_pf_ton_kg) || 0;
      
      // Parse date to extract year
      const blastDate = parseBlastDate(item.blastdate);
      const year = blastDate ? blastDate.getFullYear() : new Date().getFullYear();
      
      return {
        ...item,
        year: year,
        explosive_consumption: parseFloat(explosive_consumption.toFixed(2)),
        Actual_PF: parseFloat(actual_pf.toFixed(3)),
        Theoretical_PF: parseFloat(theoretical_pf.toFixed(3)),
        // Ensure required numeric fields are present
        total_explosive_kg: total_explosive,
        total_drill_mtr: total_drill,
        ton_recover: parseFloat(item.ton_recover) || 0
      };
    });
  }, [rawData]);

  // Filter data based on time mode and date range
  const chartData = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      console.log('⚠️ No processed data available for chart');
      return [];
    }
    
    let filtered = processedData.filter(item => {
      // More lenient filtering - check if at least one required field has data
      const hasExplosive = (item.total_explosive_kg || 0) > 0;
      const hasDrill = (item.total_drill_mtr || item.total_drill || 0) > 0;
      const hasTonnage = (item.ton_recover || 0) > 0;
      const hasDate = item.blastdate && item.blastdate !== '';
      
      if (!hasDate) {
        console.log('⚠️ Item missing date:', item);
        return false;
      }
      
      // Allow items with at least some data
      return hasExplosive || hasDrill || hasTonnage;
    });
    
    console.log(`📊 Filtered ${filtered.length} items from ${processedData.length} total items`);
    
    if (filtered.length === 0) {
      console.log('⚠️ No items passed filtering criteria');
      // Show sample of what was filtered out
      console.log('📋 Sample of raw data:', processedData.slice(0, 3));
    }

    if (timeMode === 'Daily') {
      // Daily mode: Show all records within date range
      filtered = filtered.filter(item => {
        const itemDate = parseBlastDate(item.blastdate);
        if (!itemDate) return false;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    } else if (timeMode === 'Monthly') {
      // Monthly mode: Show records for selected year and month
      filtered = filtered.filter(item => {
        const itemDate = parseBlastDate(item.blastdate);
        if (!itemDate) return false;
        return itemDate.getFullYear() === selectedYear && 
               String(itemDate.getMonth() + 1).padStart(2, '0') === selectedMonth;
      });
    } else if (timeMode === 'Yearly') {
      // Yearly aggregation: Sum up data by year
      const yearlyData = {};
      filtered.forEach(item => {
        const year = item.year;
        if (year >= startYear && year <= endYear) {
          if (!yearlyData[year]) {
            yearlyData[year] = {
              blastdate: year.toString(),
              total_explosive_kg: 0,
              total_drill_mtr: 0,
              ton_recover: 0,
              actual_pf_sum: 0,
              theoretical_pf_sum: 0,
              count: 0
            };
          }
          yearlyData[year].total_explosive_kg += item.total_explosive_kg || 0;
          yearlyData[year].total_drill_mtr += item.total_drill_mtr || 0;
          yearlyData[year].ton_recover += item.ton_recover || 0;
          yearlyData[year].actual_pf_sum += item.actual_pf_ton_kg || 0;
          yearlyData[year].theoretical_pf_sum += item.theoretical_pf_ton_kg || 0;
          yearlyData[year].count += 1;
        }
      });

      filtered = Object.values(yearlyData).map(yearData => {
        const explosive_consumption = yearData.total_drill_mtr > 0 
          ? yearData.total_explosive_kg / yearData.total_drill_mtr 
          : 0;
        const actual_pf = yearData.count > 0 
          ? yearData.actual_pf_sum / yearData.count 
          : 0;
        const theoretical_pf = yearData.count > 0 
          ? yearData.theoretical_pf_sum / yearData.count 
          : 0;
        
        return {
          blastdate: yearData.blastdate,
          total_explosive_kg: yearData.total_explosive_kg,
          total_drill_mtr: yearData.total_drill_mtr,
          ton_recover: yearData.ton_recover,
          explosive_consumption: parseFloat(explosive_consumption.toFixed(2)),
          Actual_PF: parseFloat(actual_pf.toFixed(3)),
          Theoretical_PF: parseFloat(theoretical_pf.toFixed(3))
        };
      });
    }

    return filtered.sort((a, b) => {
      const dateA = parseBlastDate(a.blastdate);
      const dateB = parseBlastDate(b.blastdate);
      return dateA - dateB;
    });
  }, [processedData, timeMode, startDate, endDate, startYear, endYear, selectedYear, selectedMonth]);

  // Calculate trendline for powder factor
  const calculateTrendline = (data, yKey) => {
    if (data.length < 2) return [];
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((point, index) => {
      const x = index;
      const y = point[yKey] || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((point, index) => ({
      ...point,
      trendline: parseFloat((slope * index + intercept).toFixed(3))
    }));
  };

  // Enhanced chart data with trendline
  const chartDataWithTrendline = useMemo(() => {
    return calculateTrendline(chartData, pfOption);
  }, [chartData, pfOption]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const totalExplosive = chartData.reduce((sum, item) => sum + (item.total_explosive_kg || 0), 0);
    const totalDrill = chartData.reduce((sum, item) => sum + (item.total_drill_mtr || 0), 0);
    const totalRecover = chartData.reduce((sum, item) => sum + (item.ton_recover || 0), 0);
    const avgExplosiveConsumption = chartData.reduce((sum, item) => sum + (item.explosive_consumption || 0), 0) / chartData.length;
    const avgPF = chartData.reduce((sum, item) => sum + (item[pfOption] || 0), 0) / chartData.length;

    return {
      totalExplosive: totalExplosive.toFixed(0),
      totalDrill: totalDrill.toFixed(1),
      totalRecover: totalRecover.toFixed(0),
      avgExplosiveConsumption: avgExplosiveConsumption.toFixed(2),
      avgPF: avgPF.toFixed(3),
      recordCount: chartData.length
    };
  }, [chartData, pfOption]);

  // Enhanced export functions with better formatting
  const exportChart = async (format) => {
    const chartElement = chartRef.current?.querySelector('.recharts-wrapper');
    if (!chartElement) return;

    try {
      if (format === 'csv') {
        // Export data as CSV with enhanced formatting
        const csvData = chartDataWithTrendline.map(item => ({
          'Date': item.blastdate,
          'Time Mode': timeMode,
          'Total Explosive (kg)': item.total_explosive_kg?.toFixed(1) || 0,
          'Total Drill (m)': item.total_drill_mtr?.toFixed(1) || 0,
          'Consumption (kg/m³)': item.explosive_consumption?.toFixed(2) || 0,
          'Actual PF': item.Actual_PF?.toFixed(3) || 0,
          'Theoretical PF': item.Theoretical_PF?.toFixed(3) || 0,
          'Trendline': item.trendline?.toFixed(3) || 0
        }));

        // Add metadata header
        const metadata = [
          `# Blast Analytics Export`,
          `# Generated: ${new Date().toLocaleString()}`,
          `# Time Mode: ${timeMode}`,
          `# Powder Factor Type: ${pfOption.replace('_', ' ')}`,
          `# Records: ${csvData.length}`,
          `# Date Range: ${timeMode === 'Daily' ? `${startDate} to ${endDate}` : 
                          timeMode === 'Monthly' ? `${selectedYear}-${selectedMonth}` : 
                          `${startYear} to ${endYear}`}`,
          ``,
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([metadata], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `blast-analytics-${timeMode.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else if (format === 'svg') {
        const svgElement = chartElement.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blast-analytics-${timeMode.toLowerCase()}-chart.${format}`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // PDF export with chart only
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        
        // Use landscape orientation for better chart display
        const doc = new jsPDF('l', 'mm', 'a4');
        
        // Add minimal title and metadata
        doc.setFontSize(18);
        doc.text('Blast Analytics Chart', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`${timeMode} View - ${pfOption.replace('_', ' ')}`, 20, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 37);
        
        // Date range info
        let dateRangeText = '';
        if (timeMode === 'Daily') {
          dateRangeText = `Date Range: ${startDate} to ${endDate}`;
        } else if (timeMode === 'Monthly') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          dateRangeText = `Month: ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
        } else {
          dateRangeText = `Year Range: ${startYear} to ${endYear}`;
        }
        doc.text(dateRangeText, 20, 44);
        
        // Capture and add chart
        try {
          const canvas = await html2canvas(chartElement, {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate dimensions to fit chart optimally in landscape
          const pageWidth = 297; // A4 landscape width
          const pageHeight = 210; // A4 landscape height
          const margin = 20;
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - 60; // Leave space for title
          
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
          
          doc.addImage(imgData, 'PNG', xPos, 55, imgWidth, imgHeight);
          
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
        
        doc.save(`blast-analytics-${timeMode.toLowerCase()}-chart.pdf`);
      } else {
        // Enhanced PNG/JPEG export
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgElement = chartElement.querySelector('svg');
        
        canvas.width = 1200;
        canvas.height = 600;
        
        // Create image from SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `blast-analytics-${timeMode.toLowerCase()}-chart.${format}`;
            link.click();
            URL.revokeObjectURL(url);
          }, `image/${format}`, 0.95);
        };
        
        img.src = url;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  // Enhanced custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    // Enhanced date formatting for different time modes
    const formatDate = (dateStr) => {
      if (timeMode === 'Daily') {
        const date = parseBlastDate(dateStr);
        return date ? date.toLocaleDateString() : dateStr;
      } else if (timeMode === 'Monthly') {
        const date = parseBlastDate(dateStr);
        return date ? date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : dateStr;
      } else {
        return `Year: ${dateStr}`;
      }
    };

    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
      }`}>
        <p className="font-medium mb-2">{formatDate(label)}</p>
        <p className="text-xs text-gray-500 mb-2">{timeMode} View</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
            {entry.dataKey === 'explosive_consumption' ? ' kg/m³' : ''}
          </p>
        ))}
      </div>
    );
  };

  const themeClasses = isDark 
    ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white'
    : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900';

  const cardClasses = isDark
    ? 'bg-gray-800/50 backdrop-blur-sm border-gray-700'
    : 'bg-white/70 backdrop-blur-sm border-gray-200';

  return (
    <div className={`min-h-screen transition-all duration-300 ${themeClasses}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Calculator className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold">Total Explosive Consumption / Powder Factor</h1>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-4">
              
              <div className="relative">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                {isExportOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${cardClasses}`}>
                    <div className="p-2">
                      {['png', 'jpeg', 'svg', 'pdf', 'csv'].map((format) => (
                        <button
                          key={format}
                          onClick={() => {
                            exportChart(format);
                            setIsExportOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded transition-colors ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          Export as {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="px-4 py-3 space-y-3">
              
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Export Options:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['png', 'jpeg', 'svg', 'pdf', 'csv'].map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        exportChart(format);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Controls Card - Moved to top with increased height */}
        <div className={`p-6 mb-6 rounded-lg border ${cardClasses} shadow-lg`}>
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between gap-8 min-h-[60px]">
              {/* View Mode */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium whitespace-nowrap">View Mode:</label>
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  {['Daily', 'Monthly', 'Yearly'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTimeMode(mode)}
                      className={`px-4 py-2 text-sm rounded transition-colors whitespace-nowrap ${
                        timeMode === mode
                          ? 'bg-blue-500 text-white'
                          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Controls */}
              <div className="flex items-center space-x-4">
                {timeMode === 'Daily' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">Start:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">End:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </>
                ) : timeMode === 'Monthly' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">Year:</label>
                      <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-24 px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">Month:</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      >
                        {[
                          { value: '01', label: 'Jan' },
                          { value: '02', label: 'Feb' },
                          { value: '03', label: 'Mar' },
                          { value: '04', label: 'Apr' },
                          { value: '05', label: 'May' },
                          { value: '06', label: 'Jun' },
                          { value: '07', label: 'Jul' },
                          { value: '08', label: 'Aug' },
                          { value: '09', label: 'Sep' },
                          { value: '10', label: 'Oct' },
                          { value: '11', label: 'Nov' },
                          { value: '12', label: 'Dec' }
                        ].map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">Start:</label>
                      <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-24 px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium whitespace-nowrap">End:</label>
                      <input
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-24 px-3 py-2 text-sm border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Powder Factor Type */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium whitespace-nowrap">Powder Factor:</label>
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  {['Actual_PF', 'Theoretical_PF'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPfOption(option)}
                      className={`px-4 py-2 text-sm rounded transition-colors whitespace-nowrap ${
                        pfOption === option
                          ? 'bg-purple-500 text-white'
                          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Mode and Date Range */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">View Mode:</label>
                  <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    {['Daily', 'Monthly', 'Yearly'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTimeMode(mode)}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          timeMode === mode
                            ? 'bg-blue-500 text-white'
                            : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                
                {timeMode === 'Daily' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                ) : timeMode === 'Monthly' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      >
                        {[
                          { value: '01', label: 'January' },
                          { value: '02', label: 'February' },
                          { value: '03', label: 'March' },
                          { value: '04', label: 'April' },
                          { value: '05', label: 'May' },
                          { value: '06', label: 'June' },
                          { value: '07', label: 'July' },
                          { value: '08', label: 'August' },
                          { value: '09', label: 'September' },
                          { value: '10', label: 'October' },
                          { value: '11', label: 'November' },
                          { value: '12', label: 'December' }
                        ].map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Year</label>
                      <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Year</label>
                      <input
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(parseInt(e.target.value))}
                        min="2020"
                        max="2030"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Powder Factor Option */}
              <div className="space-y-4">
                <label className="block text-sm font-medium">Powder Factor Type:</label>
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  {['Actual_PF', 'Theoretical_PF'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPfOption(option)}
                      className={`px-3 py-2 text-sm rounded flex-1 transition-colors ${
                        pfOption === option
                          ? 'bg-purple-500 text-white'
                          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg border ${cardClasses}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Explosive</p>
                  <p className="text-2xl font-bold">{summaryStats.totalExplosive} kg</p>
                  <p className="text-xs opacity-50">{timeMode} View</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${cardClasses}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Avg Consumption</p>
                  <p className="text-2xl font-bold">{summaryStats.avgExplosiveConsumption} kg/m³</p>
                  <p className="text-xs opacity-50">{timeMode} View</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${cardClasses}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Avg Powder Factor</p>
                  <p className="text-2xl font-bold">{summaryStats.avgPF}</p>
                  <p className="text-xs opacity-50">{pfOption.replace('_', ' ')}</p>
                </div>
                <Calculator className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${cardClasses}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Records</p>
                  <p className="text-2xl font-bold">{summaryStats.recordCount}</p>
                  <p className="text-xs opacity-50">
                    {timeMode === 'Daily' ? 'Individual Records' : 
                     timeMode === 'Monthly' ? 'Monthly Records' : 'Yearly Totals'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className={`p-6 rounded-lg border ${cardClasses} mb-6`} ref={chartRef}>
          <div className="h-96 sm:h-[400px] lg:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataWithTrendline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="blastdate" 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  label={{ value: 'Explosive Consumption (kg/m³)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  label={{ value: 'Powder Factor', angle: 90, position: 'insideRight' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  yAxisId="left"
                  dataKey="explosive_consumption" 
                  fill="#3b82f6" 
                  name="Explosive Consumption (kg/m³)"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={pfOption} 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name={`${pfOption.replace('_', ' ')} (Actual Data)`}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="trendline" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Trendline"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend - Below Chart */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Explosive Consumption (kg/m³)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">{pfOption.replace('_', ' ')} (Actual Data)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-red-500 border-dashed border-red-500" style={{borderWidth: '1px', borderStyle: 'dashed'}}></div>
                <span className="text-sm">Trendline</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BlastAnalyticsDashboard;