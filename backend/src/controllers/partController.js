const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

// GET /api/plants
const getAllPlants = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM plants ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parts?plant=GURUGRAM&search=brake&group=FINISHED&status=ENABLED&page=1&limit=50
const getPartsByPlant = async (req, res) => {
  try {
    const { plant, search, group, status, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];

    let whereClauses = [];

    if (plant) {
      whereClauses.push('p.plant_code = ?');
      params.push(plant);
    }
    if (search) {
      whereClauses.push('(LOWER(p.description) LIKE ? OR p.material_code LIKE ?)');
      params.push(`%${search.toLowerCase()}%`, `%${search}%`);
    }
    if (group) {
      whereClauses.push('p.material_group = ?');
      params.push(group);
    }
    if (status) {
      whereClauses.push('UPPER(COALESCE(p.status, ?)) = ?');
      params.push('ENABLED', String(status).toUpperCase());
    }

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Fetch parts
    const { rows } = await db.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM operations o WHERE o.part_code = p.material_code) AS operation_count
       FROM parts p ${where}
       ORDER BY p.sl_no ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Count totals
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM parts p ${where}`, params
    );

    // Stats
    const { rows: statsRows } = await db.query(
      `SELECT 
         COUNT(DISTINCT material_group) as part_types,
         SUM(CASE WHEN (SELECT COUNT(*) FROM operations o WHERE o.part_code = p.material_code) > 0 THEN 1 ELSE 0 END) as linked,
         SUM(CASE WHEN (SELECT COUNT(*) FROM operations o WHERE o.part_code = p.material_code) = 0 THEN 1 ELSE 0 END) as unlinked
       FROM parts p ${where}`, params
    );

    res.json({
      success: true,
      data: rows,
      total: countRows[0]?.total || 0,
      stats: statsRows[0] || { part_types: 0, linked: 0, unlinked: 0 },
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parts/:id
const getPartById = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM parts WHERE material_code = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/parts/:id
const updatePartById = async (req, res) => {
  try {
    const allowedFields = [
      'final_opn_code',
      'opn_number',
      'customer',
      'plant_code',
      'manufacturing_type',
      'status',
      'traceability_status',
    ];
    const updates = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field));

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No editable fields supplied' });
    }

    const params = updates.map((field) => {
      if (field === 'status') {
        return String(req.body[field] || 'ENABLED').toUpperCase() === 'DISABLED' ? 'DISABLED' : 'ENABLED';
      }
      if (field === 'traceability_status') {
        return String(req.body[field] || 'ENABLED').toUpperCase() === 'DISABLED' ? 'DISABLED' : 'ENABLED';
      }
      return req.body[field] || null;
    });
    await db.run(
      `UPDATE parts SET ${updates.map((field) => `${field} = ?`).join(', ')} WHERE material_code = ?`,
      [...params, req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM parts WHERE material_code = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Part not found' });

    res.json({ success: true, data: rows[0], message: 'Part updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parts/:id/operations
const getPartOperations = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM operations WHERE part_code = ? ORDER BY sr_no', [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sheetTables = {
  processFlow: 'process_flow_diagrams',
  inspection: 'inspection_sheets',
  controlPlan: 'control_plan_charts',
};

const sheetSelect = `
  SELECT
    id,
    upload_date AS uploadDate,
    version,
    file_name AS fileName,
    file_path AS filePath,
    updated_by AS updatedBy
`;

function safeFileName(fileName) {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function saveUploadedFile(partCode, type, fileName, fileData) {
  if (!fileData) return null;

  const base64 = String(fileData).includes(',')
    ? String(fileData).split(',').pop()
    : String(fileData);
  const dir = path.join(UPLOAD_ROOT, partCode, type);
  fs.mkdirSync(dir, { recursive: true });

  const storedName = `${Date.now()}-${safeFileName(fileName)}`;
  const fullPath = path.join(dir, storedName);
  fs.writeFileSync(fullPath, Buffer.from(base64, 'base64'));
  return path.relative(path.join(__dirname, '../..'), fullPath).replace(/\\/g, '/');
}

// GET /api/parts/:id/sheets
const getPartSheets = async (req, res) => {
  try {
    const result = {};
    for (const [key, table] of Object.entries(sheetTables)) {
      const { rows } = await db.query(
        `${sheetSelect} FROM ${table} WHERE part_code = ? ORDER BY id DESC`,
        [req.params.id]
      );
      result[key] = rows;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/parts/:id/sheets/:type
const uploadPartSheet = async (req, res) => {
  try {
    const table = sheetTables[req.params.type];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid sheet type' });

    const { fileName, version, updatedBy, fileData } = req.body;
    if (!fileName) return res.status(400).json({ success: false, message: 'File name is required' });

    const uploadDate = new Date().toISOString().slice(0, 10);
    const filePath = saveUploadedFile(req.params.id, req.params.type, fileName, fileData);
    await db.run(
      `INSERT INTO ${table} (part_code, upload_date, version, file_name, file_path, updated_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, uploadDate, version || 'V1', fileName, filePath, updatedBy || 'Admin']
    );

    const { rows } = await db.query(
      `${sheetSelect} FROM ${table} WHERE part_code = ? ORDER BY id DESC`,
      [req.params.id]
    );

    res.status(201).json({ success: true, data: rows, message: 'Sheet uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parts/:id/sheets/:type/:sheetId/download
const downloadPartSheet = async (req, res) => {
  try {
    const table = sheetTables[req.params.type];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid sheet type' });

    const { rows } = await db.query(
      `SELECT file_name, file_path FROM ${table} WHERE id = ? AND part_code = ?`,
      [req.params.sheetId, req.params.id]
    );
    if (!rows.length || !rows[0].file_path) {
      return res.status(404).json({ success: false, message: 'Sheet file not found' });
    }

    const fullPath = path.resolve(path.join(__dirname, '../..'), rows[0].file_path);
    if (!fullPath.startsWith(path.resolve(path.join(__dirname, '../..', 'uploads')))) {
      return res.status(400).json({ success: false, message: 'Invalid sheet path' });
    }

    res.download(fullPath, rows[0].file_name);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parts/:id/configuration
const getPartConfiguration = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT cycle_time_sec, box_quantity, manufacturing_type, total_produced FROM parts WHERE material_code = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Part not found' });
    const p = rows[0];
    res.json({
      success: true,
      data: {
        hourlyTarget: p.cycle_time_sec ? Math.floor(3600 / p.cycle_time_sec) : 0,
        cycletime: p.cycle_time_sec || 0,
        boxQuantity: p.box_quantity || 0,
        manufacturingType: p.manufacturing_type || '',
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/parts/:id/configuration
const updatePartConfiguration = async (req, res) => {
  try {
    const { cycletime, hourlyTarget, boxQuantity, manufacturingType } = req.body;
    const nextCycleTime = cycletime || (hourlyTarget ? Math.round(3600 / Number(hourlyTarget)) : 0);
    await db.run(
      'UPDATE parts SET cycle_time_sec = ?, box_quantity = ?, manufacturing_type = ? WHERE material_code = ?',
      [nextCycleTime, boxQuantity || 0, manufacturingType, req.params.id]
    );
    res.json({ success: true, message: 'Configuration updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/materials?plant=GURUGRAM&group=RAWMAT
const getMaterials = async (req, res) => {
  try {
    const { plant, group, search, limit = 50 } = req.query;
    const params = [];
    let whereClauses = [];

    if (plant) { whereClauses.push('plant_code = ?'); params.push(plant); }
    if (group) { whereClauses.push('material_group = ?'); params.push(group); }
    if (search) {
      whereClauses.push('(LOWER(description) LIKE ? OR material_code LIKE ?)');
      params.push(`%${search.toLowerCase()}%`, `%${search}%`);
    }

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const { rows } = await db.query(
      `SELECT * FROM materials ${where} ORDER BY material_code LIMIT ?`,
      [...params, parseInt(limit)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/stats?plant=GURUGRAM
const getStats = async (req, res) => {
  try {
    const { plant } = req.query;
    const params = plant ? [plant] : [];
    const where = plant ? 'WHERE plant_code = ?' : '';

    const { rows: partStats } = await db.query(
      `SELECT 
         COUNT(*) as total_parts,
         COUNT(DISTINCT material_group) as material_groups,
         COUNT(DISTINCT customer) as customers,
         COUNT(DISTINCT manufacturing_type) as mfg_types
       FROM parts ${where}`, params
    );
    const { rows: matStats } = await db.query(
      `SELECT COUNT(*) as total_materials FROM materials ${where}`, params
    );
    const { rows: mfgBreakdown } = await db.query(
      `SELECT manufacturing_type, COUNT(*) as count 
       FROM parts ${where} 
       GROUP BY manufacturing_type ORDER BY count DESC`, params
    );

    res.json({
      success: true,
      data: {
        ...partStats[0],
        total_materials: matStats[0]?.total_materials || 0,
        manufacturing_breakdown: mfgBreakdown,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllPlants, getPartsByPlant, getPartById, updatePartById,
  getPartOperations, getPartConfiguration, updatePartConfiguration,
  getPartSheets, uploadPartSheet, downloadPartSheet,
  getMaterials, getStats,
};
