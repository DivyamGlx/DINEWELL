import sys
import os

# Add parent directory to path to import database modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_manager import DatabaseManager
from database.wal import WriteAheadLog
from database.transaction import TransactionManager
from database.recovery import RecoveryManager

# Sample Records
student_1 = {
    'student_id': 101,
    'name': 'Vikram Singh',
    'roll_no': '23110101',
    'mobile': '9876541001',
    'year': '2nd',
    'email': 'vikram@iitgn.ac.in'
}

allotment_1 = {
    'allotment_id': 201,
    'student_id': 101,
    'mess_id': 1,
    'start_date': '2026-01-01',
    'end_date': '2026-06-30',
    'status': 'active'
}

complaint_1 = {
    'complaint_id': 301,
    'student_id': 101,
    'mess_id': 1,
    'subject': 'Initial complaint',
    'message': 'Food quality issue on day 1.',
    'status': 'pending'
}

student_2 = {
    'student_id': 102,
    'name': 'Sneha Gupta',
    'roll_no': '23110102',
    'mobile': '9876541002',
    'year': '3rd',
    'email': 'sneha@iitgn.ac.in'
}

allotment_2 = {
    'allotment_id': 202,
    'student_id': 102,
    'mess_id': 2,
    'start_date': '2026-01-01',
    'end_date': '2026-06-30',
    'status': 'active'
}

complaint_2 = {
    'complaint_id': 302,
    'student_id': 102,
    'mess_id': 2,
    'subject': 'Initial complaint',
    'message': 'Mess was closed early.',
    'status': 'pending'
}

def setup_db():
    log_path = os.path.join('logs', 'test_multi.log')
    if not os.path.exists('logs'):
        os.makedirs('logs')
    wal = WriteAheadLog(log_path)
    wal.clear()
    db = DatabaseManager()
    tm = TransactionManager(wal, db)
    db.create_table('Students', 'student_id')
    db.create_table('Student_Mess_Allotment', 'allotment_id')
    db.create_table('Complaints', 'complaint_id')
    return db, wal, tm

def test_1_atomicity_crash():
    print("\n============================================")
    print("MULTI-RELATION TEST 1 — Atomicity (3 tables)")
    print("============================================")
    db, wal, tm = setup_db()
    
    tid = tm.begin_transaction()
    tm.transactional_insert(tid, 'Students', student_1)
    tm.transactional_insert(tid, 'Student_Mess_Allotment', allotment_1)
    tm.transactional_insert(tid, 'Complaints', complaint_1)
    
    print(f"Inserted: Students[101], Allotment[201], Complaint[301]")
    print("CRASH SIMULATED before commit")
    tm.simulate_crash(tid)
    
    print("[Recovery started on fresh DB...]")
    db2 = DatabaseManager()
    db2.create_table('Students', 'student_id')
    db2.create_table('Student_Mess_Allotment', 'allotment_id')
    db2.create_table('Complaints', 'complaint_id')
    
    RecoveryManager(wal, db2).recover()
    
    s = db2.select('Students', 101)
    a = db2.select('Student_Mess_Allotment', 201)
    c = db2.select('Complaints', 301)
    
    print(f"Students[101]    after recovery: {s}")
    print(f"Allotment[201]   after recovery: {a}")
    print(f"Complaints[301]  after recovery: {c}")
    
    try:
        assert s is None
        assert a is None
        assert c is None
        print("RESULT: PASS ✓ — All 3 tables correctly rolled back")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — Data found after crash recovery")
        return False

def test_2_rollback():
    print("\n============================================")
    print("MULTI-RELATION TEST 2 — Multi-Table Rollback")
    print("============================================")
    db, wal, tm = setup_db()
    
    tid = tm.begin_transaction()
    tm.transactional_insert(tid, 'Students', student_1)
    tm.transactional_insert(tid, 'Student_Mess_Allotment', allotment_1)
    tm.transactional_insert(tid, 'Complaints', complaint_1)
    
    print("Explicit rollback initiated")
    tm.rollback(tid)
    
    s = db.select('Students', 101)
    a = db.select('Student_Mess_Allotment', 201)
    c = db.select('Complaints', 301)
    
    try:
        assert s is None
        assert a is None
        assert c is None
        print("RESULT: PASS ✓ — All 3 tables empty after rollback")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — Data found after explicit rollback")
        return False

