const db = require("../config/db");

const allowedStatuses = new Set(["RUNNING", "STOPPED", "IDLE"]);

function cleanStatus(status) {
  const normalized = String(status || "IDLE").trim().toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : "IDLE";
}

function cleanMachine(row) {
  return {
    id: row.id,
    name: row.name || "Unknown machine",
    category: row.category || "Uncategorized",
    status: cleanStatus(row.status),
    part: row.part || "No part assigned",
    operation_no: row.operation_no || null,
    last_updated: row.last_updated || null,
  };
}

// GET /api/machines
const getMachines = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        m.id,
        COALESCE(m.name::text, m.machine_code::text, CONCAT('Machine ', m.id)) AS name,
        COALESCE(m.category::text, 'Uncategorized') AS category,
        COALESCE(ms.status::text, 'IDLE') AS status,
        COALESCE(p.description::text, ms.part_code::text, 'No part assigned') AS part,
        ms.operation_no,
        ms.updated_at AS last_updated
      FROM machines m
      LEFT JOIN (
        SELECT DISTINCT ON (machine_id) *
        FROM machine_status
        ORDER BY machine_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
      ) ms ON ms.machine_id = m.id
      LEFT JOIN parts p ON p.material_code = ms.part_code
      ORDER BY name ASC
    `);

    res.json(rows.map(cleanMachine));
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to load machines",
      error: err.message,
    });
  }
};

// GET /api/machines/:id/status-history
const getMachineStatusHistory = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         id,
         machine_id,
         status,
         part_code,
         operation_no,
         updated_at,
         created_at
       FROM machine_status
       WHERE machine_id = ?
       ORDER BY updated_at ASC NULLS LAST, created_at ASC NULLS LAST, id ASC`,
      [req.params.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to load machine status history",
      error: err.message,
    });
  }
};

module.exports = { getMachines, getMachineStatusHistory };
