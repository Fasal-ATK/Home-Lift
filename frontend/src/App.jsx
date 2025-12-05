// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastWrapper } from './components/common/Toast';  // ✅ import toast wrapper

// User Pages
import Login from './pages/User/Login';
import Home from './pages/User/Home';
import Profile from './pages/User/Profile';
import About from './pages/User/About';
import Signup from './pages/User/Signup';
import Notifications from './pages/User/Notifications';
import Services from './pages/User/Services';
import Bookings from './pages/User/Bookings';
import Addresses from './components/user/profile/Addresses';
import BookingDetails from './components/user/booking/BookingDetails';

// Admin Pages
import AdminLogin from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import UserManager from './pages/Admin/UserManager';
import EmpManager from './pages/Admin/EmpManager';
import ServiceCategroies from './pages/Admin/ServiceCategroies';
import Reports from './pages/Admin/Reports';
import Coupons from './pages/Admin/Coupons';
import BookingMng from './pages/Admin/BookingMng';

import Landing from './pages/Landing';

// Provider Pages
import ProviderDashboard from './pages/Provider/ProviderDashboard';
import JobRequests from './pages/Provider/JobRequests';
import Appointments from './pages/Provider/Appointments';
import Bio from './pages/Provider/Bio';
import History from './pages/Provider/History';
import Wallet from './pages/Provider/Wallet';

import ProviderJobDetail from './components/provider/jobRequests/ProviderJobDetials';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import ProviderLayout from './layouts/ProviderLayout';

// Route Guards
import PublicRoute from './routes/PublicRoute';
import PrivateRoute from './routes/PrivateRoute';

import ScrollToTop from './components/common/ScrollToTop';
import ServiceDetails from './components/user/booking/ServiceDetails';
import ServiceBooking from './components/user/booking/ServiceBooking';


function App() {
  return (
    <>
      {/* ✅ Toast container globally mounted */}
      <ToastWrapper />  
      <ScrollToTop />

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
          <Route index element={<Navigate to="home" replace />} />
          <Route path='home' element={<Home />} />
          <Route path='about' element={<About />} />
          <Route path='profile' element={<Profile />} />
          <Route path='services' element={<Services />} />
          <Route path='service-details' element={<ServiceDetails/>} />
          <Route path='booking-page' element={<ServiceBooking />} />
          <Route path="bookings">
            <Route index element={<Bookings />} />
            <Route path="details" element={<BookingDetails />} />
          </Route>
          <Route path='booking-details' element ={<BookingDetails />} />
          <Route path='notifications' element={<Notifications />} />

          <Route path='addresses' element={<Addresses />} />

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
        <Route path='provider' element={
          <PrivateRoute providerOnly={true} role="provider">
            <ProviderLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<ProviderDashboard />} />
          <Route path="job-requests">
            <Route index element={<JobRequests />} />
            <Route path="details/:id" element={<ProviderJobDetail />} />
          </Route>
          <Route path='appointments' element={<Appointments />} />
          <Route path='bio' element={<Bio />} />
          <Route path='history' element={<History />} />
          <Route path='wallet' element={<Wallet />} />

        </Route>


        {/* 404 Fallback */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;
