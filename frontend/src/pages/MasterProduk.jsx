import { useState, useEffect } from 'react';
import { produk as produkAPI } from '../services/api';

function MasterProduk({ toko }) {
  const [produks, setProduks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    nama_produk: '', variasi: '', harga_beli: '', harga_jual: '', admin_persen: '', ppn_persen: '',
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchProduks(); }, [toko.id]);

  const fetchProduks = async () => {
    try {
      setLoading(true);
      const res = await produkAPI.getAll(toko.id, search);
      setProduks(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ nama_produk: '', variasi: '', harga_beli: '', harga_jual: '', admin_persen: '', ppn_persen: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (p) => {
    setForm({
      nama_produk: p.nama_produk, variasi: p.variasi || '',
      harga_beli: p.harga_beli, harga_jual: p.harga_jual,
      admin_persen: p.admin_persen, ppn_persen: p.ppn_persen,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_produk.trim()) { setError('Nama produk wajib diisi'); return; }
    try {
      if (editId) await produkAPI.update(editId, form);
      else await produkAPI.create(toko.id, form);
      resetForm();
      fetchProduks();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus produk ini?')) return;
    try {
      await produkAPI.delete(id);
      setProduks(produks.filter(p => p.id !== id));
    } catch (err) { alert('Gagal hapus'); }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

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
        <h1 className="text-xl font-semibold text-gray-900">Master Produk</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="self-start sm:self-auto bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          + Tambah Produk
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchProduks(); }} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium">
            Cari
          </button>
        </div>
      </form>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{editId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Nama Produk *', key: 'nama_produk', type: 'text', required: true },
                { label: 'Variasi', key: 'variasi', type: 'text' },
                { label: 'Harga Beli (HPP)', key: 'harga_beli', type: 'number' },
                { label: 'Harga Jual', key: 'harga_jual', type: 'number' },
                { label: 'Admin (%)', key: 'admin_persen', type: 'number', step: '0.01' },
                { label: 'PPN (%)', key: 'ppn_persen', type: 'number', step: '0.01' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type} step={f.step}
                    value={form[f.key]}
                    onChange={(e) => setForm({...form, [f.key]: e.target.value})}
                    required={f.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              ))}
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium">
                {editId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {produks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Belum ada produk master.</p>
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-3">
            {produks.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.nama_produk}</p>
                    <p className="text-xs text-gray-400">{p.variasi || '-'}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-900 font-medium">Rp {fmt(p.harga_jual)}</p>
                    <p className="text-gray-400 text-xs">HPP: Rp {fmt(p.harga_beli)}</p>
                  </div>
                </div>
                <div className="flex text-xs text-gray-400 space-x-4 mb-3">
                  <span>Admin: {p.admin_persen}%</span>
                  <span>PPN: {p.ppn_persen}%</span>
                </div>
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(p)} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-700 rounded-md hover:bg-red-50">Hapus</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {['Nama Produk', 'Variasi', 'Harga Beli', 'Harga Jual', 'Admin %', 'PPN %', ''].map(h => (
                      <th key={h} className={`px-4 py-3 ${h === '' ? '' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h === '' ? 'Aksi' : h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produks.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nama_produk}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.variasi || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">Rp {fmt(p.harga_beli)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">Rp {fmt(p.harga_jual)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{p.admin_persen}%</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{p.ppn_persen}%</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-3">
                          <button onClick={() => handleEdit(p)} className="text-gray-600 hover:text-gray-900">Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800">Hapus</button>
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

export default MasterProduk;