def test_3_commit_survives():
    print("\n================================================")
    print("MULTI-RELATION TEST 3 — Commit survives, crash does not")
    print("================================================")
    db, wal, tm = setup_db()
    
    # Transaction A
    tid_a = tm.begin_transaction()
    tm.transactional_insert(tid_a, 'Students', student_1)
    tm.transactional_insert(tid_a, 'Student_Mess_Allotment', allotment_1)
    tm.transactional_insert(tid_a, 'Complaints', complaint_1)
    tm.commit(tid_a)
    print("Transaction A committed")
    
    # Transaction B
    tid_b = tm.begin_transaction()
    tm.transactional_insert(tid_b, 'Students', student_2)
    tm.transactional_insert(tid_b, 'Student_Mess_Allotment', allotment_2)
    tm.transactional_insert(tid_b, 'Complaints', complaint_2)
    print("Transaction B started, then CRASH")
    tm.simulate_crash(tid_b)
    
    db2 = DatabaseManager()
    db2.create_table('Students', 'student_id')
    db2.create_table('Student_Mess_Allotment', 'allotment_id')
    db2.create_table('Complaints', 'complaint_id')
    
    RecoveryManager(wal, db2).recover()
    
    s1 = db2.select('Students', 101)
    a1 = db2.select('Student_Mess_Allotment', 201)
    c1 = db2.select('Complaints', 301)
    
    s2 = db2.select('Students', 102)
    a2 = db2.select('Student_Mess_Allotment', 202)
    c2 = db2.select('Complaints', 302)
    
    try:
        assert s1 is not None, "Txn A student missing"
        assert a1 is not None, "Txn A allotment missing"
        assert c1 is not None, "Txn A complaint missing"
        assert s2 is None, "Txn B student found"
        assert a2 is None, "Txn B allotment found"
        assert c2 is None, "Txn B complaint found"
        print("RESULT: PASS ✓ — Committed data survives, uncommitted lost")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

def test_4_consistency():
    print("\n============================================")
    print("MULTI-RELATION TEST 4 — Consistency Check")
    print("============================================")
    db, wal, tm = setup_db()
    
    tid = tm.begin_transaction()
    tm.transactional_insert(tid, 'Students', student_1)
    tm.transactional_insert(tid, 'Student_Mess_Allotment', allotment_1)
    tm.transactional_insert(tid, 'Complaints', complaint_1)
    tm.commit(tid)
    
    try:
        db_student = db.select('Students', 101)
        tree_student = db.get_table('Students').tree.search(101)
        assert db_student == tree_student, "Student consistency mismatch"

        db_allotment = db.select('Student_Mess_Allotment', 201)
        tree_allotment = db.get_table('Student_Mess_Allotment').tree.search(201)
        assert db_allotment == tree_allotment, "Allotment consistency mismatch"

        db_complaint = db.select('Complaints', 301)
        tree_complaint = db.get_table('Complaints').tree.search(301)
        assert db_complaint == tree_complaint, "Complaint consistency mismatch"
        
        print("RESULT: PASS ✓ — B+ Tree and DB Manager are consistent")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

def test_5_update_rollback():
    print("\n============================================")
    print("MULTI-RELATION TEST 5 — Update Rollback")
    print("============================================")
    db, wal, tm = setup_db()
    
    # Setup
    tid_setup = tm.begin_transaction()
    tm.transactional_insert(tid_setup, 'Students', student_1)
    tm.transactional_insert(tid_setup, 'Complaints', complaint_1)
    tm.commit(tid_setup)
    
    # Update transaction
    tid = tm.begin_transaction()
    tm.transactional_update(tid, 'Students', 101, {'year': '3rd'})
    tm.transactional_update(tid, 'Complaints', 301, {'status': 'resolved'})
    
    print("Updates applied, then CRASH")
    tm.simulate_crash(tid)
    
    db2 = DatabaseManager()
    db2.create_table('Students', 'student_id')
    db2.create_table('Complaints', 'complaint_id')
    db2.create_table('Student_Mess_Allotment', 'allotment_id') # For recovery consistency
    
    RecoveryManager(wal, db2).recover()
    
    s = db2.select('Students', 101)
    c = db2.select('Complaints', 301)
    
    try:
        assert s['year'] == '2nd', f"Year updated to {s['year']} incorrectly"
        assert c['status'] == 'pending', f"Status updated to {c['status']} incorrectly"
        print("RESULT: PASS ✓ — Updates correctly reverted to original state")
        return True
    except AssertionError as e:
        print(f"RESULT: FAIL ✗ — {e}")
        return False

if __name__ == "__main__":
    results = []
    results.append(test_1_atomicity_crash())
    results.append(test_2_rollback())
    results.append(test_3_commit_survives())
    results.append(test_4_consistency())
    results.append(test_5_update_rollback())
    
    passed = sum(results)
    print("\n============================================================")
    print("MULTI-RELATION TEST SUMMARY")
    print("============================================================")
    print(f"Test 1 — Multi-table atomicity (crash)   : {'PASS' if results[0] else 'FAIL'}")
    print(f"Test 2 — Multi-table rollback            : {'PASS' if results[1] else 'FAIL'}")
    print(f"Test 3 — Commit survives, crash does not : {'PASS' if results[2] else 'FAIL'}")
    print(f"Test 4 — Consistency across 3 tables     : {'PASS' if results[3] else 'FAIL'}")
    print(f"Test 5 — Multi-table update rollback     : {'PASS' if results[4] else 'FAIL'}")
    print("============================================================")
    print(f"Total: {passed}/5 passed")
