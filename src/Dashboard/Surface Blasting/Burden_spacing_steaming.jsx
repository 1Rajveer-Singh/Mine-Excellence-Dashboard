//Code fixed
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Download, Filter, BarChart3, Menu, X } from 'lucide-react';

const BlastMeasurementAnalytics = ({ filteredData, DarkMode = false }) => {
  // State management
  const isDark = (!DarkMode);
  const [timeMode, setTimeMode] = useState('Daily');
  const [startYear, setStartYear] = useState(2021);
  const [endYear, setEndYear] = useState(2024);
  const [startDate, setStartDate] = useState('2023-06-29');
  const [endDate, setEndDate] = useState('2023-06-31');
  const [activeBars, setActiveBars] = useState({
    burden: true,
    spacing: true,
    stemming_length: true
  });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [isExporting, setIsExporting] = useState(false);

  const exportRef = useRef(null);
  const chartRef = useRef(null);

  // Click outside handler for export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Data processing with memoization - Fixed field names
  const processedData = useMemo(() => {
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Handle MM/DD/YYYY format from your CSV
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return {
            date: new Date(year, month - 1, day),
            year: year,
            month: String(month).padStart(2, '0'),
            formattedDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
          };
        }
      }
      
      // Handle DD-MM-YYYY format as fallback
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return {
            date: new Date(year, month - 1, day),
            year: year,
            month: String(month).padStart(2, '0'),
            formattedDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
          };
        }
      }
      
      return null;
    };

    console.log('📊 Burden Spacing - Processing data with', filteredData?.length, 'records');

    // Filter data with correct field names - more lenient filtering
    let validData = filteredData.filter(item => {
      const hasBurden = item.burden && parseFloat(item.burden) > 0;
      const hasSpacing = item.spacing && parseFloat(item.spacing) > 0;
      const hasStemming = (item.sremming_length || item.stemming_length) && parseFloat(item.sremming_length || item.stemming_length) > 0;
      const hasDate = item.blastdate && parseDate(item.blastdate);
      
      // At least one measurement and a valid date
      return (hasBurden || hasSpacing || hasStemming) && hasDate;
    });

    console.log('📊 Valid burden/spacing records after filtering:', validData.length);

    validData = validData.filter(item => {
      const parsedDate = parseDate(item.blastdate);
      if (!parsedDate) return false;
      
      if (timeMode === 'Yearly') {
        return parsedDate.year >= startYear && parsedDate.year <= endYear;
      } else if (timeMode === 'Monthly') {
        return parsedDate.year.toString() === selectedYear && 
               parsedDate.month === selectedMonth;
      } else {
        return parsedDate.date >= new Date(startDate) && parsedDate.date <= new Date(endDate);
      }
    });

    if (timeMode === 'Yearly') {
      const yearlyData = {};
      validData.forEach(item => {
        const parsedDate = parseDate(item.blastdate);
        if (!parsedDate) return;
        
        const year = parsedDate.year;
        if (!yearlyData[year]) {
          yearlyData[year] = {
            period: year.toString(),
            burden: [],
            spacing: [],
            stemming_length: []
          };
        }
        yearlyData[year].burden.push(parseFloat(item.burden) || 0);
        yearlyData[year].spacing.push(parseFloat(item.spacing) || 0);
        yearlyData[year].stemming_length.push(parseFloat(item.sremming_length || item.stemming_length) || 0);
      });

      return Object.values(yearlyData)
        .map(year => ({
          period: year.period,
          burden: parseFloat((year.burden.reduce((a, b) => a + b, 0) / year.burden.length).toFixed(2)),
          spacing: parseFloat((year.spacing.reduce((a, b) => a + b, 0) / year.spacing.length).toFixed(2)),
          stemming_length: parseFloat((year.stemming_length.reduce((a, b) => a + b, 0) / year.stemming_length.length).toFixed(2))
        }))
        .sort((a, b) => parseInt(a.period) - parseInt(b.period));
    }

    // For daily and monthly views
    return validData.map(item => {
      const parsedDate = parseDate(item.blastdate);
      return {
        period: parsedDate ? parsedDate.formattedDate : item.blastdate,
        burden: parseFloat(item.burden) || 0,
        spacing: parseFloat(item.spacing) || 0,
        stemming_length: parseFloat(item.sremming_length || item.stemming_length) || 0
      };
    });
  }, [filteredData, timeMode, startYear, endYear, startDate, endDate, selectedYear, selectedMonth]);

  // Calculate totals with memoization
  const totals = useMemo(() => {
    return processedData.reduce((acc, item) => ({
      burden: acc.burden + (item.burden || 0),
      spacing: acc.spacing + (item.spacing || 0),
      stemming_length: acc.stemming_length + (item.stemming_length || 0)
    }), { burden: 0, spacing: 0, stemming_length: 0 });
  }, [processedData]);

  const totalMeasurement = totals.burden + totals.spacing + totals.stemming_length;

  // Toggle bar visibility
  const toggleBar = (bar) => {
    setActiveBars(prev => ({ ...prev, [bar]: !prev[bar] }));
  };

  // Enhanced export functionality with direct chartRef access
  const exportData = async (format) => {
    setIsExporting(true);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `burden-spacing-stemming-${timeMode.toLowerCase()}-${timestamp}`;

    try {
      // Wait a moment to ensure the chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get chart container directly from the chartRef
      if (!chartRef.current) {
        throw new Error('Chart container reference not found. Please try again.');
      }
      
      // Find the chart container
      const chartContainer = chartRef.current;

      if (format === 'png' || format === 'jpeg') {
        try {
          // Use html2canvas with more robust settings for better rendering
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
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
                  color: ${isDark ? '#ffffff' : '#000000'} !important;
                  background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
                }
                .recharts-cartesian-grid-horizontal line,
                .recharts-cartesian-grid-vertical line {
                  stroke: ${isDark ? '#374151' : '#e5e7eb'} !important;
                }
                .recharts-text {
                  fill: ${isDark ? '#9ca3af' : '#6b7280'} !important;
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
          ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          
          // Add title and metadata
          ctx.fillStyle = isDark ? '#ffffff' : '#000000';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Burden Spacing Stemming - ${timeMode} View`, finalCanvas.width / 2, 30);
          ctx.font = '16px Arial';
          ctx.fillText(`${processedData.length} records | Generated: ${new Date().toLocaleDateString()}`, finalCanvas.width / 2, 55);
          
          // Draw the chart canvas onto our new canvas
          ctx.drawImage(canvas, 0, titleHeight);
          
          // Export the canvas
          const dataUrl = finalCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : 1.0);
          
          // Create download link
          const link = document.createElement('a');
          link.download = `${filename}.${format}`;
          link.href = dataUrl;
          link.click();
          setIsExporting(false);
        } catch (canvasError) {
          console.error('Canvas export error:', canvasError);
          // Fallback to SVG export if canvas fails
          try {
            const svgElement = chartContainer.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              img.onload = () => {
                canvas.width = svgElement.clientWidth * 2;
                canvas.height = svgElement.clientHeight * 2;
                ctx.scale(2, 2);
                ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : 1.0);
                const link = document.createElement('a');
                link.download = `${filename}.${format}`;
                link.href = dataUrl;
                link.click();
                setIsExporting(false);
              };
              
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            } else {
              throw new Error('No chart found for export');
            }
          } catch (fallbackError) {
            alert(`Export failed: ${fallbackError.message}. Please try CSV export instead.`);
            setIsExporting(false);
          }
        }
      } else if (format === 'svg') {
        // Find the SVG element within our chart container - try different selectors
        let svgElement = chartContainer.querySelector('svg') || 
                         chartContainer.querySelector('.recharts-surface') || 
                         chartContainer.querySelector('.recharts-wrapper svg');
        
        if (!svgElement) {
          // As a fallback, look for any SVG in the chart container
          const svgs = chartContainer.getElementsByTagName('svg');
          if (svgs.length > 0) {
            svgElement = svgs[0];
          } else {
            throw new Error('SVG element not found within the chart container');
          }
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
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${svgClone.getAttribute('width')}" height="${svgClone.getAttribute('height')}" style="background-color: ${isDark ? '#1f2937' : '#ffffff'}">
  <title>Burden Spacing Stemming - ${timeMode}</title>
  <desc>Generated on: ${new Date().toLocaleString()}</desc>
  ${svgContent.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
</svg>`;
        
        // Create download link
        const blob = new Blob([fullSvgContent], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      } else if (format === 'pdf') {
        try {
          // Create canvas representation of chart with better quality
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            scale: 2, // Reduced scale to avoid memory issues
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            onclone: (clonedDoc) => {
              // Remove any problematic CSS that might cause parsing issues
              const style = clonedDoc.createElement('style');
              style.textContent = `
                * {
                  color: ${isDark ? '#ffffff' : '#000000'} !important;
                  background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
                }
                .recharts-cartesian-grid-horizontal line,
                .recharts-cartesian-grid-vertical line {
                  stroke: ${isDark ? '#374151' : '#e5e7eb'} !important;
                }
                .recharts-text {
                  fill: ${isDark ? '#9ca3af' : '#6b7280'} !important;
                }
              `;
              clonedDoc.head.appendChild(style);
            }
          });
            
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Create PDF with appropriate size and orientation
          const { jsPDF } = await import('jspdf');
          
          // Use landscape orientation for better chart display
          const doc = new jsPDF('l', 'mm', 'a4');
          
          // A4 landscape dimensions
          const pageWidth = 297;
          const pageHeight = 210;
          const margin = 15;
          
          // Add title and metadata
          doc.setFontSize(18);
          doc.text('Burden Spacing Stemming Analytics', margin, margin + 5);
          
          doc.setFontSize(12);
          doc.text(`${timeMode} View`, margin, margin + 12);
          doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 19);
          
          // Add date range info
          let dateRangeText = '';
          if (timeMode === 'Daily') {
            dateRangeText = `Date Range: ${startDate} to ${endDate}`;
          } else if (timeMode === 'Monthly') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
            dateRangeText = `Month: ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
          } else {
            dateRangeText = `Year Range: ${startYear} to ${endYear}`;
          }
          doc.text(dateRangeText, margin, margin + 26);
          
          // Add basic statistics
          doc.setFontSize(10);
          doc.text(`Records: ${processedData.length} | Burden: ${totals.burden.toFixed(2)}m | Spacing: ${totals.spacing.toFixed(2)}m | Stemming: ${totals.stemming_length.toFixed(2)}m`, margin, margin + 33);
          
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
          doc.save(`${filename}.pdf`);
          setIsExporting(false);
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          alert(`PDF export failed: ${pdfError.message}. Please try CSV export instead.`);
          setIsExporting(false);
        }
      } else if (format === 'csv') {
        const headers = ['Period', 'Burden (m)', 'Spacing (m)', 'Stemming Length (m)'];
        const csvContent = [
          headers.join(','),
          ...processedData.map(row => 
            [row.period, row.burden, row.spacing, row.stemming_length].join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }
    } catch (error) {
      alert(`Export failed: ${error.message}`);
      setIsExporting(false);
    }
    setIsExportOpen(false);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-lg shadow-lg border ${
          isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
        }`}>
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.dataKey.replace('_', ' ')}: {entry.value}m</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Summary card data
  const summaryCards = [
    {
      title: 'Burden',
      value: totals.burden.toFixed(2),
      unit: 'm',
      percentage: totalMeasurement > 0 ? ((totals.burden / totalMeasurement) * 100).toFixed(1) : '0.0',
      icon: '📏',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Spacing',
      value: totals.spacing.toFixed(2),
      unit: 'm',
      percentage: totalMeasurement > 0 ? ((totals.spacing / totalMeasurement) * 100).toFixed(1) : '0.0',
      icon: '📐',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Stemming Length',
      value: totals.stemming_length.toFixed(2),
      unit: 'm',
      percentage: totalMeasurement > 0 ? ((totals.stemming_length / totalMeasurement) * 100).toFixed(1) : '0.0',
      icon: '📊',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Total Measurement',
      value: totalMeasurement.toFixed(2),
      unit: 'm',
      percentage: '100.0',
      icon: '🎯',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-md border-b ${
        isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                <h1 className="text-lg sm:text-xl font-bold">Burden Spacing Stemming</h1>
              </div>
            </div>

            {/* Export Button - Always visible */}
            <div className="relative z-50" ref={exportRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={isExporting}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>

              {/* Export Dropdown */}
              {isExportOpen && (
                <div className={`absolute right-0 mt-2 w-48 sm:w-56 rounded-lg shadow-lg border z-[9999] ${
                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Export Formats
                    </div>
                    {[
                      { format: 'png', label: 'PNG Image' },
                      { format: 'jpeg', label: 'JPEG Image' },
                      { format: 'svg', label: 'SVG Vector' },
                      { format: 'pdf', label: 'PDF Report' },
                      { format: 'csv', label: 'CSV Data' }
                    ].map((item) => (
                      <button
                        key={item.format}
                        onClick={() => exportData(item.format)}
                        disabled={isExporting}
                        className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Controls Panel - Desktop Optimized */}
        <div className={`rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-sm ${
          isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/50 border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
            {/* Time Mode and Range Controls */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4" />
                Time Range
              </h3>
              
              {/* Time Mode Selection */}
              <div className={`flex rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {['Daily', 'Monthly', 'Yearly'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTimeMode(mode)}
                    className={`flex-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      timeMode === mode
                        ? 'bg-blue-500 text-white'
                        : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Date Range Controls */}
              {timeMode === 'Yearly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Start Year</label>
                    <input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(parseInt(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">End Year</label>
                    <input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(parseInt(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}

              {timeMode === 'Monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      {[2020, 2021, 2022, 2023, 2024].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
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
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {timeMode === 'Daily' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="hidden lg:block w-px bg-gray-300 dark:bg-gray-600 mx-4"></div>

            {/* Measurement Toggle Controls */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Filter className="w-4 h-4" />
                Measurements
              </h3>
              
              <div className="space-y-3">
                {[
                  { key: 'burden', label: 'Burden', color: 'bg-blue-500' },
                  { key: 'spacing', label: 'Spacing', color: 'bg-green-500' },
                  { key: 'stemming_length', label: 'Stemming Length', color: 'bg-purple-500' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleBar(item.key)}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all text-sm ${
                      activeBars[item.key]
                        ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                        : isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${item.color} ${
                      activeBars[item.key] ? 'opacity-100' : 'opacity-30'
                    }`} />
                    <span className={`font-medium ${
                      activeBars[item.key] ? '' : 'opacity-50'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className={`p-3 sm:p-6 rounded-xl backdrop-blur-sm border transition-all hover:scale-105 ${
                isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' 
                  : 'bg-white/50 border-gray-200 hover:bg-white/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-lg sm:text-2xl">{card.icon}</span>
                <div className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${card.color} text-white`}>
                  {card.percentage}%
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium opacity-75 mb-1">{card.title}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-bold">{card.value}</span>
                <span className="text-xs sm:text-sm opacity-75">{card.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className={`rounded-xl p-4 sm:p-6 backdrop-blur-sm border ${
          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
        }`} ref={chartRef}>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-2">Measurement Analysis</h2>
            <p className="opacity-75 text-sm sm:text-base">
              {timeMode} view showing burden, spacing, and stemming length measurements
            </p>
          </div>

          <div className="h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="period" 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={10}
                  label={{ value: 'Measurements (m)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                
                {activeBars.burden && (
                  <Bar dataKey="burden" name="Burden" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                )}
                {activeBars.spacing && (
                  <Bar dataKey="spacing" name="Spacing" fill="#10b981" radius={[2, 2, 0, 0]} />
                )}
                {activeBars.stemming_length && (
                  <Bar dataKey="stemming_length" name="Stemming Length" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlastMeasurementAnalytics;