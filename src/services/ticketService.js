// Seluruh query SQL untuk tiket. Selalu memakai placeholder (?) agar aman dari SQL injection.
const pool = require('../config/db');

const SELECT_TICKET = `
  SELECT t.*, l.kode_lokasi, l.nama_lokasi, u.full_name AS dibuat_oleh
  FROM tickets t
  JOIN locations l ON l.id = t.location_id
  LEFT JOIN users u ON u.id = t.created_by`;

// Petugas hanya melihat tiket buatannya sendiri; admin melihat semua
function buildWhere({ q, status, user }) {
  const clauses = [];
  const params = [];
  if (q) {
    clauses.push('(t.judul LIKE ? OR l.nama_lokasi LIKE ? OR t.pelapor LIKE ? OR t.id = ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, Number(String(q).replace(/\D/g, '')) || 0);
  }
  if (status) {
    clauses.push('t.status = ?');
    params.push(status);
  }
  if (user && user.role !== 'admin') {
    clauses.push('t.created_by = ?');
    params.push(user.id);
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function findAll({ q, status, user, limit, offset }) {
  const where = buildWhere({ q, status, user });
  const [rows] = await pool.query(
    `${SELECT_TICKET} ${where.sql}
     ORDER BY FIELD(t.status, 'Baru', 'Diproses', 'Selesai'), FIELD(t.prioritas, 'Tinggi', 'Sedang', 'Rendah'), t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...where.params, limit, offset],
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t JOIN locations l ON l.id = t.location_id ${where.sql}`,
    where.params,
  );
  return { rows, total };
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT_TICKET} WHERE t.id = ?`, [id]);
  return rows[0] || null;
}

async function create(data, userId) {
  const [result] = await pool.query(
    `INSERT INTO tickets (judul, location_id, kategori, prioritas, deskripsi, pelapor, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.judul, data.location_id, data.kategori, data.prioritas, data.deskripsi, data.pelapor, userId],
  );
  return findById(result.insertId);
}

async function updateStatus(id, { status, catatan }) {
  await pool.query(
    `UPDATE tickets
     SET status = ?, catatan = ?, resolved_at = IF(? = 'Selesai', COALESCE(resolved_at, NOW()), NULL)
     WHERE id = ?`,
    [status, catatan, status, id],
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getStats() {
  const [byStatus] = await pool.query('SELECT status AS label, COUNT(*) AS total FROM tickets GROUP BY status');
  const [byKategori] = await pool.query(
    'SELECT kategori AS label, COUNT(*) AS total FROM tickets GROUP BY kategori ORDER BY total DESC',
  );
  const [topLokasi] = await pool.query(`
    SELECT l.nama_lokasi AS label, COUNT(*) AS total
    FROM tickets t JOIN locations l ON l.id = t.location_id
    GROUP BY l.id ORDER BY total DESC, l.nama_lokasi LIMIT 5`);
  const [[avg]] = await pool.query(`
    SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) / 60 AS jam
    FROM tickets WHERE status = 'Selesai' AND resolved_at IS NOT NULL`);
  const [[{ hari_ini: hariIni }]] = await pool.query(
    'SELECT COUNT(*) AS hari_ini FROM tickets WHERE DATE(created_at) = CURDATE()',
  );

  const count = (status) => Number((byStatus.find((r) => r.label === status) || {}).total || 0);
  return {
    total: byStatus.reduce((sum, r) => sum + Number(r.total), 0),
    baru: count('Baru'),
    diproses: count('Diproses'),
    selesai: count('Selesai'),
    hariIni: Number(hariIni),
    rataRataJam: avg.jam === null ? null : Math.round(Number(avg.jam) * 10) / 10,
    byKategori: byKategori.map((r) => ({ label: r.label, total: Number(r.total) })),
    topLokasi: topLokasi.map((r) => ({ label: r.label, total: Number(r.total) })),
  };
}

module.exports = { buildWhere, findAll, findById, create, updateStatus, remove, getStats };
