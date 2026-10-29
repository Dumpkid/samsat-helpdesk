// Menyusun aplikasi Express (dipisah dari server.js agar bisa diuji dengan supertest)
const path = require('path');
const express = require('express');
const session = require('express-session');
const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const miscRoutes = require('./routes/misc');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-helpdesk',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 },
  }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', requireAuth, ticketRoutes);
  app.use('/api', requireAuth, miscRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });
  return app;
}

module.exports = createApp;
