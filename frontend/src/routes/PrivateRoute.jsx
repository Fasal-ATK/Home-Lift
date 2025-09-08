import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const isAdmin = user?.is_staff === true;

  if (!isAuthenticated) {
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!isAdminRoute && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
