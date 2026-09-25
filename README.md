# ≈ ExcelMatch Pro — Smart Excel Sheet Comparator

A powerful React-based web tool that lets you upload one, two, or more Excel sheets, select specific columns, and intelligently match similar cells across them — **even when there are small typos or spelling errors**.

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

## ✨ Features

### 📁 1. Multi-File Upload
- **Drag & drop** or click to browse and upload Excel files
- Supports **`.xlsx`**, **`.xls`**, and **`.csv`** formats
- Upload **one, two, or more** files at once
- Displays file metadata — size, number of sheets, total row count
- Remove individual files with a single click

### 📊 2. Smart Column Selection
- Automatically detects all columns (headers) from each uploaded file
- Switch between **multiple sheets** within a single workbook
- Select **any combination** of columns across different files to compare
- Color-coded file cards for easy visual identification
- Minimum of **2 columns** required to run a comparison

### 🔍 3. Fuzzy Matching Engine (Typo Detection)
- Uses **Levenshtein Distance** algorithm to calculate similarity between cell values
- Catches common typos and spelling errors:

  | Value A      | Value B      | Similarity | Result       |
  |-------------|-------------|------------|-------------|
  | `shubham`   | `shuham`    | ~86%       | ✅ Fuzzy Match |
  | `Rajesh`    | `Rajsh`     | ~83%       | ✅ Fuzzy Match |
  | `Microsoft` | `Microsft`  | ~89%       | ✅ Fuzzy Match |
  | `Apple`     | `Apple`     | 100%       | ✅ Exact Match |
  | `Apple`     | `Banana`    | ~17%       | ❌ No Match    |

- **Configurable similarity threshold** via an interactive slider (30% – 100%)
- Live preview shows exactly what the current threshold will and won't catch

### 📋 4. Rich Results View
- **Stats dashboard** — see exact, fuzzy, and unmatched counts at a glance
- **Filter tabs** — quickly toggle between All / Exact / Fuzzy / No Match results
- **Search bar** — find specific values within the results
- **Character-level diff highlighting** — differences between matched values are highlighted in yellow so you can see exactly what's different
- **Visual similarity bars** — color-coded percentage bars (green/yellow/red) for each match
- **Row references** — shows exact row numbers from the source files
- **Source tracking** — displays which file → sheet → column each value comes from

### 📥 5. Export Results
- **Export to Excel** — download the full match results as a `.xlsx` file
- Exported file includes: base value, matched value, similarity %, match type, source info, and row numbers
- Auto-sized columns for readability

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
    ├── App.jsx                   # Main app — orchestrates the 3-step workflow
    ├── index.css                 # Complete design system (dark theme, animations)
    ├── components/
    │   ├── Stepper.jsx           # Visual step progress indicator (1→2→3)
    │   ├── FileUploader.jsx      # Drag & drop zone + uploaded file list
    │   ├── ColumnSelector.jsx    # Per-file sheet switcher & column picker
    │   ├── MatchSettings.jsx     # Similarity threshold slider with live preview
    │   └── ResultsView.jsx       # Results table, filters, search, diff view, export
    └── utils/
        ├── excelParser.js        # Excel/CSV parsing (read) & export (write)
        └── fuzzyMatch.js         # Levenshtein distance & similarity matching engine
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

---

## 🎨 Design & UI

- **Dark theme** with gradient mesh background
- **Glassmorphism** cards with backdrop blur
- **Inter** font family from Google Fonts
- Smooth **micro-animations** — fade-in, slide-in, floating icons, pulsing indicators
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

### Step 1 — Upload Your Files
1. Drag and drop your Excel files onto the upload zone, or click to browse
2. You can upload **any number** of files
3. Each uploaded file shows its name, size, sheet count, and row count

### Step 2 — Select Columns
1. For each uploaded file, you'll see its available columns listed as clickable chips
2. If a file has multiple sheets, use the dropdown to switch between them
3. Click on the columns you want to compare (they get a checkmark when selected)
4. **You need at least 2 columns selected** to run the comparison

### Step 3 — Configure & Run
1. Adjust the **similarity threshold** slider:
   - **75%** (default) — good balance for catching typos
   - **85%+** — stricter, only near-identical values
   - **50-70%** — looser, catches more but may include false positives
2. Click **🔍 Run Fuzzy Match**
3. View results in the interactive table

### Step 4 — Analyze & Export
1. Use **filter tabs** to focus on exact, fuzzy, or unmatched results
2. Use the **search bar** to find specific values
3. Look at the **diff highlighting** to see exactly which characters differ
4. Click **📥 Export to Excel** to download results

---

## 📝 License

This project is open source and available for personal and commercial use.
# exel-match
