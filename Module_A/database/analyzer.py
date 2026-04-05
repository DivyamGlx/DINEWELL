import time

class PerformanceAnalyzer:
    def __init__(self):
        self.results = {}

    def measure_time(self, func, *args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, end_time - start_time

    def analyze_insertion(self, db, data):
        _, duration = self.measure_time(lambda: [db.insert(k, v) for k, v in data.items()])
        return duration

    def analyze_search(self, db, keys):
        _, duration = self.measure_time(lambda: [db.search(k) for k in keys])
        return duration
