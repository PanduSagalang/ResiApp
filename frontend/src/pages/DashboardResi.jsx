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

  useEffect(() => {
    fetchResis();
  }, [toko.id]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResis();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus resi ini?')) return;
    try {
      await resiAPI.delete(id);
      setResis(resis.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const handleNota = async (resiId) => {
    try {
      const res = await notaAPI.get(resiId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nota-${resiId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal generate nota');
    }
  };

  const handleRetur = async (id) => {
    const alasan = window.prompt('Alasan retur:');
    if (!alasan) return;
    const potongan = window.prompt('Jumlah potongan (Rp):');
    if (!potongan) return;
    try {
      await resiAPI.retur(id, {
        alasan,
        jumlah_potongan: parseFloat(potongan),
        tanggal_retur: new Date().toISOString().split('T')[0]
      });
      fetchResis();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal proses retur');
    }
  };

  const statusClass = (s) => {
    const map = {
      aktif: 'bg-green-50 text-green-700 ring-green-600/20',
      retur: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      dibatalkan: 'bg-red-50 text-red-700 ring-red-600/10',
    };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${map[s] || 'bg-gray-50 text-gray-700 ring-gray-500/10'}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Resi</h1>
        <button
          onClick={fetchResis}
          className="self-start sm:self-auto text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Cari no resi/pesanan/nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="retur">Retur</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <input
            type="date"
            value={tglMulai}
            onChange={(e) => setTglMulai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            type="date"
            value={tglSelesai}
            onChange={(e) => setTglSelesai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button type="submit" className="bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors">
            Cari
          </button>
        </div>
      </form>

      {resis.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Belum ada resi. Upload resi terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {resis.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm">
                    <p className="text-gray-400 text-xs">{r.tanggal_pesan}</p>
                    <p className="font-mono text-sm font-medium text-gray-900 mt-0.5">{r.no_resi}</p>
                    <p className="font-mono text-xs text-gray-400 mt-0.5">{r.no_pesanan}</p>
                  </div>
                  <span className={statusClass(r.status)}>{r.status}</span>
                </div>
                {r.penerima_nama && (
                  <p className="text-sm text-gray-600 mb-3">{r.penerima_nama}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleNota(r.id)} className="text-xs px-2.5 py-1.5 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-50">Nota</button>
                  {r.status === 'aktif' && (
                    <button onClick={() => handleRetur(r.id)} className="text-xs px-2.5 py-1.5 border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-50">Retur</button>
                  )}
                  <button onClick={() => handleDelete(r.id)} className="text-xs px-2.5 py-1.5 border border-red-200 text-red-700 rounded-md hover:bg-red-50">Hapus</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tanggal', 'No Resi', 'No Pesanan', 'Penerima', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h === '' ? 'Aksi' : h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resis.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{r.tanggal_pesan}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{r.no_resi}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{r.no_pesanan}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{r.penerima_nama}</td>
                      <td className="px-4 py-3"><span className={statusClass(r.status)}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-3 text-sm">
                          <button onClick={() => handleNota(r.id)} className="text-gray-600 hover:text-gray-900">Nota</button>
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
    </div>
  );
}

export default DashboardResi;
