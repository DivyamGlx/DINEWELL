CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    year VARCHAR(10),
    email VARCHAR(100) UNIQUE,
    created_date DATE DEFAULT (CURDATE()),
    INDEX idx_roll_no (roll_no),
    INDEX idx_email (email)
);
CREATE TABLE Messes (
    mess_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(1) NOT NULL UNIQUE COMMENT 'Jaiswal, Mohani, arbacus, Bhopal',
    capacity INT DEFAULT 100,
    mess_code VARCHAR(10)
);
CREATE TABLE Student_Mess_Allotment (
    allotment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'expired') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_active_allotment (student_id, status),
    INDEX idx_student_status (student_id, status)
);
CREATE TABLE Meals (
    meal_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    price DECIMAL(8,2) DEFAULT 0.00,
    meal_type ENUM('breakfast', 'lunch', 'hitea', 'dinner') NOT NULL,
    UNIQUE KEY unique_meal_type (meal_type)
);
CREATE TABLE QR_Codes (
    qr_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    qr_data TEXT NOT NULL COMMENT 'JSON or base64 QR image data',
    generated_date DATE DEFAULT (CURDATE()),
    expiry_date DATE,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    INDEX idx_student_mess (student_id, mess_id)
);
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15),
    mess_id INT,
    role ENUM('manager', 'cook', 'attendant') DEFAULT 'attendant',
    salary DECIMAL(10,2),
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id) ON DELETE SET NULL,
    INDEX idx_mess_role (mess_id, role)
);
-- Consumption Tables
CREATE TABLE Attendance (
    att_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    meal_id INT NOT NULL,
    scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('present', 'absent') DEFAULT 'present',
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(meal_id),
    INDEX idx_scan_date (scan_date),
    INDEX idx_student_meal (student_id, meal_id)
);

CREATE TABLE Wastage (
    wastage_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    meal_id INT,
    date DATE NOT NULL,
    quantity INT DEFAULT 1,
    reason VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(meal_id),
    INDEX idx_date_student (date, student_id)
);

-- Transaction Tables
CREATE TABLE Transactions (
    trans_id INT PRIMARY KEY AUTO_INCREMENT,
    mess_id INT NOT NULL,
    meal_id INT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    payment_method ENUM('UPI') DEFAULT 'UPI',
    trans_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(meal_id),
    INDEX idx_mess_date (mess_id, trans_date)
);


CREATE TABLE Bills (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_meals INT DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    due_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    generated_date DATE DEFAULT (CURDATE()),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    UNIQUE KEY unique_bill_month (student_id, mess_id, month, year),
    INDEX idx_month_year (month, year)
);

-- Feedback Tables
CREATE TABLE Complaints (
    complaint_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    mess_id INT,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_date DATE NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    INDEX idx_status_date (status, created_date)
);

CREATE TABLE Mess_Change_Requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    current_mess_id INT NOT NULL,
    requested_mess_id INT NOT NULL,
    request_date DATE DEFAULT (CURDATE()),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    change_date DATE NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (current_mess_id) REFERENCES Messes(mess_id),
    FOREIGN KEY (requested_mess_id) REFERENCES Messes(mess_id),
    INDEX idx_status (status)
);

CREATE TABLE Admin_Users (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'mess_manager') DEFAULT 'mess_manager',
    mess_id INT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    INDEX idx_role (role)
);

CREATE VIEW Student_Dashboard AS
SELECT 
    s.student_id,
    s.name,
    m.name AS mess_name,
    LEFT(q.qr_data, 50) AS qr_preview,
    a.start_date
FROM Students s
JOIN Student_Mess_Allotment a 
    ON s.student_id = a.student_id 
    AND a.status = 'active'
JOIN Messes m 
    ON a.mess_id = m.mess_id
LEFT JOIN QR_Codes q 
    ON s.student_id = q.student_id 
    AND q.expiry_date >= CURDATE();


-- ---------INSERTING THE VALUES

INSERT INTO Messes (name, capacity, mess_code) VALUES
('J', 800, 'JAISWAL'),
('M', 800, 'MOHANI'),
('A', 500, 'ARBACUS'),
('B', 400, 'BHOPAL');

