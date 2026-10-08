import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layouts/AppLayout";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { VerificationPage } from "@/features/auth/pages/VerificationPage";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { authService } from "@/features/auth/services/authService";

function VerificationRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }

  if (authService.isVerified()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <VerificationPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/verificacion" element={<VerificationRoute />} />
      <Route path="/auth/completar-perfil" element={<CompleteProfilePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
