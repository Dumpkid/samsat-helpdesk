// Akses tabel users dan verifikasi password (bcrypt)
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Mengembalikan user (tanpa hash) bila username & password cocok, selain itu null
async function verifyCredentials(username, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  return { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
}

// Akun awal untuk development, dibuat bila tabel users masih kosong
const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', full_name: 'Admin Jaringan', role: 'admin' },
  { username: 'petugas', password: 'petugas123', full_name: 'Petugas Lokasi', role: 'petugas' },
];

async function ensureDefaultUsers() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  if (total > 0) return false;
  for (const u of DEFAULT_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [u.username, hash, u.full_name, u.role],
    );
  }
  return true;
}

module.exports = { verifyCredentials, ensureDefaultUsers };
