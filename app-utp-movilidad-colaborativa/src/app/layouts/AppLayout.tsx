import { Outlet } from "react-router-dom";
import { BottomNav } from "@/features/dashboard/components/BottomNav";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";

export function AppLayout() {
  return (
    <div className="app-shell">
      <DashboardHeader />

      <main className="app-main">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
