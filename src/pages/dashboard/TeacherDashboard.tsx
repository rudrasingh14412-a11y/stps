import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
import { motion } from 'motion/react';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  async function fetchClasses() {
    const { data } = await supabase.from('classes').select('*');
    if (data) {
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    }
    setLoading(false);
  }

  async function fetchStudents(classId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('class_id', classId)
      .eq('role', 'STUDENT');
    if (data) setStudents(data);
  }

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignCard = async (studentId: string, type: 'GREEN' | 'BLUE' | 'RED') => {
    const reason = prompt(`Reason for ${type} card:`);
    if (!reason) return;

    try {
      const { error } = await supabase.from('behavior_cards').insert({
        student_id: studentId,
        teacher_id: profile?.id,
        type,
        reason,
      });

      if (error) throw error;
      alert(`${type} card assigned successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign card');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Teacher Portal</h1>
          <p className="text-zinc-500">Manage your classes and evaluate student performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Students in {classes.find(c => c.id === selectedClass)?.name}</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Card key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                      {student.full_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{student.full_name}</p>
                      <p className="text-xs text-zinc-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => assignCard(student.id, 'GREEN')}
                        title="Assign Green Card (+45)"
                      >
                        <CheckCircle2 size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => assignCard(student.id, 'BLUE')}
                        title="Assign Blue Card (+20)"
                      >
                        <Star size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => assignCard(student.id, 'RED')}
                        title="Assign Red Card (-70)"
                      >
                        <AlertCircle size={18} />
                      </Button>
                    </div>
                    <div className="hidden sm:block mx-1 h-6 w-px bg-zinc-200" />
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      Details
                      <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-zinc-500 italic">No students found in this class.</p>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card title="Teacher Actions">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Class
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="mr-2 h-4 w-4" />
                Peer Evaluation
              </Button>
            </div>
          </Card>

          <Card title="Monthly Quotas" subtitle="Your remaining cards for this month">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-600">Green Cards</span>
                  <span>Unlimited</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100">
                  <div className="h-full w-full rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-blue-600">Blue Cards</span>
                  <span>3 / 5 remaining</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100">
                  <div className="h-full w-[60%] rounded-full bg-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-red-600">Red Cards</span>
                  <span>2 / 3 remaining</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100">
                  <div className="h-full w-[66%] rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
