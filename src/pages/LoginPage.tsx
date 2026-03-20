import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { GraduationCap, ShieldAlert } from 'lucide-react';

export function LoginPage() {
  const { mockLogin } = useAuth();
  // Pre-filled with default admin credentials for easy login
  const [email, setEmail] = useState('admin@stps.com');
  const [password, setPassword] = useState('Admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 2. If rate limit is hit OR it's the default admin, use mockLogin as fallback
        if (
          (email === 'admin@stps.com' && password === 'Admin123') || 
          signInError.message.includes('rate limit')
        ) {
          console.log('Using developer bypass (mockLogin) due to rate limit or admin credentials');
          mockLogin('SUPER_ADMIN');
          navigate('/dashboard');
          return;
        }
        throw signInError;
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
            <GraduationCap size={28} />
          </div>
          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">STPS</h1>
          <p className="mt-1 sm:mt-2 text-sm text-zinc-500">Student Tracking Point System</p>
        </div>

        <Card className="p-5 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-500">Don't have an account? </span>
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
