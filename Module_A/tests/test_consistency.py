import os
import sys

# Add the parent directory to sys.path to import the database module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_manager import DatabaseManager
from database.wal import WriteAheadLog
from database.transaction import TransactionManager
from database.recovery import RecoveryManager

# Messes table records
mess_1 = {
    'mess_id': 1,
    'name': 'Jaiswal',
    'capacity': 150,
    'mess_code': 'J'
}

mess_2 = {
    'mess_id': 2,
    'name': 'Mohani',
    'capacity': 120,
    'mess_code': 'M'
}

def run_test_1():
    print("\n--- TEST 1: after commit, DB record == B+ Tree record ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Messes', primary_key='mess_id', order=4)
    tm = TransactionManager(wal, db)
    
    txn_id = tm.begin_transaction()
    tm.transactional_insert(txn_id, 'Messes', mess_1)
    tm.commit(txn_id)
    
    db_record = db.select('Messes', 1)
    tree_record = db.get_table('Messes').tree.search(1)
    
    print(f"DB Record: {db_record}")
    print(f"Tree Record: {tree_record}")
    
    if db_record == tree_record and db_record is not None:
        print("PASS ✓: DB and Tree records are identical after commit.")
    else:
        print("FAIL ✗: DB and Tree records mismatch!")

def run_test_2():
    print("\n--- TEST 2: after rollback, both DB and tree return None ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Messes', primary_key='mess_id', order=4)
    tm = TransactionManager(wal, db)
    
    txn_id = tm.begin_transaction()
    tm.transactional_insert(txn_id, 'Messes', mess_2)
    tm.rollback(txn_id)
    
    db_record = db.select('Messes', 2)
    tree_record = db.get_table('Messes').tree.search(2)
    
    if db_record is None and tree_record is None:
        print("PASS ✓: Both DB and Tree return None after rollback.")
    else:
        print(f"FAIL ✗: Records still exist! db={db_record}, tree={tree_record}")

def run_test_3():
    print("\n--- TEST 3: insert -> commit -> update -> commit -> check both ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Messes', primary_key='mess_id', order=4)
    tm = TransactionManager(wal, db)
    
    # Insert
    txn_1 = tm.begin_transaction()
    tm.transactional_insert(txn_1, 'Messes', mess_1)
    tm.commit(txn_1)
    
    # Update
    txn_2 = tm.begin_transaction()
    tm.transactional_update(txn_2, 'Messes', 1, {'capacity': 200})
    tm.commit(txn_2)
    
    db_record = db.select('Messes', 1)
    tree_record = db.get_table('Messes').tree.search(1)
    
    expected = mess_1.copy()
    expected['capacity'] = 200
    
    if db_record == tree_record == expected:
        print(f"PASS ✓: Both show updated capacity 200.")
    else:
        print(f"FAIL ✗: Mismatch! db={db_record}, tree={tree_record}")

def run_test_4():
    print("\n--- TEST 4: insert -> commit -> update -> rollback -> check original ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Messes', primary_key='mess_id', order=4)
    tm = TransactionManager(wal, db)
    
    # Insert
    txn_1 = tm.begin_transaction()
    tm.transactional_insert(txn_1, 'Messes', mess_1)
    tm.commit(txn_1)
    
    # Update then rollback
    txn_2 = tm.begin_transaction()
    tm.transactional_update(txn_2, 'Messes', 1, {'capacity': 200})
    tm.rollback(txn_2)
    
    db_record = db.select('Messes', 1)
    tree_record = db.get_table('Messes').tree.search(1)
    
    if db_record == tree_record == mess_1:
        print(f"PASS ✓: Both still show original capacity 150.")
    else:
        print(f"FAIL ✗: Mismatch or corruption! db={db_record}, tree={tree_record}")

if __name__ == "__main__":
    run_test_1()
    run_test_2()
    run_test_3()
    run_test_4()
