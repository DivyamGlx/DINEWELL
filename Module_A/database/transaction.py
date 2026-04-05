from datetime import datetime
from .wal import WriteAheadLog

class TransactionManager:
    def __init__(self, wal: WriteAheadLog, db_manager):
        self.wal = wal
        self.db_manager = db_manager
        self.active_transactions = {}
        # Structure: {
        #   txn_id (int): {
        #     'status': 'ACTIVE',
        #     'operations': [
        #       {
        #         'type': 'INSERT'/'UPDATE'/'DELETE',
        #         'table': 'Students',
        #         'key': 101,
        #         'old_value': None or dict,
        #         'new_value': dict or None
        #       },
        #       ...
        #     ]
        #   }
        # }
        self.next_txn_id = 1

    def begin_transaction(self) -> int:
        txn_id = self.next_txn_id
        self.next_txn_id += 1
        
        # Write TXN_START to WAL
        self.wal.write({
            "type": "TXN_START",
            "txn_id": txn_id,
            "table": None,
            "key": None,
            "old_value": None,
            "new_value": None,
            "timestamp": datetime.now().isoformat()
        })
        
        # Store in active_transactions
        self.active_transactions[txn_id] = {'status': 'ACTIVE', 'operations': []}
        return txn_id

    def commit(self, txn_id) -> bool:
        # Validate txn_id is in active_transactions
        if txn_id not in self.active_transactions:
            return False
            
        # Write COMMIT to WAL
        self.wal.write({
            "type": "COMMIT",
            "txn_id": txn_id,
            "table": None,
            "key": None,
            "old_value": None,
            "new_value": None,
            "timestamp": datetime.now().isoformat()
        })
        
        # Set status to COMMITTED
        self.active_transactions[txn_id]['status'] = 'COMMITTED'
        # Remove from active_transactions
        del self.active_transactions[txn_id]
        return True

    def rollback(self, txn_id) -> bool:
        # Validate txn_id is in active_transactions
        if txn_id not in self.active_transactions:
            return False
            
        # Get operations list for this txn_id
        operations = self.active_transactions[txn_id]['operations']
        
        # Iterate operations in REVERSE order
        for op in reversed(operations):
            table = self.db_manager.get_table(op['table'])
            if op['type'] == 'INSERT':
                table.tree.delete(op['key'])
            elif op['type'] == 'UPDATE':
                table.tree.update(op['key'], op['old_value'])
            elif op['type'] == 'DELETE':
                table.tree.insert(op['key'], op['old_value'])
                
        # Write ABORT to WAL
        self.wal.write({
            "type": "ABORT",
            "txn_id": txn_id,
            "table": None,
            "key": None,
            "old_value": None,
            "new_value": None,
            "timestamp": datetime.now().isoformat()
        })
        
        # Remove from active_transactions
        del self.active_transactions[txn_id]
        return True

    def simulate_crash(self, txn_id) -> None:
        # Remove txn_id from active_transactions SILENTLY
        # Do NOT write ABORT to WAL
        # Do NOT undo any operations
        if txn_id in self.active_transactions:
            del self.active_transactions[txn_id]

    def transactional_insert(self, txn_id, table_name, record: dict) -> bool:
        # Validate txn_id is active
        if txn_id not in self.active_transactions:
            return False
            
        try:
            # Get primary key value
            table = self.db_manager.get_table(table_name)
            pk_field = table.primary_key
            key = record[pk_field]
            
            # Write INSERT to WAL
            self.wal.write({
                "type": "INSERT",
                "txn_id": txn_id,
                "table": table_name,
                "key": key,
                "old_value": None,
                "new_value": record,
                "timestamp": datetime.now().isoformat()
            })
            
            # Apply: self.db_manager.insert(table_name, record)
            self.db_manager.insert(table_name, record)
            
            # Append to operations
            self.active_transactions[txn_id]['operations'].append({
                'type': 'INSERT',
                'table': table_name,
                'key': key,
                'old_value': None,
                'new_value': record
            })
            return True
        except Exception as e:
            print(f"Error in transactional_insert: {e}")
            self.rollback(txn_id)
            return False

    def transactional_update(self, txn_id, table_name, key, updates: dict) -> bool:
        # Validate txn_id is active
        if txn_id not in self.active_transactions:
            return False
            
        try:
            # old_value = self.db_manager.select(table_name, key)
            old_value = self.db_manager.select(table_name, key)
            # If old_value is None: return False (record not found)
            if old_value is None:
                return False
                
            # Compute new_value by merging old_value with updates
            new_value = old_value.copy()
            new_value.update(updates)
            
            # Write UPDATE to WAL
            self.wal.write({
                "type": "UPDATE",
                "txn_id": txn_id,
                "table": table_name,
                "key": key,
                "old_value": old_value,
                "new_value": new_value,
                "timestamp": datetime.now().isoformat()
            })
            
            # Apply: self.db_manager.update(table_name, key, updates)
            self.db_manager.update(table_name, key, updates)
            
            # Append to operations
            self.active_transactions[txn_id]['operations'].append({
                'type': 'UPDATE',
                'table': table_name,
                'key': key,
                'old_value': old_value,
                'new_value': new_value
            })
            return True
        except Exception as e:
            print(f"Error in transactional_update: {e}")
            self.rollback(txn_id)
            return False

    def transactional_delete(self, txn_id, table_name, key) -> bool:
        # Validate txn_id is active
        if txn_id not in self.active_transactions:
            return False
            
        try:
            # old_value = self.db_manager.select(table_name, key)
            old_value = self.db_manager.select(table_name, key)
            # If old_value is None: return False
            if old_value is None:
                return False
                
            # Write DELETE to WAL
            self.wal.write({
                "type": "DELETE",
                "txn_id": txn_id,
                "table": table_name,
                "key": key,
                "old_value": old_value,
                "new_value": None,
                "timestamp": datetime.now().isoformat()
            })
            
            # Apply: self.db_manager.delete(table_name, key)
            self.db_manager.delete(table_name, key)
            
            # Append to operations
            self.active_transactions[txn_id]['operations'].append({
                'type': 'DELETE',
                'table': table_name,
                'key': key,
                'old_value': old_value,
                'new_value': None
            })
            return True
        except Exception as e:
            print(f"Error in transactional_delete: {e}")
            self.rollback(txn_id)
            return False

    def get_status(self, txn_id) -> str:
        # Return active_transactions[txn_id]['status']
        # or 'NOT_FOUND' if not present
        if txn_id in self.active_transactions:
            return self.active_transactions[txn_id]['status']
        return 'NOT_FOUND'
