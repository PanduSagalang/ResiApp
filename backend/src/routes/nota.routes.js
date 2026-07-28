const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');

/**
 * GET /api/nota/toko/:tokoId/bulanan?tahun=2026&bulan=7
 * Nota akumulasi bulanan per toko
 */
router.get('/toko/:tokoId/bulanan', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const bulan = parseInt(req.query.bulan) || (new Date().getMonth() + 1);

    const tglMulai = `${tahun}-${String(bulan).padStart(2,'0')}-01`;
    const lastDay = new Date(tahun, bulan, 0).getDate();
    const tglSelesai = `${tahun}-${String(bulan).padStart(2,'0')}-${lastDay}`;

    const toko = await db.Toko.findByPk(tokoId);
    if (!toko) return res.status(404).json({ success: false, message: 'Toko not found' });

    const resis = await db.Resi.findAll({
      where: { toko_id: tokoId, status: { [Op.ne]: 'dibatalkan' },
        tanggal_pesan: { [Op.between]: [tglMulai, tglSelesai] }
      },
      include: [
        { model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] },
        { model: db.Transaksi, as: 'transaksi' }
      ],
      order: [['tanggal_pesan', 'ASC']]
    });

    // Aggregate items
    const itemMap = {};
    for (const r of resis) {
      for (const item of r.items) {
        const key = `${item.nama_produk}|${item.variasi || ''}`;
        if (!itemMap[key]) {
          itemMap[key] = {
            nama_produk: item.nama_produk,
            variasi: item.variasi,
            qty: 0,
            harga_beli: item.produk_master?.harga_beli || 0,
            harga_jual: item.produk_master?.harga_jual || 0,
            subtotal_beli: 0,
            subtotal_jual: 0
          };
        }
        itemMap[key].qty += item.qty;
        itemMap[key].subtotal_beli += (item.produk_master?.harga_beli || 0) * item.qty;
        itemMap[key].subtotal_jual += (item.produk_master?.harga_jual || 0) * item.qty;
      }
    }

    // Summary
    let totalBeli = 0, totalJual = 0, totalAdmin = 0, totalPpn = 0, totalKotor = 0, totalBersih = 0;
    for (const r of resis) {
      if (r.transaksi) {
        totalBeli += parseFloat(r.transaksi.hpp_total) || 0;
        totalJual += parseFloat(r.transaksi.harga_jual_total) || 0;
        totalAdmin += parseFloat(r.transaksi.admin_fee) || 0;
        totalPpn += parseFloat(r.transaksi.ppn) || 0;
        totalKotor += parseFloat(r.transaksi.penghasilan_kotor) || 0;
        totalBersih += parseFloat(r.transaksi.penghasilan_bersih) || 0;
      }
    }

    res.json({
      success: true,
      data: {
        toko: toko.nama_toko,
        periode: `${tglMulai} s/d ${tglSelesai}`,
        total_resi: resis.length,
        items: Object.values(itemMap).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk)),
        ringkasan: {
          total_hpp: totalBeli,
          total_jual: totalJual,
          total_admin: totalAdmin,
          total_ppn: totalPpn,
          total_kotor: totalKotor,
          total_bersih: totalBersih
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/nota/resi/:resiId
 * Detail 1 resi (untuk popup)
 */
router.get('/resi/:resiId', async (req, res) => {
  try {
    const resi = await db.Resi.findByPk(req.params.resiId, {
      include: [
        { model: db.Toko, as: 'toko' },
        { model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] },
        { model: db.Transaksi, as: 'transaksi' }
      ]
    });
    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: resi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;