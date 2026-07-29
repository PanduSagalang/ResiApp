import { useState, useEffect, useRef } from 'react';
import { resi as resiAPI, nota as notaAPI } from '../services/api';
import api from '../services/api';
import { MoreHorizontal } from 'lucide-react';

function DashboardResi({ toko }) {
  const [resis, setResis] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);
  const [filterLabel, setFilterLabel] = useState('Hari Ini');
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const btnRefs = useRef({});
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => { fetchResis(); }, [toko.id]);

  const fetchResis = async () => {
    try { setLoading(true);
      const res = await resiAPI.getAll(toko.id, { search, status, tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setResis(res.data.data || []);
      const sum = await api.get(`/resi/summary/${toko.id}`, { params: { tgl_mulai: tglMulai, tgl_selesai: tglSelesai }});
      setSummary(sum.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchResis(); };
  const handleDelete = async (id) => { if (!window.confirm('Yakin hapus?')) return; try { await resiAPI.delete(id); fetchResis(); } catch (err) { alert(err.response?.data?.message || 'Gagal'); } };
  const handleBulkDelete = async () => { if (selected.length === 0) return; if (!window.confirm(`Hapus ${selected.length} resi?`)) return; try { await resiAPI.bulkDelete(selected); setSelected([]); fetchResis(); } catch (err) { alert('Gagal hapus massal'); } };
  const handleDetail = async (resiId) => { try { const res = await notaAPI.get(resiId); setDetail(res.data.data); } catch (err) { alert('Gagal muat detail'); } };
  const handleRetur = async (id) => { const alasan = window.prompt('Alasan retur:'); if (!alasan) return; const potongan = window.prompt('Potongan (Rp):'); if (!potongan) return; try { await resiAPI.retur(id, { alasan, jumlah_potongan: parseFloat(potongan), tanggal_retur: today }); fetchResis(); } catch (err) { alert(err.response?.data?.message || 'Gagal'); } };
  const handleCancel = async (id) => { if (!window.confirm('Yakin batalkan resi ini?')) return; try { await resiAPI.cancel(id); fetchResis(); } catch (err) { alert(err.response?.data?.message || 'Gagal'); } };

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === resis.length ? [] : resis.map(r => r.id));

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const sc = (s) => { const m = { aktif: 'bg-emerald-500/15 text-emerald-400', retur: 'bg-amber-500/15 text-amber-400', dibatalkan: 'bg-rose-500/15 text-rose-400' }; return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${m[s] || 'bg-white/5 text-gray-300'}`; };

  const setRange = (label, mulai, selesai) => { setFilterLabel(label); setTglMulai(mulai); setTglSelesai(selesai); };
  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', today, today) },
    { label: '7 Hari', fn: () => { const s7 = new Date(); s7.setDate(s7.getDate() - 7); setRange('7 Hari', s7.toISOString().split('T')[0], today); } },
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setRange('Bulan Ini', `${y}-${m}-01`, today); } },
  ];

  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-md shadow-black/20';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-100">Daftar Resi</h1>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium shadow-md shadow-black/20 transition-all">Hapus {selected.length}</button>}
          <button onClick={fetchResis} className="px-3 py-2 bg-[#111322] text-gray-300 border border-white/10 rounded-lg hover:bg-[#1A1D2E] text-sm font-medium transition-all shadow-md shadow-black/20">Refresh</button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-[#111322]/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-6 shadow-md shadow-black/20">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] text-gray-500 mb-1">Cari</label>
            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="w-36">
            <label className="block text-[10px] text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
              <option value="">Semua</option>
              <option value="aktif">Aktif</option><option value="retur">Retur</option><option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
          <div className="flex items-end gap-1">
            <div><label className="block text-[10px] text-gray-500 mb-1">Dari</label>
              <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)} className="bg-[#1A1D2E] text-white px-2 py-2 border border-white/10 rounded-lg text-sm w-32 [color-scheme:dark]" />
            </div>
            <span className="text-gray-400 text-[10px] pb-2.5">s/d</span>
            <div><label className="block text-[10px] text-gray-500 mb-1">Ke</label>
              <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)} className="bg-[#1A1D2E] text-white px-2 py-2 border border-white/10 rounded-lg text-sm w-32 [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex gap-1 pb-0.5">
            {presets.map(p => (
              <button key={p.label} type="button" onClick={p.fn} className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${filterLabel === p.label ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-purple-500/10 hover:text-purple-400'}`}>{p.label}</button>
            ))}
          </div>
          <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium shadow-md transition-all">Cari</button>
        </div>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Pesanan', value: summary?.total_pesanan, prefix: '' },
          { label: 'Total Penjualan', value: summary?.total_jual, prefix: 'Rp ' },
          { label: 'Penghasilan Kotor', value: summary?.total_kotor, prefix: 'Rp ' },
          { label: 'Penghasilan Bersih', value: summary?.total_bersih, prefix: 'Rp ' },
        ].map(card => (
          <div key={card.label} className="bg-[#111322] border border-white/5 rounded-xl p-4 shadow-md shadow-black/20">
            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
            <p className="text-lg font-bold text-gray-100 mt-1">{card.prefix}{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {resis.length === 0 ? (
        <div className="bg-[#111322] border border-white/5 rounded-lg p-12 text-center"><p className="text-sm text-gray-400">Belum ada resi.</p></div>
      ) : (
        <div className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden shadow-md shadow-black/20">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                    <th className="px-3 py-3 w-10"><input type="checkbox" checked={selected.length === resis.length && resis.length > 0} onChange={toggleAll} className="rounded accent-purple-500" /></th>
                    {['Tanggal', 'No Resi', 'Penerima', 'Produk', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resis.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="rounded accent-purple-500" /></td>
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{r.tanggal_pesan}</td>
                      <td className="px-3 py-3 font-mono text-gray-100">{r.no_resi}</td>
                      <td className="px-3 py-3 text-gray-400 max-w-[200px] truncate">{r.penerima_nama}</td>
                      <td className="px-3 py-3 text-xs text-gray-400 max-w-[200px] truncate">{r.items && r.items.length > 0 ? r.items.map(i => `${i.qty}x ${i.nama_produk}`).join(', ') : '-'}</td>
                      <td className="px-3 py-3"><span className={sc(r.status)}>{r.status}</span></td>
                      <td className="px-3 py-3">
                        <div className="relative">
                          <button ref={el => { if (el) btnRefs.current[r.id] = el; }} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === r.id ? null : r.id);
                            if (btnRefs.current[r.id]) { const rect = btnRefs.current[r.id].getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: document.documentElement.clientWidth - rect.right }); }
                          }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><MoreHorizontal size={18} /></button>
                          {openMenu === r.id && (
                            <><div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)}></div>
                              <div className="fixed z-50 w-36 bg-[#1A1D2E] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 overflow-hidden"
                                   style={{ top: menuPos.top + 'px', right: menuPos.right + 'px' }}>
                                <button onClick={() => { handleDetail(r.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Detail</button>
                                {r.status === 'aktif' && <button onClick={() => { handleRetur(r.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-white/5">Tandai Retur</button>}
                                {r.status === 'aktif' && <button onClick={() => { handleCancel(r.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5">Batalkan</button>}
                                <div className="h-px bg-white/5 my-1.5"></div>
                                <button onClick={() => { handleDelete(r.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10">Hapus</button>
                              </div>
                            </>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDetail(null)}>
          <div className="bg-[#111322] border border-white/5 rounded-2xl shadow-2xl shadow-black/50 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/5 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Detail Resi</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">No Resi</span><br/><span className="font-mono font-medium text-gray-100">{detail.no_resi}</span></div>
                <div><span className="text-gray-400">No Pesanan</span><br/><span className="font-mono font-medium text-gray-100">{detail.no_pesanan}</span></div>
                <div><span className="text-gray-400">Tanggal</span><br/><span className="text-gray-200">{detail.tanggal_pesan}</span></div>
                <div><span className="text-gray-400">Status</span><br/><span className={sc(detail.status)}>{detail.status}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Penerima</span><br/><span className="text-gray-200">{detail.penerima_nama}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Alamat</span><br/><span className="text-xs text-gray-300">{detail.penerima_alamat}</span></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-200 mb-2">Rincian Produk</h3>
                <table className="w-full text-sm border border-white/5 rounded-md">
                  <thead><tr className="bg-white/5">
                    <th className="px-3 py-2 text-left text-xs text-gray-400">Produk</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400">Variasi</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-400">Qty</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-400">H.Beli</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-400">H.Jual</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {detail.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-200">{item.nama_produk}</td>
                        <td className="px-3 py-2 text-gray-400">{item.variasi || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-200">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-400">{item.produk_master ? fmt(item.produk_master.harga_beli) : '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-400">{item.produk_master ? fmt(item.produk_master.harga_jual) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detail.transaksi && (
                <div className="bg-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">HPP</span><br/><span className="text-gray-100">Rp {fmt(detail.transaksi.hpp_total)}</span></div>
                  <div><span className="text-gray-400">Jual</span><br/><span className="text-gray-100">Rp {fmt(detail.transaksi.harga_jual_total)}</span></div>
                  <div><span className="text-gray-400">Admin</span><br/><span className="text-gray-100">Rp {fmt(detail.transaksi.admin_fee)}</span></div>
                  <div><span className="text-gray-400">PPN</span><br/><span className="text-gray-100">Rp {fmt(detail.transaksi.ppn)}</span></div>
                  <div><span className="text-gray-400">Kotor</span><br/><span className="text-gray-100">Rp {fmt(detail.transaksi.penghasilan_kotor)}</span></div>
                  <div><span className="text-gray-400">Bersih</span><br/><span className="font-semibold text-emerald-400">Rp {fmt(detail.transaksi.penghasilan_bersih)}</span></div>
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