# ============================================================
# Performance Analyzer
# CS 432 - Assignment 2, Module A
# Benchmarks B+ Tree vs BruteForceDB across 6 metrics
# ============================================================

import time
import tracemalloc
import random
import os

import matplotlib.pyplot as plt

from .bplustree import BPlusTree
from .bruteforce import BruteForceDB


class PerformanceAnalyzer:
    """
    Benchmarks B+ Tree vs BruteForceDB across 6 metrics:
    insertion, search, deletion, range query,
    random mixed operations, and memory usage.

    Parameters
    ----------
    order : int  — B+ Tree order (minimum degree). Default 4.
    seed  : int  — Random seed for reproducibility. Default 42.
    """

    def __init__(self, order=4, seed=42):
        self.order   = order
        self.seed    = seed
        self.results = {}
        random.seed(seed)
        os.makedirs('graphs', exist_ok=True)

    # ============================================================
    # PRIVATE HELPERS
    # ============================================================

    def _fresh_bpt(self):
        """Return a fresh empty B+ Tree."""
        return BPlusTree(order=self.order)

    def _fresh_bf(self):
        """Return a fresh empty BruteForceDB."""
        return BruteForceDB()

    def _generate_keys(self, size):
        """
        Generate a list of `size` unique random integers.
        Uses the global seed set in __init__ so results
        are reproducible across runs.
        """
        return random.sample(range(1, 1_000_000), size)

    # ============================================================
    # 1. INSERTION BENCHMARK
    # ============================================================

    def benchmark_insertion(self, sizes):
        """
        For each size N, measure how long it takes to insert
        N keys into a fresh B+ Tree and a fresh BruteForceDB.

        Returns
        -------
        bpt_times, bf_times : list of floats (seconds)
        """
        print("[ 1 / 6 ]  Running insertion benchmark ...")

        bpt_times = []
        bf_times  = []

        for i, size in enumerate(sizes):
            keys = self._generate_keys(size)

            # ── B+ Tree ──────────────────────────────
            bpt   = self._fresh_bpt()
            start = time.perf_counter()
            for k in keys:
                bpt.insert(k, f"val_{k}")
            bpt_times.append(time.perf_counter() - start)

            # ── BruteForce ───────────────────────────
            bf    = self._fresh_bf()
            start = time.perf_counter()
            for k in keys:
                bf.insert(k)
            bf_times.append(time.perf_counter() - start)

            if (i + 1) % 25 == 0:
                print(f"         {i + 1} / {len(sizes)} sizes done ...")

        self.results['insertion'] = {
            'sizes': list(sizes),
            'bpt':   bpt_times,
            'bf':    bf_times
        }
        print("         Done.\n")
        return bpt_times, bf_times

    # ============================================================
    # 2. SEARCH BENCHMARK
    # ============================================================

    def benchmark_search(self, sizes, sample_size=100):
        """
        For each size N:
          1. Build both structures with N keys.
          2. Pick `sample_size` random keys from those N keys.
          3. Time how long it takes to search all sampled keys.

        Using a fixed sample keeps the comparison fair across
        all dataset sizes.
        """
        print("[ 2 / 6 ]  Running search benchmark ...")

        bpt_times = []
        bf_times  = []

        for i, size in enumerate(sizes):
            keys        = self._generate_keys(size)
            search_keys = random.sample(keys, min(sample_size, size))

            # Build both structures
            bpt = self._fresh_bpt()
            bf  = self._fresh_bf()
            for k in keys:
                bpt.insert(k, f"val_{k}")
                bf.insert(k)

            # ── B+ Tree search ───────────────────────
            start = time.perf_counter()
            for k in search_keys:
                bpt.search(k)
            bpt_times.append(time.perf_counter() - start)

            # ── BruteForce search ────────────────────
            start = time.perf_counter()
            for k in search_keys:
                bf.search(k)
            bf_times.append(time.perf_counter() - start)

            if (i + 1) % 25 == 0:
                print(f"         {i + 1} / {len(sizes)} sizes done ...")

        self.results['search'] = {
            'sizes': list(sizes),
            'bpt':   bpt_times,
            'bf':    bf_times
        }
        print("         Done.\n")
        return bpt_times, bf_times

    # ============================================================
    # 3. DELETION BENCHMARK
    # ============================================================

    def benchmark_deletion(self, sizes, sample_size=100):
        """
        For each size N:
          1. Build both structures with N keys.
          2. Pick `sample_size` keys to delete.
          3. Time the deletions.
        """
        print("[ 3 / 6 ]  Running deletion benchmark ...")

        bpt_times = []
        bf_times  = []

        for i, size in enumerate(sizes):
            keys         = self._generate_keys(size)
            delete_keys  = random.sample(keys, min(sample_size, size))

            # Build both structures
            bpt = self._fresh_bpt()
            bf  = self._fresh_bf()
            for k in keys:
                bpt.insert(k, f"val_{k}")
                bf.insert(k)

            # ── B+ Tree deletion ─────────────────────
            start = time.perf_counter()
            for k in delete_keys:
                bpt.delete(k)
            bpt_times.append(time.perf_counter() - start)

            # ── BruteForce deletion ──────────────────
            start = time.perf_counter()
            for k in delete_keys:
                bf.delete(k)
            bf_times.append(time.perf_counter() - start)

            if (i + 1) % 25 == 0:
                print(f"         {i + 1} / {len(sizes)} sizes done ...")

        self.results['deletion'] = {
            'sizes': list(sizes),
            'bpt':   bpt_times,
            'bf':    bf_times
        }
        print("         Done.\n")
        return bpt_times, bf_times

    # ============================================================
    # 4. RANGE QUERY BENCHMARK
    # ============================================================

    def benchmark_range_query(self, sizes):
        """
        For each size N:
          1. Build both structures with N keys.
          2. Define a range covering the middle ~10% of key space.
          3. Time the range query on both structures.

        B+ Tree walks the leaf linked list — only relevant nodes visited.
        BruteForce scans every element — O(n) regardless of range size.
        """
        print("[ 4 / 6 ]  Running range query benchmark ...")

        bpt_times = []
        bf_times  = []

        for i, size in enumerate(sizes):
            keys = self._generate_keys(size)

            # Build both structures
            bpt = self._fresh_bpt()
            bf  = self._fresh_bf()
            for k in keys:
                bpt.insert(k, f"val_{k}")
                bf.insert(k)

            # Range = middle 10% of the key space
            lo       = min(keys)
            hi       = max(keys)
            span     = hi - lo
            range_lo = lo + int(span * 0.45)
            range_hi = lo + int(span * 0.55)

            # ── B+ Tree range query ──────────────────
            start = time.perf_counter()
            bpt.range_query(range_lo, range_hi)
            bpt_times.append(time.perf_counter() - start)

            # ── BruteForce range query ───────────────
            start = time.perf_counter()
            bf.range_query(range_lo, range_hi)
            bf_times.append(time.perf_counter() - start)

            if (i + 1) % 25 == 0:
                print(f"         {i + 1} / {len(sizes)} sizes done ...")

        self.results['range_query'] = {
            'sizes': list(sizes),
            'bpt':   bpt_times,
            'bf':    bf_times
        }
        print("         Done.\n")
        return bpt_times, bf_times

    # ============================================================
    # 5. RANDOM MIXED OPERATIONS BENCHMARK
    # ============================================================

    def benchmark_random(self, sizes, n_ops=500):
        """
        Simulates a real workload — a random mix of inserts,
        searches, and deletions.

        Uses every 5th size to keep runtime manageable.

        Parameters
        ----------
        n_ops : int — number of random operations per size. Default 500.
        """
        print("[ 5 / 6 ]  Running random mixed operations benchmark ...")

        bpt_times  = []
        bf_times   = []
        test_sizes = sizes[::5]   # every 5th size → ~20 data points

        for i, size in enumerate(test_sizes):
            keys = self._generate_keys(size)
            half = keys[: size // 2]

            # ── B+ Tree random ops ───────────────────
            bpt = self._fresh_bpt()
            for k in half:
                bpt.insert(k, f"val_{k}")

            start = time.perf_counter()
            for _ in range(n_ops):
                op  = random.choice(['insert', 'search', 'delete'])
                key = random.choice(keys)
                if op == 'insert':
                    bpt.insert(key, f"val_{key}")
                elif op == 'search':
                    bpt.search(key)
                else:
                    bpt.delete(key)
            bpt_times.append(time.perf_counter() - start)

            # ── BruteForce random ops ────────────────
            bf = self._fresh_bf()
            for k in half:
                bf.insert(k)

            start = time.perf_counter()
            for _ in range(n_ops):
                op  = random.choice(['insert', 'search', 'delete'])
                key = random.choice(keys)
                if op == 'insert':
                    bf.insert(key)
                elif op == 'search':
                    bf.search(key)
                else:
                    bf.delete(key)
            bf_times.append(time.perf_counter() - start)

            if (i + 1) % 5 == 0:
                print(f"         {i + 1} / {len(test_sizes)} sizes done ...")

        self.results['random'] = {
            'sizes': list(test_sizes),
            'bpt':   bpt_times,
            'bf':    bf_times
        }
        print("         Done.\n")
        return bpt_times, bf_times

    # ============================================================
    # 6. MEMORY BENCHMARK
    # ============================================================

    def benchmark_memory(self, sizes):
        """
        Uses Python's tracemalloc to measure peak memory usage
        while inserting N keys into each structure.

        Uses every 10th size — memory tracking slows things down.

        Returns
        -------
        bpt_mem, bf_mem : list of floats (kilobytes)
        """
        print("[ 6 / 6 ]  Running memory benchmark ...")

        bpt_mem   = []
        bf_mem    = []
        mem_sizes = sizes[::10]   # every 10th size → ~10 data points

        for i, size in enumerate(mem_sizes):
            keys = self._generate_keys(size)

            # ── B+ Tree memory ───────────────────────
            tracemalloc.start()
            bpt = self._fresh_bpt()
            for k in keys:
                bpt.insert(k, f"val_{k}")
            _, peak_bpt = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            bpt_mem.append(peak_bpt / 1024)   # bytes → KB

            # ── BruteForce memory ────────────────────
            tracemalloc.start()
            bf = self._fresh_bf()
            for k in keys:
                bf.insert(k)
            _, peak_bf = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            bf_mem.append(peak_bf / 1024)     # bytes → KB

            if (i + 1) % 3 == 0:
                print(f"         {i + 1} / {len(mem_sizes)} sizes done ...")

        self.results['memory'] = {
            'sizes': list(mem_sizes),
            'bpt':   bpt_mem,
            'bf':    bf_mem
        }
        print("         Done.\n")
        return bpt_mem, bf_mem

    # ============================================================
    # RUN ALL
    # ============================================================

    def run_all(self, sizes=None):
        """
        Master method — runs all 6 benchmarks in sequence,
        then generates all graphs and prints the summary table.

        Parameters
        ----------
        sizes : list of int, optional
            Dataset sizes to test.
            Defaults to range(100, 100000, 1000) as per assignment.
        """
        if sizes is None:
            sizes = list(range(100, 100_000, 1_000))

        print()
        print("=" * 55)
        print("  PERFORMANCE BENCHMARKING")
        print("  B+ Tree  vs  BruteForce")
        print("=" * 55)
        print(f"  Sizes   : {sizes[0]} → {sizes[-1]} ({len(sizes)} points)")
        print(f"  BPT order: {self.order}   |   Seed: {self.seed}")
        print("=" * 55)
        print()

        self.benchmark_insertion(sizes)
        self.benchmark_search(sizes)
        self.benchmark_deletion(sizes)
        self.benchmark_range_query(sizes)
        self.benchmark_random(sizes)
        self.benchmark_memory(sizes)

        print("Generating graphs ...")
        self.plot_all()
        print("\nAll graphs saved to  graphs/  folder.")
        print("Benchmark complete!")

    # ============================================================
    # PLOTTING — INDIVIDUAL GRAPHS
    # ============================================================

    def _plot_single(self, key, title, ylabel, filename):
        """Helper — draw one benchmark graph and save it."""
        r = self.results[key]

        plt.figure(figsize=(12, 6))
        plt.plot(r['sizes'], r['bpt'],
                 color='steelblue', linewidth=2,
                 label='B+ Tree', marker='o', markersize=2)
        plt.plot(r['sizes'], r['bf'],
                 color='tomato', linewidth=2,
                 label='BruteForce', linestyle='--',
                 marker='x', markersize=2)

        plt.xlabel('Number of Keys', fontsize=13)
        plt.ylabel(ylabel, fontsize=13)
        plt.title(title, fontsize=15, fontweight='bold')
        plt.legend(fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(f'graphs/{filename}', dpi=150)
        plt.show()
        print(f"  Saved → graphs/{filename}")

    def plot_all(self):
        """Generate and save all 6 individual graphs + 1 dashboard."""

        self._plot_single(
            'insertion',
            'Insertion Time: B+ Tree vs BruteForce',
            'Time (seconds)',
            'insertion_benchmark.png'
        )
        self._plot_single(
            'search',
            'Search Time: B+ Tree vs BruteForce (100 sampled keys)',
            'Time (seconds)',
            'search_benchmark.png'
        )
        self._plot_single(
            'deletion',
            'Deletion Time: B+ Tree vs BruteForce (100 sampled keys)',
            'Time (seconds)',
            'deletion_benchmark.png'
        )
        self._plot_single(
            'range_query',
            'Range Query Time: B+ Tree vs BruteForce',
            'Time (seconds)',
            'range_benchmark.png'
        )
        self._plot_single(
            'random',
            'Random Mixed Operations: B+ Tree vs BruteForce',
            'Time (seconds)',
            'random_benchmark.png'
        )

        # Memory graph — ylabel is KB not seconds
        r = self.results['memory']
        plt.figure(figsize=(12, 6))
        plt.plot(r['sizes'], r['bpt'],
                 color='steelblue', linewidth=2,
                 label='B+ Tree', marker='o', markersize=4)
        plt.plot(r['sizes'], r['bf'],
                 color='tomato', linewidth=2,
                 label='BruteForce', linestyle='--',
                 marker='x', markersize=4)
        plt.xlabel('Number of Keys', fontsize=13)
        plt.ylabel('Peak Memory Usage (KB)', fontsize=13)
        plt.title('Memory Usage: B+ Tree vs BruteForce',
                  fontsize=15, fontweight='bold')
        plt.legend(fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('graphs/memory_benchmark.png', dpi=150)
        plt.show()
        print("  Saved → graphs/memory_benchmark.png")

        # Dashboard — all 6 in one figure
        self._plot_dashboard()

    # ============================================================
    # PLOTTING — DASHBOARD (ALL 6 IN ONE)
    # ============================================================

    def _plot_dashboard(self):
        """Combine all 6 benchmark graphs into one summary figure."""

        fig, axes = plt.subplots(2, 3, figsize=(20, 11))
        fig.suptitle(
            'B+ Tree vs BruteForce — Complete Performance Analysis',
            fontsize=17, fontweight='bold', y=1.01
        )

        configs = [
            (axes[0, 0], 'insertion',   'Insertion Time',            'seconds'),
            (axes[0, 1], 'search',      'Search Time (100 samples)', 'seconds'),
            (axes[0, 2], 'deletion',    'Deletion Time (100 keys)',  'seconds'),
            (axes[1, 0], 'range_query', 'Range Query Time',          'seconds'),
            (axes[1, 1], 'memory',      'Peak Memory Usage',         'KB'),
            (axes[1, 2], 'random',      'Random Mixed Ops (500)',    'seconds'),
        ]

        for ax, key, title, ylabel in configs:
            r = self.results[key]
            ax.plot(r['sizes'], r['bpt'],
                    color='steelblue', linewidth=1.5, label='B+ Tree')
            ax.plot(r['sizes'], r['bf'],
                    color='tomato', linewidth=1.5,
                    linestyle='--', label='BruteForce')
            ax.set_title(title, fontsize=11, fontweight='bold')
            ax.set_xlabel('Number of Keys', fontsize=9)
            ax.set_ylabel(ylabel, fontsize=9)
            ax.legend(fontsize=9)
            ax.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig('graphs/full_benchmark_dashboard.png',
                    dpi=150, bbox_inches='tight')
        plt.show()
        print("  Saved → graphs/full_benchmark_dashboard.png")

    # ============================================================
    # SUMMARY TABLE
    # ============================================================

    def summary_table(self):
        """
        Print a pandas DataFrame showing benchmark results at
        three key checkpoints: small, medium, and large dataset.
        """
        try:
            import pandas as pd
        except ImportError:
            print("Run:  pip install pandas")
            return None

        sizes    = self.results['insertion']['sizes']
        idx_list = [0, len(sizes) // 2, -1]
        rows     = []

        for idx in idx_list:
            rows.append({
                'Dataset Size':   sizes[idx],
                'BPT Insert (s)': round(self.results['insertion']['bpt'][idx],   5),
                'BF Insert (s)':  round(self.results['insertion']['bf'][idx],    5),
                'BPT Search (s)': round(self.results['search']['bpt'][idx],      5),
                'BF Search (s)':  round(self.results['search']['bf'][idx],       5),
                'BPT Delete (s)': round(self.results['deletion']['bpt'][idx],    5),
                'BF Delete (s)':  round(self.results['deletion']['bf'][idx],     5),
                'BPT Range (s)':  round(self.results['range_query']['bpt'][idx], 6),
                'BF Range (s)':   round(self.results['range_query']['bf'][idx],  6),
            })

        df = pd.DataFrame(rows)
        pd.set_option('display.float_format', '{:.6f}'.format)
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 120)
        return df