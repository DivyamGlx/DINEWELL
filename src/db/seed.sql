-- =============================================================================
-- SECTION 2: SEED DATA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1  Messes
-- -----------------------------------------------------------------------------

INSERT INTO Messes (name, capacity, mess_code) VALUES
('J', 800, 'JAISWAL'),
('M', 800, 'MOHANI'),
('A', 500, 'RGORUS'),
('B', 400, 'BHOPAL');


-- -----------------------------------------------------------------------------
-- 2.2  Meals
-- -----------------------------------------------------------------------------

INSERT INTO Meals (name, price, meal_type) VALUES
('Breakfast', 53.00, 'breakfast'),
('Lunch',     73.00, 'lunch'),
('HiTea',     37.00, 'hitea'),
('Dinner',    73.00, 'dinner');


-- -----------------------------------------------------------------------------
-- 2.3  Students
-- -----------------------------------------------------------------------------

INSERT INTO Students (name, roll_no, mobile, year, email) VALUES
('Divyam Sahu',           '25120028', '9876543210', '3rd', 'divyam_25120028@iitgn.ac.in'),
('Pratishtha Chourasia',  '25120027', '9876543211', '3rd', 'pratishtha_25120027@iitgn.ac.in'),
('Vikram Aditya Dubbaka', '24110385', '9876543212', '3rd', 'vikram_24110385@iitgn.ac.in'),
('Khushi Gupta',          '25120040', '9876543213', '3rd', 'khushi_25120040@iitgn.ac.in'),
('Abhay Verma',           '25120025', '9876543214', '3rd', 'abhay_25120025@iitgn.ac.in'),
('Karshit Agrawal',       '25120030', '9876543215', '2nd', 'karshit_25120030@iitgn.ac.in'),
('Vartika Agnihotri',     '25120036', '9876543216', '2nd', 'vartika_25120036@iitgn.ac.in'),
('Akshata Pawar',         '25120026', '9876543217', '2nd', 'akshata_25120026@iitgn.ac.in'),
('Ananya Patel',          '24110038', '9876543218', '3rd', 'ananya_24110038@iitgn.ac.in'),
('Komal Garg',            '25120031', '9128475630', '2nd', 'komal_25120031@iitgn.ac.in'),
('Dasari Lohith',         '24110100', '9347612589', '3rd', 'lohith_24110100@iitgn.ac.in'),
('Jahan Zaib',            '24110140', '9567321480', '2nd', 'jahan_24110140@iitgn.ac.in'),
('Punit Singh Auluck',    '25120034', '9785641230', '3rd', 'punit_25120034@iitgn.ac.in'),
('Devashish',             '24110104', '9814762350', '2nd', 'devashish_24110104@iitgn.ac.in'),
('Suhani',                '24110358', '9908456123', '3rd', 'suhani_24110358@iitgn.ac.in');


-- -----------------------------------------------------------------------------
-- 2.4  Mess Allotments
-- -----------------------------------------------------------------------------

INSERT INTO Student_Mess_Allotment (student_id, mess_id, start_date, end_date, status) VALUES
(1,  1, '2026-01-01', NULL, 'active'),
(2,  2, '2026-01-01', NULL, 'active'),
(3,  1, '2026-01-01', NULL, 'active'),
(4,  3, '2026-01-01', NULL, 'active'),
(5,  2, '2026-01-01', NULL, 'active'),
(6,  4, '2026-01-01', NULL, 'active'),
(7,  3, '2026-01-01', NULL, 'active'),
(8,  1, '2026-01-01', NULL, 'active'),
(9,  2, '2026-01-01', NULL, 'active'),
(10, 4, '2026-01-01', NULL, 'active'),
(11, 1, '2026-01-01', NULL, 'active'),
(12, 3, '2026-01-01', NULL, 'active'),
(13, 2, '2026-01-01', NULL, 'active'),
(14, 4, '2026-01-01', NULL, 'active'),
(15, 1, '2026-01-01', NULL, 'active');


-- -----------------------------------------------------------------------------
-- 2.5  QR Codes
-- -----------------------------------------------------------------------------

