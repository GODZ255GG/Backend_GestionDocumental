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

-- Insert initial data (consistente con nombres reales y emails @uv.mx)
-- Insert Secretariats
INSERT INTO Secretariats (Name, Description)
VALUES
('Secretaria Académica', 'La Secretaría Académica es la responsable de planear, organizar, dirigir y supervisar las actividades académicas de la Universidad Veracruzana, así como dirigir las actividades docentes y de investigación, propiciando acciones de vinculación entre las mismas para el logro de la superación académica universitaria.'),
('Secretaria de Administracción y Finanzas', 'La Secretaría de Administración y Finanzas (SAF), es responsable de coordinar la adecuada administración de los recursos humanos, financieros y materiales, para proporcionar apoyo y servicio eficiente a las áreas que contribuyen directamente a los fines de la Universidad, así como de planear, supervisar y vigilar la operación financiera de la Universidad.'),
('Secretaria de Desarrollo Institucional', 'La Secretaría de Desarrollo Institucional es la dependencia encargada de contribuir al logro de los fines de la Universidad Veracruzana; de conservar, crear y transmitir la cultura, mediante la definición de estrategias y la coordinación de los titulares de las dependencias a su cargo.');

-- Insert Departments (usando nombres correctos de Secretariats)
INSERT INTO Departments (Name, Description, SecretariatID, HeadID)
VALUES
('Dirección General de Recursos Humanos', 'La Dirección General de Recursos Humanos tendrá a su cargo la administración del personal de la Universidad Veracruzana.',
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'Secretaria de Administracción y Finanzas'), NULL),
('Dirección de Recursos Financieros', 'Gestiona operaciones financieras.',
 (SELECT SecretariatID FROM Secretariats WHERE Name = 'Secretaria de Administracción y Finanzas'), NULL);

-- Insert Users (emails consistentes @uv.mx)
INSERT INTO Users (Name, Email, PasswordHash, DepartmentID)
VALUES
('Dra. Itzel Alessandra Reyes Flores', 'itreyes@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección General de Recursos Humanos')),
('Lic. Rosa Aidé Villalobos Betancourt', 'rovillalobos@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección General de Recursos Humanos')),
('Mtra. Lizbeth Margarita Viveros Cancino', 'lizviveros@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección de Recursos Financieros')),
('Lic. Álvaro Gabriel Hernández', 'agabriel@uv.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', NULL);

-- Store DepartmentIDs for updates
SET @HRDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección General de Recursos Humanos');
SET @FinanceDeptID = (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección de Recursos Financieros');

-- Update Departments to set HeadID (emails consistentes @uv.mx)
UPDATE Departments
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'rovillalobos@uv.mx')
WHERE DepartmentID = @HRDeptID;

UPDATE Departments
SET HeadID = (SELECT UserID FROM Users WHERE Email = 'lizviveros@uv.mx')
WHERE DepartmentID = @FinanceDeptID;

-- Insert Roles
INSERT INTO Roles (RoleName, CanDeleteDepartment, CanDeleteSubprocess, CanManageProcedures)
VALUES
('Director General RH', TRUE, TRUE, TRUE),
('Director Personal', FALSE, TRUE, TRUE),
('Director SAF', TRUE, TRUE, TRUE),
('OUM', FALSE, FALSE, TRUE);

-- Insert UserRoles (emails consistentes @uv.mx)
INSERT INTO UserRoles (UserID, RoleID)
VALUES
((SELECT UserID FROM Users WHERE Email = 'rovillalobos@uv.mx'),
 (SELECT RoleID FROM Roles WHERE RoleName = 'Director General RH')),
((SELECT UserID FROM Users WHERE Email = 'itreyes@uv.mx'),
 (SELECT RoleID FROM Roles WHERE RoleName = 'Director Personal')),
((SELECT UserID FROM Users WHERE Email = 'lizviveros@uv.mx'),
 (SELECT RoleID FROM Roles WHERE RoleName = 'Director SAF')),
((SELECT UserID FROM Users WHERE Email = 'agabriel@uv.mx'),
 (SELECT RoleID FROM Roles WHERE RoleName = 'OUM'));

-- Insert Subprocesses
INSERT INTO Subprocesses (Name, Description, DepartmentID)
VALUES
('Reclutamiento y Selección', 'Gestión de vacantes y proceso de contratación',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección General de Recursos Humanos')),
('Control de Asistencia', 'Registro y revisión de horarios de trabajo',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección General de Recursos Humanos')),
('Gestión de Presupuesto', 'Presupuestación y asignación financiera',
 (SELECT DepartmentID FROM Departments WHERE Name = 'Dirección de Recursos Financieros'));

-- Insert Procedures
INSERT INTO Procedures (Title, Description, SubprocessID, ResponsibleID, CreatedBy)
VALUES
('Evaluación de Candidatos', 'Procedimiento para realizar entrevistas y pruebas',
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Reclutamiento y Selección'),
 (SELECT UserID FROM Users WHERE Email = 'itreyes@uv.mx'),
 (SELECT UserID FROM Users WHERE Email = 'itreyes@uv.mx')),
('Registro de Incidencias', 'Procedimiento para registrar ausencias o retrasos',
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Control de Asistencia'),
 (SELECT UserID FROM Users WHERE Email = 'itreyes@uv.mx'),
 (SELECT UserID FROM Users WHERE Email = 'itreyes@uv.mx')),
('Aprobación de Presupuesto', 'Procedimiento para aprobar presupuestos financieros',
 (SELECT SubprocessID FROM Subprocesses WHERE Name = 'Gestión de Presupuesto'),
 (SELECT UserID FROM Users WHERE Email = 'lizviveros@uv.mx'),
 (SELECT UserID FROM Users WHERE Email = 'lizviveros@uv.mx'));
