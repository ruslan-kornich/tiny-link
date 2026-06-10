import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
