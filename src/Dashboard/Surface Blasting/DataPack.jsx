import React, { useEffect, useState, useContext } from 'react';

import KPI3 from './Flyrock';

import { Filter, Upload, Trash2, Sun, Moon, Database, Search, TrendingUp, MapPin, Layers, Mountain, Gem, Zap, Activity, BarChart3, Settings, RefreshCw, ChevronDown, Eye, EyeOff, Download, BookOpen, Maximize2, Grid, List } from 'lucide-react';

// Mock context for demo - replace with your actual contexts

const DataFilter = () => {
  const [loading, setLoading] = useState(true);
  const [csvFallbackVisible, setCsvFallbackVisible] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [lightMode, setLightMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [filters, setFilters] = useState({
    minename: '',
    pitname: '',
    zonename: '',
    benchname: '',
    rock_name: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    minename: [],
    pitname: [],
    zonename: [],
    benchname: [],
    rock_name: []
  });

  // Mock data for demo
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const toggleTheme = () => setLightMode(!lightMode);
  const toggleCompactMode = () => setCompactMode(!compactMode);

  const API_URL = 'CleanRecords_api.json';

  useEffect(() => {
    const keysPressed = new Set();
    const handleKeyDown = (e) => {
      keysPressed.add(e.key.toLowerCase());
      if (keysPressed.has('alt') && keysPressed.has('r') && keysPressed.has('k')) {
        setCsvFallbackVisible(true);
        alert('🔓 CSV Mode Enabled! Reload the page to hide the CSV upload again.');
      }
    };
    const handleKeyUp = () => keysPressed.clear();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          setRawData(json.data);
          setFilteredData(json.data);
        } else {
          console.warn('⚠️ Unexpected API structure:', json);
        }
      } catch (error) {
        console.warn('🚨 API Fetch Failed:', error.message);
        // Mock data for demo
        const mockData = [
          { minename: 'Mine A', pitname: 'Pit 1', zonename: 'Zone 1', benchname: 'Bench 1', rock_name: 'Granite' },
          { minename: 'Mine B', pitname: 'Pit 2', zonename: 'Zone 2', benchname: 'Bench 2', rock_name: 'Limestone' }
        ];
        setRawData(mockData);
        setFilteredData(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = e.target.result.trim().split('\n').map((line) => line.split(','));
        if (rows.length < 2) throw new Error('CSV must have headers and at least one row');
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const data = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => (obj[h] = row[i]?.trim() || ''));
          return obj;
        });
        setRawData(data);
        setFilteredData(data);
      } catch (err) {
        alert(`❌ CSV Parsing Error: ${err.message}`);
      }
    };
    reader.readAsText(csvFile);
  }, [csvFile]);

  const getUnique = (arr, key) =>
    [...new Set(arr.map(item => item[key]).filter(Boolean))];

  useEffect(() => {
    setFilterOptions({
      minename: getUnique(rawData, 'minename'),
      pitname: getUnique(rawData.filter(d => d.minename === filters.minename), 'pitname'),
      zonename: getUnique(rawData.filter(d =>
        d.minename === filters.minename && d.pitname === filters.pitname), 'zonename'),
      benchname: getUnique(rawData.filter(d =>
        d.minename === filters.minename &&
        d.pitname === filters.pitname &&
        d.zonename === filters.zonename), 'benchname'),
      rock_name: getUnique(rawData.filter(d =>
        d.minename === filters.minename &&
        d.pitname === filters.pitname &&
        d.zonename === filters.zonename &&
        d.benchname === filters.benchname), 'rock_name')
    });
  }, [filters, rawData]);

  useEffect(() => {
    const result = rawData.filter(row =>
      (!filters.minename || row.minename === filters.minename) &&
      (!filters.pitname || row.pitname === filters.pitname) &&
      (!filters.zonename || row.zonename === filters.zonename) &&
      (!filters.benchname || row.benchname === filters.benchname) &&
      (!filters.rock_name || row.rock_name === filters.rock_name)
    );
    setFilteredData(result);
  }, [filters, rawData]);

  const clearFilters = () => {
    setFilters({
      minename: '',
      pitname: '',
      zonename: '',
      benchname: '',
      rock_name: ''
    });
    setFilteredData(rawData);
  };

  const handleFilterChange = (key, value) => {
    const resetFrom = {
      minename: { pitname: '', zonename: '', benchname: '', rock_name: '' },
      pitname: { zonename: '', benchname: '', rock_name: '' },
      zonename: { benchname: '', rock_name: '' },
      benchname: { rock_name: '' },
      rock_name: {}
    };
    setFilters(prev => ({ ...prev, [key]: value, ...resetFrom[key] }));
  };

  const getFilterIcon = (key) => {
    const icons = {
      minename: <Mountain className="h-3 w-3 sm:h-4 sm:w-4" />,
      pitname: <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />,
      zonename: <Layers className="h-3 w-3 sm:h-4 sm:w-4" />,
      benchname: <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />,
      rock_name: <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
    };
    return icons[key] || <Search className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  const getFilterLabel = (key) => {
    const labels = {
      minename: 'Mine Name',
      pitname: 'Pit Name',
      zonename: 'Zone Name',
      benchname: 'Bench Name',
      rock_name: 'Rock Type'
    };
    return labels[key] || key;
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(filteredData[0]).join(',')]
        .concat(filteredData.map(row => Object.values(row).join(',')))
        .join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_mining_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`max-h-screen flex items-center justify-center px-2 sm:px-4 ${lightMode ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950'}`}>
        <div className="text-center relative w-full max-w-xs sm:max-w-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl sm:blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 border-3 sm:border-4 border-transparent mx-auto mb-3 sm:mb-6 md:mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full"></div>
              <div className="absolute inset-1 sm:inset-2 bg-white dark:bg-gray-900 rounded-full"></div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <p className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-black ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                Initializing Mining Analytics
              </p>
              <p className={`text-xs sm:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Processing geological data streams...
              </p>
              <div className="flex justify-center space-x-1 mt-2 sm:mt-4">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${lightMode ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950'}`}>
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-gradient-to-r from-blue-500/8 to-purple-600/8 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 bg-gradient-to-r from-emerald-500/8 to-teal-600/8 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-60 lg:h-60 xl:w-72 xl:h-72 bg-gradient-to-r from-purple-500/8 to-pink-600/8 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-10 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-52 lg:h-52 xl:w-64 xl:h-64 bg-gradient-to-r from-orange-500/6 to-red-500/6 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-4 md:py-6 lg:py-8">
        {/* Enhanced Smart Filters Panel */}
        <div className={`relative overflow-hidden backdrop-blur-2xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl border transition-all duration-500 mb-3 sm:mb-6 md:mb-8 lg:mb-12 ${
          lightMode 
            ? 'bg-white/95 border-gray-200/80 shadow-gray-300/60' 
            : 'bg-white/8 border-white/15 shadow-black/50'
        }`}>
          {/* Enhanced Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/12 to-emerald-500/10 rounded-xl sm:rounded-2xl lg:rounded-3xl blur-lg sm:blur-xl opacity-50"></div>
          
          <div className="relative">
            {/* Header Section */}
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 pb-1 sm:pb-2 md:pb-3 lg:pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 md:mb-6 space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 w-full sm:w-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg sm:rounded-xl md:rounded-2xl blur-sm sm:blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg sm:rounded-xl md:rounded-2xl">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
                      <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-black ${lightMode ? 'text-gray-900' : 'text-white'}`}>
                        Smart Filters
                      </h2>
                      {getActiveFiltersCount() > 0 && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-bold rounded-full shadow-md sm:shadow-lg w-fit">
                          {getActiveFiltersCount()} Active
                        </div>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'} mt-0.5 sm:mt-1`}>
                      Advanced geological data filtering with intelligent cascade dependencies
                    </p>
                  </div>
                </div>
                
                {/* Control Panel */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto justify-start sm:justify-end">
                  {/* View Mode Toggle */}
                  <div className={`flex rounded-lg sm:rounded-xl md:rounded-2xl p-0.5 sm:p-1 border ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-white/10 border-white/20'}`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md sm:shadow-lg' 
                          : lightMode ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md sm:shadow-lg' 
                          : lightMode ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>

                  {/* Compact Mode Toggle */}
                  <button
                    onClick={toggleCompactMode}
                    className={`group relative p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 ${
                      compactMode
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md sm:shadow-lg hover:shadow-purple-500/25' 
                        : lightMode 
                          ? 'bg-white/90 text-gray-700 shadow-sm sm:shadow-md hover:shadow-lg border border-gray-200 hover:border-gray-300' 
                          : 'bg-white/10 text-gray-300 shadow-md sm:shadow-lg hover:shadow-white/10 border border-white/20'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-1 sm:space-x-2">
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-semibold hidden lg:block">
                        {compactMode ? 'Expanded' : 'Compact'}
                      </span>
                    </div>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`group relative p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 ${
                      lightMode 
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md sm:shadow-lg hover:shadow-gray-800/25' 
                        : 'bg-gradient-to-r from-white to-gray-100 text-gray-800 shadow-md sm:shadow-lg hover:shadow-white/25'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-1 sm:space-x-2">
                      {lightMode ? <Moon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" /> : <Sun className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />}
                      <span className="text-xs sm:text-sm font-semibold hidden lg:block">
                        {lightMode ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </button>

                  {/* Panel Collapse Toggle */}
                  <button
                    onClick={() => setFilterPanelExpanded(!filterPanelExpanded)}
                    className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 ${
                      lightMode ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-transform duration-300 ${filterPanelExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Filter Content */}
            <div className={`transition-all duration-500 overflow-hidden ${filterPanelExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8">
                {/* Filter Grid */}
                <div className={`grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-6 md:mb-8 ${
                  viewMode === 'grid' 
                    ? compactMode 
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                    : 'grid-cols-1 gap-2 sm:gap-3 md:gap-4'
                }`}>
                  {Object.keys(filters).map((key, index) => (
                    <div key={key} className="group">
                      <label className={`flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 md:mb-3 ${
                        lightMode ? 'text-gray-800' : 'text-gray-200'
                      }`}>
                        <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 group-hover:scale-105 sm:group-hover:scale-110 ${
                          lightMode ? 'bg-gray-100 group-hover:bg-gray-200' : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                          {getFilterIcon(key)}
                        </div>
                        <span className="truncate">{getFilterLabel(key)}</span>
                        {filters[key] && (
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                        )}
                      </label>
                      <div className="relative group">
                        <select
                          value={filters[key]}
                          onChange={(e) => handleFilterChange(key, e.target.value)}
                          disabled={
                            (key === 'pitname' && !filters.minename) ||
                            (key === 'zonename' && !filters.pitname) ||
                            (key === 'benchname' && !filters.zonename) ||
                            (key === 'rock_name' && !filters.benchname)
                          }
                          className={`w-full h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium group-hover:shadow-md sm:group-hover:shadow-lg text-xs sm:text-sm ${
  lightMode 
    ? 'bg-white border-gray-300 text-gray-800 hover:border-blue-400 focus:bg-white focus:border-blue-500 shadow-sm disabled:bg-gray-50' 
    : 'bg-white/10 border-white/20 text-white hover:border-blue-400 focus:bg-white/20 focus:border-blue-400 backdrop-blur-sm disabled:bg-white/5'
}`}

                          style={{ 
                            animationDelay: `${index * 100}ms`,
                            colorScheme: lightMode ? 'light' : 'dark'
                          }}
                        >
                          <option 
                            value="" 
                            style={{ 
                              backgroundColor: lightMode ? '#ffffff' : '#1f2937',
                              color: lightMode ? '#374151' : '#f9fafb'
                            }}
                          >
                            All {getFilterLabel(key)}s
                          </option>
                          {filterOptions[key]?.map((val, idx) => (
                            <option 
                              key={idx} 
                              value={val}
                              style={{ 
                                backgroundColor: lightMode ? '#ffffff' : '#1f2937',
                                color: lightMode ? '#374151' : '#f9fafb'
                              }}
                            >
                              {val}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  ))}
                </div>

               {/* Enhanced Action Bar */}
                <div className="flex flex-col lg:flex-row gap-2 md:gap-2 lg:gap-3 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-2 w-full lg:w-auto">
                    <button
                      onClick={clearFilters}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg md:rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-red-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Trash2 className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">Clear All Filters</span>
                    </button>
                    
                    <button className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-blue-500/25 w-full sm:w-auto">
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <RefreshCw className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">Refresh Data</span>
                    </button>

                    
                  </div>
                  
                  {/* Enhanced Stats Panel */}
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3 md:space-x-3 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg md:rounded-lg backdrop-blur-sm border transition-all duration-300 w-full lg:w-auto ${
                    lightMode 
                      ? 'bg-blue-50/80 text-blue-800 border-blue-200/50' 
                      : 'bg-blue-900/30 text-blue-300 border-blue-500/30'
                  }`}>
                    <div className="flex items-center space-x-2 md:space-x-2">
                      <Database className="h-4 w-4 md:h-4 md:w-4" />
                      <div className="text-xs md:text-xs lg:text-sm">
                        <span className="font-black text-sm md:text-sm lg:text-base">{filteredData.length.toLocaleString()}</span>
                        <span className="mx-1 opacity-75">of</span>
                        <span className="font-bold">{rawData.length.toLocaleString()}</span>
                        <span className="ml-1 font-medium">records</span>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block h-4 md:h-4 w-px bg-current opacity-30"></div>
                    <div className="w-full sm:w-auto h-px sm:h-auto bg-current opacity-30 sm:hidden"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3 md:space-x-3 w-full sm:w-auto">
                      <div className="flex items-center space-x-1.5 md:space-x-1.5">
                        <div className="w-2 h-2 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                        <span className="text-xs md:text-xs lg:text-sm font-bold">Live Data</span>
                      </div>
                      
                      <div className="hidden sm:block h-4 md:h-4 w-px bg-current opacity-30"></div>
                      
                      <div className="flex items-center space-x-1.5 md:space-x-1.5">
                        <Activity className="h-3 w-3 md:h-3 md:w-3" />
                        <span className="text-xs md:text-xs lg:text-sm font-medium">
                          {((filteredData.length / rawData.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CSV Upload Section */}
                {csvFallbackVisible && (
                  <div className={`mt-4 md:mt-3 p-3 md:p-3 lg:p-4 rounded-xl md:rounded-lg border-2 border-dashed transition-all duration-500 hover:border-solid ${
                    lightMode 
                      ? 'border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400' 
                      : 'border-gray-600/50 bg-white/5 hover:bg-white/10 hover:border-blue-400'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-3 mb-3 md:mb-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg md:rounded-lg blur opacity-75"></div>
                        <div className="relative p-2 md:p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg md:rounded-lg">
                          <Upload className="h-4 w-4 md:h-4 md:w-4 text-white" />
                        </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        <h3 className={`font-black text-base md:text-base lg:text-lg ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                          Custom Data Upload
                        </h3>
                        <p className={`text-xs md:text-xs lg:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'} mt-0.5`}>
                          Upload your CSV file for advanced geological analysis
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className={`w-full p-3 md:p-3 lg:p-4 border-2 rounded-lg md:rounded-lg transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 font-medium cursor-pointer text-xs md:text-xs lg:text-sm ${
                        lightMode 
                          ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500 hover:bg-blue-50/50' 
                          : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm hover:bg-white/20'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       
 
  

  <KPI3 filteredData={filteredData} DarkMode={lightMode} />
    </div>
    </div>
  );
};

export default DataFilter;