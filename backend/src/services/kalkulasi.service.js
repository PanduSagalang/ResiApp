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
  } catch (error) { console.error('hitungTransaksi:', error.message); throw error; }
}

/**
 * Smart matching — load all master produk for toko, then match each item
 * by: (1) first word + variasi exact, (2) model code in name,
 * (3) LIKE name prefix + fuzzy variasi, (4) first word only fallback
 */
async function autoMatchProduk(tokoId) {
  try {
    const [masters] = await db.sequelize.query(
      'SELECT id, nama_produk, variasi, harga_beli, harga_jual FROM produk_master WHERE toko_id = ?',
      { replacements: [tokoId], type: db.sequelize.QueryTypes.SELECT }
    );
    // Actually let's use proper Sequelize
    const allMasters = await ProdukMaster.findAll({ where: { toko_id: tokoId } });
    if (allMasters.length === 0) return 0;

    const resis = await db.Resi.findAll({
      where: { toko_id: tokoId },
      include: [{ model: ResiItem, as: 'items', where: { produk_master_id: null }, required: true }]
    });

    let matched = 0;
    for (const resi of resis) {
      for (const item of resi.items) {
        const name = item.nama_produk.trim().toLowerCase();
        const itemVariasi = item.variasi ? item.variasi.trim().toLowerCase() : null;
        const firstWord = name.split(' ')[0];

        // Try to extract model code — e.g. LC1D12M7, LRD32, 2X1.5
        const modelMatch = name.match(/LC1D\w+|LRD\s*\d+|SUL\d+\w+|EZC\w+|NSX\w+|CVS\w+/i);
        const modelCode = modelMatch ? modelMatch[0].replace(/\s+/g, '').toUpperCase() : null;

        let best = null;
        let bestScore = 0;

        for (const m of allMasters) {
          const mName = m.nama_produk.trim().toLowerCase();
          const mVariasi = m.variasi ? m.variasi.trim().toLowerCase() : null;
          let score = 0;

          // Exact: name matches & variasi matches (or both null)
          if ((name === mName || name.startsWith(mName) || mName.startsWith(firstWord)) &&
              (itemVariasi === mVariasi || (!itemVariasi && !mVariasi))) {
            score = 4;
          }
          // Model code matches mVariasi
          if (modelCode && mVariasi && modelCode === mVariasi.toUpperCase()) {
            score = Math.max(score, 3);
          }
          // Name contains master name
          if (name.includes(mName) || mName.includes(firstWord)) {
            score = Math.max(score, 2);
          }
          // First word matches and variasi is null/empty
          if (firstWord === mName.split(' ')[0] && !itemVariasi && !mVariasi) {
            score = Math.max(score, 1);
          }

          if (score > bestScore) { bestScore = score; best = m; }
        }

        if (best && bestScore >= 2) {
          await item.update({ produk_master_id: best.id });
          matched++;
        }
      }
      await hitungTransaksi(resi.id);
    }
    return matched;
  } catch (error) { console.error('autoMatchProduk:', error.message); throw error; }
}

async function recalculateTokoTransaksi(tokoId) {
  try {
    const resis = await db.Resi.findAll({ where: { toko_id: tokoId }, attributes: ['id'] });
    let count = 0;
    for (const r of resis) { await hitungTransaksi(r.id); count++; }
    return count;
  } catch (error) { console.error('recalculateTokoTransaksi:', error.message); throw error; }
}

module.exports = { hitungTransaksi, autoMatchProduk, recalculateTokoTransaksi };