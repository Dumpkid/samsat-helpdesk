const pool = require('../config/db');

// Daftar lokasi untuk pilihan di form laporan, urut kode 1, 1.1, 1.2 ... 2, 2.1
async function findAll() {
  const [rows] = await pool.query(`
    SELECT id, kode_lokasi, nama_lokasi, jenis_layanan FROM locations
    ORDER BY CAST(SUBSTRING_INDEX(kode_lokasi, '.', 1) AS UNSIGNED),
             CASE WHEN LOCATE('.', kode_lokasi) = 0 THEN 0
                  ELSE CAST(SUBSTRING_INDEX(kode_lokasi, '.', -1) AS UNSIGNED) END`);
  return rows;
}

async function exists(id) {
  const [rows] = await pool.query('SELECT id FROM locations WHERE id = ?', [id]);
  return rows.length > 0;
}

module.exports = { findAll, exists };
