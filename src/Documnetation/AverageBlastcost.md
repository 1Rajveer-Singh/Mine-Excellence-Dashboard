Of course. Here is a deep explanation of the `BlastCostAnalytics` component, with the data processing logic detailed using expression-style formulas.

---

### Deep Explanation of `BlastCostAnalytics` (with Expression Formulas)

This document provides an in-depth analysis of the `BlastCostAnalytics` React component, detailing its purpose, architecture, and data handling, with a focus on expressing the core calculations as clear formulas.

#### 1. Core Purpose

The `BlastCostAnalytics` component is an interactive data visualization dashboard for analyzing blasting costs in mining operations. It presents data through a stacked bar chart, allowing users to filter by time, toggle cost categories, and export the results.

#### 2. Component Architecture and Props

It is a functional React component built with Hooks (`useState`, `useMemo`, `useRef`).

**Props:**
*   `filteredData` (Array): The primary data source. Each object in the array represents a blast event and must contain the following **real field names**:
    *   `blastdate` (String): The date of the blast ("DD-MM-YYYY").
    *   `drilling_cost` (Number): Cost of drilling.
    *   `man_power_cost` (Number): Cost of labor.
    *   `blast_accessoriesdelay_cost` (Number): Cost of accessories and delays.
    *   `total_exp_cost` (Number): Cost of explosives.
*   `DarkMode` (Boolean): Controls the light/dark theme.

#### 3. Data Processing and Formulas (`useMemo` Hook)

The component's core logic is memoized with `useMemo` to ensure calculations only run when filters or data change.

**Step 1: Data Validation**
A record is considered valid and included for processing if the following expression is true:
```
(record.total_exp_cost && record.total_exp_cost !== 0 && record.blastdate)
```

**Step 2: Conditional Aggregation by `timeMode`**

*   **If `timeMode` is 'Yearly'**:
    The data is grouped by year. For each year's group containing `N` records, the average for each cost is calculated.

    **Formulas:**
    *   `Avg(drilling_cost) = ROUND( (Σ record.drilling_cost) / N )`
    *   `Avg(man_power_cost) = ROUND( (Σ record.man_power_cost) / N )`
    *   `Avg(blast_accessoriesdelay_cost) = ROUND( (Σ record.blast_accessoriesdelay_cost) / N )`
    *   `Avg(total_exp_cost) = ROUND( (Σ record.total_exp_cost) / N )`

    *(Where `Σ` represents the sum of the field for all `N` records in that year's group.)*

*   **If `timeMode` is 'Monthly' or 'Daily'**:
    The data is filtered by the selected time period but is **not aggregated**. Each record corresponds to a single bar on the chart.

    **Formulas:**
    *   `ChartValue(drilling_cost) = record.drilling_cost`
    *   `ChartValue(man_power_cost) = record.man_power_cost`
    *   *(...and so on for other cost fields.)*

**Step 3: Summary Calculations for Display Cards (`totals`)**
These calculations are performed on the final `processedData` set that is sent to the chart.

**Formulas for Total Sums:**
*   `Total(drilling) = Σ record.drilling_cost`
*   `Total(manpower) = Σ record.man_power_cost`
*   `Total(accessories) = Σ record.blast_accessoriesdelay_cost`
*   `Total(explosive) = Σ record.total_exp_cost`
*   `GrandTotal = Total(drilling) + Total(manpower) + Total(accessories) + Total(explosive)`

*(Where `Σ` represents the sum over all records in `processedData`.)*

**Formula for Percentage of Total (for each category):**
*   `% Share(category) = ( Total(category) / GrandTotal ) * 100`

#### 4. Rendering and UI (JSX)

*   **Header & Controls:** Provide the UI for changing `timeMode`, date ranges, and toggling `activeStacks` (cost categories), which in turn drives the data processing.
*   **Chart Section:**
    *   The `<BarChart>` component receives the `processedData` array.
    *   Each `<Bar>` element is mapped to a real field name via the `dataKey` prop (e.g., `<Bar dataKey="drilling_cost" ... />`).
    *   The `stackId="costs"` prop ensures the bars are stacked.
    *   Conditional rendering (`{activeStacks.drilling && ...}`) shows or hides bars based on user selection.
*   **Summary Cards:** Display the results from the `totals` calculation, formatted as currency.

#### 5. Export Functionality (`handleExport`)

The export function uses the final `processedData` to generate files:
*   **PNG/JPEG/SVG/PDF:** The chart visualization is rendered to a canvas or SVG, capturing the visual state driven by the processed data and formulas.
*   **CSV:** A text file is constructed where columns map directly to the real field names and calculated totals. The expression for each cell in the "Total" column is:
    ```
    RowTotal = row.drilling_cost + row.man_power_cost + row.blast_accessoriesdelay_cost + row.total_exp_cost
    ```