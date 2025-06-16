Create Database GestionDocumental;

Use GestionDocumental;

-- Limpieza (para reiniciar si es necesario)
DROP TABLE IF EXISTS Documentos;
DROP TABLE IF EXISTS Procedimientos;
DROP TABLE IF EXISTS Subprocesos;
DROP TABLE IF EXISTS Direcciones;
DROP TABLE IF EXISTS Usuarios;

-- Tabla de Usuarios
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Rol NVARCHAR(50) NOT NULL,
    DireccionID INT NULL, -- Dirección a la que pertenece (aunque no sea jefe)
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);

-- Tabla de Direcciones
CREATE TABLE Direcciones (
    DireccionID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    JefeID INT NULL, -- El jefe de la dirección, si lo hay
    Secretaria NVARCHAR(100),
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);

-- Relación después de crear ambas tablas
ALTER TABLE Usuarios
ADD CONSTRAINT FK_Usuarios_Direccion
FOREIGN KEY (DireccionID) REFERENCES Direcciones(DireccionID);

-- Tabla de Subprocesos
CREATE TABLE Subprocesos (
    SubprocesoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    DireccionID INT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DireccionID) REFERENCES Direcciones(DireccionID)
);

-- Tabla de Procedimientos
CREATE TABLE Procedimientos (
    ProcedimientoID INT PRIMARY KEY IDENTITY(1,1),
    Titulo NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX),
    SubprocesoID INT NOT NULL,
    ResponsableID INT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimaModificacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SubprocesoID) REFERENCES Subprocesos(SubprocesoID),
    FOREIGN KEY (ResponsableID) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Documentos
CREATE TABLE Documentos (
    DocumentoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(200) NOT NULL,
    RutaArchivo NVARCHAR(500) NOT NULL,
    Tipo NVARCHAR(50),
    Tamanio INT,
    ProcedimientoID INT NOT NULL,
    Version NVARCHAR(20),
    FechaSubida DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProcedimientoID) REFERENCES Procedimientos(ProcedimientoID)
);


-- Insertar Dirección principal
INSERT INTO Direcciones (Nombre, Descripcion, Secretaria)
VALUES ('Dirección General de Recursos Humanos', 'Dirección central encargada de la gestión institucional del personal.', 'Lucía Torres');

-- Insertar Usuarios
INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol, DireccionID)
VALUES
-- Director de Personal (es parte de Dirección General de Recursos Humanos)
('Ana Pérez', 'ana.personal@institucion.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'Director de Personal', 1),

-- Director General RRHH (también de misma dirección)
('Marcos Rivas', 'marcos.rrhh@institucion.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'Director General de Recursos Humanos', 1),

-- SAF y OUM (no ligados a dirección específica)
('Sofía Aguilar', 'sofia.saf@institucion.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'SAF', NULL),
('Luis Ortega', 'luis.oum@institucion.edu.mx', '$2b$10$t6t0r1iwBx6X1nEk7wD0ue/IL78MmdebB8/4tEcNt9clnP0Mx1JV2', 'OUM', NULL);

-- Asignar jefe a la dirección (Director General de RRHH)
UPDATE Direcciones
SET JefeID = (SELECT UsuarioID FROM Usuarios WHERE Email = 'marcos.rrhh@institucion.edu.mx')
WHERE Nombre = 'Dirección General de Recursos Humanos';

-- Insertar Subprocesos
INSERT INTO Subprocesos (Nombre, Descripcion, DireccionID)
VALUES
('Reclutamiento y Selección', 'Gestión de vacantes y proceso de contratación', 1),
('Control de Asistencias', 'Registro y revisión de horarios laborales', 1);

-- Insertar Procedimientos
INSERT INTO Procedimientos (Titulo, Descripcion, SubprocesoID, ResponsableID)
VALUES
('Evaluación de Candidatos', 'Procedimiento para aplicar entrevistas y pruebas', 1,
 (SELECT UsuarioID FROM Usuarios WHERE Email = 'ana.personal@institucion.edu.mx')),

('Registro de Incidencias', 'Procedimiento para registrar faltas o retardos', 2,
 (SELECT UsuarioID FROM Usuarios WHERE Email = 'ana.personal@institucion.edu.mx'));

