const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

// Helper function used by both JSON and Excel
async function getNotaData(tokoId, tglMulai, tglSelesai) {
  const toko = await db.Toko.findByPk(tokoId);
  if (!toko) return null;

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

  const itemMap = {};
  for (const r of resis) {
    for (const item of r.items) {
      const key = `${item.nama_produk}|${item.variasi || ''}`;
      if (!itemMap[key]) itemMap[key] = { nama_produk: item.nama_produk, variasi: item.variasi, qty: 0, harga_beli: 0, harga_jual: 0, subtotal_beli: 0, subtotal_jual: 0 };
      itemMap[key].qty += item.qty;
      itemMap[key].subtotal_beli += (item.produk_master?.harga_beli || 0) * item.qty;
      itemMap[key].subtotal_jual += (item.produk_master?.harga_jual || 0) * item.qty;
    }
  }

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

  return {
    toko: toko.nama_toko,
    total_resi: resis.length,
    items: Object.values(itemMap).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk)),
    ringkasan: { total_hpp: totalBeli, total_jual: totalJual, total_admin: totalAdmin, total_ppn: totalPpn, total_kotor: totalKotor, total_bersih: totalBersih }
  };
}

/**
 * GET /api/nota/toko/:tokoId/bulanan
 */
router.get('/toko/:tokoId/bulanan', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { tgl_mulai, tgl_selesai } = req.query;
    let tahun, bulan, tglMulai, tglSelesai;

    if (tgl_mulai && tgl_selesai) {
      tglMulai = tgl_mulai;
      tglSelesai = tgl_selesai;
    } else {
      tahun = parseInt(req.query.tahun) || new Date().getFullYear();
      bulan = parseInt(req.query.bulan) || (new Date().getMonth() + 1);
      tglMulai = `${tahun}-${String(bulan).padStart(2,'0')}-01`;
      const lastDay = new Date(tahun, bulan, 0).getDate();
      tglSelesai = `${tahun}-${String(bulan).padStart(2,'0')}-${lastDay}`;
    }

    const data = await getNotaData(tokoId, tglMulai, tglSelesai);
    if (!data) return res.status(404).json({ success: false, message: 'Toko not found' });

    res.json({ success: true, data: { ...data, periode: `${tglMulai} s/d ${tglSelesai}` } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/nota/toko/:tokoId/export-excel?tgl_mulai=...&tgl_selesai=...
 * Export nota ke Excel (.xlsx) sesuai layout
 */
router.get('/toko/:tokoId/export-excel', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { tgl_mulai, tgl_selesai } = req.query;
    if (!tgl_mulai || !tgl_selesai) return res.status(400).json({ success: false, message: 'tgl_mulai & tgl_selesai required' });

    const data = await getNotaData(tokoId, tgl_mulai, tgl_selesai);
    if (!data) return res.status(404).json({ success: false, message: 'Toko not found' });

    // Build Excel workbook — layout persis gambar
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Format header
    wsData.push(['NOTA']);
    wsData.push(['Tuan', 'GALANG']);
    wsData.push(['Tanggal', `${tgl_mulai} s/d ${tgl_selesai}`]);
    wsData.push([]);

    // Section 1: Ringkasan
    wsData.push(['NO', 'KETERANGAN', 'TOTAL']);
    wsData.push([1, 'NOTA MINGGUAN', data.ringkasan.total_jual]);
    wsData.push([2, 'NOTA MINGGU LALU', '']);
    wsData.push([3, 'FEE GUDANG', 150000]);
    wsData.push([4, 'SUBSIDI IKLAN', '']);

    wsData.push([]);
    wsData.push(['RETURN DAN CANCEL']);
    wsData.push([]);

    // Section 2: Items
    wsData.push(['NO', 'KETERANGAN', 'JUMLAH', 'NOMINAL', 'SUBTOTAL']);
    data.items.forEach((item, i) => {
      wsData.push([
        i + 1,
        item.nama_produk + (item.variasi ? ' ' + item.variasi : ''),
        item.qty,
        item.harga_jual,
        item.subtotal_jual
      ]);
    });

    wsData.push([]);
    wsData.push(['TOTAL KESELURUHAN', '', '', '', data.ringkasan.total_jual]);
    wsData.push(['TOTAL RESI', data.total_resi, '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'NOTA');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=NOTA-${tgl_mulai}-${tgl_selesai}.xlsx`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/nota/resi/:resiId
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