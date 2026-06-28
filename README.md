# ⬡ OVERMIND — Global Robot Command Network

> *"One Mind. Many Machines."*

A high-density, real-time Enterprise RPA Command Terminal built for Frontend Battle 3.0 — Round 2. OVERMIND streams, visualizes, sorts, and filters continuous telemetry data from 50,000 robotic field units with zero frame drops and zero memory leaks.

The aesthetic is inspired by resistance command terminals — a bunker interface where every robot is a deployed field unit, every anomaly is a mission threat, and the operator is always in control.

**Operator:** Monisha B Krishna
**Live:** [https://monisha-b-krishna.github.io/frontend-battle-3-r2/](https://monisha-b-krishna.github.io/frontend-battle-3-r2/)
**Repo:** [https://github.com/Monisha-B-Krishna/frontend-battle-3-r2](https://github.com/Monisha-B-Krishna/frontend-battle-3-r2)

---

## What It Does

OVERMIND connects to a real-time telemetry pipeline firing every 200ms, ingests batches of RPA project data, and renders everything live — sorting, filtering, searching, and aggregating without ever blocking the UI thread or dropping a single row.

---

## Features

### Live KPI Dashboard
Three metric counters at the top of the screen update continuously from the stream:
- **Total Rows Processed** — running count of all telemetry rows received since page load
- **Active Robots Deployed** — running sum of deployed robot units across all received rows
- **Global Cumulative Savings** — running sum of annual savings in USD, auto-compacted to `$4.2B` format

Each counter has a live pulse indicator and animates on every tick.

### Financial & Numeric Value Sanitation
Every number on screen is cleaned before display. Currency fields show with dollar signs. Raw unformatted data never reaches the screen even at 200ms update rates.

### Visual Anomaly Alerts
When the stream injects a row with `project_status = Failed` or a negative `roi_percent`, that row's background flashes red for 900ms then clears automatically — powered by a CSS animation that expires on its own with no JS timers per row. Negative ROI values are permanently shown in red; positive values in cyan.

### Telemetry Sort Engine
Click any sortable column header to sort the entire dataset instantly:
- **BUDGET USD** — ascending or descending
- **ROI %** — ascending or descending
- **HRS SAVED** — ascending or descending

Hold **Shift** and click a second column to add a sub-sort. The active sort stack is shown in the toolbar as removable tags. Sort order is maintained as new rows stream in every 200ms.

### Pipeline Freeze & Buffer Control
The **FREEZE FEED** button in the top-right pauses the display completely while the background state engine continues capturing every incoming batch into a queue. The buffer count updates live so you always know how much data is waiting. Clicking **RESUME FEED** flushes the entire queue instantly — no rows dropped, no gaps, no duplicates.

### Operator Workspace Persistence
The sidebar contains three panel toggles — **Metrics Strip**, **Search Bar**, and **Data Grid** — each controlling visibility of a major UI zone. All toggle states are saved to `localStorage` and restored exactly on hard refresh.

### Categorical Filters
Three dropdowns in the sidebar filter the grid by:
- **Automation Type** — e.g. Contract Analysis, Fraud Detection, Payroll Automation
- **Department** — e.g. Sales & Marketing, IT & Technology
- **Industry** — e.g. Banking & Financial Services, Healthcare & Pharmaceuticals

Filters stack and apply instantly. **Clear All Filters** resets everything.

### High-Frequency Virtualized Grid
The data grid handles 50,000 rows without ever rendering more than the rows visible in the viewport. A custom row-recycling engine allocates a fixed pool of `<tr>` nodes, swaps their `textContent` on scroll, and uses spacer divs to maintain correct scroll height. Column headers sync horizontally with the data scroll. The result is fluid 60 FPS performance regardless of dataset size.

### Multi-Field Fuzzy Search
The search bar matches partial, out-of-order keywords simultaneously across `project_name`, `company_id`, `implementation_partner`, and `country`. Typing `tata india` finds rows containing both words anywhere across those fields. Search is debounced at 150ms so it never blocks the UI during streaming. Press **Escape** to clear.

---

## Snapshot Export

The **⬇ EXPORT CSV** button exports exactly what is currently visible in the grid — respecting all active filters, the current search query, and the active sort order. The downloaded filename encodes the active state for traceability. Built entirely client-side using the browser's `Blob` API with `setTimeout(0)` to keep the stream running during export. Keyboard shortcut: **Ctrl + Shift + E**.

---

## Analytics View

Clicking **◈ ANALYTICS VIEW** opens a full-screen dashboard with four live charts built from the current data view using pure HTML5 Canvas — no chart libraries:

- **Field Status Distribution** — doughnut showing Active / Completed / Failed / Planned breakdown with counts and percentages
- **Top Industries by Savings USD** — horizontal bar chart of the top 7 industries by cumulative savings
- **Automation Types by Robots Deployed** — horizontal bar chart of the top 7 automation types
- **Average ROI % by Field Status** — vertical bar chart colour-coded by performance tier

Charts auto-refresh every 2 seconds. Closing the view cleanly releases all canvas memory.

---

## UI Reference

### Top Bar

| Element | Description |
|---------|-------------|
| ⬡ Neural network logo | OVERMIND brand mark |
| **OVERMIND** | Brand name |
| SIG ▌▌▌▌▌ LIVE | Signal strength — pulses green when live, amber when frozen |
| Ticks Recv | Count of 200ms stream ticks since load |
| Tick Rate / Rows/Tick / Field Units | Live stream telemetry |
| BUFFERED: N | Queued row count — visible only when frozen |
| ◈ ANALYTICS VIEW | Opens the analytics overlay |
| ☀ / 🌙 | Dark/Light mode toggle |
| FREEZE FEED / RESUME FEED | Pipeline buffer control |
| Clock | Live time display |

### Sidebar

| Element | Description |
|---------|-------------|
| CONTROL PANEL + ✕ | Sidebar header — ✕ collapses sidebar, ☰ tab reopens it |
| Metrics Strip toggle | Show/hide KPI strip |
| Search Bar toggle | Show/hide toolbar |
| Data Grid toggle | Show/hide data grid |
| Automation Type | Filter dropdown |
| Department | Filter dropdown |
| Industry | Filter dropdown |
| Clear All Filters | Reset all dropdowns |

### Toolbar

| Element | Description |
|---------|-------------|
| `>_ Search...` | Fuzzy search across project / company / partner / country |
| UNITS: N | Live count of rows in current view |
| ↕ BUDGET · ROI% · HRS | Sort hint — click headers to sort, Shift+click to multi-sort |
| ⬇ EXPORT CSV | Download current view as CSV |

### Grid Columns

| Column | Description |
|--------|-------------|
| # | Row position in current view |
| PROJ-ID | Project identifier |
| UNIT-ID | Company identifier |
| MISSION NAME | Project name |
| FIELD STATUS | Active (teal) / Completed (green) / Failed (red) / Planned (purple) |
| OP TYPE | Automation type |
| UNITS | Robots deployed |
| BUDGET USD | Sortable — click header |
| ROI % | Sortable — green positive, red negative |
| SAVINGS USD | Annual savings in USD |
| HRS SAVED | Sortable — employee hours saved |
| DIVISION | Department |
| REGION | Country |
| SECTOR | Industry |
| A.I. | AI enabled yes/no |

---

## Design System

**Theme:** Colony / Resistance Terminal — a bunker command interface where data density is the design goal and every pixel earns its place.

**Fonts:** Share Tech Mono (UI labels) + JetBrains Mono (numeric data) — chosen for terminal authenticity and precise number column alignment.

**Colour roles:**

| Colour | Role |
|--------|------|
| Phosphor Green `#39FF14` | Brand, live data, primary actions |
| Electric Cyan `#00E5FF` | Robot counts, intel data |
| Gold `#FFD700` | All financial / savings values |
| Teal `#2DD4BF` | Active / deployed status |
| Purple `#C084FC` | Planned / staged status |
| Amber `#F59E0B` | Warning states only |
| Alert Red `#FF4444` | Failed / anomaly states only |

Each UI zone has a distinct background shade — topbar darkest, grid lightest — creating natural visual hierarchy without borders or shadows.

Light mode inverts the palette to a mint-green terminal aesthetic while preserving all colour role semantics.

---

## Architecture

### State Engine
All data flows through a single state module:
```
Stream → ingestBatch() → _pool (Map<uid, row>) → _rebuildView()
                                                        ↓
                                          filter → search → sort → viewPool
```
Every feature reads from `viewPool` — filters, search, and sort always compose correctly.

### Virtualization
The grid allocates a fixed pool of `<tr>` nodes matching the visible viewport height. On scroll, node `textContent` is swapped in place. `ResizeObserver` reallocates the pool when the viewport changes. Two spacer `<div>` elements maintain the full scroll height for 50,000 rows.

### Buffer System
During freeze, incoming batches are pushed into `_buffer[]`. On resume, `flushBuffer()` processes the entire queue synchronously through the state engine — maintaining exact ordering with no dropped rows.

### Performance
- All DOM writes batched in `requestAnimationFrame`
- No `innerHTML` in the render hot path
- Scanline overlay is pure CSS `repeating-linear-gradient` — zero JavaScript
- CSS animations use only `background-color`, `opacity`, `transform`
- Chart canvases destroyed on close — no retained heap
- Search debounced at 150ms

---

## File Structure

```
frontend-battle-3-r2/
├── index.html                  ← App shell + boot sequence
├── dataStream.js               ← Official hackathon telemetry pipeline (unmodified)
├── automation_projects.csv     ← 50,000 row RPA dataset
├── README.md
│
├── css/
│   ├── tokens.css              ← Design tokens + dark/light mode variables
│   ├── layout.css              ← App grid, zones, topbar, sidebar
│   ├── components.css          ← KPI cards, badges, buttons, search
│   ├── grid.css                ← Virtualized table styles
│   └── animations.css          ← Boot sequence, scanline, pulse animations
│
└── js/
    ├── format.js               ← Number and currency formatting
    ├── state.js                ← Master state engine
    ├── stream.js               ← Stream connector and buffer control
    ├── kpi.js                  ← KPI counter updates
    ├── grid.js                 ← Virtualized DOM grid engine
    ├── sort.js                 ← Single and multi-column sort
    ├── filters.js              ← Dropdown filter wiring
    ├── search.js               ← Fuzzy search with debounce
    ├── layout.js               ← Panel visibility persistence
    ├── controls.js             ← Freeze/Resume UI and clock
    ├── export.js               ← Snapshot CSV export
    ├── theme.js                ← Dark/Light mode and sidebar collapse
    └── analytics.js            ← Analytics View canvas charts
```

---

*Frontend Battle 3.0 — Round 2 — June 28, 2026*
*OVERMIND Command Network // Operator: Monisha-B-Krishna*
