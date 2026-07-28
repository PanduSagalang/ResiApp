import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, UploadCloud, Package, FileText, FileSpreadsheet, Settings, Bell, Search, Menu, X, Store, LogOut } from 'lucide-react';
import PilihToko from './pages/PilihToko';
import DashboardResi from './pages/DashboardResi';
import UploadResi from './pages/UploadResi';
import MasterProduk from './pages/MasterProduk';
import LaporanKeuangan from './pages/LaporanKeuangan';
import Nota from './pages/Nota';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/upload', label: 'Upload', icon: <UploadCloud size={18} /> },
  { path: '/produk', label: 'Produk', icon: <Package size={18} /> },
  { path: '/laporan', label: 'Laporan', icon: <FileText size={18} /> },
  { path: '/nota', label: 'Nota', icon: <FileSpreadsheet size={18} /> },
];

function App() {
  const [selectedToko, setSelectedToko] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editNama, setEditNama] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');
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

  const updateNama = async () => {
    if (!namaBaru.trim()) return;
    try {
      const { toko: tokoAPI } = await import('./services/api');
      const res = await tokoAPI.update(selectedToko.id, { nama_toko: namaBaru });
      const updated = res.data.data || { ...selectedToko, nama_toko: namaBaru };
      setSelectedToko(updated);
      localStorage.setItem('selectedToko', JSON.stringify(updated));
    } catch (e) {
      setSelectedToko({ ...selectedToko, nama_toko: namaBaru });
      localStorage.setItem('selectedToko', JSON.stringify({ ...selectedToko, nama_toko: namaBaru }));
    }
    setEditNama(false);
  };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!selectedToko) {
    return <PilihToko onSelect={handleSelectToko} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0B14] font-sans text-gray-200">
      
      {/* Top Navbar */}
      <nav className="bg-[#111322]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Mobile Menu Button & Brand */}
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/dashboard" className="text-xl font-bold tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <Package size={18} />
                </div>
                <span className="text-white">Resi<span className="text-purple-400">App</span></span>
              </Link>
            </div>

            {/* Top Right — Profile + Ganti Toko */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {selectedToko.nama_toko.substring(0,2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-tight">{selectedToko.nama_toko}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Toko</p>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1D2E] border border-white/5 rounded-xl shadow-2xl shadow-black/50 p-3 z-50 backdrop-blur-xl">
                    <div className="flex items-center gap-3 px-2 py-2 border-b border-white/5 mb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {selectedToko.nama_toko.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editNama ? (
                          <div className="flex gap-1">
                            <input type="text" value={namaBaru} onChange={e => setNamaBaru(e.target.value)}
                              className="flex-1 bg-[#111322] text-white text-sm border border-white/10 rounded-lg px-2 py-1" autoFocus
                              onKeyDown={e => e.key === 'Enter' && updateNama()} />
                            <button onClick={updateNama} className="text-xs bg-purple-600 text-white px-2 py-1 rounded-lg">OK</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-white truncate">{selectedToko.nama_toko}</p>
                            <button onClick={() => { setNamaBaru(selectedToko.nama_toko); setEditNama(true); }} className="text-[11px] text-purple-400 hover:text-purple-300">Edit nama</button>
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <LogOut size={16} />
                      Ganti Toko
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row">
        
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 shrink-0 py-8 px-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Menu Utama</p>
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-[#0A0B14]/95 backdrop-blur-xl pt-16 border-t border-white/5">
            <div className="p-4 space-y-2">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                      active ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-gray-400'
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                );
              })}
              <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full mt-6 py-3 px-4 rounded-xl bg-purple-600 text-white text-base font-medium">
                Ganti Toko
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardResi toko={selectedToko} />} />
              <Route path="/upload" element={<UploadResi toko={selectedToko} />} />
              <Route path="/produk" element={<MasterProduk toko={selectedToko} />} />
              <Route path="/laporan" element={<LaporanKeuangan toko={selectedToko} />} />
              <Route path="/nota" element={<Nota toko={selectedToko} />} />
            </Routes>
          </div>
        </main>
        
      </div>
    </div>
  );
}

export default App;