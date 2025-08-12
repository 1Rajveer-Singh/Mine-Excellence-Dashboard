import React from 'react';

import Globalfilter from './Dashboard/Surface Blasting/Globalfilter';
import { CSVProvider } from './context/CSVContext';
import DataLoader from './Dashboard/Surface Blasting/DataLoader';
import KPI2 from './Dashboard/Surface Blasting/Ground_and_Air_Vibration';
// ... import other KPI components

const SurfaceBlasting = () => {
  return (
    <CSVProvider>
      <div className="p-4 space-y-6">
        <DataLoader/>
        <Globalfilter />

        {/* KPI Components (They access context via useCSV) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <KPI2 />
          {/* ... Other KPI Components */}
        </div>
      </div>
    </CSVProvider>
  );
};

export default SurfaceBlasting;
