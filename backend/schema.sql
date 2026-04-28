-- RICO Part Master — MySQL Migration Schema
-- Run this when switching from SQLite to MySQL

CREATE TABLE IF NOT EXISTS plants (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  code     VARCHAR(20) UNIQUE NOT NULL,
  name     VARCHAR(100) NOT NULL,
  location VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS materials (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  material_code      VARCHAR(20) UNIQUE NOT NULL,
  description        TEXT,
  plant_code         VARCHAR(20),
  storage_location   VARCHAR(20),
  unit_of_measure    VARCHAR(10),
  material_type      VARCHAR(20),
  material_group     VARCHAR(30),
  cycle_time_sec     FLOAT,
  box_quantity       INT DEFAULT 0,
  customer           VARCHAR(100),
  opn_number         VARCHAR(50),
  final_opn_code     VARCHAR(50),
  manufacturing_type VARCHAR(50),
  INDEX idx_plant (plant_code),
  INDEX idx_group (material_group)
);

CREATE TABLE IF NOT EXISTS parts (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  sl_no              INT,
  material_code      VARCHAR(20) UNIQUE NOT NULL,
  description        TEXT,
  plant_code         VARCHAR(20),
  storage_location   VARCHAR(20),
  unit_of_measure    VARCHAR(10),
  material_group     VARCHAR(30),
  cycle_time_sec     FLOAT,
  box_quantity       INT DEFAULT 0,
  customer           VARCHAR(100),
  opn_number         VARCHAR(50),
  final_opn_code     VARCHAR(50),
  manufacturing_type VARCHAR(50),
  total_produced     INT DEFAULT 0,
  status             VARCHAR(20) DEFAULT 'ENABLED',
  traceability_status VARCHAR(20) DEFAULT 'ENABLED',
  version            VARCHAR(50),
  registered_on      VARCHAR(30),
  registered_by      VARCHAR(100),
  revision_date      VARCHAR(30),
  revised_by         VARCHAR(100),
  INDEX idx_plant (plant_code),
  INDEX idx_group (material_group)
);

CREATE TABLE IF NOT EXISTS operations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  part_code  VARCHAR(20) NOT NULL,
  sr_no      INT,
  name       TEXT,
  type       VARCHAR(50),
  label      VARCHAR(50),
  rework     VARCHAR(100) DEFAULT 'No rework assigned',
  INDEX idx_part (part_code)
);

CREATE TABLE IF NOT EXISTS process_flow_diagrams (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  part_code   VARCHAR(20) NOT NULL,
  upload_date VARCHAR(30),
  version     VARCHAR(20),
  file_name   VARCHAR(200),
  file_path   VARCHAR(500),
  updated_by  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS inspection_sheets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  part_code   VARCHAR(20) NOT NULL,
  upload_date VARCHAR(30),
  version     VARCHAR(20),
  file_name   VARCHAR(200),
  file_path   VARCHAR(500),
  updated_by  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS control_plan_charts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  part_code   VARCHAR(20) NOT NULL,
  upload_date VARCHAR(30),
  version     VARCHAR(20),
  file_name   VARCHAR(200),
  file_path   VARCHAR(500),
  updated_by  VARCHAR(100)
);
