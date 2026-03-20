import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
import { useAuth } from '../../contexts/AuthContext';

export function PrincipalDashboard() {
  const { profile } = useAuth();
  const [pendingStaff, setPendingStaff] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.college_id) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    setLoading(true);
    try {
      const [staffRes, classesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('college_id', profile?.college_id)
          .eq('status', 'PENDING')
          .neq('role', 'STUDENT'),
        supabase
          .from('classes')
          .select('*')
          .eq('college_id', profile?.college_id)
      ]);

      if (staffRes.data) setPendingStaff(staffRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching principal data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (staffId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'APPROVED' })
      .eq('id', staffId);

    if (error) {
      alert('Failed to approve staff');
    } else {
      setPendingStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const handleReject = async (staffId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId);

    if (error) {
      alert('Failed to reject staff');
    } else {
      setPendingStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !profile?.college_id) return;

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: newClassName,
        college_id: profile.college_id
      })
      .select()
      .single();

    if (error) {
      alert('Error creating class: ' + error.message);
    } else {
      setClasses([...classes, data]);
      setNewClassName('');
      alert('Class created successfully!');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">Principal's Dashboard</h1>
        <p className="text-zinc-500">Oversee college operations and manage staff approvals.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col items-center p-4 text-center sm:p-6">
          <div className="mb-3 rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Shield size={24} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Staff Requests</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{pendingStaff.length}</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6">
          <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <BarChart3 size={24} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Classes</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{classes.length}</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6">
          <div className="mb-3 rounded-xl bg-blue-50 p-3 text-blue-600">
            <MessageSquare size={24} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Polls</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">3</p>
        </Card>
        <Card className="flex flex-col items-center p-4 text-center sm:p-6">
          <div className="mb-3 rounded-xl bg-rose-50 p-3 text-rose-600">
            <Settings size={24} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">System Status</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">Healthy</p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">Pending Staff Approvals</h2>
            <div className="space-y-3">
              {pendingStaff.length > 0 ? (
                pendingStaff.map((staff) => (
                  <Card key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                        {staff.full_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{staff.full_name}</p>
                        <p className="text-xs text-zinc-500">{staff.role.replace('_', ' ')} • {staff.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleApprove(staff.id)}
                      >
                        <Check size={18} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(staff.id)}
                      >
                        <X size={18} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic">No pending staff requests.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">Class Management</h2>
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
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                  </Button>
                </form>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <List size={14} />
                    Existing Classes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classes.map(cls => (
                      <div key={cls.id} className="p-3 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center gap-2">
                        <GraduationCap size={16} className="text-indigo-600" />
                        <span className="text-sm font-medium text-zinc-700">{cls.name}</span>
                      </div>
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
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Teacher Roles
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Community Poll
              </Button>
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                <p className="text-xs text-zinc-600">HOD Physics created a new internal quiz for Class 10A.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                <p className="text-xs text-zinc-600">Sports Teacher updated scores for the Annual Sports Meet.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-rose-600" />
                <p className="text-xs text-zinc-600">System: 2 students suspended due to behavior violations.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
