// Pool koneksi MySQL dipakai bersama oleh seluruh service
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || 'helpdesk',
  password: process.env.DB_PASSWORD || 'helpdesk123',
  database: process.env.DB_NAME || 'samsat_helpdesk',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+07:00',
  dateStrings: true,
});

module.exports = pool;
