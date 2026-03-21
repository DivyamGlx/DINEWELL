# ============================================================
# Database Manager — manages multiple Table instances
# CS 432 - Assignment 2, Module A
# ============================================================

from .table import Table


class DatabaseManager:
    """
    Manages a collection of Tables, each backed by a B+ Tree.

    Provides a simple interface to create, drop, and query tables
    without interacting with the B+ Tree directly.

    Parameters
    ----------
    name  : str — name of the database
    order : int — default B+ Tree order for all tables
    """

    def __init__(self, name='CS432_DB', order=4):
        self.name   = name
        self.order  = order
        self.tables = {}        # table_name → Table

    # ── Table Management ───────────────────────────────────────

    def create_table(self, name, primary_key='id', order=None):
        """Create a new table. Returns the Table object."""
        if name in self.tables:
            print(f"[INFO] Table '{name}' already exists.")
            return self.tables[name]
        t = Table(name, primary_key=primary_key,
                  order=order or self.order)
        self.tables[name] = t
        print(f"[OK] Table '{name}' created (pk='{primary_key}').")
        return t

    def drop_table(self, name):
        """Delete a table entirely. Returns True if dropped."""
        if name not in self.tables:
            print(f"[ERROR] Table '{name}' not found.")
            return False
        del self.tables[name]
        print(f"[OK] Table '{name}' dropped.")
        return True

    def get_table(self, name) -> Table:
        """Return the Table object. Raises ValueError if not found."""
        if name not in self.tables:
            raise ValueError(f"Table '{name}' does not exist.")
        return self.tables[name]

    def list_tables(self):
        """Return a list of all table names."""
        return list(self.tables.keys())

    # ── Shorthand CRUD ─────────────────────────────────────────

    def insert(self, table_name, record):
        return self.get_table(table_name).insert(record)

    def select(self, table_name, key):
        return self.get_table(table_name).select(key)

    def select_all(self, table_name):
        return self.get_table(table_name).select_all()

    def select_range(self, table_name, start, end):
        return self.get_table(table_name).select_range(start, end)

    def update(self, table_name, key, updates):
        return self.get_table(table_name).update(key, updates)

    def delete(self, table_name, key):
        return self.get_table(table_name).delete(key)

    # ── Display ───────────────────────────────────────────────

    def show_stats(self):
        """Print a summary of all tables in the database."""
        print(f"\n{'='*50}")
        print(f"  Database : {self.name}")
        print(f"{'='*50}")
        print(f"  {'Table':<20} {'Records':<10} {'Primary Key'}")
        print(f"  {'-'*40}")
        for name, table in self.tables.items():
            print(f"  {name:<20} {table.count():<10} {table.primary_key}")
        print(f"{'='*50}\n")

    def __repr__(self):
        return (f"DatabaseManager(name='{self.name}', "
                f"tables={list(self.tables.keys())})")

