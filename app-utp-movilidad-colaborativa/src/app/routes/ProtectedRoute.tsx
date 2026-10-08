import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "@/features/auth/services/authService";

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const isVerified = authService.isVerified();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!isVerified) {
    return <Navigate to="/auth/verificacion" replace />;
  }

  return <Outlet />;
}
