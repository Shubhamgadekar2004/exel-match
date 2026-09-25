# ≈ ExcelMatch Pro — Excel Power Tools Suite

A powerful React-based web application with **3 Excel tools** in one: **Sheet Matcher**, **Multiple File Merger**, and **VLOOKUP** — all with intelligent fuzzy matching that catches typos and spelling errors.

> For example: `"shubham"` and `"shuham"` will be detected as a **fuzzy match (~86% similarity)** instead of being treated as completely different values.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and **npm** installed on your system

### Installation

```bash
# Clone or navigate to the project directory
cd "exel difference finder"

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173/**

### Production Build

```bash
npm run build
```

The optimized output will be in the `dist/` folder, ready to deploy.

---

## 🧰 Tools Overview

The app features a sleek landing page with **3 tool cards** — click any card to open the tool.

---

### 🔍 Tool 1: Excel Sheet Matcher

**Fuzzy Match & Compare columns across multiple Excel files.**

#### How It Works
1. **Upload** one or more Excel files (.xlsx, .xls, .csv)
2. **Select columns** from any file/sheet to compare
3. **Configure** the fuzzy matching threshold (30% – 100%)
4. **Run** the match and view results with diff highlighting

#### Features
- **Levenshtein distance** fuzzy matching algorithm
- Catches common typos and spelling errors:

  | Value A      | Value B      | Similarity | Result       |
  |-------------|-------------|------------|-------------|
  | `shubham`   | `shuham`    | ~86%       | ✅ Fuzzy Match |
  | `Rajesh`    | `Rajsh`     | ~83%       | ✅ Fuzzy Match |
  | `Microsoft` | `Microsft`  | ~89%       | ✅ Fuzzy Match |
  | `Apple`     | `Apple`     | 100%       | ✅ Exact Match |
  | `Apple`     | `Banana`    | ~17%       | ❌ No Match    |

- **Configurable threshold slider** with live preview
- **Character-level diff highlighting** — see exactly which characters differ
- **Filter tabs** — All / Exact / Fuzzy / No Match
- **Search** within results
- **Export results** to Excel

---

### 🔗 Tool 2: Multiple Excel Merger

**Combine two or more Excel files into a single output file.**

#### Merge Modes

| Mode | Description |
|------|------------|
| **📄 Append Rows** | Combines all rows from all files into one sheet. Columns with matching headers are aligned automatically. Adds source file/sheet columns for traceability. |
| **📑 Separate Sheets** | Each source file becomes its own sheet in the output workbook. Preserves the original data structure completely. |
| **🔗 Merge by Key** | Joins files side-by-side using a common key column (like a database JOIN). Rows with matching keys are combined into one row. |

#### Features
- Upload **unlimited** files to merge
- Select which **sheet** to use from multi-sheet workbooks
- **Smart column alignment** across files with different structures
- **Download** the merged result as a single `.xlsx` file
- Result stats showing file count, sheet count, and row count

---

### 🔎 Tool 3: Excel VLOOKUP

**Perform VLOOKUP-style operations across Excel files — just like Excel's VLOOKUP function but with fuzzy matching.**

#### How It Works
1. **Upload** your source file (with lookup values) and target file (with data to pull)
2. **Configure** the lookup:
   - Select the **Lookup Column** from the source file
   - Select the **Key Column** in the target file (to match against)
   - Select which **Return Columns** to pull from the target
3. **Enable/disable fuzzy matching** and set the threshold
4. **Run** and view the enriched results

#### Features
- **Cross-file VLOOKUP** — lookup values from one file, pull data from another
- **Fuzzy key matching** — catches typos in key values (optional, toggleable)
- **Pull multiple return columns** at once
- **Similarity scores** and match type indicators for every row
- **Filter and search** results
- **Export** the enriched lookup table to Excel

---

## 🏗 Project Architecture

```
exel difference finder/
├── index.html                    # Entry HTML with SEO meta tags & Google Fonts
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite configuration
├── public/
│   └── favicon.svg               # Custom favicon (≈ symbol)
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # App router — tool selector + back navigation
    ├── index.css                 # Complete design system (dark theme, 1500+ lines)
    ├── components/
    │   ├── ToolSelector.jsx      # Landing page with 3 tool cards
    │   ├── MatcherTool.jsx       # 🔍 Sheet Matcher (full workflow)
    │   ├── MergerTool.jsx        # 🔗 File Merger (3 merge modes)
    │   ├── VlookupTool.jsx       # 🔎 VLOOKUP tool (cross-file lookup)
    │   ├── Stepper.jsx           # Step progress indicator (1→2→3)
    │   ├── FileUploader.jsx      # Drag & drop + file list (shared)
    │   ├── ColumnSelector.jsx    # Per-file column picker (shared)
    │   ├── MatchSettings.jsx     # Threshold slider (shared)
    │   └── ResultsView.jsx       # Match results table (shared)
    └── utils/
        ├── excelParser.js        # Excel/CSV parsing & export
        └── fuzzyMatch.js         # Levenshtein distance matching engine
