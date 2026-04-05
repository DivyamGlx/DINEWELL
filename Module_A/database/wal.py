import json
import os
from datetime import datetime

class WriteAheadLog:
    def __init__(self, log_path='logs/wal.log'):
        # Create logs/ directory automatically if not exists
        log_dir = os.path.dirname(log_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        self.log_path = log_path

    def write(self, record: dict) -> None:
        # Add timestamp if not present
        if 'timestamp' not in record:
            record['timestamp'] = datetime.now().isoformat()
        
        # Append record as JSON line to log file
        with open(self.log_path, 'a') as f:
            f.write(json.dumps(record) + '\n')
            # MUST call f.flush() then os.fsync(f.fileno()) after every write
            f.flush()
            os.fsync(f.fileno())

    def read_all(self) -> list:
        # Read and parse every line from log file
        if not os.path.exists(self.log_path):
            return []
        
        records = []
        with open(self.log_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line: # Skip empty lines
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        return records

    def clear(self) -> None:
        # Delete log file contents (truncate to zero)
        with open(self.log_path, 'w') as f:
            pass

    def checkpoint(self, committed_ids: set) -> None:
        # Remove all records belonging to committed txn_ids
        # Rewrite the log file keeping only non-committed records
        if not os.path.exists(self.log_path):
            return
            
        records = self.read_all()
        remaining_records = [r for r in records if r.get('txn_id') not in committed_ids]
        
        with open(self.log_path, 'w') as f:
            for r in remaining_records:
                f.write(json.dumps(r) + '\n')
            f.flush()
            os.fsync(f.fileno())
