import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './lib/auth';
import type { Role } from './lib/types';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Conventions from './pages/Conventions';
import Internships from './pages/Internships';
import OffersBrowse from './pages/student/OffersBrowse';
import OfferDetail from './pages/student/OfferDetail';
import Recommended from './pages/student/Recommended';
import MyApplications from './pages/student/MyApplications';
import CompanyOffers from './pages/company/CompanyOffers';
import OfferForm from './pages/company/OfferForm';
import Candidates from './pages/company/Candidates';
import SchoolStudents from './pages/school/SchoolStudents';

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={`/${user.role}`} replace /> : <Landing />;
}

export default function App() {
  const shared = (role: Role) => (
    <>
      <Route index element={<Dashboard />} />
      <Route path="profile" element={<Profile />} />
      <Route path="conventions" element={<Conventions />} />
      <Route path="internships" element={<Internships />} />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/student" element={<Guard role="student"><Layout /></Guard>}>
        {shared('student')}
        <Route path="offers" element={<OffersBrowse />} />
        <Route path="offers/:id" element={<OfferDetail />} />
        <Route path="recommended" element={<Recommended />} />
        <Route path="applications" element={<MyApplications />} />
      </Route>

      <Route path="/company" element={<Guard role="company"><Layout /></Guard>}>
        {shared('company')}
        <Route path="offers" element={<CompanyOffers />} />
        <Route path="offers/new" element={<OfferForm />} />
        <Route path="offers/:id/edit" element={<OfferForm />} />
        <Route path="offers/:id/candidates" element={<Candidates />} />
      </Route>

      <Route path="/school" element={<Guard role="school"><Layout /></Guard>}>
        {shared('school')}
        <Route path="students" element={<SchoolStudents />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
