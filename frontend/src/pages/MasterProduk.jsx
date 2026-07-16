import { useState, useEffect } from 'react';
import { produk as produkAPI } from '../services/api';

function MasterProduk({ toko }) {
  const [produks, setProduks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    nama_produk: '',
    variasi: '',
    harga_beli: '',
    harga_jual: '',
    admin_persen: '',
    ppn_persen: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduks();
  }, [toko.id]);

  const fetchProduks = async () => {
    try {
      setLoading(true);
      const res = await produkAPI.getAll(toko.id, search);
      setProduks(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ nama_produk: '', variasi: '', harga_beli: '', harga_jual: '', admin_persen: '', ppn_persen: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (p) => {
    setForm({
      nama_produk: p.nama_produk,
      variasi: p.variasi || '',
      harga_beli: p.harga_beli,
      harga_jual: p.harga_jual,
      admin_persen: p.admin_persen,
      ppn_persen: p.ppn_persen,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_produk.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }
    try {
      if (editId) {
        await produkAPI.update(editId, form);
      } else {
        await produkAPI.create(toko.id, form);
      }
      resetForm();
      fetchProduks();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus produk ini?')) return;
    try {
      await produkAPI.delete(id);
      setProduks(produks.filter(p => p.id !== id));
    } catch (err) {
      alert('Gagal hapus');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Master Produk</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchProduks(); }} className="flex space-x-2">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Cari
          </button>
        </form>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">{editId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input type="text" value={form.nama_produk}
                  onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variasi</label>
                <input type="text" value={form.variasi}
                  onChange={(e) => setForm({ ...form, variasi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli (HPP)</label>
                <input type="number" value={form.harga_beli}
                  onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                <input type="number" value={form.harga_jual}
                  onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin (%)</label>
                <input type="number" step="0.01" value={form.admin_persen}
                  onChange={(e) => setForm({ ...form, admin_persen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PPN (%)</label>
                <input type="number" step="0.01" value={form.ppn_persen}
                  onChange={(e) => setForm({ ...form, ppn_persen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {editId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Produk */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : produks.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Belum ada produk master.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variasi</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Admin %</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PPN %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produks.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{p.nama_produk}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.variasi || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">Rp {fmt(p.harga_beli)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">Rp {fmt(p.harga_jual)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{p.admin_persen}%</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{p.ppn_persen}%</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800">Hapus</button>
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

export default MasterProduk;
