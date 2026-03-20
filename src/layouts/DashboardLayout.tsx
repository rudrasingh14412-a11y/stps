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
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0 font-sans">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r-4 border-black bg-white lg:block z-50">
        <div className="flex h-full flex-col">
          <div className="flex h-24 items-center px-8 border-b-4 border-black bg-primary">
            <Link to="/dashboard" className="flex items-center gap-3 text-black group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                <GraduationCap size={32} strokeWidth={3} />
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase italic">STPS</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-3 px-6 py-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-xl border-2 border-black px-4 py-3 text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none',
                    isActive
                      ? 'bg-primary text-black'
                      : 'bg-white text-zinc-600 hover:bg-primary/20 hover:text-black'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        'mr-3 h-6 w-6 transition-colors',
                        isActive ? 'text-black' : 'text-zinc-400 group-hover:text-black'
                      )}
                    />
                    {item.name}
                  </div>
                  <ChevronRight size={16} className={cn('transition-transform', isActive ? 'rotate-90' : 'group-hover:translate-x-1')} />
                </Link>
              );
            })}
          </nav>

          <div className="border-t-4 border-black p-6 bg-zinc-50">
            <div className="flex items-center gap-4 px-2 py-4 mb-4 border-2 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-primary text-black font-black text-xl italic">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-lg font-black text-zinc-900 uppercase tracking-tighter italic leading-tight">{profile?.full_name}</p>
                <p className="truncate text-xs font-bold text-zinc-500 uppercase tracking-widest">{profile?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center text-rose-600 border-2 border-black hover:bg-rose-500 hover:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b-4 border-black bg-primary px-6 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-3 text-black">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <GraduationCap size={24} strokeWidth={3} />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">STPS</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-4 border-black bg-white px-4 py-3 lg:hidden shadow-[0_-4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                  isActive ? 'bg-primary text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500'
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-8 border-r-4 border-black shadow-2xl lg:hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3 text-black">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <GraduationCap size={24} strokeWidth={3} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter uppercase italic">STPS</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:rotate-90 transition-transform">
                  <X size={28} />
                </button>
              </div>
              
              <div className="space-y-4 flex-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border-2 border-black px-5 py-4 text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                        isActive
                          ? 'bg-primary text-black'
                          : 'bg-white text-zinc-600'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-6 w-6" />
                        {item.name}
                      </div>
                      <ChevronRight size={16} />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-8 border-t-4 border-black">
                <div className="flex items-center gap-4 mb-6 p-4 border-2 border-black rounded-xl bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-primary text-black font-black text-xl italic">
                    {profile?.full_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-lg font-black text-zinc-900 uppercase tracking-tighter italic leading-tight">{profile?.full_name}</p>
                    <p className="truncate text-xs font-bold text-zinc-500 uppercase tracking-widest">{profile?.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-center text-rose-600 border-2 border-black hover:bg-rose-500 hover:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-72 min-h-screen bg-zinc-50/50">
        <div className="mx-auto max-w-7xl p-6 sm:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
