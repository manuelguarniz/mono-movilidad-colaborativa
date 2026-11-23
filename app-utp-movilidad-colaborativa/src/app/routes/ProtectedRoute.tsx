import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "@/features/auth/services/authService";
import { NotificationsRealtime } from "@/features/notifications/components/NotificationsRealtime";

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

  // Con sesión, el stream de notificaciones (RF-13) queda abierto en todas las pantallas.
  return (
    <>
      <NotificationsRealtime />
      <Outlet />
    </>
  );
}
