-- Create Database
CREATE DATABASE IF NOT EXISTS DocumentManagement;
USE DocumentManagement;


-- Table cleanup (if needed) - Note: reverse order of creation
DROP TABLE IF EXISTS Documents;
DROP TABLE IF EXISTS Procedures;
DROP TABLE IF EXISTS Subprocesses;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Departments;

-- First create Departments (since Users depends on it)
CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    HeadID INT NULL,
    Secretariat VARCHAR(100),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (HeadID) REFERENCES Users(UserID)
);

-- Then create Users (since Departments exists now)
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    DepartmentID INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

-- Now update Departments to add the foreign key to Users
ALTER TABLE Departments
ADD FOREIGN KEY (HeadID) REFERENCES Users(UserID);

-- Then create Subprocesses (depends on Departments)
CREATE TABLE Subprocesses (
    SubprocessID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    DepartmentID INT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

-- Then create Procedures (depends on Subprocesses and Users)
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
    FOREIGN KEY (SubprocessID) REFERENCES Subprocesses(SubprocessID),
    FOREIGN KEY (ResponsibleID) REFERENCES Users(UserID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserID)
);

-- Finally create Documents (depends on Procedures)
CREATE TABLE documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  archivo LONGBLOB NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE document_versions (
  version_id INT AUTO_INCREMENT PRIMARY KEY,
  documento_id INT NOT NULL,
  archivo LONGBLOB NOT NULL,
  version_number INT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documento_id) REFERENCES documentos(id)
);



-- Insert initial data (with circular dependency workaround)
-- First insert Users without DepartmentID
INSERT INTO Users (Name, Email, PasswordHash, Role, DepartmentID)
VALUES
('Ana Pérez', 'ana.personal@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'Personnel Director', NULL),
('Marcos Rivas', 'marcos.hr@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'General HR Director', NULL),
('Sofía Aguilar', 'sofia.saf@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'SAF', NULL),
('Luis Ortega', 'luis.oum@institution.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'OUM', NULL);

-- Then insert Department
INSERT INTO Departments (Name, Description, Secretariat, HeadID)
VALUES ('General Human Resources Directorate', 'Central department responsible for institutional personnel management.', 'Lucía Torres', 
        (SELECT UserID FROM Users WHERE Email = 'marcos.hr@institution.edu.mx'));

-- Now update Users with DepartmentID
UPDATE Users 
SET DepartmentID = (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')
WHERE Email IN ('ana.personal@institution.edu.mx', 'marcos.hr@institution.edu.mx');

-- Insert Subprocesses
INSERT INTO Subprocesses (Name, Description, DepartmentID)
VALUES
('Recruitment and Selection', 'Vacancy management and hiring process', 1),
('Attendance Control', 'Work schedule registration and review', 1);

-- Insert Procedures
INSERT INTO Procedures (Title, Description, SubprocessID, ResponsibleID, CreatedBy)
VALUES
('Candidate Evaluation', 'Procedure for conducting interviews and tests', 1,
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx')),

('Incident Registration', 'Procedure for recording absences or delays', 2,
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'ana.personal@institution.edu.mx'));