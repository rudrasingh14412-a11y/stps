import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Trophy, 
  MessageSquare, 
  LogOut, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Community', href: '/dashboard/community', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: Settings },
  ];

  if (profile?.role === 'PRINCIPAL') {
    navigation.splice(1, 0, { name: 'Staff', href: '/dashboard/staff', icon: Users });
  }

  if (['HOD', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'SPORTS_TEACHER'].includes(profile?.role || '')) {
    navigation.splice(1, 0, { name: 'Classes', href: '/dashboard/classes', icon: GraduationCap });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 lg:pb-0">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-2 text-indigo-600">
              <GraduationCap size={24} />
              <span className="text-xl font-bold tracking-tight">STPS</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-colors',
                      isActive ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-200 p-4">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-zinc-900">{profile?.full_name}</p>
                <p className="truncate text-xs text-zinc-500">{profile?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start text-zinc-500 hover:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2 text-indigo-600">
          <GraduationCap size={24} />
          <span className="text-xl font-bold tracking-tight">STPS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white px-4 py-2 lg:hidden">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-indigo-600' : 'text-zinc-500'
                )}
              >
                <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-zinc-400'} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <nav
            className="absolute inset-y-0 left-0 w-64 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <GraduationCap size={24} />
                <span className="text-xl font-bold tracking-tight">STPS</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="absolute bottom-6 left-6 right-6 border-t border-zinc-100 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                  {profile?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-zinc-900">{profile?.full_name}</p>
                  <p className="truncate text-xs text-zinc-500">{profile?.role.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-center text-red-600 border-red-100 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
