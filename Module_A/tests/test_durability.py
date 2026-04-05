import os
import sys

# Add the parent directory to sys.path to import the database module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_manager import DatabaseManager
from database.wal import WriteAheadLog
from database.transaction import TransactionManager
from database.recovery import RecoveryManager

# Complaints table records
complaint_1 = {
    'complaint_id': 1,
    'student_id': 101,
    'mess_id': 1,
    'subject': 'Cold food served',
    'message': 'Dinner was served cold on Monday.',
    'status': 'pending'
}

complaint_2 = {
    'complaint_id': 2,
    'student_id': 102,
    'mess_id': 2,
    'subject': 'Unhygienic utensils',
    'message': 'Plates were not cleaned properly.',
    'status': 'pending'
}

def run_test_1():
    print("\n--- TEST 1: data survives crash after commit ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Complaints', primary_key='complaint_id', order=4)
    tm = TransactionManager(wal, db)
    
    txn_id = tm.begin_transaction()
    tm.transactional_insert(txn_id, 'Complaints', complaint_1)
    tm.commit(txn_id)
    
    # Wipe memory
    del db
    del tm
    
    # Fresh DatabaseManager2 (empty)
    db2 = DatabaseManager()
    db2.create_table('Complaints', primary_key='complaint_id', order=4)
    rm = RecoveryManager(wal, db2)
    
    print("Recovering...")
    rm.recover()
    
    result = db2.select('Complaints', 1)
    if result is not None and result['subject'] == 'Cold food served':
        print("PASS ✓: Committed data survived the crash.")
    else:
        print(f"FAIL ✗: Data lost! result={result}")

def run_test_2():
    print("\n--- TEST 2: committed survives, crashed does not ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Complaints', primary_key='complaint_id', order=4)
    tm = TransactionManager(wal, db)
    
    # txn_A: commit
    txn_A = tm.begin_transaction()
    tm.transactional_insert(txn_A, 'Complaints', complaint_1)
    tm.commit(txn_A)
    
    # txn_B: crash
    txn_B = tm.begin_transaction()
    tm.transactional_insert(txn_B, 'Complaints', complaint_2)
    tm.simulate_crash(txn_B)
    
    # Wipe memory
    del db
    del tm
    
    # Fresh db2
    db2 = DatabaseManager()
    db2.create_table('Complaints', primary_key='complaint_id', order=4)
    rm = RecoveryManager(wal, db2)
    
    print("Recovering...")
    rm.recover()
    
    c1 = db2.select('Complaints', 1)
    c2 = db2.select('Complaints', 2)
    
    if c1 is not None and c2 is None:
        print("PASS ✓: complaint_1 exists, complaint_2 does not.")
    else:
        print(f"FAIL ✗: Durability mismatch! c1={c1}, c2={c2}")

def run_test_3():
    print("\n--- TEST 3: update durability ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Complaints', primary_key='complaint_id', order=4)
    tm = TransactionManager(wal, db)
    
    # Insert
    txn_1 = tm.begin_transaction()
    tm.transactional_insert(txn_1, 'Complaints', complaint_1)
    tm.commit(txn_1)
    
    # Update
    txn_2 = tm.begin_transaction()
    tm.transactional_update(txn_2, 'Complaints', 1, {'status': 'resolved'})
    tm.commit(txn_2)
    
    # Simulate crash (no further commits)
    tm.simulate_crash(999) # Dummy txn_id
    
    # Wipe memory
    del db
    del tm
    
    # Fresh db2
    db2 = DatabaseManager()
    db2.create_table('Complaints', primary_key='complaint_id', order=4)
    rm = RecoveryManager(wal, db2)
    
    print("Recovering...")
    rm.recover()
    
    result = db2.select('Complaints', 1)
    if result is not None and result['status'] == 'resolved':
        print("PASS ✓: Recovered status is 'resolved'.")
    else:
        print(f"FAIL ✗: Update not durable! result={result}")

if __name__ == "__main__":
    run_test_1()
    run_test_2()
    run_test_3()
