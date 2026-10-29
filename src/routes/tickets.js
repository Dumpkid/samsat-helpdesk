const express = require('express');
const ticketService = require('../services/ticketService');
const locationService = require('../services/locationService');
const { requireAdmin } = require('../middleware/auth');
const {
  STATUS, validateTicket, validateStatusUpdate, parsePagination, formatTicketCode, resolutionHours,
} = require('../utils/ticketRules');

const router = express.Router();

// Tambahkan kode tiket & lama penanganan untuk ditampilkan
function present(ticket) {
  return { ...ticket, kode: formatTicketCode(ticket.id), lama_jam: resolutionHours(ticket.created_at, ticket.resolved_at) };
}

function canView(user, ticket) {
  return user.role === 'admin' || ticket.created_by === user.id;
}

// GET /api/tickets?q=&status=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = STATUS.includes(req.query.status) ? req.query.status : '';
    const { rows, total } = await ticketService.findAll({
      q: (req.query.q || '').trim(), status, user: req.session.user, limit, offset,
    });
    res.json({
      data: rows.map(present),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await ticketService.findById(req.params.id);
    if (!ticket || !canView(req.session.user, ticket)) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    return res.json({ data: present(ticket) });
  } catch (err) {
    return next(err);
  }
});

// Petugas & admin dapat membuat laporan
router.post('/', async (req, res, next) => {
  try {
    const { errors, data } = validateTicket(req.body);
    if (!errors.location_id && !(await locationService.exists(data.location_id))) errors.location_id = 'Lokasi tidak ditemukan';
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Data tidak valid', errors });
    const ticket = await ticketService.create(data, req.session.user.id);
    return res.status(201).json({ data: present(ticket) });
  } catch (err) {
    return next(err);
  }
});

// Admin mengubah status (Baru -> Diproses -> Selesai)
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const ticket = await ticketService.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    const { errors, data } = validateStatusUpdate(ticket.status, req.body);
    if (Object.keys(errors).length) return res.status(422).json({ message: 'Data tidak valid', errors });
    const updated = await ticketService.updateStatus(ticket.id, data);
    return res.json({ data: present(updated) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await ticketService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    return res.json({ message: 'Tiket berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
