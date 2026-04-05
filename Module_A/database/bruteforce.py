class BruteForceDB:
    def __init__(self):
        self.data = {}

    def insert(self, key, value):
        self.data[key] = value

    def search(self, key):
        return self.data.get(key)

    def update(self, key, value):
        self.data[key] = value

    def delete(self, key):
        if key in self.data:
            del self.data[key]
            return True
        return False

    def get_all(self):
        return [{'key': k, 'value': v} for k, v in self.data.items()]
