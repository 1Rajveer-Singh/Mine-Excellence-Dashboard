Of course. Here is a deep, text-based explanation of the `VibrationDashboard` React component, detailing its architecture, data processing with formulas, and key features.

---

### Deep Explanation of the `VibrationDashboard` React Component

This document provides an in-depth analysis of the `VibrationDashboard` component, a sophisticated tool for visualizing and analyzing ground and air vibration data from mining blast operations.

#### 1. Core Purpose and Functionality

The `VibrationDashboard` is a specialized analytics interface designed to monitor two critical environmental impact metrics from blasting: **Peak Particle Velocity (PPV)**, which measures ground vibration, and **Air Blast** (or overpressure), which measures air vibration. It renders this data on an interactive, dual-axis line chart, allowing for trend analysis and correlation over various timeframes.

**Key Features:**
*   **Dual-Axis Line Chart:** Uses the `recharts` library to plot PPV and Air Blast on two independent Y-axes, enabling clear comparison of trends even if their scales are vastly different.
*   **Advanced Time Filtering:** Users can switch between "Daily," "Monthly," and "Yearly" views, with context-aware controls for filtering by date range, a specific month and year, or a range of years.
*   **Measurement Toggling:** Allows users to show or hide the lines for PPV and Air Blast independently to focus their analysis.
*   **Statistical Summaries:** Displays key statistics (average PPV, average Air Blast) in clear, concise summary cards.
*   **Robust Export Engine:** A powerful export feature allows users to download the chart visualization and its underlying data in multiple formats (PNG, JPEG, PDF, SVG, CSV).
*   **Modern and Responsive UI:** Built with Tailwind CSS for a clean, responsive interface that supports both light and dark modes and is optimized for desktop and mobile viewing.

#### 2. Component Architecture and Props

The component is a functional React component built with Hooks (`useState`, `useMemo`, `useRef`, `useEffect`) for state management, performance optimization, and direct DOM interaction.

**Props:**
*   `filteredData` (Array): The primary data source. It's an array of objects, where each object represents a single blast event. The component expects the following **real field names**:
    *   `blastdate` (String): The date of the blast in "DD-MM-YYYY" format.
    *   `total_exp_cost` (Number): The total cost of the blast.
    *   `ppv` (Number): The Peak Particle Velocity measurement (in mm/s).
    *   `air_blast` (Number): The Air Blast (overpressure) measurement (in dB).
*   `DarkMode` (Boolean): A flag to control the theme. The component's internal logic is `const isDarkMode = !DarkMode`.

#### 3. Data Processing and Formulas (`useMemo` Hook)

The component's core data transformation logic is encapsulated within a `useMemo` hook for `processedData`. This is a critical optimization that ensures data is only re-calculated when a dependency (like `timeMode` or the date filters) changes.

**Step 1: Data Validation**
The first step filters the raw `filteredData`. A record is considered valid if the following expression is true:
```
(record.total_exp_cost > 0) AND (isValidDate(record.blastdate)) AND (isValidValue(record.ppv) OR isValidValue(record.air_blast))
```
This ensures that every record has a cost, a valid date, and at least one of the two key vibration measurements.

**Step 2: Time-Based Filtering**
The validated records are then filtered based on the selected `timeMode` and its corresponding date controls. The date parsing correctly handles the "DD-MM-YYYY" format.

**Step 3: Data Calculation and Aggregation**
The final data set is created based on the `timeMode`, with specific formulas for each view.

*   **If `timeMode` is 'Daily'**:
    The data is **not aggregated**. Each individual blast record is represented as a data point on the chart.
    *   **Formula for PPV:** `ppv = record.ppv`
    *   **Formula for Air Blast:** `air_blast = record.air_blast`

*   **If `timeMode` is 'Monthly' or 'Yearly'**:
    The data **is aggregated**. All records for a given month or year are grouped together to produce a single data point representing the period's average for each measurement.
    *   **Formula for Average PPV (for the period):**
        ```
        Avg(PPV) = (Σ record.ppv) / N_ppv
        ```
        *(Where `N_ppv` is the count of records with a valid PPV value in that period.)*
    *   **Formula for Average Air Blast (for the period):**
        ```
        Avg(Air Blast) = (Σ record.air_blast) / N_air_blast
        ```
        *(Where `N_air_blast` is the count of records with a valid Air Blast value in that period.)*
    *   **Formula for Average Cost (for the period):**
        ```
        Avg(Cost) = (Σ record.total_exp_cost) / N
        ```
        *(Where `N` is the total number of records in that period's group.)*

#### 4. Summary Statistics (`summaryStats`)

A separate `useMemo` hook calculates high-level statistics based on the `processedData`.

*   `totalCost`: The sum of the `cost` field for all records in the current view.
*   `avgPPV`: The average of all valid `ppv` values in the current view.
    *   **Formula:** `(Σ record.ppv) / N_ppv`
*   `avgAirBlast`: The average of all valid `air_blast` values in the current view.
    *   **Formula:** `(Σ record.air_blast) / N_air_blast`
*   `totalBlasts`: The total count of records in the current view.

#### 5. Export Functionality (`handleExport`)

The export functionality is robust, using `useRef` to get a direct reference to the chart's DOM element for high-quality captures.

*   **PNG/JPEG/PDF Export:** Uses the `html2canvas` library to capture a high-resolution image of the chart container. For PDF, it then uses `jsPDF` to place this image into a landscape A4 document with a title.
*   **SVG Export:** Grabs the chart's raw SVG element from the DOM, clones it, and creates a downloadable `Blob` for a scalable, high-quality vector image.
*   **CSV Export:** Manually constructs a CSV string from the `chartData`, with headers corresponding to the measurements.

#### 6. Rendering and UI (JSX)

*   **Header:** Contains the dashboard title and the export dropdown menu.
*   **Controls Panel:** A well-organized section with controls for `timeMode`, dynamic date inputs, and buttons to toggle the visibility of the PPV and Air Blast lines on the chart.
*   **Main Chart:** The `recharts` `<LineChart>` is the centerpiece.
    *   **Dual Y-Axes:** It uses two `<YAxis>` components, each with a unique `yAxisId` (`"ppv"` and `"airBlast"`). This is essential for plotting two different data series with different scales on the same chart.
    *   **Lines:** Two `<Line>` components are rendered, each tied to a specific Y-axis via its `yAxisId` prop and to its data via the `dataKey` prop (`"ppv"` or `"air_blast"`). They are conditionally rendered based on the `activeMeasurements` state.
*   **Summary Cards:** Two cards that display the calculated average values for PPV and Air Blast.