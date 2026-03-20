import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Shield, Calendar, Edit3, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'sonner';

export function ProfilePage() {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to change your password for security reasons.');
      } else {
        toast.error('Failed to update password: ' + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">My Profile</h1>
        <p className="text-lg font-bold text-zinc-600">Manage your personal information and account settings.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Personal Information" className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={profile?.full_name}
                readOnly
                className="font-bold"
              />
              <Input
                label="Email Address"
                value={profile?.email}
                readOnly
                className="font-bold"
              />
              <Input
                label="Role"
                value={profile?.role.replace('_', ' ')}
                readOnly
                className="font-bold uppercase tracking-widest"
              />
              <Input
                label="Status"
                value={profile?.status}
                readOnly
                className="font-bold uppercase tracking-widest"
              />
            </div>
            <div className="mt-8 flex justify-end">
              <Button variant="outline" className="flex items-center gap-2">
                <Edit3 size={18} />
                Request Information Update
              </Button>
            </div>
          </Card>

          <Card title="Security" className="border-2 border-black bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-6">
              <p className="text-sm font-bold text-black/60">Change your password to keep your account secure.</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <Input 
                  label="New Password" 
                  type="password" 
                  className="bg-white" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input 
                  label="Confirm Password" 
                  type="password" 
                  className="bg-white" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  className="bg-black text-white hover:bg-zinc-800 flex items-center gap-2"
                  onClick={handleUpdatePassword}
                  disabled={updating}
                >
                  {updating ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Key size={18} />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col items-center text-center p-8 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-black bg-primary text-5xl font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] italic">
              {profile?.full_name[0]}
            </div>
            <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter">{profile?.full_name}</h2>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mt-1">{profile?.role.replace('_', ' ')}</p>
            
            <div className="mt-8 w-full space-y-4 border-t-4 border-black pt-8 text-left">
              <div className="flex items-center gap-4 text-sm font-bold text-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-primary/20">
                  <Mail size={16} className="text-black" />
                </div>
                {profile?.email}
              </div>
              <div className="flex items-center gap-4 text-sm font-bold text-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-emerald-400/20">
                  <Shield size={16} className="text-emerald-600" />
                </div>
                Account {profile?.status}
              </div>
              <div className="flex items-center gap-4 text-sm font-bold text-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-sky-400/20">
                  <Calendar size={16} className="text-sky-600" />
                </div>
                Joined {new Date(profile?.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
