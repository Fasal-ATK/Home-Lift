import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, providerOnly = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProviderRoute = providerOnly; // flag for provider-only route

  const isAdmin = user?.is_staff === true;
  const isProvider = user?.is_provider === true;

  if (!isAuthenticated) {
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  // Admin route check
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Provider route check
  if (isProviderRoute) {
    if (!isProvider || user?.is_provider_active === false) {
      return <Navigate to="/home" replace />;
    }
  }

  // Redirect admin away from non-admin pages
  if (!isAdminRoute && isAdmin && !isProviderRoute) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
