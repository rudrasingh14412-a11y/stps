import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, setDoc, doc, onSnapshot, deleteDoc, query, where } from 'firebase/firestore';
import { College, Profile, Class } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, UserPlus, Plus, List, ShieldCheck, ArrowRight, Trash2, GraduationCap, Users } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

export function SuperAdminDashboard() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingCollege, setCreatingCollege] = useState(false);
  const [creatingPrincipal, setCreatingPrincipal] = useState(false);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [allPrincipals, setAllPrincipals] = useState<Profile[]>([]);
  const [viewingCollege, setViewingCollege] = useState<College | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const collegesRef = collection(db, 'colleges');
    const unsubscribe = onSnapshot(collegesRef, (snapshot) => {
      const collegeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as College[];
      setColleges(collegeList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'colleges');
      setLoading(false);
    });

    // Fetch all classes
    const classesRef = collection(db, 'classes');
    const unsubClasses = onSnapshot(classesRef, (snapshot) => {
      setAllClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[]);
    });

    // Fetch all students
    const studentsQuery = query(collection(db, 'profiles'), where('role', '==', 'STUDENT'));
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      setAllStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profile[]);
    });

    // Fetch all principals
    const principalsQuery = query(collection(db, 'profiles'), where('role', '==', 'PRINCIPAL'));
    const unsubPrincipals = onSnapshot(principalsQuery, (snapshot) => {
      setAllPrincipals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profile[]);
    });

    return () => {
      unsubscribe();
      unsubClasses();
      unsubStudents();
      unsubPrincipals();
    };
  }, []);

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    try {
      await deleteDoc(doc(db, 'colleges', collegeId));
      toast.success(`College "${collegeName}" deleted successfully!`);
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'colleges');
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || creatingCollege) return;

    setCreatingCollege(true);
    try {
      const collegeId = Math.random().toString(36).substring(2, 15);
      const newCollege = {
        id: collegeId,
        name: newCollegeName,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'colleges', collegeId), newCollege);
      setNewCollegeName('');
      toast.success(`College "${newCollegeName}" created successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'colleges');
    } finally {
      setCreatingCollege(false);
    }
  };

  const handleCreatePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId || !principalEmail || !principalPassword || creatingPrincipal) return;

    setCreatingPrincipal(true);
    let secondaryApp;
    try {
      // Create a secondary Firebase app for user creation to avoid signing out the current admin
      const secondaryAppName = `secondary-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Auth User via Secondary App
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, principalEmail, principalPassword);
      const uid = userCredential.user.uid;

      // 2. Create Firestore Profile
      const newProfile: Profile = {
        id: uid,
        email: principalEmail,
        full_name: principalName,
        role: 'PRINCIPAL',
        college_id: selectedCollegeId,
        status: 'APPROVED',
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', uid), newProfile);
      
      // 3. Sign out of secondary app and cleanup
      await signOut(secondaryAuth);
      
      setPrincipalEmail('');
      setPrincipalName('');
      setPrincipalPassword('');
      setSelectedCollegeId('');
      toast.success(`Principal account for ${principalName} created successfully! They can now log in.`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use by another account.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('The password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password login is not enabled in your Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        toast.error(err.message || 'Failed to create principal');
      }
      console.error(err);
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.error('Error deleting secondary app:', e);
        }
      }
      setCreatingPrincipal(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-black" />
    </div>
  );

  if (viewingCollege) {
    const collegeClasses = allClasses.filter(c => c.college_id === viewingCollege.id);
    const collegeStudents = allStudents.filter(s => s.college_id === viewingCollege.id);
    const collegePrincipal = allPrincipals.find(p => p.college_id === viewingCollege.id);

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <header className="border-b-4 border-black pb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-black" />
              <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">{viewingCollege.name}</h1>
            </div>
            <p className="text-lg font-bold text-zinc-600">Detailed overview of institution performance and members.</p>
          </div>
          <Button variant="outline" onClick={() => setViewingCollege(null)}>
            Back to Dashboard
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary p-6 text-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs font-black uppercase tracking-widest">Principal</p>
            <p className="text-xl font-black truncate">{collegePrincipal?.full_name || 'Not Assigned'}</p>
          </Card>
          <Card className="bg-emerald-400 p-6 text-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <GraduationCap className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs font-black uppercase tracking-widest">Total Classes</p>
            <p className="text-3xl font-black">{collegeClasses.length}</p>
          </Card>
          <Card className="bg-sky-400 p-6 text-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Users className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs font-black uppercase tracking-widest">Total Students</p>
            <p className="text-3xl font-black">{collegeStudents.length}</p>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
              <List size={24} />
              Classes in this College
            </h2>
            <div className="grid gap-4">
              {collegeClasses.map(cls => (
                <Card key={cls.id} className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-black uppercase italic">{cls.name}</p>
                    <span className="rounded-lg border-2 border-black bg-primary/20 px-3 py-1 text-xs font-black uppercase">
                      {collegeStudents.filter(s => s.class_id === cls.id).length} Students
                    </span>
                  </div>
                </Card>
              ))}
              {collegeClasses.length === 0 && (
                <p className="text-sm font-bold text-zinc-400 italic">No classes found for this college.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
              <Users size={24} />
              Students in this College
            </h2>
            <div className="grid gap-4">
              {collegeStudents.map(student => {
                const cls = collegeClasses.find(c => c.id === student.class_id);
                return (
                  <Card key={student.id} className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full border-2 border-black bg-primary flex items-center justify-center font-black italic">
                        {student.full_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black uppercase italic truncate">{student.full_name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Class: {cls?.name || 'No Class Assigned'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {collegeStudents.length === 0 && (
                <p className="text-sm font-bold text-zinc-400 italic">No students found for this college.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="border-b-4 border-black pb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-8 w-8 text-black" />
          <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">Super Admin</h1>
        </div>
        <p className="text-lg font-bold text-zinc-600">Manage colleges and initialize principal accounts.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create College */}
        <Card title="Create New College" subtitle="Add a new institution to the platform" className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleCreateCollege} className="space-y-6">
            <Input
              label="College Name"
              placeholder="e.g. Government Polytechnic College"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              required
              className="text-lg font-bold"
            />
            <Button type="submit" className="w-full text-lg" disabled={creatingCollege}>
              {creatingCollege ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Plus className="mr-3 h-5 w-5" />
                  Create College
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Create Principal */}
        <Card title="Initialize Principal" subtitle="Create the first administrative account" className="border-2 border-black bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleCreatePrincipal} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-black">Select College</label>
              <select
                className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                required
              >
                <option value="">Choose a college...</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Principal Name"
                placeholder="Dr. Smith"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                required
              />
              <Input
                label="Principal Email"
                type="email"
                placeholder="principal@college.edu"
                value={principalEmail}
                onChange={(e) => setPrincipalEmail(e.target.value)}
                required
              />
            </div>
            <Input
              label="Initial Password"
              type="password"
              placeholder="••••••••"
              value={principalPassword}
              onChange={(e) => setPrincipalPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full text-lg bg-black text-white hover:bg-zinc-800" variant="secondary" disabled={creatingPrincipal}>
              {creatingPrincipal ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <UserPlus className="mr-3 h-5 w-5" />
                  Create Principal Account
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* College List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-3">
            <List size={32} className="text-black" />
            Registered Colleges
          </h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {colleges.map((college, i) => (
                <motion.div
                  key={college.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setViewingCollege(college)}
                >
                  <Card className="p-5 flex items-center gap-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary transition-colors cursor-pointer group relative">
                    <div className="h-12 w-12 shrink-0 rounded-xl border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-colors">
                      <Building2 size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-zinc-900 truncate uppercase tracking-tighter italic">{college.name}</p>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">ID: {college.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {confirmDelete === college.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollege(college.id, college.name);
                            }}
                            className="p-2 rounded-lg border-2 border-black bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="p-2 rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(college.id);
                          }}
                          className="p-2 rounded-lg border-2 border-black bg-rose-100 hover:bg-rose-500 hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          title="Delete College"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {colleges.length === 0 && (
              <p className="text-lg font-bold text-zinc-400 italic col-span-full">No colleges registered yet.</p>
            )}
          </div>
        {/* Global Visibility Sections */}
        <div className="lg:col-span-2 grid gap-8 md:grid-cols-2">
          {/* All Classes */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-3">
              <GraduationCap size={32} className="text-black" />
              All Classes
            </h2>
            <div className="space-y-4">
              {allClasses.map(cls => {
                const college = colleges.find(c => c.id === cls.college_id);
                return (
                  <Card key={cls.id} className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-black uppercase italic">{cls.name}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">College: {college?.name || 'Unknown'}</p>
                      </div>
                      <span className="rounded-lg border-2 border-black bg-primary/20 px-2 py-1 text-[10px] font-black uppercase">
                        {allStudents.filter(s => s.class_id === cls.id).length} Students
                      </span>
                    </div>
                  </Card>
                );
              })}
              {allClasses.length === 0 && (
                <p className="text-sm font-bold text-zinc-400 italic">No classes created yet.</p>
              )}
            </div>
          </div>

          {/* All Students */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-3">
              <Users size={32} className="text-black" />
              All Students
            </h2>
            <div className="space-y-4">
              {allStudents.map(student => {
                const college = colleges.find(c => c.id === student.college_id);
                const cls = allClasses.find(c => c.id === student.class_id);
                return (
                  <Card key={student.id} className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full border-2 border-black bg-primary flex items-center justify-center font-black italic">
                        {student.full_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black uppercase italic truncate">{student.full_name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                          {college?.name} • {cls?.name || 'No Class'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {allStudents.length === 0 && (
                <p className="text-sm font-bold text-zinc-400 italic">No students registered yet.</p>
              )}
            </div>
          </div>

          {/* Principals Overview */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-3">
              <ShieldCheck size={32} className="text-black" />
              Principals Overview
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allPrincipals.map(principal => {
                const college = colleges.find(c => c.id === principal.college_id);
                const principalClasses = allClasses.filter(c => c.college_id === principal.college_id);
                return (
                  <Card key={principal.id} className="p-5 border-2 border-black bg-zinc-900 text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full border-2 border-white bg-primary flex items-center justify-center text-black font-black italic">
                        {principal.full_name[0]}
                      </div>
                      <div>
                        <p className="text-lg font-black uppercase italic tracking-tight">{principal.full_name}</p>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{college?.name || 'No College'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border border-white/20 bg-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Classes</p>
                        <p className="text-2xl font-black text-primary">{principalClasses.length}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-white/20 bg-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Students</p>
                        <p className="text-2xl font-black text-primary">
                          {allStudents.filter(s => s.college_id === principal.college_id).length}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {allPrincipals.length === 0 && (
                <p className="text-sm font-bold text-zinc-400 italic">No principals registered yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);
}
