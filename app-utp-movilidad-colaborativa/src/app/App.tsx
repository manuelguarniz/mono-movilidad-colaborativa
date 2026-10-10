import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layouts/AppLayout";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { UpdateProfilePage } from "@/features/profile/pages/UpdateProfilePage";
import { PublishRidePage } from "@/features/rides/pages/PublishRidePage";
import { RideDetailPage } from "@/features/rides/pages/RideDetailPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { RegisterVehiclePage } from "@/features/vehicles/pages/RegisterVehiclePage";
import { UpdateVehiclePage } from "@/features/vehicles/pages/UpdateVehiclePage";
import { VerificationPage } from "@/features/auth/pages/VerificationPage";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { SessionExpiredRedirect } from "@/app/routes/SessionExpiredRedirect";
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
    <>
      <SessionExpiredRedirect />
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verificacion" element={<VerificationRoute />} />
        <Route path="/auth/completar-perfil" element={<CompleteProfilePage />} />
        <Route path="/auth/datos-vehiculo" element={<RegisterVehiclePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>
          <Route path="/perfil/datos" element={<UpdateProfilePage />} />
          <Route path="/perfil/vehiculo" element={<UpdateVehiclePage />} />
          <Route path="/viajes/publicar" element={<PublishRidePage />} />
          <Route path="/viajes/:rideId" element={<RideDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </>
  );
}
