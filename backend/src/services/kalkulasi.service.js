const { Op } = require('sequelize');
const db = require('../../models');

const ResiItem = db.ResiItem;
const ProdukMaster = db.ProdukMaster;
const Transaksi = db.Transaksi;

async function hitungTransaksi(resiId) {
  try {
    const items = await ResiItem.findAll({
      where: { resi_id: resiId },
      include: [{ model: ProdukMaster, as: 'produk_master', required: false }]
    });

    let hpp_total = 0, harga_jual_total = 0, admin_fee = 0, ppn = 0;
    for (const item of items) {
      const qty = item.qty || 1;
      if (item.produk_master) {
        const hb = parseFloat(item.produk_master.harga_beli) || 0;
        const hj = parseFloat(item.produk_master.harga_jual) || 0;
        const ap = parseFloat(item.produk_master.admin_persen) || 0;
        const pp = parseFloat(item.produk_master.ppn_persen) || 0;
        hpp_total += hb * qty;
        harga_jual_total += hj * qty;
        admin_fee += (ap / 100) * (hj * qty);
        ppn += (pp / 100) * (hj * qty);
      }
    }

    const pk = harga_jual_total - hpp_total;
    const resi = await db.Resi.findByPk(resiId, { include: [{ model: db.Retur, as: 'retur' }] });
    const potRetur = resi?.retur ? parseFloat(resi.retur.jumlah_potongan) || 0 : 0;
    const pb = pk - admin_fee - ppn - potRetur;

    let t = await Transaksi.findOne({ where: { resi_id: resiId } });
    const vals = { hpp_total, harga_jual_total, admin_fee, ppn, potongan_retur: potRetur, penghasilan_kotor: pk, penghasilan_bersih: pb };
    if (t) await t.update(vals);
    else t = await Transaksi.create({ resi_id: resiId, ...vals });
    return t;
  } catch (error) { console.error('Error hitungTransaksi:', error); throw error; }
}

async function autoMatchProduk(tokoId) {
  try {
    const resis = await db.Resi.findAll({
      where: { toko_id: tokoId },
      include: [{ model: ResiItem, as: 'items', where: { produk_master_id: null }, required: true }]
    });

    let matched = 0;
    for (const resi of resis) {
      for (const item of resi.items) {
        const word = item.nama_produk.split(' ')[0];
        const master = await ProdukMaster.findOne({
          where: {
            toko_id: tokoId,
            nama_produk: { [Op.like]: `${word}%` },
            variasi: item.variasi || null
          },
          order: [['harga_jual', 'DESC']]
        });
        if (master) {
          await item.update({ produk_master_id: master.id });
          matched++;
        } else {
          // Fallback: cari tanpa variasi
          const master2 = await ProdukMaster.findOne({
            where: { toko_id: tokoId, nama_produk: { [Op.like]: `${word}%` }, variasi: null },
            order: [['harga_jual', 'DESC']]
          });
          if (master2) {
            await item.update({ produk_master_id: master2.id });
            matched++;
          }
        }
      }
      await hitungTransaksi(resi.id);
    }
    return matched;
  } catch (error) { console.error('Error autoMatchProduk:', error); throw error; }
}

async function recalculateTokoTransaksi(tokoId) {
  try {
    const resis = await db.Resi.findAll({ where: { toko_id: tokoId }, attributes: ['id'] });
    let count = 0;
    for (const r of resis) { await hitungTransaksi(r.id); count++; }
    return count;
  } catch (error) { console.error('Error recalculateTokoTransaksi:', error); throw error; }
}

module.exports = { hitungTransaksi, autoMatchProduk, recalculateTokoTransaksi };