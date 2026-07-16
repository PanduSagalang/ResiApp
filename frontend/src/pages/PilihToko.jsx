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
    } catch (err) {
      setError('Gagal memuat daftar toko');
      console.error(err);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Aplikasi Resi Shopee
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Toko Baru
              </label>
              <input
                type="text"
                value={namaToko}
                onChange={(e) => setNamaToko(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Toko A"
                autoFocus
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNamaToko('');
                  setError('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Pilih Toko
              </h2>
              {tokos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Belum ada toko. Buat toko baru untuk memulai.
                </p>
              ) : (
                <div className="space-y-2">
                  {tokos.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="w-full text-left px-4 py-3 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition"
                    >
                      <span className="font-medium text-gray-800">
                        {t.nama_toko}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              + Tambah Toko Baru
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PilihToko;
