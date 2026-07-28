import { useState, useEffect } from 'react';
import { resi as resiAPI, nota as notaAPI } from '../services/api';

function DashboardResi({ toko }) {
  const [resis, setResis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);
  const [detail, setDetail] = useState(null);

  useEffect(() => { fetchResis(); }, [toko.id]);

  const fetchResis = async () => {
    try {
      setLoading(true);
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
    if (!window.confirm('Yakin hapus resi ini?')) return;
    try {
      await resiAPI.delete(id);
      setResis(resis.filter(r => r.id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus'); }
  };

  const handleDetail = async (resiId) => {
    try {
      const res = await notaAPI.get(resiId);
      setDetail(res.data.data);
    } catch (err) { alert('Gagal memuat detail'); }
  };

  const handleRetur = async (id) => {
    const alasan = window.prompt('Alasan retur:');
    if (!alasan) return;
    const potongan = window.prompt('Jumlah potongan (Rp):');
    if (!potongan) return;
    try {
      await resiAPI.retur(id, {
        alasan, jumlah_potongan: parseFloat(potongan),
        tanggal_retur: new Date().toISOString().split('T')[0]
      });
      fetchResis();
    } catch (err) { alert(err.response?.data?.message || 'Gagal proses retur'); }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const statusClass = (s) => {
    const map = {
      aktif: 'bg-green-50 text-green-700 ring-green-600/20',
      retur: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      dibatalkan: 'bg-red-50 text-red-700 ring-red-600/10',
    };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${map[s] || 'bg-gray-50 text-gray-700 ring-gray-500/10'}`;
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Daftar Resi</h1>
        <button onClick={fetchResis}
          className="self-start sm:self-auto text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" placeholder="Cari no resi/pesanan/nama..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="retur">Retur</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <button type="submit" className="bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors">
            Cari
          </button>
        </div>
      </form>

      {resis.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Belum ada resi untuk periode ini.</p>
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-3">
            {resis.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => handleDetail(r.id)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-400 text-xs">{r.tanggal_pesan}</p>
                    <p className="font-mono text-sm font-medium text-gray-900 mt-0.5">{r.no_resi}</p>
                  </div>
                  <span className={statusClass(r.status)}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-600">{r.penerima_nama}</p>
                {r.items && r.items.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{r.items.length} produk</p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tanggal', 'No Resi', 'Penerima', 'Produk', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resis.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{r.tanggal_pesan}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{r.no_resi}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{r.penerima_nama}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.items && r.items.length > 0
                          ? r.items.map(i => `${i.qty}x ${i.nama_produk}`).join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3"><span className={statusClass(r.status)}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-3 text-sm">
                          <button onClick={() => handleDetail(r.id)} className="text-gray-600 hover:text-gray-900">Detail</button>
                          {r.status === 'aktif' && (
                            <button onClick={() => handleRetur(r.id)} className="text-gray-600 hover:text-gray-900">Retur</button>
                          )}
                          <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Detail Resi */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Detail Resi</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">No Resi</span><br/><span className="font-mono font-medium">{detail.no_resi}</span></div>
                <div><span className="text-gray-400">No Pesanan</span><br/><span className="font-mono font-medium">{detail.no_pesanan}</span></div>
                <div><span className="text-gray-400">Tanggal</span><br/>{detail.tanggal_pesan}</div>
                <div><span className="text-gray-400">Status</span><br/><span className={statusClass(detail.status)}>{detail.status}</span></div>
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
                  <div><span className="text-gray-400">HPP Total</span><br/>Rp {fmt(detail.transaksi.hpp_total)}</div>
                  <div><span className="text-gray-400">Harga Jual</span><br/>Rp {fmt(detail.transaksi.harga_jual_total)}</div>
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