INSERT INTO Meals (name, price, meal_type) VALUES
('Breakfast', 53.00, 'breakfast'),
('Lunch', 73.00, 'lunch'),
('HiTea', 37.00, 'hitea'),
('Dinner', 73.00, 'dinner');

INSERT INTO Students (name, roll_no, mobile, year, email) VALUES
('Divyam Sahu', '25120028', '9876543210', '3rd', 'divyam_25120028@iitgn.ac.in'),
('Pratishtha Chourasia', '25120027', '9876543211', '3rd', 'pratishtha_25120027@iitgn.ac.in'),
('Vikram Aditya Dubbaka', '24110385', '9876543212', '3rd', 'vikram_24110385@iitgn.ac.in'),
('Khushi Gupta', '25120040', '9876543213', '3rd', 'khushi_25120040@iitgn.ac.in'),
('Abhay Verma', '25120025', '9876543214', '3rd', 'abhay_25120025@iitgn.ac.in'),
('Karshit Agrawal', '25120030', '9876543215', '2nd', 'karshit_25120030@iitgn.ac.in'),
('Vartika Agnihotri', '25120036', '9876543216', '2nd', 'vartika_25120036@iitgn.ac.in'),
('Akshata Pawar', '25120026', '9876543217', '2nd', 'akshata_25120026@iitgn.ac.in'),
('Ananya Patel', '24110038', '9876543218', '3rd', 'ananya_24110038@iitgn.ac.in'),
('Komal Garg', '25120031', '9128475630', '2nd', 'komal_25120031@iitgn.ac.in'),
('Dasari Lohith', '24110100', '9347612589', '3rd', 'lohith_24110100@iitgn.ac.in'),
('Jahan Zaib', '24110140', '9567321480', '2nd', 'jahan_24110140@iitgn.ac.in'),
('Punit Singh Auluck', '25120034', '9785641230', '3rd', 'punit_25120034@iitgn.ac.in'),
('Devashish', '24110104', '9814762350', '2nd', 'devashish_24110104@iitgn.ac.in'),
('Suhani', '24110358', '9908456123', '3rd', 'suhani_24110358@iitgn.ac.in');

INSERT INTO Student_Mess_Allotment 
(student_id, mess_id, start_date, end_date, status) VALUES
(1, 1, '2026-01-01', NULL, 'active'),
(2, 2, '2026-01-01', NULL, 'active'),
(3, 1, '2026-01-01', NULL, 'active'),
(4, 3, '2026-01-01', NULL, 'active'),
(5, 2, '2026-01-01', NULL, 'active'),
(6, 4, '2026-01-01', NULL, 'active'),
(7, 3, '2026-01-01', NULL, 'active'),
(8, 1, '2026-01-01', NULL, 'active'),
(9, 2, '2026-01-01', NULL, 'active'),
(10, 4, '2026-01-01', NULL, 'active'),
(11, 1, '2026-01-01', NULL, 'active'),
(12, 3, '2026-01-01', NULL, 'active'),
(13, 2, '2026-01-01', NULL, 'active'),
(14, 4, '2026-01-01', NULL, 'active'),
(15, 1, '2026-01-01', NULL, 'active');

INSERT INTO QR_Codes 
(student_id, mess_id, qr_data, expiry_date) VALUES
(1,1,'QRDATA_1','2026-12-31'),
(2,2,'QRDATA_2','2026-12-31'),
(3,1,'QRDATA_3','2026-12-31'),
(4,3,'QRDATA_4','2026-12-31'),
(5,2,'QRDATA_5','2026-12-31'),
(6,4,'QRDATA_6','2026-12-31'),
(7,3,'QRDATA_7','2026-12-31'),
(8,1,'QRDATA_8','2026-12-31'),
(9,2,'QRDATA_9','2026-12-31'),
(10,4,'QRDATA_10','2026-12-31'),
(11,1,'QRDATA_11','2026-12-31'),
(12,3,'QRDATA_12','2026-12-31'),
(13,2,'QRDATA_13','2026-12-31'),
(14,4,'QRDATA_14','2026-12-31'),
(15,1,'QRDATA_15','2026-12-31');

