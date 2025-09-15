// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastWrapper } from './components/common/Toast';  // ✅ import toast wrapper

// Pages
import Login from './pages/User/Login';
import Home from './pages/User/Home';
import Profile from './pages/User/Profile';
import About from './pages/User/About';
import Signup from './pages/User/Signup';
import Notifications from './pages/User/Notifications';

import AdminLogin from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import UserManager from './pages/Admin/UserManager';
import EmpManager from './pages/Admin/EmpManager';
import ServiceCategroies from './pages/Admin/ServiceCategroies';
import Reports from './pages/Admin/Reports';
import Coupons from './pages/Admin/Coupons';
import BookingMng from './pages/Admin/BookingMng';

import ProviderDashboard from './pages/Provider/ProviderDashboard';
import Landing from './pages/Landing';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import ProviderLayout from './layouts/ProviderLayout';

// Route Guards
import PublicRoute from './routes/PublicRoute';
import PrivateRoute from './routes/PrivateRoute';

function App() {
  return (
    <>
      {/* ✅ Toast container globally mounted */}
      <ToastWrapper />  

      <Routes>
        {/* Public Pages */}
        <Route path='/' element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } />

        <Route path='/login' element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
          
        <Route path='/signup' element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />

        <Route path='/admin/login' element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        } />

        {/* User Routes */}
        <Route element={
          <PrivateRoute role="user">
            <UserLayout />
          </PrivateRoute>
        }>
          <Route path='home' element={<Home />} />
          <Route index element={<Navigate to="home" replace />} />
          <Route path='about' element={<About />} />
          <Route path='profile' element={<Profile />} />
          <Route path='notifications' element={<Notifications />} />
        </Route>

        {/* Admin Routes */}
        <Route path='/admin' element={
          <PrivateRoute role="admin">
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='users' element={<UserManager />} />
          <Route path='employees' element={<EmpManager />} />
          <Route path='services' element={<ServiceCategroies />} />
          <Route path='reports' element={<Reports />} />
          <Route path='coupons' element={<Coupons />} />
          <Route path='bookings' element={<BookingMng />} />
        </Route>

        {/* Provider Routes */}
        <Route path='/provider' element={<ProviderLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<ProviderDashboard />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;
