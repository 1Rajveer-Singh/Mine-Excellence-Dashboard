//Perfectly Work 
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Volume2, Download, BarChart, Filter } from 'lucide-react';

const SpecificCharge = ({ filteredData, DarkMode }) => {
  const isDarkMode = !DarkMode;
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
    actual_pf_ton_kg: true
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportNotification, setExportNotification] = useState('');

  const exportRef = useRef(null);
  const chartRef = useRef(null);

  // Demo data for testing
  const demoData = filteredData;

  // Use demo data if filteredData is empty
  const dataToUse = Array.isArray(filteredData) && filteredData.length > 0 ? filteredData : demoData;

  // Helper: Parse DD-MM-YYYY date format
  const parseBlastDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  const isValidDate = (dateStr) => {
    const d = parseBlastDate(dateStr);
    return d instanceof Date && !isNaN(d);
  };

  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  // Calculate Specific Charge using the formula: Specific Charge (kg/m³) = Total Explosive (kg) / Theoretical Volume Blasted (m³)
  const calculateSpecificCharge = (item) => {
    const totalExplosive = item.total_explosive_kg || item.explosive_quantity || item.explosive_used || 0;
    const theoreticalVolume = item.theoretical_volume_m3 || item.volume_blasted || item.blast_volume || 0;
    
    if (totalExplosive > 0 && theoreticalVolume > 0) {
      return totalExplosive / theoreticalVolume;
    }
    
    // Fallback to existing field if calculation fields are not available
    return item.actual_pf_ton_kg || 0;
  };

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

  // Calculate available months based on data
  const availableMonths = useMemo(() => {
    if (!Array.isArray(dataToUse)) return months.map(month => ({ ...month, hasData: false }));
    
    const monthsWithData = new Set();
    
    dataToUse.forEach(item => {
      if (item.total_exp_cost && item.total_exp_cost > 0 && isValidDate(item.blastdate)) {
        const date = parseBlastDate(item.blastdate);
        if (date && date.getFullYear() === dateRange.selectedYear) {
          monthsWithData.add(date.getMonth());
        }
      }
    });
    
    return months.map(month => ({
      ...month,
      hasData: monthsWithData.has(month.value)
    }));
  }, [dataToUse, dateRange.selectedYear, months]);

  // Auto-select first available month when year changes
  useEffect(() => {
    if (timeMode === 'monthly' && availableMonths.length > 0) {
      const currentMonthHasData = availableMonths.find(m => m.value === dateRange.selectedMonth)?.hasData;
      if (!currentMonthHasData) {
        const firstAvailableMonth = availableMonths.find(m => m.hasData);
        if (firstAvailableMonth) {
          setDateRange(prev => ({ ...prev, selectedMonth: firstAvailableMonth.value }));
        }
      }
    }
  }, [availableMonths, dateRange.selectedMonth, timeMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const calculatedSpecificCharge = calculateSpecificCharge(item);
      return calculatedSpecificCharge > 0;
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
      // Fixed: Group by day within the selected month to show daily data
      const dailyData = {};

      validData.forEach((item) => {
        const date = parseBlastDate(item.blastdate);
        // Create day key for the selected month (YYYY-MM-DD format)
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = {
            date: dayKey,
            costs: [],
            specificChargeValues: [],
            count: 0,
          };
        }
        dailyData[dayKey].costs.push(item.total_exp_cost);
        const calculatedSpecificCharge = calculateSpecificCharge(item);
        if (calculatedSpecificCharge > 0) {
          dailyData[dayKey].specificChargeValues.push(calculatedSpecificCharge);
        }
        dailyData[dayKey].count++;
      });

      return Object.values(dailyData)
        .map((dayData) => {
          const date = new Date(dayData.date);
          return {
            date: dayData.date,
            displayDate: date.toLocaleDateString(undefined, { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            }),
            cost: dayData.costs.reduce((sum, cost) => sum + cost, 0) / dayData.costs.length,
            actual_pf_ton_kg:
              dayData.specificChargeValues.length > 0
                ? dayData.specificChargeValues.reduce((sum, sc) => sum + sc, 0) /
                  dayData.specificChargeValues.length
                : null,
            blastCount: dayData.count,
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (timeMode === 'yearly') {
      // Fixed: Group by month within the selected year range to show monthly data
      const monthlyData = {};

      validData.forEach((item) => {
        const date = parseBlastDate(item.blastdate);
        if (!date) return;
        
        // Create month key (YYYY-MM format)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            costs: [],
            specificChargeValues: [],
            count: 0,
          };
        }
        monthlyData[monthKey].costs.push(item.total_exp_cost);
        const calculatedSpecificCharge = calculateSpecificCharge(item);
        if (calculatedSpecificCharge > 0) {
          monthlyData[monthKey].specificChargeValues.push(calculatedSpecificCharge);
        }
        monthlyData[monthKey].count++;
      });

      return Object.values(monthlyData)
        .map((monthData) => {
          const date = new Date(monthData.date + '-01');
          return {
            date: monthData.date,
            displayDate: date.toLocaleDateString(undefined, { 
              month: 'short', 
              year: 'numeric' 
            }),
            cost: monthData.costs.reduce((sum, cost) => sum + cost, 0) / monthData.costs.length,
            actual_pf_ton_kg:
              monthData.specificChargeValues.length > 0
                ? monthData.specificChargeValues.reduce((sum, sc) => sum + sc, 0) /
                  monthData.specificChargeValues.length
                : null,
            blastCount: monthData.count,
          };
        })
        .sort((a, b) => new Date(a.date + '-01') - new Date(b.date + '-01'));
    } else {
      return validData
        .map((item) => {
          const parsedDate = parseBlastDate(item.blastdate);
          return {
            ...item,
            date: parsedDate ? parsedDate.toISOString().split('T')[0] : item.blastdate,
            displayDate: parsedDate ? parsedDate.toLocaleDateString() : item.blastdate,
            cost: item.total_exp_cost,
            actual_pf_ton_kg: calculateSpecificCharge(item),
            // Store raw values for tooltip display
            total_explosive_kg: item.total_explosive_kg || item.explosive_quantity || item.explosive_used || 0,
            theoretical_volume_m3: item.theoretical_volume_m3 || item.volume_blasted || item.blast_volume || 0,
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [dataToUse, timeMode, dateRange]);

  const summaryStats = useMemo(() => {
    const validCosts = processedData.filter((item) => item.cost > 0);
    const validSpecificCharges = processedData.filter((item) => item.actual_pf_ton_kg > 0 && item.actual_pf_ton_kg !== null);
    
    // Calculate total explosive and total volume for overall efficiency
    const totalExplosive = processedData.reduce((sum, item) => sum + (item.total_explosive_kg || 0), 0);
    const totalVolume = processedData.reduce((sum, item) => sum + (item.theoretical_volume_m3 || 0), 0);
    
    return {
      totalCost: validCosts.reduce((sum, item) => sum + item.cost, 0),
      avgSpecificCharge:
        validSpecificCharges.length > 0
          ? validSpecificCharges.reduce((sum, item) => sum + item.actual_pf_ton_kg, 0) /
            validSpecificCharges.length : 0,
      totalBlasts: processedData.length,
      totalExplosive: totalExplosive,
      totalVolume: totalVolume,
      avgPPV: validSpecificCharges.length > 0 
        ? validSpecificCharges.reduce((sum, item) => sum + item.actual_pf_ton_kg, 0) / validSpecificCharges.length 
        : 0,
      avgAirBlast: 0 // Added missing property
    };
  }, [processedData]);

  // Define theme-based colors
  const chartColors = useMemo(() => ({
    primary: isDarkMode ? '#60A5FA' : '#3B82F6', // Blue
    trendline: isDarkMode ? '#F87171' : '#EF4444', // Red
    grid: isDarkMode ? '#374151' : '#E5E7EB',
    text: isDarkMode ? '#D1D5DB' : '#6B7280',
    background: isDarkMode ? '#1F2937' : '#FFFFFF',
    tooltip: isDarkMode ? '#374151' : '#F9FAFB',
    tooltipBorder: isDarkMode ? '#4B5563' : '#E5E7EB',
  }), [isDarkMode]);

  const chartData = useMemo(() => {
    const data = processedData.map((item) => {
      const dataPoint = {
        date: item.date,
        displayDate: item.displayDate,
        cost: item.cost,
      };
      if (activeMeasurements.actual_pf_ton_kg && item.actual_pf_ton_kg !== null) {
        dataPoint.actual_pf_ton_kg = item.actual_pf_ton_kg;
      }
      return dataPoint;
    });

    // Calculate trendline for actual_pf_ton_kg
    if (activeMeasurements.actual_pf_ton_kg && data.length > 1) {
      const validData = data.filter(d => d.actual_pf_ton_kg !== null && d.actual_pf_ton_kg !== undefined);
      if (validData.length > 1) {
        // Simple linear regression
        const n = validData.length;
        const sumX = validData.reduce((sum, _, index) => sum + index, 0);
        const sumY = validData.reduce((sum, d) => sum + d.actual_pf_ton_kg, 0);
        const sumXY = validData.reduce((sum, d, index) => sum + (index * d.actual_pf_ton_kg), 0);
        const sumX2 = validData.reduce((sum, _, index) => sum + (index * index), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Add trendline data to each point
        data.forEach((d, index) => {
          if (d.actual_pf_ton_kg !== null && d.actual_pf_ton_kg !== undefined) {
            const validIndex = validData.findIndex(vd => vd.date === d.date);
            if (validIndex !== -1) {
              d.trendline = slope * validIndex + intercept;
            }
          }
        });
      }
    }

    return data;
  }, [processedData, activeMeasurements]);

  const handleExport = async (format) => {
    setExportNotification(`Exporting as ${format.toUpperCase()}...`);
    setShowExportDropdown(false);

    try {
      // Get the chart container
      const chartContainer = chartRef.current;
      if (!chartContainer) {
        throw new Error('Chart not found');
      }

      if (format === 'svg') {
        // Find the SVG element in the chart
        const svgElement = chartContainer.querySelector('svg');
        if (!svgElement) {
          throw new Error('SVG element not found');
        }

        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);
        
        // Set explicit dimensions
        const rect = svgElement.getBoundingClientRect();
        clonedSvg.setAttribute('width', rect.width);
        clonedSvg.setAttribute('height', rect.height);
        
        // Add theme-appropriate background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', chartColors.background);
        clonedSvg.insertBefore(background, clonedSvg.firstChild);

        // Get SVG data
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        // Direct SVG download
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `specific-charge-chart.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // CSV export
        const csvHeaders = ['Date', 'Specific Charge (kg/m³)', 'Total Explosive (kg)', 'Volume Blasted (m³)', 'Trendline (kg/m³)'];
        const csvData = chartData.map(item => [
          item.displayDate,
          item.actual_pf_ton_kg || 'N/A',
          item.total_explosive_kg || 'N/A',
          item.theoretical_volume_m3 || 'N/A',
          item.trendline || 'N/A'
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `specific-charge-${timeMode}-${new Date().toISOString().split('T')[0]}.csv`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Use html2canvas to capture the actual rendered chart
        try {
          const { default: html2canvas } = await import('html2canvas');
          
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: chartColors.background,
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
          });

          // Convert canvas to desired format
          if (format === 'pdf') {
            // Generate PDF using jsPDF
            try {
              const { default: jsPDF } = await import('jspdf');
              
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('landscape', 'mm', 'a4');
              
              // Calculate dimensions to fit the chart in PDF
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              const canvasRatio = canvas.width / canvas.height;
              const pdfRatio = pdfWidth / pdfHeight;
              
              let imgWidth, imgHeight;
              if (canvasRatio > pdfRatio) {
                imgWidth = pdfWidth - 20; // 10mm margin on each side
                imgHeight = imgWidth / canvasRatio;
              } else {
                imgHeight = pdfHeight - 20; // 10mm margin on top and bottom
                imgWidth = imgHeight * canvasRatio;
              }
              
              // Center the image
              const x = (pdfWidth - imgWidth) / 2;
              const y = (pdfHeight - imgHeight) / 2;
              
              pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
              pdf.save('specific-charge-chart.pdf');
              
              setTimeout(() => {
                setExportNotification('Chart exported as PDF successfully!');
                setTimeout(() => setExportNotification(''), 3000);
              }, 500);
              
            } catch (pdfError) {
              console.error('PDF generation failed:', pdfError);
              // Fallback to PNG download
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'specific-charge-chart.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, 'image/png', 0.95);
            }
          } else {
            // Handle PNG and JPEG formats
            let mimeType = 'image/png';
            let quality = 0.95;
            
            if (format === 'jpeg') {
              mimeType = 'image/jpeg';
            }
            
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `specific-charge-chart.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } else {
                throw new Error('Failed to create blob');
              }
            }, mimeType, quality);
          }
        } catch (html2canvasError) {
          console.warn('html2canvas failed, falling back to SVG method:', html2canvasError);
          
          // Fallback to SVG method
          const svgElement = chartContainer.querySelector('svg');
          if (!svgElement) {
            throw new Error('SVG element not found');
          }

          const clonedSvg = svgElement.cloneNode(true);
          const rect = svgElement.getBoundingClientRect();
          clonedSvg.setAttribute('width', rect.width);
          clonedSvg.setAttribute('height', rect.height);
          
          const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          background.setAttribute('width', '100%');
          background.setAttribute('height', '100%');
          background.setAttribute('fill', chartColors.background);
          clonedSvg.insertBefore(background, clonedSvg.firstChild);

          const svgData = new XMLSerializer().serializeToString(clonedSvg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          ctx.scale(2, 2);
          
          const img = new Image();
          img.onload = () => {
            ctx.fillStyle = chartColors.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            
            if (format === 'pdf') {
              // Generate PDF using jsPDF
              try {
                import('jspdf').then(({ default: jsPDF }) => {
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF('landscape', 'mm', 'a4');
                  
                  // Calculate dimensions to fit the chart in PDF
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = pdf.internal.pageSize.getHeight();
                  const canvasRatio = canvas.width / canvas.height;
                  const pdfRatio = pdfWidth / pdfHeight;
                  
                  let imgWidth, imgHeight;
                  if (canvasRatio > pdfRatio) {
                    imgWidth = pdfWidth - 20; // 10mm margin on each side
                    imgHeight = imgWidth / canvasRatio;
                  } else {
                    imgHeight = pdfHeight - 20; // 10mm margin on top and bottom
                    imgWidth = imgHeight * canvasRatio;
                  }
                  
                  // Center the image
                  const x = (pdfWidth - imgWidth) / 2;
                  const y = (pdfHeight - imgHeight) / 2;
                  
                  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                  pdf.save('specific-charge-chart.pdf');
                });
              } catch (pdfError) {
                console.error('PDF generation failed:', pdfError);
                // Fallback to PNG download
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'specific-charge-chart.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                }, 'image/png', 0.95);
              }
            } else {
              const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `specific-charge-chart.${format}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, mimeType, 0.95);
            }
          };
          
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        }
      }

      if (format !== 'pdf' && format !== 'csv') {
        setTimeout(() => {
          setExportNotification(`Chart exported as ${format.toUpperCase()} successfully!`);
          setTimeout(() => setExportNotification(''), 3000);
        }, 500);
      } else if (format === 'csv') {
        setTimeout(() => {
          setExportNotification('Data exported as CSV successfully!');
          setTimeout(() => setExportNotification(''), 3000);
        }, 500);
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportNotification(`Export failed: ${error.message}`);
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
            {data.actual_pf_ton_kg !== null && data.actual_pf_ton_kg !== undefined && (
              <>
                <p className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: chartColors.primary }} />
                  Specific Charge: {data.actual_pf_ton_kg.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} kg/m³
                </p>
                <div className="text-xs text-gray-500 mt-1 pl-6">
                  <p>Total Explosive: {(data.total_explosive_kg || 0).toLocaleString()} kg</p>
                  <p>Volume Blasted: {(data.theoretical_volume_m3 || 0).toLocaleString()} m³</p>
                  <p className="font-medium">Formula: {(data.total_explosive_kg || 0).toLocaleString()} kg ÷ {(data.theoretical_volume_m3 || 0).toLocaleString()} m³</p>
                </div>
              </>
            )}
            {data.trendline !== null && data.trendline !== undefined && (
              <p className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: chartColors.trendline }} />
                Trend: {data.trendline.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} kg/m³
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
        <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl relative`} style={{ zIndex: 1000 }}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Specific Charge Analytics Dashboard
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
                    } shadow-lg hover:shadow-xl transform hover:scale-105 relative z-[1001]`}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportDropdown && (
                  <div
                    className={`absolute top-full right-0 mt-2 w-40 rounded-xl border shadow-2xl z-[9999] ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-white border-gray-200'
                    } backdrop-blur-md`}
                    style={{ 
                      position: 'absolute', 
                      zIndex: 9999
                    }}>
                    {['png', 'jpeg', 'pdf', 'svg', 'csv'].map((format) => (
                      <button key={format} onClick={() => handleExport(format)}
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
          <div className={`fixed top-4 right-4 p-4 rounded-xl z-[10000] ${isDarkMode ? 'bg-green-800 text-white' : 'bg-green-100 text-green-800'} backdrop-blur-md border ${isDarkMode ? 'border-green-600' : 'border-green-200'}`}>
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
                    {availableMonths.map((month) => (
                      <option 
                        key={month.value} 
                        value={month.value}
                        disabled={!month.hasData}
                        className={!month.hasData ? 'text-gray-400' : ''}
                      >
                        {month.label} {!month.hasData ? '(No Data)' : ''}
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
                  <input type="number" placeholder="Start Year" value={dateRange.startYear} onChange={(e) => setDateRange((prev) => ({ ...prev, startYear: parseInt(e.target.value) || 2020 }))}
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
                <button onClick={() => toggleMeasurement('actual_pf_ton_kg')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all duration-300 ${activeMeasurements.actual_pf_ton_kg ? 'bg-blue-500 text-white shadow-lg' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Specific Charge
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
            Specific Charge Trends
          </h2>
          {chartData.length > 0 ? (
            <div className="h-96" ref={chartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: chartColors.text }}
                    angle={-45} 
                    textAnchor="end" 
                    height={60} />
                  {activeMeasurements.actual_pf_ton_kg && (
                    <YAxis yAxisId="actual_pf_ton_kg" orientation="left" tick={{ fontSize: 12, fill: chartColors.primary }}
                      label={{ value: 'Specific Charge (kg/m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: chartColors.primary } }} />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {activeMeasurements.actual_pf_ton_kg && (
                    <Line yAxisId="actual_pf_ton_kg" type="monotone" dataKey="actual_pf_ton_kg" stroke={chartColors.primary} name="Specific Charge" strokeWidth={2} />
                  )}
                  {activeMeasurements.actual_pf_ton_kg && chartData.some(d => d.trendline) && (
                    <Line 
                      yAxisId="actual_pf_ton_kg" 
                      type="monotone" 
                      dataKey="trendline" 
                      stroke={chartColors.trendline} 
                      strokeDasharray="5 5"
                      name="Trendline" 
                      strokeWidth={2}
                      dot={false}
                    />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`${cardClasses} backdrop-blur-md rounded-2xl border p-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-75">Average Specific Charge</p>
                <p className="text-2xl font-bold">
                  {summaryStats.avgSpecificCharge.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg/m³
                </p>
                <p className="text-xs opacity-60 mt-1">
                  Total Explosive ÷ Volume Blasted
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
              <div className="p-3 bg-orange-500 rounded-xl">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-75">Total Explosive</p>
                <p className="text-2xl font-bold">
                  {summaryStats.totalExplosive.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{' '}
                  kg
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
                <p className="text-sm opacity-75">Total Volume</p>
                <p className="text-2xl font-bold">
                  {summaryStats.totalVolume.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{' '}
                  m³
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificCharge;