/**
 * db.js — SQLite via sql.js (pure JS, zero native compilation)
 * 
 * TO SWITCH TO MYSQL LATER:
 *   1. npm install mysql2
 *   2. Replace this file with:
 *        const mysql = require('mysql2/promise');
 *        const pool = mysql.createPool({ host, user, password, database });
 *        const query = (sql, params) => pool.query(sql, params).then(([rows]) => ({ rows }));
 *   3. Controllers stay 100% unchanged
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../rico_part_master.db');

let _db = null;

async function getDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_FILE);
  _db = new SQL.Database(fileBuffer);
  ensureSheetColumns(_db);
  ensurePartColumns(_db);
  console.log('✅ SQLite DB loaded');
  return _db;
}

function ensureSheetColumns(db) {
  const tables = ['process_flow_diagrams', 'inspection_sheets', 'control_plan_charts'];
  let changed = false;

  for (const table of tables) {
    const result = db.exec(`PRAGMA table_info(${table})`);
    const columns = result[0]?.values.map((row) => row[1]) || [];
    if (!columns.includes('file_path')) {
      db.run(`ALTER TABLE ${table} ADD COLUMN file_path TEXT`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
  }
}

function ensurePartColumns(db) {
  const result = db.exec('PRAGMA table_info(parts)');
  const columns = result[0]?.values.map((row) => row[1]) || [];
  let changed = false;

  if (!columns.includes('box_quantity')) {
    db.run('ALTER TABLE parts ADD COLUMN box_quantity INTEGER DEFAULT 0');
    changed = true;
  }

  if (!columns.includes('status')) {
    db.run("ALTER TABLE parts ADD COLUMN status TEXT DEFAULT 'ENABLED'");
    changed = true;
  }

  if (!columns.includes('traceability_status')) {
    db.run("ALTER TABLE parts ADD COLUMN traceability_status TEXT DEFAULT 'ENABLED'");
    changed = true;
  }

  const missingStatusRows = db.exec("SELECT COUNT(*) AS count FROM parts WHERE status IS NULL OR TRIM(status) = ''");
  const missingStatusCount = Number(missingStatusRows[0]?.values?.[0]?.[0] || 0);
  if (missingStatusCount > 0) {
    db.run("UPDATE parts SET status = 'ENABLED' WHERE status IS NULL OR TRIM(status) = ''");
    changed = true;
  }

  const missingTraceabilityRows = db.exec("SELECT COUNT(*) AS count FROM parts WHERE traceability_status IS NULL OR TRIM(traceability_status) = ''");
  const missingTraceabilityCount = Number(missingTraceabilityRows[0]?.values?.[0]?.[0] || 0);
  if (missingTraceabilityCount > 0) {
    db.run("UPDATE parts SET traceability_status = 'ENABLED' WHERE traceability_status IS NULL OR TRIM(traceability_status) = ''");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
  }
}

async function query(sql, params = []) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return { rows };
}

async function run(sql, params = []) {
  const db = await getDb();
  db.run(sql, params);
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
  return { changes: db.getRowsModified() };
}

module.exports = { query, run };
