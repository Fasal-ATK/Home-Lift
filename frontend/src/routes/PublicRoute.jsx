// src/routes/PublicRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const user = useSelector(state => state.auth.user);

  if (isAuthenticated) {
    // Redirect based on role if needed
    if (user?.is_staff) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
