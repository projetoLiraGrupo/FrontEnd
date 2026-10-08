DROP DATABASE IF EXISTS relacionamento_endereco; 
CREATE DATABASE relacionamento_endereco; 
USE relacionamento_endereco; 

CREATE TABLE Aluno ( 
    idAluno INT PRIMARY KEY 
); 

CREATE TABLE Professor ( 
    idProfessor INT PRIMARY KEY 
); 

CREATE TABLE Administrador ( 
    idAdministrador INT PRIMARY KEY 
); 

CREATE TABLE Endereco ( 
    idEndereco INT PRIMARY KEY 
); 

CREATE TABLE UsuarioEndereco ( 
    idEndereco INT NOT NULL, 
    idAluno INT NULL, 
    idProfessor INT NULL, 
    idAdministrador INT NULL, 
    PRIMARY KEY (idEndereco, idAluno, idProfessor, idAdministrador), 
    FOREIGN KEY (idEndereco) REFERENCES Endereco(idEndereco), 
    FOREIGN KEY (idAluno) REFERENCES Aluno(idAluno), 
    FOREIGN KEY (idProfessor) REFERENCES Professor(idProfessor), 
    FOREIGN KEY (idAdministrador) REFERENCES Administrador(idAdministrador), 
    CONSTRAINT chk_pelo_menos_um_usuario_endereco CHECK ( 
        (idAluno IS NOT NULL) + (idProfessor IS NOT NULL) + (idAdministrador IS NOT NULL) = 1 
    ) 
); 

CREATE TABLE Aula ( 
    idAula INT NOT NULL, 
    idEndereco INT NULL, 
    idProfessor INT NOT NULL,  
    PRIMARY KEY (idAula, idEndereco, idProfessor), 
    FOREIGN KEY (idEndereco) REFERENCES Endereco(idEndereco), 
    FOREIGN KEY (idProfessor) REFERENCES Professor(idProfessor)
); 

CREATE TABLE AulaAluno ( 
    idProfessor INT NOT NULL, 
    idAula INT NOT NULL, 
    idAluno INT NOT NULL, 
    idEndereco INT NULL, 
    PRIMARY KEY (idAula, idAluno, idProfessor), 
	
    FOREIGN KEY (idAula, idEndereco, idProfessor) REFERENCES Aula(idAula, idEndereco, idProfessor),
    FOREIGN KEY (idAluno) REFERENCES Aluno(idAluno)
);