```

---

## 🧠 How Fuzzy Matching Works

The app uses the **Levenshtein Distance** algorithm — it calculates the minimum number of single-character edits (insertions, deletions, or substitutions) needed to transform one string into another.

**Similarity formula:**

```
similarity = 1 - (levenshtein_distance / max_length_of_both_strings)
```

**Example:**
- `"shubham"` → `"shuham"`: distance = 1 (one missing `b`), max length = 7
- Similarity = 1 - (1/7) = **0.857 (≈86%)**

If the similarity meets or exceeds your configured threshold, the pair is flagged as a **fuzzy match**.

This is used in all 3 tools:
- **Matcher** — compares all selected columns fuzzy
- **Merger** — "Merge by Key" mode can use exact key matching
- **VLOOKUP** — optional fuzzy matching on key columns (toggleable)

---

## 🎨 Design & UI

- **Dark theme** with gradient mesh background
- **Glassmorphism** cards with backdrop blur
- **Inter** font family from Google Fonts
- Smooth **micro-animations** — fade-in, slide-in, floating icons, pulsing indicators
- **Tool cards** with gradient glow effects on hover
- **Merge mode** radio cards with active state
- **VLOOKUP** split-panel layout with arrow divider
- Custom styled **scrollbars**
- Fully **responsive** — works on desktop, tablet, and mobile
- **Accessibility** — semantic HTML, proper heading hierarchy, unique element IDs

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI components & state management |
| **Vite** | Build tool & dev server (HMR) |
| **SheetJS (xlsx)** | Excel/CSV file parsing and export |
| **Vanilla CSS** | Custom design system, no CSS frameworks |
| **Levenshtein Distance** | Custom implementation for fuzzy string matching |

---

## 📖 Usage Guide

### Using the Sheet Matcher
1. Click the **"Excel Sheet Matcher"** card on the home page
2. Upload your Excel files using drag & drop or browse
3. Select at least **2 columns** to compare
4. Adjust the similarity threshold (default 75%)
5. Click **"Run Fuzzy Match"**
6. Filter, search, and export your results

### Using the Excel Merger
1. Click the **"Multiple Excel Merger"** card
2. Upload **2+ files** to merge
3. Choose a merge mode:
   - **Append Rows** — stack all data into one sheet
   - **Separate Sheets** — each file becomes a sheet
   - **Merge by Key** — join files by a common column
4. Click **"Merge Files"**
5. Download the merged output

### Using the VLOOKUP
1. Click the **"Excel VLOOKUP"** card
2. Upload your **source file** (has the values to look up) and **target file** (has the data to pull)
3. Select the **Lookup Column** from the source
4. Select the **Key Column** from the target
5. Select which **Return Columns** to pull
6. Toggle fuzzy matching on/off and set threshold
7. Click **"Run VLOOKUP"**
8. View and export your enriched results

---

## 📝 License

This project is open source and available for personal and commercial use.
