import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Users, LayoutDashboard, DollarSign, Target, FlaskConical, Video,
  Rocket, Clock, BookOpen, BarChart3, Globe, TrendingUp, Heart,
  Shield, Link2, Languages, LogOut, Bell, Settings, ChevronDown,
  Menu, X, Building2
} from 'lucide-react';

// =============================================================================
// LAZY IMPORTS
// =============================================================================
const EmployeesPage     = React.lazy(() => import('./pages/personnel/EmployeesPage'));
const EmployeeDetailPage = React.lazy(() => import('./pages/personnel/EmployeeDetailPage'));

// =============================================================================
// AUTH STORE (simplifié - à remplacer par le vrai authStore)
// =============================================================================
interface AuthUser {
  email: string;
  fullName: string;
  role: string;
  photoUrl?: string;
  companyId?: string;
}

const useAuth = () => {
  const token = localStorage.getItem('talentis_token');
  const userStr = localStorage.getItem('talentis_user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;
  return { isAuthenticated: !!token, user };
};

// =============================================================================
// PROTECTED ROUTE
// =============================================================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

// =============================================================================
// NAV ITEMS CONFIG
// =============================================================================
const NAV_ITEMS = [
  { path: '/dashboard',       label: 'Tableau de bord',   icon: <LayoutDashboard className="w-5 h-5" />,  color: 'text-blue-600' },
  { path: '/personnel',       label: 'Personnel',         icon: <Users className="w-5 h-5" />,            color: 'text-indigo-600' },
  { path: '/payroll',         label: 'Paie',              icon: <DollarSign className="w-5 h-5" />,       color: 'text-emerald-600' },
  { path: '/recruitment',     label: 'Recrutement',       icon: <Target className="w-5 h-5" />,           color: 'text-orange-600' },
  { path: '/testing',         label: 'Tests',             icon: <FlaskConical className="w-5 h-5" />,     color: 'text-purple-600' },
  { path: '/interviews',      label: 'Entretiens',        icon: <Video className="w-5 h-5" />,            color: 'text-pink-600' },
  { path: '/onboarding',      label: 'Onboarding',        icon: <Rocket className="w-5 h-5" />,           color: 'text-cyan-600' },
  { path: '/time-attendance', label: 'Temps & Présences', icon: <Clock className="w-5 h-5" />,            color: 'text-yellow-600' },
  { path: '/training',        label: 'Formation',         icon: <BookOpen className="w-5 h-5" />,         color: 'text-teal-600' },
  { path: '/performance',     label: 'Performance',       icon: <BarChart3 className="w-5 h-5" />,        color: 'text-blue-600' },
  { path: '/mobility',        label: 'Mobilité',          icon: <Globe className="w-5 h-5" />,            color: 'text-green-600' },
  { path: '/reporting',       label: 'Reporting',         icon: <TrendingUp className="w-5 h-5" />,       color: 'text-violet-600' },
  { path: '/engagement',      label: 'Engagement',        icon: <Heart className="w-5 h-5" />,            color: 'text-rose-600' },
  { path: '/security',        label: 'Sécurité',          icon: <Shield className="w-5 h-5" />,           color: 'text-gray-600' },
  { path: '/integrations',    label: 'Intégrations',      icon: <Link2 className="w-5 h-5" />,            color: 'text-slate-600' },
];

// =============================================================================
// SIDEBAR
// =============================================================================
const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('talentis_token');
    localStorage.removeItem('talentis_user');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 shadow-xl z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">TALENTIS</p>
                <p className="text-xs text-gray-400 leading-tight">People. Performance. Progress.</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? `bg-blue-50 text-blue-700 ${item.color}`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className={isActive ? item.color : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Profil utilisateur */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName || 'Utilisateur'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role || ''}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// =============================================================================
// TOPBAR
// =============================================================================
const Topbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

// =============================================================================
// LAYOUT PRINCIPAL
// =============================================================================
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

// =============================================================================
// LOGIN PAGE
// =============================================================================
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, mfaCode: mfaCode || undefined }),
      });

      const data = await response.json();

      if (data.requiresMfa && !requiresMfa) {
        setRequiresMfa(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || 'Identifiants invalides.');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('talentis_token', data.accessToken);
      localStorage.setItem('talentis_user', JSON.stringify(data.user));
      navigate(from, { replace: true });
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TALENTIS</h1>
          <p className="text-gray-500 mt-1">People. Performance. Progress.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {requiresMfa ? 'Vérification MFA' : 'Connexion'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {!requiresMfa ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email professionnel</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@entreprise.com" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Entrez le code à 6 chiffres de votre application d'authentification.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Code MFA</label>
                  <input
                    type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456" maxLength={6} pattern="[0-9]{6}" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button type="button" onClick={() => setRequiresMfa(false)}
                  className="mt-2 text-sm text-gray-400 hover:text-gray-600">
                  ← Retour
                </button>
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : requiresMfa ? 'Vérifier' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} TALENTIS — Tous droits réservés
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// DASHBOARD PLACEHOLDER
// =============================================================================
const DashboardPage: React.FC = () => (
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
        <LayoutDashboard className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble TALENTIS</p>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Employés actifs', value: '—', color: 'bg-blue-50 text-blue-600' },
        { label: 'Recrutements en cours', value: '—', color: 'bg-orange-50 text-orange-600' },
        { label: 'Formations ce mois', value: '—', color: 'bg-teal-50 text-teal-600' },
        { label: 'Alertes', value: '—', color: 'bg-red-50 text-red-600' },
      ].map((card) => (
        <div key={card.label} className={`${card.color} rounded-xl p-4`}>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-sm mt-1 opacity-80">{card.label}</p>
        </div>
      ))}
    </div>
    <div className="mt-8 bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
      <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Le dashboard complet sera disponible à l'étape suivante</p>
    </div>
  </div>
);

