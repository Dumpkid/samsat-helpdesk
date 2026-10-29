// Endpoint pendukung: daftar lokasi (untuk form) dan statistik dashboard
const express = require('express');
const locationService = require('../services/locationService');
const ticketService = require('../services/ticketService');
const { KATEGORI, PRIORITAS, STATUS } = require('../utils/ticketRules');

const router = express.Router();

router.get('/locations', async (req, res, next) => {
  try {
    res.json({ data: await locationService.findAll() });
  } catch (err) {
    next(err);
  }
});

router.get('/options', (req, res) => res.json({ kategori: KATEGORI, prioritas: PRIORITAS, status: STATUS }));

router.get('/dashboard', async (req, res, next) => {
  try {
    res.json(await ticketService.getStats());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
