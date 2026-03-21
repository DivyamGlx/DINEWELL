# ============================================================
# Table abstraction built on top of the B+ Tree
# CS 432 - Assignment 2, Module A
# ============================================================

from .bplustree import BPlusTree


class Table:
    """
    A database table backed by a B+ Tree index.

    Each record is stored as a dictionary.
    The primary key field is used as the tree key.

    Parameters
    ----------
    name        : str  — name of the table
    primary_key : str  — the field used as the B+ Tree key
    order       : int  — B+ Tree order (minimum degree)
    """

    def __init__(self, name, primary_key='id', order=4):
        self.name        = name
        self.primary_key = primary_key
        self.tree        = BPlusTree(order=order)
        self.columns     = set()

    # ── CRUD ──────────────────────────────────────────────────

    def insert(self, record: dict):
        """Insert a record. Raises ValueError if primary key is missing."""
        if self.primary_key not in record:
            raise ValueError(
                f"Record missing primary key '{self.primary_key}'"
            )
        key = record[self.primary_key]
        self.columns.update(record.keys())
        self.tree.insert(key, record.copy())
        return True

    def select(self, key):
        """Fetch a single record by primary key. Returns None if not found."""
        return self.tree.search(key)

    def select_all(self):
        """Return all records in primary-key order."""
        return [val for _, val in self.tree.get_all()]

    def select_range(self, start, end):
        """Return all records whose primary key is in [start, end]."""
        return [val for _, val in self.tree.range_query(start, end)]

    def update(self, key, updates: dict):
        """
        Merge updates into an existing record.
        Returns True if successful, False if record not found.
        """
        record = self.tree.search(key)
        if record is None:
            return False
        record.update(updates)
        self.tree.update(key, record)
        return True

    def delete(self, key):
        """Delete a record by primary key. Returns True if deleted."""
        return self.tree.delete(key)

    # ── Aggregate Helpers ──────────────────────────────────────

    def count(self):
        """Return the total number of records in the table."""
        return len(self.tree.get_all())

    def find_where(self, field, value):
        """
        Linear scan to find all records where record[field] == value.
        (Not index-optimised — for demonstration purposes.)
        """
        return [
            rec for rec in self.select_all()
            if rec.get(field) == value
        ]

    # ── Visualisation ──────────────────────────────────────────

    def visualize(self):
        """Visualise the underlying B+ Tree using Graphviz."""
        print(f"Visualising table: {self.name}")
        return self.tree.visualize_tree()

    # ── Display ───────────────────────────────────────────────

    def show(self, limit=10):
        """Print the first `limit` records in a readable format."""
        records = self.select_all()
        print(f"\nTable: {self.name}  |  Records: {self.count()}")
        print("-" * 60)
        for rec in records[:limit]:
            print(rec)
        if len(records) > limit:
            print(f"  ... and {len(records) - limit} more records.")

    def __repr__(self):
        return (f"Table(name='{self.name}', "
                f"primary_key='{self.primary_key}', "
                f"records={self.count()})")