// Placeholder pour les modules non encore développés
const ComingSoon: React.FC<{ module: string }> = ({ module }) => (
  <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-gray-300">
    <Building2 className="w-16 h-16 mb-4" />
    <h2 className="text-xl font-semibold text-gray-400">Module {module}</h2>
    <p className="text-sm text-gray-400 mt-2">Ce module sera développé dans une prochaine étape</p>
  </div>
);

// =============================================================================
// APP ROUTER PRINCIPAL
// =============================================================================
const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ComingSoon module="Forgot Password" />} />

      {/* App protégée */}
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />

      {/* MODULE 1 - Personnel */}
      <Route path="/personnel" element={<ProtectedRoute><AppLayout><EmployeesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/personnel/new" element={<ProtectedRoute><AppLayout><ComingSoon module="Créer Employé" /></AppLayout></ProtectedRoute>} />
      <Route path="/personnel/orgchart" element={<ProtectedRoute><AppLayout><ComingSoon module="Organigramme" /></AppLayout></ProtectedRoute>} />
      <Route path="/personnel/alerts" element={<ProtectedRoute><AppLayout><ComingSoon module="Alertes" /></AppLayout></ProtectedRoute>} />
      <Route path="/personnel/:id" element={<ProtectedRoute><AppLayout><EmployeeDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/personnel/:id/edit" element={<ProtectedRoute><AppLayout><ComingSoon module="Modifier Employé" /></AppLayout></ProtectedRoute>} />

      {/* Autres modules */}
      <Route path="/payroll/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Paie" /></AppLayout></ProtectedRoute>} />
      <Route path="/recruitment/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Recrutement" /></AppLayout></ProtectedRoute>} />
      <Route path="/testing/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Tests" /></AppLayout></ProtectedRoute>} />
      <Route path="/interviews/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Entretiens" /></AppLayout></ProtectedRoute>} />
      <Route path="/onboarding/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Onboarding" /></AppLayout></ProtectedRoute>} />
      <Route path="/time-attendance/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Temps" /></AppLayout></ProtectedRoute>} />
      <Route path="/training/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Formation" /></AppLayout></ProtectedRoute>} />
      <Route path="/performance/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Performance" /></AppLayout></ProtectedRoute>} />
      <Route path="/mobility/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Mobilité" /></AppLayout></ProtectedRoute>} />
      <Route path="/reporting/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Reporting" /></AppLayout></ProtectedRoute>} />
      <Route path="/engagement/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Engagement" /></AppLayout></ProtectedRoute>} />
      <Route path="/security/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Sécurité" /></AppLayout></ProtectedRoute>} />
      <Route path="/integrations/*" element={<ProtectedRoute><AppLayout><ComingSoon module="Intégrations" /></AppLayout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
