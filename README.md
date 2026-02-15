# 🍽️ Smart Mess Management System (DBMS Project)

A complete Database Management System (DBMS) project designed to manage hostel mess operations efficiently.  
This system handles student registration, mess allotment, QR-based attendance, guest billing, complaints, and revenue tracking.

---

## 📌 Project Overview

The **Smart Mess Management System** is designed to automate and optimize mess operations in colleges.  

It provides:

- Student mess allocation
- QR-based meal attendance
- Guest billing with auto-generated bill numbers
- Wastage tracking
- Complaint management
- Admin controls
- Revenue tracking

This project is built using **MySQL** with proper normalization, constraints, triggers, foreign keys, and indexing.

---

## 🗂️ Database Modules

### 👨‍🎓 1. Students
Stores student details.
- Unique Roll Number
- Unique Email
- Year & Branch
- Indexed for performance

---

### 🍛 2. Messes
Stores mess information.
- Mess Name
- Capacity

---

### 🔁 3. Student_Mess_Allotment
Tracks which student is assigned to which mess.
- Start Date
- End Date
- Ensures only one active allotment

---

### 🍽️ 4. Meals
Stores meal types and prices.
- Breakfast
- Lunch
- Dinner
- Snack
- Price per meal

---

### 📲 5. QR_Codes
Stores QR assignment per student.
- One QR per student (UNIQUE constraint)
- Linked using Foreign Key
- Auto-deletes if student is removed

---

### 📊 6. Attendance
Tracks QR-based meal scans.
- Student ID
- Meal ID
- Scan Date
- Prevents duplicate scanning

---

### 💸 7. Transactions (Guest Billing)
Handles guest meal billing.

Features:
- Auto-generated `bill_number`
- Unique bill format: `BILL0001`
- Trigger-based automation
- Revenue tracking per mess

---

### 🧾 Bill Number Automation

Implemented using MySQL Trigger:

```sql
CREATE TRIGGER generate_bill_number
AFTER INSERT ON Transactions
FOR EACH ROW
BEGIN
    UPDATE Transactions
    SET bill_number = CONCAT('BILL', LPAD(NEW.trans_id, 4, '0'))
    WHERE trans_id = NEW.trans_id;
END;
