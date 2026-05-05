-- RICO Part Master - PostgreSQL schema
-- Run in pgAdmin Query Tool or with:
-- psql "$DATABASE_URL" -f backend/schema.sql

CREATE TABLE IF NOT EXISTS plants (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  location    VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id                  BIGSERIAL PRIMARY KEY,
  material_code       VARCHAR(40) UNIQUE NOT NULL,
  description         TEXT,
  plant_code          VARCHAR(20),
  storage_location    VARCHAR(20),
  unit_of_measure     VARCHAR(10),
  material_type       VARCHAR(20),
  material_group      VARCHAR(30),
  cycle_time_sec      NUMERIC(10,2),
  box_quantity        INTEGER DEFAULT 0,
  customer            VARCHAR(100),
  opn_number          VARCHAR(50),
  final_opn_code      VARCHAR(50),
  manufacturing_type  VARCHAR(50),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parts (
  id                   BIGSERIAL PRIMARY KEY,
  sl_no                INTEGER,
  material_code        VARCHAR(40) UNIQUE NOT NULL,
  description          TEXT,
  plant_code           VARCHAR(20),
  storage_location     VARCHAR(20),
  unit_of_measure      VARCHAR(10),
  material_group       VARCHAR(30),
  cycle_time_sec       NUMERIC(10,2),
  box_quantity         INTEGER DEFAULT 0,
  customer             VARCHAR(100),
  opn_number           VARCHAR(50),
  final_opn_code       VARCHAR(50),
  manufacturing_type   VARCHAR(50),
  total_produced       INTEGER DEFAULT 0,
  status               VARCHAR(20) DEFAULT 'ENABLED',
  traceability_status  VARCHAR(20) DEFAULT 'ENABLED',
  version              VARCHAR(50),
  registered_on        VARCHAR(30),
  registered_by        VARCHAR(100),
  revision_date        VARCHAR(30),
  revised_by           VARCHAR(100),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations (
  id         BIGSERIAL PRIMARY KEY,
  part_code  VARCHAR(40) NOT NULL REFERENCES parts(material_code) ON DELETE CASCADE,
  sr_no      INTEGER,
  name       TEXT,
  type       VARCHAR(50),
  label      VARCHAR(50),
  rework     VARCHAR(100) DEFAULT 'No rework assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS process_flow_diagrams (
  id           BIGSERIAL PRIMARY KEY,
  part_code    VARCHAR(40) NOT NULL REFERENCES parts(material_code) ON DELETE CASCADE,
  upload_date  VARCHAR(30),
  version      VARCHAR(20),
  file_name    VARCHAR(200),
  file_path    VARCHAR(500),
  updated_by   VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_sheets (
  id           BIGSERIAL PRIMARY KEY,
  part_code    VARCHAR(40) NOT NULL REFERENCES parts(material_code) ON DELETE CASCADE,
  upload_date  VARCHAR(30),
  version      VARCHAR(20),
  file_name    VARCHAR(200),
  file_path    VARCHAR(500),
  updated_by   VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_plan_charts (
  id           BIGSERIAL PRIMARY KEY,
  part_code    VARCHAR(40) NOT NULL REFERENCES parts(material_code) ON DELETE CASCADE,
  upload_date  VARCHAR(30),
  version      VARCHAR(20),
  file_name    VARCHAR(200),
  file_path    VARCHAR(500),
  updated_by   VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_plant ON materials(plant_code);
CREATE INDEX IF NOT EXISTS idx_materials_group ON materials(material_group);
CREATE INDEX IF NOT EXISTS idx_parts_plant ON parts(plant_code);
CREATE INDEX IF NOT EXISTS idx_parts_group ON parts(material_group);
CREATE INDEX IF NOT EXISTS idx_operations_part ON operations(part_code);

-- Optional staging tables matching the raw PostgreSQL imports shown in pgAdmin.
CREATE TABLE IF NOT EXISTS parts_master_raw (
  old_equipment TEXT,
  s4hana TEXT,
  description TEXT,
  plant_code TEXT,
  asset TEXT,
  cost_center TEXT
);

CREATE TABLE IF NOT EXISTS machine_master_raw (
  old_equipment TEXT,
  s4hana TEXT,
  description TEXT,
  plant_code TEXT,
  asset TEXT,
  cost_center TEXT
);

CREATE TABLE IF NOT EXISTS machines (
  id           BIGSERIAL PRIMARY KEY,
  machine_code VARCHAR(80) UNIQUE NOT NULL,
  name         VARCHAR(200),
  category     VARCHAR(80),
  plant_code   VARCHAR(20),
  asset        TEXT,
  cost_center  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machine_status (
  id           BIGSERIAL PRIMARY KEY,
  machine_id   BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'IDLE',
  part_code    VARCHAR(40),
  operation_no VARCHAR(50),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_machines_plant ON machines(plant_code);
CREATE INDEX IF NOT EXISTS idx_machine_status_machine_updated ON machine_status(machine_id, updated_at DESC, id DESC);

-- If you import into parts_master_raw first, this copies unique rows into the app table.
INSERT INTO parts (
  sl_no,
  material_code,
  description,
  plant_code,
  storage_location,
  unit_of_measure,
  material_group,
  cycle_time_sec,
  customer,
  manufacturing_type,
  status,
  traceability_status
)
SELECT
  NULLIF(sl_no::text, '')::integer,
  NULLIF(material, '') AS material_code,
  material_description,
  plant,
  storage_location,
  base_unit_of_measure,
  material_group,
  NULLIF(cycle_time::text, '')::numeric,
  customer,
  manufacturing_type,
  'ENABLED',
  'ENABLED'
FROM parts_master_raw
WHERE NULLIF(material, '') IS NOT NULL
ON CONFLICT (material_code) DO NOTHING;

INSERT INTO plants (code, name)
SELECT DISTINCT plant_code, CONCAT(plant_code, ' Plant')
FROM parts
WHERE plant_code IS NOT NULL AND plant_code <> ''
ON CONFLICT (code) DO NOTHING;

-- If you import into machine_master_raw first, this copies unique rows into the app table.
INSERT INTO machines (machine_code, name, category, plant_code, asset, cost_center)
SELECT DISTINCT ON (machine_code)
  machine_code,
  name,
  category,
  plant_code,
  asset,
  cost_center
FROM (
  SELECT
    COALESCE(NULLIF(old_equipment, ''), NULLIF(s4hana, '')) AS machine_code,
    COALESCE(NULLIF(description, ''), COALESCE(NULLIF(old_equipment, ''), NULLIF(s4hana, ''))) AS name,
    'Machine' AS category,
    NULLIF(plant_code, '') AS plant_code,
    NULLIF(asset, '') AS asset,
    NULLIF(cost_center, '') AS cost_center
  FROM machine_master_raw
  WHERE COALESCE(NULLIF(old_equipment, ''), NULLIF(s4hana, '')) IS NOT NULL
) raw_machines
ORDER BY machine_code, name NULLS LAST
ON CONFLICT (machine_code) DO UPDATE SET
  name = EXCLUDED.name,
  plant_code = EXCLUDED.plant_code,
  asset = EXCLUDED.asset,
  cost_center = EXCLUDED.cost_center;
