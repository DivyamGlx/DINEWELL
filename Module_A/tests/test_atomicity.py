import os
import sys

# Add the parent directory to sys.path to import the database module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_manager import DatabaseManager
from database.wal import WriteAheadLog
from database.transaction import TransactionManager
from database.recovery import RecoveryManager

# DineWell schema records
student_1 = {
    'student_id': 1,
    'name': 'Arjun Mehta',
    'roll_no': '23110001',
    'mobile': '9876543210',
    'year': '2nd',
    'email': 'arjun@iitgn.ac.in'
}

student_2 = {
    'student_id': 2,
    'name': 'Priya Sharma',
    'roll_no': '23110002',
    'mobile': '9876543211',
    'year': '3rd',
    'email': 'priya@iitgn.ac.in'
}

student_3 = {
    'student_id': 3,
    'name': 'Rohan Patel',
    'roll_no': '23110003',
    'mobile': '9876543212',
    'year': '1st',
    'email': 'rohan@iitgn.ac.in'
}

def run_test_1():
    print("\n--- TEST 1: simulate_crash() before commit ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Students', primary_key='student_id', order=4)
    
    tm = TransactionManager(wal, db)
    txn_id = tm.begin_transaction()
    
    print(f"Inserting {student_1['name']} and {student_2['name']} in txn {txn_id}...")
    tm.transactional_insert(txn_id, 'Students', student_1)
    tm.transactional_insert(txn_id, 'Students', student_2)
    
    print("Simulating crash before commit...")
    print(f"  Data in original db before crash: {db.select('Students', 1)}")
    tm.simulate_crash(txn_id)
    print(f"  Data in original db after crash: {db.select('Students', 1)}")
    
    # Create fresh DatabaseManager2 (empty) and RecoveryManager
    db2 = DatabaseManager()
    db2.create_table('Students', primary_key='student_id', order=4)
    rm = RecoveryManager(wal, db2)
    
    print("Recovering on fresh db2...")
    rm.recover()
    
    s1_db2 = db2.select('Students', 1)
    s2_db2 = db2.select('Students', 2)
    
    # Also recover the original db to prove UNDO works
    rm_orig = RecoveryManager(wal, db)
    print("Recovering on original db...")
    rm_orig.recover()
    s1_orig = db.select('Students', 1)
    
    if s1_db2 is None and s2_db2 is None and s1_orig is None:
        print("PASS ✓: Records were not found in db2 (redo skipped) AND were removed from original db (undo worked).")
    else:
        print(f"FAIL ✗: Consistency error! s1_db2={s1_db2}, s1_orig={s1_orig}")

def run_test_2():
    print("\n--- TEST 2: explicit rollback() ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Students', primary_key='student_id', order=4)
    
    tm = TransactionManager(wal, db)
    txn_id = tm.begin_transaction()
    
    print(f"Inserting {student_1['name']} and {student_2['name']} in txn {txn_id}...")
    tm.transactional_insert(txn_id, 'Students', student_1)
    tm.transactional_insert(txn_id, 'Students', student_2)
    
    print("Rolling back transaction...")
    tm.rollback(txn_id)
    
    s1 = db.select('Students', 1)
    s2 = db.select('Students', 2)
    
    if s1 is None and s2 is None:
        print("PASS ✓: Records were correctly removed after rollback.")
    else:
        print(f"FAIL ✗: Records still exist after rollback! s1={s1}, s2={s2}")

def run_test_3():
    print("\n--- TEST 3: commit then crash a second transaction ---")
    log_path = os.path.join('logs', 'wal.log')
    wal = WriteAheadLog(log_path)
    wal.clear()
    
    db = DatabaseManager()
    db.create_table('Students', primary_key='student_id', order=4)
    tm = TransactionManager(wal, db)
    
    # txn_A: commit
    txn_A = tm.begin_transaction()
    print(f"Committing txn_A inserting {student_1['name']}...")
    tm.transactional_insert(txn_A, 'Students', student_1)
    tm.commit(txn_A)
    
    # txn_B: crash
    txn_B = tm.begin_transaction()
    print(f"Crashing txn_B inserting {student_2['name']}...")
    tm.transactional_insert(txn_B, 'Students', student_2)
    tm.simulate_crash(txn_B)
    
    # Recovery
    db2 = DatabaseManager()
    db2.create_table('Students', primary_key='student_id', order=4)
    rm = RecoveryManager(wal, db2)
    print("Recovering...")
    rm.recover()
    
    s1 = db2.select('Students', 1)
    s2 = db2.select('Students', 2)
    
    if s1 is not None and s2 is None:
        print("PASS ✓: Committed txn_A survived, crashed txn_B did not.")
    else:
        print(f"FAIL ✗: Consistency error! s1={s1}, s2={s2}")

if __name__ == "__main__":
    run_test_1()
    run_test_2()
    run_test_3()
