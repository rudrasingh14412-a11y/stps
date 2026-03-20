import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'PENDING') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Account Pending Approval</h1>
        <p className="mt-2 text-zinc-600">Your account is currently being reviewed by the Principal. Please check back later.</p>
      </div>
    );
  }

  if (profile?.status === 'SUSPENDED') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Account Suspended</h1>
        <p className="mt-2 text-zinc-600">Your account has been suspended due to behavior violations. Please contact the Principal.</p>
      </div>
    );
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
