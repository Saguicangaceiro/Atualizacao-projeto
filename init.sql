CREATE DATABASE IF NOT EXISTS dutyfinder;
USE dutyfinder;

CREATE TABLE IF NOT EXISTS sectors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  costCenter VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('MAINTENANCE', 'WAREHOUSE', 'PURCHASING', 'IT_ADMIN', 'SUPER_ADMIN', 'USER', 'GATEHOUSE') NOT NULL,
  hasPortalAccess BOOLEAN DEFAULT FALSE,
  extension VARCHAR(20),
  sectorId VARCHAR(36),
  FOREIGN KEY (sectorId) REFERENCES sectors(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  quantity DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(10),
  minThreshold DECIMAL(10,2) DEFAULT 5
);

CREATE TABLE IF NOT EXISTS extensions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number VARCHAR(20) NOT NULL,
  sector VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  priority ENUM('Baixa', 'Média', 'Alta') NOT NULL,
  status VARCHAR(30) NOT NULL,
  requesterName VARCHAR(100),
  createdAt BIGINT
);

-- Inserir usuário mestre inicial
INSERT INTO sectors (id, name, costCenter) VALUES ('default-sector', 'TI', '1001');
INSERT INTO users (id, username, password, name, role, hasPortalAccess, sectorId) 
VALUES ('0', 'super', '123', 'Super Admin', 'SUPER_ADMIN', TRUE, 'default-sector');
