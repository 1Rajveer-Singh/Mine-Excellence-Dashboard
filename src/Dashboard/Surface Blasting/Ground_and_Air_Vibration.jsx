//code complete
import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {Calendar,TrendingUp,Volume2,Download,BarChart3,Filter,} from 'lucide-react';

const VibrationDashboard = ({ filteredData, DarkMode }) => {
  const isDarkMode = !DarkMode;
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
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  // Process and filter data based on current settings
  const processedData = useMemo(() => {
    if (!Array.isArray(filteredData)) {
      return [];
    }

    let validData = filteredData.filter(
      (item) =>
        item.total_explos_cost &&
        item.total_explos_cost > 0 &&
        isValidDate(item.blastdate)
    );

    validData = validData.filter((item) => {
      const hasValidPPV = isValidValue(item.ppv);
      const hasValidAirBlast = isValidValue(item.air_blast);
      return hasValidPPV || hasValidAirBlast;
    });

    // Parse blastdate in MM/DD/YYYY format from CSV
    const parseDate = (dateStr) => {
      const [month, day, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    };

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
          return itemDate >= start && itemDate <= end;
        });
      }
    } else if (timeMode === 'monthly') {
      validData = validData.filter((item) => {
        const itemDate = parseDate(item.blastdate);
        return itemDate.getFullYear().toString() === dateRange.selectedYear &&
               (itemDate.getMonth() + 1).toString().padStart(2, '0') === dateRange.selectedMonth;
      });
    } else {
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
            costs: [],
            ppvValues: [],
            airBlastValues: [],
            count: 0,
          };
        }

        yearlyData[year].costs.push(item.total_explos_cost);
        if (isValidValue(item.ppv)) yearlyData[year].ppvValues.push(item.ppv);
        if (isValidValue(item.air_blast))
          yearlyData[year].airBlastValues.push(item.air_blast);
        yearlyData[year].count++;
      });

      return Object.values(yearlyData)
        .map((yearData) => ({
          date: yearData.year.toString(),
          displayDate: yearData.year.toString(),
          cost:
            yearData.costs.reduce((sum, cost) => sum + cost, 0) /
            yearData.costs.length,
          ppv:
            yearData.ppvValues.length > 0
              ? yearData.ppvValues.reduce((sum, ppv) => sum + ppv, 0) /
                yearData.ppvValues.length
              : null,
          air_blast:
            yearData.airBlastValues.length > 0
              ? yearData.airBlastValues.reduce((sum, ab) => sum + ab, 0) /
                yearData.airBlastValues.length
              : null,
          blastCount: yearData.count,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return validData
        .map((item) => ({
          ...item,
          date: item.blastdate,
          displayDate: item.blastdate,
          cost: item.total_explos_cost,
          ppv: isValidValue(item.ppv) ? item.ppv : null,
          air_blast: isValidValue(item.air_blast) ? item.air_blast : null,
        }))
        .sort((a, b) => {
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateA - dateB;
        });
    }
  }, [filteredData, timeMode, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const validCosts = processedData.filter((item) => item.cost > 0);
    const validPPV = processedData.filter(
      (item) => item.ppv !== null && item.ppv > 0
    );
    const validAirBlast = processedData.filter(
      (item) => item.air_blast !== null && item.air_blast > 0
    );

    return {
      totalCost: validCosts.reduce((sum, item) => sum + item.cost, 0),
      avgPPV:
        validPPV.length > 0
          ? validPPV.reduce((sum, item) => sum + item.ppv, 0) /
            validPPV.length
          : 0,
      avgAirBlast:
        validAirBlast.length > 0
          ? validAirBlast.reduce((sum, item) => sum + item.air_blast, 0) /
            validAirBlast.length
          : 0,
      totalBlasts: processedData.length,
    };
  }, [processedData]);

  // Prepare chart data with conditional series
  const chartData = useMemo(() => {
    return processedData.map((item) => {
      const dataPoint = {
        date: item.date,
        displayDate: item.displayDate,
        cost: item.cost,
      };

      if (activeMeasurements.ppv && item.ppv !== null) {
        dataPoint.ppv = item.ppv;
      }

      if (activeMeasurements.airBlast && item.air_blast !== null) {
        dataPoint.air_blast = item.air_blast;
      }

      return dataPoint;
    });
  }, [processedData, activeMeasurements]);

  // Enhanced export functionality
  const handleExport = async (format) => {
    setIsExporting(true);
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      const chartContainer = chartRef.current;
      if (!chartContainer) throw new Error('Chart not found');

      if (format === 'png' || format === 'jpeg') {
        // Create canvas for image export
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const rect = chartContainer.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        
        ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        // Add title
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Vibration Analysis - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`, rect.width / 2, 20);
        
        // Get SVG and convert to image
        const svgElement = chartContainer.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();
          
          img.onload = () => {
            ctx.drawImage(img, 0, 40, rect.width, rect.height - 40);
            
            const link = document.createElement('a');
            link.download = `vibration-analysis-${timeMode}-${new Date().toISOString().split('T')[0]}.${format}`;
            link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
            link.click();
            
            setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
            setTimeout(() => setExportNotification(''), 3000);
            setIsExporting(false);
          };
          
          img.onerror = () => {
            throw new Error('Failed to load chart image');
          };
          
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
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
        }
      } else if (format === 'pdf') {
        // PDF export using html2canvas and jsPDF
        const element = chartContainer;
        const canvas = await html2canvas(element, {
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
          item.ppv || 'N/A',
          item.air_blast || 'N/A'
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

  const toggleMeasurement = (type) => {
    setActiveMeasurements((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
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

            <div className="flex items-center justify-center sm:justify-end">
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

        {/* Controls */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-4 sm:p-6 shadow-xl relative z-0`}>
          <div className="grid grid-cols-1 gap-6">
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
            <div>
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
              ) : (
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
            <div className="h-80 sm:h-96" ref={chartRef}>
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
            <div className="h-80 sm:h-96 flex items-center justify-center">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
        </div>
      </div>
    </div>
  );
};

VibrationDashboard.propTypes = {
  filteredData: PropTypes.arrayOf(
    PropTypes.shape({
      total_explos_cost: PropTypes.number,
      blastdate: PropTypes.string,
      ppv: PropTypes.number,
      air_blast: PropTypes.number,
    })
  ).isRequired,
  darkMode: PropTypes.bool.isRequired,
};

export default VibrationDashboard;