import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { GraduationCap } from 'lucide-react';
import { UserRole, Class, College } from '../types';
import { cn } from '../lib/utils';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [collegeId, setCollegeId] = useState('');
  const [classId, setClassId] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (collegeId) {
      fetchClasses(collegeId);
    } else {
      setClasses([]);
    }
  }, [collegeId]);

  async function fetchColleges() {
    const { data } = await supabase.from('colleges').select('*');
    if (data) setColleges(data);
  }

  async function fetchClasses(cid: string) {
    const { data } = await supabase.from('classes').select('*').eq('college_id', cid);
    if (data) setClasses(data);
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        college_id: collegeId,
        class_id: role === 'STUDENT' ? classId : null,
        status: role === 'STUDENT' ? 'APPROVED' : 'PENDING',
      });

      if (profileError) throw profileError;

      if (role === 'STUDENT') {
        navigate('/dashboard');
      } else {
        setError('Registration successful! Your account is pending approval by the Principal.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
            <GraduationCap size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">Join STPS</h1>
          <p className="mt-2 text-sm text-zinc-500">Create your account to start tracking</p>
        </div>

        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Role</label>
              <select
                className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="STUDENT">Student</option>
                <option value="HOD">HOD</option>
                <option value="CLASS_TEACHER">Class Teacher</option>
                <option value="SUBJECT_TEACHER">Subject Teacher</option>
                <option value="SPORTS_TEACHER">Sports Teacher</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">College</label>
              <select
                className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                required
              >
                <option value="">Select a college</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {role === 'STUDENT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Class</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  disabled={!collegeId}
                >
                  <option value="">Select a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!collegeId && <p className="text-[10px] text-zinc-400">Please select a college first</p>}
                {collegeId && classes.length === 0 && <p className="text-[10px] text-amber-500">No classes found for this college</p>}
              </div>
            )}

            {error && (
              <p className={cn(
                "text-xs",
                error.includes('successful') ? "text-emerald-600" : "text-red-500"
              )}>
                {error}
              </p>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-500">Already have an account? </span>
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
