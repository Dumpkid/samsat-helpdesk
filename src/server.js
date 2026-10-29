// Titik masuk: tunggu database siap, siapkan akun awal, lalu jalankan HTTP server
const createApp = require('./app');
const pool = require('./config/db');
const userService = require('./services/userService');

const PORT = 3000;

async function waitForDatabase(retries = 20, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`[DB] belum siap (percobaan ${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Database tidak dapat dihubungi');
}

async function start() {
  await waitForDatabase();
  if (await userService.ensureDefaultUsers()) console.log('[AUTH] Akun admin & petugas default dibuat');
  createApp().listen(PORT, () => console.log(`[APP] berjalan di http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('[APP] gagal start:', err);
  process.exit(1);
});
