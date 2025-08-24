-- Create Database
CREATE DATABASE IF NOT EXISTS DocumentManagement;
USE DocumentManagement;

-- Drop tables in reverse order to avoid dependency issues
DROP TABLE IF EXISTS ProcedureDocuments;
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
    Status ENUM('Created', 'In progress', 'Under review', 'Published', 'Archived') DEFAULT 'Created',
    CreatedBy INT,
    ModifiedBy INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SubprocessID) REFERENCES Subprocesses(SubprocessID) ON DELETE CASCADE,
    FOREIGN KEY (ResponsibleID) REFERENCES Users(UserID) ON DELETE RESTRICT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- Create Documents table (sin File directo, para versioning)
CREATE TABLE Documents (
    DocumentID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description VARCHAR(500),
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

-- Create ProcedureDocuments junction table (nueva para relación many-to-many)
CREATE TABLE ProcedureDocuments (
    ProcedureID INT NOT NULL,
    DocumentID INT NOT NULL,
    AddedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ProcedureID, DocumentID),
    FOREIGN KEY (ProcedureID) REFERENCES Procedures(ProcedureID) ON DELETE CASCADE,
    FOREIGN KEY (DocumentID) REFERENCES Documents(DocumentID) ON DELETE CASCADE
);

-- Insert initial data (igual que antes)
-- Insert Secretariats
INSERT INTO Secretariats (Name, Description)
VALUES 
('Secretaria Académica', 'La Secretaría Académica es la responsable de planear, organizar, dirigir y supervisar las actividades académicas de la Universidad Veracruzana, así como dirigir las actividades docentes y de investigación, propiciando acciones de vinculación entre las mismas para el logro de la superación académica universitaria.'),
('Secretaria de Administracción y Finanzas', 'La Secretaría de Administración y Finanzas (SAF), es responsable de coordinar la adecuada administración de los recursos humanos, financieros y materiales, para proporcionar apoyo y servicio eficiente a las áreas que contribuyen directamente a los fines de la Universidad, así como de planear, supervisar y vigilar la operación financiera de la Universidad.'),
('Secretaria de Desarrollo Institucional','La Secretaría de Desarrollo Institucional es la dependencia encargada de contribuir al logro de los fines de la Universidad Veracruzana; de conservar, crear y transmitir la cultura, mediante la definición de estrategias y la coordinación de los titulares de las dependencias a su cargo.');


-- Insert Departments
INSERT INTO Departments (Name, Description, SecretariatID, HeadID)
VALUES 
('General Human Resources Directorate', 'La Dirección General de Recursos Humanos tendrá a su cargo la administración del personal de la Universidad Veracruzana.', 
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'Main Secretariat'), NULL),
('Financial Directorate', 'Manages financial operations', 
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'SAF Secretariat'), NULL);

-- Insert Users
INSERT INTO Users (Name, Email, PasswordHash, DepartmentID)
VALUES
('Dra. Itzel Alessandra Reyes Flores', 'itreyes@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Lic. Rosa Aidé Villalobos Betancourt', 'rovillalobos@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate')),
('Mtra. Lizbeth Margarita Viveros Cancino', 'lizviveros@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 
 (SELECT DepartmentID FROM Departments WHERE Name = 'Financial Directorate')),
('Lic. Álvaro Gabriel Hernández', 'agabriel@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', NULL);

-- Store DepartmentIDs for updates
SET @HRDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'General Human Resources Directorate');
SET @FinanceDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'Financial Directorate');

-- Update Departments to set HeadID
UPDATE Departments 
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'rosa.hr@institution.edu.mx')
WHERE DepartmentID = @HRDeptID;

UPDATE Departments 
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'bertha.saf@institution.edu.mx')
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
((SELECT UserID FROM Users WHERE Email = 'rosa.hr@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'General HR Director')),
((SELECT UserID FROM Users WHERE Email = 'alessandra.personal@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'Personnel Director')),
((SELECT UserID FROM Users WHERE Email = 'bertha.saf@institution.edu.mx'), 
 (SELECT RoleID FROM Roles WHERE RoleName = 'SAF Director')),
((SELECT UserID FROM Users WHERE Email = 'alvaro.oum@institution.edu.mx'), 
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
 (SELECT UserID FROM Users WHERE Email = 'alessandra.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'alessandra.personal@institution.edu.mx')),
('Incident Registration', 'Procedure for recording absences or delays', 
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Attendance Control'),
 (SELECT UserID FROM Users WHERE Email = 'alessandra.personal@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'alessandra.personal@institution.edu.mx')),
('Budget Approval', 'Procedure for approving financial budgets', 
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Budget Management'),
 (SELECT UserID FROM Users WHERE Email = 'bertha.saf@institution.edu.mx'),
 (SELECT UserID FROM Users WHERE Email = 'bertha.saf@institution.edu.mx'));