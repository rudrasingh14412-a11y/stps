import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { College, Profile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, UserPlus, ShieldCheck, Plus, List } from 'lucide-react';

export function SuperAdminDashboard() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColleges();
  }, []);

  async function fetchColleges() {
    const { data } = await supabase.from('colleges').select('*');
    if (data) setColleges(data);
    setLoading(false);
  }

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName) return;

    const { data, error } = await supabase
      .from('colleges')
      .insert({ name: newCollegeName })
      .select()
      .single();

    if (error) {
      alert('Error creating college: ' + error.message);
    } else {
      setColleges([...colleges, data]);
      setNewCollegeName('');
      alert('College created successfully!');
    }
  };

  const handleCreatePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId || !principalEmail || !principalPassword) return;

    try {
      // In a real app, we'd use a service role or a specific edge function to create users
      // For this demo, we use the standard signUp which might auto-login the user
      // but we'll assume the Super Admin can manage this.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: principalEmail,
        password: principalPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create principal auth');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: principalEmail,
        full_name: principalName,
        role: 'PRINCIPAL',
        college_id: selectedCollegeId,
        status: 'APPROVED',
      });

      if (profileError) throw profileError;

      alert('Principal account created successfully!');
      setPrincipalEmail('');
      setPrincipalName('');
      setPrincipalPassword('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">Super Admin Control Panel</h1>
        <p className="text-zinc-500">Manage colleges and initialize principal accounts.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create College */}
        <Card title="Create New College" subtitle="Add a new institution to the platform">
          <form onSubmit={handleCreateCollege} className="space-y-4">
            <Input
              label="College Name"
              placeholder="e.g. Government Polytechnic College"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create College
            </Button>
          </form>
        </Card>

        {/* Create Principal */}
        <Card title="Initialize Principal" subtitle="Create the first administrative account for a college">
          <form onSubmit={handleCreatePrincipal} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Select College</label>
              <select
                className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Button type="submit" className="w-full" variant="secondary">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Principal Account
            </Button>
          </form>
        </Card>

        {/* College List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <List size={20} className="text-indigo-600" />
            Registered Colleges
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map(college => (
              <Card key={college.id} className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{college.name}</p>
                  <p className="text-xs text-zinc-500">ID: {college.id.slice(0, 8)}...</p>
                </div>
              </Card>
            ))}
            {colleges.length === 0 && (
              <p className="text-sm text-zinc-500 italic col-span-full">No colleges registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
