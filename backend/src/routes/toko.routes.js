const express = require('express');
const router = express.Router();

const{Toko} = require('../models');

router.post ('/', async (req, res) => {
    try{
        const{nama_toko} = req.body;
        if(!nama_toko) {
            return res.status(400).json({error: 'Nama toko harus diisi'});
        }
        const tokoBaru = await Toko.create({nama_toko});
        res.status(201).json({message: 'Toko berhasil dibuat', data: tokoBaru});
    }catch(error){
        console.error('Error membuat toko:', error);
        res.status(500).json({error: 'Terjadi kesalahan saat membuat toko'});
    }
});

roter.get('/', async (req, res) => {
    try{
        const daftarToko = await Toko.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json({data: daftarToko});
    }catch(error){
        console.error('Error mengambil daftar toko:', error);
        res.status(500).json({error: 'Terjadi kesalahan saat mengambil daftar toko'});
    }
});


roter.get('/:id', async (req, res) => {
    try{
        const toko = await Toko.findByPk(req.params.id);
        if(!toko){
            return res.status(404).json({error: 'Toko tidak ditemukan'});
        }
        res.json({data: toko});
    }catch(error){
        console.error('Error mengambil daftar toko:', error);
        res.status(500).json({error: 'Terjadi kesalahan saat mengambil daftar toko'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { nama_toko } = req.body;
        const toko = await Toko.findByPk(req.params.id);
        
        if (!toko) {
        return res.status(404).json({ error: 'Toko tidak ditemukan' });
    }

    await toko.update({ nama_toko });
    res.json({ message: 'Toko berhasil diupdate', data: toko });
    } catch (error) {
    console.error('Error update toko:', error);
    res.status(500).json({ error: 'Gagal mengupdate toko' });
    }
});

// 5. DELETE: Hapus Toko (DELETE /api/toko/:id)
router.delete('/:id', async (req, res) => {
    try {
    const toko = await Toko.findByPk(req.params.id);
    
    if (!toko) {
        return res.status(404).json({ error: 'Toko tidak ditemukan' });
    }

    await toko.destroy();
    res.json({ message: 'Toko berhasil dihapus' });
    } catch (error) {
    console.error('Error delete toko:', error);
    res.status(500).json({ error: 'Gagal menghapus toko. Pastikan toko ini tidak memiliki resi.' });
    }
});

module.exports = router;