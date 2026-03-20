import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">My Profile</h1>
        <p className="text-zinc-500">Manage your personal information and account settings.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={profile?.full_name}
                readOnly
              />
              <Input
                label="Email Address"
                value={profile?.email}
                readOnly
              />
              <Input
                label="Role"
                value={profile?.role.replace('_', ' ')}
                readOnly
              />
              <Input
                label="Status"
                value={profile?.status}
                readOnly
              />
            </div>
            <div className="mt-8 flex justify-end">
              <Button variant="outline">Request Information Update</Button>
            </div>
          </Card>

          <Card title="Security">
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">Change your password to keep your account secure.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="New Password" type="password" />
                <Input label="Confirm Password" type="password" />
              </div>
              <div className="flex justify-end">
                <Button>Update Password</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600">
              {profile?.full_name[0]}
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{profile?.full_name}</h2>
            <p className="text-sm text-zinc-500">{profile?.role.replace('_', ' ')}</p>
            <div className="mt-6 w-full space-y-3 border-t border-zinc-100 pt-6 text-left">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Mail size={16} className="text-zinc-400" />
                {profile?.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Shield size={16} className="text-zinc-400" />
                Account {profile?.status}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Calendar size={16} className="text-zinc-400" />
                Joined {new Date(profile?.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
