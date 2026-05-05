const { Pool } = require("pg");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PGPOOL_MAX || 10),
      idleTimeoutMillis: 30000,
    }
  : {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      database: process.env.PGDATABASE || "postgres",
      max: Number(process.env.PGPOOL_MAX || 10),
      idleTimeoutMillis: 30000,
    };

if (!process.env.DATABASE_URL && process.env.PGPASSWORD) {
  poolConfig.password = process.env.PGPASSWORD;
}

const pool = new Pool(poolConfig);

function normalizeQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(sql, params = []) {
  const result = await pool.query(normalizeQuery(sql), params);
  return { rows: result.rows, rowCount: result.rowCount };
}

async function run(sql, params = []) {
  const result = await pool.query(normalizeQuery(sql), params);
  return { rows: result.rows, rowCount: result.rowCount, changes: result.rowCount };
}

module.exports = { query, run, pool };
