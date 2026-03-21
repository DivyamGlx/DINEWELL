# ============================================================
# BruteForce DB — Baseline for performance comparison
# CS 432 - Assignment 2, Module A
# ============================================================


class BruteForceDB:
    """
    A simple list-based database.
    All operations are O(n) — used as a performance baseline
    against the B+ Tree.
    """

    def __init__(self):
        self.data = []

    def insert(self, key):
        self.data.append(key)

    def search(self, key):
        return key in self.data         # O(n) linear scan

    def delete(self, key):
        if key in self.data:
            self.data.remove(key)       # O(n) scan + shift

    def range_query(self, start, end):
        return [k for k in self.data if start <= k <= end]  # O(n)

    def __len__(self):
        return len(self.data)

    def __repr__(self):
        return f"BruteForceDB(size={len(self.data)})"