//code fixed
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Volume2, Download, BarChart, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SpecificDrilling = ({ filteredData, DarkMode }) => {
  const isDarkMode = !DarkMode;
  const [timeMode, setTimeMode] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    startYear: 2023,
    endYear: 2025,
    selectedMonth: 6, // July (0-indexed)
    selectedYear: 2023,
  });
  const [activeMeasurements, setActiveMeasurements] = useState({
    specific_drilling: true
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportNotification, setExportNotification] = useState('');

  const exportRef = useRef(null);
  const chartRef = useRef(null);

  // Use filteredData directly
  const dataToUse = Array.isArray(filteredData) && filteredData.length > 0 ? filteredData : [];

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseBlastDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle DD-MM-YYYY format
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    // Handle other formats
    return new Date(dateStr);
  };

  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = parseBlastDate(dateStr);
    return date && !isNaN(date.getTime());
  };

  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  // Calculate Specific Drilling using the formula: Specific Drilling (m/m³) = Total Drilling Meterage (m) / Theoretical Volume Blasted (m³)
  const calculateSpecificDrilling = (item) => {
    const totalDrillingMeterage = item.total_drill_meterage || item.total_drilling || item.total_drill || item.drilling_meterage || 0;
    const theoreticalVolume = item.theoretical_volume_m3 || item.volume_blasted || item.blast_volume || item.prodution_therotical_vol || 0;
    
    if (totalDrillingMeterage > 0 && theoreticalVolume > 0) {
      return totalDrillingMeterage / theoreticalVolume;
    }
    
    return null;
  };

  const processedData = useMemo(() => {
    if (!Array.isArray(dataToUse)) {
      return [];
    }
    let validData = dataToUse.filter(
      (item) =>
        item.total_exp_cost &&
        item.total_exp_cost > 0 &&
        isValidDate(item.blastdate)
    );

    validData = validData.filter((item) => {
      const specificDrilling = calculateSpecificDrilling(item);
      return specificDrilling !== null;
    });

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
      // For monthly view, show specific month in the selected year
      validData = validData.filter((item) => {
        const itemDate = parseBlastDate(item.blastdate);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth();
        return itemYear === dateRange.selectedYear && itemMonth === dateRange.selectedMonth;
      });
    } else {
      validData = validData.filter((item) => {
        const year = parseBlastDate(item.blastdate).getFullYear();
        return year >= dateRange.startYear && year <= dateRange.endYear;
      });
    }

    if (timeMode === 'monthly') {
      // For monthly view, show individual records for the selected month
      return validData
        .map((item) => ({
          ...item,
          date: parseBlastDate(item.blastdate).toISOString().split('T')[0],
          displayDate: parseBlastDate(item.blastdate).toLocaleDateString(),
          cost: item.total_exp_cost,
          specific_drilling: calculateSpecificDrilling(item),
          drilling_meterage: item.total_drill_meterage || item.total_drilling || item.total_drill || item.drilling_meterage || 0,
          theoretical_volume: item.theoretical_volume_m3 || item.volume_blasted || item.blast_volume || item.prodution_therotical_vol || 0,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (timeMode === 'yearly') {
      const yearlyData = {};

      validData.forEach((item) => {
        const year = parseBlastDate(item.blastdate).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = {
            year,
            costs: [],
            SpecificDrillingValues: [],
            count: 0,
          };
        }
        yearlyData[year].costs.push(item.total_exp_cost);
        const specificDrilling = calculateSpecificDrilling(item);
        if (specificDrilling !== null) {
          yearlyData[year].SpecificDrillingValues.push(specificDrilling);
        }
        yearlyData[year].count++;
      });

      return Object.values(yearlyData)
        .map((yearData) => ({
          date: yearData.year.toString(),
          displayDate: yearData.year.toString(),
          cost: yearData.costs.reduce((sum, cost) => sum + cost, 0) / yearData.costs.length,
          specific_drilling:
            yearData.SpecificDrillingValues.length > 0
              ? yearData.SpecificDrillingValues.reduce((sum, sc) => sum + sc, 0) /
                yearData.SpecificDrillingValues.length
              : null,
          blastCount: yearData.count,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return validData
        .map((item) => ({
          ...item,
          date: parseBlastDate(item.blastdate).toISOString().split('T')[0],
          displayDate: parseBlastDate(item.blastdate).toLocaleDateString(),
          cost: item.total_exp_cost,
          specific_drilling: calculateSpecificDrilling(item),
          drilling_meterage: item.total_drill_meterage || item.total_drilling || item.total_drill || item.drilling_meterage || 0,
          theoretical_volume: item.theoretical_volume_m3 || item.volume_blasted || item.blast_volume || item.prodution_therotical_vol || 0,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [dataToUse, timeMode, dateRange]);

  const summaryStats = useMemo(() => {
    const validCosts = processedData.filter((item) => item.cost > 0);
    const validSpecificDrilling = processedData.filter((item) => item.specific_drilling > 0 && item.specific_drilling !== null);
    const totalDrillingMeterage = processedData.reduce((sum, item) => sum + (item.drilling_meterage || 0), 0);
    const totalTheoreticalVolume = processedData.reduce((sum, item) => sum + (item.theoretical_volume || 0), 0);
    
    return {
      totalCost: validCosts.reduce((sum, item) => sum + item.cost, 0),
      avgSpecificDrilling:
        validSpecificDrilling.length > 0
          ? validSpecificDrilling.reduce((sum, item) => sum + item.specific_drilling, 0) /
            validSpecificDrilling.length : 0,
      totalBlasts: processedData.length,
      totalDrillingMeterage,
      totalTheoreticalVolume,
      avgPPV: validSpecificDrilling.length > 0 
        ? validSpecificDrilling.reduce((sum, item) => sum + item.specific_drilling, 0) / validSpecificDrilling.length 
        : 0,
      avgAirBlast: 0 // Added missing property
    };
  }, [processedData]);

  const chartData = useMemo(() => {
    const data = processedData.map((item) => {
      const dataPoint = {
        date: item.date,
        displayDate: item.displayDate,
        cost: item.cost,
      };
      if (activeMeasurements.specific_drilling && item.specific_drilling !== null) {
        dataPoint.specific_drilling = item.specific_drilling;
      }
      return dataPoint;
    });

    // Calculate trend line for specific drilling
    if (data.length > 1 && activeMeasurements.specific_drilling) {
      const validData = data.filter(d => d.specific_drilling !== null && d.specific_drilling !== undefined);
      if (validData.length > 1) {
        const n = validData.length;
        const sumX = validData.reduce((sum, _, i) => sum + i, 0);
        const sumY = validData.reduce((sum, d) => sum + d.specific_drilling, 0);
        const sumXY = validData.reduce((sum, d, i) => sum + i * d.specific_drilling, 0);
        const sumX2 = validData.reduce((sum, _, i) => sum + i * i, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        data.forEach((item, index) => {
          if (item.specific_drilling !== null && item.specific_drilling !== undefined) {
            item.trendline = slope * index + intercept;
          }
        });
      }
    }

    return data;
  }, [processedData, activeMeasurements]);

  // Alternative export function for better compatibility
  const handleExportSimple = async (format) => {
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      if (format === 'csv') {
        // CSV Export - same as before
        const csvHeaders = ['Date', 'Specific Drilling (m/m³)', 'Drilling Meterage (m)', 'Theoretical Volume (m³)', 'Trendline', 'Cost'];
        const csvData = chartData.map(item => [
          item.displayDate || '',
          item.specific_drilling ? item.specific_drilling.toFixed(2) : '',
          item.drilling_meterage ? item.drilling_meterage.toFixed(2) : '',
          item.theoretical_volume ? item.theoretical_volume.toFixed(2) : '',
          item.trendline ? item.trendline.toFixed(2) : '',
          item.cost ? item.cost.toFixed(2) : ''
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } else {
        // Use a simpler approach that captures only the SVG content
        const chartContainer = chartRef.current;
        if (!chartContainer) {
          throw new Error('Chart container not found');
        }
        
        // Find the SVG element within the chart
        const svgElement = chartContainer.querySelector('svg');
        if (!svgElement) {
          throw new Error('Chart SVG not found');
        }
        
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);
        
        // Set explicit dimensions
        clonedSvg.setAttribute('width', '1200');
        clonedSvg.setAttribute('height', '600');
        
        // Convert SVG to string
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        
        if (format === 'svg') {
          // Direct SVG export
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.svg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
        } else {
          // Convert SVG to canvas for other formats
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          canvas.width = 1200;
          canvas.height = 600;
          
          // Set background color
          ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            
            if (format === 'pdf') {
              const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
              });
              
              const imgWidth = 280;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 10, 10, imgWidth, imgHeight);
              pdf.save(`specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
              
            } else {
              const link = document.createElement('a');
              link.download = `specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
              link.href = canvas.toDataURL(`image/${format}`, 1.0);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            
            setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
            setTimeout(() => setExportNotification(''), 3000);
          };
          
          img.onerror = () => {
            throw new Error('Failed to load SVG image');
          };
          
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          img.src = url;
        }
      }
      
      // Success notification is now handled inside the specific format handlers
    } catch (error) {
      console.error('Simple export failed:', error);
      setExportNotification('Simple export failed, trying alternative method...');
      // Fallback to original export method
      try {
        await handleExport(format);
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError);
        setExportNotification(`All export methods failed. Please try again or contact support.`);
        setTimeout(() => setExportNotification(''), 5000);
      }
    }
  };

  const handleExport = async (format) => {
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      if (format === 'csv') {
        // CSV Export
        const csvHeaders = ['Date', 'Specific Drilling (m/m³)', 'Drilling Meterage (m)', 'Theoretical Volume (m³)', 'Trendline', 'Cost'];
        const csvData = chartData.map(item => [
          item.displayDate || '',
          item.specific_drilling ? item.specific_drilling.toFixed(2) : '',
          item.drilling_meterage ? item.drilling_meterage.toFixed(2) : '',
          item.theoretical_volume ? item.theoretical_volume.toFixed(2) : '',
          item.trendline ? item.trendline.toFixed(2) : '',
          item.cost ? item.cost.toFixed(2) : ''
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } else if (format === 'pdf') {
        // PDF Export - Wait for chart to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const chartContainer = chartRef.current;
        if (!chartContainer) {
          throw new Error('Chart container not found');
        }
        
        // Wait for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create a temporary style element to override problematic CSS
        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
          * {
            color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
            background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
          }
        `;
        document.head.appendChild(tempStyle);
        
        const canvas = await html2canvas(chartContainer, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: chartContainer.scrollWidth,
          height: chartContainer.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: (element) => {
            // Skip elements that might have problematic CSS
            return element.classList && element.classList.contains('skip-export');
          },
          onclone: (clonedDoc) => {
            // Remove any problematic CSS properties from cloned document
            const allElements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const element = allElements[i];
              if (element.style) {
                // Remove problematic color functions
                element.style.removeProperty('color');
                element.style.removeProperty('background-color');
                element.style.removeProperty('background');
                element.style.removeProperty('border-color');
                // Set safe colors
                element.style.color = isDarkMode ? '#ffffff' : '#000000';
                element.style.backgroundColor = 'transparent';
              }
            }
          }
        });
        
        // Remove the temporary style
        document.head.removeChild(tempStyle);
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
        
      } else {
        // Image Export (PNG, JPEG, SVG)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const chartContainer = chartRef.current;
        if (!chartContainer) {
          throw new Error('Chart container not found');
        }
        
        // Wait for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create a temporary style element to override problematic CSS
        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
          * {
            color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
            background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
          }
        `;
        document.head.appendChild(tempStyle);
        
        const canvas = await html2canvas(chartContainer, {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: chartContainer.scrollWidth,
          height: chartContainer.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: (element) => {
            // Skip elements that might have problematic CSS
            return element.classList && element.classList.contains('skip-export');
          },
          onclone: (clonedDoc) => {
            // Remove any problematic CSS properties from cloned document
            const allElements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const element = allElements[i];
              if (element.style) {
                // Remove problematic color functions
                element.style.removeProperty('color');
                element.style.removeProperty('background-color');
                element.style.removeProperty('background');
                element.style.removeProperty('border-color');
                // Set safe colors
                element.style.color = isDarkMode ? '#ffffff' : '#000000';
                element.style.backgroundColor = 'transparent';
              }
            }
          }
        });
        
        // Remove the temporary style
        document.head.removeChild(tempStyle);
        
        const link = document.createElement('a');
        link.download = `specific-drilling-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setExportNotification(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportNotification(`Export failed: ${error.message}. Please try again.`);
      setTimeout(() => setExportNotification(''), 5000);
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
        <div className={`p-4 rounded-xl border ${
          isDarkMode ?
            'bg-gray-800/90 border-gray-700 text-white' :
            'bg-white/90 border-gray-200 text-gray-900'
        } backdrop-blur-md shadow-lg`}>
          <p className="font-semibold mb-2">{data.displayDate}</p>
          <div className="space-y-1">
            {data.specific_drilling !== null && data.specific_drilling !== undefined && (
              <div>
                <p className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Specific Drilling: {data.specific_drilling.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} m/m³
                </p>
                <p className="text-xs text-gray-500 ml-6">
                  {data.drilling_meterage}m ÷ {data.theoretical_volume}m³ = {data.specific_drilling.toFixed(2)} m/m³
                </p>
              </div>
            )}
            {data.trendline !== null && data.trendline !== undefined && (
              <p className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Trendline: {data.trendline.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} m/m³
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
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Specific Drilling Analytics Dashboard
              </h1>
              <p className="text-lg font-semibold"></p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={exportRef}>
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
                    className={`absolute bottom-full right-0 mb-2 w-40 rounded-xl border shadow-xl z-50 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-gray-200'
                    } backdrop-blur-md`}>
                    {['png', 'jpeg', 'pdf', 'svg', 'csv'].map((format) => (
                      <button key={format} onClick={() => handleExportSimple(format)}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl ${isDarkMode
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-50 text-gray-900'
                          }`}>
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
          <div className={`fixed top-4 right-4 p-4 rounded-xl z-50 ${isDarkMode ? 'bg-green-800 text-white' : 'bg-green-100 text-green-800'} backdrop-blur-md border ${isDarkMode ? 'border-green-600' : 'border-green-200'}`}>
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
                {timeMode === 'monthly' ? 'Select Year & Month' : 'Date Range'}
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
                  <input 
                    type="number" 
                    placeholder="Year" 
                    value={dateRange.selectedYear} 
                    onChange={(e) => setDateRange((prev) => ({ ...prev, selectedYear: parseInt(e.target.value) || 2023 }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select Year" />
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
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="number" placeholder="Start Year" value={dateRange.startYear} onChange={(e) => setDateRange((prev) => ({ ...prev, startYear: parseInt(e.target.value) || 2023 }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    aria-label="Select start Year" />
                  <input type="number" placeholder="End Year" value={dateRange.endYear} onChange={(e) => setDateRange((prev) => ({ ...prev, endYear: parseInt(e.target.value) || 2025 }))}
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
                <button onClick={() => toggleMeasurement('specific_drilling')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all duration-300 ${activeMeasurements.specific_drilling ? 'bg-blue-500 text-white shadow-lg' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Specific Drilling
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`} ref={chartRef}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Specific Drilling Trends
            {timeMode === 'monthly' && (
              <span className="text-sm font-normal text-gray-500">
                - {months[dateRange.selectedMonth].label} {dateRange.selectedYear} ({chartData.length} records)
              </span>
            )}
          </h2>
          {chartData.length > 0 ? (
            <div className="h-96">
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
                  {activeMeasurements.specific_drilling && (
                    <YAxis yAxisId="specific_drilling" orientation="left" tick={{ fontSize: 12, fill: '#3B82F6' }}
                      label={{ value: 'Specific Drilling (m/m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6' } }} />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {activeMeasurements.specific_drilling && (
                    <Line yAxisId="specific_drilling" type="monotone" dataKey="specific_drilling" stroke="#3B82F6" name="Specific Drilling" strokeWidth={2} />
                  )}
                  {activeMeasurements.specific_drilling && (
                    <Line yAxisId="specific_drilling" type="monotone" dataKey="trendline" stroke="#10B981" name="Trendline" strokeWidth={1} strokeDasharray="5,5" />
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
                <p className="text-sm opacity-75">Average Specific Drilling</p>
                <p className="text-2xl font-bold">
                  {summaryStats.avgSpecificDrilling.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  m/m³
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
                <p className="text-sm opacity-75">Total Drilling Meterage</p>
                <p className="text-2xl font-bold">
                  {summaryStats.totalDrillingMeterage.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} m
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
                <p className="text-sm opacity-75">Total Theoretical Volume</p>
                <p className="text-2xl font-bold">
                  {summaryStats.totalTheoreticalVolume.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} m³
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificDrilling;