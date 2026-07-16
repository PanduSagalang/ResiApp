const db = require('../../models');

const ResiItem = db.ResiItem;
const ProdukMaster = db.ProdukMaster;
const Transaksi = db.Transaksi;

/**
 * Hitung atau update transaksi keuangan untuk 1 resi
 * Formula sesuai blueprint:
 * - HPP_total = sum(harga_beli × qty)
 * - Harga_Jual_total = sum(harga_jual × qty)
 * - Admin_Fee = admin_persen × Harga_Jual_total
 * - PPN = ppn_persen × Harga_Jual_total
 * - Penghasilan_Kotor = Harga_Jual_total - HPP_total
 * - Penghasilan_Bersih = Penghasilan_Kotor - Admin_Fee - PPN - Potongan_Retur
 * 
 * @param {number} resiId 
 * @returns {Promise<object>}
 */
async function hitungTransaksi(resiId) {
  try {
    // Ambil semua item resi beserta master produknya (jika ada)
    const items = await ResiItem.findAll({
      where: { resi_id: resiId },
      include: [
        {
          model: ProdukMaster,
          as: 'produk_master',
          required: false
        }
      ]
    });

    let hpp_total = 0;
    let harga_jual_total = 0;
    let admin_fee = 0;
    let ppn = 0;

    // Loop setiap item untuk akumulasi
    for (const item of items) {
      const qty = item.qty || 1;

      if (item.produk_master) {
        // Jika produk master ditemukan, pakai harga dari master
        const harga_beli = parseFloat(item.produk_master.harga_beli) || 0;
        const harga_jual = parseFloat(item.produk_master.harga_jual) || 0;
        const admin_persen = parseFloat(item.produk_master.admin_persen) || 0;
        const ppn_persen = parseFloat(item.produk_master.ppn_persen) || 0;

        hpp_total += harga_beli * qty;
        harga_jual_total += harga_jual * qty;
        admin_fee += (admin_persen / 100) * (harga_jual * qty);
        ppn += (ppn_persen / 100) * (harga_jual * qty);
      } else {
        // Jika master tidak ada, skip (HPP & harga jual = 0 untuk item ini)
        // Ini akan membuat penghasilan = 0 sampai master produk diisi
      }
    }

    const penghasilan_kotor = harga_jual_total - hpp_total;

    // Ambil potongan retur jika ada
    const resi = await db.Resi.findByPk(resiId, {
      include: [{ model: db.Retur, as: 'retur' }]
    });

    const potongan_retur = resi && resi.retur ? parseFloat(resi.retur.jumlah_potongan) || 0 : 0;

    const penghasilan_bersih = penghasilan_kotor - admin_fee - ppn - potongan_retur;

    // Cari atau buat transaksi
    let transaksi = await Transaksi.findOne({ where: { resi_id: resiId } });

    if (transaksi) {
      // Update existing
      await transaksi.update({
        hpp_total,
        harga_jual_total,
        admin_fee,
        ppn,
        potongan_retur,
        penghasilan_kotor,
        penghasilan_bersih
      });
    } else {
      // Create new
      transaksi = await Transaksi.create({
        resi_id: resiId,
        hpp_total,
        harga_jual_total,
        admin_fee,
        ppn,
        potongan_retur,
        penghasilan_kotor,
        penghasilan_bersih
      });
    }

    return transaksi;

  } catch (error) {
    console.error('Error hitungTransaksi:', error);
    throw error;
  }
}

/**
 * Auto-matching: cari dan set produk_master_id untuk ResiItem yang belum di-link
 * Cocokkan berdasarkan nama_produk dan variasi
 * 
 * @param {number} tokoId 
 * @returns {Promise<number>} jumlah item yang berhasil di-match
 */
async function autoMatchProduk(tokoId) {
  try {
    // Ambil semua resi dari toko ini yang item-nya belum punya produk_master_id
    const resis = await db.Resi.findAll({
      where: { toko_id: tokoId },
      include: [
        {
          model: ResiItem,
          as: 'items',
          where: { produk_master_id: null },
          required: true
        }
      ]
    });

    let matchedCount = 0;

    for (const resi of resis) {
      for (const item of resi.items) {
        // Cari produk master yang cocok
        const produkMaster = await ProdukMaster.findOne({
          where: {
            toko_id: tokoId,
            nama_produk: item.nama_produk,
            variasi: item.variasi || null
          }
        });

        if (produkMaster) {
          await item.update({ produk_master_id: produkMaster.id });
          matchedCount++;
        }
      }

      // Setelah matching, hitung ulang transaksi resi ini
      await hitungTransaksi(resi.id);
    }

    return matchedCount;

  } catch (error) {
    console.error('Error autoMatchProduk:', error);
    throw error;
  }
}

/**
 * Hitung ulang semua transaksi untuk 1 toko
 * Dipanggil saat master produk berubah
 * 
 * @param {number} tokoId 
 * @returns {Promise<number>} jumlah transaksi yang di-recalculate
 */
async function recalculateTokoTransaksi(tokoId) {
  try {
    const resis = await db.Resi.findAll({
      where: { toko_id: tokoId },
      attributes: ['id']
    });

    let count = 0;
    for (const resi of resis) {
      await hitungTransaksi(resi.id);
      count++;
    }

    return count;

  } catch (error) {
    console.error('Error recalculateTokoTransaksi:', error);
    throw error;
  }
}

module.exports = {
  hitungTransaksi,
  autoMatchProduk,
  recalculateTokoTransaksi
};
