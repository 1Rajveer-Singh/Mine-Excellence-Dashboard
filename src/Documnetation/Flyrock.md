Of course. Here is a deep, text-based explanation of the `flyRock` React component, detailing its architecture, data processing with formulas, and key features.

---

### Deep Explanation of the `flyRock` React Component

This document provides an in-depth analysis of the `flyRock` component, a specialized dashboard for visualizing and analyzing fly rock data from mining blast operations.

#### 1. Core Purpose and Functionality

The `flyRock` component is an analytics dashboard designed to monitor **Fly Rock** measurements alongside the associated **Total Cost** of a blast. It renders this data on an interactive line chart, allowing users to identify trends and correlations over various time scales.

**Key Features:**
*   **Interactive Line Chart:** Uses the `recharts` library to display fly rock trends.
*   **Multiple Time Views:** Users can switch between "Daily," "Monthly," and "Yearly" views, which changes how the data is filtered and aggregated.
*   **Dynamic Filtering:** Provides context-aware controls to filter the data by a specific date range, a selected month and year, or a range of years.
*   **Measurement Toggling:** Allows users to show or hide the Fly Rock line on the chart.
*   **Statistical Summaries:** Displays key statistics (total cost, average/total fly rock, total blasts) in summary cards.
*   **Robust Export Engine:** A powerful export feature allows users to download the chart and data in multiple formats (PNG, JPEG, PDF, SVG, CSV), complete with titles and metadata.
*   **Modern UI:** Built with Tailwind CSS for a responsive, clean, and modern user interface that supports both light and dark modes.

#### 2. Component Architecture and Props

The component is a functional React component built with Hooks (`useState`, `useMemo`, `useRef`, `useEffect`) for state management, performance optimization, and DOM interaction.

**Props:**
*   `filteredData` (Array): The primary data source for the component. It's an array of objects, where each object represents a single blast event. The component expects the following **real field names**:
    *   `blastdate` (String): The date of the blast ("DD-MM-YYYY").
    *   `total_exp_cost` (Number): The total cost of the blast.
    *   `flyrock` (Number): The fly rock measurement (likely in mm/s).
*   `DarkMode` (Boolean): A flag to control the theme. The component's internal logic is `const isDarkMode = !DarkMode`.

#### 3. Data Processing and Formulas (`useMemo` Hook)

The component's core data transformation logic is encapsulated within a `useMemo` hook for `processedData`. This is a critical optimization that ensures data is only re-calculated when a dependency (like `timeMode` or the date filters) changes.

**Step 1: Data Validation**
The first step filters the raw `filteredData` to include only valid records. A record is considered valid if the following expression is true:
```
(record.total_exp_cost > 0) AND (isValidDate(record.blastdate)) AND (record.flyrock IS NOT NULL AND record.flyrock !== 0 AND record.flyrock !== '')
```

**Step 2: Time-Based Filtering**
The validated records are then filtered based on the selected `timeMode` and its corresponding date controls.

**Step 3: Data Calculation and Aggregation**
The final data set is created based on the `timeMode`, with specific formulas for each view.

*   **If `timeMode` is 'Daily'**:
    The data is **not aggregated**. Each individual blast record is represented as a data point on the chart.
    *   **Formula for Cost:**
        ```
        cost = record.total_exp_cost
        ```
    *   **Formula for Fly Rock:**
        ```
        flyrock = record.flyrock
        ```

*   **If `timeMode` is 'Monthly'**:
    The data **is aggregated by month**. All records for a given month are grouped together to produce a single data point representing the monthly average.
    *   **Formula for Average Cost (for a month):**
        ```
        Avg(Cost) = (Σ record.total_exp_cost) / N
        ```
    *   **Formula for Average Fly Rock (for a month):**
        ```
        Avg(Fly Rock) = (Σ record.flyrock) / N_flyrock
        ```
        *(Where `N_flyrock` is the count of records with a valid fly rock value in that month.)*

*   **If `timeMode` is 'Yearly'**:
    The data **is aggregated by year**. All records for a given year are grouped together.
    *   **Formula for Average Cost (for a year):**
        ```
        Avg(Cost) = (Σ record.total_exp_cost) / N
        ```
    *   **Formula for Total Fly Rock (for a year):**
        ```
        Total(Fly Rock) = Σ record.flyrock
        ```
        *(Note: The component calculates the **sum** of fly rock for the year, not the average, which is a key distinction from the other modes.)*

#### 4. Summary Statistics (`summaryStats`)

A separate `useMemo` hook calculates high-level statistics based on the `processedData`.

*   `totalCost`: The sum of the `cost` field for all records in the current view.
*   `avgflyRock`: This calculation depends on the `timeMode`.
    *   **Formula (Daily/Monthly):** `(Σ record.flyrock) / N_flyrock` (Average)
    *   **Formula (Yearly):** `Σ record.flyrock` (Total)
*   `totalBlasts`: The total count of records in the current view.

#### 5. Export Functionality (`handleExport`)

The export functionality is robust, using `useRef` to get a direct reference to the chart's DOM element for high-quality captures.

*   **PNG/JPEG/PDF Export:** Uses the `html2canvas` library to capture a high-resolution image of the chart container. For PDF, it then uses `jspdf` to place this image into a landscape A4 document, adding titles and metadata.
*   **SVG Export:** Grabs the chart's raw SVG element from the DOM, clones it, adds metadata and a background, and creates a downloadable `Blob` for a scalable, high-quality vector image.
*   **CSV Export:** Manually constructs a CSV string from the `chartData`, including commented-out header lines for metadata (like view mode and summary stats) followed by the data headers and rows.

#### 6. Rendering and UI (JSX)

*   **Header:** Contains the dashboard title and the export dropdown menu.
*   **Controls Panel:** A well-organized section with controls for `timeMode`, date inputs, and a button to toggle the visibility of the Fly Rock line on the chart.
*   **Main Chart:** The `recharts` `<LineChart>` is the centerpiece.
    *   The `<Line>` component for Fly Rock is conditionally rendered based on the `activeMeasurements.flyrock` state.
    *   A custom tooltip provides a clear breakdown of values on hover.
*   **Summary Cards:** Three cards that display the calculated statistics for Fly Rock, Total Blasts, and Total Cost.