import { useState, useEffect } from 'react';
import { toko as tokoAPI } from '../services/api';

function PilihToko({ onSelect }) {
  const [tokos, setTokos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [namaToko, setNamaToko] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTokos();
  }, []);

  const fetchTokos = async () => {
    try {
      setLoading(true);
      const res = await tokoAPI.getAll();
      setTokos(res.data.data || []);
      if (res.data.total === 1) {
        onSelect(res.data.data[0]);
      }
    } catch (err) {
      setError('Gagal memuat daftar toko');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!namaToko.trim()) {
      setError('Nama toko tidak boleh kosong');
      return;
    }
    try {
      const res = await tokoAPI.create({ nama_toko: namaToko });
      setTokos([...tokos, res.data.data]);
      setNamaToko('');
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat toko');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">ResiApp</h1>
          <p className="text-sm text-gray-500 mt-1">Manajemen Resi Shopee</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Toko Baru
                </label>
                <input
                  type="text"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Contoh: Toko A"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNamaToko(''); setError(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              {tokos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Belum ada toko. Buat toko baru untuk memulai.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {tokos.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-sm"
                    >
                      <span className="font-medium text-gray-900">{t.nama_toko}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                + Tambah Toko Baru
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PilihToko;
