import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { GraduationCap, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 sm:p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-black bg-primary text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <GraduationCap size={48} strokeWidth={3} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-black uppercase italic leading-none">STPS</h1>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">Student Tracking Point System</p>
          </div>
        </div>

        <Card className="p-6 sm:p-10 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-lg font-bold"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-lg font-bold"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 rounded-xl border-2 border-black bg-rose-50 p-4 text-sm font-bold text-rose-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={24} strokeWidth={3} />
                </span>
              )}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-black"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-black">
                <span className="bg-white px-4 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleLogin}
              className="w-full h-14 text-lg font-black uppercase tracking-widest border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="mr-3 h-6 w-6" alt="Google" />
              Sign in with Google
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              Don't have an account?{' '}
              <Link to="/register" className="text-black underline decoration-primary decoration-4 underline-offset-4 hover:bg-primary transition-colors px-1">
                Register here
              </Link>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Built for the next generation of learners
          </p>
        </div>
      </motion.div>
    </div>
  );
}
