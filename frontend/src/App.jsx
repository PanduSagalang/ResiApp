import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PilihToko from './pages/PilihToko';
import DashboardResi from './pages/DashboardResi';
import UploadResi from './pages/UploadResi';
import MasterProduk from './pages/MasterProduk';
import LaporanKeuangan from './pages/LaporanKeuangan';

function App() {
  const [selectedToko, setSelectedToko] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedToko');
    if (saved) setSelectedToko(JSON.parse(saved));
  }, []);

  const handleSelectToko = (toko) => {
    setSelectedToko(toko);
    localStorage.setItem('selectedToko', JSON.stringify(toko));
  };

  const handleLogout = () => {
    setSelectedToko(null);
    localStorage.removeItem('selectedToko');
  };

  if (!selectedToko) {
    return <PilihToko onSelect={handleSelectToko} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <a href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Dashboard
              </a>
              <a href="/upload" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Upload
              </a>
              <a href="/produk" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Produk
              </a>
              <a href="/laporan" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                Laporan
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Toko: {selectedToko.nama_toko}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Ganti Toko
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardResi toko={selectedToko} />} />
          <Route path="/upload" element={<UploadResi toko={selectedToko} />} />
          <Route path="/produk" element={<MasterProduk toko={selectedToko} />} />
          <Route path="/laporan" element={<LaporanKeuangan toko={selectedToko} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
