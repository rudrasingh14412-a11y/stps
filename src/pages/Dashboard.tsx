import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { StudentDashboard } from './dashboard/StudentDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { PrincipalDashboard } from './dashboard/PrincipalDashboard';
import { SuperAdminDashboard } from './dashboard/SuperAdminDashboard';
import { Community } from './dashboard/Community';
import { ProfilePage } from './dashboard/ProfilePage';

export function Dashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <Routes>
        <Route
          index
          element={
            profile?.role === 'SUPER_ADMIN' ? (
              <SuperAdminDashboard />
            ) : profile?.role === 'STUDENT' ? (
              <StudentDashboard />
            ) : profile?.role === 'PRINCIPAL' ? (
              <PrincipalDashboard />
            ) : (
              <TeacherDashboard />
            )
          }
        />
        <Route path="community" element={<Community />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* Add more dashboard sub-routes here */}
      </Routes>
    </DashboardLayout>
  );
}
