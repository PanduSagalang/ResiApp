const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Op } = require('sequelize');

const Toko = db.Toko;

/**
 * POST /api/toko
 * Buat toko baru
 */
router.post('/', async (req, res) => {
  try {
    const { nama_toko, user_id } = req.body;

    // Validasi input
    if (!nama_toko || nama_toko.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'nama_toko tidak boleh kosong'
      });
    }

    // Cek duplikasi (per user_id atau global jika user_id null)
    let whereClause = { nama_toko: nama_toko.trim() };
    if (user_id) {
      whereClause.user_id = user_id;
    }

    const existingToko = await Toko.findOne({ where: whereClause });
    if (existingToko) {
      return res.status(400).json({
        success: false,
        message: 'Toko dengan nama ini sudah ada'
      });
    }

    // Create
    const toko = await Toko.create({
      nama_toko: nama_toko.trim(),
      user_id: user_id || null
    });

    res.status(201).json({
      success: true,
      message: 'Toko berhasil dibuat',
      data: toko
    });

  } catch (error) {
    console.error('POST /api/toko error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat toko',
      error: error.message
    });
  }
});

/**
 * GET /api/toko
 * List semua toko (dengan optional filter user_id)
 */
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let whereClause = {};
    if (user_id) {
      whereClause.user_id = user_id;
    }

    const tokos = await Toko.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'List toko berhasil diambil',
      data: tokos,
      total: tokos.length
    });

  } catch (error) {
    console.error('GET /api/toko error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil list toko',
      error: error.message
    });
  }
});

/**
 * GET /api/toko/:id
 * Get detail 1 toko beserta resinya
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const toko = await Toko.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username']
        },
        {
          model: db.Resi,
          as: 'resi_list',
          attributes: ['id', 'no_resi', 'no_pesanan', 'status'],
          limit: 5 // limit untuk preview
        }
      ]
    });

    if (!toko) {
      return res.status(404).json({
        success: false,
        message: 'Toko tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Detail toko berhasil diambil',
      data: toko
    });

  } catch (error) {
    console.error('GET /api/toko/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail toko',
      error: error.message
    });
  }
});

/**
 * PUT /api/toko/:id
 * Update toko
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_toko, user_id } = req.body;

    // Find toko
    const toko = await Toko.findByPk(id);
    if (!toko) {
      return res.status(404).json({
        success: false,
        message: 'Toko tidak ditemukan'
      });
    }

    // Validasi input
    if (nama_toko && nama_toko.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'nama_toko tidak boleh kosong'
      });
    }

    // Cek duplikasi nama_toko (exclude ID saat ini)
    if (nama_toko) {
      const existingToko = await Toko.findOne({
        where: {
          nama_toko: nama_toko.trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingToko) {
        return res.status(400).json({
          success: false,
          message: 'Nama toko sudah digunakan toko lain'
        });
      }
    }

    // Update
    await toko.update({
      nama_toko: nama_toko ? nama_toko.trim() : toko.nama_toko,
      user_id: user_id !== undefined ? user_id : toko.user_id
    });

    res.status(200).json({
      success: true,
      message: 'Toko berhasil diupdate',
      data: toko
    });

  } catch (error) {
    console.error('PUT /api/toko/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate toko',
      error: error.message
    });
  }
});

/**
 * DELETE /api/toko/:id
 * Delete toko (soft delete consideration atau hard delete sesuai kebutuhan)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const toko = await Toko.findByPk(id);
    if (!toko) {
      return res.status(404).json({
        success: false,
        message: 'Toko tidak ditemukan'
      });
    }

    // Cek apakah toko punya resi (jika ada, jangan hapus)
    const resiCount = await db.Resi.count({ where: { toko_id: id } });
    if (resiCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Toko tidak bisa dihapus karena masih memiliki ${resiCount} resi. Hapus resi terlebih dahulu.`
      });
    }

    // Delete
    await toko.destroy();

    res.status(200).json({
      success: true,
      message: 'Toko berhasil dihapus'
    });

  } catch (error) {
    console.error('DELETE /api/toko/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus toko',
      error: error.message
    });
  }
});

module.exports = router;
