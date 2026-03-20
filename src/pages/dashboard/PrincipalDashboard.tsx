import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, updateDoc, doc, deleteDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Profile, Class } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  UserPlus, 
  Check, 
  X, 
  Shield, 
  Settings,
  Plus,
  BarChart3,
  MessageSquare,
  List,
  GraduationCap
} from 'lucide-react';
import { useAuth, handleFirestoreError, OperationType } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function PrincipalDashboard() {
  const { profile } = useAuth();
  const [pendingStaff, setPendingStaff] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.college_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Real-time staff requests
    const staffQuery = query(
      collection(db, 'profiles'),
      where('college_id', '==', profile.college_id),
      where('status', '==', 'PENDING'),
      where('role', '!=', 'STUDENT')
    );

    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[];
      setPendingStaff(staffList);
      setLoading(false);
    }, (error) => {
      console.error('Staff fetch error:', error);
      setLoading(false);
    });

    // Real-time classes
    const classesQuery = query(
      collection(db, 'classes'),
      where('college_id', '==', profile.college_id)
    );

    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Class[];
      setClasses(classList);
    }, (error) => {
      console.error('Classes fetch error:', error);
    });

    return () => {
      unsubStaff();
      unsubClasses();
    };
  }, [profile]);

  const handleApprove = async (staffId: string) => {
    try {
      await updateDoc(doc(db, 'profiles', staffId), { status: 'APPROVED' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${staffId}`);
    }
  };

  const handleReject = async (staffId: string) => {
    try {
      await deleteDoc(doc(db, 'profiles', staffId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${staffId}`);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !profile?.college_id) return;

    try {
      const classId = Math.random().toString(36).substring(2, 15);
      const newClass: Class = {
        id: classId,
        name: newClassName,
        college_id: profile.college_id,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'classes', classId), newClass);
      setNewClassName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-black" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">Principal's Command Center</h1>
        <p className="text-lg font-bold text-zinc-600">Oversee college operations and manage staff approvals.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col items-center p-4 text-center sm:p-6 bg-primary">
          <div className="mb-3 rounded-xl border-2 border-black bg-white p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shield size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-black">Staff Requests</p>
          <p className="mt-1 text-3xl font-black text-black">{pendingStaff.length}</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6 bg-emerald-400">
          <div className="mb-3 rounded-xl border-2 border-black bg-white p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <BarChart3 size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-black">Total Classes</p>
          <p className="mt-1 text-3xl font-black text-black">{classes.length}</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6 bg-sky-400">
          <div className="mb-3 rounded-xl border-2 border-black bg-white p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <MessageSquare size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-black">Active Polls</p>
          <p className="mt-1 text-3xl font-black text-black">3</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6 bg-rose-400">
          <div className="mb-3 rounded-xl border-2 border-black bg-white p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Settings size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-black">System Status</p>
          <p className="mt-1 text-3xl font-black text-black">LIVE</p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Pending Staff Approvals</h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pendingStaff.length > 0 ? (
                  pendingStaff.map((staff) => (
                    <motion.div
                      key={staff.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border-2 border-black">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-primary text-black font-black text-xl">
                            {staff.full_name[0]}
                          </div>
                          <div>
                            <p className="text-lg font-black text-zinc-900">{staff.full_name}</p>
                            <p className="text-sm font-bold text-zinc-500">{staff.role.replace('_', ' ')} • {staff.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleApprove(staff.id)}
                          >
                            <Check size={18} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleReject(staff.id)}
                          >
                            <X size={18} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-lg font-bold text-zinc-400 italic">No pending staff requests.</p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Class Management</h2>
            <Card subtitle="Create and view classes for your college">
              <div className="space-y-6">
                <form onSubmit={handleCreateClass} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="e.g. CSE-A, EEE-B"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Class
                  </Button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <List size={16} />
                    Existing Classes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classes.map(cls => (
                      <motion.div 
                        key={cls.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-xl border-2 border-black bg-zinc-50 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="rounded-lg bg-primary p-2 border border-black">
                          <GraduationCap size={20} className="text-black" />
                        </div>
                        <span className="text-lg font-black text-zinc-700">{cls.name}</span>
                      </motion.div>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-sm text-zinc-400 italic col-span-full">No classes created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          <Card title="Management Actions">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start text-lg">
                <UserPlus className="mr-3 h-5 w-5" />
                Assign Teacher Roles
              </Button>
              <Button variant="outline" className="w-full justify-start text-lg">
                <MessageSquare className="mr-3 h-5 w-5" />
                New Community Poll
              </Button>
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full border-2 border-black bg-primary" />
                <p className="text-sm font-bold text-zinc-600">HOD Physics created a new internal quiz for Class 10A.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full border-2 border-black bg-emerald-400" />
                <p className="text-sm font-bold text-zinc-600">Sports Teacher updated scores for the Annual Sports Meet.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full border-2 border-black bg-rose-400" />
                <p className="text-sm font-bold text-zinc-600">System: 2 students suspended due to behavior violations.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
