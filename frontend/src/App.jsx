// App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/User/Login';
import Home from './pages/User/Home';
import Profile from './pages/User/Profile';
import About from './pages/User/About';
import Signup from './pages/User/Signup';
import AdminLogin from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import Landing from './pages/Landing';
import AdminLayout from './layouts/admin/AdminLayout';
import UserMng from './pages/Admin/UserMng';
import EmployeeMng from './pages/Admin/EmployeeMng';
import ServiceCategroies from './pages/Admin/ServiceCategroies';
import Reports from './pages/Admin/Reports';
import Coupons from './pages/Admin/Coupons';
import BookingMng from './pages/Admin/BookingMng';

function App() {
  return (
    <Routes>
      {/* Public User Routes */}
      <Route path='/' element={<Landing />} />
      <Route path='/home' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/about' element={<About />} />

      {/* Admin Login */}
      <Route path='/admin/login' element={<AdminLogin />} />

      {/* Admin Dashboard Routes */}
      <Route path='/admin' element={<AdminLayout />}>
        <Route path='dash' element={<Dashboard />} />
        <Route path='users' element={<UserMng />} />
        <Route path='employees' element={<EmployeeMng />} />
        <Route path='services' element={<ServiceCategroies />} />
        <Route path='reports' element={<Reports />} />
        <Route path='coupons' element={<Coupons />} />
        <Route path='bookings' element={<BookingMng />} />
      </Route>
    </Routes>
  );
}

export default App;
