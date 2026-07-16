const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');
const { autoMatchProduk, recalculateTokoTransaksi } = require('../services/kalkulasi.service');

const ProdukMaster = db.ProdukMaster;
const Toko = db.Toko;

/**
 * POST /api/produk/:tokoId
 * Tambah produk master baru
 */
router.post('/:tokoId', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { nama_produk, variasi, harga_beli, harga_jual, admin_persen, ppn_persen } = req.body;

    // Validasi toko
    const toko = await Toko.findByPk(tokoId);
    if (!toko) {
      return res.status(404).json({ success: false, message: 'Toko tidak ditemukan' });
    }

    // Validasi input
    if (!nama_produk || nama_produk.trim() === '') {
      return res.status(400).json({ success: false, message: 'nama_produk tidak boleh kosong' });
    }

    // Cek duplikasi (nama_produk + variasi per toko harus unik)
    const existing = await ProdukMaster.findOne({
      where: {
        toko_id: tokoId,
        nama_produk: nama_produk.trim(),
        variasi: variasi || null
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Produk dengan nama dan variasi ini sudah ada'
      });
    }

    // Create
    const produk = await ProdukMaster.create({
      toko_id: tokoId,
      nama_produk: nama_produk.trim(),
      variasi: variasi ? variasi.trim() : null,
      harga_beli: parseFloat(harga_beli) || 0,
      harga_jual: parseFloat(harga_jual) || 0,
      admin_persen: parseFloat(admin_persen) || 0,
      ppn_persen: parseFloat(ppn_persen) || 0
    });

    // Trigger auto-match dan recalculate
    try {
      await autoMatchProduk(tokoId);
      await recalculateTokoTransaksi(tokoId);
    } catch (calcErr) {
      console.warn('Auto-matching/kalkulasi warning:', calcErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: produk
    });

  } catch (error) {
    console.error('POST /api/produk/:tokoId error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk',
      error: error.message
    });
  }
});

/**
 * GET /api/produk/:tokoId
 * List semua produk master untuk toko tertentu
 */
router.get('/:tokoId', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { search } = req.query;

    let whereClause = { toko_id: tokoId };

    // Search by nama_produk atau variasi
    if (search) {
      whereClause[Op.or] = [
        { nama_produk: { [Op.like]: `%${search}%` } },
        { variasi: { [Op.like]: `%${search}%` } }
      ];
    }

    const produks = await ProdukMaster.findAll({
      where: whereClause,
      order: [['nama_produk', 'ASC'], ['variasi', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'List produk berhasil diambil',
      data: produks,
      total: produks.length
    });

  } catch (error) {
    console.error('GET /api/produk/:tokoId error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil list produk',
      error: error.message
    });
  }
});

/**
 * PUT /api/produk/:id
 * Update produk master
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, variasi, harga_beli, harga_jual, admin_persen, ppn_persen } = req.body;

    const produk = await ProdukMaster.findByPk(id);
    if (!produk) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Cek duplikasi jika nama/variasi berubah
    if (nama_produk || variasi !== undefined) {
      const existing = await ProdukMaster.findOne({
        where: {
          toko_id: produk.toko_id,
          nama_produk: nama_produk ? nama_produk.trim() : produk.nama_produk,
          variasi: variasi !== undefined ? (variasi ? variasi.trim() : null) : produk.variasi,
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Produk dengan nama dan variasi ini sudah ada'
        });
      }
    }

    // Update
    await produk.update({
      nama_produk: nama_produk ? nama_produk.trim() : produk.nama_produk,
      variasi: variasi !== undefined ? (variasi ? variasi.trim() : null) : produk.variasi,
      harga_beli: harga_beli !== undefined ? parseFloat(harga_beli) : produk.harga_beli,
      harga_jual: harga_jual !== undefined ? parseFloat(harga_jual) : produk.harga_jual,
      admin_persen: admin_persen !== undefined ? parseFloat(admin_persen) : produk.admin_persen,
      ppn_persen: ppn_persen !== undefined ? parseFloat(ppn_persen) : produk.ppn_persen
    });

    // Trigger recalculate karena harga/persen berubah
    try {
      await recalculateTokoTransaksi(produk.toko_id);
    } catch (calcErr) {
      console.warn('Kalkulasi warning:', calcErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Produk berhasil diupdate',
      data: produk
    });

  } catch (error) {
    console.error('PUT /api/produk/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate produk',
      error: error.message
    });
  }
});

/**
 * DELETE /api/produk/:id
 * Hapus produk master
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const produk = await ProdukMaster.findByPk(id);
    if (!produk) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    await produk.destroy();

    res.status(200).json({
      success: true,
      message: 'Produk berhasil dihapus'
    });

  } catch (error) {
    console.error('DELETE /api/produk/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk',
      error: error.message
    });
  }
});

module.exports = router;
