import { useState, useEffect } from 'react';
import { nota as notaAPI, produk as produkAPI } from '../services/api';

function Nota({ toko }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [produks, setProduks] = useState([]);
  const [offlineForm, setOfflineForm] = useState({ pembeli: '', alamat: '', ongkir: 0, biaya_lain: 0, items: [{ produk_master_id: '', nama: '', qty: 1, harga: '' }] });
  const [offlineResult, setOfflineResult] = useState(null);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - now.getDay());
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);

  const [tglMulai, setTglMulai] = useState(startWeek.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(endWeek.toISOString().split('T')[0]);
  const [filterLabel, setFilterLabel] = useState('Minggu Ini');

  useEffect(() => { fetchNota(); }, [tglMulai, tglSelesai, toko.id]);

  const fetchNota = async () => {
    try { setLoading(true);
      const res = await notaAPI.bulanan(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const res = await notaAPI.exportExcel(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NOTA-${tglMulai}-${tglSelesai}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { alert('Gagal export Excel'); }
  };

  const openOffline = async () => {
    try {
      const res = await produkAPI.getAll(toko.id);
      setProduks(res.data.data || []);
      setShowOffline(true);
      setOfflineResult(null);
      setOfflineForm({ pembeli: '', alamat: '', ongkir: 0, biaya_lain: 0, items: [{ produk_master_id: '', nama: '', qty: 1, harga: '' }] });
    } catch (err) { alert('Gagal muat produk'); }
  };

  const addItem = () => setOfflineForm(f => ({ ...f, items: [...f.items, { produk_master_id: '', nama: '', qty: 1, harga: '' }] }));
  const rmItem = (i) => setOfflineForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updItem = (i, k, v) => {
    const items = [...offlineForm.items];
    if (k === 'produk_master_id') {
      const p = produks.find(x => x.id === parseInt(v));
      items[i].produk_master_id = v;
      items[i].nama = p ? `${p.nama_produk}${p.variasi ? ' ' + p.variasi : ''}` : '';
      items[i].harga = p ? p.harga_beli : '';
    } else {
      items[i][k] = v;
    }
    setOfflineForm(f => ({ ...f, items }));
  };
  const updForm = (k, v) => setOfflineForm(f => ({ ...f, [k]: v }));

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!offlineForm.pembeli.trim()) { alert('Isi nama pembeli'); return; }
    try {
      const res = await notaAPI.offline(toko.id, {
        pembeli: offlineForm.pembeli.trim(),
        alamat: offlineForm.alamat.trim(),
        ongkir: parseFloat(offlineForm.ongkir) || 0,
        biaya_lain: parseFloat(offlineForm.biaya_lain) || 0,
        items: offlineForm.items.map(i => ({
          produk_master_id: parseInt(i.produk_master_id) || null,
          nama: i.nama,
          qty: parseInt(i.qty) || 1,
          harga: parseFloat(String(i.harga).replace(/,/g, '')) || 0
        }))
      });
      setOfflineResult(res.data.data);
    } catch (err) { alert('Gagal buat nota offline'); }
  };

  const downloadExcel = () => {
    if (!offlineResult?.xlsx) return;
    const byteChars = atob(offlineResult.xlsx);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${offlineResult.no_invoice}.xlsx`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const setRange = (label, mulai, selesai) => { setFilterLabel(label); setTglMulai(mulai); setTglSelesai(selesai); };

  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', today, today) },
    { label: 'Minggu Ini', fn: () => { const s = new Date(); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate() + 6); setRange('Minggu Ini', s.toISOString().split('T')[0], e.toISOString().split('T')[0]); }},
    { label: 'Minggu Lalu', fn: () => { const s = new Date(); s.setDate(s.getDate() - s.getDay() - 7); const e = new Date(s); e.setDate(e.getDate() + 6); setRange('Minggu Lalu', s.toISOString().split('T')[0], e.toISOString().split('T')[0]); }},
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2,'0'); setRange('Bulan Ini', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
  ];

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Nota</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={openOffline}
            className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 w-full sm:w-auto`}>
            + Nota Offline
          </button>
          <div className="flex items-center gap-1">
            <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />
            <span className="text-gray-400 text-sm">s/d</span>
            <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />
          </div>
          <button onClick={handleExport}
            className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 w-full sm:w-auto`}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {presets.map(p => (
          <button key={p.label} onClick={p.fn}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterLabel === p.label
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
            }`}>{p.label}</button>
        ))}
      </div>

      {!data || data.total_resi === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode {filterLabel}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div><h2 className="text-lg font-bold text-gray-800">NOTA RESELLER</h2><p className="text-sm text-gray-500">{data.toko}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">Periode</p><p className="font-semibold text-gray-800">{data.periode}</p><p className="text-gray-400 text-xs mt-1">{data.total_resi} resi</p></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[600px] sm:min-w-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produk</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Variasi</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Harga</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.items.map((item, i) => (
                      <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.nama_produk}</td>
                        <td className="px-3 py-2 text-gray-500">{item.variasi || '-'}</td>
                        <td className="px-3 py-2 text-right font-medium">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-600">Rp {fmt(item.harga_beli)}</td>
                        <td className="px-3 py-2 text-right font-medium">Rp {fmt(item.subtotal_beli)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ringkasan</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-indigo-100/50">
                <p className="text-xs text-gray-500 font-medium">Total Belanja (HPP)</p>
                <p className="text-lg font-bold text-gray-800 mt-1">Rp {fmt(data.ringkasan.total_jual)}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl p-4 border border-emerald-100/50">
                <p className="text-xs text-gray-500 font-medium">Jumlah Resi</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{data.total_resi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Offline */}
      {showOffline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !offlineResult && setShowOffline(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {offlineResult ? (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Nota Offline</h2>
                  <button onClick={() => setShowOffline(false)} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="font-semibold text-emerald-800">{offlineResult.message}</p>
                  <p className="text-xs text-emerald-600 mt-1">Invoice: {offlineResult.no_invoice}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Pembeli:</span> <span className="font-medium">{offlineResult.pembeli}</span></div>
                  <div><span className="text-gray-500">Tanggal:</span> {offlineResult.tgl}</div>
                </div>
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left text-xs text-gray-500">Produk</th><th className="px-3 py-2 text-right text-xs text-gray-500">Qty</th><th className="px-3 py-2 text-right text-xs text-gray-500">Harga</th><th className="px-3 py-2 text-right text-xs text-gray-500">Sub</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {offlineResult.items.map((it, i) => (
                      <tr key={i}><td className="px-3 py-2">{it.nama_produk}</td><td className="px-3 py-2 text-right">{it.qty}</td><td className="px-3 py-2 text-right">Rp{fmt(it.harga)}</td><td className="px-3 py-2 text-right font-medium">Rp{fmt(it.subtotal)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-gray-200 pt-2 space-y-1 text-sm text-right">
                  {offlineResult.ongkir > 0 && <p>Ongkir: Rp{fmt(offlineResult.ongkir)}</p>}
                  {offlineResult.biaya_lain > 0 && <p>Biaya Lain: Rp{fmt(offlineResult.biaya_lain)}</p>}
                  <p className="text-lg font-bold text-gray-800">Grand Total: Rp{fmt(offlineResult.grand_total)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadExcel}
                    className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 w-full`}>Download Excel</button>
                  <button onClick={() => { setShowOffline(false); setOfflineForm({pembeli:'', alamat:'', ongkir:0, biaya_lain:0, items:[{produk_master_id:'', nama:'', qty:1, harga:''}]}); }}
                    className={`${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200 w-full`}>Tutup</button>
                </div>
                <p className="text-xs text-gray-400 text-center">PDF tersimpan di: {offlineResult.file}</p>
              </div>
            ) : (
              <form onSubmit={handleOfflineSubmit}>
                <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Nota Offline</h2>
                  <button type="button" onClick={() => setShowOffline(false)} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Pembeli</label>
                      <input value={offlineForm.pembeli} onChange={(e) => updForm('pembeli', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Nama customer" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Alamat (opsional)</label>
                      <input value={offlineForm.alamat} onChange={(e) => updForm('alamat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Alamat" /></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-gray-600">Barang</label>
                      <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Tambah Baris</button>
                    </div>
                    {offlineForm.items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <select value={item.produk_master_id} onChange={(e) => updItem(i, 'produk_master_id', e.target.value)}
                          className="w-2/5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                          <option value="">-- Ketik manual / Pilih --</option>
                          {produks.map(p => (
                            <option key={p.id} value={p.id}>{p.nama_produk}{p.variasi ? ` (${p.variasi})` : ''} — Rp{fmt(p.harga_beli)}</option>
                          ))}
                        </select>
                        <input value={item.nama} onChange={(e) => updItem(i, 'nama', e.target.value)} placeholder="Nama barang"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                        <input type="number" min="1" value={item.qty} onChange={(e) => updItem(i, 'qty', e.target.value)}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                        <input type="number" min="0" value={item.harga} onChange={(e) => updItem(i, 'harga', e.target.value)} placeholder="Harga"
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                        {offlineForm.items.length > 1 && (
                          <button type="button" onClick={() => rmItem(i)} className="text-rose-500 hover:text-rose-700 text-sm px-1">&times;</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Ongkos Kirim</label>
                      <input type="number" min="0" value={offlineForm.ongkir} onChange={(e) => updForm('ongkir', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Biaya Lain</label>
                      <input type="number" min="0" value={offlineForm.biaya_lain} onChange={(e) => updForm('biaya_lain', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                  </div>
                </div>
                <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowOffline(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm">Simpan & Cetak</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Nota;