import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PilihToko from './pages/PilihToko';
import DashboardResi from './pages/DashboardResi';
import UploadResi from './pages/UploadResi';
import MasterProduk from './pages/MasterProduk';
import LaporanKeuangan from './pages/LaporanKeuangan';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/upload', label: 'Upload' },
  { path: '/produk', label: 'Produk' },
  { path: '/laporan', label: 'Laporan' },
];

function App() {
  const [selectedToko, setSelectedToko] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!selectedToko) {
    return <PilihToko onSelect={handleSelectToko} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="sm:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
              <Link to="/dashboard" className="text-lg font-semibold text-gray-900 tracking-tight">
                ResiApp
              </Link>
              <div className="hidden sm:flex sm:space-x-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline text-sm text-gray-500">{selectedToko.nama_toko}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
              >
                Ganti Toko
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <span className="block px-3 py-2 text-sm text-gray-400">{selectedToko.nama_toko}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