INSERT INTO Attendance 
(student_id, mess_id, meal_id, scan_date, status) VALUES
(1,1,1,NOW(),'present'),
(2,2,2,NOW(),'present'),
(3,1,3,NOW(),'present'),
(4,3,4,NOW(),'present'),
(5,2,1,NOW(),'present'),
(6,4,2,NOW(),'present'),
(7,3,3,NOW(),'present'),
(8,1,4,NOW(),'present'),
(9,2,1,NOW(),'present'),
(10,4,2,NOW(),'present'),
(11,1,3,NOW(),'present'),
(12,3,4,NOW(),'present'),
(13,2,1,NOW(),'present'),
(14,4,2,NOW(),'present'),
(15,1,3,NOW(),'present');

INSERT INTO Wastage 
(student_id, mess_id, meal_id, date, quantity, reason) VALUES
(1,1,1,'2026-02-10',1,'Left early'),
(3,1,2,'2026-02-10',1,'Did not like food'),
(5,2,4,'2026-02-11',2,'Extra taken'),
(7,3,3,'2026-02-11',1,'Spilled'),
(10,4,1,'2026-02-12',1,'Health issue');

INSERT INTO Complaints
(student_id, mess_id, subject, message, status) VALUES
(1,1,'Food Quality','Food was too oily','pending'),
(4,3,'Hygiene','Tables were not clean','resolved'),
(6,4,'Late Service','Dinner served late','pending'),
(9,2,'Taste Issue','Lunch was too spicy','pending');

INSERT INTO Mess_Change_Requests
(student_id, current_mess_id, requested_mess_id, status) VALUES
(3,1,2,'pending'),
(6,4,1,'approved'),
(8,1,3,'rejected');

INSERT INTO Admin_Users
(username, password_hash, role, mess_id) VALUES
('superadmin','hashed_password_1','superadmin',NULL),
('manager_jaiswal','hashed_password_2','mess_manager',1),
('manager_mohani','hashed_password_3','mess_manager',2),
('manager_arbacus','hashed_password_4','mess_manager',3),
('manager_bhopal','hashed_password_5','mess_manager',4);

INSERT INTO Transactions 
(mess_id, meal_id, guest_name, amount) VALUES
(1, 1, 'Rahul Mehta', 53.00),
(2, 2, 'Sneha Kapoor', 73.00),
(3, 4, 'Amit Kulkarni', 73.00),
(4, 3, 'Neha Sharma', 37.00),
(1, 2, 'Vikas Rao', 73.00),
(2, 1, 'Priya Desai', 53.00),
(3, 3, 'Arjun Nair', 37.00),
(4, 4, 'Meera Iyer', 73.00);

DROP TABLE IF EXISTS Bills;

DROP TRIGGER IF EXISTS generate_bill_number;
DELIMITER $$

CREATE TRIGGER generate_bill_number
AFTER INSERT ON Transactions
FOR EACH ROW
BEGIN
    UPDATE Transactions
    SET bill_number = CONCAT('BILL', LPAD(NEW.trans_id, 4, '0'))
    WHERE trans_id = NEW.trans_id;
END$$

DELIMITER ;


INSERT INTO Transactions (mess_id, meal_id, guest_name, amount)
VALUES (1, 1, 'Test Guest', 53.00);

SELECT trans_id, bill_number FROM Transactions ORDER BY trans_id DESC LIMIT 1;

ALTER TABLE QR_Codes
ADD CONSTRAINT unique_student_qr UNIQUE (student_id);
ALTER TABLE QR_Codes
ADD CONSTRAINT fk_qr_student
FOREIGN KEY (student_id)
REFERENCES Students(student_id)
ON DELETE CASCADE;
CREATE INDEX idx_qr_student ON QR_Codes(student_id);

SELECT trans_id, bill_number 
FROM Transactions 
ORDER BY trans_id DESC 
LIMIT 1;



SELECT * FROM students;


