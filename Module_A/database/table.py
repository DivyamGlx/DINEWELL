from .bplustree import BPlusTree

class Table:
    def __init__(self, name, primary_key, order=4):
        self.name = name
        self.primary_key = primary_key
        self.tree = BPlusTree(order)

    def insert(self, record: dict):
        key = record[self.primary_key]
        self.tree.insert(key, record)

    def select(self, key):
        return self.tree.search(key)

    def update(self, key, updates: dict):
        record = self.tree.search(key)
        if record:
            record.update(updates)
            self.tree.update(key, record)

    def delete(self, key):
        return self.tree.delete(key)

    def select_all(self):
        results = self.tree.get_all()
        return [r['value'] for r in results]
