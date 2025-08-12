//Code fixed
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Volume2, Download, BarChart, Filter } from 'lucide-react';

const FlyRock = ({ filteredData, DarkMode }) => {
  const isDarkMode = (!DarkMode);
  const [timeMode, setTimeMode] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    startYear: new Date().getFullYear() - 1,
    endYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
  });
  const [activeMeasurements, setActiveMeasurements] = useState({
    flyrock: true
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportNotification, setExportNotification] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const exportRef = useRef(null);
  const chartRef = useRef(null);

  // Data validation and debugging
  console.log('🔍 Flyrock - Received data:', {
    hasData: Array.isArray(filteredData) && filteredData.length > 0,
    dataLength: filteredData?.length || 0,
    sampleRecord: filteredData?.[0],
    dataSource: filteredData?.[0]?.dataSource
  });

  const rawData = Array.isArray(filteredData) && filteredData.length > 0 ? filteredData : [];

  // Debug data structure
  useEffect(() => {
    console.log('🔍 Flyrock Debug:', {
      filteredDataType: typeof filteredData,
      filteredDataIsArray: Array.isArray(filteredData),
      filteredDataLength: filteredData?.length || 0,
      rawDataLength: rawData.length,
      sampleRecord: rawData[0],
      requiredFields: rawData[0] ? {
        blastdate: rawData[0].blastdate,
        flyrock: rawData[0].flyrock,
        dataSource: rawData[0].dataSource
      } : 'No data'
    });
  }, [filteredData, rawData]);

  // Month options for dropdown
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

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

  // Helper: Parse multiple date formats (MM/DD/YYYY from CSV and DD-MM-YYYY from JSON)
  const parseBlastDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Handle MM/DD/YYYY format (CSV)
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      if (!month || !day || !year) return null;
      return new Date(year, month - 1, day);
    }
    
    // Handle DD-MM-YYYY format (JSON)
    if (dateStr.includes('-')) {
      const [day, month, year] = dateStr.split('-').map(Number);
      if (!day || !month || !year) return null;
      return new Date(year, month - 1, day);
    }
    
    return null;
  };

  const isValidDate = (dateStr) => {
    const d = parseBlastDate(dateStr);
    return d instanceof Date && !isNaN(d);
  };

  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  const processedData = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.log('⚠️ Flyrock: No valid data available');
      return [];
    }
    console.log('🔍 Flyrock: Starting with', rawData.length, 'records');
    
    let validData = rawData.filter(
      (item) =>
        item.total_explos_cost &&
        item.total_explos_cost > 0 &&
        isValidDate(item.blastdate)
    );
    console.log('🔍 Flyrock: After basic filtering:', validData.length, 'records');

    validData = validData.filter((item) => {
      const hasValidflyRock = item.flyrock !== null && item.flyrock !== undefined && item.flyrock !== 0 && item.flyrock !== '';
      if (!hasValidflyRock && item.blastcode) {
        console.log('❌ Flyrock validation failed for', item.blastcode, {
          flyrock: item.flyrock,
          typeof: typeof item.flyrock
        });
      }
      return hasValidflyRock;
    });
    console.log('🔍 Flyrock: After flyrock filtering:', validData.length, 'records');

    if (timeMode === 'daily') {
      if (dateRange.startDate || dateRange.endDate) {
        validData = validData.filter((item) => {
          const itemDate = parseBlastDate(item.blastdate);
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
        const itemDate = parseBlastDate(item.blastdate);
        if (!itemDate) return false;
        return (
          itemDate.getMonth() === dateRange.selectedMonth &&
          itemDate.getFullYear() === dateRange.selectedYear
        );
      });
    } else {
      validData = validData.filter((item) => {
        const year = parseBlastDate(item.blastdate)?.getFullYear();
        return year >= dateRange.startYear && year <= dateRange.endYear;
      });
    }

    if (timeMode === 'monthly') {
      const monthlyData = {};
      validData.forEach((item) => {
        const date = parseBlastDate(item.blastdate);
        if (!date) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            costs: [],
            flyRockValues: [],
            count: 0,
          };
        }
        monthlyData[monthKey].costs.push(item.total_explos_cost);
        if (item.flyrock !== null && item.flyrock !== undefined && item.flyrock !== 0 && item.flyrock !== '') {
          monthlyData[monthKey].flyRockValues.push(item.flyrock);
        }
        monthlyData[monthKey].count++;
      });

      return Object.values(monthlyData)
        .map((monthData) => ({
          date: monthData.date,
          displayDate: new Date(monthData.date + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
          cost: monthData.costs.reduce((sum, cost) => sum + cost, 0) / monthData.costs.length,
          flyrock:
            monthData.flyRockValues.length > 0
              ? monthData.flyRockValues.reduce((sum, sc) => sum + sc, 0) /
                monthData.flyRockValues.length
              : null,
          blastCount: monthData.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else if (timeMode === 'yearly') {
      const yearlyData = {};
      validData.forEach((item) => {
        const year = parseBlastDate(item.blastdate)?.getFullYear();
        if (!year) return;
        if (!yearlyData[year]) {
          yearlyData[year] = {
            year,
            costs: [],
            flyRockValues: [],
            count: 0,
          };
        }
        yearlyData[year].costs.push(item.total_explos_cost);
        if (item.flyrock !== null && item.flyrock !== undefined && item.flyrock !== 0 && item.flyrock !== '') {
          yearlyData[year].flyRockValues.push(item.flyrock);
        }
        yearlyData[year].count++;
      });

      return Object.values(yearlyData)
        .map((yearData) => ({
          date: yearData.year.toString(),
          displayDate: yearData.year.toString(),
          cost: yearData.costs.reduce((sum, cost) => sum + cost, 0) / yearData.costs.length,
          flyrock:
            yearData.flyRockValues.length > 0
              ? yearData.flyRockValues.reduce((sum, sc) => sum + sc, 0)
              : null,
          blastCount: yearData.count,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return validData
        .map((item) => {
          const dateObj = parseBlastDate(item.blastdate);
          return {
            ...item,
            date: dateObj ? dateObj.toISOString().split('T')[0] : '',
            displayDate: dateObj ? dateObj.toLocaleDateString() : '',
            cost: item.total_explos_cost,
            flyrock: item.flyrock !== null && item.flyrock !== undefined && item.flyrock !== 0 && item.flyrock !== '' ? item.flyrock : null,
          };
        })
        .sort((a, b) => {
          const da = parseBlastDate(a.blastdate);
          const db = parseBlastDate(b.blastdate);
          return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
        });
    }
  }, [rawData, timeMode, dateRange]);

  const summaryStats = useMemo(() => {
    const validCosts = processedData.filter((item) => item.cost > 0);
    const validflyRocks = processedData.filter((item) => item.flyrock > 0 && item.flyrock !== null);
    
    // Calculate total or average based on timeMode
    const totalFlyRock = validflyRocks.reduce((sum, item) => sum + item.flyrock, 0);
    const avgFlyRock = validflyRocks.length > 0 ? totalFlyRock / validflyRocks.length : 0;
    
    return {
      totalCost: validCosts.reduce((sum, item) => sum + item.cost, 0),
      avgflyRock: timeMode === 'yearly' ? totalFlyRock : avgFlyRock,
      totalBlasts: processedData.length,
      avgPPV: validflyRocks.length > 0 
        ? validflyRocks.reduce((sum, item) => sum + item.flyrock, 0) / validflyRocks.length 
        : 0,
      avgAirBlast: 0
    };
  }, [processedData, timeMode]);

  const chartData = useMemo(() => {
    return processedData.map((item) => {
      const dataPoint = {
        date: item.date,
        displayDate: item.displayDate,
        cost: item.cost,
      };
      if (activeMeasurements.flyrock && item.flyrock !== null) {
        dataPoint.flyrock = item.flyrock;
      }
      return dataPoint;
    });
  }, [processedData, activeMeasurements]);

  // Export functionality with improved PDF and CSV support
  const handleExport = async (format) => {
    setIsExporting(true);
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      // Wait for chart to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get chart container from ref
      if (!chartRef.current) {
        throw new Error('Chart container not found. Please ensure the chart is visible.');
      }
      
      const chartContainer = chartRef.current;

      if (['png', 'jpeg', 'svg'].includes(format)) {
        if (format === 'svg') {
          // Find SVG element in the chart container
          const svgElement = chartContainer.querySelector('svg');
          if (!svgElement) throw new Error('SVG not found in chart container.');
          
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Flyrock_${timeMode}_${new Date().toISOString().split('T')[0]}.svg`;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          // PNG/JPEG export using html2canvas
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            onclone: (clonedDoc) => {
              // Remove problematic CSS that might cause parsing issues
              const style = clonedDoc.createElement('style');
              style.textContent = `
                * {
                  color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
                  background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
                }
                .recharts-cartesian-grid-horizontal line,
                .recharts-cartesian-grid-vertical line {
                  stroke: ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
                }
                .recharts-text {
                  fill: ${isDarkMode ? '#9ca3af' : '#6b7280'} !important;
                }
              `;
              clonedDoc.head.appendChild(style);
            }
          });
          
          // Create enhanced canvas with title
          const finalCanvas = document.createElement('canvas');
          const ctx = finalCanvas.getContext('2d');
          const titleHeight = 60;
          
          finalCanvas.width = canvas.width;
          finalCanvas.height = canvas.height + titleHeight;
          
          // Fill background
          ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          
          // Add title
          ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Fly Rock - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`, finalCanvas.width / 2, 35);
          
          // Draw chart
          ctx.drawImage(canvas, 0, titleHeight);
          
          // Download
          const link = document.createElement('a');
          link.download = `Flyrock_${timeMode}_${new Date().toISOString().split('T')[0]}.${format}`;
          link.href = finalCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
          link.click();
        }
      } else if (format === 'pdf') {
        // PDF export with chart capture
        const canvas = await html2canvas(chartContainer, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          onclone: (clonedDoc) => {
            // Remove problematic CSS
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
                background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
              }
              .recharts-cartesian-grid-horizontal line,
              .recharts-cartesian-grid-vertical line {
                stroke: ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
              }
              .recharts-text {
                fill: ${isDarkMode ? '#9ca3af' : '#6b7280'} !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF with landscape orientation
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 15;
        
        // Add title
        pdf.setFontSize(18);
        pdf.text('Fly Rock Analytics', margin, margin + 10);
        pdf.setFontSize(12);
        pdf.text(`${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View - Generated: ${new Date().toLocaleDateString()}`, margin, margin + 20);
        
        // Calculate image dimensions
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - margin - 35;
        const aspectRatio = canvas.width / canvas.height;
        
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = margin + 35;
        
        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
        pdf.save(`Flyrock_${timeMode}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (format === 'csv') {
        // CSV export
        const headers = ['Date', 'Fly Rock (mm/s)', 'Cost ($)'];
        const csvData = chartData.map(item => [
          `"${item.displayDate}"`,
          item.flyrock || 'N/A',
          item.cost || 'N/A'
        ]);
        
        const csvContent = [
          `# Fly Rock Analytics - ${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View`,
          `# Generated: ${new Date().toLocaleString()}`,
          `# Summary: Avg Fly Rock: ${summaryStats.avgflyRock.toFixed(2)} mm/s, Total Blasts: ${summaryStats.totalBlasts}`,
          '',
          headers.join(','),
          ...csvData.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Flyrock_${timeMode}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportNotification(`Export failed: ${error.message}. Please try CSV export instead.`);
    }
    
    setIsExporting(false);
    setTimeout(() => setExportNotification(''), 3000);
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
        <div className={`p-4 rounded-xl border ${
          isDarkMode ?
            'bg-gray-800/90 border-gray-700 text-white' :
            'bg-white/90 border-gray-200 text-gray-900'
        } backdrop-blur-md shadow-lg`}>
          <p className="font-semibold mb-2">{data.displayDate}</p>
          <div className="space-y-1">
            {data.flyrock !== null && data.flyrock !== undefined && (
              <p className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Fly Rock: {data.flyrock.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} mm/s
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
    <div className={`min-h-screen p-6 transition-colors duration-500 ${themeClasses}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl relative z-10`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Fly Rock Analytics Dashboard
              </h1>
              <p className="text-lg font-semibold"></p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative z-50" ref={exportRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  aria-label="Export Chart data"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } shadow-lg hover:shadow-xl transform hover:scale-105`}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportDropdown && (
                  <div
                    className={`absolute top-full right-0 mt-2 w-48 rounded-xl border shadow-2xl ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-gray-200'
                    } backdrop-blur-md z-[9999]`}>
                    <div className="py-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Export Formats
                      </div>
                      {[
                        { format: 'png', label: ' PNG Image' },
                        { format: 'jpeg', label: ' JPEG Image' },
                        { format: 'svg', label: ' SVG Vector' },
                        { format: 'pdf', label: ' PDF Document' },
                        { format: 'csv', label: ' CSV Data' }
                      ].map((item) => (
                        <button 
                          key={item.format} 
                          onClick={() => handleExport(item.format)}
                          disabled={isExporting}
                          className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                            isDarkMode
                              ? 'hover:bg-gray-700 text-white'
                              : 'hover:bg-gray-50 text-gray-900'
                          }`}>
                          <span className="w-6 text-center mr-3">{item.label.split(' ')[0]}</span>
                          {item.label.split(' ').slice(1).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Export Notification */}
        {exportNotification && (
          <div 
            className={`fixed top-4 right-4 p-4 rounded-xl ${isDarkMode ? 'bg-green-800 text-white' : 'bg-green-100 text-green-800'} backdrop-blur-md border ${isDarkMode ? 'border-green-600' : 'border-green-200'} shadow-lg z-[9999]`}>
            {exportNotification}
          </div>
        )}

        {/* Controls */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Time Period
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                <button onClick={() => setTimeMode('daily')} aria-label="Select daily view"
                  className={`flex-1 px-4 py-2 font-medium transition-all duration-300 ${timeMode === 'daily' ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Daily
                </button>
                <button onClick={() => setTimeMode('monthly')} aria-label="Select monthly view" className={`flex-1 px-4 py-2 font-medium transition-all duration-300 ${timeMode === 'monthly' ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Monthly
                </button>
                <button onClick={() => setTimeMode('yearly')} aria-label="Select yearly view" className={`flex-1 px-4 py-2 font-medium transition-all duration-300 ${timeMode === 'yearly' ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Yearly
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {timeMode === 'monthly' ? 'Select Month' : 'Date Range'}
              </label>
              {timeMode === 'daily' ? (
                <div className="space-y-2">
                  <input type="date" value={dateRange.startDate}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Start Date" />
                  <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="End Date" />
                </div>
              ) : timeMode === 'monthly' ? (
                <div className="space-y-2">
                  <select 
                    value={dateRange.selectedMonth} 
                    onChange={(e) => setDateRange((prev) => ({ ...prev, selectedMonth: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select Month">
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Year" 
                    value={dateRange.selectedYear} 
                    onChange={(e) => setDateRange((prev) => ({ ...prev, selectedYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select Year" />
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="number" placeholder="Start Year" value={dateRange.startYear} onChange={(e) => setDateRange((prev) => ({ ...prev, startYear: parseInt(e.target.value) || 2021 }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select start Year" />
                  <input type="number" placeholder="End Year" value={dateRange.endYear} onChange={(e) => setDateRange((prev) => ({ ...prev, endYear: parseInt(e.target.value) || 2024 }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select end Year" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                Measurements
              </label>
              <div className="space-y-2">
                <button onClick={() => toggleMeasurement('flyrock')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all duration-300 ${activeMeasurements.flyrock ? 'bg-blue-500 text-white shadow-lg' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Fly Rock
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Fly Rock Trends
          </h2>
          {chartData.length > 0 ? (
            <div ref={chartRef} className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: isDarkMode ? '#D1D5DB' : '#6B7280' }}
                    angle={-45} 
                    textAnchor="end" 
                    height={60} />
                  {activeMeasurements.flyrock && (
                    <YAxis yAxisId="flyrock" orientation="left" tick={{ fontSize: 12, fill: '#3B82F6' }}
                      label={{ value: 'Fly Rock', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6' } }} />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {activeMeasurements.flyrock && (
                    <Line yAxisId="flyrock" type="monotone" dataKey="flyrock" stroke="#3B82F6" name="Fly Rock" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <LineChart
                  className={`w-16 h-16 mx-auto mb-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`}
                />
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No data available for the selected filters
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                  Try adjusting your date range or measurement settings
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-75">
                  {timeMode === 'yearly' ? 'Total Fly Rock' : 'Average Fly Rock'}
                </p>
                <p className="text-2xl font-bold">
                  {summaryStats.avgflyRock.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  mm/s
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-75">Total Blasts</p>
                <p className="text-2xl font-bold">
                  {summaryStats.totalBlasts.toLocaleString('en-US')}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-75">Total Cost</p>
                <p className="text-2xl font-bold">
                  ₹{summaryStats.totalCost.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlyRock;