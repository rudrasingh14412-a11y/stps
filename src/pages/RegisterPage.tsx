import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { GraduationCap, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserRole, Class, College, Profile } from '../types';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { motion } from 'motion/react';

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
    try {
      const querySnapshot = await getDocs(collection(db, 'colleges'));
      const collegeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as College[];
      setColleges(collegeList);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'colleges');
    }
  }

  async function fetchClasses(cid: string) {
    try {
      const q = query(collection(db, 'classes'), where('college_id', '==', cid));
      const querySnapshot = await getDocs(q);
      const classList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Class[];
      setClasses(classList);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classes');
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profile: Profile = {
        id: user.uid,
        email,
        full_name: fullName,
        role,
        college_id: collegeId,
        class_id: role === 'STUDENT' ? classId : undefined,
        status: role === 'STUDENT' ? 'APPROVED' : 'PENDING',
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'profiles', user.uid), profile);

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
    <div className="flex min-h-screen items-center justify-center bg-white p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-black bg-primary text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <GraduationCap size={48} strokeWidth={3} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-black uppercase italic leading-none">Join STPS</h1>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">Create your account to start tracking</p>
          </div>
        </div>

        <Card className="p-8 sm:p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="font-bold"
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-bold"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-bold"
              />
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Role</label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-all"
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

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">College</label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-all"
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
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Class</label>
                  <select
                    className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-all disabled:bg-zinc-100 disabled:cursor-not-allowed"
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
                  {!collegeId && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Please select a college first</p>}
                  {collegeId && classes.length === 0 && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">No classes found for this college</p>}
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 border-black p-4 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  error.includes('successful') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}
              >
                {error.includes('successful') ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
                <p>{error}</p>
              </motion.div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-14 text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : (
                <span className="flex items-center gap-2">
                  Register <ArrowRight size={24} strokeWidth={3} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              Already have an account?{' '}
              <Link to="/login" className="text-black underline decoration-primary decoration-4 underline-offset-4 hover:bg-primary transition-colors px-1">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Join the community of high achievers
          </p>
        </div>
      </motion.div>
    </div>
  );
}
