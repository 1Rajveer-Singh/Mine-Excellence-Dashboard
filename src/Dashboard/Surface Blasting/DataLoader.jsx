import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import KPI1 from './Average_blasting_cost';
import KPI2 from './Blast_cost_per_ton';
import KPI3 from './Burden_spacing_steaming';
import KPI4 from './Ground_and_Air_Vibration';
import KPI5 from './Flyrock';
import KPI6 from './Total_Explosive_consumption_powder_Factor';

import KPI7 from './Production_per_Hole';
import KPI8 from './Production_per_meter';
import KPI9 from './Specific_charge';
import KPI10 from './Specific_Drilling';


import { Filter, Upload, Trash2, Sun, Moon, Database, Search, TrendingUp, MapPin, Layers, Mountain, Gem, Zap, Activity, BarChart3, Settings, RefreshCw, ChevronDown, Eye, EyeOff, Download, BookOpen, Maximize2, Grid, List, FileText, X } from 'lucide-react';

// Mock context for demo - replace with your actual contexts

const DataFilter = () => {
  const [loading, setLoading] = useState(true);
  const [csvFallbackVisible, setCsvFallbackVisible] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportVisible, setCsvImportVisible] = useState(false);
  const [csvPriority, setCsvPriority] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState(''); // For status messages
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

  // API data state
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [apiData, setApiData] = useState({});
  
  // API configuration
  const [userDetails, setUserDetails] = useState({
    userid: 'c3VzaGls',
    companyid: 'c3VzaGls',
    usertype: 'admin'
  });
  const [criteria, setCriteria] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [extendqry, setExtendqry] = useState('');
  const [datewiseexqry, setDatewiseexqry] = useState('');

  const apiurl = "https://bimsanalysisapi.mineexcellence.com/Service.asmx/";

  // API Response Cache to avoid redundant calls
  const [apiCache, setApiCache] = useState(new Map());
  
  // Helper function to cache API responses
  const getCachedOrFetch = async (cacheKey, fetchFunction) => {
    if (apiCache.has(cacheKey)) {
      console.log(`📦 Using cached data for: ${cacheKey}`);
      return apiCache.get(cacheKey);
    }
    
    try {
      const result = await fetchFunction();
      if (result) {
        setApiCache(prev => new Map(prev).set(cacheKey, result));
        console.log(`💾 Cached data for: ${cacheKey}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${cacheKey}:`, error);
      return null;
    }
  };

  // Clear cache when user details change
  useEffect(() => {
    setApiCache(new Map());
  }, [userDetails.userid, userDetails.companyid, userDetails.usertype]);

  const toggleTheme = () => setLightMode(!lightMode);
  const toggleCompactMode = () => setCompactMode(!compactMode);

  const API_URL = '/CleanRecords_api.json';

  // API Functions with caching
  const getMine = async () => {
    const cacheKey = `mine-${userDetails.userid}-${userDetails.companyid}-${userDetails.usertype}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "getMine", {
        userid: userDetails.userid,
        companyid: userDetails.companyid,
        user: userDetails.usertype
      });
      setApiData(prev => ({...prev, getMine: response.data}));
      return response.data;
    });
  };

  const getRock = async (zonecode) => {
    const cacheKey = `rock-${zonecode}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "getRock", { zonecode });
      setApiData(prev => ({...prev, getRock: response.data}));
      return response.data;
    });
  };

  const getPit = async (minecode) => {
    const cacheKey = `pit-${minecode}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "getPit", { minecode });
      setApiData(prev => ({...prev, getPit: response.data}));
      return response.data;
    });
  };

  const getZone = async (pitcode) => {
    const cacheKey = `zone-${pitcode}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "getZone", { pitcode });
      setApiData(prev => ({...prev, getZone: response.data}));
      return response.data;
    });
  };

  const getBench = async (zonecode) => {
    const cacheKey = `bench-${zonecode}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "getBench", { zonecode });
      setApiData(prev => ({...prev, getBench: response.data}));
      return response.data;
    });
  };

  const operationalcostofblast = async () => {
    const cacheKey = `operational-${userDetails.userid}-${userDetails.companyid}-${criteria}-${month}-${year}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "operationalcostofblast", {
        userid: userDetails.userid,
        companyid: userDetails.companyid,
        usertype: userDetails.usertype,
        criteria,
        month,
        year,
        extendqry,
        datetrangefilter: datewiseexqry
      });
      setApiData(prev => ({...prev, operationalcostofblast: response.data}));
      return response.data;
    });
  };

  const specificcharge = async () => {
    const cacheKey = `specificcharge-${userDetails.userid}-${userDetails.companyid}-${criteria}-${month}-${year}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "specificcharge", {
        userid: userDetails.userid,
        companyid: userDetails.companyid,
        usertype: userDetails.usertype,
        criteria,
        month,
        year,
        extendqry,
        datetrangefilter: datewiseexqry
      });
      setApiData(prev => ({...prev, specificcharge: response.data}));
      return response.data;
    });
  };

  const flyrock = async () => {
    const cacheKey = `flyrock-${userDetails.userid}-${userDetails.companyid}-${criteria}-${month}-${year}`;
    return getCachedOrFetch(cacheKey, async () => {
      const response = await axios.post(apiurl + "flyrock", {
        userid: userDetails.userid,
        companyid: userDetails.companyid,
        usertype: userDetails.usertype,
        criteria,
        month,
        year,
        extendqry,
        datetrangefilter: datewiseexqry
      });
      setApiData(prev => ({...prev, flyrock: response.data}));
      return response.data;
    });
  };

  const fetchAllAPIData = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting series-wise API data fetching...');
      
      // Step 1: Fetch Mine data first
      updateFetchProgress(1, 6, 'Fetching Mine Data');
      console.log('📍 Step 1: Fetching Mine data...');
      const mineData = await getMine();
      if (!mineData || !mineData.data || mineData.data.length === 0) {
        console.warn('⚠️ No mine data available');
        await fetchLocalData();
        return;
      }
      
      console.log(`✅ Found ${mineData.data.length} mines`);
      
      // Step 2: For each mine, fetch Pit data
      updateFetchProgress(2, 6, 'Fetching Pit Data');
      console.log('📍 Step 2: Fetching Pit data for each mine...');
      const allPitData = [];
      for (const mine of mineData.data) {
        if (mine.minecode || mine.mineid) {
          const pitData = await getPit(mine.minecode || mine.mineid);
          if (pitData && pitData.data) {
            allPitData.push(...pitData.data.map(pit => ({
              ...pit,
              minename: mine.minename,
              minecode: mine.minecode || mine.mineid
            })));
          }
        }
      }
      
      console.log(`✅ Found ${allPitData.length} pits across all mines`);
      
      // Step 3: For each pit, fetch Zone data
      updateFetchProgress(3, 6, 'Fetching Zone Data');
      console.log('📍 Step 3: Fetching Zone data for each pit...');
      const allZoneData = [];
      for (const pit of allPitData) {
        if (pit.pitcode || pit.pitid) {
          const zoneData = await getZone(pit.pitcode || pit.pitid);
          if (zoneData && zoneData.data) {
            allZoneData.push(...zoneData.data.map(zone => ({
              ...zone,
              minename: pit.minename,
              minecode: pit.minecode,
              pitname: pit.pitname,
              pitcode: pit.pitcode || pit.pitid
            })));
          }
        }
      }
      
      console.log(`✅ Found ${allZoneData.length} zones across all pits`);
      
      // Step 4: For each zone, fetch Bench data
      updateFetchProgress(4, 6, 'Fetching Bench Data');
      console.log('📍 Step 4: Fetching Bench data for each zone...');
      const allBenchData = [];
      for (const zone of allZoneData) {
        if (zone.zonecode || zone.zoneid) {
          const benchData = await getBench(zone.zonecode || zone.zoneid);
          if (benchData && benchData.data) {
            allBenchData.push(...benchData.data.map(bench => ({
              ...bench,
              minename: zone.minename,
              minecode: zone.minecode,
              pitname: zone.pitname,
              pitcode: zone.pitcode,
              zonename: zone.zonename,
              zonecode: zone.zonecode || zone.zoneid
            })));
          }
        }
      }
      
      console.log(`✅ Found ${allBenchData.length} benches across all zones`);
      
      // Step 5: For each zone, fetch Rock data
      updateFetchProgress(5, 6, 'Fetching Rock Data');
      console.log('📍 Step 5: Fetching Rock data for each zone...');
      const allRockData = [];
      for (const zone of allZoneData) {
        if (zone.zonecode || zone.zoneid) {
          const rockData = await getRock(zone.zonecode || zone.zoneid);
          if (rockData && rockData.data) {
            allRockData.push(...rockData.data.map(rock => ({
              ...rock,
              minename: zone.minename,
              minecode: zone.minecode,
              pitname: zone.pitname,
              pitcode: zone.pitcode,
              zonename: zone.zonename,
              zonecode: zone.zonecode || zone.zoneid
            })));
          }
        }
      }
      
      console.log(`✅ Found ${allRockData.length} rock types across all zones`);
      
      // Step 6: Fetch analytics data (operational cost, specific charge, flyrock)
      updateFetchProgress(6, 6, 'Fetching Analytics Data');
      console.log('📍 Step 6: Fetching analytics data...');
      const [operationalData, specificChargeData, flyrockData] = await Promise.all([
        operationalcostofblast(),
        specificcharge(),
        flyrock()
      ]);
      
      console.log('✅ Analytics data fetched successfully');
      
      // Step 7: Combine all data with proper hierarchy
      updateFetchProgress(6, 6, 'Transforming Data');
      const transformedData = transformSeriesAPIData(
        mineData, 
        allPitData, 
        allZoneData, 
        allBenchData, 
        allRockData,
        operationalData,
        specificChargeData,
        flyrockData
      );
      
      console.log(`🎉 Data transformation complete! Total records: ${transformedData.length}`);
      
      setRawData(transformedData);
      setFilteredData(transformedData);
      setDataSource('api');
      
    } catch (error) {
      console.error('❌ Error in series-wise API fetching:', error);
      // Fallback to local data if API fails
      await fetchLocalData();
    } finally {
      setLoading(false);
      setFetchProgress({ currentStep: 0, totalSteps: 6, stepName: '', percentage: 0 });
    }
  };

  // New step-by-step API fetching function
  const fetchAPIStepByStep = async () => {
    setLoading(true);
    setStepByStepMode(true);
    clearStepResults();
    
    try {
      console.log('🚀 Starting step-by-step API data fetching...');
      
      // Step 1: Fetch Mine data
      updateFetchProgress(1, 6, 'Fetching Mine Data');
      setCurrentStepData({ step: 1, title: 'Fetching Mine Data...', loading: true });
      
      const mineData = await getMine();
      if (!mineData || !mineData.data || mineData.data.length === 0) {
        console.warn('⚠️ No mine data available');
        await fetchLocalData();
        return;
      }
      
      console.log(`✅ Found ${mineData.data.length} mines`);
      setStepResults(prev => ({ ...prev, mines: mineData.data }));
      setCurrentStepData({ 
        step: 1, 
        title: 'Mine Data Retrieved', 
        loading: false, 
        data: mineData.data,
        count: mineData.data.length,
        success: true 
      });
      
      // Wait for user interaction or auto-proceed after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Fetch Pit data
      updateFetchProgress(2, 6, 'Fetching Pit Data');
      setCurrentStepData({ step: 2, title: 'Fetching Pit Data...', loading: true });
      
      const allPitData = [];
      let pitCount = 0;
      
      for (const mine of mineData.data) {
        if (mine.minecode || mine.mineid) {
          const pitData = await getPit(mine.minecode || mine.mineid);
          if (pitData && pitData.data) {
            const pitsWithMine = pitData.data.map(pit => ({
              ...pit,
              minename: mine.minename,
              minecode: mine.minecode || mine.mineid
            }));
            allPitData.push(...pitsWithMine);
            pitCount += pitsWithMine.length;
          }
        }
      }
      
      console.log(`✅ Found ${pitCount} pits across all mines`);
      setStepResults(prev => ({ ...prev, pits: allPitData }));
      setCurrentStepData({ 
        step: 2, 
        title: 'Pit Data Retrieved', 
        loading: false, 
        data: allPitData,
        count: pitCount,
        success: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Fetch Zone data
      updateFetchProgress(3, 6, 'Fetching Zone Data');
      setCurrentStepData({ step: 3, title: 'Fetching Zone Data...', loading: true });
      
      const allZoneData = [];
      let zoneCount = 0;
      
      for (const pit of allPitData) {
        if (pit.pitcode || pit.pitid) {
          const zoneData = await getZone(pit.pitcode || pit.pitid);
          if (zoneData && zoneData.data) {
            const zonesWithPit = zoneData.data.map(zone => ({
              ...zone,
              minename: pit.minename,
              minecode: pit.minecode,
              pitname: pit.pitname,
              pitcode: pit.pitcode || pit.pitid
            }));
            allZoneData.push(...zonesWithPit);
            zoneCount += zonesWithPit.length;
          }
        }
      }
      
      console.log(`✅ Found ${zoneCount} zones across all pits`);
      setStepResults(prev => ({ ...prev, zones: allZoneData }));
      setCurrentStepData({ 
        step: 3, 
        title: 'Zone Data Retrieved', 
        loading: false, 
        data: allZoneData,
        count: zoneCount,
        success: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Fetch Bench data
      updateFetchProgress(4, 6, 'Fetching Bench Data');
      setCurrentStepData({ step: 4, title: 'Fetching Bench Data...', loading: true });
      
      const allBenchData = [];
      let benchCount = 0;
      
      for (const zone of allZoneData) {
        if (zone.zonecode || zone.zoneid) {
          const benchData = await getBench(zone.zonecode || zone.zoneid);
          if (benchData && benchData.data) {
            const benchesWithZone = benchData.data.map(bench => ({
              ...bench,
              minename: zone.minename,
              minecode: zone.minecode,
              pitname: zone.pitname,
              pitcode: zone.pitcode,
              zonename: zone.zonename,
              zonecode: zone.zonecode || zone.zoneid
            }));
            allBenchData.push(...benchesWithZone);
            benchCount += benchesWithZone.length;
          }
        }
      }
      
      console.log(`✅ Found ${benchCount} benches across all zones`);
      setStepResults(prev => ({ ...prev, benches: allBenchData }));
      setCurrentStepData({ 
        step: 4, 
        title: 'Bench Data Retrieved', 
        loading: false, 
        data: allBenchData,
        count: benchCount,
        success: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Fetch Rock data
      updateFetchProgress(5, 6, 'Fetching Rock Data');
      setCurrentStepData({ step: 5, title: 'Fetching Rock Data...', loading: true });
      
      const allRockData = [];
      let rockCount = 0;
      
      for (const zone of allZoneData) {
        if (zone.zonecode || zone.zoneid) {
          const rockData = await getRock(zone.zonecode || zone.zoneid);
          if (rockData && rockData.data) {
            const rocksWithZone = rockData.data.map(rock => ({
              ...rock,
              minename: zone.minename,
              minecode: zone.minecode,
              pitname: zone.pitname,
              pitcode: zone.pitcode,
              zonename: zone.zonename,
              zonecode: zone.zonecode || zone.zoneid
            }));
            allRockData.push(...rocksWithZone);
            rockCount += rocksWithZone.length;
          }
        }
      }
      
      console.log(`✅ Found ${rockCount} rock types across all zones`);
      setStepResults(prev => ({ ...prev, rocks: allRockData }));
      setCurrentStepData({ 
        step: 5, 
        title: 'Rock Data Retrieved', 
        loading: false, 
        data: allRockData,
        count: rockCount,
        success: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 6: Fetch Analytics data
      updateFetchProgress(6, 6, 'Fetching Analytics Data');
      setCurrentStepData({ step: 6, title: 'Fetching Analytics Data...', loading: true });
      
      const [operationalData, specificChargeData, flyrockData] = await Promise.all([
        operationalcostofblast(),
        specificcharge(),
        flyrock()
      ]);
      
      console.log('✅ Analytics data fetched successfully');
      
      const analyticsData = {
        operational: operationalData?.data || [],
        specificCharge: specificChargeData?.data || [],
        flyrock: flyrockData?.data || []
      };
      
      setStepResults(prev => ({ ...prev, analytics: analyticsData }));
      setCurrentStepData({ 
        step: 6, 
        title: 'Analytics Data Retrieved', 
        loading: false, 
        data: analyticsData,
        count: {
          operational: analyticsData.operational.length,
          specificCharge: analyticsData.specificCharge.length,
          flyrock: analyticsData.flyrock.length
        },
        success: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Final step: Transform data
      setCurrentStepData({ step: 7, title: 'Transforming Data...', loading: true });
      
      const transformedData = transformSeriesAPIData(
        { data: stepResults.mines },
        stepResults.pits,
        stepResults.zones,
        stepResults.benches,
        stepResults.rocks,
        operationalData,
        specificChargeData,
        flyrockData
      );
      
      console.log(`🎉 Data transformation complete! Total records: ${transformedData.length}`);
      
      setRawData(transformedData);
      setFilteredData(transformedData);
      setDataSource('api');
      
      setCurrentStepData({ 
        step: 7, 
        title: 'Data Transformation Complete', 
        loading: false, 
        data: transformedData,
        count: transformedData.length,
        success: true 
      });
      
    } catch (error) {
      console.error('❌ Error in step-by-step API fetching:', error);
      setCurrentStepData({ 
        step: fetchProgress.currentStep, 
        title: 'Error occurred', 
        loading: false, 
        error: error.message,
        success: false 
      });
      // Fallback to local data if API fails
      await fetchLocalData();
    } finally {
      setLoading(false);
      setFetchProgress({ currentStep: 0, totalSteps: 6, stepName: '', percentage: 0 });
    }
  };

  const transformSeriesAPIData = (
    mineData, 
    allPitData, 
    allZoneData, 
    allBenchData, 
    allRockData,
    operationalData,
    specificChargeData,
    flyrockData
  ) => {
    const transformedData = [];
    
    console.log('🔄 Starting data transformation...');
    
    // Create a comprehensive mapping of all hierarchical data
    const dataMap = new Map();
    
    // Process each level of hierarchy
    allBenchData.forEach(bench => {
      const key = `${bench.minename}-${bench.pitname}-${bench.zonename}-${bench.benchname}`;
      
      // Find corresponding rock data for this zone
      const rockForZone = allRockData.filter(rock => 
        rock.zonecode === bench.zonecode || rock.zonename === bench.zonename
      );
      
      // Create entries for each rock type in this bench
      if (rockForZone.length > 0) {
        rockForZone.forEach(rock => {
          const recordKey = `${key}-${rock.rock_name || rock.rockname}`;
          
          // Find analytics data that matches this record
          const operationalMatch = operationalData?.data?.find(op => 
            op.minename === bench.minename && 
            op.pitname === bench.pitname && 
            op.zonename === bench.zonename &&
            op.benchname === bench.benchname
          );
          
          const specificChargeMatch = specificChargeData?.data?.find(sc => 
            sc.minename === bench.minename && 
            sc.pitname === bench.pitname && 
            sc.zonename === bench.zonename &&
            sc.benchname === bench.benchname
          );
          
          const flyrockMatch = flyrockData?.data?.find(fr => 
            fr.minename === bench.minename && 
            fr.pitname === bench.pitname && 
            fr.zonename === bench.zonename &&
            fr.benchname === bench.benchname
          );
          
          const transformedRecord = {
            // Hierarchy data
            minename: bench.minename || '',
            pitname: bench.pitname || '',
            zonename: bench.zonename || '',
            benchname: bench.benchname || '',
            rock_name: rock.rock_name || rock.rockname || '',
            
            // IDs for reference
            minecode: bench.minecode,
            pitcode: bench.pitcode,
            zonecode: bench.zonecode,
            benchcode: bench.benchcode || bench.benchid,
            rockcode: rock.rockcode || rock.rockid,
            
            // Analytics data
            operationalCost: operationalMatch ? {
              cost: operationalMatch.cost || operationalMatch.operational_cost || 0,
              costPerTon: operationalMatch.cost_per_ton || 0,
              totalCost: operationalMatch.total_cost || 0,
              date: operationalMatch.date || operationalMatch.blast_date,
              ...operationalMatch
            } : {},
            
            specificCharge: specificChargeMatch ? {
              charge: specificChargeMatch.specific_charge || specificChargeMatch.charge || 0,
              powderFactor: specificChargeMatch.powder_factor || 0,
              explosive: specificChargeMatch.explosive_type || '',
              quantity: specificChargeMatch.explosive_quantity || 0,
              ...specificChargeMatch
            } : {},
            
            flyrock: flyrockMatch ? {
              distance: flyrockMatch.flyrock_distance || flyrockMatch.distance || 0,
              direction: flyrockMatch.flyrock_direction || flyrockMatch.direction || '',
              frequency: flyrockMatch.flyrock_frequency || flyrockMatch.frequency || 0,
              riskLevel: flyrockMatch.risk_level || 'low',
              ...flyrockMatch
            } : {},
            
            // Additional metadata
            lastUpdated: new Date().toISOString(),
            dataSource: 'api-series',
            
            // Raw data for debugging
            _raw: {
              bench,
              rock,
              operational: operationalMatch,
              specificCharge: specificChargeMatch,
              flyrock: flyrockMatch
            }
          };
          
          dataMap.set(recordKey, transformedRecord);
        });
      } else {
        // If no rock data, create a record without rock information
        const recordKey = `${key}-unknown`;
        
        const operationalMatch = operationalData?.data?.find(op => 
          op.minename === bench.minename && 
          op.pitname === bench.pitname && 
          op.zonename === bench.zonename &&
          op.benchname === bench.benchname
        );
        
        const specificChargeMatch = specificChargeData?.data?.find(sc => 
          sc.minename === bench.minename && 
          sc.pitname === bench.pitname && 
          sc.zonename === bench.zonename &&
          sc.benchname === bench.benchname
        );
        
        const flyrockMatch = flyrockData?.data?.find(fr => 
          fr.minename === bench.minename && 
          fr.pitname === bench.pitname && 
          fr.zonename === bench.zonename &&
          fr.benchname === bench.benchname
        );
        
        const transformedRecord = {
          minename: bench.minename || '',
          pitname: bench.pitname || '',
          zonename: bench.zonename || '',
          benchname: bench.benchname || '',
          rock_name: '',
          
          minecode: bench.minecode,
          pitcode: bench.pitcode,
          zonecode: bench.zonecode,
          benchcode: bench.benchcode || bench.benchid,
          rockcode: '',
          
          operationalCost: operationalMatch || {},
          specificCharge: specificChargeMatch || {},
          flyrock: flyrockMatch || {},
          
          lastUpdated: new Date().toISOString(),
          dataSource: 'api-series',
          
          _raw: {
            bench,
            operational: operationalMatch,
            specificCharge: specificChargeMatch,
            flyrock: flyrockMatch
          }
        };
        
        dataMap.set(recordKey, transformedRecord);
      }
    });
    
    // Convert map to array
    const result = Array.from(dataMap.values());
    
    console.log(`✅ Transformation complete: ${result.length} records created`);
    console.log('📊 Sample transformed record:', result[0]);
    
    return result;
  };

  const transformAPIData = (mineData, operationalData, specificChargeData, flyrockData) => {
    // Legacy transformation function - keep for backward compatibility
    const transformedData = [];
    
    // Example transformation (adjust based on actual API response structure)
    if (mineData && mineData.data) {
      mineData.data.forEach(item => {
        transformedData.push({
          minename: item.minename || '',
          pitname: item.pitname || '',
          zonename: item.zonename || '',
          benchname: item.benchname || '',
          rock_name: item.rock_name || '',
          // Add operational cost data if available
          operationalCost: operationalData?.data?.find(op => op.mineid === item.mineid) || {},
          // Add specific charge data if available
          specificCharge: specificChargeData?.data?.find(sc => sc.mineid === item.mineid) || {},
          // Add flyrock data if available
          flyrock: flyrockData?.data?.find(fr => fr.mineid === item.mineid) || {},
          // Add other fields as needed
          ...item
        });
      });
    }
    
    return transformedData;
  };

  const fetchLocalData = async () => {
    try {
      console.log('🔄 Fetching CleanRecords_api.json...');
      const res = await fetch(API_URL);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      console.log('📊 CleanRecords_api.json loaded:', {
        hasData: !!json?.data,
        dataLength: json?.data?.length || 0,
        sampleRecord: json?.data?.[0]
      });
      
      if (Array.isArray(json?.data) && json.data.length > 0) {
        // Process JSON data to ensure consistent field names
        const processedData = json.data.map((record, index) => {
          const processedRecord = {
            ...record,
            // Ensure consistent field naming
            blastcode: record.blastcode || record.BlastCode || `JSON_${index + 1}`,
            minename: record.minename || record.MineName || 'Unknown Mine',
            pitname: record.pitname || record.PitName || 'Unknown Pit',
            benchname: record.benchname || record.BenchName || 'Unknown Bench',
            zonename: record.zonename || record.ZoneName || 'Unknown Zone',
            blastdate: record.blastdate || record.BlastDate || new Date().toLocaleDateString(),
            total_explos_cost: parseFloat(record.total_explos_cost || record.total_exp_cost || record['Total Exp Cost'] || 0),
            drilling_cost: parseFloat(record.drilling_cost || record['Drilling Cost'] || 0),
            man_power_cost: parseFloat(record.man_power_cost || record['Man Power Cost'] || 0),
            blast_accessoriesdelay_cost: parseFloat(record.blast_accessoriesdelay_cost || record['Blast AccessoriesDelay Cost'] || 0),
            // Add all other numeric fields
            total_explosive_kg: parseFloat(record.total_explosive_kg || 0),
            production_ton_therotical: parseFloat(record.production_ton_therotical || record.production_ton_theoretical || 0),
            burden: parseFloat(record.burden || 0),
            spacing: parseFloat(record.spacing || 0),
            hole_depth: parseFloat(record.hole_depth || 0),
            flyrock: parseFloat(record.flyrock || 0),
            ppv: parseFloat(record.ppv || 0),
            air_blast: parseFloat(record.air_blast || 0),
            // Add dataSource identifier
            dataSource: 'json'
          };
          
          // Ensure all numeric fields are properly converted
          return processedRecord;
        });
        
        setRawData(processedData);
        setFilteredData(processedData);
        setDataSource('json');
        setCsvImportStatus('✅ CleanRecords_api.json loaded successfully');
        console.log('✅ Successfully loaded CleanRecords_api.json with', processedData.length, 'records');
        console.log('🔍 Sample record fields:', {
          sampleRecord: processedData[0],
          requiredFields: {
            blastdate: processedData[0]?.blastdate,
            total_explos_cost: processedData[0]?.total_explos_cost,
            total_explosive_kg: processedData[0]?.total_explosive_kg,
            prodution_therotical_vol: processedData[0]?.prodution_therotical_vol,
            production_ton_therotical: processedData[0]?.production_ton_therotical,
            flyrock: processedData[0]?.flyrock,
            dataSource: processedData[0]?.dataSource
          }
        });
      } else {
        throw new Error('No data found in CleanRecords_api.json or invalid format');
      }
    } catch (error) {
      console.warn('🚨 CleanRecords_api.json fetch failed:', error.message);
      setCsvImportStatus('❌ Failed to load CleanRecords_api.json - ' + error.message);
      
      // Create minimal fallback data to ensure graphs can render
      const fallbackData = [
        {
          blastcode: 'DEMO_001',
          minename: 'Demo Mine',
          pitname: 'Demo Pit',
          benchname: 'Demo Bench',
          zonename: 'Demo Zone',
          blastdate: '01/01/2024',
          total_explos_cost: 100000,
          drilling_cost: 50000,
          man_power_cost: 30000,
          blast_accessoriesdelay_cost: 20000,
          total_explosive_kg: 1000,
          prodution_therotical_vol: 25000,
          production_ton_therotical: 50000,
          production_ton_actual: 48000,
          flyrock: 25.5,
          ppv: 2.1,
          air_blast: 1.5,
          dataSource: 'fallback'
        },
        {
          blastcode: 'DEMO_002',
          minename: 'Demo Mine',
          pitname: 'Demo Pit',
          benchname: 'Demo Bench',
          zonename: 'Demo Zone',
          blastdate: '02/01/2024',
          total_explos_cost: 120000,
          drilling_cost: 60000,
          man_power_cost: 35000,
          blast_accessoriesdelay_cost: 25000,
          total_explosive_kg: 1200,
          prodution_therotical_vol: 30000,
          production_ton_therotical: 60000,
          production_ton_actual: 58000,
          flyrock: 30.2,
          ppv: 1.8,
          air_blast: 1.2,
          dataSource: 'fallback'
        }
      ];
      setRawData(fallbackData);
      setFilteredData(fallbackData);
      setDataSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = (file) => {
    if (!file) {
      alert('❌ Please select a CSV file');
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('❌ Please select a valid CSV file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('❌ File size too large. Please select a file smaller than 10MB');
      return;
    }
    
    console.log('📁 Starting CSV import...', file.name);
    setCsvFile(file);
    setCsvPriority(true);
    setCsvImportVisible(false);
  };

  const clearCSVData = () => {
    console.log('🔄 Clearing CSV data and falling back to CleanRecords_api.json...');
    setCsvFile(null);
    setCsvPriority(false);
    setCsvImportVisible(false);
    setCsvImportStatus('📄 Switched back to CleanRecords_api.json');
    
    // Clear current data first
    setRawData([]);
    setFilteredData([]);
    
    // Reload CleanRecords_api.json data
    fetchLocalData();
  };

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
      setLoading(true);
      
      // Priority 1: If CSV is uploaded and has priority, use CSV data
      if (csvFile && csvPriority) {
        console.log('📁 Using CSV data with high priority');
        return; // CSV processing handled in separate useEffect
      }
      
      // Priority 2: Try CleanRecords_api.json (local JSON file)
      console.log('📄 Loading default CleanRecords_api.json data...');
      await fetchLocalData();
    };
    
    fetchData();
  }, [userDetails, criteria, month, year, extendqry, datewiseexqry, csvPriority]);

  useEffect(() => {
    if (!csvFile) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result.trim();
        const rows = text.split('\n').map((line) => {
          // Handle comma-separated values with potential quotes
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });
        
        if (rows.length < 2) {
          throw new Error('CSV must have at least a header row and one data row');
        }
        
        const headers = rows[0].map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        console.log('📋 CSV Headers detected:', headers);
        
        // Map common header variations to standard field names
        const headerMap = {
          // Basic mine hierarchy - exact matches for your CSV
          'blastcode': 'blastcode',
          'minename': 'minename',
          'pitname': 'pitname',
          'benchname': 'benchname',
          'zonename': 'zonename',
          'blastdate': 'blastdate',
          'blasttime': 'blasttime',
          'rock name': 'rock_name',
          'rock density': 'rock_density',
          
          // Physical measurements - exact matches for your CSV
          'burden': 'burden',
          'holedia': 'holedia',
          'spacing': 'spacing',
          'hole depth': 'hole_depth',
          'bench height': 'bench_height',
          'face length': 'face_length',
          'hole angle': 'hole_angle',
          
          // Drilling data - exact matches for your CSV
          'total rows': 'total_rows',
          'hole blasted': 'hole_blasted',
          'holes_blasted': 'hole_blasted',
          'column charge': 'column_charge',
          'expcode': 'expcode',
          'column charge density': 'column_charge_density',
          'avg column charge length': 'avg_column_charge_length',
          'avg col weight': 'avg_col_weight',
          'base exp charge': 'base_exp_charge',
          'base exp density': 'base_exp_density',
          'avg base exp length': 'avg_base_exp_length',
          'base exp weight': 'base_exp_weight',
          'booster length': 'booster_length',
          
          // Production data - exact matches for your CSV
          'production ton therotical': 'production_ton_theoretical',
          'prodution therotical vol': 'production_theoretical_vol',
          'total explosive kg': 'total_explosive_kg',
          'drill factor': 'drill_factor',
          'ton recover': 'ton_recover',
          'tot stem': 'tot_stem',
          'total drill mtr': 'total_drill_mtr',
          
          // Environmental data - exact matches for your CSV
          'flyrock': 'flyrock',
          'air blast': 'air_blast',
          'ppv': 'ppv',
          
          // Cost data - exact matches for your CSV
          'total exp cost': 'total_explos_cost',
          'blast accessoriesdelay cost': 'blast_accessoriesdelay_cost',
          'drillcostperm': 'drillcostperm',
          'drilling cost': 'drilling_cost',
          'total drill': 'total_drill',
          'man power and accociated cost': 'man_power_and_associated_cost',
          'man power cost': 'man_power_cost',
          
          // Powder factor data - exact matches for your CSV
          'actual pf (ton/kg)': 'actual_pf_ton_kg',
          'theoretical pf (ton/kg)': 'theoretical_pf_ton_kg',
          
          // Fragmentation data - exact matches for your CSV
          'frag over size': 'frag_over_size',
          'frag under size': 'frag_under_size',
          'frag in range': 'frag_in_range',
          'fragmentation p80': 'fragmentation_p80',
          
          // Legacy mappings for backward compatibility
          'mine_name': 'minename',
          'mine name': 'minename',
          'pit_name': 'pitname',
          'pit name': 'pitname',
          'zone_name': 'zonename',
          'zone name': 'zonename',
          'bench_name': 'benchname',
          'bench name': 'benchname',
          'rock_name': 'rock_name',
          'rockname': 'rock_name',
          'rock type': 'rock_name',
          'rock_type': 'rock_name',
          'total_explosive': 'total_explosive_kg',
          'explosive_kg': 'total_explosive_kg',
          'drill_mtr': 'total_drill_mtr',
          'drilling_meter': 'total_drill_mtr',
          'tonnage': 'ton_recover',
          'recovery': 'ton_recover',
          'actual_pf': 'actual_pf_ton_kg',
          'powder_factor': 'actual_pf_ton_kg',
          'theoretical_pf': 'theoretical_pf_ton_kg',
          'blast_date': 'blastdate',
          'blast date': 'blastdate',
          'date': 'blastdate',
          'fly_rock': 'flyrock',
          'explosive_cost': 'total_explos_cost',
          'stemming length': 'stemming_length',
          'sremming length': 'stemming_length', // Your CSV uses this spelling
          'holes_drilled': 'hole_blasted',
          'total_holes': 'hole_blasted',
          'manpower_cost': 'man_power_cost',
          'manpower cost': 'man_power_cost',
          'accessories_cost': 'blast_accessoriesdelay_cost',
          'accessories cost': 'blast_accessoriesdelay_cost'
        };
        
        const normalizedHeaders = headers.map(header => headerMap[header] || header);
        console.log('📋 Normalized headers:', normalizedHeaders);
        
        const data = rows.slice(1).map((row, index) => {
          const obj = {};
          normalizedHeaders.forEach((header, headerIndex) => {
            let value = row[headerIndex] || '';
            // Remove quotes from values
            value = value.replace(/^["']|["']$/g, '').trim();
            
            // Convert numeric fields to numbers
            const numericFields = [
              // Core measurement fields
              'total_explosive_kg', 'total_drill_mtr', 'ton_recover', 'actual_pf_ton_kg', 
              'theoretical_pf_ton_kg', 'flyrock', 'ppv', 'air_blast', 'total_explos_cost',
              'burden', 'spacing', 'stemming_length', 'hole_depth', 'bench_height',
              'drilling_cost', 'man_power_cost', 'blast_accessoriesdelay_cost',
              
              // Additional fields from your CSV structure
              'blastcode', 'rock_density', 'holedia', 'face_length', 'hole_angle',
              'total_rows', 'hole_blasted', 'column_charge_density', 'avg_column_charge_length',
              'avg_col_weight', 'base_exp_charge', 'base_exp_density', 'avg_base_exp_length',
              'base_exp_weight', 'booster_length', 'production_ton_theoretical', 
              'production_theoretical_vol', 'drill_factor', 'tot_stem', 'total_drill',
              'drillcostperm', 'man_power_and_associated_cost', 'frag_over_size', 
              'frag_under_size', 'frag_in_range', 'fragmentation_p80',
              
              // Your CSV specific fields (exact names)
              'sremming_length', 'production_ton_therotical', 'prodution_therotical_vol',
              
              // Legacy compatibility fields
              'holes_drilled'
            ];
            
            if (numericFields.includes(header) && value !== '') {
              const numValue = parseFloat(value);
              obj[header] = isNaN(numValue) ? 0 : numValue;
            } else {
              obj[header] = value;
            }
          });
          
          // Ensure all required fields exist with proper defaults
          const requiredFields = ['minename', 'pitname', 'zonename', 'benchname', 'rock_name'];
          requiredFields.forEach(field => {
            if (!obj[field]) {
              obj[field] = '';
            }
          });
          
          // Ensure numeric fields have default values
          const requiredNumericFields = {
            // Core chart data fields
            'total_explosive_kg': 0,
            'total_drill_mtr': 0,
            'ton_recover': 0,
            'actual_pf_ton_kg': 0,
            'theoretical_pf_ton_kg': 0,
            'flyrock': 0,
            'ppv': 0,
            'air_blast': 0,
            'total_explos_cost': 0,
            'burden': 0,
            'spacing': 0,
            'stemming_length': 0,
            'hole_depth': 0,
            'bench_height': 0,
            'drilling_cost': 0,
            'man_power_cost': 0,
            'blast_accessoriesdelay_cost': 0,
            
            // Additional fields from your CSV
            'blastcode': 0,
            'rock_density': 2.35, // Default rock density
            'holedia': 0,
            'face_length': 0,
            'hole_angle': 0,
            'total_rows': 0,
            'hole_blasted': 0,
            'column_charge_density': 0,
            'avg_column_charge_length': 0,
            'avg_col_weight': 0,
            'base_exp_charge': 0,
            'base_exp_density': 0,
            'avg_base_exp_length': 0,
            'base_exp_weight': 0,
            'booster_length': 0,
            'production_ton_theoretical': 0,
            'production_theoretical_vol': 0,
            'drill_factor': 0,
            'tot_stem': 0,
            'total_drill': 0,
            'drillcostperm': 0,
            'man_power_and_associated_cost': 0,
            'frag_over_size': 0,
            'frag_under_size': 0,
            'frag_in_range': 0,
            'fragmentation_p80': 0,
            
            // Your CSV specific fields (with exact spelling)
            'sremming_length': 0,
            'production_ton_therotical': 0,
            'prodution_therotical_vol': 0,
            
            // Legacy fields
            'holes_drilled': 0
          };
          
          Object.keys(requiredNumericFields).forEach(field => {
            if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
              obj[field] = requiredNumericFields[field];
            }
          });
          
          // Ensure blastdate exists with default format
          if (!obj.blastdate) {
            obj.blastdate = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }).replace(/\//g, '-');
          }
          
          // Add metadata for CSV records
          obj.id = `csv_${index + 1}`;
          obj.dataSource = 'csv';
          obj.lastUpdated = new Date().toISOString();
          
          // Validation check for chart compatibility
          const hasRequiredData = obj.total_explosive_kg > 0 || obj.total_drill_mtr > 0 || obj.ton_recover > 0;
          if (!hasRequiredData) {
            console.warn(`⚠️ CSV row ${index + 1} has no numeric data for charts:`, obj);
          }
          
          return obj;
        }).filter(row => {
          // Filter out completely empty rows
          return Object.values(row).some(value => value && value !== '');
        });
        
        console.log(`📊 CSV loaded successfully: ${data.length} records`);
        console.log('📋 Sample CSV data:', data[0]);
        console.log('📋 All available fields in first record:', Object.keys(data[0] || {}));
        
        if (data.length === 0) {
          throw new Error('No valid data rows found in CSV file');
        }
        
        setRawData(data);
        setFilteredData(data);
        setDataSource('csv');
        setCsvPriority(true);
        setLoading(false);
        
        // Show success message
        console.log('✅ CSV import successful!');
        console.log('📊 Final filtered data being passed to components:', data.slice(0, 2));
        
      } catch (err) {
        console.error('❌ CSV Parsing Error:', err);
        alert(`❌ CSV Parsing Error: ${err.message}\n\nPlease ensure your CSV file has:\n- Headers in the first row\n- At least one data row\n- Proper comma separation\n- Required fields: minename, pitname, zonename, benchname, rock_name`);
        setCsvFile(null);
        setCsvPriority(false);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      alert('❌ Error reading CSV file. Please try again.');
      setCsvFile(null);
      setCsvPriority(false);
      setLoading(false);
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

  // API Status Check
  const checkAPIStatus = async () => {
    try {
      const response = await axios.get(apiurl.replace('Service.asmx/', ''));
      return response.status === 200;
    } catch (error) {
      console.error('API Status Check Failed:', error);
      return false;
    }
  };

  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [dataSource, setDataSource] = useState('json'); // 'json', 'csv', 'fallback'
  const [fetchProgress, setFetchProgress] = useState({
    currentStep: 0,
    totalSteps: 6,
    stepName: '',
    percentage: 0
  });

  // Step-by-step results state
  const [stepResults, setStepResults] = useState({
    mines: [],
    pits: [],
    zones: [],
    benches: [],
    rocks: [],
    analytics: {
      operational: [],
      specificCharge: [],
      flyrock: []
    }
  });

  const [showStepResults, setShowStepResults] = useState(false);
  const [currentStepData, setCurrentStepData] = useState(null);
  const [stepByStepMode, setStepByStepMode] = useState(false);

  const updateFetchProgress = (step, totalSteps, stepName) => {
    const percentage = Math.round((step / totalSteps) * 100);
    setFetchProgress({
      currentStep: step,
      totalSteps,
      stepName,
      percentage
    });
  };

  const clearStepResults = () => {
    setStepResults({
      mines: [],
      pits: [],
      zones: [],
      benches: [],
      rocks: [],
      analytics: {
        operational: [],
        specificCharge: [],
        flyrock: []
      }
    });
    setCurrentStepData(null);
  };

  useEffect(() => {
    const checkStatus = async () => {
      const isConnected = await checkAPIStatus();
      setApiStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkStatus();
    // Check API status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`h-64 flex items-center justify-center px-2 sm:px-4 ${lightMode ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950'}`}>
        <div className="text-center relative w-full max-w-xs sm:max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-2 sm:border-3 border-transparent mx-auto mb-2 sm:mb-3 md:mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full"></div>
              <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full"></div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className={`text-sm sm:text-base md:text-lg font-black ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                {fetchProgress.stepName || 'Initializing Mining Analytics'}
              </p>
              <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {fetchProgress.stepName 
                  ? `Step ${fetchProgress.currentStep} of ${fetchProgress.totalSteps} - ${fetchProgress.percentage}%`
                  : 'Processing geological data streams...'
                }
              </p>
              
              {/* Progress Bar */}
              {fetchProgress.percentage > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${fetchProgress.percentage}%` }}
                  ></div>
                </div>
              )}
              
              {/* Step-by-step mode indicator */}
              {stepByStepMode && currentStepData && (
                <div className={`mt-2 p-2 rounded-lg border ${
                  currentStepData.loading 
                    ? lightMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-500/30'
                    : currentStepData.success 
                      ? lightMode ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-500/30'
                      : lightMode ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-500/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      currentStepData.loading 
                        ? 'bg-blue-500' 
                        : currentStepData.success 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                    }`}>
                      {currentStepData.loading ? (
                        <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        currentStepData.step
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-xs ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                        {currentStepData.title}
                      </p>
                      {currentStepData.count && (
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          {typeof currentStepData.count === 'object' 
                            ? `Found analysis data`
                            : `${currentStepData.count} records found`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-1 mt-1 sm:mt-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
              </div>
              
              {stepByStepMode && (
                <p className={`text-xs ${lightMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  Step-by-step mode: Each API result will be shown
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-96 transition-all duration-700 ${lightMode ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950'}`}>
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-gradient-to-r from-blue-500/8 to-purple-600/8 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 bg-gradient-to-r from-emerald-500/8 to-teal-600/8 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 lg:w-30 lg:h-30 bg-gradient-to-r from-purple-500/8 to-pink-600/8 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-10 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-26 lg:h-26 bg-gradient-to-r from-orange-500/6 to-red-500/6 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-6">
        {/* Enhanced Smart Filters Panel */}
        <div className={`relative overflow-hidden backdrop-blur-2xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl border transition-all duration-500 mb-2 sm:mb-3 md:mb-4 lg:mb-6 ${
          lightMode 
            ? 'bg-white/95 border-gray-200/80 shadow-gray-300/60' 
            : 'bg-white/8 border-white/15 shadow-black/50'
        }`}>
          {/* Enhanced Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/12 to-emerald-500/10 rounded-xl sm:rounded-2xl lg:rounded-3xl blur-lg sm:blur-xl opacity-50"></div>
          
          <div className="relative">
            {/* Header Section */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 pb-1 sm:pb-2 md:pb-3 lg:pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 md:mb-6 space-y-3 sm:space-y-0 sm:space-x-3 md:space-x-4 w-full sm:w-auto">
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

                  {/* CSV Import Button */}
                  <button
                    onClick={() => setCsvImportVisible(!csvImportVisible)}
                    className={`group relative p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 ${
                      csvPriority 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md sm:shadow-lg hover:shadow-green-500/25' 
                        : lightMode 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md sm:shadow-lg hover:shadow-blue-500/25' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md sm:shadow-lg hover:shadow-blue-500/25'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-1 sm:space-x-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      <span className="text-xs sm:text-sm font-semibold hidden lg:block">
                        {csvPriority ? 'CSV Active' : 'Import CSV'}
                      </span>
                    </div>
                  </button>

                  {/* CSV Clear Button - Only show when CSV is active */}
                  {csvPriority && (
                    <button
                      onClick={clearCSVData}
                      className={`group relative p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md sm:shadow-lg hover:shadow-red-500/25`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative flex items-center space-x-1 sm:space-x-2">
                        <X className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        <span className="text-xs sm:text-sm font-semibold hidden lg:block">
                          Clear CSV
                        </span>
                      </div>
                    </button>
                  )}

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
    ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
    : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm disabled:bg-white/5'
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
                    
                    <button
                      onClick={() => {
                        if (stepByStepMode) {
                          fetchAPIStepByStep();
                        } else {
                          if (userDetails.userid && userDetails.companyid && userDetails.usertype) {
                            fetchAllAPIData();
                          } else {
                            fetchLocalData();
                          }
                        }
                      }}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-blue-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <RefreshCw className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">
                        {stepByStepMode ? 'Fetch Step-by-Step' : 'Refresh Data'}
                      </span>
                    </button>

                    <button
                      onClick={() => setStepByStepMode(!stepByStepMode)}
                      className={`group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 text-white rounded-lg md:rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md w-full sm:w-auto ${
                        stepByStepMode 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-emerald-500/25' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/25'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Activity className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">
                        {stepByStepMode ? 'Normal Mode' : 'Step-by-Step Mode'}
                      </span>
                    </button>

                    <button
                      onClick={exportData}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg md:rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-green-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Download className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">Export Data</span>
                    </button>

                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg md:rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-purple-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Settings className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">
                        {showAdvanced ? 'Hide' : 'Show'} API Config
                      </span>
                    </button>

                    <button
                      onClick={() => setShowStepResults(!showStepResults)}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg md:rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-cyan-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Eye className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">
                        {showStepResults ? 'Hide Results' : 'Show Results'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setApiCache(new Map());
                        console.log('🗑️ API cache cleared');
                      }}
                      className="group relative overflow-hidden flex items-center justify-center sm:justify-start space-x-2 px-3 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg md:rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-orange-500/25 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <Trash2 className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 relative z-10" />
                      <span className="font-semibold relative z-10 text-xs md:text-xs lg:text-sm">Clear Cache</span>
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
                        <div className={`w-2 h-2 md:w-2 md:h-2 rounded-full animate-pulse shadow-lg ${
                          dataSource === 'json' ? 'bg-blue-500 shadow-blue-500/50' :
                          dataSource === 'csv' ? 'bg-purple-500 shadow-purple-500/50' :
                          dataSource === 'fallback' ? 'bg-yellow-500 shadow-yellow-500/50' :
                          'bg-gray-500 shadow-gray-500/50'
                        }`}></div>
                        <span className="text-xs md:text-xs lg:text-sm font-bold">
                          {dataSource === 'json' ? 'CleanRecords_api.json' :
                           dataSource === 'csv' ? `CSV Data ${csvPriority ? '(Priority)' : ''}` :
                           dataSource === 'fallback' ? 'Fallback Data' :
                           'Loading...'}
                        </span>
                      </div>
                      
                      <div className="hidden sm:block h-4 md:h-4 w-px bg-current opacity-30"></div>
                      
                      <div className="flex items-center space-x-1.5 md:space-x-1.5">
                        <Activity className="h-3 w-3 md:h-3 md:w-3" />
                        <span className="text-xs md:text-xs lg:text-sm font-medium">
                          {((filteredData.length / rawData.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      {dataSource === 'json' && (
                        <>
                          <div className="hidden sm:block h-4 md:h-4 w-px bg-current opacity-30"></div>
                          <div className="flex items-center space-x-1.5 md:space-x-1.5">
                            <Database className="h-3 w-3 md:h-3 md:w-3" />
                            <span className="text-xs md:text-xs lg:text-sm font-medium">
                              {apiCache.size} cached
                            </span>
                          </div>
                          
                          <div className="hidden sm:block h-4 md:h-4 w-px bg-current opacity-30"></div>
                          <div className="flex items-center space-x-1.5 md:space-x-1.5">
                            <Settings className="h-3 w-3 md:h-3 md:w-3" />
                            <span className="text-xs md:text-xs lg:text-sm font-medium">
                              {stepByStepMode ? 'Step Mode' : 'Batch Mode'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* CSV Import Modal */}
                {csvImportVisible && (
                  <div className={`mt-4 md:mt-3 p-3 md:p-3 lg:p-4 rounded-xl md:rounded-lg border-2 border-dashed transition-all duration-500 hover:border-solid ${
                    lightMode 
                      ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400' 
                      : 'border-blue-600/50 bg-blue-900/20 hover:bg-blue-900/30 hover:border-blue-400'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-3 mb-3 md:mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg md:rounded-lg blur opacity-75"></div>
                          <div className="relative p-2 md:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg md:rounded-lg">
                            <FileText className="h-4 w-4 md:h-4 md:w-4 text-white" />
                          </div>
                        </div>
                        <div className="w-full sm:w-auto">
                          <h3 className={`font-black text-base md:text-base lg:text-lg ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                            CSV Data Import
                          </h3>
                          <p className={`text-xs md:text-xs lg:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'} mt-0.5`}>
                            Upload your CSV file for high-priority data analysis (overrides API/local data)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCsvImportVisible(false)}
                        className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${
                          lightMode 
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
                            : 'bg-white/10 hover:bg-white/20 text-gray-400'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCSVImport(e.target.files[0])}
                        className={`w-full p-3 md:p-3 lg:p-4 border-2 rounded-lg md:rounded-lg transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 font-medium cursor-pointer text-xs md:text-xs lg:text-sm ${
                          lightMode 
                            ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500 hover:bg-blue-50/50' 
                            : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm hover:bg-white/20'
                        }`}
                      />
                      
                      <div className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'} bg-gradient-to-r ${lightMode ? 'from-blue-50 to-purple-50' : 'from-blue-900/20 to-purple-900/20'} p-3 rounded-lg space-y-2`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-semibold">CSV Format Requirements:</span>
                        </div>
                        <ul className="ml-4 space-y-1 text-xs">
                          <li>• Required headers: minename, pitname, zonename, benchname, rock_name</li>
                          <li>• UTF-8 encoded, comma-separated values</li>
                          <li>• First row must contain column headers</li>
                          <li>• CSV data will override API and local data sources</li>
                          <li>• Maximum file size: 10MB</li>
                        </ul>
                        
                        <div className="mt-3 pt-2 border-t border-current opacity-20">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold">Sample CSV Format:</span>
                          </div>
                          <div className={`text-xs font-mono p-2 rounded ${lightMode ? 'bg-gray-100' : 'bg-gray-800'} mt-1`}>
                            <div>minename,pitname,zonename,benchname,rock_name</div>
                            <div>Mine A,Pit 1,Zone 1,Bench 1,Granite</div>
                            <div>Mine A,Pit 1,Zone 2,Bench 2,Limestone</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Step-by-Step Results Panel */}
                {showStepResults && (
                  <div className={`mt-4 md:mt-3 p-3 md:p-3 lg:p-4 rounded-xl md:rounded-lg border-2 transition-all duration-500 ${
                    lightMode 
                      ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50/70' 
                      : 'border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-900/30'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-3 mb-4 md:mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg md:rounded-lg blur opacity-75"></div>
                        <div className="relative p-2 md:p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg md:rounded-lg">
                          <Activity className="h-4 w-4 md:h-4 md:w-4 text-white" />
                        </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        <h3 className={`font-black text-base md:text-base lg:text-lg ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                          Step-by-Step Results
                        </h3>
                        <p className={`text-xs md:text-xs lg:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'} mt-0.5`}>
                          {stepByStepMode ? 'Real-time API fetching results' : 'Click "Step-by-Step Mode" to enable live results'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Current Step Display */}
                    {currentStepData && (
                      <div className={`mb-4 p-3 rounded-lg border ${
                        currentStepData.loading 
                          ? lightMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-500/30'
                          : currentStepData.success 
                            ? lightMode ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-500/30'
                            : lightMode ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            currentStepData.loading 
                              ? 'bg-blue-500' 
                              : currentStepData.success 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                          }`}>
                            {currentStepData.loading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              currentStepData.step
                            )}
                          </div>
                          <div>
                            <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                              {currentStepData.title}
                            </h4>
                            {currentStepData.count && (
                              <p className={`text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                {typeof currentStepData.count === 'object' 
                                  ? `Operational: ${currentStepData.count.operational}, Specific Charge: ${currentStepData.count.specificCharge}, Flyrock: ${currentStepData.count.flyrock}`
                                  : `${currentStepData.count} records found`
                                }
                              </p>
                            )}
                            {currentStepData.error && (
                              <p className="text-sm text-red-600">
                                Error: {currentStepData.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Results Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3 lg:gap-4">
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Mountain className="h-4 w-4 text-blue-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Mines</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                          {stepResults.mines.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Active mine sites
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Pits</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-green-600' : 'text-green-400'}`}>
                          {stepResults.pits.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Mining pits
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Layers className="h-4 w-4 text-purple-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Zones</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-purple-600' : 'text-purple-400'}`}>
                          {stepResults.zones.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Mining zones
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Benches</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-orange-600' : 'text-orange-400'}`}>
                          {stepResults.benches.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Mining benches
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Gem className="h-4 w-4 text-pink-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Rocks</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-pink-600' : 'text-pink-400'}`}>
                          {stepResults.rocks.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Rock types
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${lightMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-cyan-500" />
                          <h4 className={`font-bold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Analytics</h4>
                        </div>
                        <p className={`text-2xl font-black ${lightMode ? 'text-cyan-600' : 'text-cyan-400'}`}>
                          {stepResults.analytics.operational.length + stepResults.analytics.specificCharge.length + stepResults.analytics.flyrock.length}
                        </p>
                        <p className={`text-xs ${lightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Analysis records
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Configuration Section */}
                {showAdvanced && (
                  <div className={`mt-4 md:mt-3 p-3 md:p-3 lg:p-4 rounded-xl md:rounded-lg border-2 transition-all duration-500 ${
                    lightMode 
                      ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50/70' 
                      : 'border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/30'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:rounded-lg blur opacity-75"></div>
                        <div className="relative p-2 md:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:rounded-lg">
                          <Settings className="h-4 w-4 md:h-4 md:w-4 text-white" />
                        </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        <h3 className={`font-black text-base md:text-base lg:text-lg ${lightMode ? 'text-gray-800' : 'text-white'}`}>
                          API Configuration
                        </h3>
                        <p className={`text-xs md:text-xs lg:text-sm ${lightMode ? 'text-gray-600' : 'text-gray-400'} mt-0.5`}>
                          Configure your API credentials for live data access
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3 lg:gap-4 mb-4">
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          User ID
                        </label>
                        <input
                          type="text"
                          value={userDetails.userid}
                          onChange={(e) => setUserDetails(prev => ({...prev, userid: e.target.value}))}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter your user ID"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Company ID
                        </label>
                        <input
                          type="text"
                          value={userDetails.companyid}
                          onChange={(e) => setUserDetails(prev => ({...prev, companyid: e.target.value}))}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter your company ID"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          User Type
                        </label>
                        <select
                          value={userDetails.usertype}
                          onChange={(e) => setUserDetails(prev => ({...prev, usertype: e.target.value}))}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                        >
                          <option value="">Select User Type</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3 lg:gap-4 mb-4">
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Criteria
                        </label>
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) => setCriteria(e.target.value)}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter criteria"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Month
                        </label>
                        <input
                          type="text"
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter month"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Year
                        </label>
                        <input
                          type="text"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter year"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3 lg:gap-4">
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Extended Query
                        </label>
                        <input
                          type="text"
                          value={extendqry}
                          onChange={(e) => setExtendqry(e.target.value)}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter extended query"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs md:text-xs lg:text-sm font-bold mb-1.5 ${lightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                          Date Range Filter
                        </label>
                        <input
                          type="text"
                          value={datewiseexqry}
                          onChange={(e) => setDatewiseexqry(e.target.value)}
                          className={`w-full p-2 md:p-2 lg:p-3 border-2 rounded-lg md:rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs md:text-xs lg:text-sm ${
                            lightMode 
                              ? 'bg-white border-gray-300 text-gray-800 focus:border-blue-500' 
                              : 'bg-white/10 border-white/20 text-white focus:border-blue-400 backdrop-blur-sm'
                          }`}
                          placeholder="Enter date range filter"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       
  <KPI1
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>
    <KPI2
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

  

  <KPI3 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}
  />

  <KPI4 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI5
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI6
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI7 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI8 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI9 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>

    <KPI10 
    filteredData={filteredData} 
    DarkMode={lightMode} 
    apiData={apiData}
    dataSource={dataSource}
    userDetails={userDetails}
    apiMethods={{
      getMine,
      getRock,
      getPit,
      getZone,
      getBench,
      operationalcostofblast,
      specificcharge,
      flyrock
    }}/>
    </div>
    </div>
  );
};

export default DataFilter;