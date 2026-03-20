import React, { useEffect, useState } from 'react';
import { useAuth, handleFirestoreError, OperationType } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, onSnapshot, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Profile, Class, BehaviorCard } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Search,
  Plus,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.college_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const classesQuery = query(collection(db, 'classes'), where('college_id', '==', profile.college_id));
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
      setClasses(classList);
      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0].id);
      }
      setLoading(false);
    }, (error) => {
      console.error('Classes fetch error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  async function fetchStudents(classId: string) {
    try {
      const studentsQuery = query(
        collection(db, 'profiles'),
        where('class_id', '==', classId),
        where('role', '==', 'STUDENT')
      );
      const snapshot = await getDocs(studentsQuery);
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profile[]);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignCard = async (studentId: string, type: 'GREEN' | 'BLUE' | 'RED') => {
    const reason = prompt(`Reason for ${type} card:`);
    if (!reason) return;

    try {
      const cardId = Math.random().toString(36).substring(2, 15);
      const newCard: BehaviorCard = {
        id: cardId,
        student_id: studentId,
        teacher_id: profile?.id || '',
        type,
        reason,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'behavior_cards', cardId), newCard);

      // Update student score
      const scoreRef = doc(db, 'scores', studentId);
      const scoreSnap = await getDoc(scoreRef);
      
      const points = type === 'GREEN' ? 45 : type === 'BLUE' ? 20 : -70;
      
      if (scoreSnap.exists()) {
        await updateDoc(scoreRef, {
          behavior: increment(points),
          total: increment(points),
          updated_at: new Date().toISOString()
        });
      } else {
        await setDoc(scoreRef, {
          id: studentId,
          student_id: studentId,
          semester: 1,
          academics: 0,
          attendance: 0,
          behavior: points,
          internal: 0,
          sports: 0,
          total: points,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'behavior_cards');
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
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b-4 border-black pb-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">Teacher Portal</h1>
          <p className="text-lg font-bold text-zinc-600">Manage your classes and evaluate student performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-widest focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Student List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">
              Students in {classes.find(c => c.id === selectedClass)?.name}
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-4 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-primary text-black font-black text-xl">
                          {student.full_name[0]}
                        </div>
                        <div>
                          <p className="text-lg font-black text-zinc-900">{student.full_name}</p>
                          <p className="text-sm font-bold text-zinc-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-400 hover:bg-emerald-500"
                            onClick={() => assignCard(student.id, 'GREEN')}
                            title="Assign Green Card (+45)"
                          >
                            <CheckCircle2 size={20} />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-sky-400 hover:bg-sky-500"
                            onClick={() => assignCard(student.id, 'BLUE')}
                            title="Assign Blue Card (+20)"
                          >
                            <Star size={20} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => assignCard(student.id, 'RED')}
                            title="Assign Red Card (-70)"
                          >
                            <AlertCircle size={20} />
                          </Button>
                        </div>
                        <div className="hidden sm:block mx-2 h-8 w-1 bg-black" />
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          Details
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <p className="text-lg font-bold text-zinc-400 italic">No students found in this class.</p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card title="Teacher Actions" className="border-2 border-black bg-white">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start text-lg">
                <Plus className="mr-3 h-5 w-5" />
                Schedule New Class
              </Button>
              <Button variant="outline" className="w-full justify-start text-lg">
                <Users className="mr-3 h-5 w-5" />
                Mark Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start text-lg">
                <Star className="mr-3 h-5 w-5" />
                Peer Evaluation
              </Button>
            </div>
          </Card>

          <Card title="Monthly Quotas" subtitle="Your remaining cards for this month" className="border-2 border-black bg-primary">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                  <span className="text-black">Green Cards</span>
                  <span>Unlimited</span>
                </div>
                <div className="h-4 w-full rounded-full border-2 border-black bg-white overflow-hidden">
                  <div className="h-full w-full bg-emerald-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                  <span className="text-black">Blue Cards</span>
                  <span>3 / 5 remaining</span>
                </div>
                <div className="h-4 w-full rounded-full border-2 border-black bg-white overflow-hidden">
                  <div className="h-full w-[60%] bg-sky-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                  <span className="text-black">Red Cards</span>
                  <span>2 / 3 remaining</span>
                </div>
                <div className="h-4 w-full rounded-full border-2 border-black bg-white overflow-hidden">
                  <div className="h-full w-[66%] bg-rose-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
