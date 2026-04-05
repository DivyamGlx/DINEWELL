from .wal import WriteAheadLog

class RecoveryManager:
    def __init__(self, wal: WriteAheadLog, db_manager):
        self.wal = wal
        self.db_manager = db_manager

    def recover(self) -> dict:
        # Called on system startup after a crash
        # Returns summary dict

        # PHASE 1 — ANALYSIS:
        records = self.wal.read_all()
        committed = set()     # txn_ids with COMMIT record
        aborted   = set()     # txn_ids with ABORT record
        txn_ops   = {}        # txn_id -> list of operation records
                              # only INSERT/UPDATE/DELETE records
        
        for record in records:
            txn_id = record.get('txn_id')
            rtype = record.get('type')
            
            if rtype == 'COMMIT':
                committed.add(txn_id)
            elif rtype == 'ABORT':
                aborted.add(txn_id)
            elif rtype in ['INSERT', 'UPDATE', 'DELETE']:
                if txn_id not in txn_ops:
                    txn_ops[txn_id] = []
                txn_ops[txn_id].append(record)

        redo_count = 0
        undo_count = 0

        # PHASE 2 — REDO (re-apply committed transactions):
        for txn_id in committed:
            for op in txn_ops.get(txn_id, []):
                self._redo_operation(op)
                redo_count += 1

        # PHASE 3 — UNDO (reverse incomplete transactions):
        incomplete = [tid for tid in txn_ops if tid not in committed and tid not in aborted]
        
        for txn_id in incomplete:
            # For each op in txn_ops[txn_id] IN REVERSE ORDER:
            for op in reversed(txn_ops[txn_id]):
                self._undo_operation(op)
                undo_count += 1

        return {
            'committed_count':  len(committed),
            'aborted_count':    len(aborted),
            'recovered_count':  len(incomplete),
            'redo_count':       redo_count,
            'undo_count':       undo_count
        }

    def _redo_operation(self, op: dict) -> None:
        table_name = op['table']
        key        = op['key']
        table = self.db_manager.get_table(table_name)
        if table is None: return

        if op['type'] == 'INSERT':
            table.tree.insert(key, op['new_value'])
        elif op['type'] == 'UPDATE':
            table.tree.update(key, op['new_value'])
        elif op['type'] == 'DELETE':
            table.tree.delete(key)

    def _undo_operation(self, op: dict) -> None:
        table_name = op['table']
        key        = op['key']
        table = self.db_manager.get_table(table_name)
        if table is None: return

        if op['type'] == 'INSERT':
            table.tree.delete(key)        # undo insert = delete
        elif op['type'] == 'UPDATE':
            table.tree.update(key, op['old_value'])  # restore old
        elif op['type'] == 'DELETE':
            table.tree.insert(key, op['old_value'])  # undo delete = re-insert

    def verify_consistency(self, table_name: str) -> bool:
        try:
            actual_records = self.db_manager.select_all(table_name)
            table = self.db_manager.get_table(table_name)
            if table is None:
                print(f"Table {table_name} not found")
                return False
            pk = table.primary_key
            actual_dict = {r[pk]: r for r in actual_records if isinstance(r, dict)}
            
            # Get all committed operations for this table from WAL
            records = self.wal.read_all()
            committed = {r.get('txn_id') for r in records if r.get('type') == 'COMMIT'}
            
            # Rebuild expected final state from WAL operations
            expected_dict = {}
            for r in records:
                if r.get('txn_id') in committed and r.get('table') == table_name:
                    rtype, key = r.get('type'), r.get('key')
                    if rtype in ['INSERT', 'UPDATE']:
                        expected_dict[key] = r.get('new_value')
                    elif rtype == 'DELETE':
                        expected_dict.pop(key, None)
            
            if actual_dict != expected_dict:
                print(f"Inconsistency detected in table {table_name}:")
                print(f"Expected: {expected_dict}")
                print(f"Actual:   {actual_dict}")
                return False
            return True
        except Exception as e:
            print(f"verify_consistency error: {e}")
            return False
