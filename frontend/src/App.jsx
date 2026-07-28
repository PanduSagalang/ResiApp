import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PilihToko from './pages/PilihToko';
import DashboardResi from './pages/DashboardResi';
import UploadResi from './pages/UploadResi';
import MasterProduk from './pages/MasterProduk';
import LaporanKeuangan from './pages/LaporanKeuangan';
import Nota from './pages/Nota';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/upload', label: 'Upload' },
  { path: '/produk', label: 'Produk' },
  { path: '/laporan', label: 'Laporan' },
  { path: '/nota', label: 'Nota' },
];

function App() {
  const [selectedToko, setSelectedToko] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('selectedToko');
    if (saved) setSelectedToko(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    setSelectedToko(null);
    localStorage.removeItem('selectedToko');
  };

  const handleSelectToko = (toko) => {
    setSelectedToko(toko);
    localStorage.setItem('selectedToko', JSON.stringify(toko));
  };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!selectedToko) {
    return <PilihToko onSelect={handleSelectToko} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="sm:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
              <Link to="/dashboard" className="text-lg font-bold text-indigo-700 tracking-tight flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ResiApp
              </Link>
              <div className="hidden sm:flex sm:gap-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block text-sm font-medium text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                {selectedToko.nama_toko}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ganti
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white shadow-inner">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 mt-3 border-t border-gray-100">
                <span className="block px-4 py-2 text-sm text-gray-500 font-medium">{selectedToko.nama_toko}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardResi toko={selectedToko} />} />
          <Route path="/upload" element={<UploadResi toko={selectedToko} />} />
          <Route path="/produk" element={<MasterProduk toko={selectedToko} />} />
          <Route path="/laporan" element={<LaporanKeuangan toko={selectedToko} />} />
          <Route path="/nota" element={<Nota toko={selectedToko} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;