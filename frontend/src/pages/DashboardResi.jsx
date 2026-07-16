import { useState, useEffect } from 'react';
import { resi as resiAPI, nota as notaAPI } from '../services/api';

function DashboardResi({ toko }) {
  const [resis, setResis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

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
    if (!confirm('Yakin hapus resi ini?')) return;
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
    const alasan = prompt('Alasan retur:');
    if (!alasan) return;
    const potongan = prompt('Jumlah potongan (Rp):');
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

  const statusBadge = (s) => {
    const colors = {
      aktif: 'bg-green-100 text-green-800',
      retur: 'bg-yellow-100 text-yellow-800',
      dibatalkan: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[s] || 'bg-gray-100'}`}>
        {s}
      </span>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Resi</h2>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Cari no resi/pesanan/nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={tglSelesai}
            onChange={(e) => setTglSelesai(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Cari
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : resis.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Belum ada resi. Upload resi terlebih dahulu.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No Resi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No Pesanan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penerima</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resis.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{r.tanggal_pesan}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{r.no_resi}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{r.no_pesanan}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.penerima_nama}</td>
                  <td className="px-4 py-3 text-sm">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => handleNota(r.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Nota
                    </button>
                    {r.status === 'aktif' && (
                      <button
                        onClick={() => handleRetur(r.id)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        Retur
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardResi;
