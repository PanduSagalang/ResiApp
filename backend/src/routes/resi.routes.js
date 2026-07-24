const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');
const { hitungTransaksi } = require('../services/kalkulasi.service');

const Resi = db.Resi;
const ResiItem = db.ResiItem;
const Retur = db.Retur;
const Transaksi = db.Transaksi;

/**
 * GET /api/resi/:tokoId
 * List resi toko dgn filter & search
 */
router.get('/:tokoId', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { search, status, tgl_mulai, tgl_selesai, limit = 100 } = req.query;

    const where = { toko_id: tokoId };
    
    if (status) where.status = status;
    if (tgl_mulai && tgl_selesai) {
      where.tanggal_pesan = { [Op.between]: [tgl_mulai, tgl_selesai] };
    }
    if (search) {
      where[Op.or] = [
        { no_resi: { [Op.like]: `%${search}%` } },
        { no_pesanan: { [Op.like]: `%${search}%` } },
        { penerima_nama: { [Op.like]: `%${search}%` } }
      ];
    }

    const rows = await Resi.findAll({
      where,
      limit: parseInt(limit),
      order: [['tanggal_pesan', 'DESC'], ['id', 'DESC']],
      include: [
        { model: ResiItem, as: 'items' },
        { model: Transaksi, as: 'transaksi' }
      ]
    });

    res.status(200).json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/resi/:id
 * Edit info dasar resi
 */
router.put('/:id', async (req, res) => {
  try {
    const resi = await Resi.findByPk(req.params.id);
    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });
    
    const allowed = ['no_resi','no_pesanan','penerima_nama','penerima_alamat','pengirim','berat','tanggal_pesan','status'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    await resi.update(update);
    return res.status(200).json({ success: true, data: resi });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/resi/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const resi = await Resi.findByPk(req.params.id);
    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });
    await resi.destroy();
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/resi/:id/retur
 * Tandai retur
 */
router.post('/:id/retur', async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan, jumlah_potongan, tanggal_retur } = req.body;
    
    const resi = await Resi.findByPk(id);
    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });
    
    await resi.update({ status: 'retur' });
    
    let retur = await Retur.findOne({ where: { resi_id: id } });
    if (retur) {
      await retur.update({ alasan, jumlah_potongan, tanggal_retur });
    } else {
      retur = await Retur.create({ resi_id: id, alasan, jumlah_potongan, tanggal_retur });
    }
    
    await hitungTransaksi(id);
    
    return res.status(200).json({ success: true, message: 'Retur diproses', data: retur });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
