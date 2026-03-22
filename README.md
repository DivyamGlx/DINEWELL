# Module A — Lightweight DBMS with B+ Tree Index

> **CS 432 – Databases | Assignment 2 | Track 1**
> IIT Gandhinagar | Semester II (2025–2026)
> Instructor: Dr. Yogesh K. Meena

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [File Structure](#2-file-structure)
3. [Requirements](#3-requirements)
4. [Installation](#4-installation)
5. [How to Run](#5-how-to-run)
6. [Module Description](#6-module-description)
7. [B+ Tree Operations](#7-b-tree-operations)
8. [Performance Benchmarks](#8-performance-benchmarks)
9. [Visualisations](#9-visualisations)
10. [Output Files](#10-output-files)
11. [Video Demonstration](#11-video-demonstration)

---

## 1. Project Overview

This module implements a **lightweight Database Management System (DBMS)**
built on top of a **B+ Tree indexing engine** written entirely from scratch
in Python.

The B+ Tree is the standard indexing structure used in every major
relational database system — including MySQL (InnoDB), PostgreSQL,
and SQLite — because it provides O(log n) search, insertion, and
deletion, plus highly efficient range queries via a leaf node linked list.

### What This Module Does

| Component | Description |
|---|---|
| **B+ Tree** | Full implementation with insert, delete, search, update, range query |
| **BruteForceDB** | Flat list baseline — O(n) for all operations |
| **Table** | Database table abstraction built on the B+ Tree |
| **DatabaseManager** | Manages multiple named tables |
| **PerformanceAnalyzer** | Benchmarks both structures across 6 metrics |
| **Visualiser** | Graphviz diagrams of tree structure at every stage |

### Key Results

- B+ Tree is **10x–50x faster** than BruteForce for search at large N
- B+ Tree range queries are **dramatically faster** — different growth curve entirely
- B+ Tree uses **2x–4x more memory** — the expected space-time tradeoff
- Crossover point where B+ Tree beats BruteForce: **~5,000–10,000 keys**

---

## 2. File Structure

```
Module_A/
│
├── database/                    # Core DBMS package
│   ├── __init__.py              # Exposes all public classes
│   ├── bplustree.py             # BPlusTreeNode + BPlusTree (SubTask 1)
│   ├── bruteforce.py            # BruteForceDB baseline
│   ├── table.py                 # Table abstraction on B+ Tree
│   ├── db_manager.py            # DatabaseManager
│   └── analyzer.py              # PerformanceAnalyzer (SubTask 2)
│
├── graphs/                      # Benchmark output (auto-created)
│   ├── subtask4_insertion.png
│   ├── subtask4_search.png
│   ├── subtask4_deletion.png
│   ├── subtask4_range_query.png
│   ├── subtask4_random.png
│   ├── subtask4_memory.png
│   ├── subtask4_full_dashboard.png
│   └── benchmark_summary.csv
│
├── visualizations/              # Graphviz tree diagrams (auto-created)
│   ├── 01_empty_tree.png
│   ├── 02_three_keys.png
│   ├── 03_first_split.png
│   ├── 04_multiple_splits.png
│   ├── 05_root_split.png
│   ├── 06_simple_delete.png
│   ├── 07_borrow.png
│   ├── 08_merge.png
│   └── 09_large_tree.png
│
├── report.ipynb                 # Full report + all outputs
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

---

## 3. Requirements

### Python Version
```
Python 3.8 or higher
```

### Python Libraries
```
graphviz >= 0.20.1
matplotlib >= 3.5.0
pandas >= 1.4.0
jupyter >= 1.0.0
notebook >= 6.4.0
ipython >= 7.0.0
```

### System Dependency (Critical)
```
Graphviz system binary — required for tree visualisation
```

> ⚠️ The Python `graphviz` library alone is NOT enough.
> The system binary must also be installed and on your PATH.

---

## 4. Installation

### Step 1 — Clone / Download the Repository

```bash
cd CS432_Track1_Submission/Module_A
```

### Step 2 — Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 3 — Install Graphviz System Binary

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install graphviz
```

**macOS:**
```bash
brew install graphviz
```

**Windows:**
```
1. Download installer from https://graphviz.org/download/
2. Run the installer
3. CHECK the box "Add Graphviz to the system PATH for all users"
4. Restart your computer after installation
```

### Step 4 — Verify Installation

```bash
# Verify system binary
dot -V

# Verify Python library
python -c "import graphviz; print('graphviz OK')"
```

Expected output:
```
dot - graphviz version 12.x.x (...)
graphviz OK
```

---

## 5. How to Run

### Option A — Run the Full Report (Recommended)

```bash
cd CS432_Track1_Submission/Module_A
jupyter notebook
```

1. Open `report.ipynb`
2. Go to **Kernel → Restart & Clear Output**
3. Run all cells top to bottom with **Shift+Enter**
4. Wait for benchmark cells (~3–8 minutes)

### Option B — Quick Sanity Test in Terminal

```bash
cd CS432_Track1_Submission/Module_A
python test.py
```

Expected output:
```
==================================================
TESTING B+ TREE
==================================================
Inserted: [10, 20, 5, 15, 30, 25, 35, 40, 45, 50]
Get all : [(5, 'record_5'), (10, 'record_10'), ...]
Search 25: record_25
Search 99: None
Range [15,35]: [(15, ...), (20, ...), (25, ...), (30, ...), (35, ...)]
After update 25: UPDATED_25
After delete 20: [(5, ...), (10, ...), (15, ...), ...]

==================================================
TESTING DATABASE MANAGER
==================================================
Select 1: {'student_id': 1, 'name': 'Alice', 'gpa': 9.1}
Range 1-2: [{'student_id': 1, ...}, {'student_id': 2, ...}]
After update: {'student_id': 2, 'name': 'Bob', 'gpa': 9.0}
After delete: [{'student_id': 2, ...}, {'student_id': 3, ...}]
All tests passed!
```

### Option C — Quick Benchmark Test

```bash
python -c "
import sys
sys.path.insert(0, '.')
from database import PerformanceAnalyzer
a = PerformanceAnalyzer(order=4, seed=42)
a.run_all(sizes=list(range(100, 5000, 500)))
print(a.summary_table())
"
```

---

## 6. Module Description

### `bplustree.py` — Core Engine

Contains two classes:

**`BPlusTreeNode`**
```
Attributes:
  keys     → sorted list of keys in this node
  children → child pointers (internal nodes only)
  values   → stored records (leaf nodes only)
  next     → pointer to next leaf (leaf nodes only)
  is_leaf  → True if this is a leaf node
```

**`BPlusTree`**
```
Parameters:
  order (int) → minimum degree t
                max keys = 2t-1
                min keys = t-1
                default  = 4

Methods:
  insert(key, value)            → O(log n)
  search(key)                   → O(log n)
  delete(key)                   → O(log n)
  update(key, new_value)        → O(log n)
  range_query(start, end)       → O(log n + k)
  get_all()                     → O(n)
  visualize_tree(filename, save)→ Graphviz diagram
```

---

### `bruteforce.py` — Baseline

```
BruteForceDB uses a flat Python list.
All operations except insert are O(n).

insert(key)           → O(1)   list.append()
search(key)           → O(n)   linear scan
delete(key)           → O(n)   scan + shift
range_query(lo, hi)   → O(n)   full list scan
```

---

### `table.py` — Table Abstraction

```
Table wraps BPlusTree into a database table.
Records are stored as Python dictionaries.
One field is designated as the primary key.

Methods:
  insert(record)           → insert dict by primary key
  select(key)              → fetch single record
  select_all()             → all records in key order
  select_range(start, end) → records in key range
  update(key, updates)     → merge updates into record
  delete(key)              → remove record
  count()                  → total records
  find_where(field, value) → linear scan filter
  visualize()              → tree diagram
```

---

### `db_manager.py` — Database Manager

```
DatabaseManager manages multiple Table instances.

Methods:
  create_table(name, primary_key, order)
  drop_table(name)
  get_table(name)
  list_tables()
  insert / select / update / delete (shorthand)
  show_stats()
```

---

### `analyzer.py` — Performance Analyzer

```
PerformanceAnalyzer benchmarks both structures.

Parameters:
  order (int) → B+ Tree order. Default 4.
  seed  (int) → Random seed. Default 42.

Methods:
  benchmark_insertion(sizes)
  benchmark_search(sizes, sample_size=100)
  benchmark_deletion(sizes, sample_size=100)
  benchmark_range_query(sizes)
  benchmark_random(sizes, n_ops=500)
  benchmark_memory(sizes)
  run_all(sizes)          → runs all 6 + saves graphs
  plot_all()              → generates all graphs
  summary_table()         → pandas DataFrame
```

---

## 7. B+ Tree Operations

### Insertion

```
1. If root is full → split root, create new root
2. Walk down to correct leaf following separator keys
3. Insert key-value in sorted order at leaf
4. If leaf overflows (> 2t-1 keys) → split:
   - Leaf split  : copy middle key to parent (stays in leaf)
   - Internal split : promote middle key to parent (leaves child)
5. Propagate splits upward if necessary
```

### Deletion

```
1. Navigate to leaf containing the key
2. Remove key-value pair
3. If underflow (< t-1 keys):
   a. Borrow from left sibling  (if it has extra keys)
   b. Borrow from right sibling (if it has extra keys)
   c. Merge with sibling        (if neither has extras)
4. Update parent separator keys after restructuring
5. If root is empty after merge → shrink tree height
```

### Range Query

```
1. Navigate to leaf where start_key belongs → O(log n)
2. Walk leaf linked list forward:
   - Collect key-value pairs where key >= start_key
   - Stop when key > end_key
3. Return all collected pairs → O(k) additional time
Total complexity: O(log n + k)
```

---

## 8. Performance Benchmarks

### Benchmark Configuration

| Parameter | Value |
|---|---|
| Dataset sizes | range(100, 100,000, 1,000) |
| Total data points | 99 per metric |
| B+ Tree order | 4 |
| Random seed | 42 |
| Timer | time.perf_counter() |
| Memory tool | tracemalloc |
| Search sample | 100 keys per size |
| Delete sample | 100 keys per size |
| Random ops | 500 per size |

### Complexity Comparison

| Operation | B+ Tree | BruteForce | Winner at Large N |
|---|---|---|---|
| Insertion | O(log n) | O(1) | Comparable |
| Search | O(log n) | O(n) | **B+ Tree** |
| Deletion | O(log n) | O(n) | **B+ Tree** |
| Range Query | O(log n + k) | O(n) | **B+ Tree by far** |
| Memory | Higher | Lower | BruteForce |

### Key Findings

- **Search:** B+ Tree is 10x–50x faster at 99,000 keys
- **Range Query:** Most dramatic gap — different growth curve
- **Memory:** B+ Tree uses 2x–4x more RAM (expected tradeoff)
- **Crossover point:** ~5,000–10,000 keys

---

## 9. Visualisations

Tree diagrams are generated using Graphviz and saved to `visualizations/`.

### Reading the Diagrams

| Element | Meaning |
|---|---|
| 🟡 Yellow node (orange border) | Internal node — separator keys only |
| 🔵 Blue node (steel border) | Leaf node — actual records stored here |
| Solid black arrow | Parent → child (tree structure) |
| Dashed blue arrow | Leaf → next leaf (linked list) |

### Stages Captured

| File | Stage | What it Shows |
|---|---|---|
| 01_empty_tree.png | Empty | Initial state |
| 02_three_keys.png | 3 keys | Single leaf, no splits |
| 03_first_split.png | 5 keys | First split — root created |
| 04_multiple_splits.png | 9 keys | Multiple splits |
| 05_root_split.png | 14 keys | Root split — new level |
| 06_simple_delete.png | 13 keys | Simple deletion |
| 07_borrow.png | 11 keys | Deletion with borrowing |
| 08_merge.png | 9 keys | Deletion with merging |
| 09_large_tree.png | 30 keys | Full hierarchy + leaf chain |

---

## 10. Output Files

### After Running report.ipynb

```
graphs/
├── subtask4_insertion.png        ← Insertion benchmark
├── subtask4_search.png           ← Search benchmark + speedup ratio
├── subtask4_deletion.png         ← Deletion benchmark + difference plot
├── subtask4_range_query.png      ← Range query (normal + log scale)
├── subtask4_random.png           ← Mixed ops (total + per operation)
├── subtask4_memory.png           ← Memory (absolute + overhead ratio)
├── subtask4_full_dashboard.png   ← All 6 metrics in one image
└── benchmark_summary.csv         ← Summary table as spreadsheet

visualizations/
├── 01_empty_tree.png
├── 02_three_keys.png
├── 03_first_split.png
├── 04_multiple_splits.png
├── 05_root_split.png
├── 06_simple_delete.png
├── 07_borrow.png
├── 08_merge.png
└── 09_large_tree.png
```

---

## 11. Video Demonstration

A 3–5 minute video demonstration covering:
- File structure and code walkthrough
- Live demo of all core operations
- Graphviz visualisations with explanation
- Performance benchmark graphs with analysis

**Video Link:** `[Add your link here]`

---

## Troubleshooting

### `ExecutableNotFound: failed to execute dot`
```
Graphviz system binary not on PATH.
Windows: Download from https://graphviz.org/download/
         Check "Add to PATH" during installation
         Restart computer after installing
Linux:   sudo apt-get install graphviz
Mac:     brew install graphviz
```

### `TypeError: visualize_tree() got unexpected keyword argument`
```
Old version of bplustree.py still cached in memory.
In Jupyter: Kernel → Restart & Clear Output
Then re-run all cells from the top.
```

### `CalledProcessError: flat edge between adjacent nodes`
```
Using record shape with same-rank edges on Windows.
Fix: Use HTML-like labels in _add_nodes() instead of shape='record'.
The correct version of bplustree.py already uses HTML labels.
Make sure you saved the file and restarted the kernel.
```

### `ModuleNotFoundError: No module named 'database'`
```
Python path not set correctly.
Add this at the top of your notebook:
  import sys
  sys.path.insert(0, os.path.abspath('.'))
Make sure you launched Jupyter from inside Module_A/ folder.
```


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
