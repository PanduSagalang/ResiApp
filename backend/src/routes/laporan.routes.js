const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');
const { exportLaporanCSV } = require('../services/csvExport.service');

const Resi = db.Resi;
const Transaksi = db.Transaksi;

// Query helper untuk get rekap data laporan
async function getLaporanData(tokoId, filter) {
  const { tgl_mulai, tgl_selesai } = filter;
  const where = { toko_id: tokoId, status: { [Op.ne]: 'dibatalkan' } };
  
  if (tgl_mulai && tgl_selesai) {
    where.tanggal_pesan = { [Op.between]: [tgl_mulai, tgl_selesai] };
  }

  const rows = await Resi.findAll({
    where,
    order: [['tanggal_pesan', 'DESC']],
    include: [{ model: Transaksi, as: 'transaksi', required: true }]
  });

  return rows.map(r => ({
    tanggal_pesan: r.tanggal_pesan,
    no_resi: r.no_resi,
    no_pesanan: r.no_pesanan,
    penerima_nama: r.penerima_nama,
    status: r.status,
    hpp_total: parseFloat(r.transaksi.hpp_total) || 0,
    harga_jual_total: parseFloat(r.transaksi.harga_jual_total) || 0,
    admin_fee: parseFloat(r.transaksi.admin_fee) || 0,
    ppn: parseFloat(r.transaksi.ppn) || 0,
    potongan_retur: parseFloat(r.transaksi.potongan_retur) || 0,
    penghasilan_kotor: parseFloat(r.transaksi.penghasilan_kotor) || 0,
    penghasilan_bersih: parseFloat(r.transaksi.penghasilan_bersih) || 0,
  }));
}

/**
 * GET /api/laporan/:tokoId
 * Rekap & list laporan keuangan
 */
router.get('/:tokoId', async (req, res) => {
  try {
    const data = await getLaporanData(req.params.tokoId, req.query);
    
    // Aggregation
    const summary = data.reduce((acc, curr) => {
      acc.total_pesanan += 1;
      acc.total_hpp += curr.hpp_total;
      acc.total_jual += curr.harga_jual_total;
      acc.total_admin += curr.admin_fee;
      acc.total_ppn += curr.ppn;
      acc.total_retur += curr.potongan_retur;
      acc.total_kotor += curr.penghasilan_kotor;
      acc.total_bersih += curr.penghasilan_bersih;
      return acc;
    }, {
      total_pesanan: 0, total_hpp: 0, total_jual: 0, total_admin: 0,
      total_ppn: 0, total_retur: 0, total_kotor: 0, total_bersih: 0
    });

    res.status(200).json({ success: true, summary, list: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/laporan/:tokoId/export
 * Download CSV laporan
 */
router.get('/:tokoId/export', async (req, res) => {
  try {
    const data = await getLaporanData(req.params.tokoId, req.query);
    const csv = exportLaporanCSV(data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-Keuangan-${req.params.tokoId}-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
