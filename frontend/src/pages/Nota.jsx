import { useState, useEffect } from 'react';
import { nota as notaAPI, produk as produkAPI } from '../services/api';

function Nota({ toko }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const start7 = new Date(); start7.setDate(start7.getDate() - 7);
  const [tglMulai, setTglMulai] = useState(start7.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [filterLabel, setFilterLabel] = useState('7 Hari Terakhir');

  const [showOffline, setShowOffline] = useState(false);
  const [masterProduk, setMasterProduk] = useState([]);
  const [offlineForm, setOfflineForm] = useState({ pembeli: '', alamat: '', ongkir: '', biaya_lain: '', items: [{ produk_master_id: '', nama: '', qty: 1, harga: '' }] });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tglMulai && tglSelesai) fetchNota();
  }, [tglMulai, tglSelesai, toko.id]);

  useEffect(() => {
    if (showOffline && masterProduk.length === 0) {
      produkAPI.getAll(toko.id, '').then(res => setMasterProduk(res.data.data || []));
    }
  }, [showOffline]);

  const fetchNota = async () => {
    try { setLoading(true);
      const res = await notaAPI.getRekap(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExportExcel = async () => {
    try {
      const res = await notaAPI.exportExcel(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NOTA-${tglMulai}-${tglSelesai}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { alert('Gagal export Excel'); }
  };

  const setRange = (label, mulai, selesai) => { setFilterLabel(label); setTglMulai(mulai); setTglSelesai(selesai); };

  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]) },
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setRange('Bulan Ini', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
    { label: 'Tahun Ini', fn: () => { const y = new Date().getFullYear(); setRange('Tahun Ini', `${y}-01-01`, `${y}-12-31`); }},
  ];

  const filteredItems = data?.items.filter(item => item.nama_produk.toLowerCase().includes(search.toLowerCase()) || (item.variasi && item.variasi.toLowerCase().includes(search.toLowerCase()))) || [];

  const handleOfflineItemChange = (index, field, value) => {
    const newItems = [...offlineForm.items];
    newItems[index][field] = value;
    if (field === 'produk_master_id') {
      const selected = masterProduk.find(p => p.id.toString() === value);
      if (selected) {
        newItems[index].nama = selected.nama_produk;
        newItems[index].harga = selected.harga_beli;
      }
    }
    setOfflineForm({ ...offlineForm, items: newItems });
  };

  const addOfflineItem = () => setOfflineForm({ ...offlineForm, items: [...offlineForm.items, { produk_master_id: '', nama: '', qty: 1, harga: '' }] });
  const removeOfflineItem = (index) => setOfflineForm({ ...offlineForm, items: offlineForm.items.filter((_, i) => i !== index) });

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!offlineForm.pembeli.trim()) return alert('Nama pembeli wajib diisi');
    const validItems = offlineForm.items.filter(i => i.nama.trim() && i.qty > 0 && i.harga);
    if (validItems.length === 0) return alert('Minimal 1 barang diisi dengan benar');

    setIsSaving(true);
    try {
      const payload = {
        ...offlineForm,
        ongkir: parseFloat(offlineForm.ongkir) || 0,
        biaya_lain: parseFloat(offlineForm.biaya_lain) || 0,
        items: offlineForm.items.map(i => ({
          produk_master_id: parseInt(i.produk_master_id) || null,
          nama: i.nama,
          qty: parseInt(i.qty) || 1,
          harga: parseFloat(String(i.harga).replace(/,/g, '')) || 0
        }))
      };
      
      const res = await notaAPI.offline(toko.id, payload);
      alert(`Nota offline berhasil dibuat dan disimpan ke PDF!\nLokasi: ${res.data.data.pdf_path}`);
      
      // Auto download Excel
      if (res.data.data.excel_base64) {
        const byteCharacters = atob(res.data.data.excel_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.setAttribute('download', res.data.data.excel_filename);
        document.body.appendChild(link); link.click(); link.remove();
      }

      setShowOffline(false);
      setOfflineForm({ pembeli: '', alamat: '', ongkir: '', biaya_lain: '', items: [{ produk_master_id: '', nama: '', qty: 1, harga: '' }] });
      fetchNota();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal buat nota offline');
    } finally { setIsSaving(false); }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-md shadow-black/20';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-100">Nota</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowOffline(true)} className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800`}>
            + Nota Offline
          </button>
          <button onClick={handleExportExcel} className={`${btnBase} bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800`}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
          <div className="flex items-center gap-1">
            <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
              className="bg-[#1A1D2E] text-white px-3 py-2 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-32 [color-scheme:dark]" />
            <span className="text-gray-400 text-sm">s/d</span>
            <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
              className="bg-[#1A1D2E] text-white px-3 py-2 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-32 [color-scheme:dark]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button key={p.label} onClick={p.fn}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                  filterLabel === p.label ? 'bg-purple-600 text-white shadow-md shadow-black/20' : 'bg-white/5 text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-400'
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111322]/80 backdrop-blur-xl border border-white/5 rounded-xl p-4 mb-6 shadow-2xl shadow-black/50">
        <input type="text" placeholder="Cari barang..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      {!data || data.items.length === 0 ? (
        <div className="bg-[#111322] border border-white/5 rounded-lg p-12 text-center shadow-md shadow-black/20"><p className="text-sm text-gray-400">Tidak ada nota untuk periode ini.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111322] border border-white/5 rounded-xl overflow-hidden shadow-md shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                    {['No', 'Produk', 'Variasi', 'Qty', 'Harga (HPP)', 'Subtotal'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 text-gray-100 max-w-[200px] truncate" title={item.nama_produk}>{item.nama_produk}</td>
                      <td className="px-3 py-3 text-gray-400">{item.variasi || '-'}</td>
                      <td className="px-3 py-3 text-right">{item.qty}</td>
                      <td className="px-3 py-3 text-right text-gray-400 whitespace-nowrap">Rp {fmt(item.harga_satuan)}</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-100 whitespace-nowrap">Rp {fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#111322] border border-white/5 rounded-xl p-6 shadow-md shadow-black/20">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Ringkasan</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-400 font-medium">Total Belanja (HPP)</p>
                <p className="text-lg font-bold text-white mt-1">Rp {fmt(data.ringkasan.total_jual)}</p>
              </div>
              <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-400 font-medium">Jumlah Resi</p>
                <p className="text-lg font-bold text-white mt-1">{data.total_resi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Offline */}
      {showOffline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowOffline(false)}>
          <div className="bg-[#111322] rounded-2xl shadow-2xl border border-white/5 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="border-b border-white/5 p-5 flex justify-between items-center bg-[#1A1D2E] rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">Buat Nota Offline</h2>
              <button onClick={() => setShowOffline(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleOfflineSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Nama Pembeli *</label>
                  <input type="text" required value={offlineForm.pembeli} onChange={e => setOfflineForm({...offlineForm, pembeli: e.target.value})}
                    className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ahmad" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Alamat (opsional)</label>
                  <input type="text" value={offlineForm.alamat} onChange={e => setOfflineForm({...offlineForm, alamat: e.target.value})}
                    className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Jl. Raya..." />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Barang</label>
                <div className="space-y-3">
                  {offlineForm.items.map((item, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-start bg-[#1A1D2E]/50 p-3 rounded-xl border border-white/5 relative group">
                      <button type="button" onClick={() => removeOfflineItem(i)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md">&times;</button>
                      <div className="flex-1 min-w-[200px]">
                        <select value={item.produk_master_id} onChange={e => handleOfflineItemChange(i, 'produk_master_id', e.target.value)}
                          className="bg-[#1A1D2E] text-white w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-purple-500">
                          <option value="">-- Pilih dari Master Produk --</option>
                          {masterProduk.map(p => <option key={p.id} value={p.id}>{p.nama_produk} {p.variasi ? `(${p.variasi})` : ''} - Rp{fmt(p.harga_beli)}</option>)}
                        </select>
                        <input type="text" placeholder="Atau ketik nama barang..." value={item.nama} onChange={e => handleOfflineItemChange(i, 'nama', e.target.value)}
                          className="bg-[#1A1D2E] text-white w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" required />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] text-gray-500 mb-1">Qty</label>
                        <input type="number" min="1" value={item.qty} onChange={e => handleOfflineItemChange(i, 'qty', e.target.value)}
                          className="bg-[#1A1D2E] text-white w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" required />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] text-gray-500 mb-1">Harga Satuan</label>
                        <input type="text" value={item.harga} onChange={e => handleOfflineItemChange(i, 'harga', e.target.value)}
                          className="bg-[#1A1D2E] text-white w-full px-2 py-1.5 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" placeholder="0" required />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addOfflineItem} className="text-xs text-purple-400 font-medium hover:text-purple-300 transition-colors">+ Tambah Baris</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ongkos Kirim</label>
                  <input type="number" value={offlineForm.ongkir} onChange={e => setOfflineForm({...offlineForm, ongkir: e.target.value})}
                    className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Biaya Lain</label>
                  <input type="number" value={offlineForm.biaya_lain} onChange={e => setOfflineForm({...offlineForm, biaya_lain: e.target.value})}
                    className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0" />
                </div>
              </div>
              
              <div className="bg-[#1A1D2E] p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Subtotal Barang:</span>
                  <span>Rp {fmt(offlineForm.items.reduce((sum, item) => sum + ((parseFloat(String(item.harga).replace(/,/g,''))||0) * (parseInt(item.qty)||0)), 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300 mt-1">
                  <span>Ongkir + Lain:</span>
                  <span>Rp {fmt((parseFloat(offlineForm.ongkir)||0) + (parseFloat(offlineForm.biaya_lain)||0))}</span>
                </div>
                <div className="flex justify-between font-bold text-white mt-2 pt-2 border-t border-white/5 text-lg">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">Rp {fmt(
                    offlineForm.items.reduce((sum, item) => sum + ((parseFloat(String(item.harga).replace(/,/g,''))||0) * (parseInt(item.qty)||0)), 0) + 
                    (parseFloat(offlineForm.ongkir)||0) + (parseFloat(offlineForm.biaya_lain)||0)
                  )}</span>
                </div>
              </div>
            </form>

            <div className="border-t border-white/5 p-4 flex gap-3 bg-[#1A1D2E] rounded-b-2xl">
              <button type="button" onClick={() => setShowOffline(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">Batal</button>
              <button type="submit" disabled={isSaving} onClick={handleOfflineSubmit} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center">
                {isSaving ? 'Menyimpan...' : 'Simpan & Cetak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Nota;