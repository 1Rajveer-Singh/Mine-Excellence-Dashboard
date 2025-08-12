Of course. Here is a deep, text-based explanation of the `BlastCostDashboard` React component, detailing its architecture, data processing with formulas, and key features.

---

### Deep Explanation of the `BlastCostDashboard` React Component

This document provides an in-depth analysis of the `BlastCostDashboard` component, a sophisticated tool for visualizing and analyzing mining blast data.

#### 1. Core Purpose and Functionality

The `BlastCostDashboard` is a comprehensive analytics interface designed to display the relationship between two key performance indicators in mining: **Cost per Ton** and **Powder Factor**. It renders this data on an interactive, dual-axis line chart, allowing for deep-dive analysis over various timeframes.

**Key Features:**
*   **Dual-Axis Line Chart:** Uses the `recharts` library to plot `Cost per Ton` and `Powder Factor` on two independent Y-axes, enabling clear trend comparison.
*   **Advanced Time Filtering:** Users can switch between "Daily," "Monthly," and "Yearly" views, with context-aware controls for filtering by date range, specific month, or year range.
*   **Dynamic Data Source:** Users can toggle the chart's Powder Factor line between "Actual" and "Theoretical" values.
*   **Statistical Summaries:** Displays key statistics (min, max, average) for the filtered data in clear, concise cards.
*   **Robust Export Engine:** A powerful and reliable export feature allows users to download the chart and data in multiple formats (PNG, JPEG, PDF, SVG, CSV), including metadata and titles.
*   **Modern UI:** Built with Tailwind CSS for a responsive, clean, and modern user interface that supports both light and dark modes.

#### 2. Component Architecture and Props

The component is a functional React component built with Hooks (`useState`, `useMemo`, `useCallback`, `useRef`) for state management, performance optimization, and DOM interaction.

**Props:**
*   `filteredData` (Array): The primary data source for the component. It is an array of objects, where each object represents a single blast event. The component expects the following **real field names**:
    *   `blastdate` (String): The date of the blast ("DD-MM-YYYY").
    *   `total_exp_cost` (Number): The total cost of explosives for the blast.
    *   `avg_col_weight` (Number): The average weight of material blasted (in tons).
    *   `actual_pf_ton_kg` (Number): The actual Powder Factor (kg/ton).
    *   `theoretical_pf_ton_kg` (Number): The theoretical Powder Factor (kg/ton).
*   `DarkMode` (Boolean): A flag to control the theme. The component's internal logic is `const isDarkMode = !DarkMode`.

#### 3. Data Processing and Formulas (`useMemo` Hook)

The component's core data transformation logic is encapsulated within a `useMemo` hook for `processedData`. This is a critical optimization that ensures data is only re-calculated when a dependency (like `timeMode` or the date filters) changes.

**Step 1: Data Validation**
The first step filters the raw `filteredData` to include only valid records. A record is considered valid if the following expression is true:
```
(record.total_exp_cost > 0) AND (record.avg_col_weight > 0) AND (record.blastdate IS NOT NULL) AND (powder_factor_field > 0)
```
Where `powder_factor_field` is either `record.actual_pf_ton_kg` or `record.theoretical_pf_ton_kg` depending on the user's selection.

**Step 2: Time-Based Filtering**
The validated records are then filtered based on the selected `timeMode` and its corresponding date controls.

**Step 3: Data Calculation and Aggregation**
The final data set is created based on the `timeMode`.

*   **If `timeMode` is 'Daily' or 'Monthly'**:
    The data is **not aggregated**. Instead, two new fields are calculated for each individual record.
    *   **Formula for Cost per Ton:**
        ```
        cost_per_ton = record.total_exp_cost / record.avg_col_weight
        ```
    *   **Formula for Powder Factor:**
        ```
        powder_factor = (powderFactorType === 'actual') ? record.actual_pf_ton_kg : record.theoretical_pf_ton_kg
        ```

*   **If `timeMode` is 'Yearly'**:
    The data **is aggregated**. All records for a given year are grouped together to produce a single data point for that year.
    *   **Formula for Average Cost per Ton (for a year):**
        ```
        cost_per_ton = (Σ record.total_exp_cost) / (Σ record.avg_col_weight)
        ```
        *(This is a weighted average, which is more accurate than averaging the daily `cost_per_ton` values.)*
    *   **Formula for Average Powder Factor (for a year):**
        ```
        powder_factor = (Σ record.powder_factor) / N
        ```
        *(Where `N` is the number of records in that year's group.)*

#### 4. Statistics Calculation (`useMemo`)

A separate `useMemo` hook calculates high-level statistics based on the `processedData`.

*   `minCost = MIN(processedData.map(item => item.cost_per_ton))`
*   `maxCost = MAX(processedData.map(item => item.cost_per_ton))`
*   `avgCost = AVG(processedData.map(item => item.cost_per_ton))`
*   `avgPowderFactor = AVG(processedData.map(item => item.powder_factor))`

#### 5. Export Functionality (`useCallback` and `useRef`)

The export functionality is a major feature of this component, using `useCallback` for memoization and `useRef` to get a direct reference to the chart's DOM element for high-quality captures.

*   **PNG/JPEG/PDF Export:** Uses the `html2canvas` library to capture a high-resolution image of the chart. For PDF, it then uses `jspdf` to place this image into a landscape A4 document, adding titles, the date range, and key statistics as text. This creates a comprehensive, report-ready document.
*   **SVG Export:** This method is more direct. It grabs the chart's raw SVG element from the DOM, clones it, adds metadata and a background, and creates a downloadable `Blob`. This results in a scalable, high-quality vector image.
*   **CSV Export:** Manually constructs a CSV string from the `chartData`. It includes commented-out header lines for metadata (like the view mode and generation date) followed by the data headers and rows.

#### 6. Rendering and UI (JSX)

*   **Header:** Contains the dashboard title and the export dropdown menu. The export button is disabled during the export process to prevent multiple clicks.
*   **Filter Panel:** A well-organized section with controls for `timeMode`, `powderFactorType`, and the dynamic date inputs that change based on the selected time mode.
*   **Statistics Cards:** Three cards that display the calculated statistics for Cost, Powder Factor, and a Data Summary (total records, date range).
*   **Main Chart:** The `recharts` `<LineChart>` is the centerpiece.
    *   **Dual Y-Axes:** It uses two `<YAxis>` components, each with a unique `yAxisId` (`"cost"` and `"powder"`). This is crucial for plotting two different data series with different scales.
    *   **Lines:** Two `<Line>` components are rendered, each tied to a specific Y-axis via its `yAxisId` prop and to its data via the `dataKey` prop (`"cost_per_ton"` or `"powder_factor"`).