INSERT INTO QR_Codes (student_id, mess_id, qr_data, expiry_date) VALUES
(1,  1, 'QRDATA_1',  '2026-12-31'),
(2,  2, 'QRDATA_2',  '2026-12-31'),
(3,  1, 'QRDATA_3',  '2026-12-31'),
(4,  3, 'QRDATA_4',  '2026-12-31'),
(5,  2, 'QRDATA_5',  '2026-12-31'),
(6,  4, 'QRDATA_6',  '2026-12-31'),
(7,  3, 'QRDATA_7',  '2026-12-31'),
(8,  1, 'QRDATA_8',  '2026-12-31'),
(9,  2, 'QRDATA_9',  '2026-12-31'),
(10, 4, 'QRDATA_10', '2026-12-31'),
(11, 1, 'QRDATA_11', '2026-12-31'),
(12, 3, 'QRDATA_12', '2026-12-31'),
(13, 2, 'QRDATA_13', '2026-12-31'),
(14, 4, 'QRDATA_14', '2026-12-31'),
(15, 1, 'QRDATA_15', '2026-12-31');


-- -----------------------------------------------------------------------------
-- 2.6  Attendance
-- -----------------------------------------------------------------------------

INSERT INTO Attendance (student_id, mess_id, meal_id, scan_date, status) VALUES
(1,  1, 1, datetime('now'), 'present'),
(2,  2, 2, datetime('now'), 'present'),
(3,  1, 3, datetime('now'), 'present'),
(4,  3, 4, datetime('now'), 'present'),
(5,  2, 1, datetime('now'), 'present'),
(6,  4, 2, datetime('now'), 'present'),
(7,  3, 3, datetime('now'), 'present'),
(8,  1, 4, datetime('now'), 'present'),
(9,  2, 1, datetime('now'), 'present'),
(10, 4, 2, datetime('now'), 'present'),
(11, 1, 3, datetime('now'), 'present'),
(12, 3, 4, datetime('now'), 'present'),
(13, 2, 1, datetime('now'), 'present'),
(14, 4, 2, datetime('now'), 'present'),
(15, 1, 3, datetime('now'), 'present');


-- -----------------------------------------------------------------------------
-- 2.7  Wastage
-- -----------------------------------------------------------------------------

INSERT INTO Wastage (student_id, mess_id, meal_id, date, quantity, reason) VALUES
(1,  1, 1, '2026-02-10', 1, 'Left early'),
(3,  1, 2, '2026-02-10', 1, 'Did not like food'),
(5,  2, 4, '2026-02-11', 2, 'Extra taken'),
(7,  3, 3, '2026-02-11', 1, 'Spilled'),
(10, 4, 1, '2026-02-12', 1, 'Health issue');


-- -----------------------------------------------------------------------------
-- 2.8  Transactions
-- -----------------------------------------------------------------------------

INSERT INTO Transactions (mess_id, meal_id, guest_name, amount) VALUES
(1, 1, 'Rahul Mehta',    53.00),
(2, 2, 'Sneha Kapoor',   73.00),
(3, 4, 'Amit Kulkarni',  73.00),
(4, 3, 'Neha Sharma',    37.00),
(1, 2, 'Vikas Rao',      73.00),
(2, 1, 'Priya Desai',    53.00),
(3, 3, 'Arjun Nair',     37.00),
(4, 4, 'Meera Iyer',     73.00);


-- -----------------------------------------------------------------------------
-- 2.9  Complaints
-- -----------------------------------------------------------------------------

INSERT INTO Complaints (student_id, mess_id, subject, message, status) VALUES
(1, 1, 'Food Quality',  'Food was too oily',        'pending'),
(4, 3, 'Hygiene',       'Tables were not clean',    'resolved'),
(6, 4, 'Late Service',  'Dinner served late',       'pending'),
(9, 2, 'Taste Issue',   'Lunch was too spicy',      'pending');


-- -----------------------------------------------------------------------------
-- 2.10 Mess Change Requests
-- -----------------------------------------------------------------------------

INSERT INTO Mess_Change_Requests (student_id, current_mess_id, requested_mess_id, status) VALUES
(3, 1, 2, 'pending'),
(6, 4, 1, 'approved'),
(8, 1, 3, 'rejected');


-- -----------------------------------------------------------------------------
-- 2.11 Admin Users
-- -----------------------------------------------------------------------------

INSERT INTO Admin_Users (username, password_hash, role, mess_id) VALUES
('superadmin',       'hashed_password_1', 'superadmin',   NULL),
('manager_jaiswal',  'hashed_password_2', 'mess_manager', 1),
('manager_mohani',   'hashed_password_3', 'mess_manager', 2),
('manager_rgorus',  'hashed_password_4', 'mess_manager', 3),
('manager_bhopal',   'hashed_password_5', 'mess_manager', 4);
