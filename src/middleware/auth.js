// Menolak request yang belum login
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
}

// Hanya admin yang boleh lanjut
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Hanya admin yang dapat melakukan aksi ini' });
}

module.exports = { requireAuth, requireAdmin };
