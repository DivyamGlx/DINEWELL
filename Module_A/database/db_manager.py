from .table import Table

class DatabaseManager:
    def __init__(self):
        self.tables = {}

    def create_table(self, name, primary_key, order=4):
        if name in self.tables:
            raise Exception(f"Table {name} already exists.")
        self.tables[name] = Table(name, primary_key, order)

    def drop_table(self, name):
        if name not in self.tables:
            raise Exception(f"Table {name} not found.")
        del self.tables[name]

    def get_table(self, name):
        return self.tables.get(name)

    def insert(self, table_name, record: dict):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        table.insert(record)

    def select(self, table_name, key):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        return table.select(key)

    def select_all(self, table_name):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        return table.select_all()

    def select_range(self, table_name, start, end):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        results = table.tree.get_all()
        return [r['value'] for r in results if start <= r['key'] <= end]

    def update(self, table_name, key, updates: dict):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        table.update(key, updates)

    def delete(self, table_name, key):
        table = self.get_table(table_name)
        if not table:
            raise Exception(f"Table {table_name} not found.")
        return table.delete(key)
