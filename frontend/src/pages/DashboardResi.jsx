import { useState, useEffect } from 'react';
import { resi as resiAPI, nota as notaAPI } from '../services/api';

function DashboardResi({ toko }) {
  const [resis, setResis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const start7 = new Date(); start7.setDate(start7.getDate() - 7);
  const [tglMulai, setTglMulai] = useState(start7.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => { fetchResis(); }, [toko.id]);

  const fetchResis = async () => {
    try { setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (tglMulai) params.tgl_mulai = tglMulai;
      if (tglSelesai) params.tgl_selesai = tglSelesai;
      const res = await resiAPI.getAll(toko.id, params);
      setResis(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchResis(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus?')) return;
    try { await resiAPI.delete(id); fetchResis(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Hapus ${selected.length} resi?`)) return;
    try { await resiAPI.bulkDelete(selected); setSelected([]); fetchResis(); }
    catch (err) { alert('Gagal hapus massal'); }
  };

  const handleDetail = async (resiId) => {
    try { const res = await notaAPI.get(resiId); setDetail(res.data.data); }
    catch (err) { alert('Gagal muat detail'); }
  };

  const handleRetur = async (id) => {
    const alasan = window.prompt('Alasan retur:'); if (!alasan) return;
    const potongan = window.prompt('Potongan (Rp):'); if (!potongan) return;
    try { await resiAPI.retur(id, { alasan, jumlah_potongan: parseFloat(potongan), tanggal_retur: new Date().toISOString().split('T')[0] }); fetchResis(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === resis.length ? [] : resis.map(r => r.id));

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const sc = (s) => {
    const m = { aktif: 'bg-green-50 text-green-700 ring-green-600/20', retur: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', dibatalkan: 'bg-red-50 text-red-700 ring-red-600/10' };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${m[s] || 'bg-gray-50 text-gray-700 ring-gray-500/10'}`;
  };

  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Daftar Resi</h1>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium shadow-sm transition-all">Hapus {selected.length}</button>}
          <button onClick={fetchResis} className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-sm font-medium transition-all shadow-sm">Refresh</button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" placeholder="Cari no resi/pesanan/nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option><option value="retur">Retur</option><option value="dibatalkan">Dibatalkan</option>
          </select>
          <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 text-sm font-medium shadow-sm transition-all">Cari</button>
        </div>
      </form>

      {resis.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center"><p className="text-sm text-gray-500">Belum ada resi.</p></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="min-w-[700px] sm:min-w-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                            <th className="px-3 py-3 w-10"><input type="checkbox" checked={selected.length === resis.length && resis.length > 0} onChange={toggleAll} className="rounded focus:ring-indigo-500" /></th>
                            {['Tanggal', 'No Resi', 'Penerima', 'Produk', 'Status', 'Aksi'].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {resis.map((r) => (
                            <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="rounded focus:ring-indigo-500" /></td>
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{r.tanggal_pesan}</td>
                              <td className="px-3 py-3 text-sm font-mono text-gray-800">{r.no_resi}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate">{r.penerima_nama}</td>
                              <td className="px-3 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                                {r.items && r.items.length > 0 ? r.items.map(i => `${i.qty}x ${i.nama_produk}`).join(', ') : '-'}
                              </td>
                              <td className="px-3 py-3"><span className={sc(r.status)}>{r.status}</span></td>
                              <td className="px-3 py-3">
                                <div className="flex gap-3 text-sm">
                                  <button onClick={() => handleDetail(r.id)} className="text-indigo-600 hover:text-indigo-800 font-medium">Detail</button>
                                  {r.status === 'aktif' && <button onClick={() => handleRetur(r.id)} className="text-amber-600 hover:text-amber-800 font-medium">Retur</button>}
                                  <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Detail Resi</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">No Resi</span><br/><span className="font-mono font-medium">{detail.no_resi}</span></div>
                <div><span className="text-gray-400">No Pesanan</span><br/><span className="font-mono font-medium">{detail.no_pesanan}</span></div>
                <div><span className="text-gray-400">Tanggal</span><br/>{detail.tanggal_pesan}</div>
                <div><span className="text-gray-400">Status</span><br/><span className={sc(detail.status)}>{detail.status}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Penerima</span><br/>{detail.penerima_nama}</div>
                <div className="col-span-2"><span className="text-gray-400">Alamat</span><br/><span className="text-xs">{detail.penerima_alamat}</span></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rincian Produk</h3>
                <table className="w-full text-sm border border-gray-200 rounded-md">
                  <thead><tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Produk</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Variasi</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">H.Beli</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">H.Jual</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{item.nama_produk}</td>
                        <td className="px-3 py-2 text-gray-500">{item.variasi || '-'}</td>
                        <td className="px-3 py-2 text-right">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.produk_master ? fmt(item.produk_master.harga_beli) : '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.produk_master ? fmt(item.produk_master.harga_jual) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detail.transaksi && (
                <div className="bg-gray-50 rounded-md p-3 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">HPP</span><br/>Rp {fmt(detail.transaksi.hpp_total)}</div>
                  <div><span className="text-gray-400">Jual</span><br/>Rp {fmt(detail.transaksi.harga_jual_total)}</div>
                  <div><span className="text-gray-400">Admin</span><br/>Rp {fmt(detail.transaksi.admin_fee)}</div>
                  <div><span className="text-gray-400">PPN</span><br/>Rp {fmt(detail.transaksi.ppn)}</div>
                  <div><span className="text-gray-400">Kotor</span><br/>Rp {fmt(detail.transaksi.penghasilan_kotor)}</div>
                  <div><span className="text-gray-400">Bersih</span><br/><span className="font-semibold text-green-700">Rp {fmt(detail.transaksi.penghasilan_bersih)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DashboardResi;