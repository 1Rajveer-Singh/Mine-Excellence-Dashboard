Of course, Rajveersinghcse1. Here is a deep, text-based explanation of the `BlastAnalyticsDashboard` React component, detailing its architecture, data processing with explicit formulas, and key features.

---

### Deep Explanation of the `BlastAnalyticsDashboard` Component

This document provides an in-depth analysis of the `BlastAnalyticsDashboard` component, a sophisticated tool for visualizing and analyzing key blast performance metrics using a composite chart.

#### 1. Core Purpose and Functionality

The `BlastAnalyticsDashboard` is a comprehensive analytics interface designed to simultaneously visualize two distinct but related blast metrics: **Explosive Consumption** (kg/m³) and **Powder Factor** (Actual or Theoretical). It uses a `ComposedChart` from the `recharts` library to render Explosive Consumption as bars and the selected Powder Factor as a line, enabling a direct comparison of blast design and efficiency.

**Key Features:**
*   **Composed Chart:** Uniquely combines a Bar chart and a Line chart in one visualization to show the relationship between different types of data.
*   **Dual Y-Axes:** Plots Explosive Consumption and Powder Factor on two independent Y-axes, allowing for clear trend comparison even with different units and scales.
*   **Dynamic Powder Factor Analysis:** Users can toggle the line chart between "Actual PF" and "Theoretical PF" to compare planned versus actual outcomes.
*   **Trendline Calculation:** Automatically calculates and displays a linear regression trendline for the selected Powder Factor, helping to visualize the overall performance trajectory.
*   **Advanced Time Filtering:** Users can switch between "Daily," "Monthly," and "Yearly" views, with context-aware controls for filtering the data.
*   **Statistical Summaries:** Displays key statistics (total explosive used, average consumption, average powder factor, and record count) in clear, concise summary cards.
*   **Robust Export Engine:** A powerful export feature allows users to download the chart and its underlying data in multiple formats (PNG, JPEG, PDF, SVG, CSV), with detailed metadata included in the CSV file.

#### 2. Component Architecture and Props

The component is a functional React component built with Hooks (`useState`, `useMemo`, `useRef`).

**Props:**
*   `filteredData` (Array): The primary data source. It's an array of objects, where each object represents a single blast event. The component expects the following **real field names** for its calculations:
    *   `blastdate` (String): The date of the blast in "DD-MM-YYYY" format.
    *   `total_explosive_kg` (Number): The total mass of explosives used.
    *   `total_drill_mtr` (Number): The total meterage drilled for the blast.
    *   `actual_pf_ton_kg` (Number): The actual powder factor.
    *   `theoretical_pf_ton_kg` (Number): The theoretical powder factor.
    *   `ton_recover` (Number): The tonnage of material recovered.
*   `DarkMode` (Boolean): A flag to control the theme.

#### 3. Data Processing and Formulas (`useMemo` Hook)

The component's core logic is encapsulated in `useMemo` hooks for performance.

**Step 1: Initial Data Processing (`processedData`)**
Every record in the raw data is first processed to calculate the core metrics.

*   **Formula for Explosive Consumption:**
    This is calculated for each individual record.
    ```
    explosive_consumption (kg/m³) = item.total_explosive_kg / item.total_drill_mtr
    ```
*   The `Actual_PF` and `Theoretical_PF` are taken directly from `item.actual_pf_ton_kg` and `item.theoretical_pf_ton_kg` respectively.

**Step 2: Time-Based Filtering and Aggregation (`chartData`)**
The `processedData` is then filtered and potentially aggregated based on the selected `timeMode`.

*   **If `timeMode` is 'Daily' or 'Monthly'**:
    The data is **not aggregated**. Individual records that fall within the selected date or month/year range are displayed.

*   **If `timeMode` is 'Yearly'**:
    The data **is aggregated**. All records for a given year are grouped together to produce a single data point representing the annual performance.
    *   **Formula for Yearly Explosive Consumption:**
        ```
        Yearly Explosive Consumption = (Σ total_explosive_kg) / (Σ total_drill_mtr)
        ```
        *(This is a weighted average, which is more accurate than averaging the daily values.)*
    *   **Formula for Yearly Average Actual PF:**
        ```
        Yearly Avg(Actual PF) = (Σ actual_pf_ton_kg) / N
        ```
    *   **Formula for Yearly Average Theoretical PF:**
        ```
        Yearly Avg(Theoretical PF) = (Σ theoretical_pf_ton_kg) / N
        ```
        *(Where `N` is the number of records in that year's group.)*

**Step 3: Trendline Calculation (`chartDataWithTrendline`)**
After the `chartData` is finalized, a linear regression is performed on the selected powder factor data (`pfOption`) to calculate a trendline. This involves:
1.  Assigning an index (`x`) to each data point.
2.  Using the selected powder factor value as `y`.
3.  Calculating the sums: `Σx`, `Σy`, `Σxy`, `Σx²`.
4.  Using these sums to solve for the slope (`m`) and y-intercept (`b`) of the line `y = mx + b`.
5.  A new `trendline` property is added to each data point with its calculated value on the trendline.

#### 4. Summary Statistics (`summaryStats`)

A separate `useMemo` hook calculates high-level statistics based on the final `chartData`.

*   `totalExplosive`: The sum of `total_explosive_kg` for all records in the current view.
*   `avgExplosiveConsumption`: The average of all `explosive_consumption` values in the current view.
*   `avgPF`: The average of the selected powder factor (`Actual_PF` or `Theoretical_PF`) for all records in the current view.
*   `recordCount`: The total number of records being displayed.

#### 5. Export Functionality (`exportChart`)

The component provides a comprehensive export feature.

*   **Image/Vector Formats (PNG, JPEG, SVG, PDF):** Uses a combination of `html2canvas` and direct SVG manipulation to create high-quality, visually accurate representations of the chart. The PDF export is specifically formatted for landscape A4 to ensure the chart is readable.
*   **Data Format (CSV):** Manually constructs a detailed CSV file. It includes a metadata header with the report context (generation date, filters used) followed by the raw and calculated data for each point, including the trendline value.

#### 6. Rendering and UI (JSX)

*   **Header & Controls:** Provides a responsive UI for changing `timeMode`, date ranges, and the active `pfOption`.
*   **Main Chart (`ComposedChart`):**
    *   The `<Bar>` component is tied to the `left` Y-axis and displays `explosive_consumption`.
    *   The `<Line>` components are tied to the `right` Y-axis and display the selected powder factor (`pfOption`) and its `trendline`.
    *   The use of dual Y-axes (`yAxisId="left"` and `yAxisId="right"`) is critical for displaying two different data types with different scales coherently.
*   **Summary Cards:** Four cards display the key calculated statistics.