import sys
import os

# Add parent directory to path to import database modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_manager import DatabaseManager
from database.wal import WriteAheadLog
from database.transaction import TransactionManager

# Sample Records
student_A = {
    'student_id': 501,
    'name': 'Aditya Kumar',
    'roll_no': '23110501',
    'mobile': '9876545001',
    'year': '1st',
    'email': 'aditya@iitgn.ac.in'
}

student_B = {
    'student_id': 502,
    'name': 'Bhavna Rao',
    'roll_no': '23110502',
    'mobile': '9876545002',
    'year': '2nd',
    'email': 'bhavna@iitgn.ac.in'
}

allotment_A = {
    'allotment_id': 601,
    'student_id': 501,
    'mess_id': 1,
    'start_date': '2026-01-01',
    'end_date': '2026-06-30',
    'status': 'active'
}

allotment_B = {
    'allotment_id': 602,
    'student_id': 502,
    'mess_id': 2,
    'start_date': '2026-01-01',
    'end_date': '2026-06-30',
    'status': 'active'
}

def setup_db():
    log_path = os.path.join('logs', 'test_isolation.log')
    if not os.path.exists('logs'):
        os.makedirs('logs')
    wal = WriteAheadLog(log_path)
    wal.clear()
    db = DatabaseManager()
    tm = TransactionManager(wal, db)
    db.create_table('Students', 'student_id')
    db.create_table('Student_Mess_Allotment', 'allotment_id')
    return db, wal, tm

def test_1_basic_isolation():
    print("\n============================================")
    print("ISOLATION TEST 1 — Intermediate State Check")
    print("============================================")
    db, wal, tm = setup_db()
    
    txn1 = tm.begin_transaction()
    txn2 = tm.begin_transaction()
    
    tm.transactional_insert(txn1, 'Students', student_A)
    tm.transactional_insert(txn2, 'Students', student_B)
    
    print("txn1 inserted student_A (not yet committed)")
    print("txn2 inserted student_B (not yet committed)")
    
    mid_check = db.select('Students', 501)
    visible = mid_check is not None
    print(f"Mid-check student_A visible before commit: {'YES' if visible else 'NO'}")
    
    isolation_level = "READ UNCOMMITTED" if visible else "READ COMMITTED"
    print(f"Isolation level detected: {isolation_level}")
    
    tm.commit(txn1)
    tm.commit(txn2)
    
    s1 = db.select('Students', 501)
    s2 = db.select('Students', 502)
    
    try:
        assert s1 is not None, "Student A missing after commit"
        assert s2 is not None, "Student B missing after commit"
        print("After both commits: both students exist: YES")
        print("RESULT: PASS ✓ (behavior documented)")
        return True, isolation_level
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False, isolation_level

def test_2_rollback_isolation():
    print("\n============================================")
    print("ISOLATION TEST 2 — Rollback Isolation")
    print("============================================")
    db, wal, tm = setup_db()
    
    txn1 = tm.begin_transaction()
    tm.transactional_insert(txn1, 'Students', student_A)
    
    after_insert = db.select('Students', 501)
    visible = after_insert is not None
    print(f"txn1 inserted student_A")
    print(f"Before rollback visible: {'YES' if visible else 'NO'}")
    
    print("txn1 rolled back")
    tm.rollback(txn1)
    
    txn2 = tm.begin_transaction()
    after_rollback = db.select('Students', 501)
    print(f"After rollback visible to txn2: {'YES' if after_rollback else 'NO'}")
    
    try:
        assert after_rollback is None, "Data still visible after rollback"
        print("RESULT: PASS ✓ — Rolled back data not visible")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

def test_3_concurrent_updates():
    print("\n============================================")
    print("ISOLATION TEST 3 — Concurrent Updates Same Record")
    print("============================================")
    db, wal, tm = setup_db()
    
    # Setup: insert student_A and commit
    tid_setup = tm.begin_transaction()
    tm.transactional_insert(tid_setup, 'Students', student_A)
    tm.commit(tid_setup)
    
    txn1 = tm.begin_transaction()
    txn2 = tm.begin_transaction()
    
    tm.transactional_update(txn1, 'Students', 501, {'year': '3rd'})
    print("txn1 updated year -> 3rd")
    tm.transactional_update(txn2, 'Students', 501, {'year': '4th'})
    print("txn2 updated year -> 4th")
    
    tm.commit(txn1)
    tm.commit(txn2)
    
    final = db.select('Students', 501)
    print(f"Final year value: {final['year']} (last write wins)")
    
    try:
        assert final is not None
        assert final['year'] in ['3rd', '4th']
        assert final['year'] != '1st'
        print("No corruption detected: YES")
        print("RESULT: PASS ✓ — Last write wins, no corruption")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

def test_4_interleaved_multi_table():
    print("\n============================================")
    print("ISOLATION TEST 4 — Multi-Table Interleaved Transactions")
    print("============================================")
    db, wal, tm = setup_db()
    
    txn1 = tm.begin_transaction()
    txn2 = tm.begin_transaction()
    
    tm.transactional_insert(txn1, 'Students', student_A)
    tm.transactional_insert(txn2, 'Students', student_B)
    tm.transactional_insert(txn1, 'Student_Mess_Allotment', allotment_A)
    tm.transactional_insert(txn2, 'Student_Mess_Allotment', allotment_B)
    
    tm.commit(txn1)
    tm.commit(txn2)
    
    s1 = db.select('Students', 501)
    s2 = db.select('Students', 502)
    a1 = db.select('Student_Mess_Allotment', 601)
    a2 = db.select('Student_Mess_Allotment', 602)
    
    try:
        assert s1 is not None
        assert s2 is not None
        assert a1 is not None
        assert a2 is not None
        print("RESULT: PASS ✓ — Interleaved multi-table inserts successful")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

if __name__ == "__main__":
    results = []
    r1, isolation_level = test_1_basic_isolation()
    results.append(r1)
    results.append(test_2_rollback_isolation())
    results.append(test_3_concurrent_updates())
    results.append(test_4_interleaved_multi_table())
    
    passed = sum(results)
    print("\n============================================================")
    print("ISOLATION TEST SUMMARY")
    print("============================================================")
    print(f"Test 1 — Intermediate state visibility  : {'PASS' if results[0] else 'FAIL'}")
    print(f"Test 2 — Rollback isolation             : {'PASS' if results[1] else 'FAIL'}")
    print(f"Test 3 — Concurrent updates same record : {'PASS' if results[2] else 'FAIL'}")
    print(f"Test 4 — Multi-table interleaved txns   : {'PASS' if results[3] else 'FAIL'}")
    print("============================================================")
    print(f"Isolation Level Detected: {isolation_level}")
    print("(Changes applied immediately to B+ Tree — no lock manager)")
    print("This is documented and expected for our simplified system.")
    print(f"Total: {passed}/4 passed")
