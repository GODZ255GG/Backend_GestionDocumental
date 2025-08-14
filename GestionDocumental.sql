-- Create Database
CREATE DATABASE IF NOT EXISTS DocumentManagement;
USE DocumentManagement;

-- Drop tables in reverse order to avoid dependency issues
DROP TABLE IF EXISTS DocumentVersions;
DROP TABLE IF EXISTS Documents;
DROP TABLE IF EXISTS Procedures;
DROP TABLE IF EXISTS Subprocesses;
DROP TABLE IF EXISTS UserRoles;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Departments;
DROP TABLE IF EXISTS Secretariats;

-- Create Secretariats table
CREATE TABLE Secretariats (
    SecretariatID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Departments table
CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    HeadID INT NULL,
    SecretariatID INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SecretariatID) REFERENCES Secretariats(SecretariatID) ON DELETE CASCADE
);

-- Create Users table
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    DepartmentID INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID) ON DELETE SET NULL
);

-- Add foreign key for Departments.HeadID (handling circular dependency)
ALTER TABLE Departments
ADD CONSTRAINT fk_department_head
FOREIGN KEY (HeadID) REFERENCES Users(UserID) ON DELETE SET NULL;

-- Create Roles table
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY AUTO_INCREMENT,
    RoleName VARCHAR(50) NOT NULL,
    CanDeleteDepartment BOOLEAN DEFAULT FALSE,
    CanDeleteSubprocess BOOLEAN DEFAULT FALSE,
    CanManageProcedures BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create UserRoles junction table
CREATE TABLE UserRoles (
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    PRIMARY KEY (UserID, RoleID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE
);

-- Create Subprocesses table
CREATE TABLE Subprocesses (
    SubprocessID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    DepartmentID INT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID) ON DELETE CASCADE
);

-- Create Procedures table
CREATE TABLE Procedures (
    ProcedureID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    SubprocessID INT NOT NULL,
    ResponsibleID INT NOT NULL,
    Status ENUM('Draft', 'Active', 'Pending', 'Archived') DEFAULT 'Draft',
    CreatedBy INT,
    ModifiedBy INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SubprocessID) REFERENCES Subprocesses(SubprocessID) ON DELETE CASCADE,
    FOREIGN KEY (ResponsibleID) REFERENCES Users(UserID) ON DELETE RESTRICT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- Create Documents table
CREATE TABLE Documents (
    DocumentID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    File LONGBLOB NOT NULL,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create DocumentVersions table
CREATE TABLE DocumentVersions (
    VersionID INT AUTO_INCREMENT PRIMARY KEY,
    DocumentID INT NOT NULL,
    File LONGBLOB NOT NULL,
    VersionNumber INT NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DocumentID) REFERENCES Documents(DocumentID) ON DELETE CASCADE
);

-- Insert initial data
-- Insert Secretariats
INSERT INTO Secretariats (Name, Description)
VALUES 
('Main Secretariat', 'Oversees HR and administrative departments'),
('SAF Secretariat', 'Oversees financial and administrative functions');

-- Insert Departments
INSERT INTO Departments (Name, Description, SecretariatID, HeadID)
VALUES 
('General Human Resources Directorate', 'Central department for personnel management', 
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'Main Secretariat'), NULL),
('Financial Directorate', 'Manages financial operations', 
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'SAF Secretariat'), NULL);

-- Insert Users
INSERT INTO Users (Name, Email, PasswordHash, DepartmentID)
VALUES
('Ana Pérez', 'ana.personal@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Marcos Rivas', 'marcos.hr@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Sofía Aguilar', 'sofia.saf@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'Financial Directorate')),
('Luis Ortega', 'luis.oum@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', NULL);

-- Store DepartmentIDs for updates
SET @HRDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate');
SET @FinanceDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'Financial Directorate');

-- Update Departments to set HeadID
UPDATE Departments 
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'marcos.hr@institution.edu.mx')
WHERE DepartmentID = @HRDeptID;

UPDATE Departments 
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'sofia.saf@institution.edu.mx')
WHERE DepartmentID = @FinanceDeptID;

-- Insert Roles
INSERT INTO Roles (RoleName, CanDeleteDepartment, CanDeleteSubprocess, CanManageProcedures)
VALUES
('General HR Director', TRUE, TRUE, TRUE),
('Personnel Director', FALSE, TRUE, TRUE),
('SAF Director', TRUE, TRUE, TRUE),
('OUM', FALSE, FALSE, TRUE);

-- Insert UserRoles
INSERT INTO UserRoles (UserID, RoleID)
VALUES
((SELECT UserID FROM Users WHERE Email = 'marcos.hr@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'General HR Director')),
((SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'Personnel Director')),
((SELECT UserID FROM Users WHERE Email = 'sofia.saf@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'SAF Director')),
((SELECT UserID FROM Users WHERE Email = 'luis.oum@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'OUM'));

-- Insert Subprocesses
INSERT INTO Subprocesses (Name, Description, DepartmentID)
VALUES
('Recruitment and Selection', 'Vacancy management and hiring process', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Attendance Control', 'Work schedule registration and review', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Budget Management', 'Financial budgeting and allocation', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'Financial Directorate'));

-- Insert Procedures
INSERT INTO Procedures (Title, Description, SubprocessID, ResponsibleID, CreatedBy)
VALUES
('Candidate Evaluation', 'Procedure for conducting interviews and tests', 
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Recruitment and Selection'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx')),
('Incident Registration', 'Procedure for recording absences or delays', 
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Attendance Control'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx')),
('Budget Approval', 'Procedure for approving financial budgets', 
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Budget Management'),
 (SELECT UserID FROM Users WHERE Email = 'sofia.saf@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'sofia.saf@institution.edu.mx'));