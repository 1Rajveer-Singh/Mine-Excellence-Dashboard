//Code fixed
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sun, Moon, Download, TrendingUp, TrendingDown, FileText, BarChart3, Calendar, Database } from 'lucide-react';


const BlastCostDashboard = ({ filteredData, DarkMode }) => {
  console.log('🔍 Blast Cost Per Ton - Received data:', {
    hasData: Array.isArray(filteredData) && filteredData.length > 0,
    dataLength: filteredData?.length || 0,
    sampleRecord: filteredData?.[0],
    dataSource: filteredData?.[0]?.dataSource
  });

  // Use filteredData directly instead of aliasing to sampleData
  const rawData = Array.isArray(filteredData) && filteredData.length > 0 ? filteredData : [];
  
  // Debug data structure
  useEffect(() => {
    console.log('🔍 Blast_cost_per_ton Debug:', {
      filteredDataType: typeof filteredData,
      filteredDataIsArray: Array.isArray(filteredData),
      filteredDataLength: filteredData?.length || 0,
      rawDataLength: rawData.length,
      sampleRecord: rawData[0],
      requiredFields: rawData[0] ? {
        blastdate: rawData[0].blastdate,
        total_explos_cost: rawData[0].total_explos_cost,
        production_ton_therotical: rawData[0].production_ton_therotical,
        dataSource: rawData[0].dataSource
      } : 'No data'
    });
  }, [filteredData, rawData]);
  
  // Chart reference for export functionality
  const chartRef = React.useRef(null);

  // State management
  const isDarkMode=(!DarkMode);
  const [timeMode, setTimeMode] = useState('daily');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [startYear, setStartYear] = useState('2022');
  const [endYear, setEndYear] = useState('2024');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data processing
  const processedData = useMemo(() => {
    const parseDate = (dateStr) => {
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

    // First filter out invalid records
    console.log('🔍 Blast_cost_per_ton: Starting with', rawData.length, 'records');
    const validRecords = rawData.filter(item => {
      const hasValidCost = item.total_explos_cost && 
                          item.total_explos_cost !== 0 && 
                          item.production_ton_therotical && 
                          item.production_ton_therotical !== 0;
      
      // For blast cost per ton, we only need production_ton_therotical, not actual
      const hasValidPF = item.production_ton_therotical && item.production_ton_therotical !== 0;
      
      const hasValidDate = item.blastdate && parseDate(item.blastdate) !== null;

      const isValid = hasValidCost && hasValidPF && hasValidDate;
      if (!isValid && item.blastcode) {
        console.log('❌ Blast_cost_per_ton validation failed for', item.blastcode, {
          total_explos_cost: item.total_explos_cost,
          production_ton_therotical: item.production_ton_therotical,
          blastdate: item.blastdate,
          parsedDate: parseDate(item.blastdate),
          hasValidCost,
          hasValidPF,
          hasValidDate
        });
      }
      return isValid;
    });
    console.log('🔍 Blast_cost_per_ton: After validation filtering:', validRecords.length, 'records');

    const processedData = validRecords.filter(item => {
      const date = parseDate(item.blastdate);
      if (!date) return false; // Skip invalid dates
      
      if (timeMode === 'daily') {
        const start = new Date(startDate);
        const end = new Date(endDate);
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
    console.log('🔍 Blast_cost_per_ton: After date filtering:', processedData.length, 'records');

    if (timeMode === 'yearly') {
      // Group by year and combine data
      const yearlyData = {};
      processedData.forEach(item => {
        const date = parseDate(item.blastdate);
        if (!date) return; // Skip invalid dates
        const year = date.getFullYear();
        
        if (!yearlyData[year]) {
          yearlyData[year] = {
            date: year.toString(),
            total_cost: 0,
            total_weight: 0,
            count: 0
          };
        }
        
        yearlyData[year].total_cost += item.total_explos_cost;
        yearlyData[year].total_weight += item.production_ton_therotical;
        yearlyData[year].count++;
      });

      // Convert to array and calculate averages
      const yearlyResults = Object.entries(yearlyData)
        .map(([year, data]) => ({
          date: year,
          cost_per_ton: data.total_weight > 0 ? data.total_cost / data.total_weight : 0,
          total_cost: data.total_cost,
          total_weight: data.total_weight,
          records_count: data.count
        }))
        .filter(item => item.cost_per_ton > 0) // Only include valid calculations
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
      
      console.log('🔍 Blast_cost_per_ton: Yearly aggregation result:', yearlyResults.length, 'years');
      return yearlyResults;
    }

    // For daily and monthly views
    const dailyMonthlyResults = processedData.map(item => {
      const date = parseDate(item.blastdate);
      if (!date) return null; // Skip invalid dates
      
      return {
        ...item,
        date: date,
        cost_per_ton: item.production_ton_therotical > 0 ? item.total_explos_cost / item.production_ton_therotical : 0,
        total_cost: item.total_explos_cost,
        total_weight: item.production_ton_therotical,
        blastcode: item.blastcode
      };
    }).filter(item => item !== null && item.cost_per_ton > 0); // Remove invalid items
    
    console.log('🔍 Blast_cost_per_ton: Daily/Monthly result:', dailyMonthlyResults.length, 'records');
    return dailyMonthlyResults;
  }, [rawData, timeMode, startDate, endDate, selectedYear, selectedMonth, startYear, endYear]);

  // Statistics calculations
  const statistics = useMemo(() => {
    if (processedData.length === 0) {
      console.log('⚠️ Blast_cost_per_ton: No processed data for statistics');
      return { minCost: 0, maxCost: 0, avgCost: 0, totalRecords: 0 };
    }

    const costs = processedData.map(item => item.cost_per_ton).filter(cost => cost > 0);
    
    if (costs.length === 0) {
      console.log('⚠️ Blast_cost_per_ton: No valid cost data for statistics');
      return { minCost: 0, maxCost: 0, avgCost: 0, totalRecords: 0 };
    }

    const stats = {
      minCost: Math.min(...costs),
      maxCost: Math.max(...costs),
      avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
      totalRecords: processedData.length
    };
    
    console.log('📊 Blast_cost_per_ton: Statistics calculated:', stats);
    return stats;
  }, [processedData]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (processedData.length === 0) {
      console.log('⚠️ Blast_cost_per_ton: No data for chart');
      return [];
    }

    if (timeMode === 'yearly') {
      // Use the already processed yearly data from processedData
      const yearlyChartData = processedData.map(item => ({
        date: item.date,
        cost_per_ton: Math.round(item.cost_per_ton * 100) / 100,
        total_cost: item.total_cost,
        total_weight: item.total_weight
      }));
      console.log('📊 Blast_cost_per_ton: Yearly chart data prepared:', yearlyChartData.length, 'points');
      return yearlyChartData;
    }

    // For daily and monthly views
    const dailyMonthlyChartData = processedData.map(item => ({
      date: item.date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }),
      cost_per_ton: Math.round(item.cost_per_ton * 100) / 100,
      total_cost: item.total_cost,
      total_weight: item.total_weight,
      blastcode: item.blastcode
    }));
    
    console.log('📊 Blast_cost_per_ton: Daily/Monthly chart data prepared:', dailyMonthlyChartData.length, 'points');
    return dailyMonthlyChartData;
  }, [processedData, timeMode]);

  // Debug processing results
  useEffect(() => {
    console.log('✅ Blast_cost_per_ton - Processing Results:', {
      processedDataLength: processedData?.length || 0,
      chartDataLength: chartData?.length || 0,
      statisticsValid: !!statistics && statistics.totalRecords > 0,
      statistics: statistics
    });
  }, [processedData, chartData, statistics]);

  // Export functions
  const exportAsImage = useCallback(async (format) => {
    setIsExporting(true);
    try {
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
      const html2canvas = (await import('html2canvas')).default;
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
      if (!chartRef.current) {
        throw new Error('Chart container reference is null');
      }
      
      // Find the chart wrapper inside our container
      const chartElement = chartRef.current.querySelector('.recharts-wrapper');
      if (!chartElement) {
        throw new Error('Chart element not found within the container');
      }
      
      // Create canvas representation of chart with better quality
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartElement, {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        scale: 2.5, // Higher scale for better resolution
        useCORS: true,
        allowTaint: true,
        logging: false
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
      doc.text('Blast Cost Analytics Dashboard', margin, margin + 5);
      
      doc.setFontSize(12);
      doc.text(`${timeMode.charAt(0).toUpperCase() + timeMode.slice(1)} View - Cost Analysis`, margin, margin + 12);
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
      doc.text(`Records: ${statistics.totalRecords} | Avg Cost: ₹${statistics.avgCost.toFixed(2)}`, margin, margin + 33);
      
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
  }, [timeMode, isDarkMode, statistics, startDate, endDate, selectedMonth, selectedYear, startYear, endYear]);

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
        `# Cost Analysis Report`,
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
  }, [chartData, timeMode]);

  // SVG fallback for image exports
  const exportChartAsSVGFallback = useCallback(async (format) => {
    try {
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
          exportAsPDF();
          resolve();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
    } catch (error) {
      console.error('SVG fallback failed:', error);
      exportAsPDF(); // Final fallback to text report
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
              {entry.name}: ₹{entry.value}
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

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Cost Analysis Card */}
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
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

          {/* Data Summary Card */}
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
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
                <span className="text-sm text-gray-500">Data Points</span>
                <span className="font-medium text-purple-500">{chartData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`} ref={chartRef}>
          <h3 className="text-lg font-semibold mb-4">Blast Cost per Ton Analysis</h3>
          {chartData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg font-medium">No Data Available</p>
                <p className="text-gray-400 text-sm">Check your date filters and data source</p>
              </div>
            </div>
          ) : (
            <div className="h-96">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="line"
                    wrapperStyle={{
                      paddingBottom: '20px',
                      fontSize: '14px'
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlastCostDashboard;