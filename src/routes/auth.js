const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    const user = await userService.verifyCredentials(username, password);
    if (!user) return res.status(401).json({ message: 'Username atau password salah' });
    req.session.user = user;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Berhasil logout' }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Belum login' });
  return res.json({ user: req.session.user });
});

module.exports = router;
